# api/profile.py
from fastapi import APIRouter, Depends, HTTPException, Request
from firebase_admin import db
from .auth import verify_firebase_token
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
import pytz

router = APIRouter(prefix="/api/profile")

class UserProfile(BaseModel):
    year_of_birth: int = Field(..., ge=1900, le=datetime.now().year, description="Year of birth")
    sex: str = Field(..., pattern="^(male|female|other)$", description="User's sex")
    height: float = Field(..., gt=0, le=300, description="Height in centimeters")
    weight: float = Field(..., gt=0, le=1000, description="Weight in kilograms")
    timezone: str = Field(..., description="User's timezone (e.g., 'Asia/Ho_Chi_Minh')")

class ProfileUpdate(BaseModel):
    year_of_birth: Optional[int] = Field(None, ge=1900, le=datetime.now().year)
    sex: Optional[str] = Field(None, pattern="^(male|female|other)$")
    height: Optional[float] = Field(None, gt=0, le=300)
    weight: Optional[float] = Field(None, gt=0, le=1000)
    timezone: Optional[str] = None

@router.post("")
@router.post("/")
async def create_profile(profile: UserProfile, user = Depends(verify_firebase_token)):
    """Create or update user profile"""
    try:
        user_id = user.get("uid")
        
        # Validate timezone
        try:
            pytz.timezone(profile.timezone)
        except pytz.exceptions.UnknownTimeZoneError:
            raise HTTPException(400, f"Invalid timezone: {profile.timezone}")
        
        # Calculate age
        current_year = datetime.now().year
        age = current_year - profile.year_of_birth
        
        profile_data = {
            "year_of_birth": profile.year_of_birth,
            "age": age,
            "sex": profile.sex,
            "height": profile.height,
            "weight": profile.weight,
            "timezone": profile.timezone,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Save to Firebase
        db.reference(f"/user_profiles/{user_id}").set(profile_data)
        
        return {
            "status": "success",
            "message": "Profile created successfully",
            "profile": profile_data
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to create profile: {str(e)}")

@router.get("")
@router.get("/")
async def get_profile(user = Depends(verify_firebase_token)):
    """Get user profile"""
    try:
        user_id = user.get("uid")
        
        profile_data = db.reference(f"/user_profiles/{user_id}").get()
        
        if not profile_data:
            raise HTTPException(404, "Profile not found")
        
        return {
            "status": "success",
            "profile": profile_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch profile: {str(e)}")

@router.put("")
@router.put("/")
async def update_profile(profile_update: ProfileUpdate, user = Depends(verify_firebase_token)):
    """Update user profile"""
    try:
        user_id = user.get("uid")
        
        # Get existing profile
        existing_profile = db.reference(f"/user_profiles/{user_id}").get()
        if not existing_profile:
            raise HTTPException(404, "Profile not found. Please create a profile first.")
        
        # Prepare update data
        update_data = {}
        for field, value in profile_update.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        # Validate timezone if provided
        if "timezone" in update_data:
            try:
                pytz.timezone(update_data["timezone"])
            except pytz.exceptions.UnknownTimeZoneError:
                raise HTTPException(400, f"Invalid timezone: {update_data['timezone']}")
        
        # Update age if year_of_birth is updated
        if "year_of_birth" in update_data:
            current_year = datetime.now().year
            update_data["age"] = current_year - update_data["year_of_birth"]
        
        update_data["updated_at"] = datetime.now().isoformat()
        
        # Update in Firebase
        db.reference(f"/user_profiles/{user_id}").update(update_data)
        
        # Get updated profile
        updated_profile = db.reference(f"/user_profiles/{user_id}").get()
        
        return {
            "status": "success",
            "message": "Profile updated successfully",
            "profile": updated_profile
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to update profile: {str(e)}")

@router.delete("")
@router.delete("/")
async def delete_profile(user = Depends(verify_firebase_token)):
    """Delete user profile"""
    try:
        user_id = user.get("uid")
        
        # Check if profile exists
        existing_profile = db.reference(f"/user_profiles/{user_id}").get()
        if not existing_profile:
            raise HTTPException(404, "Profile not found")
        
        # Delete profile
        db.reference(f"/user_profiles/{user_id}").delete()
        
        return {
            "status": "success",
            "message": "Profile deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to delete profile: {str(e)}")

@router.get("/timezones")
async def get_timezones():
    """Get list of available timezones"""
    try:
        # Get common timezones
        common_timezones = [
            "Asia/Ho_Chi_Minh",
            "Asia/Bangkok",
            "Asia/Jakarta",
            "Asia/Manila",
            "Asia/Singapore",
            "Asia/Kuala_Lumpur",
            "Asia/Tokyo",
            "Asia/Seoul",
            "Asia/Shanghai",
            "Asia/Hong_Kong",
            "Australia/Sydney",
            "Pacific/Auckland",
            "Europe/London",
            "Europe/Paris",
            "Europe/Berlin",
            "America/New_York",
            "America/Los_Angeles",
            "America/Chicago",
            "America/Denver",
        ]
        
        # Format with display names
        timezone_list = []
        for tz_name in common_timezones:
            try:
                tz = pytz.timezone(tz_name)
                # Get current offset
                now = datetime.now(tz)
                offset = now.strftime('%z')
                display_name = f"{tz_name} (UTC{offset[:3]}:{offset[3:]})"
                timezone_list.append({
                    "value": tz_name,
                    "label": display_name
                })
            except:
                continue
        
        return {
            "status": "success",
            "timezones": timezone_list
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch timezones: {str(e)}")
