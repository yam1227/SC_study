"""
Unit Tests for Crypto Router (Block Cipher Modes, MAC, PKI)
"""
import pytest

def test_block_cipher_module_registration(client):
    response = client.get("/api/modules")
    assert response.status_code == 200
    modules = response.json()
    mod_ids = [m["id"] for m in modules]
    assert "block_cipher" in mod_ids
    
    mod = next(m for m in modules if m["id"] == "block_cipher")
    assert mod["title"] == "ブロック暗号 ＆ 暗号利用モード (CTR / CBC / ECB / GCM)"
    assert mod["jsFile"] == "lab_block_cipher.js"

def test_ctr_mode_simulation(client):
    response = client.post("/api/block-cipher/simulate", json={
        "mode": "CTR",
        "plaintext": "PASS_ALL_EXAMS_2026_SC",
        "key": "SecretKey128Bit!"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["padding_required"] is False
    assert data["parallel_encryption"] is True
    assert data["parallel_decryption"] is True
    assert "鍵ストリーム" in data["output_formula"]
    assert len(data["steps"]) > 0
    assert "keystream" in data["steps"][0]

def test_cbc_mode_simulation(client):
    response = client.post("/api/block-cipher/simulate", json={
        "mode": "CBC",
        "plaintext": "PASS_ALL_EXAMS_2026_SC",
        "key": "SecretKey128Bit!"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["padding_required"] is True
    assert data["parallel_encryption"] is False
    assert data["parallel_decryption"] is True
    assert "次ブロック" in data["error_propagation"]

def test_mac_verify_success(client):
    response = client.post("/api/mac/verify", json={
        "message": "Transfer 100,000 JPY to Charlie",
        "key": "SharedKeySecret123",
        "tampered_message": ""
    })
    assert response.status_code == 200
    data = response.json()
    assert data["integrity_verified"] is True
    assert data["authenticity_verified"] is True
    assert data["third_party_verifiable"] is False
    assert "完全性" in data["message"]

def test_mac_verify_tampered_failed(client):
    response = client.post("/api/mac/verify", json={
        "message": "Transfer 100,000 JPY to Charlie",
        "key": "SharedKeySecret123",
        "tampered_message": "Transfer 900,000 JPY to Mallory"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["integrity_verified"] is False
    assert data["is_tampered"] is True
    assert "改ざん検知" in data["message"]
