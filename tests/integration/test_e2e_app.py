import os
import time
import socket
import subprocess
import pytest
# pyrefly: ignore [missing-import]
from playwright.sync_api import sync_playwright

import threading
import uvicorn
from main import app

TEST_PORT = 18005
TEST_URL = f"http://127.0.0.1:{TEST_PORT}"

def is_port_in_use(port: int) -> bool:
    import urllib.request
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{port}/api/modules", headers={"User-Agent": "pytest"})
        with urllib.request.urlopen(req, timeout=1.0) as res:
            return res.status == 200
    except Exception:
        return False

@pytest.fixture(scope="session", autouse=True)
def run_server():
    server_process = None
    if not is_port_in_use(TEST_PORT):
        venv_python = os.path.join(".venv", "bin", "python")
        if not os.path.exists(venv_python):
            venv_python = "python"
        
        server_process = subprocess.Popen(
            [venv_python, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(TEST_PORT)]
        )
        for _ in range(30):
            if is_port_in_use(TEST_PORT):
                break
            time.sleep(0.2)
        else:
            if server_process:
                server_process.terminate()
            raise RuntimeError(f"Server failed to start on port {TEST_PORT}.")
            
    yield
    
    if server_process:
        server_process.terminate()
        server_process.wait()

def test_osi_model_encapsulation_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        )
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()
        
        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"[Browser PageError] {err}"))
        
        page.goto(TEST_URL)
        assert "セキスペ・セキュリティ・ラボ" in page.title()
        
        osi_tab = page.locator("a:has-text('OSI参照モデル・カプセル化')")
        osi_tab.wait_for(state="visible", timeout=5000)
        osi_tab.click()
        
        stack_container = page.locator("#osiStackContainer")
        stack_container.wait_for(state="visible", timeout=5000)
        
        btn_send = page.locator("#btnStartOsiSend")
        btn_send.wait_for(state="visible", timeout=5000)
        btn_send.click()
        
        log_box = page.locator("#osiSimLogText")
        log_box.wait_for(state="attached", timeout=5000)
        
        success_indicator = page.locator("text=送信側のカプセル化が完了しました")
        success_indicator.wait_for(state="attached", timeout=10000)
        
        btn_recv = page.locator("#btnStartOsiRecv")
        btn_recv.wait_for(state="attached")
        page.wait_for_selector("#btnStartOsiRecv:not([disabled])", timeout=5000, state="attached")
        btn_recv.click()
        
        success_recv = page.locator("text=非カプセル化・パケット復元が完全に完了しました")
        success_recv.wait_for(state="attached", timeout=10000)
        
        l4_card = page.locator("#osiLayerCard-4")
        l4_card.wait_for(state="attached")
        l4_card.click()
        
        port_field = page.locator("td:has-text('Destination Port')")
        port_field.wait_for(state="attached", timeout=3000)
        
        port_val = page.locator("td:has-text('443 (HTTPS)')")
        assert port_val.count() > 0
        
        context.close()
        browser.close()

def test_email_security_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        )
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()
        
        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"[Browser PageError] {err}"))
        
        page.goto(TEST_URL)
        assert "セキスペ・セキュリティ・ラボ" in page.title()
        
        email_tab = page.locator("a:has-text('メールセキュリティ・ドメイン認証')")
        email_tab.wait_for(state="visible", timeout=5000)
        email_tab.click()
        
        btn_send = page.locator("#btnStartEmailSend")
        btn_send.wait_for(state="attached", timeout=5000)
        btn_send.click()
        
        flow_status = page.locator("text=メール配信プロセス完了")
        flow_status.wait_for(state="attached", timeout=20000)
        
        header_viewer = page.locator("#emailHeaderViewer")
        header_viewer.wait_for(state="attached", timeout=5000)
        content_on = header_viewer.inner_text()
        assert "DKIM-Signature" in content_on
        assert "From: support@trusted-bank.com" in content_on

        btn_toggle_off = page.locator("#btnToggleDkimOff")
        btn_toggle_off.wait_for(state="attached", timeout=5000)
        btn_toggle_off.click()
        
        content_off = header_viewer.inner_text()
        assert "DKIM-Signature" not in content_off
        assert "From: support@trusted-bank.com" in content_off
        
        btn_toggle_on = page.locator("#btnToggleDkimOn")
        btn_toggle_on.click()

        tab_auth = page.locator("#btnTabEmailAuth")
        tab_auth.wait_for(state="attached", timeout=5000)
        tab_auth.click()
        
        preset_select = page.locator("#authMailPreset")
        preset_select.wait_for(state="attached", timeout=5000)
        preset_select.select_option("spoof_spf_fail")
        
        btn_verify = page.locator("#btnStartAuthVerify")
        btn_verify.click()
        
        page.wait_for_selector("#textDmarcFinalAction:not(:has-text('検証前'))", timeout=10000)
        
        dmarc_badge = page.locator("#badgeDmarcResult")
        assert "FAIL" in dmarc_badge.inner_text()
        
        final_action = page.locator("#textDmarcFinalAction")
        assert "受信拒否 (Reject)" in final_action.inner_text()
        
        context.close()
        browser.close()

