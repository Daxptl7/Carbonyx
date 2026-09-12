# Carbonyx — Verifiable Carbon Credit & Offset Tracking Protocol

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-orange.svg)](https://getfoundry.sh/)
[![Express](https://img.shields.io/badge/Backend-Express%20%2B%20TypeScript-lightgrey.svg)](https://expressjs.com/)
[![FastAPI](https://img.shields.io/badge/ML%20Engine-FastAPI%20%2B%20Python-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61dafb.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E.svg)](https://supabase.com/)

> **Carbonyx** is an enterprise-grade, end-to-end verifiable carbon credit registry and marketplace protocol. Built for high-integrity environmental assets, it enforces a **12-Module Cryptographic & AI Pipeline** spanning decentralized identity (DID/KYC), multi-source IoT/satellite telemetry, SHA-256 Merkle root hashing, Isolation Forest anomaly scoring, verifier staking/slashing, policy-gated dynamic ERC-721 NFT minting, decentralized dispute resolution, and atomic escrow settlement.

---

## 📑 Table of Contents

1. [Architecture & Monorepo Structure](#-architecture--monorepo-structure)
2. [Prerequisites](#-prerequisites)
3. [MetaMask Setup & Configuration](#-metamask-setup--configuration)
4. [Supabase Setup Guide](#-supabase-setup-guide)
5. [Environment Variables Configuration](#-environment-variables-configuration)
6. [Running the Services Locally](#-running-the-services-locally)
   - [1. Smart Contracts (Foundry / Anvil)](#1-smart-contracts-foundry--anvil)
   - [2. AI / ML Engine (FastAPI)](#2-ai--ml-engine-fastapi)
   - [3. Backend Relayer API (Express + TypeScript)](#3-backend-relayer-api-express--typescript)
   - [4. Frontend Application (React + Vite)](#4-frontend-application-react--vite)
7. [Automated Testing & Verification](#-automated-testing--verification)
8. [Team Roles & Ownership](#-team-roles--ownership)
9. [Troubleshooting & Common Issues](#-troubleshooting--common-issues)

---

## 🏛 Architecture & Monorepo Structure

```
Carbonyx/
├── contracts/          # Solidity smart contracts (Foundry framework)
│   ├── src/            # Core contracts & interfaces (CarbonRegistry, CarbonCreditNFT, etc.)
│   ├── script/         # Foundry deployment scripts
│   └── test/           # Solidity unit and integration tests
├── backend/            # Node.js + Express + TypeScript API Relayer & Event Listener
│   ├── src/config/     # Supabase client and environment config
│   ├── src/routes/     # REST routes (health, ingestion, verification, etc.)
│   └── src/server.ts   # Express server entry point
├── ml-engine/          # Python FastAPI service for AI anomaly detection & risk scoring
│   ├── src/models/     # Isolation Forest & baseline verification models
│   ├── src/api/        # FastAPI endpoints (/health, /score)
│   └── tests/          # Pytest automated test suites
├── frontend/           # React 18 + Vite + TypeScript + Tailwind CSS Web3 DApp
│   ├── src/components/ # UI components (Header, Navigation, Issuer Studio, etc.)
│   ├── src/lib/        # Web3 wallet connector & API clients
│   └── src/App.tsx     # Main application routing & layout
├── supabase/           # Database migrations, RLS policies, & bucket configurations
│   └── migrations/     # PostgreSQL SQL schema migrations
├── scripts/            # Cross-service verification & dev tooling scripts
└── Specs/              # Frozen technical specifications (Modules 01-13)
```

---

## 🧰 Prerequisites

Ensure you have the following installed on your machine (Linux / macOS / WSL2 on Windows recommended):

| Tool | Recommended Version | Installation Command / Link |
| :--- | :---: | :--- |
| **Node.js** | `v20.x` or `v22.x` | [Node.js Official](https://nodejs.org/) or `nvm install 20` |
| **npm** | `v10.x+` | Included with Node.js |
| **Python** | `3.10+` | `sudo apt install python3 python3-pip python3-venv` |
| **Foundry** | Latest | `curl -L https://foundry.paradigm.xyz | bash && foundryup` |
| **Git** | `2.x+` | `sudo apt install git` |
| **MetaMask** | Browser Extension | [metamask.io/download](https://metamask.io/download/) |

---

## 🦊 MetaMask Setup & Supported Networks

To interact with the Carbonyx frontend and smart contracts, configure MetaMask. The frontend automatically detects your active network and displays its live **Chain ID** in the header.

### 1. Install MetaMask
- Visit [https://metamask.io/download/](https://metamask.io/download/) and install the extension for Chrome, Brave, Edge, or Firefox.
- Create a new wallet or import an existing recovery phrase.

---

### 2. Supported Networks & Chain IDs

| Network | Chain ID | RPC URL | Purpose |
| :--- | :---: | :--- | :--- |
| **Anvil Localhost** | `31337` | `http://127.0.0.1:8545` | Offline local development & zero-cost instant testing |
| **Arbitrum Sepolia** | `421614` | `https://sepolia-rollup.arbitrum.io/rpc` | Public L2 testnet deployment & hackathon live judging |

---

### 3. Adding Anvil Localhost to MetaMask (Local Development)
1. Open MetaMask, click the **Network Selector** dropdown in the top-left corner, and click **Add Network** -> **Add a network manually**.
2. Fill in the network details:
   - **Network Name:** `Anvil Localhost`
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Click **Save** and switch to **Anvil Localhost**.

#### Importing an Anvil Test Account with Pre-Funded ETH:
When you run `anvil` in the `/contracts` directory, it generates 10 test accounts pre-funded with 10,000 test ETH.
- In MetaMask, click your account avatar -> **Add account or hardware wallet** -> **Import account**.
- Paste one of the test private keys generated by Anvil (e.g. Account #0: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`).

---

### 4. Adding Arbitrum Sepolia Testnet (Testnet / Live Demo)
1. Open MetaMask -> **Network Selector** -> **Add Network** -> **Add a network manually**:
   - **Network Name:** `Arbitrum Sepolia`
   - **New RPC URL:** `https://sepolia-rollup.arbitrum.io/rpc`
   - **Chain ID:** `421614`
   - **Currency Symbol:** `ETH`
   - **Block Explorer:** `https://sepolia.arbiscan.io/`
2. Get testnet faucet tokens: [Arbitrum Sepolia Faucet](https://faucets.chain.link/).

---

## 🗄 Supabase Setup Guide

Carbonyx uses **Supabase PostgreSQL** for its off-chain evidence vault, DID registry, risk assessment logs, and dispute indexing.

### Option A: Use the Team's Existing Supabase Project
Ask the team lead for the `.env` credentials and skip to [Environment Variables Configuration](#-environment-variables-configuration).

---

### Option B: Create Your Own Supabase Project (Step-by-Step)

1. **Sign Up / Log In:** Go to [supabase.com](https://supabase.com) and log in.
2. **Create New Project:**
   - Click **New Project**.
   - Select your organization.
   - **Name:** `carbonyx-db` (or any name).
   - **Database Password:** Enter a strong password and save it securely.
   - **Region:** Choose the region closest to you.
   - Click **Create new project** and wait 1-2 minutes for provisioning.

3. **Get Your API Keys & URL:**
   - In your project dashboard, navigate to **Project Settings** (gear icon) -> **API**.
   - Copy **Project URL** (e.g., `https://xxxxxxxx.supabase.co`).
   - Copy **anon (public)** key.
   - Copy **service_role (secret)** key (keep this secret!).

4. **Get Your Database Connection String:**
   - Go to **Project Settings** -> **Database**.
   - Scroll to **Connection string** -> **URI** mode.
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres`.

5. **Deploy the Database Schema:**
   - In the Supabase sidebar, go to the **SQL Editor** (terminal icon).
   - Click **New query**.
   - Copy the entire contents of the file:
     `supabase/migrations/20260912000000_init_schema.sql`
   - Paste it into the SQL Editor and click **Run**.
   - Verify that all 8 tables are created in the **Table Editor**:
     1. `projects`
     2. `evidence_bundles`
     3. `evidence_items`
     4. `risk_assessments`
     5. `verifier_stakes`
     6. `carbon_credit_nfts`
     7. `escrows`
     8. `disputes`
   - Verify that the 2 storage buckets exist under **Storage**:
     1. `evidence-vault` (Private)
     2. `certificates` (Public)

---

## ⚙ Environment Variables Configuration

You need three `.env` files across the monorepo. Create them by copying the sample templates:

### 1. Backend: `/backend/.env`
Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_URL=postgresql://postgres:yourpassword@db.your-project.supabase.co:5432/postgres
ML_ENGINE_URL=http://localhost:8000
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
```

### 2. Frontend: `/frontend/.env`
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_ML_ENGINE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_CHAIN_ID=31337
```

### 3. ML Engine: `/ml-engine/.env`
Create `ml-engine/.env`:
```env
PORT=8000
ENVIRONMENT=development
LOG_LEVEL=info
MODEL_PATH=models/isolation_forest.joblib
```

---

## 🚀 Running the Services Locally

Follow these steps in separate terminal tabs to bring up the full stack:

### 1. Smart Contracts (Foundry / Anvil)

Open Terminal Tab 1:
```bash
cd contracts

# Install dependencies
forge install

# Compile contracts
forge build

# Run Solidity tests
forge test -v

# Start local Anvil blockchain node
anvil
```
*Keep Anvil running on port 8545.*

---

### 2. AI / ML Engine (FastAPI)

Open Terminal Tab 2:
```bash
cd ml-engine

# Create & activate Python virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run unit tests
pytest tests/

# Start FastAPI server
uvicorn src.main:app --reload --port 8000
```
*FastAPI runs on `http://localhost:8000` (Interactive docs available at `http://localhost:8000/docs`).*

---

### 3. Backend Relayer API (Express + TypeScript)

Open Terminal Tab 3:
```bash
cd backend

# Install dependencies
npm install

# Start Express in development mode with live reload
npm run dev
```
*Backend API runs on `http://localhost:5000` (`http://localhost:5000/health` returns status).*

---

### 4. Frontend Application (React + Vite)

Open Terminal Tab 4:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend opens at `http://localhost:3000` or `http://localhost:5173`.*

---

## 🧪 Automated Testing & Verification

We provide an automated multi-step verification test suite that verifies the health and integrity of all components in one command:

```bash
# From the repository root
python3 scripts/verify_phase_1.py
```

### What It Verifies:
1. **Foundry Smart Contracts:** `forge build` & `forge test`
2. **FastAPI ML Service:** GET `http://localhost:8000/health`
3. **Express Backend:** GET `http://localhost:5000/health` (including Supabase connectivity)
4. **React Frontend:** Production bundle compilation (`npm run build`)
5. **Supabase Database:** Active table schemas & read/write integrity

---

## 📜 License & Acknowledgments
Built for **HackOut'26** by Team Carbonyx. Compliant with the 12-Module Verifiable Carbon Offset Process Architecture.
