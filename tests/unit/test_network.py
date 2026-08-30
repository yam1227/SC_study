"""
Unit Tests for Network Router (STP, IPsec, Packet Simulator)
"""
import pytest

def test_stp_calculate_3_switch(client):
    bridges = [
        {"id": "SW-A", "name": "Switch A", "priority": 4096, "mac": "00:11:22:33:44:AA"},
        {"id": "SW-B", "name": "Switch B", "priority": 8192, "mac": "00:11:22:33:44:BB"},
        {"id": "SW-C", "name": "Switch C", "priority": 32768, "mac": "00:11:22:33:44:CC"}
    ]
    links = [
        {"id": "link-AB", "bridge_a": "SW-A", "port_a": "Gi0/1", "bridge_b": "SW-B", "port_b": "Gi0/1", "speed": "1Gbps", "cost": 4},
        {"id": "link-BC", "bridge_a": "SW-B", "port_a": "Gi0/2", "bridge_b": "SW-C", "port_b": "Gi0/2", "speed": "1Gbps", "cost": 4},
        {"id": "link-CA", "bridge_a": "SW-C", "port_a": "Gi0/1", "bridge_b": "SW-A", "port_b": "Gi0/2", "speed": "1Gbps", "cost": 4}
    ]

    res = client.post("/api/stp/calculate", json={
        "bridges": bridges,
        "links": links
    })
    assert res.status_code == 200
    data = res.json()

    assert data["root_bridge_id"] == "SW-A"
    roles = data["port_roles"]
    
    assert "代表ポート" in roles["SW-A:Gi0/1"]["role"]
    assert "代表ポート" in roles["SW-A:Gi0/2"]["role"]
    assert "ルートポート" in roles["SW-B:Gi0/1"]["role"]
    assert "ルートポート" in roles["SW-C:Gi0/1"]["role"]
    assert "代表ポート" in roles["SW-B:Gi0/2"]["role"]
    assert "ブロックポート" in roles["SW-C:Gi0/2"]["role"]
    assert roles["SW-C:Gi0/2"]["state"] == "Blocking"

def test_stp_simulate_frame(client):
    bridges = [
        {"id": "SW-A", "name": "Switch A", "priority": 4096, "mac": "00:11:22:33:44:AA"},
        {"id": "SW-B", "name": "Switch B", "priority": 8192, "mac": "00:11:22:33:44:BB"},
        {"id": "SW-C", "name": "Switch C", "priority": 32768, "mac": "00:11:22:33:44:CC"}
    ]
    links = [
        {"id": "link-AB", "bridge_a": "SW-A", "port_a": "Gi0/1", "bridge_b": "SW-B", "port_b": "Gi0/1", "speed": "1Gbps", "cost": 4},
        {"id": "link-BC", "bridge_a": "SW-B", "port_a": "Gi0/2", "bridge_b": "SW-C", "port_b": "Gi0/2", "speed": "1Gbps", "cost": 4},
        {"id": "link-CA", "bridge_a": "SW-C", "port_a": "Gi0/1", "bridge_b": "SW-A", "port_b": "Gi0/2", "speed": "1Gbps", "cost": 4}
    ]

    # Test STP Enabled
    res_on = client.post("/api/stp/simulate_frame", json={
        "stp_enabled": True,
        "bridges": bridges,
        "links": links,
        "source_bridge_id": "SW-A"
    })
    assert res_on.status_code == 200
    data_on = res_on.json()
    assert data_on["status"] == "normal"
    assert data_on["blocked_count"] > 0

    # Test STP Disabled
    res_off = client.post("/api/stp/simulate_frame", json={
        "stp_enabled": False,
        "bridges": bridges,
        "links": links,
        "source_bridge_id": "SW-A"
    })
    assert res_off.status_code == 200
    data_off = res_off.json()
    assert data_off["status"] == "broadcast_storm"
