# 🌿 Carbonyx Protocol (HackOut'26)

> **Patent-Pending Multi-Source MRV Protocol & Verifiable Carbon Credit Ecosystem**  
> Eliminating phantom carbon offsets by cryptographically verifying ground IoT flux, financial Capex invoices, and Copernicus Sentinel-2 satellite optical imagery with automated 50% verifier stake slashing on Ethereum.

---

## 🏗️ System Architecture

```
 ┌────────────────────────────────────────────────────────────────────────────────┐
 │                          CARBONYX FULLSTACK PROTOCOL                           │
 └────────────────────────────────────────────────────────────────────────────────┘
          │                                  │                              │
          ▼                                  ▼                              ▼
 ┌───────────────────┐             ┌───────────────────┐          ┌───────────────────┐
 │   FRONTEND SPA    │             │   BACKEND RELAY   │          │  AI / ML ENGINE   │
 │ • React 18 + Vite │ ──────────► │ • Node.js Express │ ───────► │ • Python FastAPI  │
 │ • 6 UI Dashboards │             │ • Supabase Vault  │          │ • Isolation Forest│
 │ • Persona Switcher│             │ • Sentinel-2 API  │          │ • Trajectory Diff │
 └───────────────────┘             └───────────────────┘          └───────────────────┘
          │                                  │                              │
          ▼                                  ▼                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────┐
 │                      EVM SMART CONTRACTS (FOUNDRY)                             │
 │ • CarbonRegistry.sol         → Merkle Root Anchoring & Policy Gates            │
 │ • CarbonCreditNFT.sol        → Dynamic ERC-721 Offsets & Burn Certificates     │
 │ • VerifierStakingLedger.sol  → Collateral Staking & Automated 50% Slashing     │
 │ • EscrowSettlement.sol       → Peer-to-Peer Trading with 100% Buyer Refunds    │
 └────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart & How to Run Locally

Open **4 terminal windows** in the repository root:

```bash
# Terminal 1: Anvil Blockchain
cd contracts && anvil --port 8545

# Terminal 2: ML Anomaly Detection Engine
cd ml-engine && uvicorn app.main:app --reload --port 8000

# Terminal 3: Carbonyx Backend Relayer
cd backend && npm run dev

# Terminal 4: Frontend Web App
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Master Test Suite (All 5 Phases)

Run the single master test runner to verify smart contracts, ML engine, backend REST APIs, deployment configs, and frontend builds:

```bash
python3 scripts/verify_all.py
```

**Expected Output:**
```text
=================================================================
   🌿 CARBONYX PROTOCOL — MASTER END-TO-END VERIFICATION 🌿
=================================================================
[1/5] Testing Foundry Smart Contracts (Staking, Escrow, Slashing)...
  🎉 All 17 Solidity test suites passed 100%!
[2/5] Testing ML Anomaly Engine (Isolation Forest, Trajectories)...
  ✓ ML Anomaly Detection model & health checks passed 100%!
[3/5] Testing Backend Services & Copernicus Sentinel-2 Integration...
  ✓ Backend health & relayer active
  ✓ Copernicus Sentinel-2 optical telemetry active (NDVI: 0.782)
  ✓ 6-Stage Cryptographic Provenance Stepper verified
  ✓ Live Dispute Arbitration, Token Revocation & 50% Slashing verified
[4/5] Testing React 18 + Vite Production Build...
  ✓ Production build compiled cleanly with 0 type errors in under 3s!
[5/5] Verifying Deployment Artifacts & Configurations...
  ✓ Configuration verified: vercel.json, Dockerfile, render.yaml, PITCH_SCRIPT.md
=================================================================
  🏆 100% COMPLETE & 1ST PLACE READY ACROSS ALL 5 PHASES! 🏆
=================================================================
```

---

## 🌟 The 6 Core Protocol Dashboards

1. **🌱 Issuer Studio:** Project developer baseline registration, Capex invoice upload, Ground IoT telemetry, live **Copernicus Sentinel-2 NDVI** query, and SHA-256 Merkle root computation.
2. **🔍 Baseline Explorer:** Public registry with **14-day challenge window countdowns**, telemetry inspector, and "🚩 Challenge Baseline" dispute trigger.
3. **🛡️ Verifier Portal:** Collateral staking, anomaly review queue, and policy-gated mint authorization.
4. **⚖️ Auditor Provenance:** 6-stage cryptographic lifecycle stepper, live dispute arbitration, and real-time verifier slashing log.
5. **🛒 Marketplace:** Peer-to-peer carbon credit trading via custodial escrow.
6. **💼 Buyer Portfolio:** Corporate carbon asset holdings, escrow locks, and permanent on-chain retirement certificates.

---

## 🎤 Hackathon Pitch & Live Demo Guide

See [`PITCH_SCRIPT.md`](./PITCH_SCRIPT.md) for the complete 3-minute stage choreography and demo flow.
