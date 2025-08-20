# api/ai.py
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
import os
import time

from firebase_admin import db

from .auth import verify_firebase_token

router = APIRouter(prefix="/api/ai")


def _configure_genai() -> None:
    """Configure Google Generative AI SDK using env var.

    Looks for GOOGLE_API_KEY or GOOGLE_GENAI_API_KEY.
    """
    import google.generativeai as genai  # lazy import to avoid overhead if unused

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GOOGLE_GENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GOOGLE_API_KEY (or GOOGLE_GENAI_API_KEY)")
    genai.configure(api_key=api_key)


def _fetch_recent_user_records(user_id: str, limit: int = 25) -> List[Dict[str, Any]]:
    """Fetch recent health records for the given user from RTDB."""
    user_records_ref = db.reference(f"/user_records/{user_id}")
    try:
        records = (
            user_records_ref.order_by_child("ts").limit_to_last(limit).get()
        ) or {}
    except Exception:
        records = user_records_ref.get() or {}

    result: List[Dict[str, Any]] = []
    for _, value in records.items():
        if not isinstance(value, dict):
            continue
        result.append({
            "ts": value.get("ts"),
            "heart_rate": value.get("heart_rate") or value.get("bpm"),
            "spo2": value.get("spo2"),
            "device_id": value.get("device_id"),
        })

    result.sort(key=lambda x: x.get("ts", 0), reverse=True)
    return result[:limit]


def _append_chat_and_update_meta(uid: str, session_id: str, user_message: str, ai_reply: str) -> None:
    """Append user and assistant messages to a session and update meta."""
    root_ref = db.reference("/")
    messages_ref = db.reference(f"/ai_chats/{uid}/{session_id}/messages")

    # Reserve keys to do a single multi-path update
    key_user = messages_ref.push({"_tmp": True}).key
    key_ai = messages_ref.push({"_tmp": True}).key
    now_ms = int(time.time() * 1000)

    updates = {
        f"ai_chats/{uid}/{session_id}/messages/{key_user}": {
            "role": "user",
            "content": user_message,
            "ts": now_ms,
        },
        f"ai_chats/{uid}/{session_id}/messages/{key_ai}": {
            "role": "assistant",
            "content": ai_reply,
            "ts": now_ms + 1,
        },
        f"ai_chats/{uid}/{session_id}/meta": {
            "last_updated": now_ms + 1,
            "last_user_message": user_message,
        },
    }
    root_ref.update(updates)


