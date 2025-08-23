# api/admin.py
from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import db, auth as firebase_auth
from .auth import verify_admin
from typing import List, Dict, Optional
import time
import logging

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin")

@router.get("/users")
async def get_all_users(admin = Depends(verify_admin), limit: int = 100, page_token: Optional[str] = None):
    """Get all users with pagination"""
    try:
        # List users with pagination
        users_result = firebase_auth.list_users(max_results=limit, page_token=page_token)
        
        users_list = []
        for user in users_result.users:
            user_data = {
                "uid": user.uid,
                "email": user.email,
                "displayName": user.display_name,
                "disabled": user.disabled,
                "emailVerified": user.email_verified,
                "createdAt": user.user_metadata.creation_timestamp if user.user_metadata else None,
                "lastSignInAt": user.user_metadata.last_sign_in_timestamp if user.user_metadata else None,
                "customClaims": user.custom_claims or {},
                "admin": user.custom_claims.get('admin', False) if user.custom_claims else False
            }
            
            # Get device count for user - avoid index error by getting all devices first
            devices_ref = db.reference("/devices")
            all_devices = devices_ref.get()
            user_device_count = 0
            if all_devices:
                for device_id, device_data in all_devices.items():
                    if device_data.get("user_id") == user.uid:
                        user_device_count += 1
            user_data["deviceCount"] = user_device_count
            
            users_list.append(user_data)
        
        return {
            "users": users_list,
            "nextPageToken": users_result.next_page_token,
            "total": len(users_list)
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch users: {str(e)}")

@router.put("/users/{user_id}")
async def update_user(user_id: str, req: Request, admin = Depends(verify_admin)):
    """Update user information"""
    try:
        data = await req.json()
        update_data = {}
        
        # Update basic user properties
        if "email" in data:
            update_data["email"] = data["email"]
        if "displayName" in data:
            update_data["display_name"] = data["displayName"]
        if "disabled" in data:
            update_data["disabled"] = data["disabled"]
        
        # Update user in Firebase Auth
        if update_data:
            firebase_auth.update_user(user_id, **update_data)
        
        # Update custom claims if admin status changed
        if "admin" in data:
            firebase_auth.set_custom_user_claims(user_id, {'admin': data["admin"]})
        
        return {"status": "ok", "message": "User updated successfully"}
    except Exception as e:
        raise HTTPException(500, f"Failed to update user: {str(e)}")

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin = Depends(verify_admin)):
    """Delete a user account and all associated data"""
    try:
        logger.info(f"Admin {admin.get('uid')} attempting to delete user {user_id}")
        
        # Check if user exists first
        try:
            user = firebase_auth.get_user(user_id)
            logger.info(f"Found user {user_id} with email {user.email}")
        except firebase_auth.UserNotFoundError:
            logger.warning(f"User {user_id} not found for deletion")
            raise HTTPException(404, "User not found")
        
        # Prevent admin from deleting themselves
        if admin.get('uid') == user_id:
            logger.warning(f"Admin {admin.get('uid')} attempted to delete their own account")
            raise HTTPException(400, "Cannot delete your own account")
        
        # Check if target user is admin - prevent deleting other admins
        user_claims = user.custom_claims or {}
        if user_claims.get('admin', False):
            logger.warning(f"Admin {admin.get('uid')} attempted to delete another admin {user_id}")
            raise HTTPException(403, "Cannot delete other admin accounts")
        
        # Get user's devices and records for cleanup
        devices_to_update = []
        records_to_delete = []
        
        # Get devices - remove user from devices instead of deleting devices
        devices_ref = db.reference("/devices")
        all_devices = devices_ref.get()
        if all_devices:
            for device_id, device_data in all_devices.items():
                if device_data.get("user_id") == user_id:
                    devices_to_update.append(device_id)
        
        logger.info(f"Found {len(devices_to_update)} devices to remove user from for user {user_id}")
        
        # Get records - still delete user's records
        records_ref = db.reference("/records")
        all_records = records_ref.get()
        if all_records:
            for record_id, record_data in all_records.items():
                if record_data.get("userId") == user_id:
                    records_to_delete.append(record_id)
        
        logger.info(f"Found {len(records_to_delete)} records to delete for user {user_id}")
        
        # Delete user from Firebase Auth first
        firebase_auth.delete_user(user_id)
        logger.info(f"Successfully deleted user {user_id} from Firebase Auth")
        
        # Remove user from devices (keep devices but clear user_id)
        for device_id in devices_to_update:
            try:
                device_ref = db.reference(f"/devices/{device_id}")
                device_data = device_ref.get()
                if device_data:
                    # Remove user_id but keep device registered
                    device_data.pop("user_id", None)
                    # Add unregistered timestamp
                    device_data["unregistered_at"] = int(time.time() * 1000)
                    device_data["status"] = "unregistered"
                    device_ref.set(device_data)
                    logger.debug(f"Removed user from device {device_id}")
            except Exception as e:
                logger.warning(f"Failed to remove user from device {device_id}: {e}")
        
        # Clean up user's records
        for record_id in records_to_delete:
            try:
                db.reference(f"/records/{record_id}").delete()
                logger.debug(f"Deleted record {record_id}")
            except Exception as e:
                logger.warning(f"Failed to delete record {record_id}: {e}")
        
        # Clean up user's profile
        try:
            db.reference(f"/user_profiles/{user_id}").delete()
            logger.debug(f"Deleted user profile for {user_id}")
        except Exception as e:
            logger.warning(f"Failed to delete user profile: {e}")
        
        # Clean up any other user-related data
        try:
            # Clean up user sessions if they exist
            db.reference(f"/user_sessions/{user_id}").delete()
            logger.debug(f"Deleted user sessions for {user_id}")
        except:
            pass  # Sessions might not exist
        
        try:
            # Clean up user preferences if they exist
            db.reference(f"/user_preferences/{user_id}").delete()
            logger.debug(f"Deleted user preferences for {user_id}")
        except:
            pass  # Preferences might not exist
        
        logger.info(f"Successfully completed deletion of user {user_id} and all associated data")
        
        return {
            "status": "success", 
            "message": "User deleted successfully. Devices unregistered and data cleaned up.",
            "deletedData": {
                "devicesUnregistered": len(devices_to_update),
                "recordsDeleted": len(records_to_delete),
                "userEmail": user.email
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}", exc_info=True)
        raise HTTPException(500, f"Failed to delete user: {str(e)}")

@router.get("/devices")
async def get_all_devices(admin = Depends(verify_admin)):
    """Get all devices with user information"""
    try:
        devices_ref = db.reference("/devices")
        devices = devices_ref.get()
        
        if not devices:
            return {"devices": [], "total": 0}
        
        devices_list = []
        for device_id, device_data in devices.items():
            device_info = {
                "deviceId": device_id,
                "userId": device_data.get("user_id"),
                "registeredAt": device_data.get("registered_at"),
                "lastActive": None  # Will be populated from records
            }
            
            # Get user info
            if device_info["userId"]:
                try:
                    user = firebase_auth.get_user(device_info["userId"])
                    device_info["userEmail"] = user.email
                    device_info["userDisplayName"] = user.display_name
                except:
                    device_info["userEmail"] = "Unknown"
                    device_info["userDisplayName"] = "Deleted User"
            
            # Get last activity from records - avoid index error
            records_ref = db.reference("/records")
            all_records = records_ref.get()
            latest_timestamp = None
            
            if all_records:
                for record_id, record_data in all_records.items():
                    if record_data.get("device_id") == device_id:
                        ts = record_data.get("ts")
                        if ts and (latest_timestamp is None or ts > latest_timestamp):
                            latest_timestamp = ts
            
            device_info["lastActive"] = latest_timestamp
            
            devices_list.append(device_info)
        
        # Sort by registration date descending - handle None values
        devices_list.sort(key=lambda x: x.get("registeredAt") or 0, reverse=True)
        
        return {
            "devices": devices_list,
            "total": len(devices_list)
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch devices: {str(e)}")

@router.delete("/devices/{device_id}")
async def delete_device(device_id: str, admin = Depends(verify_admin)):
    """Delete a device"""
    try:
        # Delete device from registry
        db.reference(f"/devices/{device_id}").delete()
        
        # Optionally delete associated records
        # Uncomment if you want to delete records too
        # records_ref = db.reference("/records")
        # device_records = records_ref.order_by_child("device_id").equal_to(device_id).get()
        # if device_records:
        #     for record_id in device_records.keys():
        #         db.reference(f"/records/{record_id}").delete()
        
        return {"status": "ok", "message": "Device deleted successfully"}
    except Exception as e:
        raise HTTPException(500, f"Failed to delete device: {str(e)}")

@router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str, admin = Depends(verify_admin)):
    """Get user profile information"""
    try:
        # Get user profile
        profile_data = db.reference(f"/user_profiles/{user_id}").get()
        
        if not profile_data:
            raise HTTPException(404, "User profile not found")
        
        return {
            "status": "success",
            "profile": profile_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch user profile: {str(e)}")

@router.get("/users/{user_id}/devices")
async def get_user_devices(user_id: str, admin = Depends(verify_admin)):
    """Get all devices for a specific user"""
    try:
        devices_ref = db.reference("/devices")
        all_devices = devices_ref.get()
        
        if not all_devices:
            return {"devices": [], "total": 0}
        
        devices_list = []
        for device_id, device_data in all_devices.items():
            if device_data.get("user_id") != user_id:
                continue
            device_info = {
                "deviceId": device_id,
                "registeredAt": device_data.get("registered_at"),
                "lastActive": None
            }
            
            # Get last activity - avoid index error
            records_ref = db.reference("/records")
            all_records = records_ref.get()
            latest_timestamp = None
            
            if all_records:
                for record_id, record_data in all_records.items():
                    if record_data.get("device_id") == device_id:
                        ts = record_data.get("ts")
                        if ts and (latest_timestamp is None or ts > latest_timestamp):
                            latest_timestamp = ts
            
            device_info["lastActive"] = latest_timestamp
            
            devices_list.append(device_info)
        
        return {
            "devices": devices_list,
            "total": len(devices_list)
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch user devices: {str(e)}")

@router.get("/stats")
async def get_admin_stats(admin = Depends(verify_admin)):
    """Get overall system statistics"""
    try:
        # Get user count
        user_count = 0
        users_result = firebase_auth.list_users()
        for _ in users_result.iterate_all():
            user_count += 1
        
        # Get device count
        devices_ref = db.reference("/devices")
        devices = devices_ref.get()
        device_count = len(devices) if devices else 0
        
        # Get record count - approximate count
        records_ref = db.reference("/records")
        records = records_ref.get()
        record_count = len(records) if records else 0
        
        return {
            "userCount": user_count,
            "deviceCount": device_count,
            "totalRecords": record_count,
            "timestamp": int(time.time() * 1000)  # Current timestamp in milliseconds
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch stats: {str(e)}")