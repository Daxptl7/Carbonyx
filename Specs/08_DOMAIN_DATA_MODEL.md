# Domain & Data Model

## 1. Domain Entities

- **Project** — a registered carbon reduction/removal/avoidance project
- **EvidenceItem** — a single payload from one evidence source (sensor, satellite, verifier attestation, documentation)
- **EvidenceBundle** — the aggregated, hashed set of EvidenceItems submitted for a project at a point in time
- **ValidationResult** — outcome of integrity checking + correlation check on a bundle
- **RiskAssessment** — the ML model's confidence score + reason + recommendation for a bundle
- **VerificationDecision** — a human verifier's approve/reject/request-more-evidence decision on an escalated bundle
- **CarbonCredit** — the issued, on-chain asset, linked back to its originating project and evidence bundle
- **LifecycleEvent** — an immutable record of any state-changing action on a Project or CarbonCredit (used to build the Audit Trail)
- **Dispute** — a challenge raised against an issued credit
- **Actor** — a wallet address with an associated role (Issuer, Buyer, Verifier, Regulator/Admin)

## 2. Entity Relationships

```
Actor (1) ──registers──> (many) Project
Project (1) ──has──> (many) EvidenceBundle
EvidenceBundle (1) ──contains──> (many) EvidenceItem
EvidenceBundle (1) ──produces──> (1) ValidationResult
ValidationResult (1) ──feeds──> (1) RiskAssessment
RiskAssessment (1) ──may trigger──> (0..1) VerificationDecision
EvidenceBundle (1) ──may result in──> (0..1) CarbonCredit
CarbonCredit (1) ──belongs to──> (1) Actor (current owner)
CarbonCredit (1) ──has many──> LifecycleEvent
CarbonCredit (0..1) ──has──> (0..1) Dispute
Dispute (1) ──raised by──> (1) Actor
```

Key cardinality rule enforced at the data-integrity level (Section 14): one EvidenceBundle can produce **at most one** CarbonCredit, ever — this is the duplicate-issuance-prevention rule from the Scope Spec's MVP Definition.

## 3. Project Schema

```json
{
  "projectId": "string (UUID or on-chain ID, unique)",
  "ownerAddress": "string (wallet address)",
  "name": "string",
  "projectType": "enum [reforestation, renewable_energy, methane_capture, other]",
  "location": "string",
  "baselineDescription": "string",
  "status": "enum [PROJECT_REGISTERED, EVIDENCE_PENDING, VALIDATING, REVIEW_REQUIRED, VERIFIED, MINT_AUTHORIZED, ISSUED]",
  "createdAt": "ISO 8601 timestamp",
  "onChainRef": "string | null (tx hash / on-chain project reference, if applicable)"
}
```

## 4. Evidence Schema

```json
{
  "evidenceId": "string (UUID)",
  "projectId": "string (foreign key -> Project)",
  "bundleId": "string (foreign key -> EvidenceBundle, assigned once included in a bundle)",
  "sourceType": "enum [sensor, satellite, verifier_attestation, documentation]",
  "payload": "object (source-type-specific structured data)",
  "payloadHash": "string (SHA-256 hex)",
  "signature": "string | null (mock signature for demo)",
  "submittedAt": "ISO 8601 timestamp",
  "integrityStatus": "enum [PENDING, PASSED, FAILED]",
  "integrityFailureReason": "string | null"
}
```

## 5. Evidence Bundle Schema

```json
{
  "bundleId": "string (UUID)",
  "projectId": "string (foreign key -> Project)",
  "evidenceItemIds": ["string (foreign keys -> EvidenceItem)"],
  "merkleRoot": "string (hex)",
  "sourceTypesPresent": ["enum [sensor, satellite, verifier_attestation, documentation]"],
  "correlationThresholdMet": "boolean (N-of-M rule result)",
  "status": "enum [AGGREGATING, VALIDATED, VALIDATION_FAILED, SCORED, ESCALATED, AUTO_APPROVED, VERIFIER_APPROVED, VERIFIER_REJECTED, ISSUED]",
  "createdAt": "ISO 8601 timestamp"
}
```

