"""Tests for command API endpoints."""
import pytest
from unittest.mock import patch, Mock


class TestCommandEndpoints:
    """Test device command endpoints."""
    
    def test_get_command_success(self, test_client, mock_firebase, device_headers):
        """Test successful command retrieval."""
        # Mock device verification
        mock_firebase["ref"].get.side_effect = [
            "test_secret_456",  # Device secret verification
            {"action": "blink", "pattern": [1, 0, 1, 0]}  # Command data
        ]
        
        response = test_client.get(
            "/api/command/test_device_123",
            headers=device_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "blink"
        assert data["pattern"] == [1, 0, 1, 0]
    
    def test_get_command_unauthorized(self, test_client, mock_firebase):
        """Test command retrieval with wrong device secret."""
        mock_firebase["ref"].get.return_value = "correct_secret"
        
        headers = {
            "X-Device-Id": "test_device_123",
            "X-Device-Secret": "wrong_secret"
        }
        
        response = test_client.get(
            "/api/command/test_device_123",
            headers=headers
        )
        
        assert response.status_code == 401
        assert "Unauthorized" in response.json()["detail"]
    
    def test_get_command_device_id_mismatch(self, test_client, mock_firebase):
        """Test command retrieval with device ID mismatch."""
        mock_firebase["ref"].get.return_value = "test_secret_456"
        
        headers = {
            "X-Device-Id": "different_device",
            "X-Device-Secret": "test_secret_456"
        }
        
        response = test_client.get(
            "/api/command/test_device_123",  # Different from header
            headers=headers
        )
        
        assert response.status_code == 403
        assert "Forbidden" in response.json()["detail"]
    
    def test_get_command_no_command_exists(self, test_client, mock_firebase, device_headers):
        """Test command retrieval when no command exists."""
        mock_firebase["ref"].get.side_effect = [
            "test_secret_456",  # Device secret verification
            None  # No command exists
        ]
        
        response = test_client.get(
            "/api/command/test_device_123",
            headers=device_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["action"] is None
        assert data["pattern"] == []
    
    def test_get_command_missing_headers(self, test_client):
        """Test command retrieval with missing device headers."""
        response = test_client.get("/api/command/test_device_123")
        
        assert response.status_code == 422  # Validation error for missing headers
    
    def test_post_command_success(self, test_client, mock_firebase, device_headers):
        """Test successful command posting."""
        mock_firebase["ref"].get.return_value = "test_secret_456"  # Device verification
        
        payload = {
            "action": "pulse",
            "pattern": [1, 1, 0, 1, 0]
        }
        
        response = test_client.post(
            "/api/command/",
            json=payload,
            headers=device_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["device_id"] == "test_device_123"
    
    def test_post_command_unauthorized(self, test_client, mock_firebase):
        """Test command posting with wrong device secret."""
        mock_firebase["ref"].get.return_value = "correct_secret"
        
        headers = {
            "X-Device-Id": "test_device_123",
            "X-Device-Secret": "wrong_secret"
        }
        
        payload = {"action": "blink", "pattern": [1, 0]}
        
        response = test_client.post(
            "/api/command/",
            json=payload,
            headers=headers
        )
        
        assert response.status_code == 401
        assert "Unauthorized" in response.json()["detail"]
    
    def test_post_command_minimal_payload(self, test_client, mock_firebase, device_headers):
        """Test command posting with minimal payload."""
        mock_firebase["ref"].get.return_value = "test_secret_456"
        
        payload = {"action": "stop"}  # No pattern provided
        
        response = test_client.post(
            "/api/command/",
            json=payload,
            headers=device_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
    
    def test_post_command_empty_payload(self, test_client, mock_firebase, device_headers):
        """Test command posting with empty payload."""
        mock_firebase["ref"].get.return_value = "test_secret_456"
        
        payload = {}  # Empty payload
        
        response = test_client.post(
            "/api/command/",
            json=payload,
            headers=device_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
    
    def test_post_command_null_action(self, test_client, mock_firebase, device_headers):
        """Test command posting with null action."""
        mock_firebase["ref"].get.return_value = "test_secret_456"
        
        payload = {
            "action": None,
            "pattern": [1, 0, 1]
        }
        
        response = test_client.post(
            "/api/command/",
            json=payload,
            headers=device_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
    
    def test_post_command_missing_headers(self, test_client):
        """Test command posting with missing device headers."""
        payload = {"action": "blink", "pattern": [1, 0]}
        
        response = test_client.post(
            "/api/command/",
            json=payload
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_command_endpoints_device_verification(self, test_client, mock_firebase):
        """Test that both command endpoints verify device credentials."""
        # Test with no device in database
        mock_firebase["ref"].get.return_value = None
        
        headers = {
            "X-Device-Id": "nonexistent_device",
            "X-Device-Secret": "any_secret"
        }
        
        # GET command
        response = test_client.get(
            "/api/command/nonexistent_device",
            headers=headers
        )
        assert response.status_code == 401
        
        # POST command
        response = test_client.post(
            "/api/command/",
            json={"action": "test"},
            headers=headers
        )
        assert response.status_code == 401
    
    def test_command_pattern_types(self, test_client, mock_firebase, device_headers):
        """Test command posting with different pattern types."""
        mock_firebase["ref"].get.return_value = "test_secret_456"
        
        test_patterns = [
            [],  # Empty list
            [1],  # Single element
            [1, 0, 1, 0, 1],  # Multiple elements
            [0, 0, 0],  # All zeros
            [1, 1, 1],  # All ones
        ]
        
        for pattern in test_patterns:
            payload = {
                "action": "test_pattern",
                "pattern": pattern
            }
            
            response = test_client.post(
                "/api/command/",
                json=payload,
                headers=device_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
    
    def test_command_action_types(self, test_client, mock_firebase, device_headers):
        """Test command posting with different action types."""
        mock_firebase["ref"].get.return_value = "test_secret_456"
        
        test_actions = [
            "blink",
            "pulse",
            "solid",
            "off",
            "custom_action",
            "",  # Empty string
        ]
        
        for action in test_actions:
            payload = {
                "action": action,
                "pattern": [1, 0]
            }
            
            response = test_client.post(
                "/api/command/",
                json=payload,
                headers=device_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
