# API Specification

## 1. Overview

RESTful API versioned under `/api/v1`, connecting the frontend, backend orchestrator, AI/ML engine, and blockchain contracts.

## 2. API Endpoints by Module

### A. Identity & Decentralized Identifiers (Module 102)
- `POST /api/v1/identity/did/generate`
  - **Body:** `{ "ownerAddress": "0x...", "projectId": "0x..." }`
  - **Response:** `{ "did": "did:carbonyx:0x...", "derivedAt": 1726000000 }`
- `POST /api/v1/identity/kyc/attest`
  - **Body:** `{ "ownerAddress": "0x...", "entityName": "string", "registrationNumber": "string" }`
  - **Response:** `{ "kycStatus": "VERIFIED", "kycAttestationHash": "0x...", "signature": "0x..." }`

### B. Project Management (Module 102)
- `GET /api/v1/projects` — List all registered projects with DIDs and challenge status.
- `GET /api/v1/projects/:projectId` — Fetch detailed project dossier.
- `POST /api/v1/projects/register` — Submit project registration metadata and prepare on-chain call.

### C. Evidence Ingestion & Cryptographic Validation (Modules 104, 106, 108)
- `POST /api/v1/evidence/upload` — Ingest raw evidence items (sensors, satellite, docs).
- `POST /api/v1/evidence/bundle/commit` — Compute SHA-256 Merkle tree, generate `merkleRoot`, and trigger relayer on-chain transaction.
- `GET /api/v1/evidence/bundle/:bundleId` — Get bundle details and Merkle proof tree.

### D. AI Anomaly & Risk Assessment (Module 110)
- `POST /api/v1/risk/evaluate/:bundleId` — Trigger AI/ML anomaly scoring and forward results to relayer for on-chain recording.
- `GET /api/v1/risk/:bundleId` — Fetch confidence score, risk classification, and XAI reason.

### E. Verifier Staking & Pool Management (Modules 112 & 114)
- `GET /api/v1/verifiers/pool` — List active staked verifiers, reputation scores, and staked amounts.
- `GET /api/v1/verifiers/:verifierAddress` — Fetch verifier profile, audit history, and yield stats.
- `POST /api/v1/verifiers/assigned-queue` — Fetch escalated bundles assigned to the authenticated verifier.

### F. Carbon Credit NFT & Marketplace (Modules 118 & 124)
- `GET /api/v1/credits` — List all minted carbon credits with dynamic states (`ISSUED`, `ESCROWED`, `RETIRED`, `REVOKED`).
- `GET /api/v1/credits/:tokenId` — Get dynamic NFT metadata and on-chain Merkle proof.
- `GET /api/v1/marketplace/listings` — List active carbon credits available for purchase.
- `POST /api/v1/marketplace/escrow/order` — Prepare `buyWithEscrow` call data.
- `POST /api/v1/credits/retire` — Prepare `retireCredit` call data and generate Certificate of Retirement.

### G. Disputes & Slashing Audit (Modules 122 & 124)
- `GET /api/v1/disputes` — List all raised disputes and resolution statuses.
- `POST /api/v1/disputes/raise` — Initiate a community dispute against a credit.
- `GET /api/v1/audit/slashing-logs` — Public ledger of all verifier slashing events and buyer compensations.