## 6. Validation Result Schema

```json
{
  "validationId": "string (UUID)",
  "bundleId": "string (foreign key -> EvidenceBundle)",
  "merkleRootVerified": "boolean",
  "itemIntegrityResults": [
    { "evidenceId": "string", "status": "enum [PASSED, FAILED]", "reason": "string | null" }
  ],
  "correlationCheck": {
    "requiredSources": "integer (N)",
    "totalSources": "integer (M)",
    "presentSources": "integer",
    "passed": "boolean"
  },
  "overallResult": "enum [VALID, INVALID_INTEGRITY, INVALID_CORRELATION]",
  "evaluatedAt": "ISO 8601 timestamp"
}
```

## 7. Risk Assessment Schema

```json
{
  "riskAssessmentId": "string (UUID)",
  "bundleId": "string (foreign key -> EvidenceBundle)",
  "confidenceScore": "number (0-100)",
  "anomaliesDetected": [
    { "type": "string", "description": "string", "severity": "enum [low, medium, high]" }
  ],
  "reason": "string (human-readable explanation of the score)",
  "recommendation": "enum [auto_approve, escalate]",
  "modelVersion": "string",
  "scoredAt": "ISO 8601 timestamp"
}
```

## 8. Verification Schema

```json
{
  "verificationId": "string (UUID)",
  "bundleId": "string (foreign key -> EvidenceBundle)",
  "verifierAddress": "string (wallet address, allow-listed)",
  "decision": "enum [approved, rejected, request_more_evidence]",
  "decisionReason": "string",
  "decidedAt": "ISO 8601 timestamp",
  "onChainTxHash": "string | null"
}
```

## 9. Carbon Credit Schema

```json
{
  "creditId": "string (on-chain token ID)",
  "projectId": "string (foreign key -> Project)",
  "bundleId": "string (foreign key -> EvidenceBundle, the sole bundle that may ever back this credit)",
  "currentOwner": "string (wallet address)",
  "issuedTo": "string (wallet address, original recipient)",
  "issuedAt": "ISO 8601 timestamp",
  "issuanceTxHash": "string",
  "co2eQuantity": "number (tonnes CO2-equivalent, demo/sample value)",
  "status": "enum [ISSUED, TRANSFERRED, RETIRED, DISPUTED, REVOKED]",
  "retiredAt": "ISO 8601 timestamp | null",
  "retirementReason": "string | null",
  "disputeId": "string | null (foreign key -> Dispute)"
}
```

## 10. Lifecycle State Machine

**Project status transitions:**
```
PROJECT_REGISTERED → EVIDENCE_PENDING → VALIDATING
VALIDATING → REVIEW_REQUIRED (low confidence/anomaly)
VALIDATING → VERIFIED (high confidence, auto-approved)
REVIEW_REQUIRED → VERIFIED (verifier approves)
REVIEW_REQUIRED → EVIDENCE_PENDING (verifier requests more evidence)
REVIEW_REQUIRED → [terminal: rejected, no further transition without new bundle]
VERIFIED → MINT_AUTHORIZED → ISSUED
```

**Carbon Credit status transitions:**
```
ISSUED → TRANSFERRED (repeatable, ownership changes; status label may stay "TRANSFERRED" or revert display to "ISSUED"-equivalent "held" state — current owner always tracked regardless)
ISSUED | TRANSFERRED → RETIRED  [terminal — no further transitions permitted]
ISSUED | TRANSFERRED → DISPUTED
DISPUTED → REVOKED  [terminal]
DISPUTED → ISSUED | TRANSFERRED  (dispute rejected, reverts to prior status)
```

**Hard rule:** `RETIRED` and `REVOKED` are terminal states. No schema, contract function, or backend code path may transition a credit out of either state. This is the single most important integrity rule in the system and directly backs MVP Definition item 10.

## 11. Audit Event Schema

