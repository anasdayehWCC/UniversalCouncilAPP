from backend.main import app
from fastapi.testclient import TestClient


client = TestClient(app)


def test_security_headers_present():
    res = client.get("/healthcheck")
    assert res.status_code == 200
    assert res.headers.get("Strict-Transport-Security")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
