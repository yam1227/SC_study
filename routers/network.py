import heapq
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["Network, IPsec & Protocols"])


# ==============================================================================
# LAB 6: Network Packet Inspection (FW / IDS / IPS / WAF) API
# ==============================================================================
class NetworkPacketRequest(BaseModel):
    source_ip: str = "192.168.1.100"
    dest_ip: str = "10.0.0.1"
    dest_port: int = 80
    headers: Dict[str, str] = {}
    payload: str = ""


@router.post("/api/network/simulate")
def simulate_network(req: NetworkPacketRequest):
    payload_lower = req.payload.lower()
    
    # 1. Firewall (L3/L4 check)
    if req.dest_port in [22, 23, 3389, 445]:
        return {
            "blocked": True,
            "device": "Firewall (ファイアウォール)",
            "layer": "L4 (トランスポート層)",
            "reason": f"ポート {req.dest_port} への接続要求はセキュリティポリシーにより遮断されました（ポート拒否設定）。",
            "action": "DROP / REJECT"
        }
    
    if "portscan" in payload_lower:
        return {
            "blocked": True,
            "device": "Firewall (ファイアウォール)",
            "layer": "L4 (トランスポート層)",
            "reason": "短時間での多数のポートスキャンを検知したため、送信元IPからのパケットを遮断しました。",
            "action": "DROP"
        }

    # 2. IDS/IPS (L4-L7 signature check)
    ids_signatures = ["/bin/sh", "nc -e", "ping -c", "cmd.exe", "powershell", "rm -rf /", "wget http", "curl http"]
    matched_ids = [sig for sig in ids_signatures if sig in payload_lower]
    if matched_ids:
        return {
            "blocked": True,
            "device": "IDS/IPS (侵入検知/防止システム)",
            "layer": "L7 (アプリケーション層) シグネチャ一致",
            "reason": f"OSコマンドインジェクション / 不正コマンド実行シグネチャ '{matched_ids[0]}' を検知しました。",
            "action": "BLOCK / IPS Triggered"
        }

    # 3. WAF (L7 HTTP context check)
    waf_sqli_signatures = ["union select", "select * from", "insert into", "or 1=1", "' or '1'='1", "drop table"]
    waf_xss_signatures = ["<script>", "javascript:", "onerror=", "onload=", "alert("]
    waf_traversal_signatures = ["../", "..\\", "/etc/passwd"]
    
    matched_sqli = [sig for sig in waf_sqli_signatures if sig in payload_lower]
    matched_xss = [sig for sig in waf_xss_signatures if sig in payload_lower]
    matched_traversal = [sig for sig in waf_traversal_signatures if sig in payload_lower]
    
    user_agent = req.headers.get("User-Agent", "").lower()
    if "sqlmap" in user_agent or "nikto" in user_agent:
        return {
            "blocked": True,
            "device": "WAF (Webアプリケーションファイアウォール)",
            "layer": "L7 (アプリケーション層) HTTPコンテキスト",
            "reason": f"脆弱性スキャンツールと思われるUser-Agent '{user_agent}' からのアクセスを拒否しました。",
            "action": "BLOCK (403 Forbidden)"
        }
        
    if matched_sqli:
        return {
            "blocked": True,
            "device": "WAF (Webアプリケーションファイアウォール)",
            "layer": "L7 (アプリケーション層) HTTPリクエストボディ",
            "reason": f"SQLインジェクション攻撃パターン '{matched_sqli[0]}' を検知しました。",
            "action": "BLOCK (403 Forbidden)"
        }
    if matched_xss:
        return {
            "blocked": True,
            "device": "WAF (Webアプリケーションファイアウォール)",
            "layer": "L7 (アプリケーション層) HTTPリクエストボディ",
            "reason": f"クロスサイトスクリプティング (XSS) パターン '{matched_xss[0]}' を検知しました。",
            "action": "BLOCK (403 Forbidden)"
        }
    if matched_traversal:
        return {
            "blocked": True,
            "device": "WAF (Webアプリケーションファイアウォール)",
            "layer": "L7 (アプリケーション層) URLパス・クエリ",
            "reason": f"ディレクトリトラバーサル攻撃パターン '{matched_traversal[0]}' を検知しました。",
            "action": "BLOCK (403 Forbidden)"
        }

    # 4. Success (Reached Web Server)
    return {
        "blocked": False,
        "device": "Web Server (ウェブサーバー)",
        "layer": "L7 (アプリケーション層)",
        "reason": "すべてのセキュリティフィルターを通過し、Webサーバーに到達しました。正常応答を返却します。",
        "action": "ALLOW (200 OK)"
    }