def _load_session_messages(uid: str, session_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    """Load recent messages for a session ordered by push key (chronological)."""
    ref = db.reference(f"/ai_chats/{uid}/{session_id}/messages")
    data = ref.get() or {}
    if not isinstance(data, dict):
        return []
    # Firebase push IDs are chronologically sortable lexicographically
    items = [(k, v) for k, v in data.items() if isinstance(v, dict)]
    items.sort(key=lambda kv: kv[0])
    return [v for _, v in items][-limit:]


def _fetch_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetch user profile if present, return a sanitized dict."""
    data = db.reference(f"/user_profiles/{user_id}").get()
    if not isinstance(data, dict):
        return None
    allowed_keys = {"year_of_birth", "age", "sex", "height", "weight", "timezone", "updated_at"}
    return {k: v for k, v in data.items() if k in allowed_keys}


def _update_session_memory_summary(uid: str, session_id: str, model_obj) -> Optional[str]:
    """Create or refresh a concise memory summary for the session and store it.

    Returns the summary text or None on failure.
    """
    try:
        messages = _load_session_messages(uid, session_id, limit=100)
        if not messages:
            return None
        convo_text = "\n".join([f"{m.get('role')}: {m.get('content')}" for m in messages])
        profile = _fetch_user_profile(uid)
        prompt = (
            "Tóm tắt ngắn gọn nội dung quan trọng của cuộc trò chuyện về sức khỏe.\n"
            "- Nếu có, xét đến hồ sơ (tuổi, giới, chiều cao, cân nặng) để bối cảnh hóa.\n"
            "- Trích xuất các triệu chứng/chỉ số đáng chú ý.\n"
            "- Đề xuất ngắn gọn dạng gạch đầu dòng.\n"
            "- Giới hạn 120-180 từ.\n\n"
            f"Hồ sơ người dùng (nếu có):\n{profile or {}}\n\n"
            f"Cuộc trò chuyện:\n{convo_text}\n\nTóm tắt:"
        )
        response = model_obj.generate_content(prompt)
        summary = (getattr(response, "text", "") or "").strip()
        if not summary:
            return None

        now_ms = int(time.time() * 1000)
        db.reference(f"/ai_memory/{uid}/{session_id}").set({
            "summary": summary,
            "updated_at": now_ms,
        })
        # Also store a pointer to latest summary
        db.reference(f"/ai_memory/{uid}/latest_summary").set({
            "session_id": session_id,
            "summary": summary,
            "updated_at": now_ms,
        })
        return summary
    except Exception:
        return None


@router.post("/chat")
async def chat(req: Request, user = Depends(verify_firebase_token)):
    """Chat with Gemini about user's health status.

    Body: {
      "message": str,
      "history": [{"role": "user"|"assistant", "content": str}] (optional)
    }

    Requires Authorization: Bearer <Firebase ID token>
    """
    body = await req.json()
    message = (body or {}).get("message", "").strip()
    history: List[Dict[str, str]] = (body or {}).get("history", []) or []
    session_id: str = (body or {}).get("session_id") or "default"
    if not message:
        raise HTTPException(400, "Missing 'message'")

    # Configure SDK and model
    try:
        _configure_genai()
        import google.generativeai as genai
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
    except Exception as e:
        raise HTTPException(500, f"AI configuration error: {e}")

    # Prepare context: recent health records and user profile
    user_id = user.get("uid")
    recent = _fetch_recent_user_records(user_id=user_id, limit=25)
    profile = _fetch_user_profile(user_id)

    # Compose prompt
    history_text = "\n".join(
        f"{m.get('role','user')}: {m.get('content','')}" for m in history if isinstance(m, dict)
    )
    prompt = (
        "Bạn là trợ lý sức khỏe thân thiện, trả lời bằng tiếng Việt, súc tích, dễ hiểu.\n"
        "Luôn nhắc đây là thông tin tham khảo, không thay thế tư vấn y khoa.\n"
        "Nếu có, hãy cá nhân hóa khuyến nghị dựa trên tuổi, giới, chiều cao, cân nặng.\n\n"
        "Hồ sơ người dùng (JSON):\n"
        f"{profile or {}}\n\n"
        "Dữ liệu đo gần đây (JSON):\n"
        f"{recent}\n\n"
        "Cuộc hội thoại trước đó (nếu có):\n"
        f"{history_text}\n\n"
        f"Người dùng: {message}\n"
        "Trợ lý:"
    )

    try:
        response = model.generate_content(prompt)
        text = (response.text or "").strip() if hasattr(response, "text") else ""
    except Exception as e:
        raise HTTPException(502, f"AI generation failed: {e}")

    if not text:
        text = (
            "Xin lỗi, tôi chưa thể trả lời ngay bây giờ. Bạn có thể hỏi lại theo cách khác, "
            "hoặc cung cấp thêm thông tin (triệu chứng, thời điểm, chỉ số gần đây)."
        )

    # Persist chat and update memory summary (best effort)
    try:
        _append_chat_and_update_meta(user.get("uid"), session_id, message, text)
        _update_session_memory_summary(user.get("uid"), session_id, model)
    except Exception:
        pass

    return {"reply": text, "session_id": session_id}


@router.get("/memory")
async def get_memory(
    session_id: Optional[str] = Query(default=None),
    user = Depends(verify_firebase_token),
):
    """Return AI memory summary for the user. If session_id is provided, returns that session's summary,
    otherwise returns latest_summary.
    """
    uid = user.get("uid")
    if session_id:
        data = db.reference(f"/ai_memory/{uid}/{session_id}").get() or {}
        return {"session_id": session_id, **data}
    latest = db.reference(f"/ai_memory/{uid}/latest_summary").get() or {}
    return latest


