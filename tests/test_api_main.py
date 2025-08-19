from typing import Any, Dict


def _reset_store(store: Dict[str, Any]) -> None:
    store.setdefault("devices", {})
    store.setdefault("records", {})
    store.setdefault("commands", {})
    store["devices"].clear()
    store["records"].clear()
    store["commands"].clear()


def test_auth_verify(client):  # noqa: ANN001
    res = client.get("/api/auth/verify")
    assert res.status_code == 200
    body = res.json()
    assert body["uid"] == "user123"
    assert body["verified"] is True
    assert body["admin"] is True


def test_records_post_and_get(client, fake_store):  # noqa: ANN001
    _reset_store(fake_store)

    # Seed device owner for dev1
    fake_store["devices"]["dev1"] = {
        "secret": "s1",
        "user_id": "user123",
        "registered_at": 1111,
    }

    # Post a record (device_id provided by dependency override -> dev1)
    payload = {"spo2": 98, "heart_rate": 70}
    res = client.post("/api/records/", json=payload)
    assert res.status_code == 200
    key = res.json()["key"]
    # Check it exists with augmented fields
    record = fake_store["records"][key]
    assert record["device_id"] == "dev1"
    assert record["userId"] == "user123"

    # GET records for current user
    res = client.get("/api/records/?limit=100")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert any(item["id"] == key for item in items)


def test_records_register_device(client, fake_store):  # noqa: ANN001
    _reset_store(fake_store)
    fake_store["devices"]["dev2"] = {"secret": "sec2"}
    res = client.post(
        "/api/records/device/register",
        json={"device_id": "dev2", "device_secret": "sec2"},
    )
    assert res.status_code == 200
    assert fake_store["devices"]["dev2"]["user_id"] == "user123"


def test_command_default_then_set(client, fake_store):  # noqa: ANN001
    _reset_store(fake_store)

    # Default for dev1 (none exists yet)
    res = client.get("/api/command/dev1")
    assert res.status_code == 200
    assert res.json() == {"action": None, "pattern": []}

    # Set a command (device_id via dependency -> dev1)
    res = client.post(
        "/api/command/",
        json={"action": "blink", "pattern": [1, 0, 1]},
    )
    assert res.status_code == 200

    # Read back
    res = client.get("/api/command/dev1")
    assert res.status_code == 200
    assert res.json() == {"action": "blink", "pattern": [1, 0, 1]}


def test_auth_admin_endpoints(client):  # noqa: ANN001
    # user-roles (structure checks)
    res = client.get("/api/auth/user-roles")
    assert res.status_code == 200
    body = res.json()
    assert set(body.keys()) >= {"users", "nextPageToken", "total", "adminCount", "totalCount"}

    # user by email
    res = client.get("/api/auth/user/test@example.com")
    assert res.status_code == 200
    u = res.json()
    assert u["email"] == "test@example.com"

    # user stats
    res = client.get("/api/auth/user-stats")
    assert res.status_code == 200
    stats = res.json()
    assert set(stats.keys()) >= {
        "totalUsers",
        "adminUsers",
        "regularUsers",
        "disabledUsers",
        "verifiedUsers",
        "unverifiedUsers",
    }

    # set admin claim
    res = client.post("/api/auth/set-admin-claim", json={"uid": "x", "admin": True})
    assert res.status_code == 200

    res = client.post(
        "/api/auth/set-admin-claim-by-email", json={"email": "test@example.com", "admin": True}
    )
    assert res.status_code == 200


def test_admin_devices_and_user_cleanup(client, fake_store):  # noqa: ANN001
    _reset_store(fake_store)

    # Seed two devices and records
    fake_store["devices"]["dev1"] = {
        "secret": "s1",
        "user_id": "u1",
        "registered_at": 100,
    }
    fake_store["devices"]["dev2"] = {
        "secret": "s2",
        "user_id": "u2",
        "registered_at": 200,
    }
    # records for each device
    fake_store["records"]["r1"] = {"device_id": "dev1", "userId": "u1", "ts": 10}
    fake_store["records"]["r2"] = {"device_id": "dev2", "userId": "u2", "ts": 20}

    # List devices (admin)
    res = client.get("/api/admin/devices")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 2
    assert any(d["deviceId"] == "dev1" for d in body["devices"])  # structure

    # Delete specific device
    res = client.delete("/api/admin/devices/dev1")
    assert res.status_code == 200
    assert "dev1" not in fake_store["devices"]

    # Delete user u2 should clean their devices and records
    res = client.delete("/api/admin/users/u2")
    assert res.status_code == 200
    assert "dev2" not in fake_store["devices"]
    assert not any(v.get("userId") == "u2" for v in fake_store["records"].values())


def test_admin_user_devices_and_stats(client, fake_store):  # noqa: ANN001
    _reset_store(fake_store)
    # Seed devices for u1
    fake_store["devices"]["devA"] = {
        "secret": "sa",
        "user_id": "u1",
        "registered_at": 300,
    }
    fake_store["records"]["rx"] = {"device_id": "devA", "userId": "u1", "ts": 123}

    # Get devices by user
    res = client.get("/api/admin/users/u1/devices")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["devices"][0]["deviceId"] == "devA"

    # Stats
    res = client.get("/api/admin/stats")
    assert res.status_code == 200
    stats = res.json()
    assert set(stats.keys()) >= {"userCount", "deviceCount", "totalRecords", "timestamp"}


