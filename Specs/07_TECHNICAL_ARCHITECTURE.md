# Technical Architecture

## 1. System Architecture Overview

Carbonyx is built as a modular, decentralized circular carbon tracking protocol spanning 12 structural modules defined in the Process Patent.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Frontend (React / Vite)                       │
│    Issuer Studio  │  Verifier Portal  │  Marketplace  │  Explorer      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API / Ethers.js Wallet Signing
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Backend Orchestrator (Node.js / Express)             │
│  - Identity & DID Generator (Mod 102)                                  │
│  - Evidence Ingestion & Cryptographic Validator (Mod 104, 108)         │
│  - Merkle Tree Hash Aggregator (Mod 106)                               │
│  - Trusted Relayer & On-Chain Event Listener                           │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │ JSON RPC                      │ Internal REST
                    ▼                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       Blockchain Smart Contracts     │  │      AI/ML Engine (FastAPI)  │
│  - CarbonRegistry.sol (Mod 102, 116) │  │  - Multi-Source Correlator   │
│  - CarbonCreditNFT.sol (Mod 118, 120)│  │  - Isolation Forest Anomaly  │
│  - VerifierStakingLedger.sol(112,114)│  │  - Z-Score Delta Analyzer    │
│  - EscrowSettlement.sol (Mod 124)    │  │  - Explainable XAI Reasoner  │
│  - DisputeRevocation.sol (Mod 122)   │  └──────────────────────────────┘
└──────────────────────────────────────┘
```

## 2. On-Chain vs. Off-Chain Separation of Concerns

- **Off-Chain Execution:**
  - Raw evidence storage (telemetry JSON, satellite NDVI images, audit PDFs).
  - Heavy computation (Merkle leaf computation, ML anomaly scoring, LLM/heuristic reasoning).
  - Web3 event indexing and fast querying for the frontend UI.
- **On-Chain Enforcement:**
  - Cryptographic root commitments (`bytes32 merkleRoot`).
  - Gated smart contract issuance policy (cannot mint without satisfied boolean flags).
  - Verifier collateral staking balance, reputation ledger, and slashing execution.
  - Escrow fund lock, release, and buyer refund logic.
  - Dynamic NFT ownership, transfer restrictions, and irreversible retirement state.

## 3. Architecture Decision Records (ADRs)

### ADR-001: Monorepo Structure
- **Decision:** Use a single repository containing `/contracts` (Foundry), `/backend` (Node.js), `/ml-engine` (Python FastAPI), and `/frontend` (React/Vite).
- **Rationale:** Enables atomic updates across smart contract ABIs, backend models, and frontend UI without package publishing overhead during a 36-hour sprint.

### ADR-002: Dual-Write & Relayer Architecture
- **Decision:** Backend acts as a Trusted Relayer for off-chain computed attestations (`commitEvidenceBundle`, `recordRiskResult`), while user identity, staking, purchasing, and retirement are signed directly by the user's wallet via Ethers.js.
- **Rationale:** Combines the UX smoothness of automated oracle commitments with strict decentralized ownership for financial and state-changing user actions.

### ADR-003: Dynamic ERC-721 NFT for Carbon Credits
- **Decision:** Implement carbon credits as dynamic ERC-721 tokens (`CarbonCreditNFT.sol`) with on-chain status tracking and tokenURI metadata referencing the evidence Merkle root.
- **Rationale:** Unlocks standard NFT marketplace composability while enforcing non-fungible provenance (every credit is uniquely tied to a specific evidence bundle and vintage).

### ADR-004: Verifier Staking with 50% Slashing
- **Decision:** Require verifiers to lock `MIN_STAKE` tokens before participating in review pools, with an automated 50% slashing penalty triggered upon an upheld dispute revocation.
- **Rationale:** Implements Patent Module 114 to align economic incentives and eliminate corrupt or negligent verification.

### ADR-005: On-Chain Escrow Settlement
- **Decision:** Route secondary credit trades through `EscrowSettlement.sol` holding buyer payment until the challenge window elapses or buyer confirms settlement.
- **Rationale:** Implements Patent Module 124 to provide enterprise buyers with guaranteed financial safety against fraudulent credits.
