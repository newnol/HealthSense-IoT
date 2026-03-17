# api/records.py
from fastapi import APIRouter, Request, Depends, HTTPException, Header, Query
from firebase_admin import db, exceptions as fa_exceptions
import time
from .auth import verify_firebase_token
from .models import HealthRecord, HealthRecordResponse, HealthRecordsQuery, APIResponse, DeviceRegistrationRequest, DeviceRegistrationResponse
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/records")

def verify_device(x_device_id: str = Header(...), x_device_secret: str = Header(...)):
    expected = db.reference(f"/devices/{x_device_id}/secret").get()
    if expected != x_device_secret:
        raise HTTPException(401, "Unauthorized")
    return x_device_id

@router.post("")
@router.post("/")
async def post_records(
    req: Request,
    device_id: str = Depends(verify_device),
    x_user_id: Optional[str] = Header(default=None, alias="X-User-Id"),
):
    """Submit sensor data from devices.

    Expected payload from device: {"spo2": number, "heart_rate": number}
    Server will stamp current timestamp (ms) and determine userId from device registry.
    """
    body = await req.json()

    # Validate input fields (accept legacy 'hr' as alias for 'heart_rate')
    spo2 = body.get("spo2")
    heart_rate = body.get("heart_rate", body.get("hr"))
    if spo2 is None or heart_rate is None:
        raise HTTPException(400, "Missing spo2 or heart_rate")

    # Determine/validate user for this device
    # If X-User-Id is provided, validate against multi-user mapping
    if x_user_id:
        allowed = db.reference(f"/device_users/{device_id}/{x_user_id}").get()
        if not allowed:
            # backward-compat: also allow legacy single binding if matches
            legacy_user = db.reference(f"/devices/{device_id}/user_id").get()
            if legacy_user != x_user_id:
                raise HTTPException(401, "User not allowed for this device")
        user_id = x_user_id
    else:
        # Backward-compat: fall back to legacy single user binding
        device_info = db.reference(f"/devices/{device_id}").get()
        user_id = device_info.get("user_id") if device_info else None
        if not user_id:
            raise HTTPException(409, "Device is not yet registered to any user")

    # Compose record and stamp server time
    record = {
        "userId": user_id,
        "device_id": device_id,
        "spo2": spo2,
        "heart_rate": heart_rate,
        "ts": int(time.time() * 1000),
    }

    # Generate key and perform fan-out write to both global and per-user paths
    records_ref = db.reference("/records")
    key = records_ref.push({"_tmp": True}).key  # reserve a key
    root_ref = db.reference("/")
    updates = {
        f"records/{key}": record,
        f"user_records/{user_id}/{key}": record,
    }
    root_ref.update(updates)

    return {"status": "ok", "key": key}

@router.get("")
@router.get("/")
async def get_records(
    user = Depends(verify_firebase_token),
    limit: int = 1000
):
    """Get user's health records"""
    user_id = user.get("uid")
    
    # Query records for this user from per-user folder
    user_records_ref = db.reference(f"/user_records/{user_id}")
    try:
        records = (
            user_records_ref
            .order_by_child("ts")
            .limit_to_last(limit)
            .get()
        )
    except fa_exceptions.InvalidArgumentError:
        # Fallback when RTDB index is not defined in local/test environments
        records = user_records_ref.get() or {}
    
    if not records:
        return []
    
    # Convert to list format
    records_list = []
    for key, value in records.items():
        record = {"id": key, **value}
        records_list.append(record)
    
    # Sort by timestamp descending
    records_list.sort(key=lambda x: x.get("ts", 0), reverse=True)
    
    # Trim to requested limit after sorting (in case of fallback path)
    return records_list[:limit]

@router.get("/check-auth")
async def check_records_auth(user = Depends(verify_firebase_token)):
    """Lightweight endpoint to validate Authorization header on the same router.

    Returns minimal info so frontend can diagnose auth forwarding issues
    specific to the `/api/records` router.
    """
    return {
        "ok": True,
        "uid": user.get("uid"),
        "email": user.get("email"),
    }

