# api/users.py - NEW FILE
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from firebase_admin.auth import verify_id_token
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/users")
db = firestore.client()

def verify_firebase_token(token: str):
    try:
        decoded_token = verify_id_token(token)
        return decoded_token['uid']
    except:
        raise HTTPException(401, "Invalid token")

@router.post("/profile")
async def create_user_profile(profile_data: dict, uid: str = Depends(verify_firebase_token)):
    user_ref = db.collection('users').document(uid)
    profile_data.update({
        'created_at': datetime.now(),
        'role': 'user'
    })
    user_ref.set(profile_data)
    return {"status": "success", "uid": uid}

@router.get("/profile/{uid}")
async def get_user_profile(uid: str, current_uid: str = Depends(verify_firebase_token)):
    # Security check
    if current_uid != uid:
        raise HTTPException(403, "Access denied")
    
    user_ref = db.collection('users').document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(404, "User not found")
    
    return user_doc.to_dict()

@router.post("/devices/link")
async def link_device_to_user(device_data: dict, uid: str = Depends(verify_firebase_token)):
    device_id = device_data.get('device_id')
    device_name = device_data.get('name', 'My Device')
    
    # Check if device exists in Realtime DB
    from firebase_admin import db as rtdb
    device_ref = rtdb.reference(f'/devices/{device_id}')
    if not device_ref.get():
        raise HTTPException(404, "Device not found")
    
    # Link device to user in Firestore
    device_user_ref = db.collection('device_users').document(device_id)
    device_user_ref.set({
        'owner_id': uid,
        'device_info': {
            'name': device_name,
            'installed_date': datetime.now()
        },
        'shared_with': []
    })
    
    return {"status": "success", "device_id": device_id}