# ==============================================================================
# LAB 9: IPsec Packet Structure API
# ==============================================================================
class IPsecPacketRequest(BaseModel):
    mode: str = "tunnel"
    protocol: str = "esp"
    payload: str = "GET /secret_data HTTP/1.1"


@router.post("/api/ipsec/build")
def build_ipsec_packet(req: IPsecPacketRequest):
    original_ip_header = "Original IP Header (Src: 192.168.1.50, Dst: 10.0.0.100)"
    new_ip_header = "New IP Header (Src: 192.168.1.1 [GW1], Dst: 10.0.0.1 [GW2])"
    payload_data = f"Payload Data: [{req.payload}]"
    packet_layout = []
    
    if req.mode == "transport":
        if req.protocol == "esp":
            packet_layout = [
                {"name": "Original IP Header", "size": "20 bytes", "state": "Cleartext (平文)", "desc": "元のIPアドレス(192.168.1.50 -> 10.0.0.100)を含むIPヘッダー。暗号化されません。"},
                {"name": "ESP Header", "size": "8 bytes", "state": "Cleartext (平文)", "desc": "SPIやシーケンス番号を含み、パケットの識別やリプレイ攻撃対策に使用されます。"},
                {"name": "Payload Data", "size": "Variable", "state": "🔒 ENCRYPTED (暗号化)", "desc": f"暗号化された実際のペイロードデータ: '{req.payload}'"},
                {"name": "ESP Trailer", "size": "2-26 bytes", "state": "🔒 ENCRYPTED (暗号化)", "desc": "パディングサイズや次ヘッダー（プロトコル番号）を含みます。暗号化されます。"},
                {"name": "ESP Auth (ICV)", "size": "12 bytes", "state": "MAC (完全性保証)", "desc": "パケットが改ざんされていないか検証するためのMAC（メッセージ認証コード）データです。"}
            ]
        else:
            packet_layout = [
                {"name": "Original IP Header", "size": "20 bytes", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "元のIPヘッダー。暗号化されませんが、AHによって改ざん検知の対象になります。"},
                {"name": "AH Header", "size": "24 bytes", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "SPI、シーケンス番号、ICV（改ざん検知用ハッシュ）を含みます。自身も認証対象になります。"},
                {"name": "Payload Data", "size": "Variable", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "暗号化されず平文のままですが、完全性チェック（改ざん検知）で保護されます。"}
            ]
    else:
        if req.protocol == "esp":
            packet_layout = [
                {"name": "New IP Header", "size": "20 bytes", "state": "Cleartext (平文)", "desc": "VPNゲートウェイ間の新しいIPヘッダー(GW1 -> GW2)。ルーティングに使用されます。"},
                {"name": "ESP Header", "size": "8 bytes", "state": "Cleartext (平文)", "desc": "暗号化セキュリティアソシエーションを識別する情報。"},
                {"name": "Original IP Header", "size": "20 bytes", "state": "🔒 ENCRYPTED (暗号化)", "desc": "元の端末間のIPヘッダー(192.168.1.50 -> 10.0.0.100)。カプセル化（暗号化）されて隠蔽されます。"},
                {"name": "Payload Data", "size": "Variable", "state": "🔒 ENCRYPTED (暗号化)", "desc": f"暗号化されたデータ本体: '{req.payload}'"},
                {"name": "ESP Trailer", "size": "2-26 bytes", "state": "🔒 ENCRYPTED (暗号化)", "desc": "暗号化ブロックサイズ調整用のパディング等。"},
                {"name": "ESP Auth (ICV)", "size": "12 bytes", "state": "MAC (完全性保証)", "desc": "改ざん検知用の認証値。"}
            ]
        else:
            packet_layout = [
                {"name": "New IP Header", "size": "20 bytes", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "新しいゲートウェイ間のIPヘッダー。改ざん検知で保護されます。"},
                {"name": "AH Header", "size": "24 bytes", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "改ざん検知情報。"},
                {"name": "Original IP Header", "size": "20 bytes", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "元のIPヘッダー。暗号化されませんが、改ざん検知で保護されます。"},
                {"name": "Payload Data", "size": "Variable", "state": "🔒 AUTHENTICATED (認証保護/不変)", "desc": "平文データ。改ざん検知で保護されます。"}
            ]
            
    return {
        "mode": req.mode,
        "protocol": req.protocol,
        "original_packet": {
            "ip_header": original_ip_header,
            "payload": payload_data
        },
        "new_packet": {
            "ip_header": new_ip_header if req.mode == "tunnel" else original_ip_header,
            "layout": packet_layout
        }
    }


