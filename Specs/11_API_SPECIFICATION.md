# API Specification

## 1. API Principles

- **REST over HTTPS, JSON bodies**, versioned under `/api/v1`. All IDs, enums, and field names mirror 08_DOMAIN_DATA_MODEL exactly (camelCase), so the backend never re-shapes data between its Mongo layer and its API responses.
- **The backend is the single interface the frontend talks to** for all off-chain data and for triggering backend-orchestrated on-chain writes (ADR-002, Technical Architecture). The frontend never calls the AI/ML service or writes to MongoDB directly.
- **Two distinct write patterns, matching 09_SMART_CONTRACT_SPECIFICATION's access control exactly:**
  1. **Trusted-relayer actions** (`commitEvidenceBundle`, `recordRiskResult`, `mintCredit`'s relayer path) — the backend itself holds the relayer key, signs, and submits these transactions. The API executes these directly and the response reflects on-chain confirmation.
  2. **Owner/role-signed actions** (`registerProject`, `recordVerification`, `transferCredit`, `retireCredit`, `disputeCredit`, `resolveDispute`) — these require a signature from the specific role's own wallet (`msg.sender` checks in the contract). The backend **never** holds these keys. The corresponding API endpoints prepare and return an `onChainCallData` object (Section 11) for the frontend to submit via the user's connected wallet (Ethers.js) — they do not execute the transaction themselves.
  - **Resolves an open item:** 09_SMART_CONTRACT_SPECIFICATION Section 5 left `commitEvidenceBundle()`'s caller model as an implementation decision ("trusted relayer OR project-owner-with-backend-co-signing"). This spec adopts the **trusted-relayer-only** path, consistent with ADR-002. Flag this for explicit team sign-off before implementation, per Constitution Section 11 (ambiguity should be flagged, not silently resolved) — it is resolved here for the purpose of freezing this interface, but it changes a decision that document explicitly left open.
- **The on-chain event listener is the real source of truth** for owner-signed actions (Section 12), not the POST endpoint response. POST endpoints for owner-signed actions are convenience/optimistic-UI only — a client that never calls them but submits the transaction directly will still have state converge correctly once the event listener picks it up.
- **Idempotency:** every trusted-relayer write is idempotent from the caller's perspective — retrying a `mintCredit` call for an already-issued bundle returns the existing credit, not a duplicate-attempt error, mirroring the contract's own `BundleAlreadyIssued` guard.
- **Fail loud:** every error follows the envelope in Section 10; on-chain revert reasons are surfaced verbatim, never swallowed (Technical Architecture Section 9).

## 2. Authentication

Wallet-based, off-chain session auth — this is a convenience/role-gating layer for the API and UI; it is **not** a substitute for on-chain `msg.sender` checks, which remain the actual authority (Technical Architecture Section 10–11). An attacker who somehow forged API auth still cannot bypass the contract.

### `GET /api/v1/auth/nonce?address=0x...`
Returns a short-lived, single-use nonce for the given wallet address to sign.
**Response:** `{ "nonce": "string", "expiresAt": "ISO 8601" }`

### `POST /api/v1/auth/verify`
**Request:** `{ "address": "0x...", "signature": "string" }` (signature over the issued nonce)
**Response:** `{ "sessionToken": "string", "address": "0x...", "role": "issuer | buyer | verifier | admin" }`
Role is resolved by looking up `actors` (08 Section 12) and cross-checking the on-chain verifier allow-list / admin address — an address with no prior role defaults to `issuer|buyer` (ambiguous, UI-determined per 06 Section 2's "defaulting to Issuer/Buyer view if role is ambiguous").

All subsequent requests carry `Authorization: Bearer <sessionToken>`. Endpoints below note required roles; an unauthenticated or wrong-role request returns `401`/`403` per Section 10.

## 3. Project APIs

### `POST /api/v1/projects`
**Role:** Issuer
**Request:**
```json
{ "name": "string", "projectType": "reforestation | renewable_energy | methane_capture | other", "location": "string", "baselineDescription": "string", "ownerAddress": "0x..." }
```
**Response — 201:**
```json
{
  "projectId": "string",
  "status": "PROJECT_REGISTERED_PENDING",
  "onChainCallData": {
    "contractAddress": "0x...", "abiFragment": "...", "functionName": "registerProject",
    "args": ["0x<projectIdBytes32>", "<metadataURI>"]
  }
}
```
Backend generates `projectId`, persists metadata off-chain, and returns calldata for the issuer's wallet to sign directly (Section 1, pattern 2). Mongo status stays `PROJECT_REGISTERED_PENDING` until the event listener (Section 12) confirms `ProjectRegistered`.

### `GET /api/v1/projects/:id`
**Role:** any (Regulator/Buyer get read access; Issuer sees full detail)
**Response:** merged off-chain + on-chain state — `{ projectId, ownerAddress, name, projectType, location, baselineDescription, status, createdAt, onChainRef, evidenceBundleIds: [...] }` (08 Section 3, extended with bundle references).

### `GET /api/v1/projects`
*(added — required by the Project Dashboard screen, 06_UI_UX_SPECIFICATION, which lists "all their registered projects")*
**Role:** Issuer (filtered to `ownerAddress` = caller) or Regulator (unfiltered, system-wide)
**Query:** `?ownerAddress=0x...&status=...`
**Response:** `{ projects: [...], pagination: {...} }` (Section 11 pagination wrapper)

## 4. Evidence APIs

### `POST /api/v1/projects/:id/evidence`
**Role:** Issuer (must be `ownerAddress` of `:id`)
**Request:** `{ "sourceType": "sensor | satellite | verifier_attestation | documentation", "payload": {...}, "submittedAt": "ISO 8601" }`
**Response — 201:** `{ "evidenceId": "string", "payloadHash": "string (SHA-256 hex)", "integrityStatus": "PENDING" }`
Payload is validated for basic format per source type (05_USER_FLOWS Flow 2 failure case) before acceptance.

### `GET /api/v1/projects/:id/evidence`
**Role:** any with project read access
**Response:** `{ evidenceItems: [ { evidenceId, sourceType, submittedAt, integrityStatus, integrityFailureReason } ] }` — feeds the Evidence Submission screen's "list of already-submitted evidence" (06 Section 3).

### `POST /api/v1/projects/:id/evidence/submit`
*(added — implements "Submit for validation" trigger, 05_USER_FLOWS Flow 2 step 7)*
**Role:** Issuer
**Request:** none (acts on all `PENDING`-bundle evidence items for the project)
**Response — 202:** `{ "bundleId": "string", "status": "VALIDATING" }`
Rejected with `422 INSUFFICIENT_SOURCE_DIVERSITY` if fewer than the minimum source types are present — does not proceed to Section 5.

## 5. Validation APIs

### `POST /api/v1/validation/run`
Primarily system-triggered by `evidence/submit` above; exposed directly for the P1 "re-validate after re-submission" case (Flow 5's "request more evidence" loop).
**Role:** system-internal, or Issuer (re-trigger on their own project)
**Request:** `{ "bundleId": "string" }`
**Response — 200:** maps to `ValidationResult` (08 Section 6):
```json
{
  "validationId": "string", "bundleId": "string",
  "merkleRootVerified": true,
  "itemIntegrityResults": [ { "evidenceId": "string", "status": "PASSED | FAILED", "reason": "string | null" } ],
  "correlationCheck": { "requiredSources": 2, "totalSources": 4, "presentSources": 3, "passed": true },
  "overallResult": "VALID | INVALID_INTEGRITY | INVALID_CORRELATION",
  "evaluatedAt": "ISO 8601"
}
```
On `overallResult: VALID`, the backend automatically proceeds to Section 6. On `INVALID_*`, the bundle status is set to `VALIDATION_FAILED` and no further processing occurs until the issuer submits more evidence.

### `GET /api/v1/validation/:id`
**Response:** the `ValidationResult` above, by `validationId`.

## 6. AI APIs

### `POST /api/v1/risk/analyze`
Called automatically by the backend when `validation/run` returns `overallResult: VALID`; exposed for manual retry (e.g., after an `ML_SERVICE_UNAVAILABLE` failure).
**Role:** system-internal, or Issuer (manual retry on their own bundle)
**Request:** `{ "bundleId": "string" }`
**Behavior:** backend assembles the request per 10_AI_ML_SPECIFICATION Section 12, calls the AI/ML Service's `POST /score`, persists the result as a `RiskAssessment`, and — if `recommendation: auto_approve` — immediately calls the trusted-relayer `recordRiskResult()` and proceeds to mint (Section 8); if `escalate`, creates a Verification Queue entry (Section 7) instead.
**Response — 200:**
```json
{
  "bundleId": "string", "confidenceScore": 0, "riskLevel": "LOW | MEDIUM | HIGH",
  "anomaliesDetected": [ { "type": "string", "description": "string", "severity": "low | medium | high" } ],
  "reason": "string", "recommendation": "auto_approve | escalate",
  "modelVersion": "string", "scoredAt": "ISO 8601",
  "routingOutcome": "auto_approved | escalated_to_verifier"
}
```
On ML Service failure: `502 ML_SERVICE_UNAVAILABLE` after one backend-side retry (10_AI_ML_SPECIFICATION Section 13) — never a fabricated score.

### `GET /api/v1/risk/:bundleId`
**Response:** the persisted `RiskAssessment` for a bundle.

## 7. Verification APIs

### `GET /api/v1/verifications`
*(added — required by the Verification Queue screen, 06_UI_UX_SPECIFICATION, whose entire purpose is a "prioritized list of evidence bundles awaiting human review")*
**Role:** Verifier
**Query:** `?status=pending|approved|rejected`
**Response:** `{ verifications: [ { verificationId, bundleId, projectName, confidenceScore, reason, timeWaiting } ] }`

### `GET /api/v1/verifications/:id`
**Response:** full `VerificationDecision` (08 Section 8) plus the linked `RiskAssessment` and evidence bundle summary, for the Validation & Risk Result screen's verifier-acting view.

### `POST /api/v1/verifications/:id/approve`
**Role:** Verifier (must be on-chain allow-listed)
**Request:** `{ "decisionReason": "string" }`
**Response — 200:** `{ "onChainCallData": { "functionName": "recordVerification", "args": ["0x<bundleId>", true] } }` — verifier signs directly (Section 1, pattern 2); `decisionReason` is persisted off-chain immediately, the boolean decision is confirmed via the event listener.

### `POST /api/v1/verifications/:id/reject`
**Role:** Verifier
**Request:** `{ "decisionReason": "string" }`
**Response — 200:** same shape, `args: ["0x<bundleId>", false]`. Per 09 Section 5, a rejected bundle's `verifierApproved` stays `false` — `mintCredit()` will revert with `VerificationNotApproved` if attempted; the backend does not attempt to mint on rejection.

### `POST /api/v1/verifications/:id/request-more-evidence`
*(added — required by UC-05 and Flow 5, which explicitly include this as a third verifier option alongside approve/reject; the skeleton listed only two)*
**Role:** Verifier
**Request:** `{ "decisionReason": "string" }`
**Response — 200:** `{ "decision": "request_more_evidence" }` — this is an **off-chain-only** state (no corresponding contract function; the bundle simply never reaches `mintCredit()`). Backend sets the project status back to `EVIDENCE_PENDING` (08 Section 10 state machine) and notifies the issuer.

## 8. Credit APIs

### `POST /api/v1/credits/mint`
**Role:** system-internal only (trusted relayer) — not user-facing. Triggered automatically by Section 6 (`auto_approve`) or Section 7 (`recordVerification(..., true)` confirmed on-chain). Documented here because it is the direct API-layer counterpart to `mintCredit()` (09 Section 5); no UI button calls this directly, consistent with Flow 4/5 having no manual "mint" step.
**Request:** `{ "bundleId": "string", "recipient": "0x...", "co2eQuantity": 0 }`
**Response — 201:** `{ "creditId": "string", "status": "ISSUED", "txHash": "string" }`
**Response — 409:** `BUNDLE_ALREADY_ISSUED` if retried against an already-minted bundle (idempotent, not an error to the caller's caller — see Section 1).

### `GET /api/v1/credits/:id`
**Role:** any (public read — Buyers must be able to inspect before purchase, per Persona 2)
**Response:** merged `CarbonCredit` (08 Section 9) with current on-chain status as authoritative (08 Data Integrity Rule 5).

### `GET /api/v1/credits`
*(added — required by the Credit Wallet screen, 06_UI_UX_SPECIFICATION, "list of owned credits")*
**Query:** `?ownerAddress=0x...&status=...`
**Response:** `{ credits: [...], pagination: {...} }`

### `POST /api/v1/credits/:id/transfer`
**Role:** current credit owner
**Request:** `{ "to": "0x..." }`
**Response — 200:** `{ "onChainCallData": { "functionName": "transferCredit", "args": [creditId, "0x..."] } }` — owner signs directly.

### `POST /api/v1/credits/:id/retire`
**Role:** current credit owner
**Request:** `{ "reason": "string (optional)" }`
**Response — 200:** `{ "onChainCallData": { "functionName": "retireCredit", "args": [creditId, "string"] } }`

### `POST /api/v1/credits/:id/dispute`
*(added — required by UC-10 / Flow 8, P1 scope; the skeleton had no dispute section)*
**Role:** Verifier or Admin
**Request:** `{ "reason": "string" }`
**Response — 200:** `{ "onChainCallData": { "functionName": "disputeCredit", "args": [creditId, "string"] } }`

### `POST /api/v1/credits/:id/resolve-dispute`
**Role:** Admin only
**Request:** `{ "upheld": true }`
**Response — 200:** `{ "onChainCallData": { "functionName": "resolveDispute", "args": [creditId, true] } }`

## 9. Audit APIs

### `GET /api/v1/projects/:id/audit`
**Role:** any (scope varies by role per Persona permissions — Issuer/Regulator get full detail, Buyer gets the pre-purchase-relevant subset)
**Response:** `{ projectId, timeline: [ LifecycleEvent, ... ] }`, ordered chronologically, per 08 Section 11.

### `GET /api/v1/credits/:id/audit`
*(added — the Credit Detail / Audit Trail screen, 06_UI_UX_SPECIFICATION, is keyed by either project **or** credit ID; only the project variant was in the skeleton)*
**Response:** same `LifecycleEvent[]` shape, scoped to a `creditId`, spanning back through its originating project and bundle — this is "the screen every persona ends up on" (06 Section 3) and must resolve in one query regardless of which ID the user searches.

## 10. Error Model

**Envelope (all non-2xx responses):**
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

**HTTP status mapping:**

| Status | Meaning |
|---|---|
| 400 | Malformed request / field-level validation failure |
| 401 | No or invalid session token |
| 403 | Authenticated but wrong role/ownership for this action |
| 404 | Entity not found |
| 409 | Conflict with current state (e.g., already retired, already issued) |
| 422 | Business-rule failure (e.g., correlation threshold not met, insufficient source diversity) |
| 502 | Upstream service failure (AI/ML Service, RPC node) |
| 500 | Unexpected server error |

**On-chain error mapping** — `CONTRACT_REVERT` responses carry the exact custom error from 09_SMART_CONTRACT_SPECIFICATION Section 9 in `details.contractError`, so the UI can show the real reason rather than a generic failure (Technical Architecture Section 9):

| Contract error | API `code` |
|---|---|
| `ProjectNotRegistered` | `PROJECT_NOT_REGISTERED` |
| `ProjectAlreadyRegistered` | `PROJECT_ALREADY_REGISTERED` |
| `BundleAlreadyExists` | `BUNDLE_ALREADY_EXISTS` |
| `BundleNotFound` | `BUNDLE_NOT_FOUND` |
| `CorrelationThresholdNotMet` | `CORRELATION_THRESHOLD_NOT_MET` |
| `ConfidenceThresholdNotMet` | `CONFIDENCE_THRESHOLD_NOT_MET` |
| `VerificationRequired` | `VERIFICATION_REQUIRED` |
| `VerificationNotApproved` | `VERIFICATION_NOT_APPROVED` |
| `BundleAlreadyIssued` | `BUNDLE_ALREADY_ISSUED` |
| `NotCreditOwner` | `NOT_CREDIT_OWNER` |
| `CreditNotTransferable` | `CREDIT_NOT_TRANSFERABLE` |
| `CreditNotRetireable` | `CREDIT_NOT_RETIREABLE` |
| `CreditNotDisputable` | `CREDIT_NOT_DISPUTABLE` |
| `NotAVerifier` | `NOT_A_VERIFIER` |
| `NotAdmin` | `NOT_ADMIN` |
| `DisputeNotActive` | `DISPUTE_NOT_ACTIVE` |

Additional API-only codes: `ML_SERVICE_UNAVAILABLE`, `INSUFFICIENT_SOURCE_DIVERSITY`, `INTEGRITY_CHECK_FAILED`, `INVALID_PAYLOAD_FORMAT`, `SESSION_EXPIRED`.

## 11. Request/Response Schemas

Canonical entity shapes are defined once in 08_DOMAIN_DATA_MODEL and are not redefined here — API bodies are direct camelCase JSON mirrors of those Mongo schemas, with one representational rule: **any on-chain `bytes32` value (project IDs, bundle IDs used in contract calls) is represented as a `0x`-prefixed hex string in JSON.**

**Shared cross-cutting shapes used across multiple endpoints above:**

```json
// OnChainCallData — returned by every owner/role-signed write (Section 1, pattern 2)
{
  "contractAddress": "0x...",
  "abiFragment": "string (JSON-encoded ABI fragment for this function)",
  "functionName": "string",
  "args": ["..."]
}
```

```json
// Pagination wrapper — used by list endpoints (GET /projects, GET /credits, GET /verifications)
{
  "items": [ "..." ],
  "page": 0, "pageSize": 0, "totalCount": 0
}
```

```json
// ActorRole enum — used by /auth/verify and role checks throughout
"issuer" | "buyer" | "verifier" | "admin" | "regulator"
```

Status enums (`PROJECT_REGISTERED`, `ISSUED`, `RETIRED`, etc.) are exactly the enums defined in 06_UI_UX_SPECIFICATION Section 5 and 08_DOMAIN_DATA_MODEL Sections 3/5/9 — the API never introduces a status value not already defined in one of those two documents, so the Status Badge component (06 Section 4) can map every possible API response value without a fallback case.

## 12. Blockchain Event Synchronization

The backend maintains persistent Ethers.js listeners on all eight contract events (09_SMART_CONTRACT_SPECIFICATION Section 7):

```
ProjectRegistered, EvidenceCommitted, RiskResultRecorded, VerificationRecorded,
CreditIssued, CreditTransferred, CreditRetired, CreditDisputed, CreditRevoked, DisputeDismissed
```

**On each event:**
1. Write a new `lifecycle_events` document (08 Section 11) — append-only, never updated or deleted (Data Integrity Rule 4).
2. Update the corresponding `projects` / `evidence_bundles` / `carbon_credits` document's `status` field to match on-chain state.
3. If off-chain and on-chain state ever disagree, **on-chain wins** and the backend re-syncs from the event (Data Integrity Rule 5) — this listener is the mechanism that enforces that rule in practice.

**Confirmation handling:** a record's transient `txStatus` field (not part of the persisted domain schema, UI-only) moves `PENDING → CONFIRMED` after 1–2 block confirmations on testnet, or `FAILED` if the transaction reverts — this drives the Transaction Toast component (06 Section 4). Reads made via the GET endpoints above always reflect the last **confirmed** on-chain state, never an unconfirmed pending write, so a page refresh never shows a value that could still revert.

**Reconciliation job:** a periodic (e.g., every 60s) backend job re-queries recent blocks for any of the above events missed by the live listener (e.g., due to an RPC websocket drop) and replays step 1–3 for anything not yet reflected in `lifecycle_events` — this is what lets the "entire flow runs end-to-end live" requirement (Scope Spec item 12) survive a flaky demo-venue network without silently losing state.
