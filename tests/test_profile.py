"""Tests for profile API endpoints."""
import pytest
from unittest.mock import patch
from datetime import datetime


class TestProfileEndpoints:
    """Test user profile endpoints."""
    
    def test_create_profile_success(self, test_client, mock_firebase, auth_headers, sample_user_profile):
        """Test successful profile creation."""
        response = test_client.post(
            "/api/profile/",
            json=sample_user_profile,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["message"] == "Profile created successfully"
        assert "profile" in data
        assert data["profile"]["year_of_birth"] == 1990
        assert data["profile"]["age"] == datetime.now().year - 1990
    
    def test_create_profile_invalid_timezone(self, test_client, mock_firebase, auth_headers):
        """Test profile creation with invalid timezone."""
        invalid_profile = {
            "year_of_birth": 1990,
            "sex": "male",
            "height": 175.0,
            "weight": 70.0,
            "timezone": "Invalid/Timezone"
        }
        
        response = test_client.post(
            "/api/profile/",
            json=invalid_profile,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Invalid timezone" in response.json()["detail"]
    
    def test_create_profile_invalid_data(self, test_client, mock_firebase, auth_headers):
        """Test profile creation with invalid data."""
        invalid_profile = {
            "year_of_birth": 2050,  # Future year
            "sex": "invalid",  # Invalid sex
            "height": -10,  # Negative height
            "weight": 0,  # Zero weight
            "timezone": "Asia/Ho_Chi_Minh"
        }
        
        response = test_client.post(
            "/api/profile/",
            json=invalid_profile,
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_get_profile_success(self, test_client, mock_firebase, auth_headers, sample_user_profile):
        """Test successful profile retrieval."""
        # Mock existing profile
        profile_data = {
            **sample_user_profile,
            "age": datetime.now().year - sample_user_profile["year_of_birth"],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        mock_firebase["ref"].get.return_value = profile_data
        
        response = test_client.get(
            "/api/profile/",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "profile" in data
        assert data["profile"]["year_of_birth"] == 1990
    
    def test_get_profile_not_found(self, test_client, mock_firebase, auth_headers):
        """Test profile retrieval when profile doesn't exist."""
        mock_firebase["ref"].get.return_value = None
        
        response = test_client.get(
            "/api/profile/",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Profile not found" in response.json()["detail"]
    
    def test_update_profile_success(self, test_client, mock_firebase, auth_headers, sample_user_profile):
        """Test successful profile update."""
        # Mock existing profile
        existing_profile = {
            **sample_user_profile,
            "age": 33,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        mock_firebase["ref"].get.side_effect = [
            existing_profile,  # First call for checking existence
            {**existing_profile, "weight": 75.0}  # Second call for returning updated profile
        ]
        
        update_data = {"weight": 75.0}
        
        response = test_client.put(
            "/api/profile/",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["message"] == "Profile updated successfully"
    
    def test_update_profile_not_found(self, test_client, mock_firebase, auth_headers):
        """Test profile update when profile doesn't exist."""
        mock_firebase["ref"].get.return_value = None
        
        update_data = {"weight": 75.0}
        
        response = test_client.put(
            "/api/profile/",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Profile not found" in response.json()["detail"]
    
    def test_update_profile_with_year_of_birth(self, test_client, mock_firebase, auth_headers, sample_user_profile):
        """Test profile update with year_of_birth changes age."""
        existing_profile = {
            **sample_user_profile,
            "age": 33,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        new_age = datetime.now().year - 1985
        updated_profile = {
            **existing_profile,
            "year_of_birth": 1985,
            "age": new_age
        }
        
        mock_firebase["ref"].get.side_effect = [
            existing_profile,
            updated_profile
        ]
        
        update_data = {"year_of_birth": 1985}
        
        response = test_client.put(
            "/api/profile/",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["profile"]["age"] == new_age
    
    def test_update_profile_invalid_timezone(self, test_client, mock_firebase, auth_headers, sample_user_profile):
        """Test profile update with invalid timezone."""
        mock_firebase["ref"].get.return_value = sample_user_profile
        
        update_data = {"timezone": "Invalid/Timezone"}
        
        response = test_client.put(
            "/api/profile/",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Invalid timezone" in response.json()["detail"]
    
    def test_delete_profile_success(self, test_client, mock_firebase, auth_headers, sample_user_profile):
        """Test successful profile deletion."""
        mock_firebase["ref"].get.return_value = sample_user_profile
        
        response = test_client.delete(
            "/api/profile/",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["message"] == "Profile deleted successfully"
    
    def test_delete_profile_not_found(self, test_client, mock_firebase, auth_headers):
        """Test profile deletion when profile doesn't exist."""
        mock_firebase["ref"].get.return_value = None
        
        response = test_client.delete(
            "/api/profile/",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "Profile not found" in response.json()["detail"]
    
    def test_get_timezones(self, test_client):
        """Test getting available timezones."""
        response = test_client.get("/api/profile/timezones")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "timezones" in data
        assert len(data["timezones"]) > 0
        
        # Check timezone format
        timezone = data["timezones"][0]
        assert "value" in timezone
        assert "label" in timezone
        assert "Asia/Ho_Chi_Minh" in [tz["value"] for tz in data["timezones"]]
    
    def test_profile_validation_constraints(self, test_client, mock_firebase, auth_headers):
        """Test profile validation constraints."""
        # Test various invalid inputs
        invalid_profiles = [
            {"year_of_birth": 1800, "sex": "male", "height": 175, "weight": 70, "timezone": "Asia/Ho_Chi_Minh"},  # Too old
            {"year_of_birth": 1990, "sex": "invalid", "height": 175, "weight": 70, "timezone": "Asia/Ho_Chi_Minh"},  # Invalid sex
            {"year_of_birth": 1990, "sex": "male", "height": 0, "weight": 70, "timezone": "Asia/Ho_Chi_Minh"},  # Invalid height
            {"year_of_birth": 1990, "sex": "male", "height": 175, "weight": 0, "timezone": "Asia/Ho_Chi_Minh"},  # Invalid weight
            {"year_of_birth": 1990, "sex": "male", "height": 500, "weight": 70, "timezone": "Asia/Ho_Chi_Minh"},  # Too tall
            {"year_of_birth": 1990, "sex": "male", "height": 175, "weight": 2000, "timezone": "Asia/Ho_Chi_Minh"},  # Too heavy
        ]
        
        for invalid_profile in invalid_profiles:
            response = test_client.post(
                "/api/profile/",
                json=invalid_profile,
                headers=auth_headers
            )
            assert response.status_code == 422  # Validation error
    
    def test_profile_partial_update(self, test_client, mock_firebase, auth_headers, sample_user_profile):
        """Test partial profile update with only some fields."""
        existing_profile = {
            **sample_user_profile,
            "age": 33,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        updated_profile = {
            **existing_profile,
            "height": 180.0,
            "timezone": "Asia/Tokyo"
        }
        
        mock_firebase["ref"].get.side_effect = [
            existing_profile,
            updated_profile
        ]
        
        # Update only height and timezone
        update_data = {
            "height": 180.0,
            "timezone": "Asia/Tokyo"
        }
        
        response = test_client.put(
            "/api/profile/",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        # Other fields should remain unchanged
        assert data["profile"]["weight"] == 70.0  # Original value
        assert data["profile"]["sex"] == "male"  # Original value
