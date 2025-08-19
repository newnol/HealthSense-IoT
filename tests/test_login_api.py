from fastapi import HTTPException

from api.login import get_login_verifier


def test_login_success(client):
    client.app.dependency_overrides[get_login_verifier] = lambda: (
        lambda email, password: "uid123"
    )
    res = client.post("/api/login", json={"email": "u@example.com", "password": "pw"})
    assert res.status_code == 200
    assert res.json()["uid"] == "uid123"
    client.app.dependency_overrides.pop(get_login_verifier, None)


def test_login_failure(client):
    def fail_login(email, password):  # noqa: ARG001
        raise HTTPException(status_code=400, detail="Invalid credentials")

    client.app.dependency_overrides[get_login_verifier] = lambda: fail_login
    res = client.post("/api/login", json={"email": "u@example.com", "password": "wrong"})
    assert res.status_code == 400
    body = res.json()
    assert "detail" in body
    client.app.dependency_overrides.pop(get_login_verifier, None)
