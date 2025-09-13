# api/models.py - Pydantic models for request/response validation
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class DeviceStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"

class CommandAction(str, Enum):
    MEASURE = "measure"
    CALIBRATE = "calibrate"
    RESET = "reset"
    UPDATE_INTERVAL = "update_interval"

# Base models
class TimestampedModel(BaseModel):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# User models
class UserInfo(BaseModel):
    uid: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    email_verified: bool = False
    disabled: bool = False
    admin: bool = False
    custom_claims: Optional[Dict[str, Any]] = {}

class UserStats(BaseModel):
    total_users: int = Field(..., description="Total number of users")
    admin_users: int = Field(..., description="Number of admin users")
    regular_users: int = Field(..., description="Number of regular users")
    disabled_users: int = Field(..., description="Number of disabled users")
    verified_users: int = Field(..., description="Number of verified users")
    unverified_users: int = Field(..., description="Number of unverified users")

# Device models
class DeviceInfo(BaseModel):
    device_id: str = Field(..., description="Unique device identifier")
    user_id: Optional[str] = Field(None, description="Primary user ID")
    device_name: Optional[str] = Field(None, description="Human-readable device name")
    status: DeviceStatus = DeviceStatus.ACTIVE
    last_seen: Optional[datetime] = None
    firmware_version: Optional[str] = None
    hardware_version: Optional[str] = None

class DeviceRegistrationRequest(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=50)
    user_id: str = Field(..., min_length=1)
    device_name: Optional[str] = Field(None, max_length=100)

class DeviceRegistrationResponse(BaseModel):
    device_id: str
    secret: str
    user_id: str
    status: str = "registered"

# Health record models
class HealthRecord(BaseModel):
    spo2: float = Field(..., ge=0, le=100, description="Blood oxygen saturation percentage")
    heart_rate: float = Field(..., ge=30, le=300, description="Heart rate in BPM")
    timestamp: Optional[int] = Field(None, description="Unix timestamp in milliseconds")
    device_id: Optional[str] = Field(None, description="Source device ID")
    user_id: Optional[str] = Field(None, description="User ID")
    
    @validator('spo2')
    def validate_spo2(cls, v):
        if v < 70 or v > 100:
            raise ValueError('SpO2 must be between 70-100%')
        return round(v, 1)
    
    @validator('heart_rate')
    def validate_heart_rate(cls, v):
        if v < 30 or v > 300:
            raise ValueError('Heart rate must be between 30-300 BPM')
        return round(v, 0)

class HealthRecordResponse(HealthRecord):
    id: str
    created_at: datetime

class HealthRecordsQuery(BaseModel):
    limit: int = Field(default=100, ge=1, le=10000)
    offset: int = Field(default=0, ge=0)
    start_date: Optional[str] = Field(None, description="Start date in YYYY-MM-DD format")
    end_date: Optional[str] = Field(None, description="End date in YYYY-MM-DD format")
    device_id: Optional[str] = None

# Command models
class DeviceCommand(BaseModel):
    device_id: str = Field(..., min_length=1)
    action: CommandAction
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    expires_at: Optional[datetime] = None
    priority: int = Field(default=1, ge=1, le=10)

class DeviceCommandResponse(DeviceCommand):
    id: str
    created_at: datetime
    executed_at: Optional[datetime] = None
    status: str = "pending"

# AI Analysis models
class HealthAnalysisRequest(BaseModel):
    records: List[HealthRecord] = Field(..., min_items=1, max_items=1000)
    analysis_type: str = Field(default="comprehensive", description="Type of analysis to perform")
    time_range: Optional[str] = Field(None, description="Time range for analysis")

class HealthInsight(BaseModel):
    type: str = Field(..., description="Type of insight (trend, anomaly, recommendation)")
    severity: str = Field(..., description="Severity level (low, medium, high, critical)")
    title: str = Field(..., description="Insight title")
    description: str = Field(..., description="Detailed description")
    recommendations: List[str] = Field(default_factory=list)
    confidence: float = Field(..., ge=0, le=1, description="Confidence score")

class HealthAnalysisResponse(BaseModel):
    insights: List[HealthInsight]
    summary: str = Field(..., description="Overall health summary")
    risk_score: float = Field(..., ge=0, le=10, description="Overall risk score")
    generated_at: datetime

# Admin models
class AdminClaimRequest(BaseModel):
    uid: Optional[str] = None
    email: Optional[str] = None
    admin: bool = True
    
    @validator('uid', 'email', pre=True, always=True)
    def validate_identifier(cls, v, values):
        if not values.get('uid') and not values.get('email'):
            raise ValueError('Either uid or email must be provided')
        return v

class AdminClaimResponse(BaseModel):
    status: str = "success"
    message: str
    uid: Optional[str] = None

# Schedule models
class ScheduleEntry(BaseModel):
    user_id: str
    device_id: str
    scheduled_time: datetime
    measurement_type: str = Field(default="routine")
    notes: Optional[str] = None
    recurring: bool = False
    recurrence_pattern: Optional[str] = None

class ScheduleResponse(ScheduleEntry):
    id: str
    created_at: datetime
    status: str = "scheduled"

# API Response models
class APIResponse(BaseModel):
    status: str = "success"
    message: Optional[str] = None
    data: Optional[Any] = None
    errors: Optional[List[str]] = None

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int = 1
    per_page: int = 100
    has_next: bool = False
    has_prev: bool = False

# Error models
class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    code: Optional[str] = None

class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    details: Optional[List[ErrorDetail]] = None
    timestamp: datetime = Field(default_factory=datetime.now)

# Validation helpers
def validate_date_range(start_date: Optional[str], end_date: Optional[str]) -> tuple:
    """Validate and parse date range strings"""
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise ValueError("start_date must be in YYYY-MM-DD format")
    else:
        start_dt = None
    
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            raise ValueError("end_date must be in YYYY-MM-DD format")
    else:
        end_dt = None
    
    if start_dt and end_dt and start_dt > end_dt:
        raise ValueError("start_date cannot be after end_date")
    
    return start_dt, end_dt