# Roadmap / Execution Plan

## 1. 36-Hour Sprint Execution Plan

```
[Hours 00-06] Foundation & Frozen Interfaces (Specs, Monorepo Setup, Foundry & FastAPI scaffolding)
[Hours 06-16] Core Pipeline (Contracts, Relayer, Anomaly Engine, DID/KYC, Merkle Engine)
[Hours 16-24] Patent Differentiators (Verifier Staking, Escrow Settlement, Dynamic NFT Cards)
[Hours 24-30] End-to-End Integration (Full Happy Path + Fraud Prevention Escalation Demo)
[Hours 30-36] UI Polish, Seed Data Generation, Live Demo Dry Runs & Pitch Deck Alignment
```

## 2. Team Responsibility Matrix

| Member | Primary Modules Owned | Key Deliverables |
| :--- | :--- | :--- |
| **Jash Bohare** (Blockchain / Smart Contracts & Web3) | Modules 102, 114, 116, 118, 120, 122, 124 | `CarbonRegistry.sol`, `CarbonCreditNFT.sol`, `VerifierStakingLedger.sol`, `EscrowSettlement.sol`, Foundry Unit & Invariant Tests, Local Anvil & Sepolia Deployment |
| **Dax** (Full-Stack + AI/ML Integration) | Modules 104, 106, 108, 110, 112 | Backend Orchestrator (Node.js/Express), Merkle Tree Engine, Relayer Oracle, On-chain Event Listener, ML Engine API Integration |
| **Siddhant** (AI/ML Engine) | Modules 110, 112 | Python FastAPI Service, Isolation Forest & Z-Score anomaly detectors, Plain-language XAI reasoner, Verifier assignment scoring algorithm |
| **Hilag** (MERN Stack & UI/UX) | Modules 102, 114, 118, 120, 124 | React/Vite Frontend, 4 Persona Dashboards (Issuer, Verifier, Buyer, Auditor), Marketplace & Escrow UI, Dynamic NFT Certificate Cards |

## 3. Detailed Phase Milestones

### Phase 1: Environment & Interface Freeze (Hours 00–06)
- Setup Foundry project with OpenZeppelin ERC-721 contracts.
- Setup Node.js Express backend with MongoDB and Ethers.js.
- Setup Python FastAPI ML service with scikit-learn.
- Setup React frontend with Tailwind CSS and Lucide icons.

### Phase 2: Core Verification & Minting Pipeline (Hours 06–16)
- Jash: Implement `CarbonRegistry.sol` policy gates & `CarbonCreditNFT.sol`.
- Dax: Implement multi-source evidence ingestion + SHA-256 Merkle tree calculation.
- Siddhant: Build `/score` endpoint with Isolation Forest anomaly detection.
- Hilag: Build Issuer Registration form with deterministic DID generation.

### Phase 3: Staking, Escrow & Marketplace (Hours 16–24)
- Jash: Implement `VerifierStakingLedger.sol` (`stake()`, `slash()`) and `EscrowSettlement.sol` (`buyWithEscrow()`).
- Dax: Implement Verifier assignment queue and Escrow settlement backend routes.
- Hilag: Build Verifier Staking Dashboard, Marketplace UI with Escrow buy modal, and NFT Certificate cards.
- Siddhant: Train anomaly models with high-discrepancy satellite test data.

### Phase 4: Integration, Dispute Flow & Demo Polish (Hours 24–36)
- Wire end-to-end flows: Clean Auto-Mint Scenario vs. Fraud Prevention & Slashing Scenario.
- Seed deterministic test projects (Forestry, Blue Carbon, Methane).
- Verify audit explorer shows 100% cryptographic trace of all 12 patent modules.
- Rehearse the 3-minute pitch demo.
