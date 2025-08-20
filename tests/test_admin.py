"""Tests for admin API endpoints."""
import pytest
from unittest.mock import patch, Mock


class TestAdminEndpoints:
    """Test admin-only endpoints."""
    
    @patch('firebase_admin.auth.list_users')
    def test_get_all_users_success(self, mock_list_users, test_client, mock_firebase, admin_user_token):
        """Test getting all users as admin."""
        # Mock user data
        mock_user = Mock()
        mock_user.uid = "user_123"
        mock_user.email = "user@example.com"
        mock_user.display_name = "Test User"
        mock_user.disabled = False
        mock_user.email_verified = True
        mock_user.custom_claims = {"admin": False}
        mock_user.user_metadata = Mock()
        mock_user.user_metadata.creation_timestamp = 1700000000
        mock_user.user_metadata.last_sign_in_timestamp = 1700001000
        
        mock_result = Mock()
        mock_result.users = [mock_user]
        mock_result.next_page_token = None
        mock_list_users.return_value = mock_result
        
        # Mock device count query
        mock_firebase["ref"].get.return_value = {"device1": {"user_id": "user_123"}}
        
        response = test_client.get(
            "/api/admin/users",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) == 1
        assert data["users"][0]["uid"] == "user_123"
        assert data["users"][0]["deviceCount"] == 1
    
    def test_get_all_users_non_admin(self, test_client, mock_firebase):
        """Test getting all users as non-admin."""
        response = test_client.get(
            "/api/admin/users",
            headers={"Authorization": "Bearer user_token"}
        )
        assert response.status_code == 403
        assert "Admin privileges required" in response.json()["detail"]
    
    @patch('firebase_admin.auth.update_user')
    @patch('firebase_admin.auth.set_custom_user_claims')
    def test_update_user_success(self, mock_set_claims, mock_update_user, test_client, admin_user_token):
        """Test updating user as admin."""
        payload = {
            "email": "newemail@example.com",
            "displayName": "New Name",
            "disabled": False,
            "admin": True
        }
        
        response = test_client.put(
            "/api/admin/users/user_123",
            json=payload,
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        
        # Verify calls
        mock_update_user.assert_called_once_with(
            "user_123",
            email="newemail@example.com",
            display_name="New Name",
            disabled=False
        )
        mock_set_claims.assert_called_once_with("user_123", {"admin": True})
    
    @patch('firebase_admin.auth.delete_user')
    def test_delete_user_success(self, mock_delete_user, test_client, mock_firebase, admin_user_token):
        """Test deleting user as admin."""
        # Mock user's devices and records
        mock_firebase["ref"].get.side_effect = [
            {"device1": {"user_id": "user_123"}},  # User devices
            {"record1": {"userId": "user_123"}}    # User records
        ]
        
        response = test_client.delete(
            "/api/admin/users/user_123",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "deleted successfully" in data["message"]
        
        mock_delete_user.assert_called_once_with("user_123")
    
    def test_get_all_devices_success(self, test_client, mock_firebase, admin_user_token):
        """Test getting all devices as admin."""
        mock_devices = {
            "device1": {
                "user_id": "user_123",
                "registered_at": 1700000000000
            },
            "device2": {
                "user_id": "user_456",
                "registered_at": 1700001000000
            }
        }
        
        # Mock Firebase calls
        mock_firebase["ref"].get.side_effect = [
            mock_devices,  # All devices
            {"record1": {"ts": 1700002000000}},  # Last record for device1
            {"record2": {"ts": 1700003000000}}   # Last record for device2
        ]
        
        with patch('firebase_admin.auth.get_user') as mock_get_user:
            mock_user = Mock()
            mock_user.email = "user@example.com"
            mock_user.display_name = "Test User"
            mock_get_user.return_value = mock_user
            
            response = test_client.get(
                "/api/admin/devices",
                headers={"Authorization": "Bearer admin_token"}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["devices"]) == 2
        assert data["total"] == 2
        # Should be sorted by registration date descending
        assert data["devices"][0]["registeredAt"] >= data["devices"][1]["registeredAt"]
    
    def test_delete_device_success(self, test_client, mock_firebase, admin_user_token):
        """Test deleting device as admin."""
        response = test_client.delete(
            "/api/admin/devices/device_123",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "deleted successfully" in data["message"]
    
    def test_get_user_profile_success(self, test_client, mock_firebase, admin_user_token, sample_user_profile):
        """Test getting user profile as admin."""
        mock_firebase["ref"].get.return_value = sample_user_profile
        
        response = test_client.get(
            "/api/admin/users/user_123/profile",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "profile" in data
        assert data["profile"]["year_of_birth"] == 1990
    
    def test_get_user_profile_not_found(self, test_client, mock_firebase, admin_user_token):
        """Test getting user profile when not found."""
        mock_firebase["ref"].get.return_value = None
        
        response = test_client.get(
            "/api/admin/users/user_123/profile",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 404
        assert "Profile not found" in response.json()["detail"]
    
    def test_get_user_devices_success(self, test_client, mock_firebase, admin_user_token):
        """Test getting user devices as admin."""
        mock_user_devices = {
            "device1": {"registered_at": 1700000000000},
            "device2": {"registered_at": 1700001000000}
        }
        
        mock_firebase["ref"].get.side_effect = [
            mock_user_devices,  # User devices
            {"record1": {"ts": 1700002000000}},  # Last record for device1
            {"record2": {"ts": 1700003000000}}   # Last record for device2
        ]
        
        response = test_client.get(
            "/api/admin/users/user_123/devices",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["devices"]) == 2
        assert data["total"] == 2
        assert all("deviceId" in device for device in data["devices"])
    
    def test_get_user_devices_empty(self, test_client, mock_firebase, admin_user_token):
        """Test getting user devices when user has no devices."""
        mock_firebase["ref"].get.return_value = None
        
        response = test_client.get(
            "/api/admin/users/user_123/devices",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["devices"] == []
        assert data["total"] == 0
    
    @patch('firebase_admin.auth.list_users')
    def test_get_admin_stats_success(self, mock_list_users, test_client, mock_firebase, admin_user_token):
        """Test getting admin statistics."""
        # Mock users
        mock_users = [Mock() for _ in range(5)]
        mock_list_users.return_value.iterate_all.return_value = mock_users
        
        # Mock devices
        mock_devices = {f"device{i}": {} for i in range(3)}
        mock_firebase["ref"].get.side_effect = [mock_devices, {"record1": {}}]
        
        response = test_client.get(
            "/api/admin/stats",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["userCount"] == 5
        assert data["deviceCount"] == 3
        assert "totalRecords" in data
        assert "timestamp" in data
    
    def test_admin_endpoints_require_admin(self, test_client, mock_firebase):
        """Test that admin endpoints require admin privileges."""
        user_headers = {"Authorization": "Bearer user_token"}
        
        admin_endpoints = [
            ("GET", "/api/admin/users"),
            ("PUT", "/api/admin/users/user_123"),
            ("DELETE", "/api/admin/users/user_123"),
            ("GET", "/api/admin/devices"),
            ("DELETE", "/api/admin/devices/device_123"),
            ("GET", "/api/admin/users/user_123/profile"),
            ("GET", "/api/admin/users/user_123/devices"),
            ("GET", "/api/admin/stats"),
        ]
        
        for method, endpoint in admin_endpoints:
            if method == "GET":
                response = test_client.get(endpoint, headers=user_headers)
            elif method == "PUT":
                response = test_client.put(endpoint, json={}, headers=user_headers)
            elif method == "DELETE":
                response = test_client.delete(endpoint, headers=user_headers)
            
            assert response.status_code == 403
            assert "Admin privileges required" in response.json()["detail"]
    
    def test_get_all_users_with_pagination(self, test_client, mock_firebase, admin_user_token):
        """Test getting users with pagination parameters."""
        with patch('firebase_admin.auth.list_users') as mock_list_users:
            mock_result = Mock()
            mock_result.users = []
            mock_result.next_page_token = "next_token"
            mock_list_users.return_value = mock_result
            
            response = test_client.get(
                "/api/admin/users?limit=50&page_token=some_token",
                headers={"Authorization": "Bearer admin_token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "nextPageToken" in data
            
            # Verify pagination parameters were passed
            mock_list_users.assert_called_once_with(max_results=50, page_token="some_token")
    
    def test_update_user_partial_update(self, test_client, admin_user_token):
        """Test updating user with only some fields."""
        with patch('firebase_admin.auth.update_user') as mock_update:
            payload = {"email": "newemail@example.com"}  # Only update email
            
            response = test_client.put(
                "/api/admin/users/user_123",
                json=payload,
                headers={"Authorization": "Bearer admin_token"}
            )
            
            assert response.status_code == 200
            # Should only update email, not other fields
            mock_update.assert_called_once_with("user_123", email="newemail@example.com")
