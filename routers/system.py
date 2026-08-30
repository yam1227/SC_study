import os
from typing import Dict, Any, List

from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from core.config import MODULES

router = APIRouter(tags=["System & Modules"])


@router.get("/api/modules")
def get_modules():
    return MODULES


# ==============================================================================
# LAB 19: System Reliability & Fault Tolerance API
# ==============================================================================
class ReliabilitySimulateRequest(BaseModel):
    event_type: str  # "human_error", "api_failure", "database_crash"
    policy: str      # "none", "foolproof", "failsafe", "failsoft", "fault_tolerant"


@router.post("/api/system_reliability/simulate")
def simulate_reliability(req: ReliabilitySimulateRequest):
    event = req.event_type
    policy = req.policy
    
    logs = []
    
    if event == "human_error":
        logs.append("[イベント発生] ユーザーがフォームで型不整合データ（または1万文字）を誤入力・連打。")
        if policy == "foolproof":
            logs.append("[フールプルーフ適用] クライアント/サーバーで入力バリデーションが即座に起動。")
            logs.append("[防御成功] 不正なリクエストを事前にブロックし、分かりやすいエラーメッセージを表示。")
            logs.append("[結果] データベース不整合やバックエンドエラーを100%防止し、システムの正常運用を維持。")
            return {
                "success": True,
                "status_label": "✅ フールプルーフ適用 (入力保護・安全制御)",
                "system_state": "NORMAL_PROTECTED",
                "logs": logs,
                "concept_match": "完全適合 (人間の誤操作を構造的に防止)"
            }
        else:
            logs.append("[保護機能なし/不適合] 入力値の検証が行われず、不正データがそのままバックエンドへ通過。")
            logs.append("[エラー発生] データベースの型エラー/スタックオーバーフローが発生。")
            logs.append("[結果] システムの一部が異常終了、またはデータ破損が発生しました。")
            return {
                "success": False,
                "status_label": "⚠️ ヒューマンエラーによるデータ破損・異常処理発生",
                "system_state": "DATA_CORRUPTED",
                "logs": logs,
                "concept_match": "不適合 (フールプルーフが未導入)"
            }
            
    elif event == "api_failure":
        logs.append("[イベント発生] 外部の決済APIサーバーが障害で突然通信不能（ダウン）。")
        if policy == "failsafe":
            logs.append("[フェールセーフ適用] 決済通信のタイムアウト・エラーを検知。")
            logs.append("[安全制御] 誤課金や未決済注文の作成を防ぐため、決済処理を即座に「Fail-Closed (安全全停止)」へ移行。")
            logs.append("[結果] ユーザーに『現在決済システムを緊急停止中』の安全メッセージを表示し、被害拡大を完全に防護。")
            return {
                "success": True,
                "status_label": "🛡️ フェールセーフ適用 (安全側へシステム緊急遮断)",
                "system_state": "FAIL_CLOSED_SAFE",
                "logs": logs,
                "concept_match": "完全適合 (故障時に安全側へ停止)"
            }
        elif policy == "failsoft":
            logs.append("[フェールソフト適用] 決済API停止を検知。")
            logs.append("[縮退運転] 決済機能を切り離し、商品閲覧・カート保持サービスのみでサイト運用を維持 (Degraded Operation)。")
            logs.append("[結果] 全滅を回避し、提供可能な機能のみでサービスを継続。")
            return {
                "success": True,
                "status_label": "📉 フェールソフト適用 (決済除外の縮退運転)",
                "system_state": "DEGRADED",
                "logs": logs,
                "concept_match": "適合 (一部機能を制限してサービス継続)"
            }
        elif policy == "fault_tolerant":
            logs.append("[フォールトトレラント適用] 主決済プロバイダのダウンを検知。")
            logs.append("[二重化切り替え] 予備のサブ決済プロバイダへ数ミリ秒で自動マルチホーム迂回。")
            logs.append("[結果] ユーザーに障害を一切認識させることなく、無停止で決済完了。")
            return {
                "success": True,
                "status_label": "⚡ フォールトトレラント適用 (マルチプロバイダ自動迂回)",
                "system_state": "FAILOVER_NORMAL",
                "logs": logs,
                "concept_match": "完全適合 (障害発生時も無停止で継続)"
            }
        else:
            logs.append("[保護機能なし] 決済エラーがそのまま放置され、処理が途中でハングアップ。")
            logs.append("[結果] 注文データが不整合な状態で残り、システム全体が504 Gateway Timeoutでクラッシュ。")
            return {
                "success": False,
                "status_label": "💥 システム異常終了・二次被害発生",
                "system_state": "CRASHED",
                "logs": logs,
                "concept_match": "不適合"
            }

    elif event == "database_crash":
        logs.append("[イベント発生] 主データベース (Master DB) のハードウェア障害でクラッシュ。")
        if policy == "fault_tolerant":
            logs.append("[フォールトトレラント適用] DBクラスタ監視プロセスがMasterダウンを検知。")
            logs.append("[自動フェイルオーバー] Standby DB (レプリカ) を自動的に Master へ昇格。RAID 10構成でデータ損失ゼロ。")
            logs.append("[結果] ダウンタイムゼロ・パフォーマンス低下ゼロで完全な運用を無停止継続。")
            return {
                "success": True,
                "status_label": "⚡ フォールトトレラント適用 (DB二重化・無停止切替)",
                "system_state": "HA_NORMAL",
                "logs": logs,
                "concept_match": "完全適合 (冗長化により無停止運用)"
            }
        elif policy == "failsoft":
            logs.append("[フェールソフト適用] 主DBの停止を検知。")
            logs.append("[縮退運転] 書き込み処理（新規登録・購入）をストップし、キャッシュ(Redis)を利用した閲覧専用モードへ自動切り替え。")
            logs.append("[結果] 完全停止（全滅）を防ぎ、情報閲覧サービスのみを縮退運用で維持。")
            return {
                "success": True,
                "status_label": "📉 フェールソフト適用 (閲覧専用モードの縮退運転)",
                "system_state": "DEGRADED_READONLY",
                "logs": logs,
                "concept_match": "完全適合 (縮退運転によるサービス一部継続)"
            }
        elif policy == "failsafe":
            logs.append("[フェールセーフ適用] 主DB停止を検知。")
            logs.append("[安全停止] 不整合データの発生を防ぐため、全Webサーバーのデータ処理を安全に緊急停止しメンテナンス画面を表示。")
            logs.append("[結果] データの破壊や誤った処理の拡散を防止。")
            return {
                "success": True,
                "status_label": "🛑 フェールセーフ適用 (データ保護のための安全停止)",
                "system_state": "SAFE_SHUTDOWN",
                "logs": logs,
                "concept_match": "適合 (安全な状態への移行)"
            }
        else:
            logs.append("[保護機能なし] バックエンドがDB接続不能の例外（NPE/ConnectionError）を吐いて崩壊。")
            logs.append("[結果] 全画面で 500 Internal Server Error が発生し、システム全滅。")
            return {
                "success": False,
                "status_label": "💥 DB接続不能によるシステム全滅",
                "system_state": "CRASHED",
                "logs": logs,
                "concept_match": "不適合"
            }


@router.get("/")
def get_index():
    index_path = os.path.join("static", "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    return HTMLResponse("<h1>Security & Auth Lab Backend is Running!</h1><p>Please place index.html in the static directory.</p>")
