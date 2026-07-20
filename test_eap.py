from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_verify_eap_md5_success():
    res = client.post("/api/eap/verify", json={
        "method": "MD5",
        "username": "user1",
        "response_hash": "a1b2c3d4"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert "EAP-MD5認証成功" in data["message"]
    assert any("EAP-MD5" in log for log in data["verification_logs"])

def test_verify_eap_md5_failure():
    res = client.post("/api/eap/verify", json={
        "method": "MD5",
        "username": "user1",
        "response_hash": ""
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert "EAP-MD5認証失敗" in data["message"]

def test_verify_eap_tls_success():
    res = client.post("/api/eap/verify", json={
        "method": "TLS",
        "username": "user1",
        "client_cert_present": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert "EAP-TLS認証成功" in data["message"]

def test_verify_eap_tls_failure():
    res = client.post("/api/eap/verify", json={
        "method": "TLS",
        "username": "user1",
        "client_cert_present": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert "EAP-TLS認証失敗" in data["message"]

def test_verify_eap_peap_success():
    res = client.post("/api/eap/verify", json={
        "method": "PEAP",
        "username": "user1",
        "response_hash": "response123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert "PEAP認証成功" in data["message"]

def test_verify_eap_fast_success():
    res = client.post("/api/eap/verify", json={
        "method": "EAP-FAST",
        "username": "user1",
        "pac_present": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert "EAP-FAST認証成功" in data["message"]
