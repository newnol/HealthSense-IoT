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

from .records import router as records_router
from .command import router as command_router
from .auth import router as auth_router
from .admin import router as admin_router
from .login import router as login_router
from .ai import router as ai_router
from .profile import router as profile_router
from .schedule import router as schedule_router


# Load env from project root `.env.local` (best-effort) for local dev
PROJECT_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(PROJECT_ROOT / ".env.local")

# Initialize Firebase Admin using FIREBASE_* env vars as a dict
db_url = os.environ.get("FIREBASE_DB_URL")
if db_url:
    db_url = db_url.rstrip("/")
if not db_url:
    raise RuntimeError("Missing required environment variable: FIREBASE_DB_URL")

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
if missing:
    raise RuntimeError("Missing Firebase service account env vars: " + ", ".join(missing))

cred = credentials.Certificate(service_account_info)  # type: ignore[arg-type]
initialize_app(cred, {"databaseURL": db_url})

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(records_router)
app.include_router(command_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(login_router)
app.include_router(ai_router)
app.include_router(profile_router)
app.include_router(schedule_router)

# Note: On Vercel Python runtime, export ASGI app as `app` (no Mangum wrapper needed)
