# api/admin.py - NEW FILE
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from firebase_admin.auth import verify_id_token
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/admin")
db = firestore.client()

def verify_firebase_token(token: str):
    try:
        decoded_token = verify_id_token(token)
        return decoded_token['uid']
    except:
        raise HTTPException(401, "Invalid token")

def verify_admin_token(token: str):
    uid = verify_firebase_token(token)
    user_ref = db.collection('users').document(uid)
    user_doc = user_ref.get()
    
    if not user_doc.exists or user_doc.to_dict().get('role') != 'admin':
        raise HTTPException(403, "Admin access required")
    
    return uid

@router.get("/dashboard/stats")
async def get_dashboard_stats(admin_uid: str = Depends(verify_admin_token)):
    # Get user statistics
    users_ref = db.collection('users')
    total_users = len(users_ref.get())
    
    # Get device statistics  
    devices_ref = db.collection('device_users')
    total_devices = len(devices_ref.get())
    
    # Get active users (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    active_users_query = users_ref.where('last_active', '>=', thirty_days_ago)
    active_users = len(active_users_query.get())
    
    return {
        "total_users": total_users,
        "total_devices": total_devices,
        "active_users": active_users,
        "system_health": "good"
    }

@router.get("/users")
async def get_all_users(admin_uid: str = Depends(verify_admin_token)):
    users_ref = db.collection('users')
    users = []
    
    for doc in users_ref.stream():
        user_data = doc.to_dict()
        user_data['uid'] = doc.id
        users.append(user_data)
    
    return {"users": users}

@router.get("/devices")
async def get_all_devices(admin_uid: str = Depends(verify_admin_token)):
    devices_ref = db.collection('device_users')
    devices = []
    
    for doc in devices_ref.stream():
        device_data = doc.to_dict()
        device_data['device_id'] = doc.id
        devices.append(device_data)
    
    return {"devices": devices}