# ==============================================================================
# LAB 18: Spanning Tree Protocol (STP) API
# ==============================================================================
class STPBridgeModel(BaseModel):
    id: str
    name: str
    priority: int
    mac: str


class STPLinkModel(BaseModel):
    id: str
    bridge_a: str
    port_a: str
    bridge_b: str
    port_b: str
    speed: str = "1Gbps"
    cost: int = 4


class STPCalculateRequest(BaseModel):
    bridges: List[STPBridgeModel]
    links: List[STPLinkModel]


class STPSimulateRequest(BaseModel):
    stp_enabled: bool
    bridges: List[STPBridgeModel]
    links: List[STPLinkModel]
    source_bridge_id: str


@router.post("/api/stp/calculate")
def calculate_stp(req: STPCalculateRequest):
    if not req.bridges:
        raise HTTPException(status_code=400, detail="ブリッジ定義がありません")
    
    logs = []
    logs.append("=== 【ステップ 1】 ルートブリッジ (Root Bridge) の選出 ===")
    
    # Sort bridges by (priority, mac)
    sorted_bridges = sorted(req.bridges, key=lambda b: (b.priority, b.mac.lower()))
    root_bridge = sorted_bridges[0]
    
    for b in req.bridges:
        is_root = (b.id == root_bridge.id)
        tag = " 🌟 [ルートブリッジ選出!]" if is_root else ""
        logs.append(f"・ブリッジ {b.name} ({b.id}): Bridge ID = Priority({b.priority}) + MAC({b.mac}){tag}")
    
    logs.append(f"⇒ 最小Bridge IDを持つ 【{root_bridge.name} ({root_bridge.id})】 がルートブリッジに選出されました。")
    
    # Graph representation for shortest path calculation
    adj = {b.id: [] for b in req.bridges}
    for l in req.links:
        adj[l.bridge_a].append((l.bridge_b, l.port_a, l.port_b, l.cost, l.id))
        adj[l.bridge_b].append((l.bridge_a, l.port_b, l.port_a, l.cost, l.id))
        
    bridge_dict = {b.id: b for b in req.bridges}
    root_id = root_bridge.id
    
    dist = {b.id: float('inf') for b in req.bridges}
    dist[root_id] = 0
    
    pq = [(0, (root_bridge.priority, root_bridge.mac.lower()), root_id)]
    while pq:
        d, bid_tuple, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, p_u, p_v, cost, link_id in adj[u]:
            if dist[u] + cost < dist[v]:
                dist[v] = dist[u] + cost
                v_bid_tuple = (bridge_dict[v].priority, bridge_dict[v].mac.lower())
                heapq.heappush(pq, (dist[v], v_bid_tuple, v))
                
    logs.append("\n=== 【ステップ 2】 各非ルートブリッジのルートパスコスト計算 & ルートポート (RP) 選出 ===")
    root_ports = {}
    
    for b in req.bridges:
        if b.id == root_id:
            logs.append(f"・ルートブリッジ 【{b.name}】: ルートパスコスト = 0 (ルートポートなし、全ポートが代表ポート)")
            continue
            
        rpc = dist[b.id]
        logs.append(f"・非ルートブリッジ 【{b.name}】: ルートパスコスト = {rpc}")
        
        candidates = []
        for nbr_id, p_b, p_nbr, link_cost, link_id in adj[b.id]:
            nbr_rpc = dist[nbr_id]
            port_path_cost = nbr_rpc + link_cost
            nbr_bid = (bridge_dict[nbr_id].priority, bridge_dict[nbr_id].mac.lower())
            candidates.append((port_path_cost, nbr_bid, p_nbr, p_b, nbr_id))
            
        candidates.sort()
        best = candidates[0]
        best_port = best[3]
        root_ports[b.id] = best_port
        
        logs.append(f"  ⇒ ポート {best_port} を 「ルートポート (Root Port / RP)」 に指定 (経由コスト: {best[0]}, 対向: {best[4]})")

    logs.append("\n=== 【ステップ 3】 各セグメント（リンク）ごとの代表ポート (Designated Port / DP) 選出 ===")
    logs.append("（※令和5年春期 午前II 問19 題材：リンク両端のブリッジのうち、ルートブリッジまでの経路コストが小さいブリッジ側のポート）")

    port_roles = {}
    
    for nbr_id, p_root, p_nbr, link_cost, link_id in adj[root_id]:
        port_roles[f"{root_id}:{p_root}"] = {
            "role": "代表ポート (DP)",
            "state": "Forwarding",
            "reason": "ルートブリッジの全ポートは代表ポート(DP)となります。"
        }

    for l in req.links:
        b_a = bridge_dict[l.bridge_a]
        b_b = bridge_dict[l.bridge_b]
        
        cost_a = dist[b_a.id]
        cost_b = dist[b_b.id]
        
        bid_a = (b_a.priority, b_a.mac.lower())
        bid_b = (b_b.priority, b_b.mac.lower())
        
        dp_bridge = None
        dp_port = None
        reason = ""
        
        if cost_a < cost_b:
            dp_bridge, dp_port = b_a, l.port_a
            reason = f"{b_a.name}のルートパスコスト({cost_a}) < {b_b.name}のコスト({cost_b}) のため"
        elif cost_b < cost_a:
            dp_bridge, dp_port = b_b, l.port_b
            reason = f"{b_b.name}のルートパスコスト({cost_b}) < {b_a.name}のコスト({cost_a}) のため"
        else:
            if bid_a < bid_b:
                dp_bridge, dp_port = b_a, l.port_a
                reason = f"ルートパスコスト同等({cost_a})のためBridge IDを比較: {b_a.name}(BID:{b_a.priority}) < {b_b.name}(BID:{b_b.priority})"
            else:
                dp_bridge, dp_port = b_b, l.port_b
                reason = f"ルートパスコスト同等({cost_b})のためBridge IDを比較: {b_b.name}(BID:{b_b.priority}) < {b_a.name}(BID:{b_a.priority})"

        port_roles[f"{dp_bridge.id}:{dp_port}"] = {
            "role": "代表ポート (DP)",
            "state": "Forwarding",
            "reason": f"リンク [{l.id}] において{reason}選出。"
        }
        logs.append(f"・リンク {l.id} ({b_a.id}:{l.port_a} - {b_b.id}:{l.port_b}): {dp_bridge.name} 側のポート {dp_port} が 「代表ポート (DP)」 に決定 ({reason})")

    logs.append("\n=== 【ステップ 4】 ブロックポート (Blocked Port / BP) の確定 ===")
    for b in req.bridges:
        for nbr_id, p_b, p_nbr, link_cost, link_id in adj[b.id]:
            key = f"{b.id}:{p_b}"
            if key in port_roles:
                continue
            if root_ports.get(b.id) == p_b:
                port_roles[key] = {
                    "role": "ルートポート (RP)",
                    "state": "Forwarding",
                    "reason": f"{b.name} からルートブリッジへの最少コスト経路ポート。"
                }
            else:
                port_roles[key] = {
                    "role": "ブロックポート (BP)",
                    "state": "Blocking",
                    "reason": "RPでもDPでもないため、L2ループ防止のためにブロッキング状態となります。"
                }
                logs.append(f"・ブリッジ 【{b.name}】 ポート {p_b}: 「ブロックポート (BP)」 に決定 （フレーム転送遮断、BPDUのみ監視）")

    return {
        "root_bridge_id": root_bridge.id,
        "root_bridge_name": root_bridge.name,
        "root_path_costs": dist,
        "port_roles": port_roles,
        "calculation_steps": logs
    }


