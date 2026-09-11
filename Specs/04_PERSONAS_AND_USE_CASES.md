# User Personas & Use Cases

## Persona 1 — Project Issuer

### Goal
Get legitimate carbon reduction/removal/avoidance work verified quickly and credibly, and receive tradeable credits that buyers actually trust.

### Pain Points
- Manual, slow, opaque verification cycles with centralized registries
- No way to prove to a skeptical buyer that evidence hasn't been cherry-picked or altered
- Rejected or delayed simply because verification bandwidth is spent uniformly across every project, not risk-weighted

### Permissions
- Register a project under their wallet
- Submit evidence against their own registered project(s)
- View status and confidence score of their own submissions
- View lifecycle status of credits issued from their projects
- Cannot approve their own evidence, mint credits directly, or alter evidence after submission

### Main Actions
- UC-01 Register Project
- UC-02 Submit Evidence
- UC-09 Inspect Audit Trail (own projects/credits)

## Persona 2 — Corporate Buyer

### Goal
Purchase carbon credits that will withstand scrutiny — internal ESG audit, regulator inquiry, or public claim challenge.

### Pain Points
- Can't currently distinguish a rigorously verified credit from a rubber-stamped one
- Reputational and compliance risk from buying low-integrity offsets
- No easy way to trace a credit back to its underlying evidence

### Permissions
- Browse/inspect issued credits and their full evidence-to-issuance trail
- Receive transferred credits into their wallet
- Retire credits they own against their own emissions claims
- Cannot issue, verify, or revoke credits

### Main Actions
- UC-07 Transfer Credit (as recipient)
- UC-08 Retire Credit
- UC-09 Inspect Audit Trail (pre-purchase due diligence)

## Persona 3 — Verifier / Auditor

### Goal
Spend review time only where it's needed — anomalous or low-confidence submissions — and trust that the evidence in front of them hasn't been tampered with.

### Pain Points
- Currently reviews everything manually with no pre-filtering by risk
- No cryptographic guarantee that submitted evidence is unaltered
- Verification decisions and reasoning aren't always transparently or permanently recorded

### Permissions
- View evidence bundles routed to them (escalated by the risk engine)
- Approve, reject, or request additional evidence
- Cannot self-assign to a project, edit evidence, or issue credits directly

### Main Actions
- UC-04 Review Risk
- UC-05 Verify Project
- UC-10 Challenge Credit (can initiate or support a dispute)

## Persona 4 — Regulator

### Goal
Oversee market integrity — confirm credits map to real, evidence-backed reductions, and catch fraud or double-counting across the system.

### Pain Points
- No unified, auditable view across fragmented registries today
- Double-counting and duplicate retirement are hard to detect after the fact
- Investigations currently rely on institutional cooperation rather than direct evidence

### Permissions
- Read-only access to full lifecycle history of any project or credit
- View dispute records, revocations, and anomaly flags system-wide
- Cannot issue, transfer, retire, or verify — oversight only

### Main Actions
- UC-09 Inspect Audit Trail (system-wide)
- UC-10 Challenge Credit (can review/escalate disputes)

---

# Use Cases

## UC-01 Register Project
- **Actor:** Project Issuer
- **Precondition:** Issuer has a connected wallet
- **Flow:** Issuer submits project metadata (name, type, location, proponent wallet) → system generates a persistent project ID → project stored as pending evidence
- **Postcondition:** Project exists and can accept evidence submissions
- **Priority:** P0

## UC-02 Submit Evidence
- **Actor:** Project Issuer
- **Precondition:** Project is registered
- **Flow:** Issuer submits evidence from one or more source types (sensor, satellite, verifier, documentation) → system timestamps and stores each payload
- **Postcondition:** Evidence is queued for aggregation/hashing
- **Priority:** P0

## UC-03 Validate Evidence
- **Actor:** System (automated)
- **Precondition:** Evidence has been submitted
- **Flow:** System aggregates evidence into a bundle → computes Merkle root/hash → verifies signature/hash integrity of each payload → flags any payload that fails integrity
- **Postcondition:** A tamper-evident, integrity-checked evidence bundle exists, ready for risk assessment
- **Priority:** P0

## UC-04 Review Risk
- **Actor:** System (automated), escalates to Verifier
- **Precondition:** Evidence bundle has passed integrity validation
- **Flow:** System checks N-of-M source correlation → ML model scores the bundle for anomalies → produces a confidence score with a human-readable reason → routes to auto-issuance (high confidence) or verifier queue (low confidence/anomalous)
- **Postcondition:** Evidence bundle is scored and routed
- **Priority:** P0

## UC-05 Verify Project
- **Actor:** Verifier / Auditor
- **Precondition:** Evidence bundle has been escalated to the verifier queue
- **Flow:** Verifier reviews the evidence bundle and confidence score → approves, rejects, or requests additional evidence
- **Postcondition:** A recorded verification decision exists, gating issuance
- **Priority:** P1

## UC-06 Issue Credit
- **Actor:** System (smart contract), triggered by UC-04 auto-approval or UC-05 verifier approval
- **Precondition:** Evidence is authenticated, correlation threshold met, and (if escalated) verifier approval recorded
- **Flow:** Smart contract checks no prior credit exists for this evidence bundle → mints a credit linked to the project, evidence reference, and verification record
- **Postcondition:** A blockchain-based carbon credit exists, cryptographically linked to its evidence trail; duplicate issuance against the same bundle is blocked
- **Priority:** P0

## UC-07 Transfer Credit
- **Actor:** Credit owner (Issuer or Corporate Buyer)
- **Precondition:** Credit is issued and not retired
- **Flow:** Owner initiates transfer to a recipient wallet → smart contract validates credit is transferable → ownership updated on-chain
- **Postcondition:** Credit ownership is updated and recorded immutably
- **Priority:** P0

## UC-08 Retire Credit
- **Actor:** Credit owner (typically Corporate Buyer)
- **Precondition:** Credit is issued and not already retired
- **Flow:** Owner initiates retirement → smart contract marks credit as permanently retired
- **Postcondition:** Credit is non-transferable and non-reusable; any further transfer/re-issuance attempt against it is rejected on-chain
- **Priority:** P0

## UC-09 Inspect Audit Trail
- **Actor:** Any persona (scope varies: Issuer sees own, Buyer sees pre-purchase trail, Regulator sees system-wide)
- **Precondition:** At least one project/credit exists
- **Flow:** Actor queries a project or credit ID → system returns full lifecycle: registration → evidence → validation → risk score → verification decision → issuance → transfers → retirement/dispute status
- **Postcondition:** Complete, single-query traceability is displayed
- **Priority:** P0

## UC-10 Challenge Credit
- **Actor:** Verifier / Auditor or Regulator
- **Precondition:** Credit is issued
- **Flow:** Actor submits a dispute with supporting evidence → credit is flagged as disputed → admin/simplified governance reviews → credit is revoked (if upheld) or dispute is dismissed (if rejected)
- **Postcondition:** Dispute outcome and any revocation are permanently recorded on-chain
- **Priority:** P1
