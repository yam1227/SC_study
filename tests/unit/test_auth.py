import base64
import zlib
import re
import pytest

def test_saml_flow_success(client):
    # 1. Initiate AuthnRequest
    res = client.post("/api/saml/initiate")
    assert res.status_code == 200
    data = res.json()
    assert "request_id" in data
    assert "xml" in data
    assert "saml_request_b64" in data
    
    authn_req_id = data["request_id"]
    
    # Verify XML content
    xml_str = data["xml"]
    assert "samlp:AuthnRequest" in xml_str
    assert f'ID="{authn_req_id}"' in xml_str

    # 2. Authenticate at IdP
    res_auth = client.post("/api/saml/authenticate", json={
        "username": "testuser",
        "authn_request_id": authn_req_id
    })
    assert res_auth.status_code == 200
    auth_data = res_auth.json()
    assert "xml" in auth_data
    assert "saml_response_b64" in auth_data
    
    response_xml = auth_data["xml"]
    assert "samlp:Response" in response_xml
    assert "saml:Assertion" in response_xml
    assert "testuser" in response_xml
    assert f'InResponseTo="{authn_req_id}"' in response_xml

    # 3. Verify at SP (Success Case)
    res_verify = client.post("/api/saml/verify", json={
        "saml_response_xml": response_xml,
        "expected_in_response_to": authn_req_id,
        "time_offset_seconds": 0
    })
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["success"] is True
    assert verify_data["overall_status"] == "AUTHENTICATED"
    assert verify_data["user_info"]["username"] == "testuser"
    assert verify_data["user_info"]["role"] == "student"
    
    checks = verify_data["checks"]
    for check_name in ["signature", "conditions", "audience", "in_response_to", "recipient"]:
        assert checks[check_name]["status"] == "SUCCESS"

def test_saml_flow_tampered_signature(client):
    res = client.post("/api/saml/initiate")
    authn_req_id = res.json()["request_id"]

    res_auth = client.post("/api/saml/authenticate", json={
        "username": "testuser",
        "authn_request_id": authn_req_id
    })
    response_xml = res_auth.json()["xml"]

    tampered_xml = re.sub(
        r"<ds:SignatureValue>([^<]+)</ds:SignatureValue>",
        r"<ds:SignatureValue>A\1</ds:SignatureValue>",
        response_xml
    )

    res_verify = client.post("/api/saml/verify", json={
        "saml_response_xml": tampered_xml,
        "expected_in_response_to": authn_req_id
    })
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["success"] is False
    assert verify_data["overall_status"] == "VERIFICATION_FAILED"
    assert verify_data["checks"]["signature"]["status"] == "FAILED"

def test_saml_flow_tampered_role_breaks_signature(client):
    res = client.post("/api/saml/initiate")
    authn_req_id = res.json()["request_id"]

    res_auth = client.post("/api/saml/authenticate", json={
        "username": "testuser",
        "authn_request_id": authn_req_id
    })
    response_xml = res_auth.json()["xml"]

    tampered_xml = response_xml.replace(
        "<saml:AttributeValue>student</saml:AttributeValue>",
        "<saml:AttributeValue>faculty</saml:AttributeValue>"
    )

    res_verify = client.post("/api/saml/verify", json={
        "saml_response_xml": tampered_xml,
        "expected_in_response_to": authn_req_id
    })
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["success"] is False
    assert verify_data["checks"]["signature"]["status"] == "FAILED"

def test_saml_flow_invalid_audience(client):
    res = client.post("/api/saml/initiate")
    authn_req_id = res.json()["request_id"]

    res_auth = client.post("/api/saml/authenticate", json={
        "username": "testuser",
        "authn_request_id": authn_req_id
    })
    response_xml = res_auth.json()["xml"]

    tampered_xml = re.sub(
        r"<saml:Audience>[^<]+</saml:Audience>",
        r"<saml:Audience>https://fake.another-sp.com/saml2</saml:Audience>",
        response_xml
    )
    
    res_verify = client.post("/api/saml/verify", json={
        "saml_response_xml": tampered_xml,
        "expected_in_response_to": authn_req_id
    })
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["success"] is False
    assert verify_data["checks"]["audience"]["status"] == "FAILED"

def test_saml_flow_expired_conditions(client):
    res = client.post("/api/saml/initiate")
    authn_req_id = res.json()["request_id"]

    res_auth = client.post("/api/saml/authenticate", json={
        "username": "testuser",
        "authn_request_id": authn_req_id
    })
    response_xml = res_auth.json()["xml"]

    res_verify = client.post("/api/saml/verify", json={
        "saml_response_xml": response_xml,
        "expected_in_response_to": authn_req_id,
        "time_offset_seconds": 600
    })
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["success"] is False
    assert verify_data["checks"]["conditions"]["status"] == "FAILED"
    assert "有効期限切れ" in verify_data["checks"]["conditions"]["msg"]

def test_verify_eap_md5_success(client):
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

def test_verify_eap_md5_failure(client):
    res = client.post("/api/eap/verify", json={
        "method": "MD5",
        "username": "user1",
        "response_hash": ""
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert "EAP-MD5認証失敗" in data["message"]

def test_verify_eap_tls_success(client):
    res = client.post("/api/eap/verify", json={
        "method": "TLS",
        "username": "user1",
        "client_cert_present": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert "EAP-TLS認証成功" in data["message"]

def test_verify_eap_tls_failure(client):
    res = client.post("/api/eap/verify", json={
        "method": "TLS",
        "username": "user1",
        "client_cert_present": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert "EAP-TLS認証失敗" in data["message"]

def test_verify_eap_peap_success(client):
    res = client.post("/api/eap/verify", json={
        "method": "PEAP",
        "username": "user1",
        "response_hash": "response123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert "PEAP認証成功" in data["message"]

def test_password_hashing_and_salt(client):
    res = client.post("/api/hashing/hash", json={
        "password": "Password123!",
        "rounds": 10
    })
    assert res.status_code == 200
    data = res.json()
    assert "sha256" in data
    assert "bcrypt" in data
    assert len(data["sha256"]["hash"]) == 64
    assert data["bcrypt"]["hash"].startswith("$2b$")

def test_jwt_generate_and_verify(client):
    res_gen = client.post("/api/jwt/generate", json={
        "user_id": "user123",
        "username": "SecTester",
        "role": "admin",
        "secret": "super_secret_key"
    })
    assert res_gen.status_code == 200
    token = res_gen.json()["token"]
    assert len(token.split(".")) == 3

    res_ver = client.post("/api/jwt/verify", json={
        "token": token,
        "expected_secret": "super_secret_key"
    })
    assert res_ver.status_code == 200
    assert res_ver.json()["valid"] is True


