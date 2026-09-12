# 🌿 Carbonyx Protocol

> **Patent-Pending Multi-Source MRV Protocol & Verifiable Carbon Credit Ecosystem**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org)
[![Foundry](https://img.shields.io/badge/Foundry-Tests%20Pass-orange)](https://book.getfoundry.sh)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Sepolia](https://img.shields.io/badge/Sepolia-Deployed%20%26%20Verified-brightgreen)](https://sepolia.etherscan.io)

Carbonyx eliminates phantom carbon offsets by **cryptographically verifying** three independent data sources:

- 🌍 **Ground IoT Flux** — real-time CO₂ sensor telemetry from project sites  
- 💰 **Financial Capex Invoices** — SHA-256 hashed equipment purchase receipts  
- 🛰️ **Copernicus Sentinel-2 NDVI** — satellite optical imagery for vegetation baseline

Any discrepancy triggers an automated **50% verifier stake slash** on Ethereum, eliminating incentives for collusion.

---

## 🚀 Live Deployment — Ethereum Sepolia Testnet

All 4 smart contracts are **live, verified, and open-source** on Ethereum Sepolia:

| Contract | Address | Etherscan |
|---|---|---|
| **CarbonCreditNFT** | `0x201cF066262ad3B2544bE085860246cD41BdeC21` | [✅ View & Verify](https://sepolia.etherscan.io/address/0x201cf066262ad3b2544be085860246cd41bdec21#code) |
| **VerifierStakingLedger** | `0xa78Dbf1D3E4351304F2A9BcE985E78dA2fDaBE8D` | [✅ View & Verify](https://sepolia.etherscan.io/address/0xa78dbf1d3e4351304f2a9bce985e78da2fdabe8d#code) |
| **EscrowSettlement** | `0x4BFfF0e1661AcFC490C40FA60819Bd4Cf048F533` | [✅ View & Verify](https://sepolia.etherscan.io/address/0x4bfff0e1661acfc490c40fa60819bd4cf048f533#code) |
| **CarbonRegistry** | `0xD6d094Ce5743e8aC8500F4C3bbEC95347b31dcE0` | [✅ View & Verify](https://sepolia.etherscan.io/address/0xd6d094ce5743e8ac8500f4c3bbec95347b31dce0#code) |

- **Network:** Ethereum Sepolia (Chain ID: `11155111`)
- **Deployed:** September 12, 2026
- **Deployer:** [`0xc57aB1ceF012CC669C89cA4Efd929b807BD15a4c`](https://sepolia.etherscan.io/address/0xc57aB1ceF012CC669C89cA4Efd929b807BD15a4c)
- **Source verified** on both **Etherscan** (`Pass - Verified`) and **Sourcify** ✅

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
 │ • ethers.js v6    │             │ • Merkle Service  │          │ • XAI Reasoner    │
 └───────────────────┘             └───────────────────┘          └───────────────────┘
          │                                  │                              │
          ▼                                  ▼                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────┐
 │                    EVM SMART CONTRACTS — Sepolia Testnet                       │
 │ • CarbonRegistry.sol         → Merkle Root Anchoring & 14-day Policy Gates    │
 │ • CarbonCreditNFT.sol        → Dynamic ERC-721 Offsets & Burn Certificates    │
 │ • VerifierStakingLedger.sol  → Collateral Staking & Automated 50% Slashing    │
 │ • EscrowSettlement.sol       → Peer-to-Peer Trading with 100% Buyer Refunds   │
 └────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                          ┌────────────────────────┐
                          │   Supabase PostgreSQL  │
                          │ • projects / evidence  │
                          │ • credits / verifiers  │
                          │ • disputes / trades    │
                          └────────────────────────┘
```

---

## ⚡ How the Protocol Works

```
Project Developer                    Verifier                    Auditor / Buyer
      │                                  │                              │
      │  1. Register Project DID         │                              │
      │  2. Upload Capex Invoice         │                              │
      │  3. Pull Sentinel-2 NDVI  ───────┼──────► ML Anomaly Score     │
      │  4. Commit Merkle Root     ──────┼──────► Stake Collateral      │
      │                                  │  5. Approve Verification     │
      │  6. Mint Carbon Credit NFT ◄─────┘                              │
      │                                  │                              │
      │                                  │        7. Buy via Escrow ◄──┤
      │                                  │        8. Dispute if Fraud   │
      │                            50% Slash ◄──── 9. Arbitrate        │
      │                                  │        100% Refund ─────────►│
```

**Challenge Window:** Any stakeholder can challenge a baseline within **14 days**. If dispute is upheld:
- Verifier loses **50% of staked collateral** (slashed by `VerifierStakingLedger`)
- Buyer receives **100% escrow refund** (returned by `EscrowSettlement`)
- NFT status is set to `REVOKED` on-chain permanently

---

## 📦 Monorepo Structure

```
Carbonyx/
├── contracts/                  # Foundry smart contracts
│   ├── src/
│   │   ├── CarbonRegistry.sol          # Hub: Merkle anchoring, policy gates
│   │   ├── CarbonCreditNFT.sol         # ERC-721: dynamic status, burn-retire
│   │   ├── VerifierStakingLedger.sol   # 50% slash on fraud confirmation
│   │   └── EscrowSettlement.sol        # P2P trades, 100% buyer refund
│   ├── src/interfaces/         # ICarbonRegistry, ICarbonCreditNFT, ...
│   ├── script/
│   │   ├── Deploy.s.sol                # Full deploy script (all 4 contracts)
│   │   └── DeployRemaining.s.sol       # Incremental deploy (for retries)
│   └── test/
│       ├── CarbonPipeline.t.sol        # End-to-end mint pipeline tests
│       ├── DisputeSlashing.t.sol       # Dispute + 50% slash tests
│       ├── VerifierEscrow.t.sol        # Escrow + refund tests
│       └── Scaffold.t.sol              # Basic scaffold smoke tests
│
├── backend/                    # Node.js + Express API relay
│   ├── src/
│   │   ├── server.ts                   # Express app entry point
│   │   ├── config/
│   │   │   ├── supabase.ts             # Supabase client
│   │   │   └── contracts.json          # Live Sepolia contract addresses
│   │   ├── routes/
│   │   │   ├── projects.routes.ts      # /api/projects
│   │   │   ├── evidence.routes.ts      # /api/evidence
│   │   │   ├── risk.routes.ts          # /api/risk
│   │   │   ├── credits.routes.ts       # /api/credits
│   │   │   ├── verifiers.routes.ts     # /api/verifiers
│   │   │   ├── marketplace.routes.ts   # /api/marketplace
│   │   │   ├── satellite.routes.ts     # /api/satellite (Copernicus)
│   │   │   ├── disputes.routes.ts      # /api/disputes
│   │   │   └── audit.routes.ts         # /api/audit/provenance
│   │   └── services/
│   │       ├── relayer.service.ts      # On-chain transaction relay
│   │       ├── satellite.service.ts    # Sentinel-2 NDVI fetcher
│   │       ├── merkle.service.ts       # SHA-256 Merkle root builder
│   │       └── cryptographic.service.ts# Evidence hash utilities
│   ├── Dockerfile
│   └── render.yaml
│
├── frontend/                   # React 18 + Vite SPA
│   ├── src/
│   │   ├── App.tsx                     # Root: persona switcher + nav tabs
│   │   ├── pages/
│   │   │   ├── IssuerStudio.tsx        # 🌱 Baseline registration & Sentinel-2
│   │   │   ├── BaselineExplorer.tsx    # 🔍 14-day countdown & challenge
│   │   │   ├── VerifierPortal.tsx      # 🛡️ Stake collateral & approve
│   │   │   ├── AuditorExplorer.tsx     # ⚖️ 6-stage provenance stepper
│   │   │   ├── Marketplace.tsx         # 🛒 P2P escrow trading
│   │   │   ├── BuyerPortfolio.tsx      # 💼 Holdings & retirement certs
│   │   │   └── HomePage.tsx            # Landing / protocol overview
│   │   └── lib/
│   │       ├── web3.ts                 # MetaMask + ethers.js helpers
│   │       ├── supabase.ts             # Supabase browser client
│   │       └── contracts.json          # ABI + Sepolia addresses
│   ├── vercel.json
│   └── vite.config.ts
│
├── ml-engine/                  # Python FastAPI anomaly detection
│   ├── app/
│   │   ├── main.py                     # FastAPI app entry point
│   │   ├── api/score.py                # POST /score endpoint
│   │   ├── models/
│   │   │   ├── anomaly_detector.py     # Isolation Forest (sklearn)
│   │   │   ├── correlation_checker.py  # Multi-source correlation
│   │   │   └── xai_reasoner.py         # Explainable AI rationale
│   │   ├── schemas/evidence_schema.py  # Pydantic input validation
│   │   └── utils/verifier_matcher.py   # Verifier assignment logic
│   ├── model/anomaly_model.pkl         # Pre-trained Isolation Forest
│   ├── Dockerfile
│   └── render.yaml
│
├── scripts/
│   ├── verify_all.py           # Master end-to-end test runner
│   ├── verify_phase_1.py       # Phase 1: scaffold checks
│   ├── verify_phase_2.py       # Phase 2: contracts + ML checks
│   ├── verify_phase_3.py       # Phase 3: frontend + backend checks
│   └── verify_phase_4.py       # Phase 4: dispute + slashing checks
│
├── supabase/
│   └── migrations/
│       └── 20260912000000_init_schema.sql  # Full DB schema
│
├── PITCH_SCRIPT.md             # 3-minute hackathon stage choreography
└── README.md                   # This file
```

---

## 🚀 Quickstart — Run Locally

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) |
| Python | ≥ 3.11 | [python.org](https://python.org) |
| Foundry | latest | `curl -L https://foundry.paradigm.xyz \| bash` |
| Anvil | (included with Foundry) | — |

### 1. Install Dependencies

```bash
# Contracts
cd contracts && forge install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install

# ML Engine
cd ml-engine && pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy env templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ml-engine/.env.example ml-engine/.env

# Edit backend/.env with your Supabase credentials
# The Sepolia contract addresses are pre-filled
```

### 3. Start All Services (4 terminals)

```bash
# Terminal 1 — Local EVM (Anvil)
cd contracts && anvil --port 8545

# Terminal 2 — ML Anomaly Detection Engine
cd ml-engine && uvicorn app.main:app --reload --port 8000

# Terminal 3 — Backend Relay
cd backend && npm run dev

# Terminal 4 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

> **Note:** For Sepolia testnet mode, set `RPC_URL` in `backend/.env` to your Alchemy Sepolia endpoint and `VITE_RPC_URL` in `frontend/.env` accordingly.

---

## 🌟 The 6 Core Protocol Dashboards

### 🌱 1. Issuer Studio
Project developer workspace. Submit baseline registration with:
- Ground IoT CO₂ flux telemetry (JSON upload)
- Capex invoice hash (SHA-256)
- Live **Copernicus Sentinel-2 NDVI** pull via `/api/satellite/ndvi`
- SHA-256 Merkle root computation + on-chain commit

### 🔍 2. Baseline Explorer  
Public registry with live **14-day challenge window countdowns**, telemetry inspector, risk score display, and "🚩 Challenge Baseline" one-click dispute trigger.

### 🛡️ 3. Verifier Portal
Licensed verifiers stake ETH collateral, review ML anomaly scores, and provide policy-gated approval for NFT minting. Stake is at risk of 50% slash on fraud.

### ⚖️ 4. Auditor Provenance
Regulator / DAO view with the **6-stage cryptographic lifecycle stepper**:
`Register → Commit Evidence → ML Score → Verify → Mint → Dispute/Retire`  
Live dispute arbitration queue and real-time verifier slashing log.

### 🛒 5. Marketplace
Peer-to-peer carbon credit trading. Buyers lock ETH in `EscrowSettlement`, seller transfers NFT, escrow auto-releases. Disputed trades trigger 100% refund.

### 💼 6. Buyer Portfolio
Corporate carbon asset holdings dashboard: escrow locks, NFT metadata, retirement certificates (permanent burn with on-chain proof), and portfolio analytics.

---

## 🧪 Automated Master Test Suite

Run the single master test runner to verify all 5 phases:

```bash
python3 scripts/verify_all.py
```

**What it tests:**

| Check | Description |
|---|---|
| ✅ Foundry contracts | 17+ Solidity test cases: mint, stake, escrow, slash |
| ✅ ML Engine | Pytest suites: anomaly detection, trajectory diff, health |
| ✅ Backend APIs | /health, /satellite/ndvi, /audit/provenance, /disputes |
| ✅ Frontend build | `tsc && vite build` — 0 type errors |
| ✅ Deploy configs | vercel.json, Dockerfile, render.yaml, PITCH_SCRIPT.md |

**Expected output:**
```
=================================================================
   🌿 CARBONYX PROTOCOL — MASTER END-TO-END VERIFICATION 🌿
=================================================================
[1/5] Testing Foundry Smart Contracts...
  🎉 All 17 Solidity test suites passed 100%!
[2/5] Testing ML Anomaly Engine...
  ✓ ML Anomaly Detection model & health checks passed 100%!
[3/5] Testing Backend Services & Copernicus Sentinel-2...
  ✓ Backend health & relayer active
  ✓ Copernicus Sentinel-2 optical telemetry active (NDVI: 0.782)
  ✓ 6-Stage Cryptographic Provenance Stepper verified
  ✓ Live Dispute Arbitration, Token Revocation & 50% Slashing verified
[4/5] Testing React 18 + Vite Production Build...
  ✓ Production build compiled cleanly with 0 type errors!
[5/5] Verifying Deployment Artifacts & Configurations...
  ✓ Configuration verified: vercel.json, Dockerfile, render.yaml, PITCH_SCRIPT.md
=================================================================
  🏆 100% COMPLETE & 1ST PLACE READY ACROSS ALL 5 PHASES! 🏆
=================================================================
```

---

## 🔬 Smart Contract Details

### `CarbonRegistry.sol`
- Registers project DIDs with KYC hash and 14-day challenge window
- Commits multi-source evidence bundles as SHA-256 Merkle roots
- Records ML risk results (correlation met, confidence met, verifier required)
- Records verifier approvals
- Arbitrates disputes: calls `VerifierStakingLedger.slash()` + `EscrowSettlement.refundBuyer()`
- Gates NFT minting via `trustedRelayer` role

### `CarbonCreditNFT.sol`
- ERC-721 with dynamic `CreditStatus`: `ACTIVE | DISPUTED | REVOKED | RETIRED`
- Stores bundle metadata: CO₂ tonnage, vintage year, verifier address
- `retireCredit()` burns token and emits permanent on-chain retirement certificate
- `disputeCredit()` / `resolveDispute()` called by Registry

### `VerifierStakingLedger.sol`
- Verifiers stake ETH; tracked per-address
- `slash(verifier, 50%)` called by Registry on upheld dispute
- Slashed funds go to protocol treasury (configurable)
- Full unstake available only when no active verifications

### `EscrowSettlement.sol`
- Buyer locks ETH against a credit token ID
- Seller calls `settle()` after NFT transfer; ETH released
- `refundBuyer(escrowId)` called by Registry on dispute → 100% ETH returned
- Anti-reentrancy guards on all settlement paths

---

## 🚢 Deployment

### Sepolia Testnet (Live)

```bash
# All 4 contracts deployed and verified. Addresses:
# CarbonCreditNFT:       0x201cF066262ad3B2544bE085860246cD41BdeC21
# VerifierStakingLedger: 0xa78Dbf1D3E4351304F2A9BcE985E78dA2fDaBE8D
# EscrowSettlement:      0x4BFfF0e1661AcFC490C40FA60819Bd4Cf048F533
# CarbonRegistry:        0xD6d094Ce5743e8aC8500F4C3bbEC95347b31dcE0
```

### Re-deploy from Scratch

```bash
cd contracts

# Deploy all 4 contracts
PRIVATE_KEY=0x... forge script script/Deploy.s.sol \
  --rpc-url https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY \
  --broadcast --slow --verify \
  --etherscan-api-key YOUR_ETHERSCAN_KEY

# Verify manually if needed
forge verify-contract <address> src/CarbonRegistry.sol:CarbonRegistry \
  --chain sepolia --etherscan-api-key YOUR_KEY --watch
```

### Cloud Deployment

| Service | Config | Platform |
|---|---|---|
| Frontend | `frontend/vercel.json` | Vercel |
| Backend | `backend/render.yaml` + `backend/Dockerfile` | Render |
| ML Engine | `ml-engine/render.yaml` + `ml-engine/Dockerfile` | Render |

---

## 🗄️ Database Schema (Supabase)

See [`supabase/migrations/20260912000000_init_schema.sql`](./supabase/migrations/20260912000000_init_schema.sql)

Key tables:
- `projects` — registered project DIDs, KYC status, challenge expiry
- `evidence_bundles` — IoT, invoice, satellite data + Merkle root
- `carbon_credits` — minted NFT metadata + on-chain token IDs
- `verifiers` — staked verifiers, reputation scores
- `disputes` — dispute records, resolution outcome, slash amounts
- `trades` — marketplace orders and escrow references

---

## 🎤 Hackathon Pitch & Demo Guide

See [`PITCH_SCRIPT.md`](./PITCH_SCRIPT.md) for the complete 3-minute stage choreography.

**Live demo flow:**
1. Switch to **Issuer** persona → register project → pull Sentinel-2 NDVI → commit Merkle root
2. Switch to **Verifier** persona → stake collateral → review ML score → approve
3. Switch to **Buyer** persona → purchase credit via escrow
4. Switch to **Auditor** persona → challenge baseline → watch 50% slash + 100% refund execute

---

## 📜 License

MIT © 2026 Carbonyx Protocol — HackOut'26
