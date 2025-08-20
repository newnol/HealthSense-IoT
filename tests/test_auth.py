"""Tests for auth API endpoints."""
import pytest
from unittest.mock import patch, Mock
from fastapi import HTTPException


class TestAuthEndpoints:
    """Test authentication endpoints."""
    
    def test_verify_token_success(self, test_client, mock_firebase):
        """Test successful token verification."""
        response = test_client.get(
            "/api/auth/verify",
            headers={"Authorization": "Bearer valid_token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["uid"] == "test_user_123"
        assert data["email"] == "test@example.com"
        assert data["verified"] is True
        assert data["admin"] is False
    
    def test_verify_token_missing_header(self, test_client):
        """Test token verification with missing auth header."""
        response = test_client.get("/api/auth/verify")
        assert response.status_code == 401
        assert "Missing or invalid authorization header" in response.json()["detail"]
    
    def test_verify_token_invalid_format(self, test_client):
        """Test token verification with invalid header format."""
        response = test_client.get(
            "/api/auth/verify",
            headers={"Authorization": "InvalidToken"}
        )
        assert response.status_code == 401
    
    def test_verify_token_invalid_token(self, test_client, mock_firebase):
        """Test token verification with invalid token."""
        mock_firebase["verify_token"].side_effect = Exception("Invalid token")
        
        response = test_client.get(
            "/api/auth/verify",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]
    
    @patch('firebase_admin.auth.list_users')
    def test_get_user_roles_admin_success(self, mock_list_users, test_client, admin_user_token):
        """Test getting user roles as admin."""
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
        
        response = test_client.get(
            "/api/auth/user-roles",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) == 1
        assert data["users"][0]["uid"] == "user_123"
        assert data["users"][0]["admin"] is False
    
    def test_get_user_roles_non_admin(self, test_client, mock_firebase):
        """Test getting user roles as non-admin user."""
        response = test_client.get(
            "/api/auth/user-roles",
            headers={"Authorization": "Bearer user_token"}
        )
        assert response.status_code == 403
        assert "Admin privileges required" in response.json()["detail"]
    
    @patch('firebase_admin.auth.get_user_by_email')
    def test_get_user_by_email_success(self, mock_get_user, test_client, admin_user_token):
        """Test getting user by email as admin."""
        mock_user = Mock()
        mock_user.uid = "user_123"
        mock_user.email = "test@example.com"
        mock_user.display_name = "Test User"
        mock_user.disabled = False
        mock_user.email_verified = True
        mock_user.custom_claims = {"admin": False}
        mock_user.user_metadata = Mock()
        mock_user.user_metadata.creation_timestamp = 1700000000
        mock_user.user_metadata.last_sign_in_timestamp = 1700001000
        mock_get_user.return_value = mock_user
        
        response = test_client.get(
            "/api/auth/user/test@example.com",
            headers={"Authorization": "Bearer admin_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["uid"] == "user_123"
        assert data["email"] == "test@example.com"
    
    @patch('firebase_admin.auth.get_user_by_email')
    def test_get_user_by_email_not_found(self, mock_get_user, test_client, admin_user_token):
        """Test getting user by email when user not found."""
        from firebase_admin.auth import UserNotFoundError
        mock_get_user.side_effect = UserNotFoundError("User not found")
        
        response = test_client.get(
            "/api/auth/user/nonexistent@example.com",
            headers={"Authorization": "Bearer admin_token"}
        )
        assert response.status_code == 404
    
    @patch('firebase_admin.auth.set_custom_user_claims')
    def test_set_admin_claim_success(self, mock_set_claims, test_client, admin_user_token):
        """Test setting admin claim successfully."""
        response = test_client.post(
            "/api/auth/set-admin-claim",
            headers={"Authorization": "Bearer admin_token"},
            json={"uid": "user_123", "admin": True}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        mock_set_claims.assert_called_once_with("user_123", {"admin": True})
    
    def test_set_admin_claim_missing_uid(self, test_client, admin_user_token):
        """Test setting admin claim with missing UID."""
        response = test_client.post(
            "/api/auth/set-admin-claim",
            headers={"Authorization": "Bearer admin_token"},
            json={"admin": True}
        )
        assert response.status_code == 400
        assert "Missing user UID" in response.json()["detail"]
    
    @patch('firebase_admin.auth.get_user_by_email')
    @patch('firebase_admin.auth.set_custom_user_claims')
    def test_set_admin_claim_by_email_success(self, mock_set_claims, mock_get_user, test_client, admin_user_token):
        """Test setting admin claim by email successfully."""
        mock_user = Mock()
        mock_user.uid = "user_123"
        mock_get_user.return_value = mock_user
        
        response = test_client.post(
            "/api/auth/set-admin-claim-by-email",
            headers={"Authorization": "Bearer admin_token"},
            json={"email": "test@example.com", "admin": True}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["uid"] == "user_123"
        mock_set_claims.assert_called_once_with("user_123", {"admin": True})
