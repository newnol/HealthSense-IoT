# api/schedule.py
from fastapi import APIRouter, Request, Depends, HTTPException, BackgroundTasks
from firebase_admin import db
import time
import json
import ssl
import paho.mqtt.client as mqtt
from datetime import datetime, timezone
import threading
import asyncio
from .auth import verify_firebase_token
from typing import Optional
import logging

router = APIRouter(prefix="/api/schedule")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MQTT Configuration for HiveMQ
MQTT_BROKER = "70030b8b8dc741c79d6ab7ffa586f461.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
# Note: For production, these should be set as environment variables
# For now, we'll implement a mock system that logs the notifications
MQTT_USERNAME = "phamngocthai"  # HiveMQ username
MQTT_PASSWORD = "Thai2005"      # HiveMQ password
MOCK_MQTT = False  # Set to False now that we have valid HiveMQ credentials

# Global scheduler state
scheduler_running = False
scheduler_thread = None

def create_mqtt_client():
    """Create and configure MQTT client for HiveMQ"""
    client = mqtt.Client(protocol=mqtt.MQTTv311)
    
    # Configure TLS
    context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_REQUIRED
    client.tls_set_context(context)
    
    # Set credentials if available
    if MQTT_USERNAME and MQTT_PASSWORD:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    
    return client

def send_mqtt_notification(device_id: str, message: str):
    """Send notification to device via MQTT or mock system"""
    
    # If MOCK_MQTT is enabled, just log the notification
    if MOCK_MQTT:
        logger.info(f"[MOCK MQTT] Would send to device {device_id}: {message}")
        
        # Store the notification in Firebase for testing/verification
        notifications_ref = db.reference("/mqtt_notifications")
        notification_data = {
            "device_id": device_id,
            "message": message,
            "timestamp": int(time.time() * 1000),
            "topic": f"healthsense/{device_id}/notification",
            "type": "scheduled_notification",
            "action": "health_check_reminder",
            "mock": True
        }
        notifications_ref.push(notification_data)
        
        return True
    
    # Real MQTT implementation
    try:
        client = create_mqtt_client()
        success = False
        
        def on_connect(client, userdata, flags, rc):
            nonlocal success
            if rc == 0:
                logger.info(f"Connected to MQTT broker for device {device_id}")
                # Publish message to device-specific topic
                topic = f"healthsense/{device_id}/notification"
                payload = {
                    "timestamp": int(time.time() * 1000),
                    "message": message,
                    "type": "scheduled_notification",
                    "action": "health_check_reminder"
                }
                client.publish(topic, json.dumps(payload), qos=1)
                logger.info(f"Notification sent to {topic}: {message}")
                success = True
                client.disconnect()
            else:
                logger.error(f"Failed to connect to MQTT broker: {rc}")
                success = False
        
        def on_publish(client, userdata, mid):
            logger.info(f"Message published successfully for device {device_id}")
        
        def on_disconnect(client, userdata, rc):
            logger.info(f"Disconnected from MQTT broker for device {device_id}")
        
        client.on_connect = on_connect
        client.on_publish = on_publish
        client.on_disconnect = on_disconnect
        
        # Connect to broker
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        
        # Wait a moment for the message to be sent
        time.sleep(3)
        client.loop_stop()
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending MQTT notification: {str(e)}")
        return False

def calculate_notification_time(scheduled_time: dict, user_timezone: str = "UTC") -> datetime:
    """Calculate the exact notification time considering user timezone"""
    # For now, we'll use UTC. In the future, you can implement timezone conversion
    # based on user_timezone parameter
    
    year = scheduled_time.get("year")
    month = scheduled_time.get("month")
    day = scheduled_time.get("day")
    hour = scheduled_time.get("hour")
    minute = scheduled_time.get("minute")
    
    notification_datetime = datetime(year, month, day, hour, minute, tzinfo=timezone.utc)
    return notification_datetime

