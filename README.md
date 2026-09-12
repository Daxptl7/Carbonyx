# 🌿 Carbonyx Protocol (HackOut'26)

> **Patent-Pending Multi-Source MRV Protocol & Verifiable Carbon Credit Ecosystem**  
> Eliminating phantom carbon offsets by cryptographically verifying ground IoT flux, financial Capex invoices, and Copernicus Sentinel-2 satellite optical imagery with automated 50% verifier stake slashing on Ethereum.

---

## 🚀 Live Deployment — Ethereum Sepolia Testnet

All 4 smart contracts are **live, verified, and open-source** on Sepolia:

| Contract | Address | Etherscan |
|---|---|---|
| **CarbonCreditNFT** | `0x201cF066262ad3B2544bE085860246cD41BdeC21` | [View ↗](https://sepolia.etherscan.io/address/0x201cf066262ad3b2544be085860246cd41bdec21#code) |
| **VerifierStakingLedger** | `0xa78Dbf1D3E4351304F2A9BcE985E78dA2fDaBE8D` | [View ↗](https://sepolia.etherscan.io/address/0xa78dbf1d3e4351304f2a9bce985e78da2fdabe8d#code) |
| **EscrowSettlement** | `0x4BFfF0e1661AcFC490C40FA60819Bd4Cf048F533` | [View ↗](https://sepolia.etherscan.io/address/0x4bfff0e1661acfc490c40fa60819bd4cf048f533#code) |
| **CarbonRegistry** | `0xD6d094Ce5743e8aC8500F4C3bbEC95347b31dcE0` | [View ↗](https://sepolia.etherscan.io/address/0xd6d094ce5743e8ac8500f4c3bbec95347b31dce0#code) |

- **Network:** Ethereum Sepolia (Chain ID: 11155111)
- **Deployed:** September 12, 2026
- **Deployer:** [0xc57aB1ceF012CC669C89cA4Efd929b807BD15a4c](https://sepolia.etherscan.io/address/0xc57aB1ceF012CC669C89cA4Efd929b807BD15a4c)
- **Block Explorer:** [Sepolia Etherscan](https://sepolia.etherscan.io)
- **All contracts source-verified ✅** via Etherscan & Sourcify

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
