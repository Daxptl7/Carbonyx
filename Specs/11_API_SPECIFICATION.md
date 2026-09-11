# API Specification & Supabase Integration

## 1. Overview

Carbonyx leverages **Supabase PostgREST & Realtime Subscriptions** alongside a Node.js Express Orchestrator and Python FastAPI ML engine.

## 2. Supabase Realtime Channels (Frontend Subscriptions)

The React frontend subscribes to real-time database changes over WebSockets:

```typescript
// Example: Frontend subscribing to AI scoring and Mint status
supabase
  .channel('bundle-updates')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'evidence_bundles' }, (payload) => {
    console.log('Bundle status updated:', payload.new.status);
  })
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'risk_assessments' }, (payload) => {
    console.log('AI Risk Assessment ready:', payload.new.confidence_score);
  })
  .subscribe();
```

## 3. REST API Endpoints by Service

### A. Identity & Decentralized Identifiers (Module 102)
- `POST /api/v1/identity/did/generate` — Generate `did:carbonyx:<hash>`.
- `POST /api/v1/identity/kyc/attest` — Generate cryptographic KYC signature and attestation hash.

### B. Project Management (Module 102)
- `GET /api/v1/projects` — Fetch all projects (or via `supabase.from('projects').select('*')`).
- `POST /api/v1/projects/register` — Ingest project dossier, store metadata in Supabase, prepare on-chain call data.

### C. Evidence Ingestion & Merkle Hashing (Modules 104, 106, 108)
- `POST /api/v1/evidence/upload` — Upload telemetry payloads and binary files directly to Supabase `evidence-vault` bucket.
- `POST /api/v1/evidence/bundle/commit` — Compute SHA-256 Merkle tree, store leaf nodes in Supabase, and submit on-chain `commitEvidenceBundle`.

### D. AI Anomaly & Risk Assessment (Module 110)
- `POST /api/v1/risk/evaluate/:bundleId` — Trigger FastAPI `/score` endpoint, store `risk_assessments` record, and submit on-chain `recordRiskResult`.

### E. Verifier Staking & Pool Management (Modules 112 & 114)
- `GET /api/v1/verifiers/pool` — Fetch active staked verifiers and reputation rankings.
- `POST /api/v1/verifiers/assigned-queue` — Query escalated bundles assigned to the authenticated verifier.

### F. Carbon Credit NFT & Marketplace (Modules 118 & 124)
- `GET /api/v1/credits` — Query all minted credits and active lifecycle states.
- `GET /api/v1/marketplace/listings` — Query credits available for purchase.
- `POST /api/v1/marketplace/escrow/order` — Prepare `buyWithEscrow` call data.
- `POST /api/v1/credits/retire` — Prepare `retireCredit` call data and generate Certificate of Retirement in `certificates` bucket.

### G. Disputes & Slashing Audit (Modules 122 & 124)
- `POST /api/v1/disputes/raise` — Initiate on-chain dispute and record evidence in Supabase.
- `GET /api/v1/audit/slashing-logs` — Query history of all verifier slashing penalties.