def background_scheduler():
    """Background task that checks for pending schedules and sends notifications"""
    global scheduler_running
    
    logger.info("Background scheduler started")
    
    while scheduler_running:
        try:
            # Check for pending schedules every 30 seconds
            now = datetime.now(timezone.utc)
            
            # Query all pending schedules
            schedules_ref = db.reference("/schedules")
            all_schedules = schedules_ref.order_by_child("status").equal_to("pending").get()
            
            if all_schedules:
                for schedule_id, schedule_data in all_schedules.items():
                    try:
                        # Parse notification time
                        scheduled_time = schedule_data.get("scheduled_time")
                        if not scheduled_time:
                            continue
                        
                        notification_time = calculate_notification_time(scheduled_time)
                        
                        # Check if it's time to send the notification (within 1 minute window)
                        time_diff = (notification_time - now).total_seconds()
                        
                        if -30 <= time_diff <= 30:  # 30 second window
                            device_id = schedule_data.get("device_id")
                            
                            # Send MQTT notification
                            message = f"Health Check Reminder: Time for your scheduled health monitoring on device {device_id}"
                            success = send_mqtt_notification(device_id, message)
                            
                            # Update schedule status
                            schedule_ref = db.reference(f"/schedules/{schedule_id}")
                            update_data = {
                                "sent_at": int(time.time() * 1000),
                                "status": "sent" if success else "failed"
                            }
                            
                            if not success:
                                update_data["error"] = "Failed to send MQTT notification"
                            
                            schedule_ref.update(update_data)
                            
                            logger.info(f"Processed schedule {schedule_id} for device {device_id}: {'Success' if success else 'Failed'}")
                    
                    except Exception as e:
                        logger.error(f"Error processing schedule {schedule_id}: {str(e)}")
                        # Mark as failed
                        schedule_ref = db.reference(f"/schedules/{schedule_id}")
                        schedule_ref.update({
                            "status": "failed",
                            "error": str(e),
                            "failed_at": int(time.time() * 1000)
                        })
            
            # Sleep for 30 seconds before next check
            time.sleep(30)
            
        except Exception as e:
            logger.error(f"Error in background scheduler: {str(e)}")
            time.sleep(60)  # Wait longer on error
    
    logger.info("Background scheduler stopped")

def start_background_scheduler():
    """Start the background scheduler if not already running"""
    global scheduler_running, scheduler_thread
    
    if not scheduler_running:
        scheduler_running = True
        scheduler_thread = threading.Thread(target=background_scheduler, daemon=True)
        scheduler_thread.start()
        logger.info("Background scheduler started successfully")

def stop_background_scheduler():
    """Stop the background scheduler"""
    global scheduler_running
    scheduler_running = False
    logger.info("Background scheduler stop requested")

# Start scheduler when module loads
start_background_scheduler()

@router.post("/create")
async def create_schedule(req: Request, user=Depends(verify_firebase_token)):
    """Create a new schedule for a device"""
    data = await req.json()
    device_id = data.get("device_id")
    scheduled_time = data.get("scheduled_time")
    
    if not device_id or not scheduled_time:
        raise HTTPException(400, "Missing device_id or scheduled_time")
    
    # Validate scheduled_time structure
    required_fields = ["minute", "hour", "day", "month", "year"]
    for field in required_fields:
        if field not in scheduled_time:
            raise HTTPException(400, f"Missing {field} in scheduled_time")
    
    user_id = user.get("uid")
    
    # Verify user has access to this device
    device_ref = db.reference(f"/devices/{device_id}")
    device_info = device_ref.get()
    
    if not device_info:
        raise HTTPException(404, "Device not found")
    
    # Check if user has access to this device
    user_access = db.reference(f"/device_users/{device_id}/{user_id}").get()
    legacy_user = device_info.get("user_id")
    
    if not user_access and legacy_user != user_id:
        raise HTTPException(403, "You don't have permission to schedule notifications for this device")
    
    # Validate that the scheduled time is in the future
    try:
        notification_time = calculate_notification_time(scheduled_time)
        now = datetime.now(timezone.utc)
        
        if notification_time <= now:
            raise HTTPException(400, "Scheduled time must be in the future")
    except ValueError as e:
        raise HTTPException(400, f"Invalid date/time: {str(e)}")
    
    # Create schedule record
    schedules_ref = db.reference("/schedules")
    schedule_data = {
        "user_id": user_id,
        "device_id": device_id,
        "scheduled_time": scheduled_time,
        "created_at": int(time.time() * 1000),
        "status": "pending",
        "notification_time_utc": notification_time.isoformat()
    }
    
    new_schedule_ref = schedules_ref.push(schedule_data)
    schedule_id = new_schedule_ref.key
    
    # Ensure background scheduler is running
    start_background_scheduler()
    
    return {
        "status": "ok",
        "message": "Schedule created successfully",
        "schedule_id": schedule_id,
        "notification_time": notification_time.isoformat()
    }

@router.get("/user")
async def get_user_schedules(user=Depends(verify_firebase_token), limit: int = 100):
    """Get all schedules for the current user"""
    user_id = user.get("uid")
    
    # Query schedules for this user
    schedules_ref = db.reference("/schedules")
    all_schedules = schedules_ref.order_by_child("user_id").equal_to(user_id).get()
    
    if not all_schedules:
        return {"schedules": []}
    
    # Convert to list format and sort by creation time
    schedules_list = []
    for schedule_id, schedule_data in all_schedules.items():
        schedule_item = {
            "id": schedule_id,
            **schedule_data
        }
        schedules_list.append(schedule_item)
    
    # Sort by created_at descending (newest first)
    schedules_list.sort(key=lambda x: x.get("created_at", 0), reverse=True)
    
    # Limit results
    return {"schedules": schedules_list[:limit]}

