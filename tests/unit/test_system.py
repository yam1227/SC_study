"""
Unit Tests for System Router (Modules list, System Reliability)
"""
import pytest

def test_modules_registration(client):
    response = client.get("/api/modules")
    assert response.status_code == 200
    modules = response.json()
    assert len(modules) >= 20
    mod_ids = [m["id"] for m in modules]
    assert "system_reliability" in mod_ids
    assert "csrf_vs_xss" in mod_ids
    assert "block_cipher" in mod_ids
    assert "stp" in mod_ids
    assert "saml" in mod_ids

def test_simulate_human_error_foolproof(client):
    res = client.post("/api/system_reliability/simulate", json={
        "event_type": "human_error",
        "policy": "foolproof"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "NORMAL_PROTECTED" in data["system_state"]
    assert any("フールプルーフ適用" in log for log in data["logs"])

def test_simulate_human_error_none(client):
    res = client.post("/api/system_reliability/simulate", json={
        "event_type": "human_error",
        "policy": "none"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert "DATA_CORRUPTED" in data["system_state"]

def test_simulate_api_failure_failsafe(client):
    res = client.post("/api/system_reliability/simulate", json={
        "event_type": "api_failure",
        "policy": "failsafe"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "FAIL_CLOSED_SAFE" in data["system_state"]

def test_simulate_api_failure_failsoft(client):
    res = client.post("/api/system_reliability/simulate", json={
        "event_type": "api_failure",
        "policy": "failsoft"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "DEGRADED" in data["system_state"]

def test_simulate_database_crash_fault_tolerant(client):
    res = client.post("/api/system_reliability/simulate", json={
        "event_type": "database_crash",
        "policy": "fault_tolerant"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "HA_NORMAL" in data["system_state"]
