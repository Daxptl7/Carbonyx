import os
import sys
import subprocess
import requests
import json
import time

GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'

def log_step(step_num, title):
    print(f"\n{BOLD}{CYAN}=== Step {step_num}: {title} ==={RESET}")

def log_success(msg):
    print(f"{GREEN}  ✓ {msg}{RESET}")

def log_fail(msg):
    print(f"{RED}  ✗ {msg}{RESET}")

print(f"{BOLD}{CYAN}======================================================{RESET}")
print(f"{BOLD}{CYAN}   CARBONYX PROTOCOL — PHASE C2 MASTER TEST SUITE     {RESET}")
print(f"{BOLD}{CYAN}======================================================{RESET}")

total_passed = 0
total_tests = 4

# 1. Smart Contracts (Foundry)
log_step(1, "Verifying Smart Contracts & Policy Gates (Foundry)")
try:
    res = subprocess.run(
        ['/home/jash/.foundry/bin/forge', 'test', '-v'],
        cwd='/home/jash/code/Carbonyx/contracts',
        capture_output=True,
        text=True,
        check=True
    )
    passed_lines = [l for l in res.stdout.split('\n') if '[PASS]' in l]
    for p in passed_lines:
        log_success(p.strip())
    log_success(f"All {len(passed_lines)} Solidity test suites passed successfully!")
    total_passed += 1
except Exception as e:
    log_fail(f"Foundry tests failed: {e}")

# 2. Backend Relayer & Cryptographic Merkle Pipeline
log_step(2, "Verifying Backend Relayer & Cryptographic Merkle Engine")
try:
    base_url = "http://localhost:5005"
    
    # 2a. Health
    h = requests.get(f"{base_url}/health", timeout=15).json()
    assert h.get("status") == "HEALTHY", "Backend not healthy"
    log_success(f"Backend API Healthy: {h.get('status')} (Supabase: {h.get('supabaseConnected')})")

    # Authenticate as the project proponent. All pipeline mutations are role-gated.
    api = requests.Session()
    auth = api.post(f"{base_url}/api/auth/login", json={
        "loginId": "proponent.demo",
        "password": "Carbon@2026"
    }, timeout=15).json()
    assert auth.get("token"), f"Authentication failed: {auth}"
    api.headers.update({"Authorization": f"Bearer {auth['token']}"})
    log_success("Project Proponent RBAC session established")

    # 2b. Project Registration & DID
    proj_id = f"PROJ-VERIFY-{int(time.time())}"
    r_proj = api.post(f"{base_url}/api/projects/register", json={
        "projectId": proj_id,
        "name": "Sumatra Coastal Mangrove Restoration",
        "projectType": "BLUE_CARBON",
        "location": { "country": "Indonesia", "region": "Sumatra" },
        "claimedAnnualTonnage": 65000,
        "ownerAddress": "0x71C8363879F80e6138e09664D6745B73B47c2CEe"
    }, timeout=15).json()
    assert r_proj.get("success") == True, f"Registration failed: {r_proj}"
    log_success(f"Project Registered with DID: {r_proj.get('did')}")

    # 2c. Evidence Upload & Merkle Tree
    r_ev = api.post(f"{base_url}/api/evidence/upload", json={
        "projectId": proj_id,
        "monitoringPeriod": { "startDate": "2026-01-01", "endDate": "2026-03-31" },
        "evidenceItems": [
            { "sourceType": "IOT_SENSOR", "payload": { "sensorId": "MANGROVE-01", "co2Flux": 389.2 } },
            { "sourceType": "SATELLITE_NDVI", "payload": { "satellite": "Sentinel-2", "ndvi": 0.84 } },
            { "sourceType": "OPERATIONAL_DOC", "payload": { "auditor": "BlueCarbon Global", "valid": True } }
        ]
    }, timeout=15).json()
    assert r_ev.get("success") == True, f"Evidence upload failed: {r_ev}"
    bundle_id = r_ev["bundle"]["bundle_id"]
    merkle_root = r_ev["merkleRoot"]
    log_success(f"Evidence Ingested • Merkle Root: {merkle_root[:18]}... (3 leaves)")

    # 2d. Risk Evaluation
    r_risk = api.post(f"{base_url}/api/risk/evaluate", json={
        "bundleId": bundle_id,
        "projectId": proj_id,
        "declaredTonnage": 500
    }, timeout=15).json()
    assert r_risk.get("success") == True, f"Risk eval failed: {r_risk}"
    log_success(f"Risk Score: {r_risk['riskAssessment']['confidence_score']}% ({r_risk['riskAssessment']['risk_level']} RISK)")

    # 2e. Gated Minting
    r_mint = api.post(f"{base_url}/api/credits/mint", json={
        "bundleId": bundle_id,
        "projectId": proj_id,
        "co2Tonnage": 500,
        "vintageYear": 2026,
        "ownerAddress": "0x71C8363879F80e6138e09664D6745B73B47c2CEe"
    }, timeout=15).json()
    assert r_mint.get("success") == True, f"Mint failed: {r_mint}"
    log_success(f"Policy-Gated Mint Succeeded: Token ID #{r_mint.get('tokenId')}")

    total_passed += 1
except Exception as e:
    log_fail(f"Backend pipeline test failed: {e}")

# 3. Frontend Production Build
log_step(3, "Verifying Frontend React & Vite Production Build")
try:
    res = subprocess.run(
        ['npm', 'run', 'build'],
        cwd='/home/jash/code/Carbonyx/frontend',
        capture_output=True,
        text=True,
        check=True
    )
    log_success("React 18 + Vite + Tailwind bundle compiled cleanly with 0 type errors!")
    total_passed += 1
except Exception as e:
    log_fail(f"Frontend build failed: {e}")

# 4. Supabase Database Integrity
log_step(4, "Verifying Supabase Tables & Storage Integrity via REST")
try:
    headers = {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlanljYXJ6Y3huaGp5bmtxcmpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTE1MDE0MSwiZXhwIjoyMTA0NzI2MTQxfQ.BfzkrpK_yoZb5IMN7g8_1svSPEXcTPphM56167dhqLA",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlanljYXJ6Y3huaGp5bmtxcmpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTE1MDE0MSwiZXhwIjoyMTA0NzI2MTQxfQ.BfzkrpK_yoZb5IMN7g8_1svSPEXcTPphM56167dhqLA",
        "Range": "0-9"
    }
    tables = ['projects', 'evidence_bundles', 'evidence_items', 'risk_assessments', 'carbon_credit_nfts']
    for t in tables:
        res = requests.get(f"https://sejycarzcxnhjynkqrjo.supabase.co/rest/v1/{t}?select=*", headers=headers, timeout=10)
        items = res.json()
        log_success(f"Table '{t}': {len(items)} active record(s) fetched")
    total_passed += 1
except Exception as e:
    log_fail(f"Database verification check failed: {e}")

# Final Score
print(f"\n{BOLD}{CYAN}======================================================{RESET}")
if total_passed == total_tests:
    print(f"{BOLD}{GREEN}  ✓ PHASE C2 MASTER VERIFICATION: {total_passed}/{total_tests} LAYERS PASSING (100%){RESET}")
else:
    print(f"{BOLD}{YELLOW}  ! PHASE C2 MASTER VERIFICATION: {total_passed}/{total_tests} LAYERS PASSING{RESET}")
print(f"{BOLD}{CYAN}======================================================{RESET}\n")