def test_cookie_security_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        )
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()
        
        page.goto(TEST_URL)
        assert "セキスペ・セキュリティ・ラボ" in page.title()
        
        cookie_tab = page.locator("a:has-text('CookieとWebセキュリティ')")
        cookie_tab.wait_for(state="visible", timeout=5000)
        cookie_tab.click()
        
        btn_sim = page.locator("#btnSimulateCookie")
        btn_sim.wait_for(state="attached", timeout=5000)
        btn_sim.click()
        
        page.wait_for_selector("#textCookieSentResult:not(:has-text('シミュレーションを実行してください'))", timeout=10000)
        
        header_el = page.locator("#textCookieAttrHeader")
        assert "Set-Cookie" in header_el.inner_text()
        
        tab_attack = page.locator("#btnTabCookieAttack")
        tab_attack.wait_for(state="attached", timeout=5000)
        tab_attack.click()
        
        btn_xss = page.locator("#btnExecuteXss")
        btn_xss.wait_for(state="attached", timeout=5000)
        btn_xss.click()
        
        page.wait_for_selector("#logXssAttack:has-text('結果:')", timeout=5000)
        xss_log = page.locator("#logXssAttack").inner_text()
        assert "cookie" in xss_log.lower()
        
        btn_csrf = page.locator("#btnExecuteCsrf")
        btn_csrf.wait_for(state="attached", timeout=5000)
        btn_csrf.click()
        
        page.wait_for_selector("#logCsrfAttack:has-text('結果:')", timeout=5000)
        csrf_log = page.locator("#logCsrfAttack").inner_text()
        assert "bank.com" in csrf_log or "送金" in csrf_log
        
        context.close()
        browser.close()

def test_pki_lifecycle_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        )
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()
        
        page.goto(TEST_URL)
        assert "セキスペ・セキュリティ・ラボ" in page.title()
        
        pki_tab = page.locator("a:has-text('認証局 (CA) と PKI ライフサイクル')")
        pki_tab.wait_for(state="visible", timeout=5000)
        pki_tab.click()
        
        btn_csr = page.locator("#btnPkiCsr")
        btn_csr.wait_for(state="attached", timeout=5000)
        btn_csr.click()
        
        btn_submit_ra = page.locator("#btnPkiSubmitRa")
        page.wait_for_function("btn => !btn.disabled", arg=btn_submit_ra.element_handle(), timeout=5000)
        
        btn_submit_ra.click()
        
        btn_issue_ca = page.locator("#btnPkiIssueCa")
        page.wait_for_function("btn => !btn.disabled", arg=btn_issue_ca.element_handle(), timeout=5000)
        
        btn_issue_ca.click()
        
        out_pki_serial = page.locator("#outPkiSerial")
        page.wait_for_function(
            "el => el.innerText !== '未発行' && el.innerText !== 'CSR生成済み (署名未完了)'",
            arg=out_pki_serial.element_handle(),
            timeout=5000
        )
        serial = out_pki_serial.inner_text().strip()
        assert len(serial) > 5
        
        tab_verify = page.locator("button:has-text('② 失効・検証')")
        tab_verify.click()
        
        select_cert = page.locator("#pkiSelectCert")
        select_cert.wait_for(state="visible", timeout=5000)
        page.wait_for_selector(f"#pkiSelectCert option[value='{serial}']", state="attached", timeout=5000)
        select_cert.select_option(serial)
        
        btn_ocsp = page.locator("#btnPkiCheckOcsp")
        btn_ocsp.click()
        page.wait_for_selector("#pkiVerifyReport:has-text('Status=Good')", timeout=5000)
        
        btn_revoke = page.locator("#btnPkiRevoke")
        btn_revoke.click()
        
        page.wait_for_function(
            "select => select.options[select.selectedIndex].text.includes('失効')",
            arg=select_cert.element_handle(),
            timeout=5000
        )
        
        btn_ocsp.click()
        page.wait_for_selector("#pkiVerifyReport:has-text('Status=Revoked')", timeout=5000)
        
        context.close()
        browser.close()