@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: str, user=Depends(verify_firebase_token)):
    """Delete a schedule"""
    user_id = user.get("uid")
    
    # Get schedule info
    schedule_ref = db.reference(f"/schedules/{schedule_id}")
    schedule_data = schedule_ref.get()
    
    if not schedule_data:
        raise HTTPException(404, "Schedule not found")
    
    # Verify ownership
    if schedule_data.get("user_id") != user_id:
        raise HTTPException(403, "You don't have permission to delete this schedule")
    
    # Check if schedule is still pending
    if schedule_data.get("status") == "sent":
        raise HTTPException(400, "Cannot delete a schedule that has already been sent")
    
    # Delete the schedule
    schedule_ref.delete()
    
    return {
        "status": "ok",
        "message": "Schedule deleted successfully"
    }

@router.get("/device/{device_id}")
async def get_device_schedules(device_id: str, user=Depends(verify_firebase_token)):
    """Get all schedules for a specific device"""
    user_id = user.get("uid")
    
    # Verify user has access to this device
    device_ref = db.reference(f"/devices/{device_id}")
    device_info = device_ref.get()
    
    if not device_info:
        raise HTTPException(404, "Device not found")
    
    user_access = db.reference(f"/device_users/{device_id}/{user_id}").get()
    legacy_user = device_info.get("user_id")
    
    if not user_access and legacy_user != user_id:
        raise HTTPException(403, "You don't have permission to view schedules for this device")
    
    # Query schedules for this device
    schedules_ref = db.reference("/schedules")
    all_schedules = schedules_ref.order_by_child("device_id").equal_to(device_id).get()
    
    if not all_schedules:
        return {"schedules": []}
    
    # Filter by user and convert to list format
    schedules_list = []
    for schedule_id, schedule_data in all_schedules.items():
        if schedule_data.get("user_id") == user_id:
            schedule_item = {
                "id": schedule_id,
                **schedule_data
            }
            schedules_list.append(schedule_item)
    
    # Sort by created_at descending
    schedules_list.sort(key=lambda x: x.get("created_at", 0), reverse=True)
    
    return {"device_id": device_id, "schedules": schedules_list}

@router.post("/test-mqtt/{device_id}")
async def test_mqtt_notification(device_id: str, user=Depends(verify_firebase_token)):
    """Test MQTT notification for a device (for development/testing)"""
    user_id = user.get("uid")
    
    # Verify user has access to this device
    device_ref = db.reference(f"/devices/{device_id}")
    device_info = device_ref.get()
    
    if not device_info:
        raise HTTPException(404, "Device not found")
    
    user_access = db.reference(f"/device_users/{device_id}/{user_id}").get()
    legacy_user = device_info.get("user_id")
    
    if not user_access and legacy_user != user_id:
        raise HTTPException(403, "You don't have permission to test notifications for this device")
    
    # Send test notification
    test_message = f"Test notification from HealthSense system at {datetime.now().isoformat()}"
    
    try:
        success = send_mqtt_notification(device_id, test_message)
        return {
            "status": "ok" if success else "error",
            "message": "Test notification sent successfully" if success else "Failed to send test notification",
            "device_id": device_id
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to send test notification: {str(e)}")

@router.get("/status")
async def get_scheduler_status():
    """Get the status of the background scheduler"""
    global scheduler_running, scheduler_thread
    
    return {
        "scheduler_running": scheduler_running,
        "scheduler_thread_alive": scheduler_thread.is_alive() if scheduler_thread else False,
        "mqtt_broker": MQTT_BROKER,
        "mqtt_port": MQTT_PORT,
        "mock_mode": MOCK_MQTT
    }

@router.get("/notifications/{device_id}")
async def get_device_notifications(device_id: str, user=Depends(verify_firebase_token), limit: int = 50):
    """Get MQTT notifications sent to a device (useful for testing)"""
    user_id = user.get("uid")
    
    # Verify user has access to this device
    device_ref = db.reference(f"/devices/{device_id}")
    device_info = device_ref.get()
    
    if not device_info:
        raise HTTPException(404, "Device not found")
    
    user_access = db.reference(f"/device_users/{device_id}/{user_id}").get()
    legacy_user = device_info.get("user_id")
    
    if not user_access and legacy_user != user_id:
        raise HTTPException(403, "You don't have permission to view notifications for this device")
    
    # Get notifications for this device
    notifications_ref = db.reference("/mqtt_notifications")
    all_notifications = notifications_ref.order_by_child("device_id").equal_to(device_id).get()
    
    if not all_notifications:
        return {"notifications": []}
    
    # Convert to list and sort by timestamp
    notifications_list = []
    for notif_id, notif_data in all_notifications.items():
        notification_item = {
            "id": notif_id,
            **notif_data
        }
        notifications_list.append(notification_item)
    
    # Sort by timestamp descending (newest first)
    notifications_list.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    
    return {"device_id": device_id, "notifications": notifications_list[:limit]}