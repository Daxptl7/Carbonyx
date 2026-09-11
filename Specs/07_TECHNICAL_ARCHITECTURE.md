# Technical Architecture

## 1. System Architecture Overview

Carbonyx is built as a modular, decentralized circular carbon tracking protocol spanning 12 structural modules defined in the Process Patent.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Frontend (React / Vite)                       │
│    Issuer Studio  │  Verifier Portal  │  Marketplace  │  Explorer      │
└───────────────────────┬───────────────────────────────┬────────────────┘
                        │ Supabase Realtime WebSockets  │ REST / Ethers.js
                        ▼                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│     Supabase Unified Data Layer      │  │  Backend Relayer (Node.js)   │
│  - PostgreSQL (Relational + JSONB)   │  │  - Cryptographic Validator   │
│  - Realtime Changefeed Subscriptions │  │  - Merkle Tree Hash Engine   │
│  - S3 Storage (Evidence & Certs)     │  │  - Relayer Transaction Signs │
│  - Web3 Auth / SIWE (Module 102)     │  │  - On-Chain Event Listener   │
└───────────────────────┬──────────────┘  └──────────────┬───────────────┘
                        │                                │
                        ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       AI/ML Engine (FastAPI)         │  │  Blockchain Smart Contracts  │
│  - Multi-Source Correlator           │  │  - CarbonRegistry.sol (102)  │
│  - Isolation Forest Anomaly Detector │  │  - VerifierStaking.sol (114) │
│  - Z-Score Satellite Delta Engine    │  │  - CarbonCreditNFT.sol (118) │
│  - Explainable XAI Reasoner (110)    │  │  - EscrowSettlement.sol (124)│
└──────────────────────────────────────┘  └──────────────────────────────┘
```

## 2. Monorepo Directory Structure

```
Carbonyx/
├── .gitignore
├── README.md
├── Specs/                         # 13 Frozen Specifications
│   ├── 01_PROJECT_CONSTITUTION.md
│   ├── 02_PRODUCT_SPECIFICATION.md
│   ├── 03_SCOPE_SPECIFICATION.md
│   ├── 04_PERSONAS_AND_USE_CASES.md
│   ├── 05_USER_FLOWS.md
│   ├── 06_UI_UX_SPECIFICATION.md
│   ├── 07_TECHNICAL_ARCHITECTURE.md
│   ├── 08_DOMAIN_DATA_MODEL.md
│   ├── 09_SMART_CONTRACT_SPECIFICATION.md
│   ├── 10_AI_ML_SPECIFICATION.md
│   ├── 11_API_SPECIFICATION.md
│   ├── 12_ROADMAP.md
│   └── 13_AI_CODING_GUIDELINES.md
├── contracts/                     # Jash (Solidity / Foundry)
│   ├── foundry.toml
│   ├── src/
│   │   ├── CarbonRegistry.sol
│   │   ├── CarbonCreditNFT.sol
│   │   ├── VerifierStakingLedger.sol
│   │   ├── EscrowSettlement.sol
│   │   └── interfaces/
│   ├── test/
│   │   ├── CarbonRegistry.t.sol
│   │   ├── VerifierStakingLedger.t.sol
│   │   ├── EscrowSettlement.t.sol
│   │   └── Invariants.t.sol
│   └── script/
│       ├── Deploy.s.sol
│       └── Seed.s.sol
├── backend/                       # Dax (Node.js / Express + Supabase)
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/
│   │   │   ├── supabase.ts
│   │   │   └── web3.ts
│   │   ├── routes/
│   │   │   ├── identity.routes.ts
│   │   │   ├── projects.routes.ts
│   │   │   ├── evidence.routes.ts
│   │   │   ├── risk.routes.ts
│   │   │   ├── verifiers.routes.ts
│   │   │   ├── credits.routes.ts
│   │   │   ├── marketplace.routes.ts
│   │   │   └── disputes.routes.ts
│   │   ├── services/
│   │   │   ├── merkle.service.ts
│   │   │   ├── cryptographic.service.ts
│   │   │   ├── relayer.service.ts
│   │   │   └── eventListener.service.ts
│   │   └── utils/
│   └── tests/
├── ml-engine/                     # Siddhant (Python / FastAPI)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   │   └── score.py
│   │   ├── models/
│   │   │   ├── anomaly_detector.py
│   │   │   ├── correlation_checker.py
│   │   │   └── xai_reasoner.py
│   │   ├── schemas/
│   │   │   └── evidence_schema.py
│   │   └── utils/
│   │       └── verifier_matcher.py
│   └── tests/
│       └── test_score.py
├── frontend/                      # Hilag (React / Vite / Tailwind)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   └── web3.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── cards/
│   │   │   │   ├── NFTCertificateCard.tsx
│   │   │   │   └── AnomalyDiffViewer.tsx
│   │   │   ├── modals/
│   │   │   │   ├── EscrowBuyModal.tsx
│   │   │   │   └── EvidenceUploadModal.tsx
│   │   │   └── ui/
│   │   └── pages/
│   │       ├── IssuerStudio.tsx
│   │       ├── VerifierPortal.tsx
│   │       ├── Marketplace.tsx
│   │       ├── BuyerPortfolio.tsx
│   │       └── AuditorExplorer.tsx
└── supabase/                      # Database migrations & seeds
    ├── config.toml
    └── migrations/
        └── 20260912000000_init_schema.sql
