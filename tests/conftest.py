import os
import sys
import types
from typing import Any, Dict, List, Optional, Tuple

import pytest
from fastapi.testclient import TestClient

# Ensure project root is importable (so that `import api...` works)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


class FakePushResult:
    """Represents the result of a push() operation with an auto-generated key."""

    def __init__(self, key: str) -> None:
        self.key = key


class FakeQuery:
    """A minimal query object to emulate Firebase RTDB chained queries used in the app."""

    def __init__(
        self,
        store: Dict[str, Any],
        base_path: str,
        child_key: Optional[str] = None,
        equal_value: Optional[Any] = None,
        limit: Optional[int] = None,
    ) -> None:
        self._store = store
        self._base_path = base_path
        self._child_key = child_key
        self._equal_value = equal_value
        self._limit = limit

    def equal_to(self, value: Any) -> "FakeQuery":
        return FakeQuery(
            self._store,
            self._base_path,
            child_key=self._child_key,
            equal_value=value,
            limit=self._limit,
        )

    def limit_to_last(self, n: int) -> "FakeQuery":
        return FakeQuery(
            self._store,
            self._base_path,
            child_key=self._child_key,
            equal_value=self._equal_value,
            limit=n,
        )

    def get(self) -> Optional[Dict[str, Any]]:
        data = _lookup_path(self._store, self._base_path)
        if not isinstance(data, dict):
            return data

        # If no child_key, we may still need to apply limit-to-last on raw dict
        if self._child_key is None:
            if self._limit is None:
                return data
            items = list((data or {}).items())
            if self._limit < len(items):
                items = items[-self._limit :]
            return {k: v for k, v in items}

        items: List[Tuple[str, Dict[str, Any]]] = [
            (k, v) for k, v in (data or {}).items() if isinstance(v, dict)
        ]

        if self._equal_value is not None:
            items = [
                (k, v)
                for (k, v) in items
                if v.get(self._child_key) == self._equal_value
            ]

        # Preserve insertion order and take the last N items
        if self._limit is not None and self._limit < len(items):
            items = items[-self._limit :]

        return {k: v for k, v in items}


class FakeDBRef:
    """A minimal RTDB reference implementation with only features needed by tests."""

    def __init__(self, store: Dict[str, Any], path: str) -> None:
        self._store = store
        self._path = _normalize_path(path)

    def get(self) -> Any:
        return _lookup_path(self._store, self._path)

    def set(self, value: Any) -> None:
        _assign_path(self._store, self._path, value)

    def delete(self) -> None:
        _delete_path(self._store, self._path)

    def update(self, value: Dict[str, Any]) -> None:
        for k, v in value.items():
            if self._path == "/":
                path = f"/{k}".rstrip("/")
            else:
                path = f"{self._path}/{k}".rstrip("/")
            _assign_path(self._store, path, v)

    def push(self, value: Dict[str, Any]) -> FakePushResult:
        base = _lookup_path(self._store, self._path)
        if base is None or not isinstance(base, dict):
            _assign_path(self._store, self._path, {})
            base = _lookup_path(self._store, self._path)
        assert isinstance(base, dict)
        key = f"key{len(base) + 1}"
        base[key] = value
        return FakePushResult(key)

    # Query helpers
    def order_by_child(self, child: str) -> FakeQuery:
        return FakeQuery(self._store, self._path, child_key=child)

    def limit_to_last(self, n: int) -> FakeQuery:
        return FakeQuery(self._store, self._path, child_key=None, limit=n)


def _normalize_path(path: str) -> str:
    if not path:
        return "/"
    if not path.startswith("/"):
        path = "/" + path
    return path.rstrip("/") or "/"


def _split_path(path: str) -> List[str]:
    path = _normalize_path(path)
    return [p for p in path.split("/") if p]


def _lookup_path(store: Dict[str, Any], path: str) -> Any:
    parts = _split_path(path)
    node: Any = store
    for part in parts:
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node


def _assign_path(store: Dict[str, Any], path: str, value: Any) -> None:
    parts = _split_path(path)
    node: Any = store
    for part in parts[:-1]:
        if part not in node or not isinstance(node[part], dict):
            node[part] = {}
        node = node[part]
    node[parts[-1]] = value


def _delete_path(store: Dict[str, Any], path: str) -> None:
    parts = _split_path(path)
    node: Any = store
    for part in parts[:-1]:
        if part not in node or not isinstance(node[part], dict):
            return
        node = node[part]
    node.pop(parts[-1], None)