@router.post("/api/stp/simulate_frame")
def simulate_stp_frame(req: STPSimulateRequest):
    calc_res = calculate_stp(STPCalculateRequest(bridges=req.bridges, links=req.links))
    port_roles = calc_res["port_roles"]
    
    if req.stp_enabled:
        visited_links = []
        visited_bridges = [req.source_bridge_id]
        queue = [req.source_bridge_id]
        
        adj = {b.id: [] for b in req.bridges}
        for l in req.links:
            adj[l.bridge_a].append((l.bridge_b, l.port_a, l.port_b, l.id))
            adj[l.bridge_b].append((l.bridge_a, l.port_b, l.port_a, l.id))
            
        frame_events = []
        frame_events.append(f"【STP有効】 送信元ブリッジ {req.source_bridge_id} からブロードキャストフレーム (ARP Request) を送出。")
        
        steps = 0
        while queue and steps < 20:
            curr = queue.pop(0)
            steps += 1
            for nbr, p_curr, p_nbr, link_id in adj[curr]:
                role_curr = port_roles.get(f"{curr}:{p_curr}", {}).get("state", "Blocking")
                role_nbr = port_roles.get(f"{nbr}:{p_nbr}", {}).get("state", "Blocking")
                
                if role_curr == "Forwarding" and role_nbr == "Forwarding":
                    if nbr not in visited_bridges:
                        visited_bridges.append(nbr)
                        visited_links.append(link_id)
                        queue.append(nbr)
                        frame_events.append(f"  → リンク {link_id} ({curr}:{p_curr} -> {nbr}:{p_nbr}) を正常通過して {nbr} に到達")
                else:
                    frame_events.append(f"  🛑 リンク {link_id} ({curr}:{p_curr} -> {nbr}:{p_nbr}) はブロックポート (BP) により遮断。ループを破棄。")
                    
        return {
            "status": "normal",
            "stp_enabled": True,
            "message": "STPがループを検知・ブロックしたため、ブロードキャストフレームはネットワーク全体に1回ずつ正しく到達し、正常終了しました。",
            "events": frame_events,
            "blocked_count": sum(1 for p in port_roles.values() if p["state"] == "Blocking")
        }
    else:
        frame_events = []
        frame_events.append(f"【STP無効】 送信元ブリッジ {req.source_bridge_id} からブロードキャストフレームを送出。")
        frame_events.append("  ⚠️ スイッチ間でフレームが循環増幅される『ブロードキャストストーム』が発生！")
        
        loop_trace = []
        b_ids = [b.id for b in req.bridges]
        for i in range(1, 10):
            b_from = b_ids[(i - 1) % len(b_ids)]
            b_to = b_ids[i % len(b_ids)]
            loop_trace.append(f"  [ループ {i} 周目] {b_from} -> {b_to} へ複製パケット転送中 (CPU負荷 100% 迫る)")
            
        frame_events.extend(loop_trace)
        frame_events.append("  💥 ネットワーク帯域が枯渇し、全スイッチの通信が完全停止しました！")
        
        return {
            "status": "broadcast_storm",
            "stp_enabled": False,
            "message": "警告: STPが無効なためL2ループが発生し、ブロードキャストストームによりネットワークがダウンしました！",
            "events": frame_events,
            "blocked_count": 0
        }