```

## 3. On-Chain vs. Off-Chain Separation of Concerns

- **Off-Chain Execution (Supabase & Backend):**
  - **Supabase Storage:** Raw telemetry artifacts (sensor CSVs, Sentinel-2 TIFFs, drone footage, audit PDFs).
  - **Supabase PostgreSQL & JSONB:** Relational project states, user profiles, Merkle proof trees, and flexible JSONB telemetry data.
  - **Supabase Realtime:** Immediate WebSocket broadcasts of AI scoring and on-chain confirmations to the frontend.
  - **FastAPI ML Service:** Isolation Forest anomaly scoring and explainability generation.
- **On-Chain Enforcement (EVM Smart Contracts):**
  - Cryptographic `bytes32 merkleRoot` commitments.
  - Boolean gate checks enforcing evidence integrity before minting.
  - Verifier staking collateral balances, dynamic reputation, and automated 50% slashing penalties.
  - Escrow fund custody, release, and buyer refund logic.
  - Dynamic ERC-721 NFT ownership, transfer locks, and permanent retirement burning.

## 4. Architecture Decision Records (ADRs)

### ADR-001: Monorepo Structure
- **Decision:** Use a single repository containing `/contracts` (Foundry), `/backend` (Node.js), `/ml-engine` (Python FastAPI), `/frontend` (React/Vite), `/supabase`, and `/Specs`.
- **Rationale:** Enables rapid atomic development across smart contract ABIs, backend models, and frontend UI.

### ADR-002: Supabase as Unified Off-Chain Data & Realtime Layer
- **Decision:** Adopt Supabase (PostgreSQL + JSONB + Realtime + Storage + Auth) as the central off-chain database and event bus.
- **Rationale:** 
  1. Combines strict relational integrity for projects and credits with flexible `JSONB` for multi-source telemetry.
  2. Built-in Realtime WebSockets push instant UI updates when AI finishes scoring or when on-chain transactions confirm.
  3. Integrated S3-compatible bucket storage (`evidence-vault`, `certificates`) eliminates external file storage dependencies.
  4. Native Python (`supabase-py`) and Node.js (`@supabase/supabase-js`) SDKs enable zero-friction multi-language collaboration between Dax, Siddhant, and Hilag.

### ADR-003: Dual-Write & Relayer Architecture
- **Decision:** Backend acts as a Trusted Relayer for off-chain computed attestations (`commitEvidenceBundle`, `recordRiskResult`), while user identity, staking, purchasing, and retirement are signed directly by the user's wallet via Ethers.js.
- **Rationale:** Delivers instant UX for heavy computational steps while maintaining decentralized non-custodial ownership for financial actions.

### ADR-004: Dynamic ERC-721 NFT for Carbon Credits
- **Decision:** Implement carbon credits as dynamic ERC-721 tokens (`CarbonCreditNFT.sol`) with on-chain metadata referencing the evidence Merkle root and dynamic status (`ISSUED`, `ESCROWED`, `TRANSFERRED`, `RETIRED`, `DISPUTED`, `REVOKED`).
- **Rationale:** Unlocks standard NFT marketplace composability while enforcing non-fungible provenance.

### ADR-005: Verifier Staking with 50% Slashing
- **Decision:** Require verifiers to lock `MIN_STAKE` tokens before participating in review pools, with an automated 50% slashing penalty triggered upon an upheld dispute revocation.
- **Rationale:** Implements Patent Module 114 to align economic incentives and eliminate corrupt or negligent verification.

### ADR-006: On-Chain Escrow Settlement
- **Decision:** Route secondary credit trades through `EscrowSettlement.sol` holding buyer payment until the challenge window elapses or buyer confirms settlement.
- **Rationale:** Implements Patent Module 124 to provide enterprise buyers with guaranteed financial safety against fraudulent credits.
