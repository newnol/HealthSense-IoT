"""Tests for login API endpoint."""
import pytest
from unittest.mock import patch, Mock
import requests


class TestLoginEndpoint:
    """Test login endpoint."""
    
    @patch('requests.post')
    def test_login_success(self, mock_post, test_client):
        """Test successful login."""
        # Mock successful Firebase response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "localId": "user_123",
            "idToken": "test_id_token",
            "refreshToken": "test_refresh_token"
        }
        mock_post.return_value = mock_response
        
        payload = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["uid"] == "user_123"
        
        # Verify Firebase API was called correctly
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert "signInWithPassword" in call_args[1]["json"]["email"]
    
    @patch('requests.post')
    def test_login_invalid_credentials(self, mock_post, test_client):
        """Test login with invalid credentials."""
        # Mock Firebase error response
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "error": {
                "message": "INVALID_PASSWORD"
            }
        }
        mock_post.return_value = mock_response
        
        payload = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 400
        assert "INVALID_PASSWORD" in response.json()["detail"]
    
    @patch('requests.post')
    def test_login_user_not_found(self, mock_post, test_client):
        """Test login with non-existent user."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "error": {
                "message": "EMAIL_NOT_FOUND"
            }
        }
        mock_post.return_value = mock_response
        
        payload = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 400
        assert "EMAIL_NOT_FOUND" in response.json()["detail"]
    
    @patch('requests.post')
    def test_login_malformed_response(self, mock_post, test_client):
        """Test login with malformed Firebase response."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "idToken": "test_token"
            # Missing localId
        }
        mock_post.return_value = mock_response
        
        payload = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 400
        assert "Invalid response from auth server" in response.json()["detail"]
    
    @patch('requests.post')
    def test_login_network_error(self, mock_post, test_client):
        """Test login with network error."""
        mock_post.side_effect = requests.RequestException("Network error")
        
        payload = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 400
        assert "Authentication service unavailable" in response.json()["detail"]
    
    @patch('requests.post')
    def test_login_timeout(self, mock_post, test_client):
        """Test login with timeout."""
        mock_post.side_effect = requests.Timeout("Request timeout")
        
        payload = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 400
        assert "Authentication service unavailable" in response.json()["detail"]
    
    def test_login_missing_email(self, test_client):
        """Test login with missing email."""
        payload = {"password": "password123"}
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 422  # Validation error
    
    def test_login_missing_password(self, test_client):
        """Test login with missing password."""
        payload = {"email": "test@example.com"}
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 422  # Validation error
    
    def test_login_empty_credentials(self, test_client):
        """Test login with empty credentials."""
        payload = {"email": "", "password": ""}
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 422  # Validation error
    
    def test_login_invalid_email_format(self, test_client):
        """Test login with invalid email format."""
        payload = {
            "email": "invalid-email",
            "password": "password123"
        }
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 422  # Validation error
    
    @patch.dict('os.environ', {}, clear=True)
    def test_login_missing_api_key(self, test_client):
        """Test login when Firebase API key is missing."""
        payload = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 500
        assert "Missing Firebase API key" in response.json()["detail"]
    
    @patch('requests.post')
    def test_login_firebase_error_without_message(self, mock_post, test_client):
        """Test login with Firebase error response without message."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.return_value = {
            "error": {}  # No message field
        }
        mock_post.return_value = mock_response
        
        payload = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 400
        assert "Invalid credentials" in response.json()["detail"]
    
    @patch('requests.post')
    def test_login_firebase_non_json_response(self, mock_post, test_client):
        """Test login with non-JSON Firebase response."""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.json.side_effect = ValueError("Not JSON")
        mock_post.return_value = mock_response
        
        payload = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        response = test_client.post("/api/login", json=payload)
        
        assert response.status_code == 400
        assert "Invalid credentials" in response.json()["detail"]
    
    @patch('requests.post')
    def test_login_with_different_error_codes(self, mock_post, test_client):
        """Test login with various Firebase error codes."""
        error_codes = [
            "EMAIL_NOT_FOUND",
            "INVALID_PASSWORD",
            "USER_DISABLED",
            "TOO_MANY_ATTEMPTS_TRY_LATER",
            "UNKNOWN_ERROR"
        ]
        
        for error_code in error_codes:
            mock_response = Mock()
            mock_response.status_code = 400
            mock_response.json.return_value = {
                "error": {"message": error_code}
            }
            mock_post.return_value = mock_response
            
            payload = {
                "email": "test@example.com",
                "password": "password123"
            }
            
            response = test_client.post("/api/login", json=payload)
            
            assert response.status_code == 400
            assert error_code in response.json()["detail"]
    
    @patch('requests.post')
    def test_login_request_timeout_parameter(self, mock_post, test_client):
        """Test that login request has proper timeout."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"localId": "user_123"}
        mock_post.return_value = mock_response
        
        payload = {
            "email": "test@example.com",
            "password": "password123"
        }
        
        test_client.post("/api/login", json=payload)
        
        # Verify timeout parameter was passed
        call_args = mock_post.call_args
        assert call_args[1]["timeout"] == 10
