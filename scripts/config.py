# Configuration for test scripts
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
VERCEL_URL = os.getenv("VERCEL_URL", "https://your-app.vercel.app")

# Test Device Configuration
TEST_DEVICES = {
    "device_1": {
        "device_id": "esp32_test_001",
        "device_secret": "test_secret_123",
        "name": "Test Device 1"
    },
    "device_2": {
        "device_id": "esp32_test_002", 
        "device_secret": "test_secret_456",
        "name": "Test Device 2"
    }
}

# Test User Configuration
TEST_USERS = {
    "admin": {
        "email": "admin@test.com",
        "password": "test123456",
        "role": "admin"
    },
    "user": {
        "email": "user@test.com", 
        "password": "test123456",
        "role": "user"
    }
}

# Firebase Configuration (for direct testing)
FIREBASE_CONFIG = {
    "apiKey": os.getenv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    "authDomain": os.getenv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    "databaseURL": os.getenv("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
    "projectId": os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    "storageBucket": os.getenv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    "messagingSenderId": os.getenv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    "appId": os.getenv("NEXT_PUBLIC_FIREBASE_APP_ID")
}

# Test Data Templates
SAMPLE_SENSOR_DATA = {
    "heart_rate": 75,
    "spo2": 98,
    "temperature": 36.5,
    "timestamp": None,  # Will be set dynamically
    "battery_level": 85,
    "signal_strength": -45
}

SAMPLE_COMMAND_DATA = {
    "action": "calibrate",
    "pattern": [1, 0, 1, 0],
    "duration": 5000
}

# Colors for console output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'
