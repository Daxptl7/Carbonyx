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
| **Jash Bohare** (Blockchain / Smart Contracts & Web3) | Modules 102, 114, 116, 118, 120, 122, 124 | Directory: `/contracts`<br>• `CarbonRegistry.sol`, `CarbonCreditNFT.sol`<br>• `VerifierStakingLedger.sol`, `EscrowSettlement.sol`<br>• Foundry Unit & Invariant Tests<br>• Local Anvil & Sepolia Deployment Scripts |
| **Dax** (Full-Stack + AI/ML Integration) | Modules 104, 106, 108, 110, 112 | Directory: `/backend`<br>• Node.js/Express Server + `@supabase/supabase-js`<br>• Merkle Tree Calculation Engine<br>• Relayer Oracle Transaction Signing<br>• On-Chain Event Listener Synchronization |
| **Siddhant** (AI/ML Engine) | Modules 110, 112 | Directory: `/ml-engine`<br>• Python FastAPI Service (`/score`)<br>• Isolation Forest & Z-Score Anomaly Models<br>• Plain-language XAI Reasoner Generator<br>• Verifier Assignment Scoring Matrix (`supabase-py`) |
| **Hilag** (MERN Stack & UI/UX) | Modules 102, 114, 118, 120, 124 | Directory: `/frontend`<br>• React / Vite / Tailwind UI<br>• Supabase Realtime WebSocket Hooks<br>• 4 Persona Dashboards (Issuer, Verifier, Buyer, Auditor)<br>• Dynamic NFT Certificate Cards & Escrow Buy Modal |

## 3. Detailed Phase Milestones

### Phase 1: Environment & Supabase Setup (Hours 00–06)
- Apply Supabase PostgreSQL migrations (`/supabase/migrations/20260912000000_init_schema.sql`).
- Create Supabase Storage buckets: `evidence-vault` and `certificates`.
- Initialize Foundry project with OpenZeppelin ERC-721 contracts in `/contracts`.
- Scaffold Express backend in `/backend`, FastAPI in `/ml-engine`, and React Vite in `/frontend`.

### Phase 2: Core Verification & Minting Pipeline (Hours 06–16)
- **Jash:** Implement `CarbonRegistry.sol` policy gates & `CarbonCreditNFT.sol`.
- **Dax:** Implement multi-source evidence ingestion + SHA-256 Merkle tree calculation in Node.js.
- **Siddhant:** Implement `/score` endpoint with Isolation Forest anomaly detection in FastAPI.
- **Hilag:** Build Issuer Registration form with deterministic DID generation and Supabase storage upload.

### Phase 3: Staking, Escrow & Marketplace (Hours 16–24)
- **Jash:** Implement `VerifierStakingLedger.sol` (`stake()`, `slash()`) and `EscrowSettlement.sol` (`buyWithEscrow()`).
- **Dax:** Connect on-chain event listener to update Supabase records in real time.
- **Hilag:** Build Verifier Staking Dashboard, Marketplace UI with Escrow buy modal, and NFT Certificate cards.
- **Siddhant:** Wire verifier assignment matrix ranking staked verifiers.

### Phase 4: Integration, Dispute Flow & Demo Polish (Hours 24–36)
- Wire end-to-end flows: Clean Auto-Mint Scenario vs. Fraud Prevention & Slashing Scenario.
- Validate Supabase Realtime subscriptions dynamically update frontend state without page refreshes.
- Seed deterministic test projects (Forestry, Blue Carbon, Methane).
- Rehearse the 3-minute pitch demo.
