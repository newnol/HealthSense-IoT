"""Tests for AI API endpoints."""
import pytest
from unittest.mock import patch, Mock


class TestAIEndpoints:
    """Test AI-related endpoints."""
    
    def test_chat_success(self, test_client, mock_firebase, auth_headers, mock_gemini):
        """Test successful AI chat."""
        # Mock user records and profile
        mock_records = [
            {"spo2": 98, "heart_rate": 75, "ts": 1700000000000, "device_id": "device1"}
        ]
        mock_profile = {"age": 30, "sex": "male", "height": 175, "weight": 70}
        
        with patch('api.ai._fetch_recent_user_records', return_value=mock_records), \
             patch('api.ai._fetch_user_profile', return_value=mock_profile):
            
            payload = {
                "message": "Tình trạng sức khỏe của tôi như thế nào?",
                "session_id": "test_session"
            }
            
            response = test_client.post(
                "/api/ai/chat",
                json=payload,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "reply" in data
            assert "session_id" in data
            assert data["session_id"] == "test_session"
    
    def test_chat_missing_message(self, test_client, mock_firebase, auth_headers):
        """Test chat with missing message."""
        payload = {"session_id": "test_session"}
        
        response = test_client.post(
            "/api/ai/chat",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Missing 'message'" in response.json()["detail"]
    
    def test_chat_empty_message(self, test_client, mock_firebase, auth_headers):
        """Test chat with empty message."""
        payload = {
            "message": "   ",  # Whitespace only
            "session_id": "test_session"
        }
        
        response = test_client.post(
            "/api/ai/chat",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 400
        assert "Missing 'message'" in response.json()["detail"]
    
    def test_chat_with_history(self, test_client, mock_firebase, auth_headers, mock_gemini):
        """Test chat with conversation history."""
        with patch('api.ai._fetch_recent_user_records', return_value=[]), \
             patch('api.ai._fetch_user_profile', return_value={}):
            
            payload = {
                "message": "Cảm ơn bạn",
                "history": [
                    {"role": "user", "content": "Xin chào"},
                    {"role": "assistant", "content": "Xin chào! Tôi có thể giúp gì cho bạn?"}
                ],
                "session_id": "test_session"
            }
            
            response = test_client.post(
                "/api/ai/chat",
                json=payload,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "reply" in data
    
    @patch.dict('os.environ', {}, clear=True)
    def test_chat_missing_api_key(self, test_client, mock_firebase, auth_headers):
        """Test chat when Google API key is missing."""
        payload = {
            "message": "Test message",
            "session_id": "test_session"
        }
        
        response = test_client.post(
            "/api/ai/chat",
            json=payload,
            headers=auth_headers
        )
        
        assert response.status_code == 500
        assert "AI configuration error" in response.json()["detail"]
    
    def test_chat_ai_generation_failure(self, test_client, mock_firebase, auth_headers, mock_gemini):
        """Test chat when AI generation fails."""
        mock_gemini["model"].return_value.generate_content.side_effect = Exception("AI Error")
        
        with patch('api.ai._fetch_recent_user_records', return_value=[]), \
             patch('api.ai._fetch_user_profile', return_value={}):
            
            payload = {
                "message": "Test message",
                "session_id": "test_session"
            }
            
            response = test_client.post(
                "/api/ai/chat",
                json=payload,
                headers=auth_headers
            )
            
            assert response.status_code == 502
            assert "AI generation failed" in response.json()["detail"]
    
    def test_chat_empty_ai_response(self, test_client, mock_firebase, auth_headers, mock_gemini):
        """Test chat when AI returns empty response."""
        mock_gemini["response"].text = ""  # Empty response
        
        with patch('api.ai._fetch_recent_user_records', return_value=[]), \
             patch('api.ai._fetch_user_profile', return_value={}):
            
            payload = {
                "message": "Test message",
                "session_id": "test_session"
            }
            
            response = test_client.post(
                "/api/ai/chat",
                json=payload,
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "Xin lỗi, tôi chưa thể trả lời" in data["reply"]
    
    def test_sumerize_with_user_id_header(self, test_client, mock_gemini):
        """Test summarize endpoint with X-User-Id header."""
        with patch('api.ai._fetch_user_profile', return_value={"age": 30, "sex": "male"}), \
             patch('api.ai._fetch_recent_user_records', return_value=[
                 {"spo2": 98, "heart_rate": 75, "ts": 1700000000000}
             ]):
            
            headers = {"X-User-Id": "test_user_123"}
            
            response = test_client.post(
                "/api/ai/sumerize",
                headers=headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "summary" in data
            assert "profile" in data
            assert "recent" in data
            assert data["user_id"] == "test_user_123"
    
    def test_sumerize_with_query_param(self, test_client, mock_gemini):
        """Test summarize endpoint with user_id query parameter."""
        with patch('api.ai._fetch_user_profile', return_value={}), \
             patch('api.ai._fetch_recent_user_records', return_value=[]):
            
            response = test_client.get(
                "/api/ai/sumerize?user_id=test_user_456"
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["user_id"] == "test_user_456"
    
    def test_sumerize_missing_user_id(self, test_client):
        """Test summarize endpoint without user ID."""
        response = test_client.post("/api/ai/sumerize")
        
        assert response.status_code == 400
        assert "Missing user_id" in response.json()["detail"]
    
    def test_sumerize_ai_failure(self, test_client, mock_gemini):
        """Test summarize when AI generation fails."""
        mock_gemini["model"].return_value.generate_content.side_effect = Exception("AI Error")
        
        with patch('api.ai._fetch_user_profile', return_value={}), \
             patch('api.ai._fetch_recent_user_records', return_value=[]):
            
            headers = {"X-User-Id": "test_user_123"}
            
            response = test_client.post(
                "/api/ai/sumerize",
                headers=headers
            )
            
            assert response.status_code == 502
            assert "AI generation failed" in response.json()["detail"]
    
    def test_sumerize_empty_response(self, test_client, mock_gemini):
        """Test summarize when AI returns empty response."""
        mock_gemini["response"].text = ""
        
        with patch('api.ai._fetch_user_profile', return_value={}), \
             patch('api.ai._fetch_recent_user_records', return_value=[]):
            
            headers = {"X-User-Id": "test_user_123"}
            
            response = test_client.post(
                "/api/ai/sumerize",
                headers=headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "couldn't generate a summary" in data["summary"]
    
    def test_get_memory_with_session_id(self, test_client, mock_firebase, auth_headers):
        """Test getting memory for specific session."""
        mock_memory = {
            "summary": "Test summary",
            "updated_at": 1700000000000
        }
        mock_firebase["ref"].get.return_value = mock_memory
        
        response = test_client.get(
            "/api/ai/memory?session_id=test_session",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == "test_session"
        assert data["summary"] == "Test summary"
    
    def test_get_memory_latest(self, test_client, mock_firebase, auth_headers):
        """Test getting latest memory summary."""
        mock_latest = {
            "session_id": "latest_session",
            "summary": "Latest summary",
            "updated_at": 1700000000000
        }
        mock_firebase["ref"].get.return_value = mock_latest
        
        response = test_client.get(
            "/api/ai/memory",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == "latest_session"
        assert data["summary"] == "Latest summary"
    
    def test_list_sessions(self, test_client, mock_firebase, auth_headers):
        """Test listing AI chat sessions."""
        mock_sessions = {
            "session1": {
                "meta": {
                    "last_updated": 1700001000000,
                    "last_user_message": "Hello"
                }
            },
            "session2": {
                "meta": {
                    "last_updated": 1700000000000,
                    "last_user_message": "How are you?"
                }
            }
        }
        
        mock_memory = {
            "session1": {"summary": "Session 1 summary"},
            "session2": {"summary": "Session 2 summary"}
        }
        
        mock_firebase["ref"].get.side_effect = [mock_sessions, mock_memory]
        
        response = test_client.get(
            "/api/ai/sessions",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        # Should be sorted by last_updated descending
        assert data[0]["last_updated"] >= data[1]["last_updated"]
        assert all("id" in session for session in data)
    
    def test_get_messages(self, test_client, mock_firebase, auth_headers):
        """Test getting messages for a session."""
        mock_messages = {
            "msg1": {
                "role": "user",
                "content": "Hello",
                "ts": 1700000000000
            },
            "msg2": {
                "role": "assistant",
                "content": "Hi there!",
                "ts": 1700000001000
            }
        }
        mock_firebase["ref"].get.return_value = mock_messages
        
        response = test_client.get(
            "/api/ai/messages?session_id=test_session",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["role"] == "user"  # Should be in chronological order
        assert data[1]["role"] == "assistant"
    
    def test_get_messages_missing_session_id(self, test_client, mock_firebase, auth_headers):
        """Test getting messages without session ID."""
        response = test_client.get(
            "/api/ai/messages",
            headers=auth_headers
        )
        
        assert response.status_code == 422  # Validation error for missing required param
    
    def test_get_messages_with_limit(self, test_client, mock_firebase, auth_headers):
        """Test getting messages with limit parameter."""
        mock_messages = {f"msg{i}": {
            "role": "user" if i % 2 == 0 else "assistant",
            "content": f"Message {i}",
            "ts": 1700000000000 + i
        } for i in range(10)}
        
        mock_firebase["ref"].get.return_value = mock_messages
        
        response = test_client.get(
            "/api/ai/messages?session_id=test_session&limit=5",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
