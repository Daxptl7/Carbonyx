# Roadmap / Execution Plan

## 1. 36-Hour Sprint Execution Plan

```
[Hours 00-06] Foundation: Supabase Schema Migrations, Monorepo Scaffolding, Foundry Setup
[Hours 06-16] Core Verification: Contracts, Relayer, FastAPI ML Engine, DID/KYC, Merkle Ingestion
[Hours 16-24] Patent Differentiators: Verifier Staking Ledger, Escrow Settlement, Dynamic NFT Cards
[Hours 24-30] Realtime Integration: Supabase WebSocket UI Updates, Clean vs. Fraud Demo Stories
[Hours 30-36] Polish: Seed Data Generation, Live Demo Dry Runs & Pitch Deck Alignment
```

## 2. Team Responsibility Matrix

| Member | Primary Modules Owned | Key Deliverables |
| :--- | :--- | :--- |
| **Jash Bohare** (Blockchain / Smart Contracts & Web3) | Modules 102, 114, 116, 118, 120, 122, 124 | `CarbonRegistry.sol`, `CarbonCreditNFT.sol`, `VerifierStakingLedger.sol`, `EscrowSettlement.sol`, Foundry Unit & Invariant Tests, Local Anvil & Sepolia Deployment |
| **Dax** (Full-Stack + AI/ML Integration) | Modules 104, 106, 108, 110, 112 | Backend Orchestrator (Node.js/Express + `@supabase/supabase-js`), Merkle Tree Engine, Relayer Oracle, On-Chain Event Listener |
| **Siddhant** (AI/ML Engine) | Modules 110, 112 | Python FastAPI Service, Isolation Forest & Z-Score anomaly models (`supabase-py`), Plain-language XAI reasoner |
| **Hilag** (MERN Stack & UI/UX) | Modules 102, 114, 118, 120, 124 | React/Vite Frontend, Supabase Realtime WebSocket hooks, 4 Persona Dashboards, Marketplace & Escrow UI, Dynamic NFT Cards |

## 3. Detailed Phase Milestones

### Phase 1: Environment & Supabase Setup (Hours 00–06)
- Apply Supabase PostgreSQL migrations (`projects`, `evidence_bundles`, `evidence_items`, `risk_assessments`, `verifier_stakes`, `carbon_credit_nfts`, `escrows`, `disputes`).
- Create Supabase Storage buckets: `evidence-vault` and `certificates`.
- Initialize Foundry project with OpenZeppelin ERC-721 contracts.
- Scaffold FastAPI Python service and React Vite frontend.

### Phase 2: Core Verification & Minting Pipeline (Hours 06–16)
- Jash: Implement `CarbonRegistry.sol` policy gates & `CarbonCreditNFT.sol`.
- Dax: Implement multi-source evidence ingestion + SHA-256 Merkle tree calculation in Node.js.
- Siddhant: Implement `/score` endpoint with Isolation Forest anomaly detection in FastAPI.
- Hilag: Build Issuer Registration form with deterministic DID generation and Supabase storage upload.

### Phase 3: Staking, Escrow & Marketplace (Hours 16–24)
- Jash: Implement `VerifierStakingLedger.sol` (`stake()`, `slash()`) and `EscrowSettlement.sol` (`buyWithEscrow()`).
- Dax: Connect on-chain event listener to update Supabase records in real time.
- Hilag: Build Verifier Staking Dashboard, Marketplace UI with Escrow buy modal, and NFT Certificate cards.
- Siddhant: Wire verifier assignment matrix ranking staked verifiers.

### Phase 4: Integration, Dispute Flow & Demo Polish (Hours 24–36)
- Wire end-to-end flows: Clean Auto-Mint Scenario vs. Fraud Prevention & Slashing Scenario.
- Validate Supabase Realtime subscriptions dynamically update frontend state without page refreshes.
- Rehearse the 3-minute pitch demo.