def _build_fake_firebase_module() -> types.ModuleType:
    """Create a fake firebase_admin module with db/auth stubs and shared store."""
    mod = types.ModuleType("firebase_admin")

    # Shared in-memory store
    store: Dict[str, Any] = {"devices": {}, "records": {}, "commands": {}}
    mod._store = store

    # credentials submodule
    credentials = types.SimpleNamespace(
        Certificate=lambda path: {"path": path}
    )
    mod.credentials = credentials

    # initialize_app no-op
    def initialize_app(_cred: Any, _options: Dict[str, Any]) -> None:  # noqa: ANN001
        return None

    mod.initialize_app = initialize_app

    # db API
    class _DBNS:  # namespace-like
        def reference(self, path: str) -> FakeDBRef:
            return FakeDBRef(store, path)

        class ServerValue:  # pylint: disable=too-few-public-methods
            TIMESTAMP = 1_725_000_000_000

    mod.db = _DBNS()

    # auth API stubs (only what tests might touch)
    class _AuthNS:  # namespace-like
        def verify_id_token(self, token: str) -> Dict[str, Any]:
            # Default stub – tests override dependency instead of relying on this
            if token == "valid-token":
                return {"uid": "user123", "email": "u@example.com", "admin": False}
            raise Exception("invalid token")

        def list_users(self, max_results: int = 1000, page_token: Optional[str] = None):
            class _Dummy:
                users: List[Any] = []
                next_page_token: Optional[str] = None

                def iterate_all(self):
                    return []

            return _Dummy()

        def get_user_by_email(self, email: str):  # noqa: ARG002
            class _User:
                uid = "uid-by-email"
                email = "test@example.com"
                display_name = "Test User"
                disabled = False
                email_verified = True
                custom_claims: Dict[str, Any] = {"admin": True}
                user_metadata = types.SimpleNamespace(
                    creation_timestamp=0, last_sign_in_timestamp=0
                )

            return _User()

        def set_custom_user_claims(self, uid: str, claims: Dict[str, Any]):  # noqa: ARG002
            return None

        def update_user(self, uid: str, **kwargs: Any):  # noqa: ARG002
            return None

        def delete_user(self, uid: str):  # noqa: ARG002
            return None

        def get_user(self, uid: str):  # noqa: ARG002
            class _User:
                email = "test@example.com"
                display_name = "Test User"

            return _User()

        class UserNotFoundError(Exception):
            pass

    mod.auth = _AuthNS()

    class _ExceptionsNS:  # minimal exceptions namespace
        class InvalidArgumentError(Exception):
            pass

    mod.exceptions = _ExceptionsNS

    return mod


@pytest.fixture(scope="session", autouse=True)
def _install_fake_firebase_module() -> None:
    """Install a fake firebase_admin into sys.modules before app import occurs."""
    fake_mod = _build_fake_firebase_module()
    sys.modules["firebase_admin"] = fake_mod


@pytest.fixture(scope="session")
def app_instance():
    """Import and return the FastAPI app after setting env vars."""
    # Provide minimal env vars required by app import; tests use fake firebase module so these are placeholders
    os.environ.setdefault("FIREBASE_DB_URL", "https://dummy.local")
    os.environ.setdefault("FIREBASE_TYPE", "service_account")
    os.environ.setdefault("FIREBASE_PROJECT_ID", "dummy-project")
    os.environ.setdefault("FIREBASE_PRIVATE_KEY_ID", "dummy-key-id")
    os.environ.setdefault("FIREBASE_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n")
    os.environ.setdefault("FIREBASE_CLIENT_EMAIL", "dummy@dummy.iam.gserviceaccount.com")
    os.environ.setdefault("FIREBASE_CLIENT_ID", "1234567890")
    os.environ.setdefault("FIREBASE_AUTH_URI", "https://accounts.google.com/o/oauth2/auth")
    os.environ.setdefault("FIREBASE_TOKEN_URI", "https://oauth2.googleapis.com/token")
    os.environ.setdefault("FIREBASE_AUTH_PROVIDER_X509_CERT_URL", "https://www.googleapis.com/oauth2/v1/certs")
    os.environ.setdefault("FIREBASE_CLIENT_X509_CERT_URL", "https://www.googleapis.com/robot/v1/metadata/x509/dummy")

    # Import after firebase_admin is faked
    from api.main import app  # type: ignore

    # Override authentication dependencies to avoid real token verification
    from api.auth import verify_admin, verify_firebase_token  # type: ignore
    from api.records import verify_device as records_verify_device  # type: ignore
    from api.command import verify_device as command_verify_device  # type: ignore

    app.dependency_overrides[verify_firebase_token] = (
        lambda: {"uid": "user123", "email": "u@example.com", "admin": True}
    )
    app.dependency_overrides[verify_admin] = (
        lambda: {"uid": "admin123", "email": "admin@example.com", "admin": True}
    )
    # Always treat device as verified and return a fixed device_id for tests
    app.dependency_overrides[records_verify_device] = lambda: "dev1"
    app.dependency_overrides[command_verify_device] = lambda: "dev1"

    return app


@pytest.fixture()
def client(app_instance) -> TestClient:  # noqa: ANN001
    return TestClient(app_instance)


@pytest.fixture()
def fake_store() -> Dict[str, Any]:
    import firebase_admin as fb  # type: ignore

    # Provide direct access to the in-memory store for seeding/assertions
    return fb._store  # type: ignore[attr-defined]