@router.post("/device/register")
async def register_device(req: Request, user = Depends(verify_firebase_token)):
    """Register a device to user account (supports multi-user devices)"""
    data = await req.json()
    device_id = data.get("device_id")
    device_secret = data.get("device_secret")
    
    if not device_id or not device_secret:
        raise HTTPException(400, "Missing device_id or device_secret")
    
    user_id = user.get("uid")
    device_ref = db.reference(f"/devices/{device_id}")
    existing = device_ref.get()

    # Enforce: device must pre-exist and have a secret provisioned by the system
    if not existing:
        raise HTTPException(404, "Device not found. Please contact support.")

    # Secret must match exactly
    if existing.get("secret") != device_secret:
        raise HTTPException(401, "Invalid device credentials")

    # Check if user is already registered for this device
    device_user_ref = db.reference(f"/device_users/{device_id}/{user_id}")
    if device_user_ref.get():
        return {"status": "ok", "message": "Device already registered to this user"}

    # For backward compatibility, check legacy single user binding
    legacy_user = existing.get("user_id")
    if legacy_user and legacy_user != user_id:
        # Device has legacy single user - convert to multi-user format
        # Add the legacy user to the new multi-user structure
        legacy_user_ref = db.reference(f"/device_users/{device_id}/{legacy_user}")
        legacy_user_ref.set({"registered_at": existing.get("registered_at", int(time.time() * 1000))})
        
        # Remove the legacy user_id field from device
        device_ref.child("user_id").delete()

    # Add current user to device_users mapping
    device_user_ref.set({"registered_at": int(time.time() * 1000)})
    
    # Update device registration timestamp if not set
    if not existing.get("registered_at"):
        device_ref.update({"registered_at": int(time.time() * 1000)})

    return {"status": "ok", "message": "Device registered successfully"}

@router.post("/device/{device_id}/add-user")
async def add_user_to_device(
    device_id: str, 
    req: Request, 
    user = Depends(verify_firebase_token)
):
    """Add another user to an existing device (device sharing)"""
    data = await req.json()
    target_user_email = data.get("user_email")
    device_secret = data.get("device_secret")
    
    if not target_user_email or not device_secret:
        raise HTTPException(400, "Missing user_email or device_secret")
    
    current_user_id = user.get("uid")
    
    # Verify device exists and secret is correct
    device_ref = db.reference(f"/devices/{device_id}")
    device_info = device_ref.get()
    
    if not device_info:
        raise HTTPException(404, "Device not found")
    
    if device_info.get("secret") != device_secret:
        raise HTTPException(401, "Invalid device credentials")
    
    # Verify current user has access to this device
    current_user_access = db.reference(f"/device_users/{device_id}/{current_user_id}").get()
    legacy_user = device_info.get("user_id")
    
    if not current_user_access and legacy_user != current_user_id:
        raise HTTPException(403, "You don't have permission to add users to this device")
    
    # Find target user by email using Firebase Auth
    from firebase_admin import auth
    try:
        target_user = auth.get_user_by_email(target_user_email)
        target_user_id = target_user.uid
    except auth.UserNotFoundError:
        raise HTTPException(404, f"User with email {target_user_email} not found")
    
    # Check if target user is already registered
    target_user_ref = db.reference(f"/device_users/{device_id}/{target_user_id}")
    if target_user_ref.get():
        return {"status": "ok", "message": "User is already registered to this device"}
    
    # Add target user to device
    target_user_ref.set({
        "registered_at": int(time.time() * 1000),
        "added_by": current_user_id
    })
    
    return {"status": "ok", "message": f"User {target_user_email} added to device successfully"}

@router.delete("/device/{device_id}/remove-user/{target_user_id}")
async def remove_user_from_device(
    device_id: str, 
    target_user_id: str, 
    user = Depends(verify_firebase_token)
):
    """Remove a user from a shared device"""
    current_user_id = user.get("uid")
    
    # Verify device exists
    device_ref = db.reference(f"/devices/{device_id}")
    device_info = device_ref.get()
    
    if not device_info:
        raise HTTPException(404, "Device not found")
    
    # Verify current user has access to this device
    current_user_access = db.reference(f"/device_users/{device_id}/{current_user_id}").get()
    legacy_user = device_info.get("user_id")
    
    if not current_user_access and legacy_user != current_user_id:
        raise HTTPException(403, "You don't have permission to remove users from this device")
    
    # Cannot remove yourself if you're the only user
    device_users_ref = db.reference(f"/device_users/{device_id}")
    all_device_users = device_users_ref.get() or {}
    
    if legacy_user:
        # Count legacy user as one user
        total_users = len(all_device_users) + 1
    else:
        total_users = len(all_device_users)
    
    if current_user_id == target_user_id and total_users <= 1:
        raise HTTPException(400, "Cannot remove the last user from device")
    
    # Remove target user
    target_user_ref = db.reference(f"/device_users/{device_id}/{target_user_id}")
    if not target_user_ref.get():
        raise HTTPException(404, "User is not registered to this device")
    
    target_user_ref.delete()
    
    return {"status": "ok", "message": "User removed from device successfully"}

