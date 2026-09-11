# Technical Architecture

## 1. Architecture Goals

- Enforce the Core Principle ("evidence must be validated before a credit can be issued") as a technical constraint, not just a UI flow — the smart contract itself must refuse to mint without a satisfied policy condition.
- Let all four team members build in parallel from day one by freezing interfaces (this doc + the following Domain/Contract/API spec) before implementation starts.
- Keep every component mappable back to a named module in the patent (see Project Constitution, Section 9) so the pitch can point at working code, not just a diagram.
- Minimize on-chain complexity/gas surface — do only what must be trustless on-chain; keep everything else off-chain and reference it cryptographically.
- Be demo-reliable over feature-complete: fewer moving parts that work live beats more that might not.

## 2. Architectural Principles

- **On-chain enforces, off-chain computes.** Heavy computation (hashing large evidence sets, ML scoring) happens off-chain; the chain only checks conditions and records outcomes.
- **Every off-chain artifact referenced on-chain must be verifiable off-chain.** A Merkle root on-chain must be checkable against the evidence bundle stored off-chain, not just trusted.
- **No silent trust.** Any point where the system currently "just trusts" a value (mock sensor data, mock verifier) must be visibly labeled as simulated in the UI/demo narrative, per Scope Spec Section 7.
- **Interfaces before implementation.** Contract function signatures, REST API contracts, and the ML service's input/output schema are fixed in the Domain/Contract/API spec before coding begins; changes go through that document, not ad hoc Slack messages.
- **Fail loud, not silent.** Any validation, correlation, or contract failure produces a specific, displayed reason — never a generic error.

## 3. System Context

The system has four external-facing actors (Issuer, Buyer, Verifier, Regulator — see Personas spec), all interacting through a single web frontend. There are no live third-party integrations for the hackathon: sensor, satellite, and verifier-attestation data are seeded/mocked (Scope Spec, Section 7). The system's boundary is: browser wallet (e.g., MetaMask) ↔ frontend ↔ backend API ↔ (ML service + blockchain network). No external regulatory, registry, or payment systems are integrated.

## 4. High-Level Architecture

```
Frontend (React)
      ↓  REST/HTTP
Backend / API (Node.js + Express)
      ↓
Evidence Engine (aggregation, hashing, Merkle root — within Backend)
      ↓
AI Validation Engine (Python ML service — correlation + anomaly scoring)
      ↓
Blockchain Layer (Ethers.js → RPC)
      ↓
Smart Contracts (Solidity, on testnet)
```

Read paths (status polling, audit trail queries) go Frontend → Backend → (Storage Layer + Blockchain read calls) directly, without re-running the evidence/AI pipeline.

## 5. Component Architecture

### Frontend
**Responsibilities:** Wallet connection, project registration form, evidence submission UI, validation/risk result display, verifier queue and decision UI, credit wallet (transfer/retire), audit trail timeline view (per UI/UX Spec).
**Technology:** React, Ethers.js (wallet connection + read calls where direct on-chain reads are simpler than round-tripping through the backend), Tailwind or equivalent for styling (MERN-familiar stack for Hilag).

### Backend
**Responsibilities:** Central orchestrator — receives project/evidence submissions, owns the Evidence Engine logic, calls the AI Validation Engine, submits transactions to the Smart Contract Policy Engine (or prepares them for frontend-signed submission), persists off-chain metadata, serves audit-trail queries by combining off-chain data with on-chain reads.
**Technology:** Node.js + Express, Ethers.js for contract calls, MongoDB for off-chain evidence/project metadata storage (Dax/Hilag-familiar stack).

### Evidence Service
Sits within the Backend (not a separate deployed service for the hackathon). Responsibilities: standardize incoming evidence payloads per source type, compute per-item hashes, build the Merkle tree and root, run basic signature/hash integrity checks, apply the N-of-M source-correlation rule. Outputs a validated (or rejected) evidence bundle with its Merkle root to the AI Validation Engine.

