"""Test configuration and fixtures."""
import pytest
import os
import tempfile
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import firebase_admin
from firebase_admin import credentials, db, auth as firebase_auth


@pytest.fixture
def mock_firebase():
    """Mock Firebase dependencies."""
    with patch('firebase_admin.credentials.Certificate') as mock_cert, \
         patch('firebase_admin.initialize_app') as mock_init, \
         patch('firebase_admin.db.reference') as mock_db_ref, \
         patch('firebase_admin.auth.verify_id_token') as mock_verify_token:
        
        # Mock database reference
        mock_ref = Mock()
        mock_ref.get.return_value = None
        mock_ref.set.return_value = None
        mock_ref.update.return_value = None
        mock_ref.push.return_value = Mock(key="test_key")
        mock_ref.delete.return_value = None
        mock_ref.order_by_child.return_value = mock_ref
        mock_ref.limit_to_last.return_value = mock_ref
        mock_ref.equal_to.return_value = mock_ref
        mock_ref.child.return_value = mock_ref
        mock_db_ref.return_value = mock_ref
        
        # Mock token verification
        mock_verify_token.return_value = {
            "uid": "test_user_123",
            "email": "test@example.com",
            "admin": False
        }
        
        yield {
            "db_ref": mock_db_ref,
            "verify_token": mock_verify_token,
            "ref": mock_ref
        }


@pytest.fixture
def test_client(mock_firebase):
    """Create test client with mocked Firebase."""
    # Set required environment variables
    os.environ.update({
        "FIREBASE_DB_URL": "https://test-project.firebaseio.com",
        "FIREBASE_TYPE": "service_account",
        "FIREBASE_PROJECT_ID": "test-project",
        "FIREBASE_PRIVATE_KEY_ID": "test_key_id",
        "FIREBASE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\ntest_key\n-----END PRIVATE KEY-----\n",
        "FIREBASE_CLIENT_EMAIL": "test@test-project.iam.gserviceaccount.com",
        "FIREBASE_CLIENT_ID": "123456789",
        "FIREBASE_AUTH_URI": "https://accounts.google.com/o/oauth2/auth",
        "FIREBASE_TOKEN_URI": "https://oauth2.googleapis.com/token",
        "FIREBASE_AUTH_PROVIDER_X509_CERT_URL": "https://www.googleapis.com/oauth2/v1/certs",
        "FIREBASE_CLIENT_X509_CERT_URL": "https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com",
        "GOOGLE_API_KEY": "test_gemini_api_key"
    })
    
    from api.main import app
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Mock authorization headers."""
    return {"Authorization": "Bearer test_token"}


@pytest.fixture
def device_headers():
    """Mock device headers."""
    return {
        "X-Device-Id": "test_device_123",
        "X-Device-Secret": "test_secret_456"
    }


@pytest.fixture
def admin_user_token():
    """Mock admin user token verification."""
    with patch('firebase_admin.auth.verify_id_token') as mock_verify:
        mock_verify.return_value = {
            "uid": "admin_user_123",
            "email": "admin@example.com",
            "admin": True
        }
        yield mock_verify


@pytest.fixture
def sample_health_record():
    """Sample health record data."""
    return {
        "spo2": 98,
        "heart_rate": 75,
        "ts": 1700000000000,
        "userId": "test_user_123",
        "device_id": "test_device_123"
    }


@pytest.fixture
def sample_user_profile():
    """Sample user profile data."""
    return {
        "year_of_birth": 1990,
        "sex": "male",
        "height": 175.0,
        "weight": 70.0,
        "timezone": "Asia/Ho_Chi_Minh"
    }


@pytest.fixture
def mock_gemini():
    """Mock Google Generative AI."""
    with patch('google.generativeai.configure') as mock_config, \
         patch('google.generativeai.GenerativeModel') as mock_model:
        
        mock_response = Mock()
        mock_response.text = "Tình trạng sức khỏe của bạn khá tốt dựa trên các chỉ số đo được."
        
        mock_model_instance = Mock()
        mock_model_instance.generate_content.return_value = mock_response
        mock_model.return_value = mock_model_instance
        
        yield {
            "configure": mock_config,
            "model": mock_model,
            "response": mock_response
        }
