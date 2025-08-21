# api/schedule_new.py - New timezone-aware scheduling system
from fastapi import APIRouter, Request, Depends, HTTPException
from firebase_admin import db, auth as firebase_admin_auth
import time
import ssl
import paho.mqtt.client as mqtt
from datetime import datetime
import uuid
import pytz
import logging
import atexit
from .auth import verify_firebase_token

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.date import DateTrigger
    from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False
    print("APScheduler not available, falling back to simple scheduling")

router = APIRouter(prefix="/api/schedule")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MQTT Configuration
MQTT_BROKER = "70030b8b8dc741c79d6ab7ffa586f461.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USERNAME = "phamngocthai"
MQTT_PASSWORD = "Thai2005"
# Set MOCK_MQTT from environment variable (default: False)
MOCK_MQTT = os.getenv("MOCK_MQTT", "False").lower() in ("true", "1", "yes")

# APScheduler instance
scheduler = None
scheduler_started = False

if APSCHEDULER_AVAILABLE:
    scheduler = BackgroundScheduler()

def start_scheduler():
    """Start the APScheduler if available"""
    global scheduler_started
    if APSCHEDULER_AVAILABLE and scheduler and not scheduler_started:
        scheduler.start()
        scheduler_started = True
        logger.info("APScheduler started successfully")
        
        def job_listener(event):
            if event.exception:
                logger.error(f"Job {event.job_id} crashed: {event.exception}")
            else:
                logger.info(f"Job {event.job_id} executed successfully")
        
        scheduler.add_listener(job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)

def stop_scheduler():
    """Stop the scheduler"""
    global scheduler_started
    if APSCHEDULER_AVAILABLE and scheduler and scheduler_started:
        scheduler.shutdown()
        scheduler_started = False
        logger.info("APScheduler stopped")

atexit.register(stop_scheduler)

def create_mqtt_client():
    """Create and configure MQTT client"""
    client = mqtt.Client(protocol=mqtt.MQTTv311)
    
    # Configure TLS
    context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_REQUIRED
    client.tls_set_context(context)
    
    # Set credentials
    if MQTT_USERNAME and MQTT_PASSWORD:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    
    return client

def send_mqtt_notification_sync(device_id: str, uid: str, schedule_id: str):
    """Send MQTT notification with topic format: device_id (old version format)"""
    
    if MOCK_MQTT:
        logger.info(f"[MOCK MQTT] Would send to {device_id}: Health check reminder")
        update_schedule_status(schedule_id, "sent", "Mock MQTT notification sent")
        return True
    
    try:
        client = create_mqtt_client()
        success = False
        error_message = None
        
        def on_connect(client, userdata, flags, rc):
            nonlocal success, error_message
            if rc == 0:
                # Use device_id only (old version format)
                topic = device_id
                message = "Health check reminder"
                
                result = client.publish(topic, message, qos=2)  # QoS 2 for guaranteed delivery
                if result.rc == mqtt.MQTT_ERR_SUCCESS:
                    success = True
                    logger.info(f"MQTT published to {topic} with QoS 2")
                else:
                    error_message = f"Publish failed: {result.rc}"
            else:
                error_message = f"Connection failed: {rc}"
        
        def on_publish(client, userdata, mid):
            logger.info(f"MQTT message confirmed, mid: {mid}")
        
        client.on_connect = on_connect
        client.on_publish = on_publish
        
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        
        # Wait for connection and publish
        timeout = 10
        elapsed = 0
        while elapsed < timeout and not success and not error_message:
            time.sleep(0.5)
            elapsed += 0.5
        
        client.loop_stop()
        client.disconnect()
        
        if success:
            update_schedule_status(schedule_id, "sent", "MQTT notification sent successfully")
            return True
        else:
            update_schedule_status(schedule_id, "failed", error_message or "Timeout")
            return False
            
    except Exception as e:
        error_msg = f"MQTT error: {str(e)}"
        logger.error(error_msg)
        update_schedule_status(schedule_id, "failed", error_msg)
        return False

