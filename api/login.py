from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Callable
import os
import requests

router = APIRouter(prefix="/api")

class LoginRequest(BaseModel):
    email: str
    password: str

def firebase_email_password_login(email: str, password: str) -> str:
    api_key = os.environ.get("NEXT_PUBLIC_FIREBASE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing Firebase API key")
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    payload = {"email": email, "password": password, "returnSecureToken": True}
    try:
        resp = requests.post(url, json=payload, timeout=10)
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail="Authentication service unavailable") from e
    if resp.status_code != 200:
        try:
            message = resp.json().get("error", {}).get("message", "Invalid credentials")
        except Exception:
            message = "Invalid credentials"
        raise HTTPException(status_code=400, detail=message)
    data = resp.json()
    uid = data.get("localId")
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid response from auth server")
    return uid

def get_login_verifier() -> Callable[[str, str], str]:
    return firebase_email_password_login

@router.post("/login")
async def login(payload: LoginRequest, verifier: Callable[[str, str], str] = Depends(get_login_verifier)):
    uid = verifier(payload.email, payload.password)
    return {"uid": uid}
