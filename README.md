# 🌿 Carbonyx — Verifiable Carbon Credit & Offset Tracking Protocol

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-orange.svg)](https://getfoundry.sh/)
[![Express](https://img.shields.io/badge/Backend-Express%20%2B%20TypeScript-lightgrey.svg)](https://expressjs.com/)
[![FastAPI](https://img.shields.io/badge/ML%20Engine-FastAPI%20%2B%20Python-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61dafb.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![Arbitrum](https://img.shields.io/badge/Network-Arbitrum%20Sepolia-28A0F0.svg)](https://sepolia.arbiscan.io/)

> **Carbonyx** is an enterprise-grade, end-to-end verifiable carbon credit registry and marketplace protocol. Built for high-integrity environmental assets, it enforces a **12-Module Cryptographic & AI Pipeline** spanning decentralized identity (DID/KYC), multi-source IoT/satellite telemetry, SHA-256 Merkle root hashing, Isolation Forest anomaly scoring, verifier staking/slashing, policy-gated dynamic ERC-721 NFT minting, decentralized dispute resolution, and atomic escrow settlement.

---

## 📑 Table of Contents

1. [The Problem & The Solution](#-the-problem--the-solution)
2. [Key Innovations & Unique Value](#-key-innovations--unique-value)
3. [Architecture & System Flow](#-architecture--system-flow)
4. [Monorepo Structure](#-monorepo-structure)
5. [Prerequisites](#-prerequisites)
6. [MetaMask & Supported Networks](#-metamask--supported-networks)
7. [Environment Variables Setup](#-environment-variables-setup)
8. [Running the Services Locally (Quickstart)](#-running-the-services-locally-quickstart)
   - [Terminal 1: Smart Contracts (Foundry / Anvil)](#1-smart-contracts-foundry--anvil)
   - [Terminal 2: AI / ML Engine (FastAPI)](#2-ai--ml-engine-fastapi)
   - [Terminal 3: Backend Relayer API (Express + TypeScript)](#3-backend-relayer-api-express--typescript)
   - [Terminal 4: Frontend Web3 Application (React + Vite)](#4-frontend-application-react--vite)
9. [Pre-Seeded Demo Accounts & RBAC](#-pre-seeded-demo-accounts--rbac)
10. [Supabase Database Setup](#-supabase-database-setup)
11. [Automated Testing & Verification](#-automated-testing--verification)
12. [License & Acknowledgments](#-license--acknowledgments)

---

## 🎯 The Problem & The Solution

### The Unsolved Problem: "Phantom Credits" & Greenwashing
The Voluntary Carbon Market (VCM) is projected to reach **$40B+ by 2030**, yet it suffers from catastrophic integrity issues:
* **"Garbage In, Garbage On-Chain":** Existing Web3 carbon protocols simply tokenize legacy paper certificates. If fraudulent data enters the pipeline, the blockchain only immortalizes fraud.
* **Manual, Opaque Verification:** Traditional registries (Verra, Gold Standard) rely on self-reported PDFs and site visits every few years, taking 6–18 months and leading to phantom forestry credits.
* **Zero Verifier Accountability:** Environmental auditing bodies get paid upfront regardless of whether the sequestered carbon survives or burns down.
* **Double Counting & Buyer Risk:** Corporate buyers face severe greenwashing liability (SEC, EU CSRD) with zero refund mechanisms if credits are exposed as fraudulent post-purchase.

### The Carbonyx Solution: Evidence-First Verification
**Carbonyx flips the paradigm: environmental evidence must be cryptographically authenticated, cross-checked by AI, and backed by verifier collateral *before* any credit is minted.**

* **Multi-Source Telemetry:** Ingests ground IoT sensors (soil moisture, canopy coverage), satellite multispectral data (Copernicus/Sentinel-2 NDVI), and operational logs.
* **Cryptographic Merkle Commitments:** Every telemetry bundle is hashed into a SHA-256 Merkle root committed directly to the smart contract.
* **AI Anomaly Detection:** An Isolation Forest machine learning engine scores cross-source divergence in real time, generating an explainable confidence score.
* **Smart Contract Policy Gates:** Dynamic ERC-721 NFTs cannot be minted unless AI confidence passes and an audited verifier approves.
* **Economic Staking & 50% Slashing:** Verifiers post collateral; if an approved credit is revoked during a challenge, **50% of the verifier's stake is slashed**.
* **Atomic Escrow & Buyer Insurance:** Secondary trades lock buyer funds in escrow, automatically refunding the buyer if a credit is revoked during the dispute window.
* **Permanent Retirement Proof:** Tokens are burned on-chain to generate an unforgeable, publicly verifiable Certificate of Retirement.

---

## 💡 Key Innovations & Unique Value

| Feature | Legacy Carbon Registries | Tokenized Web2 Carbon | Carbonyx Protocol |
| :--- | :---: | :---: | :---: |
| **Evidence Validation** | Manual self-reported PDFs | Tokenized legacy PDFs | **Cryptographic IoT + Satellite Telemetry** |
| **Pre-Mint Verification** | None (Post-issuance audits) | None ("Garbage in, garbage out") | **Real-time AI Anomaly & Confidence Gates** |
| **Audit Provenance** | Centralized database | Block explorer link | **SHA-256 Merkle Root on-chain commitment** |
| **Verifier Accountability** | Zero financial penalty | Zero financial penalty | **On-chain Staking with 50% Slashing Pool** |
| **Buyer Protection** | Non-refundable | Non-refundable | **Trustless Atomic Escrow Settlement** |
| **Double-Count Prevention** | Manual registry mark | Burn address | **Cryptographic On-Chain Burn Certificate** |

---

## 🏛 Architecture & System Flow

```mermaid
flowchart TD
    subgraph Data_Sources ["1. Multi-Source Telemetry"]
        A1[IoT Ground Sensors]
        A2[Sentinel-2 Satellite NDVI]
        A3[Operational Logs]
    end

    subgraph Evidence_Hashing ["2. Cryptographic Engine"]
        A1 & A2 & A3 --> B[SHA-256 Merkle Tree Construction]
        B -->|bytes32 merkleRoot| C[On-Chain Commitment]
    end

    subgraph AI_Engine ["3. AI Anomaly Engine"]
        A1 & A2 --> D[FastAPI ML Service]
        D -->|Isolation Forest & Z-Score| E[Anomaly & Confidence Score]
    end

    subgraph OnChain_Core ["4. Smart Contract Policy Gates"]
        C & E --> F{Policy Engine Check}
        G[Verifier Staking Ledger] -->|Collateral Stake| F
        F -->|Passed| H[Dynamic ERC-721 NFT Minted]
        F -->|Failed / Flagged| I[Escalated Verifier Review]
    end

    subgraph Lifecycle ["5. Marketplace & Retirement"]
        H --> J[Atomic Escrow Settlement]
        J -->|Trade Completed| K[Secondary Buyer]
        K -->|Permanent Burn| L[On-Chain Retirement Certificate]
        J -->|Dispute Upheld| M[Buyer Refunded + Verifier Slashed 50%]
    end
```

---

## 📁 Monorepo Structure

```
Carbonyx/
├── contracts/          # Solidity 0.8.20 smart contracts (Foundry framework)
│   ├── src/            # Core contracts (CarbonRegistry, CarbonCreditNFT, VerifierStakingLedger, EscrowSettlement)
│   ├── script/         # Foundry deployment scripts
│   └── test/           # Solidity unit and integration test suites
├── backend/            # Node.js + Express + TypeScript API Relayer & Event Listener
│   ├── src/config/     # Supabase client and environment config
│   ├── src/routes/     # REST routes (ingestion, verification, disputes, etc.)
│   └── src/server.ts   # Express server entry point
├── ml-engine/          # Python FastAPI service for AI anomaly detection & risk scoring
│   ├── app/models/     # Isolation Forest & baseline verification models
│   ├── app/api/        # FastAPI endpoints (/health, /score)
│   └── tests/          # Pytest automated test suites
├── frontend/           # React 18 + Vite + TypeScript + Tailwind CSS Web3 DApp
│   ├── src/components/ # UI components (Issuer Studio, Verifier Portal, Marketplace, etc.)
│   ├── src/lib/        # Web3 wallet connector, contract ABIs & Supabase client
│   └── src/App.tsx     # Main application routing & layout
├── supabase/           # PostgreSQL schema migrations, RLS policies, & bucket configs
│   └── migrations/     # Versioned SQL migrations
├── scripts/            # Cross-service verification & dev tooling scripts
└── Specs/              # Technical specifications & architecture reference (Modules 01-13)
```

---

## 🧰 Prerequisites

Make sure the following tools are installed on your machine (macOS / Linux / WSL2):

| Tool | Recommended Version | Verification Command |
| :--- | :---: | :--- |
| **Node.js** | `v20.x` or `v22.x` | `node -v` |
| **npm** | `v10.x+` | `npm -v` |
| **Python** | `3.10+` | `python3 --version` |
| **Foundry** | Latest | `forge --version && anvil --version` |
| **Git** | `2.x+` | `git --version` |
| **MetaMask** | Browser Extension | [metamask.io/download](https://metamask.io/download/) |

---

## 🦊 MetaMask & Supported Networks

Carbonyx dynamically detects your connected network and displays the live **Chain ID** in the header.

| Network | Chain ID | RPC URL | Purpose |
| :--- | :---: | :--- | :--- |
| **Anvil Localhost** | `31337` | `http://127.0.0.1:8545` | Local zero-cost instant development |
| **Arbitrum Sepolia** | `421614` | `https://sepolia-rollup.arbitrum.io/rpc` | Public L2 testnet deployment & judging |

### Adding Anvil Localhost to MetaMask:
1. Open MetaMask -> **Network Selector** -> **Add Network** -> **Add a network manually**.
2. **Network Name:** `Anvil Localhost`
3. **RPC URL:** `http://127.0.0.1:8545`
4. **Chain ID:** `31337`
5. **Currency Symbol:** `ETH`
6. Click **Save** and switch to Anvil Localhost.

#### Import a Pre-Funded Test Account (10,000 test ETH):
* In MetaMask, click your avatar -> **Add account or hardware wallet** -> **Import account**.
* Paste Anvil Account #0 Private Key:
  ```text
  0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  ```

---

## ⚙ Environment Variables Setup

Ensure your local `.env` files are configured for each service:

### 1. Backend (`backend/.env`)
```env
PORT=5005
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:yourpassword@db.your-project.supabase.co:5432/postgres
AUTH_TOKEN_SECRET=replace-with-at-least-32-random-characters
VERIFIER_SIGNUP_CODE=verifier-invite-2026
AUDITOR_SIGNUP_CODE=auditor-invite-2026
ML_ENGINE_URL=http://localhost:8000
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
```

### 2. Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5005
VITE_ML_ENGINE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_CHAIN_ID=31337
VITE_SHOW_DEMO_ACCOUNTS=true
```

### 3. ML Engine (`ml-engine/.env`)
```env
PORT=8000
ENVIRONMENT=development
LOG_LEVEL=info
MODEL_PATH=model/anomaly_model.pkl
RPC_URL=http://127.0.0.1:8545
```

---

## 🚀 Running the Services Locally (Quickstart)

Open **4 separate terminal tabs** from the project root:

### 1. Smart Contracts (Foundry / Anvil)
```bash
cd contracts

# Compile Solidity smart contracts
forge build

# Run smart contract unit tests
forge test

# Start local Anvil blockchain node
anvil
```
*Anvil runs on port `8545` with pre-funded accounts.*

---

### 2. AI / ML Engine (FastAPI)
```bash
cd ml-engine

# Create & activate Python virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
*FastAPI runs on `http://localhost:8000`. Interactive docs are live at `http://localhost:8000/docs`.*

---

### 3. Backend Relayer API (Express + TypeScript)
```bash
cd backend

# Install dependencies
npm install

# Start Express server with hot-reload
npm run dev
```
*Backend API runs on `http://localhost:5005` (Health check: `http://localhost:5005/health`).*

---

### 4. Frontend Application (React + Vite)
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Web3 DApp opens at `http://localhost:5173`.*

---

## 👥 Pre-Seeded Demo Accounts & RBAC

The platform includes 4 demo identities with distinct protocol privileges:

| Protocol Role | Username | Password | Authorized Scope |
| :--- | :--- | :--- | :--- |
| **Project Proponent** | `proponent.demo` | `Carbon@2026` | Project registration, telemetry ingestion, Merkle proof inspection, mint requests |
| **Independent Verifier** | `verifier.demo` | `Verify@2026` | Collateral staking, review queue, AI anomaly risk audits |
| **Corporate Buyer** | `buyer.demo` | `Buyer@2026` | Marketplace credit purchasing, atomic escrow, permanent retirement burns |
| **Regulator / Auditor** | `auditor.demo` | `Audit@2026` | Provenance audits, project objections, dispute resolution, slashing review |

*Click any role card on the login screen to autofill credentials instantly.*

---

## 🗄 Supabase Database Setup

Carbonyx uses Supabase PostgreSQL for the off-chain evidence vault, DID records, and dispute indexing:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the migrations in order from `supabase/migrations/`:
   * `20260912000000_init_schema.sql`
   * `20260912010000_app_users_rbac.sql`
   * `20260912020000_phase3_rbac_integration.sql`
   * `20260912030000_project_registry_objections.sql`
   * `20260912040000_regulator_oversight.sql`
3. Verify that 13 tables are created under **Table Editor** (e.g., `projects`, `evidence_bundles`, `carbon_credit_nfts`, `escrows`, `verifier_stakes`, `disputes`).
4. Ensure storage buckets exist: `evidence-vault` (Private) and `certificates` (Public).

---

## 🧪 Automated Testing & Verification

Run the unified end-to-end multi-service test suite in a single command:

```bash
python3 scripts/verify_phase_1.py
```

### What It Verifies:
1. **Foundry Smart Contracts:** `forge build` & `forge test`
2. **FastAPI ML Service:** GET `http://localhost:8000/health` & prediction endpoint
3. **Express Backend:** GET `http://localhost:5005/health` (including Supabase connectivity)
4. **React Frontend:** Production bundle compilation (`npm run build`)
5. **Database Schema:** Active tables & read/write integrity

---

## 📜 License & Acknowledgments

Built for **HackOut'26** by Team Carbonyx.
* **Smart Contracts:** MIT License
* **Compliant with:** 12-Module Evidence-First Verifiable Carbon Offset Process Architecture