def update_schedule_status(schedule_id: str, status: str, message: str = ""):
    """Update schedule status in Firebase"""
    try:
        schedule_ref = db.reference(f"/schedules/{schedule_id}")
        update_data = {
            "status": status,
            "status_message": message,
            "status_updated_at": int(time.time() * 1000)
        }
        
        # Add sent_at timestamp when status is sent
        if status == "sent":
            update_data["sent_at"] = int(time.time() * 1000)
        
        schedule_ref.update(update_data)
        logger.info(f"Schedule {schedule_id} status updated to: {status} - {message}")
    except Exception as e:
        logger.error(f"Failed to update schedule status: {str(e)}")

def get_user_timezone(uid: str) -> str:
    """Get user's timezone from profile"""
    try:
        profile_ref = db.reference(f"/user_profiles/{uid}")
        profile_data = profile_ref.get()
        
        if profile_data and profile_data.get("timezone"):
            return profile_data["timezone"]
        
        return "UTC"  # Default to UTC
        
    except Exception as e:
        logger.error(f"Error getting user timezone: {str(e)}")
        return "UTC"

@router.post("/create")
async def create_schedule(request: Request):
    """Create a new timezone-aware schedule"""
    try:
        data = await request.json()
        
        # Get Firebase user token
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing authorization header")
        
        token = authorization.split("Bearer ")[1]
        decoded_token = firebase_admin_auth.verify_id_token(token)
        uid = decoded_token['uid']
        
        # Validate required fields
        device_id = data.get('device_id')
        schedule_time = data.get('schedule_time')  # {minute, hour, day, month, year}
        
        if not device_id or not schedule_time:
            raise HTTPException(status_code=400, detail="Missing device_id or schedule_time")
        
        # Validate schedule_time structure
        required_fields = ['minute', 'hour', 'day', 'month', 'year']
        for field in required_fields:
            if field not in schedule_time:
                raise HTTPException(status_code=400, detail=f"Missing {field} in schedule_time")
        
        # Check device access
        device_ref = db.reference(f"/devices/{device_id}")
        device_data = device_ref.get()
        
        if not device_data:
            raise HTTPException(status_code=404, detail="Device not found")
        
        device_users_ref = db.reference(f"/device_users/{device_id}")
        device_users = device_users_ref.get()
        
        if not device_users or uid not in device_users:
            raise HTTPException(status_code=403, detail="You don't have access to this device")
        
        # Get user's timezone
        user_timezone = get_user_timezone(uid)
        logger.info(f"User {uid} timezone: {user_timezone}")
        
        # Create datetime in user's timezone
        try:
            user_tz = pytz.timezone(user_timezone)
            schedule_datetime = user_tz.localize(datetime(
                year=schedule_time['year'],
                month=schedule_time['month'],
                day=schedule_time['day'],
                hour=schedule_time['hour'],
                minute=schedule_time['minute']
            ))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid schedule time: {str(e)}")
        
        # Convert to UTC for storage and scheduling
        schedule_utc = schedule_datetime.astimezone(pytz.UTC)
        current_utc = datetime.now(pytz.UTC)
        
        # Validate that schedule is in the future
        if schedule_utc <= current_utc:
            raise HTTPException(status_code=400, detail="Schedule time must be in the future")
        
        # Create schedule record
        schedule_id = str(uuid.uuid4())
        current_time = int(time.time() * 1000)
        
        schedule_data = {
            "uid": uid,
            "device_id": device_id,
            "time_create": current_time,
            "schedule_time_user": {
                "minute": schedule_time['minute'],
                "hour": schedule_time['hour'],
                "day": schedule_time['day'],
                "month": schedule_time['month'],
                "year": schedule_time['year'],
                "timezone": user_timezone
            },
            "schedule_time_utc": int(schedule_utc.timestamp() * 1000),
            "status": "scheduled",
            "status_message": "Scheduled for delivery",
            "topic": device_id
        }
        
        # Save to Firebase
        schedule_ref = db.reference(f"/schedules/{schedule_id}")
        schedule_ref.set(schedule_data)
        
        # Schedule the MQTT job
        if APSCHEDULER_AVAILABLE:
            start_scheduler()
            
            job_id = f"schedule_{schedule_id}"
            scheduler.add_job(
                func=send_mqtt_notification_sync,
                trigger=DateTrigger(run_date=schedule_utc),
                args=[device_id, uid, schedule_id],
                id=job_id,
                name=f"MQTT notification for {device_id}",
                misfire_grace_time=60
            )
            
            logger.info(f"Scheduled MQTT job {job_id} for {schedule_utc}")
        else:
            logger.warning("APScheduler not available, schedule created but will not be executed")
        
        return {
            "status": "ok",
            "message": "Schedule created successfully",
            "schedule_id": schedule_id,
            "schedule_time_utc": int(schedule_utc.timestamp() * 1000),
            "schedule_time_user": schedule_datetime.isoformat(),
            "topic": device_id,
            "will_execute_at": schedule_utc.isoformat(),
            "apscheduler_available": APSCHEDULER_AVAILABLE
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating schedule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/user")
async def get_user_schedules(user=Depends(verify_firebase_token), limit: int = 100):
    """Get all schedules for the current user"""
    user_id = user.get("uid")
    
    try:
        schedules_ref = db.reference("/schedules")
        all_schedules = schedules_ref.get()
        
        if not all_schedules:
            return {"schedules": []}
        
        schedules_list = []
        for schedule_id, schedule_data in all_schedules.items():
            if schedule_data.get("uid") == user_id:
                schedule_item = {
                    "id": schedule_id,
                    **schedule_data
                }
                schedules_list.append(schedule_item)
        
        schedules_list.sort(key=lambda x: x.get("time_create", 0), reverse=True)
        schedules_list = schedules_list[:limit]
        
        return {"schedules": schedules_list}
        
    except Exception as e:
        logger.error(f"Error getting user schedules: {str(e)}")
        raise HTTPException(500, "Internal server error")

@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: str, user=Depends(verify_firebase_token)):
    """Delete a schedule and cancel the scheduled job"""
    user_id = user.get("uid")
    
    try:
        schedule_ref = db.reference(f"/schedules/{schedule_id}")
        schedule_data = schedule_ref.get()
        
        if not schedule_data:
            raise HTTPException(404, "Schedule not found")
        
        if schedule_data.get("uid") != user_id:
            raise HTTPException(403, "You don't have permission to delete this schedule")
        
        # Cancel the scheduled job if APScheduler is available
        if APSCHEDULER_AVAILABLE and scheduler:
            job_id = f"schedule_{schedule_id}"
            try:
                scheduler.remove_job(job_id)
                logger.info(f"Cancelled scheduled job: {job_id}")
            except Exception as e:
                logger.warning(f"Could not cancel job {job_id}: {str(e)}")
        
        # Delete the schedule from database
        schedule_ref.delete()
        
        return {
            "status": "ok",
            "message": "Schedule deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting schedule: {str(e)}")
        raise HTTPException(500, f"Failed to delete schedule: {str(e)}")

