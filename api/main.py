"""FastAPI application entrypoint.

Loads environment variables from `.env.local` for local development using python-dotenv
before initializing Firebase Admin SDK.
"""

import os
import json
import base64
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials, initialize_app

 


# Load env from project root `.env.local` (best-effort) for local dev
PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env.local")

# Initialize Firebase Admin using FIREBASE_* env vars as a dict
db_url = os.environ.get("FIREBASE_DB_URL")
if db_url:
    db_url = db_url.rstrip("/")
else:
    import logging
    logging.warning("FIREBASE_DB_URL not set; Firebase features disabled.")

private_key = os.environ.get("FIREBASE_PRIVATE_KEY")
if private_key:
    private_key = private_key.replace("\\n", "\n")

service_account_info = {
    "type": os.environ.get("FIREBASE_TYPE"),
    "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
    "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": private_key,
    "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
    "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
    "auth_uri": os.environ.get("FIREBASE_AUTH_URI"),
    "token_uri": os.environ.get("FIREBASE_TOKEN_URI"),
    "auth_provider_x509_cert_url": os.environ.get("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
    "client_x509_cert_url": os.environ.get("FIREBASE_CLIENT_X509_CERT_URL"),
}

# Validate necessary keys
required_keys = [
    "type",
    "project_id",
    "private_key_id",
    "private_key",
    "client_email",
    "client_id",
    "auth_uri",
    "token_uri",
    "auth_provider_x509_cert_url",
    "client_x509_cert_url",
]
missing = [k for k in required_keys if not service_account_info.get(k)]
firebase_initialized = False
if db_url and not missing:
    try:
        cred = credentials.Certificate(service_account_info)  # type: ignore[arg-type]
        initialize_app(cred, {"databaseURL": db_url})
        firebase_initialized = True
    except Exception as e:
        import logging
        logging.warning(f"Firebase initialization failed: {e}")
else:
    import logging
    logging.warning("Firebase service account not fully configured; skipping Firebase init.")

# Import routers AFTER environment variables are loaded so modules read correct env at import time
from .records import router as records_router
from .command import router as command_router
from .auth import router as auth_router
from .admin import router as admin_router
from .login import router as login_router
from .ai import router as ai_router
from .profile import router as profile_router
from .schedule import router as schedule_router
from .monitoring import router as monitoring_router

app = FastAPI(
    title="Health Monitoring API",
    description="""
    ## IoT Health Monitoring System API
    
    Comprehensive health monitoring solution with real-time data collection and AI-driven analytics.
    
    ### Features
    - 🔐 **Secure Authentication** - Firebase-based user authentication
    - 📊 **Real-time Data** - Heart rate and SpO₂ monitoring from IoT devices
    - 🤖 **AI Analytics** - Intelligent health insights and trend analysis
    - 👥 **Multi-user Support** - Device sharing and user management
    - 📱 **Cross-platform** - Works across web, mobile, and IoT devices
    
    ### Getting Started
    1. Authenticate using Firebase ID token
    2. Register your IoT devices
    3. Start collecting health data
    4. Get AI-powered insights
    
    ### Rate Limits
    - Authentication endpoints: 10 requests/minute
    - Admin endpoints: 5 requests/minute
    - Data endpoints: 100 requests/minute
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "Health Monitoring API Support",
        "email": "support@healthmonitor.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    tags_metadata=[
        {
            "name": "Authentication",
            "description": "User authentication and authorization endpoints",
        },
        {
            "name": "Health Records",
            "description": "Health data collection and retrieval endpoints",
        },
        {
            "name": "Device Management",
            "description": "IoT device registration and management",
        },
        {
            "name": "Commands",
            "description": "Device command and control endpoints",
        },
        {
            "name": "AI Analytics",
            "description": "AI-powered health analysis and insights",
        },
        {
            "name": "Admin",
            "description": "Administrative functions (admin only)",
        },
        {
            "name": "User Profile",
            "description": "User profile and preferences management",
        },
        {
            "name": "Scheduling",
            "description": "Measurement scheduling and automation",
        },
    ]
)

# Security middleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.gzip import GZipMiddleware
import logging

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

# Trusted hosts for security
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.vercel.app", "*.yourdomain.com"]
)

# CORS with specific origins for security
allowed_origins = [
    "http://localhost:3000",
    "https://localhost:3000", 
    "https://*.vercel.app",
]

# Add development origins if not in production
if os.environ.get("NODE_ENV") != "production":
    allowed_origins.extend([
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount routers
app.include_router(records_router)
app.include_router(command_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(login_router)
app.include_router(ai_router)
app.include_router(profile_router)
app.include_router(schedule_router)
app.include_router(monitoring_router)

# Note: On Vercel Python runtime, export ASGI app as `app` (no Mangum wrapper needed)