```json
{
  "eventId": "string (UUID)",
  "entityType": "enum [Project, EvidenceBundle, CarbonCredit, Dispute]",
  "entityId": "string (foreign key, polymorphic on entityType)",
  "eventType": "enum [ProjectRegistered, EvidenceSubmitted, EvidenceValidated, RiskScored, EscalatedToVerifier, VerificationDecided, CreditIssued, CreditTransferred, CreditRetired, DisputeRaised, CreditRevoked, DisputeDismissed]",
  "actorAddress": "string (wallet address that triggered the event, or 'system' for automated events)",
  "details": "object (event-specific payload, e.g., confidence score for RiskScored, recipient for CreditTransferred)",
  "onChainTxHash": "string | null",
  "timestamp": "ISO 8601 timestamp"
}
```

Every LifecycleEvent record is append-only — no update or delete operations are ever performed on this collection. This is what makes the Audit Trail screen (UI/UX Spec) a true single-source lifecycle view.

## 12. Database Schema

MongoDB collections (off-chain source of descriptive truth; on-chain remains source of truth for state per Technical Architecture Section 6):

- `projects` — Project documents
- `evidence_items` — EvidenceItem documents
- `evidence_bundles` — EvidenceBundle documents
- `validation_results` — ValidationResult documents
- `risk_assessments` — RiskAssessment documents
- `verifications` — VerificationDecision documents
- `carbon_credits` — CarbonCredit documents (mirrors on-chain state, refreshed via event listener)
- `lifecycle_events` — append-only AuditEvent log
- `disputes` — Dispute documents
- `actors` — Actor/role mapping (wallet address → role)

On-chain (Solidity contract storage, minimal by design per Technical Architecture Section 6):
- project reference mapping (projectId → owner, active bool)
- evidence bundle commitment mapping (bundleId → merkleRoot, issued bool)
- credit registry (creditId → owner, status, bundleId reference)
- verifier allow-list mapping (address → isVerifier bool)
- admin/governance address for dispute resolution

## 13. Indexing Strategy

- `projects`: index on `ownerAddress`, unique index on `projectId`
- `evidence_items`: index on `projectId`, index on `bundleId`
- `evidence_bundles`: unique index on `bundleId`, index on `projectId`, index on `merkleRoot` (supports duplicate-bundle detection)
- `risk_assessments`: index on `bundleId`
- `verifications`: index on `bundleId`, index on `verifierAddress`
- `carbon_credits`: unique index on `creditId`, index on `currentOwner`, unique index on `bundleId` (enforces one-credit-per-bundle at the database level, mirroring the on-chain rule)
- `lifecycle_events`: compound index on `(entityType, entityId, timestamp)` for fast audit-trail assembly; index on `actorAddress`
- `disputes`: index on `creditId`

## 14. Data Integrity Rules

1. **One credit per evidence bundle, enforced twice.** Both the `carbon_credits.bundleId` unique index (off-chain) and the on-chain contract's `issued` boolean check (on-chain) must independently reject a second issuance attempt against the same bundle. Neither layer trusts the other alone.
2. **Terminal states are immutable.** `RETIRED` and `REVOKED` credits can never be transferred, re-verified, re-issued, or have their status changed by any code path (Section 10).
3. **Evidence integrity failures exclude, not delete.** A failed-integrity EvidenceItem stays in `evidence_items` with `integrityStatus: FAILED` for audit purposes — it is never deleted, only excluded from the valid correlation count.
4. **Lifecycle events are append-only.** No update/delete operations are permitted against `lifecycle_events` at the application layer.
5. **On-chain state is authoritative for status.** If off-chain (`MongoDB`) and on-chain state ever disagree on a CarbonCredit's status, the on-chain value wins and the backend re-syncs from the last on-chain event.
6. **Verifier decisions require a role check.** A `VerificationDecision` may only be recorded from an address present in the on-chain verifier allow-list; the backend must reject the write otherwise, and the contract independently re-checks this at the transaction level.
7. **Ownership actions require current-owner match.** Transfer and retire actions are rejected (both backend pre-check and on-chain enforcement) unless the initiating address equals the credit's `currentOwner` at execution time.
