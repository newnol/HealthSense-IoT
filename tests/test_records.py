"""Tests for records API endpoints."""
import pytest
from unittest.mock import patch, Mock
import time


class TestRecordsEndpoints:
    """Test health records endpoints."""
    
    def test_post_records_success(self, test_client, mock_firebase, device_headers):
        """Test successful health record submission."""
        # Mock device verification
        mock_firebase["ref"].get.return_value = "test_secret_456"
        
        # Mock device info
        device_info_mock = Mock()
        device_info_mock.get.return_value = {"user_id": "test_user_123"}
        mock_firebase["db_ref"].return_value.get.return_value = {"user_id": "test_user_123"}
        
        payload = {
            "spo2": 98,
            "heart_rate": 75
        }
        
        response = test_client.post(
            "/api/records/",
            json=payload,
            headers=device_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "key" in data
    
    def test_post_records_unauthorized_device(self, test_client, mock_firebase):
        """Test record submission with unauthorized device."""
        mock_firebase["ref"].get.return_value = "wrong_secret"
        
        headers = {
            "X-Device-Id": "test_device_123",
            "X-Device-Secret": "wrong_secret_456"
        }
        payload = {"spo2": 98, "heart_rate": 75}
        
        response = test_client.post(
            "/api/records/",
            json=payload,
            headers=headers
        )
        assert response.status_code == 401
        assert "Unauthorized" in response.json()["detail"]
    
    def test_post_records_missing_data(self, test_client, mock_firebase, device_headers):
        """Test record submission with missing required data."""
        mock_firebase["ref"].get.return_value = "test_secret_456"
        
        payload = {"spo2": 98}  # Missing heart_rate
        
        response = test_client.post(
            "/api/records/",
            json=payload,
            headers=device_headers
        )
        assert response.status_code == 400
        assert "Missing spo2 or heart_rate" in response.json()["detail"]
    
    def test_post_records_device_not_registered(self, test_client, mock_firebase, device_headers):
        """Test record submission from unregistered device."""
        mock_firebase["ref"].get.side_effect = [
            "test_secret_456",  # Device secret verification
            None  # Device info (not registered)
        ]
        
        payload = {"spo2": 98, "heart_rate": 75}
        
        response = test_client.post(
            "/api/records/",
            json=payload,
            headers=device_headers
        )
        assert response.status_code == 409
        assert "Device is not yet registered" in response.json()["detail"]
    
    def test_post_records_with_user_id_header(self, test_client, mock_firebase, device_headers):
        """Test record submission with X-User-Id header."""
        mock_firebase["ref"].get.side_effect = [
            "test_secret_456",  # Device secret
            {"registered_at": int(time.time() * 1000)}  # User allowed for device
        ]
        
        headers = {**device_headers, "X-User-Id": "specific_user_123"}
        payload = {"spo2": 98, "heart_rate": 75}
        
        response = test_client.post(
            "/api/records/",
            json=payload,
            headers=headers
        )
        assert response.status_code == 200
    
    def test_get_records_success(self, test_client, mock_firebase, auth_headers):
        """Test successful retrieval of user records."""
        # Mock user records
        mock_records = {
            "record1": {
                "spo2": 98,
                "heart_rate": 75,
                "ts": 1700000000000,
                "userId": "test_user_123",
                "device_id": "test_device_123"
            },
            "record2": {
                "spo2": 97,
                "heart_rate": 78,
                "ts": 1700001000000,
                "userId": "test_user_123",
                "device_id": "test_device_123"
            }
        }
        mock_firebase["ref"].get.return_value = mock_records
        
        response = test_client.get(
            "/api/records/",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all("id" in record for record in data)
        # Should be sorted by timestamp descending
        assert data[0]["ts"] >= data[1]["ts"]
    
    def test_get_records_empty(self, test_client, mock_firebase, auth_headers):
        """Test retrieval when user has no records."""
        mock_firebase["ref"].get.return_value = None
        
        response = test_client.get(
            "/api/records/",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data == []
    
    def test_get_records_with_limit(self, test_client, mock_firebase, auth_headers):
        """Test retrieval with custom limit."""
        mock_records = {f"record{i}": {
            "spo2": 98,
            "heart_rate": 75,
            "ts": 1700000000000 + i,
            "userId": "test_user_123"
        } for i in range(10)}
        
        mock_firebase["ref"].get.return_value = mock_records
        
        response = test_client.get(
            "/api/records/?limit=5",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
    
    def test_check_records_auth(self, test_client, mock_firebase, auth_headers):
        """Test auth check endpoint."""
        response = test_client.get(
            "/api/records/check-auth",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert data["uid"] == "test_user_123"
        assert data["email"] == "test@example.com"
    
    def test_register_device_success(self, test_client, mock_firebase, auth_headers):
        """Test successful device registration."""
        # Mock existing device with secret
        existing_device = {
            "secret": "device_secret_123"
        }
        mock_firebase["ref"].get.side_effect = [
            existing_device,  # Device exists
            None  # User not yet registered
        ]
        
        payload = {
            "device_id": "new_device_123",
            "device_secret": "device_secret_123"
        }
        
        response = test_client.post(
            "/api/records/device/register",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "registered successfully" in data["message"]
    
    def test_register_device_not_found(self, test_client, mock_firebase, auth_headers):
        """Test device registration when device doesn't exist."""
        mock_firebase["ref"].get.return_value = None
        
        payload = {
            "device_id": "nonexistent_device",
            "device_secret": "some_secret"
        }
        
        response = test_client.post(
            "/api/records/device/register",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 404
        assert "Device not found" in response.json()["detail"]
    
    def test_register_device_invalid_secret(self, test_client, mock_firebase, auth_headers):
        """Test device registration with wrong secret."""
        existing_device = {"secret": "correct_secret"}
        mock_firebase["ref"].get.return_value = existing_device
        
        payload = {
            "device_id": "test_device",
            "device_secret": "wrong_secret"
        }
        
        response = test_client.post(
            "/api/records/device/register",
            json=payload,
            headers=auth_headers
        )
        assert response.status_code == 401
        assert "Invalid device credentials" in response.json()["detail"]
    
    def test_register_device_already_registered(self, test_client, mock_firebase, auth_headers):
        """Test device registration when already registered."""
        existing_device = {"secret": "device_secret_123"}
        existing_registration = {"registered_at": int(time.time() * 1000)}
        
        mock_firebase["ref"].get.side_effect = [
            existing_device,
            existing_registration
        ]
        
        payload = {
            "device_id": "test_device",
            "device_secret": "device_secret_123"
        }
        
        response = test_client.post(
            "/api/records/device/register",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "already registered" in data["message"]
    
    def test_get_user_devices(self, test_client, mock_firebase, auth_headers):
        """Test getting user's registered devices."""
        # Mock legacy device
        all_devices = {
            "device1": {
                "user_id": "test_user_123",
                "registered_at": int(time.time() * 1000)
            }
        }
        
        # Mock multi-user devices
        all_device_users = {
            "device2": {
                "test_user_123": {
                    "registered_at": int(time.time() * 1000)
                }
            }
        }
        
        mock_firebase["ref"].get.side_effect = [all_devices, all_device_users]
        
        response = test_client.get(
            "/api/records/user/devices",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "devices" in data
        assert len(data["devices"]) >= 1
    
    @patch('firebase_admin.auth.get_user_by_email')
    def test_add_user_to_device_success(self, mock_get_user, test_client, mock_firebase, auth_headers):
        """Test adding user to device successfully."""
        # Mock user lookup
        mock_user = Mock()
        mock_user.uid = "target_user_123"
        mock_get_user.return_value = mock_user
        
        # Mock device and permissions
        device_info = {"secret": "device_secret_123"}
        current_user_access = {"registered_at": int(time.time() * 1000)}
        
        mock_firebase["ref"].get.side_effect = [
            device_info,
            current_user_access,
            None  # Target user not yet registered
        ]
        
        payload = {
            "user_email": "target@example.com",
            "device_secret": "device_secret_123"
        }
        
        response = test_client.post(
            "/api/records/device/test_device/add-user",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "added to device successfully" in data["message"]
    
    def test_remove_user_from_device_success(self, test_client, mock_firebase, auth_headers):
        """Test removing user from device successfully."""
        device_info = {"secret": "device_secret"}
        current_user_access = {"registered_at": int(time.time() * 1000)}
        all_device_users = {
            "test_user_123": {"registered_at": int(time.time() * 1000)},
            "target_user_123": {"registered_at": int(time.time() * 1000)}
        }
        target_user_access = {"registered_at": int(time.time() * 1000)}
        
        mock_firebase["ref"].get.side_effect = [
            device_info,
            current_user_access,
            all_device_users,
            target_user_access
        ]
        
        response = test_client.delete(
            "/api/records/device/test_device/remove-user/target_user_123",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "removed from device successfully" in data["message"]
    
    @patch('firebase_admin.auth.get_user')
    def test_get_device_users_success(self, mock_get_user, test_client, mock_firebase, auth_headers):
        """Test getting device users successfully."""
        # Mock user info lookup
        mock_user = Mock()
        mock_user.email = "user@example.com"
        mock_get_user.return_value = mock_user
        
        device_info = {"secret": "device_secret"}
        current_user_access = {"registered_at": int(time.time() * 1000)}
        device_users = {
            "user_123": {
                "registered_at": int(time.time() * 1000)
            }
        }
        
        mock_firebase["ref"].get.side_effect = [
            device_info,
            current_user_access,
            device_users
        ]
        
        response = test_client.get(
            "/api/records/device/test_device/users",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert data["device_id"] == "test_device"
