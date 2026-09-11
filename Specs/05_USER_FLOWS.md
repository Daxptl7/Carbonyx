# User Flows

## Flow 1 — Project Registration

**Actor:** Project Issuer

**Preconditions:**
- Issuer has a connected wallet
- Issuer has project metadata ready (name, type, location, description)

**Steps:**
1. Issuer connects wallet on the frontend
2. Issuer fills project registration form (name, project type, location, baseline description)
3. Frontend sends registration request to backend
4. Backend validates required fields and wallet signature
5. Backend/contract generates a persistent project ID and stores project record (on-chain reference + off-chain metadata)
6. Frontend displays confirmation with project ID and status "Registered — awaiting evidence"

**Success:** Project exists with a persistent ID, owner = issuer wallet, status = "Registered," ready to accept evidence.

**Failure:**
- Missing required fields → form validation error, no submission sent
- Wallet not connected/signature invalid → registration rejected, error shown
- Duplicate project ID collision (should not occur under normal ID generation) → backend returns error, issuer prompted to retry

---

## Flow 2 — Evidence Submission

**Actor:** Project Issuer

**Steps:**
1. Issuer opens a registered project
2. Issuer selects evidence source type (sensor, satellite, verifier attestation, documentation)
3. Issuer uploads/enters evidence payload for that source (file, reading, or structured data) — seeded/mock data for demo
4. Frontend sends payload + source type + project ID + timestamp to backend
5. Backend stores raw payload off-chain, computes a hash for the payload, and queues it for aggregation
6. Issuer repeats for additional source types (minimum of 2–3 recommended for correlation to pass)
7. Issuer triggers "Submit for validation" once satisfied with the evidence set

**Success:** All submitted evidence payloads are stored, hashed, and linked to the project; bundle moves to Flow 3.

**Failure:**
- Payload fails basic format validation → rejected with specific error, issuer re-submits
- Project not found/not owned by issuer → submission blocked

---

## Flow 3 — Evidence Validation

**Input:** A project ID with one or more submitted evidence payloads, each tagged with source type and timestamp.

**Processing:**
1. Backend aggregates all payloads for the bundle into a standardized structure
2. Backend computes a Merkle root over the aggregated evidence, establishing a tamper-evident commitment
3. Backend verifies each payload's hash/signature against what was recorded at submission time
4. Any payload that fails integrity verification is flagged and excluded from the valid set
5. Backend checks source-type diversity against a configurable N-of-M threshold (e.g., at least 2 of 4 source types present)
6. If integrity checks pass and correlation threshold is met, bundle proceeds to risk scoring (Flow 4/5); if not, bundle is marked "Validation Failed"

**Possible Outcomes:**
- **Valid, sufficiently correlated** → proceeds to risk scoring
- **Integrity failure on one or more payloads** → those payloads excluded; bundle proceeds only if remaining evidence still meets the correlation threshold, otherwise marked "Validation Failed — insufficient evidence"
- **Insufficient source diversity** → bundle marked "Validation Failed — needs additional evidence source," issuer prompted to submit more

---

## Flow 4 — High Confidence Project

Evidence
→ Validation
→ High Confidence
→ Verification
→ Approved
→ Mint

**Narrative:** Evidence bundle passes integrity and correlation checks. The ML risk-scoring engine evaluates the bundle and returns a confidence score above the configured auto-approval threshold, with a stated reason (e.g., "all sources consistent, no statistical outliers"). Because confidence is high, the system auto-generates an approval decision (no human verifier step required) and immediately submits the bundle to the Smart Contract Policy Engine. The contract checks issuance conditions (evidence authenticated + threshold met + no existing credit for this bundle) and mints the credit. Credit appears in the issuer's wallet with status "Issued," fully linked to its evidence trail.

---

## Flow 5 — Suspicious Project

Evidence
→ Validation
→ Anomaly
→ Low Confidence
→ Manual Verification
→ Approved/Rejected

**Narrative:** Evidence bundle passes integrity checks but the ML risk-scoring engine detects an anomaly (e.g., a sensor reading inconsistent with satellite data, or a statistical outlier) and returns a confidence score below the auto-approval threshold, with a stated reason (e.g., "sensor and satellite readings diverge beyond tolerance"). The bundle is routed to the Verifier queue instead of auto-issuance. The verifier reviews the evidence bundle and the flagged reason, and either:
- **Approves** → bundle proceeds to the Smart Contract Policy Engine and, if issuance conditions are met, the credit is minted with a record noting manual verification was required, or
- **Rejects** → bundle is marked "Rejected," no credit is minted, issuer is notified with the rejection reason and may submit additional/corrected evidence
- **Requests more evidence** → bundle returns to Flow 2/3 for the issuer to supplement, then is re-scored

---

## Flow 6 — Credit Transfer

**Actor:** Credit owner (Issuer post-issuance, or Corporate Buyer)

**Steps:**
1. Owner selects an issued, non-retired credit in their wallet view
2. Owner enters recipient wallet address
3. Frontend sends transfer request to the smart contract
4. Contract verifies caller is current owner and credit is not retired/disputed
5. Contract updates ownership on-chain and emits a transfer event
6. Frontend/backend reflects new ownership in the UI and lifecycle trail

**Success:** Credit ownership updated on-chain; visible immediately in both wallets' views and in the audit trail.

**Failure:**
- Caller is not current owner → transaction reverts
- Credit is retired or disputed/revoked → transfer blocked by contract, error shown

---

## Flow 7 — Credit Retirement

**Actor:** Credit owner (typically Corporate Buyer)

**Steps:**
1. Owner selects an issued, non-retired credit they own
2. Owner confirms retirement (with optional reason/claim reference, e.g., "offsetting 2026 Scope 1 emissions")
3. Frontend sends retirement request to the smart contract
4. Contract verifies caller is current owner and credit is not already retired
5. Contract marks the credit as permanently retired and emits a retirement event
6. Frontend/backend reflects "Retired" status; lifecycle trail updated

**Success:** Credit is permanently non-transferable and non-reusable; any subsequent transfer/re-issuance attempt against it or its evidence bundle is rejected on-chain.

**Failure:**
- Caller is not current owner → transaction reverts
- Credit already retired → transaction reverts, "already retired" error shown

---

## Flow 8 — Dispute / Revocation

**Actor:** Verifier/Auditor or Regulator (dispute initiator); Admin/simplified governance (adjudicator)

**Steps:**
1. Actor selects an issued credit and submits a dispute with supporting evidence/reason
2. System flags the credit as "Disputed" on-chain; credit is frozen (no transfer/retirement permitted while disputed)
3. Admin/simplified governance role reviews the dispute evidence and the original evidence trail
4. Adjudicator records a decision: **Uphold** (dispute valid) or **Reject** (dispute invalid)
5. If upheld: contract revokes the credit, status becomes "Revoked," and the revocation + reason are permanently recorded
6. If rejected: "Disputed" flag is cleared, credit returns to its prior status (Issued/Transferred), and the dispute outcome is recorded for audit purposes

**Success:** Dispute outcome (uphold or reject) and any resulting revocation are permanently and transparently recorded, closing the loop from the original evidence trail through to a final integrity decision.

**Failure:**
- Dispute submitted without supporting evidence → rejected at submission, actor prompted to provide justification
- Dispute submitted against an already-revoked credit → blocked, "already revoked" error shown
