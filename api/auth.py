# api/auth.py
from fastapi import APIRouter, HTTPException, Header, Depends, Request
from firebase_admin import auth as firebase_auth
from typing import Dict, List, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/api/auth")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_firebase_token(authorization: str = Header(None)):
    """Verify Firebase ID token from Authorization header"""
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(401, "Missing or invalid authorization header")
    
    token = authorization.split('Bearer ')[1]
    
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(401, f"Invalid token: {str(e)}")

def verify_admin(user: Dict = Depends(verify_firebase_token)):
    """Verify that the user has admin role"""
    # Check for admin custom claims
    if not user.get('admin', False):
        raise HTTPException(403, "Access denied. Admin privileges required.")
    return user

@router.get("/verify", 
    summary="Verify Firebase Token",
    description="Verify Firebase ID token and return user information",
    response_description="User verification details",
    tags=["Authentication"])
@limiter.limit("10/minute")
async def verify_token(request: Request, user = Depends(verify_firebase_token)):
    """Verify user token and return user info"""
    return {
        "uid": user.get("uid"),
        "email": user.get("email"),
        "verified": True,
        "admin": user.get("admin", False)
    }

@router.get("/user-roles")
async def get_user_roles(user = Depends(verify_firebase_token), 
                        admin_only: bool = False,
                        limit: int = 100,
                        page_token: Optional[str] = None):
    """Get user roles and information (admin only)"""
    # Check if user is admin
    if not user.get('admin', False):
        raise HTTPException(403, "Access denied. Admin privileges required.")
    
    try:
        # List users with pagination
        users_result = firebase_auth.list_users(max_results=limit, page_token=page_token)
        
        users_list = []
        admin_count = 0
        total_count = 0
        
        for firebase_user in users_result.users:
            total_count += 1
            
            # Get custom claims
            custom_claims = firebase_user.custom_claims or {}
            is_admin = custom_claims.get('admin', False)
            
            if admin_only and not is_admin:
                continue
                
            if is_admin:
                admin_count += 1
            
            user_data = {
                "uid": firebase_user.uid,
                "email": firebase_user.email,
                "displayName": firebase_user.display_name,
                "disabled": firebase_user.disabled,
                "emailVerified": firebase_user.email_verified,
                "createdAt": firebase_user.user_metadata.creation_timestamp if firebase_user.user_metadata else None,
                "lastSignInAt": firebase_user.user_metadata.last_sign_in_timestamp if firebase_user.user_metadata else None,
                "customClaims": custom_claims,
                "admin": is_admin
            }
            
            users_list.append(user_data)
        
        return {
            "users": users_list,
            "nextPageToken": users_result.next_page_token,
            "total": len(users_list),
            "adminCount": admin_count,
            "totalCount": total_count
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch users: {str(e)}")

@router.get("/user/{user_email}")
async def get_user_by_email(user_email: str, user = Depends(verify_firebase_token)):
    """Get specific user information by email (admin only)"""
    # Check if user is admin
    if not user.get('admin', False):
        raise HTTPException(403, "Access denied. Admin privileges required.")
    
    try:
        # Get user by email
        firebase_user = firebase_auth.get_user_by_email(user_email)
        
        # Get custom claims
        custom_claims = firebase_user.custom_claims or {}
        is_admin = custom_claims.get('admin', False)
        
        user_data = {
            "uid": firebase_user.uid,
            "email": firebase_user.email,
            "displayName": firebase_user.display_name,
            "disabled": firebase_user.disabled,
            "emailVerified": firebase_user.email_verified,
            "createdAt": firebase_user.user_metadata.creation_timestamp if firebase_user.user_metadata else None,
            "lastSignInAt": firebase_user.user_metadata.last_sign_in_timestamp if firebase_user.user_metadata else None,
            "customClaims": custom_claims,
            "admin": is_admin
        }
        
        return user_data
    except firebase_auth.UserNotFoundError:
        raise HTTPException(404, f"User with email '{user_email}' not found")
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch user: {str(e)}")

@router.get("/user-stats")
async def get_user_stats(user = Depends(verify_firebase_token)):
    """Get user statistics (admin only)"""
    # Check if user is admin
    if not user.get('admin', False):
        raise HTTPException(403, "Access denied. Admin privileges required.")
    
    try:
        # List all users to get stats
        users_result = firebase_auth.list_users()
        
        total_users = len(users_result.users)
        admin_users = 0
        disabled_users = 0
        verified_users = 0
        
        for firebase_user in users_result.users:
            custom_claims = firebase_user.custom_claims or {}
            if custom_claims.get('admin', False):
                admin_users += 1
            if firebase_user.disabled:
                disabled_users += 1
            if firebase_user.email_verified:
                verified_users += 1
        
        return {
            "totalUsers": total_users,
            "adminUsers": admin_users,
            "regularUsers": total_users - admin_users,
            "disabledUsers": disabled_users,
            "verifiedUsers": verified_users,
            "unverifiedUsers": total_users - verified_users
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch user stats: {str(e)}")

@router.post("/set-admin-claim")
@limiter.limit("5/minute")
async def set_admin_claim(req: Request, admin = Depends(verify_admin)):
    """Set admin claim for a user (admin only)"""
    try:
        data = await req.json()
        target_uid = data.get("uid")
        is_admin = data.get("admin", True)
        
        if not target_uid:
            raise HTTPException(400, "Missing user UID")
        
        # Set custom claims
        firebase_auth.set_custom_user_claims(target_uid, {'admin': is_admin})
        
        return {
            "status": "ok",
            "message": f"Admin claim set to {is_admin} for user {target_uid}"
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to set admin claim: {str(e)}")

@router.post("/set-admin-claim-by-email")
async def set_admin_claim_by_email(req: Request, admin = Depends(verify_admin)):
    """Set admin claim for a user by email (admin only)"""
    try:
        data = await req.json()
        target_email = data.get("email")
        is_admin = data.get("admin", True)
        
        if not target_email:
            raise HTTPException(400, "Missing user email")
        
        # Get user by email first
        firebase_user = firebase_auth.get_user_by_email(target_email)
        
        # Set custom claims
        firebase_auth.set_custom_user_claims(firebase_user.uid, {'admin': is_admin})
        
        return {
            "status": "ok",
            "message": f"Admin claim set to {is_admin} for user {target_email}",
            "uid": firebase_user.uid
        }
    except firebase_auth.UserNotFoundError:
        raise HTTPException(404, f"User with email '{target_email}' not found")
    except Exception as e:
        raise HTTPException(500, f"Failed to set admin claim: {str(e)}")