@router.get("/status")
async def get_scheduler_status():
    """Get scheduler status and active jobs"""
    try:
        active_jobs = []
        if APSCHEDULER_AVAILABLE and scheduler and scheduler_started:
            for job in scheduler.get_jobs():
                active_jobs.append({
                    "id": job.id,
                    "name": job.name,
                    "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                    "func": str(job.func)
                })
        
        return {
            "apscheduler_available": APSCHEDULER_AVAILABLE,
            "scheduler_running": scheduler_started,
            "active_jobs": len(active_jobs),
            "jobs": active_jobs,
            "mqtt_config": {
                "broker": MQTT_BROKER,
                "port": MQTT_PORT,
                "mock_mode": MOCK_MQTT
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting scheduler status: {str(e)}")
        raise HTTPException(500, f"Failed to get status: {str(e)}")

@router.post("/test/{device_id}")
async def test_mqtt_notification(device_id: str, user=Depends(verify_firebase_token)):
    """Test MQTT notification immediately"""
    try:
        uid = user.get("uid")
        
        # Check device access
        device_users_ref = db.reference(f"/device_users/{device_id}")
        device_users = device_users_ref.get()
        
        if not device_users or uid not in device_users:
            raise HTTPException(403, "You don't have access to this device")
        
        # Send test notification
        success = send_mqtt_notification_sync(device_id, uid, "test")
        
        return {
            "status": "ok" if success else "failed",
            "message": f"Test notification {'sent' if success else 'failed'}",
            "topic": device_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test notification: {str(e)}")
        raise HTTPException(500, f"Failed to send test: {str(e)}")

# Initialize scheduler on module load
if APSCHEDULER_AVAILABLE:
    start_scheduler()
