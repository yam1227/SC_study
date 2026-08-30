"""
Unit Tests for Web Security Router (CSRF, XSS, Cookie, SQLi)
"""
import pytest

def test_modules_registration(client):
    response = client.get("/api/modules")
    assert response.status_code == 200
    modules = response.json()
    mod_ids = [m["id"] for m in modules]
    assert "csrf_vs_xss" in mod_ids
    
    mod = next(m for m in modules if m["id"] == "csrf_vs_xss")
    assert mod["title"] == "CSRF vs XSS 徹底比較と防衛"
    assert mod["jsFile"] == "lab_csrf_vs_xss.js"

def test_csrf_simulation_vulnerable(client):
    response = client.post("/api/vuln/csrf-vs-xss/simulate", json={
        "mode": "csrf",
        "csrf_token_enabled": False,
        "samesite_attribute": "None"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "CSRF被害発生" in data["message"]

def test_csrf_simulation_defended_by_samesite(client):
    response = client.post("/api/vuln/csrf-vs-xss/simulate", json={
        "mode": "csrf",
        "csrf_token_enabled": False,
        "samesite_attribute": "Lax"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["blocked_by"] == "SameSite Cookie"

def test_csrf_simulation_defended_by_token(client):
    response = client.post("/api/vuln/csrf-vs-xss/simulate", json={
        "mode": "csrf",
        "csrf_token_enabled": True,
        "provided_csrf_token": "wrong_token",
        "samesite_attribute": "None"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["blocked_by"] == "CSRF Token Validation"

def test_xss_simulation_vulnerable(client):
    response = client.post("/api/vuln/csrf-vs-xss/simulate", json={
        "mode": "xss",
        "payload": "<script>alert('XSS')</script>",
        "escape_html_enabled": False,
        "httponly_enabled": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["cookie_stolen"] is True

def test_xss_simulation_escaped(client):
    response = client.post("/api/vuln/csrf-vs-xss/simulate", json={
        "mode": "xss",
        "payload": "<script>alert('XSS')</script>",
        "escape_html_enabled": True,
        "httponly_enabled": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["blocked_by"] == "HTML Escape (Sanitization)"
    assert "&lt;script&gt;" in data["rendered_html"]

def test_xss_simulation_httponly_partial(client):
    response = client.post("/api/vuln/csrf-vs-xss/simulate", json={
        "mode": "xss",
        "payload": "<script>alert('XSS')</script>",
        "escape_html_enabled": False,
        "httponly_enabled": True
    })
    assert response.status_code == 200
    data = response.json()
    assert data["cookie_stolen"] is False
    assert data["blocked_by"] == "HttpOnly (Partial)"

def test_transaction_signing_defended_against_mitb(client):
    response = client.post("/api/vuln/csrf-vs-xss/simulate", json={
        "mode": "transaction_signing",
        "account_number": "123-4567",
        "amount": 500000,
        "signed_account": "123-4567",
        "auth_type": "transaction_signing",
        "mitb_attack": True
    })
    assert response.status_code == 200
    data = response.json()
    assert data["blocked_by"] == "Transaction Signing Mismatch"
    assert "999-9999" in data["account_number"]
    assert "不整合を検出" in data["message"]

def test_transaction_signing_vulnerable_with_otp(client):
    response = client.post("/api/vuln/csrf-vs-xss/simulate", json={
        "mode": "transaction_signing",
        "account_number": "123-4567",
        "amount": 500000,
        "auth_type": "otp",
        "mitb_attack": True
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "MITB/CSRF被害発生" in data["message"]