### AI/ML Service
**Responsibilities:** Receives a validated evidence bundle (feature-extracted, standardized), runs anomaly detection (isolation forest and/or statistical z-score threshold per the patent's exemplary implementation), computes a composite confidence score, returns the score plus a human-readable reason string and a routing recommendation (auto-approve vs. escalate).
**Technology:** Python (scikit-learn for isolation forest), exposed as a small Flask/FastAPI service the Node backend calls over HTTP — this is Siddhant's isolated service, callable and testable independently of the rest of the stack from hour one.

### Storage Layer
Off-chain evidence payloads, project metadata, ML scoring history, and verifier decision notes are stored in MongoDB. On-chain storage is limited to: project ID reference, evidence bundle Merkle root, confidence score (or threshold-met boolean), verification decision reference, credit ownership state, and lifecycle events. Large/raw evidence data never goes on-chain.

### Blockchain Layer
**Responsibilities:** Deploys and runs the Smart Contract Policy Engine and Credit Registry contracts; enforces issuance, transfer, retirement, and revocation rules; emits events consumed by the backend for status updates.
**Technology:** Solidity, Foundry for development/testing (Jash's existing toolchain), deployed to a public testnet (Base Sepolia or Sepolia) for the demo, Ethers.js for backend/frontend integration.

## 6. On-Chain vs Off-Chain Boundary

**On-chain:**
- Project registration reference (ID + owner address)
- Evidence bundle Merkle root (not the evidence itself)
- Confidence-threshold-met flag / verification decision reference
- Credit issuance, ownership, transfer, retirement, dispute, and revocation state
- All lifecycle events (for the audit trail)

**Off-chain:**
- Raw evidence payloads (sensor readings, satellite metadata, documents)
- ML model inputs/outputs and full scoring detail (only the final score/reason is optionally mirrored on-chain or referenced by hash)
- Project descriptive metadata (name, location text, description)
- Verifier's written rationale (a hash/reference may go on-chain; full text stays off-chain)

Rule of thumb (per Architectural Principles): if it needs to be trustless and disputable, it's on-chain (or hash-referenced on-chain); if it's descriptive or bulky, it's off-chain.

## 7. Data Flow

1. Issuer registers project → Backend writes project metadata to MongoDB and records a project reference on-chain (or off-chain-only for MVP, per Domain spec decision).
2. Issuer submits evidence → Backend/Evidence Service stores raw payloads in MongoDB, computes hashes + Merkle root.
3. Evidence Service calls AI/ML Service with the standardized, validated bundle → ML Service returns `{ confidence_score, reason, anomalies: [...], recommendation: "auto_approve" | "escalate" }`.
4. Backend applies routing:
   - **auto_approve** → Backend calls the Smart Contract Policy Engine directly with the evidence Merkle root + confidence flag
   - **escalate** → Backend creates a Verification Queue entry; waits for Verifier decision via UI, then proceeds as above with the verifier's decision reference included
5. Smart Contract Policy Engine checks: evidence authenticated (root matches), threshold/verification satisfied, no existing credit for this bundle → mints credit, emits `CreditIssued` event.
6. Backend listens for on-chain events (`CreditIssued`, `Transferred`, `Retired`, `Disputed`, `Revoked`) and updates MongoDB status/audit trail records accordingly.
7. Audit Trail queries read from MongoDB (fast, descriptive data) merged with live on-chain state (source of truth for status) for display.

## 8. Event Flow

On-chain events emitted by the Smart Contracts, consumed by the Backend (via Ethers.js event listeners) to drive UI status updates:

- `ProjectRegistered(projectId, owner)`
- `EvidenceCommitted(projectId, merkleRoot)`
- `MintAuthorized(projectId, bundleId)` / `MintDenied(projectId, bundleId, reason)`
- `CreditIssued(creditId, projectId, owner)`
- `CreditTransferred(creditId, from, to)`
- `CreditRetired(creditId, owner)`
- `CreditDisputed(creditId, initiator)`
- `CreditRevoked(creditId, reason)`

Off-chain events (within Backend, not on-chain) used to drive UI without waiting for chain confirmation where appropriate: `EvidenceReceived`, `ValidationCompleted`, `RiskScored`, `EscalatedToVerifier`, `VerifierDecisionRecorded` — these update MongoDB/UI immediately, with the on-chain event confirming the final, binding state.

## 9. Failure Handling

- **Evidence integrity failure (Flow 3):** payload excluded, issuer notified with specific reason, bundle re-evaluated against remaining evidence.
- **AI/ML Service unavailable:** Backend retries once, then surfaces a clear "risk scoring unavailable, try again" error — never silently auto-approves or auto-rejects on a service failure.
- **Smart contract transaction reverts** (duplicate issuance attempt, unauthorized caller, retired/disputed credit acted on): revert reason surfaced verbatim (or mapped to a friendly message) in the UI, not swallowed.
- **Wallet/network failure:** frontend shows a retry-able error state; no state is assumed changed until an on-chain confirmation or explicit backend success response is received.
- **Backend/MongoDB unavailable:** on-chain state remains source of truth; UI shows "descriptive data unavailable" rather than blocking core on-chain actions where feasible.

## 10. Security Boundaries

- Only the project owner's wallet can submit evidence for that project or transfer/retire credits they own — enforced both in the backend (request validation) and on-chain (`msg.sender` checks in the contract).
- Only the Smart Contract Policy Engine can trigger issuance on the Credit Registry contract — no direct external mint function.
- Verifier actions are restricted to addresses in a (hackathon-simplified) allow-listed verifier set — enforced on-chain.
- Dispute/revocation actions are restricted to the admin/simplified-governance address for the MVP (Scope Spec — full DAO is out of scope).
- Raw evidence payloads are never trusted as-is by the contract; only their hash commitment is trusted on-chain.

## 11. Trust Boundaries

- **Evidence sources (mocked):** trusted only as far as their hash/signature check passes — the system does not currently verify real-world authenticity of sensor/satellite data (explicitly a simulation, per Scope Spec Section 7).
- **AI/ML Service output:** trusted as an input to routing, not as a final authority — low-confidence results are always routed to a human verifier rather than auto-rejected outright, preserving a human check on the AI's judgment.
- **Verifier:** trusted within the demo as a single allow-listed role; the patent's staking/reputation accountability mechanism is explicitly out of scope, so this is a known, disclosed trust reduction for the MVP.
- **Backend:** trusted to relay data honestly between Frontend, ML Service, and Blockchain, but is not the source of truth for issued/transferred/retired state — the chain is.

## 12. External Services

None required for the MVP. All evidence sources, satellite data, and verifier identity are seeded/simulated locally (Scope Spec, Section 7). No live payment, insurance, KYC, or registry-interoperability integrations (Scope Spec, Section 5). Testnet RPC provider (e.g., Alchemy/Infura free tier) is the only external dependency, used solely for blockchain connectivity.

## 13. Deployment Architecture

- **Smart contracts:** deployed to a public testnet (Base Sepolia or Sepolia) via Foundry, verified on the relevant block explorer for demo credibility.
- **Backend + AI/ML Service:** run locally during development; for the demo, either run locally on the presenting laptop or deployed to a free-tier host (Render/Railway) as a fallback if live internet at the venue is unreliable.
- **Frontend:** run locally or deployed to a static host (Vercel/Netlify) pointed at the backend.
- **Database:** MongoDB Atlas free tier (accessible from wherever backend runs) or local MongoDB instance as a fallback.
- **Fallback plan:** a local-only, fully offline-capable version (local blockchain via Anvil/Hardhat node) should be kept ready in case venue network access fails on demo day.

## 14. Scalability Notes

Not a hackathon priority (per Constitution Section 7 — prototype, not production), but noted for the pitch's "future work" framing: the off-chain evidence storage + on-chain hash-reference pattern already scales evidence volume without bloating on-chain storage; the ML service is stateless and horizontally scalable; the main future scaling question is verifier throughput, which the patent addresses via the staking/reputation-weighted assignment mechanism explicitly deferred in this MVP.

## 15. Architecture Decisions

**ADR-001: Off-chain evidence storage with on-chain Merkle-root commitment**
Storing raw evidence on-chain is prohibitively expensive and unnecessary for trust — a Merkle root gives tamper-evidence at a fraction of the cost. Decision: raw evidence in MongoDB, root on-chain. Alternative considered: IPFS for evidence storage (more "Web3-native," but adds setup complexity/time risk for a 36-hour build) — deferred to future work.

**ADR-002: Backend as orchestrator rather than fully client-side flow**
A backend orchestrator simplifies coordinating the Evidence Engine → AI Service → Contract call sequence, and gives a single place to enforce request validation before anything reaches the chain. Alternative considered: frontend calling AI service and contract directly — rejected as it would duplicate validation logic and complicate failure handling across two client-side call chains.

**ADR-003: Single allow-listed verifier role instead of a verifier marketplace**
The patent's full verifier staking/reputation/assignment mechanism is significant scope on its own. Decision: one (or a small allow-listed set of) verifier address(es) for the MVP, explicitly disclosed as a simplification in the pitch. Full mechanism deferred to Scope Spec's "Future Features."

**ADR-004: AI/ML Service as a separate HTTP service, not embedded in the backend**
Keeping the ML scoring logic in its own Python service lets Siddhant build and test it independently from hour one without blocking on Node.js backend integration, and mirrors the patent's modular architecture (Module 110 as a distinct engine). Alternative considered: reimplementing scoring logic in JS within the Node backend — rejected due to weaker ML tooling in JS and unnecessary coupling.

**ADR-005: Testnet deployment over local-only blockchain**
A public testnet deployment (with a verifiable contract address/explorer link) is significantly more credible to judges than a local Anvil chain, and validates the team can actually ship to a real network. Decision: primary demo on testnet, with a local Anvil fallback rehearsed in case of live network issues on demo day.