@router.delete("/device/{device_id}/remove-user")
async def remove_user_from_device_by_email(
    device_id: str,
    req: Request,
    user = Depends(verify_firebase_token)
):
    """Remove a user from a shared device using email"""
    body = await req.json()
    user_email = body.get("user_email")
    
    if not user_email:
        raise HTTPException(400, "user_email is required")
    
    current_user_id = user.get("uid")
    
    # Verify device exists
    device_ref = db.reference(f"/devices/{device_id}")
    device_info = device_ref.get()
    
    if not device_info:
        raise HTTPException(404, "Device not found")
    
    # Verify current user has access to this device
    current_user_access = db.reference(f"/device_users/{device_id}/{current_user_id}").get()
    legacy_user = device_info.get("user_id")
    
    if not current_user_access and legacy_user != current_user_id:
        raise HTTPException(403, "You don't have permission to remove users from this device")
    
    # Find user ID by email
    from firebase_admin import auth
    try:
        target_user = auth.get_user_by_email(user_email)
        target_user_id = target_user.uid
    except auth.UserNotFoundError:
        raise HTTPException(404, "User not found")
    except Exception as e:
        raise HTTPException(400, f"Error looking up user: {str(e)}")
    
    # Check if user is registered to this device
    device_users_ref = db.reference(f"/device_users/{device_id}")
    all_device_users = device_users_ref.get() or {}
    
    if target_user_id not in all_device_users and legacy_user != target_user_id:
        raise HTTPException(404, "User is not registered to this device")
    
    # Cannot remove yourself if you're the only user
    if legacy_user:
        # Count legacy user as one user
        total_users = len(all_device_users) + 1
    else:
        total_users = len(all_device_users)
    
    if current_user_id == target_user_id and total_users <= 1:
        raise HTTPException(400, "Cannot remove the last user from device")
    
    # Remove target user
    if target_user_id in all_device_users:
        target_user_ref = db.reference(f"/device_users/{device_id}/{target_user_id}")
        target_user_ref.delete()
    elif legacy_user == target_user_id:
        # Cannot remove legacy user without migrating device ownership
        raise HTTPException(400, "Cannot remove the device owner. Transfer ownership first.")
    
    return {"status": "ok", "message": "User removed from device successfully"}

@router.get("/device/{device_id}/users")
async def get_device_users(device_id: str, user = Depends(verify_firebase_token)):
    """Get list of users registered to a device"""
    current_user_id = user.get("uid")
    
    # Verify device exists
    device_ref = db.reference(f"/devices/{device_id}")
    device_info = device_ref.get()
    
    if not device_info:
        raise HTTPException(404, "Device not found")
    
    # Verify current user has access to this device
    current_user_access = db.reference(f"/device_users/{device_id}/{current_user_id}").get()
    legacy_user = device_info.get("user_id")
    
    if not current_user_access and legacy_user != current_user_id:
        raise HTTPException(403, "You don't have permission to view users of this device")
    
    # Get all users for this device
    device_users_ref = db.reference(f"/device_users/{device_id}")
    device_users = device_users_ref.get() or {}
    
    users_list = []
    
    # Add legacy user if exists
    if legacy_user:
        from firebase_admin import auth
        try:
            legacy_user_info = auth.get_user(legacy_user)
            users_list.append({
                "user_id": legacy_user,
                "email": legacy_user_info.email,
                "registered_at": device_info.get("registered_at"),
                "is_legacy": True
            })
        except Exception:
            # Skip if user no longer exists
            pass
    
    # Add multi-user entries
    from firebase_admin import auth
    for user_id, user_data in device_users.items():
        try:
            user_info = auth.get_user(user_id)
            users_list.append({
                "user_id": user_id,
                "email": user_info.email,
                "registered_at": user_data.get("registered_at"),
                "added_by": user_data.get("added_by"),
                "is_legacy": False
            })
        except Exception:
            # Skip if user no longer exists
            continue
    
    return {"device_id": device_id, "users": users_list}

@router.get("/user/devices")
async def get_user_devices(user = Depends(verify_firebase_token)):
    """Get list of devices registered to current user"""
    user_id = user.get("uid")
    
    devices_list = []
    
    # Check for legacy single-user devices
    devices_ref = db.reference("/devices")
    all_devices = devices_ref.get() or {}
    
    for device_id, device_data in all_devices.items():
        if device_data.get("user_id") == user_id:
            devices_list.append({
                "device_id": device_id,
                "registered_at": device_data.get("registered_at"),
                "is_legacy": True,
                "user_count": 1
            })
    
    # Check for multi-user devices
    device_users_ref = db.reference("/device_users")
    all_device_users = device_users_ref.get() or {}
    
    for device_id, users_data in all_device_users.items():
        if user_id in users_data:
            # Skip if already added as legacy device
            if any(d["device_id"] == device_id for d in devices_list):
                continue
                
            devices_list.append({
                "device_id": device_id,
                "registered_at": users_data[user_id].get("registered_at"),
                "added_by": users_data[user_id].get("added_by"),
                "is_legacy": False,
                "user_count": len(users_data)
            })
    
    return {"devices": devices_list}
