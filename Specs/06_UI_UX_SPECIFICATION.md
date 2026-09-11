# UI/UX Specification

## 1. Design Principles

- **Evidence-first** — evidence and its validation status are always visible, never hidden behind a generic "pending" spinner
- **Auditability** — every screen showing a credit or project must link out to its full lifecycle trail in one click
- **Trust** — confidence scores, integrity checks, and verifier decisions are shown with their reasoning, never as an unexplained pass/fail
- **Minimal cognitive load** — one primary action per screen; status is always visible without navigating away
- **Explainability** — anywhere the system makes an automated decision (risk score, auto-issuance), show the "why," not just the "what"
- **Professional B2B interface** — this is infrastructure for issuers, buyers, verifiers, and regulators, not a consumer app; favor clarity and data density over decoration

## 2. Navigation

Top-level nav (role-aware — shown items depend on connected wallet's role, defaulting to Issuer/Buyer view if role is ambiguous):

- **Dashboard** — role-specific home (Issuer: my projects; Buyer: my credits; Verifier: review queue; Regulator: system overview)
- **Projects** — register new project, view/manage own projects (Issuer)
- **Credits** — browse issued credits, view owned credits, transfer/retire (Buyer/Issuer)
- **Verification Queue** — evidence bundles awaiting review (Verifier only)
- **Audit Trail** — search any project/credit ID, view full lifecycle (all roles)
- **Wallet indicator** — connected address, role badge, network (top-right, persistent)

## 3. Screen Specifications

### Screen: Project Dashboard

**Purpose:** Give the Issuer a single view of all their registered projects and each project's current pipeline status.

**Primary user:** Project Issuer

**Inputs:** None (read view); "Register New Project" button leads to registration form

**Components:** Project cards/table (name, ID, status badge, evidence count, date registered), "Register New Project" CTA, status filter

**Actions:** Register new project, open a project to view details/submit evidence, jump to a project's audit trail

**States:** Loading, populated (list of projects), empty (no projects yet)

**Errors:** Failed to load projects (retry action shown)

**Empty State:** "No projects registered yet" + prominent "Register your first project" CTA

---

### Screen: Project Registration Form

**Purpose:** Capture project metadata and create a new project record.

**Primary user:** Project Issuer

**Inputs:** Project name, project type (dropdown: reforestation, renewable energy, methane capture, etc.), location, baseline description

**Components:** Form fields, wallet-connect confirmation, submit button

**Actions:** Submit registration

**States:** Empty form, filled/validating, submitting, success (redirect to project detail)

**Errors:** Missing required field, wallet not connected, submission failed (network/contract error)

**Empty State:** N/A (form is always "empty" on entry)

---

### Screen: Evidence Submission

**Purpose:** Let the Issuer submit evidence from multiple source types against a registered project.

**Primary user:** Project Issuer

**Inputs:** Source type selector (sensor / satellite / verifier attestation / documentation), payload upload or structured entry per type

**Components:** Source-type tabs or cards, upload/entry field per source, list of already-submitted evidence with source-type icons and timestamps, "Submit for Validation" CTA (enabled once minimum source diversity is met)

**Actions:** Add evidence per source, remove/replace before submission, trigger validation

**States:** No evidence yet, partial evidence (below correlation threshold — CTA disabled with explanation), sufficient evidence (CTA enabled), submitted/validating

**Errors:** Invalid payload format, upload failure

**Empty State:** "No evidence submitted yet — add at least 2 independent sources to proceed"

---

### Screen: Validation & Risk Result

**Purpose:** Show the outcome of evidence validation and risk scoring, including the reasoning — this is the demo's core "proof" screen.

**Primary user:** Project Issuer (viewing), Verifier (acting, if escalated)

**Inputs:** None from Issuer; Verifier has approve/reject/request-more-evidence actions here

**Components:** Integrity check results per evidence item (pass/fail icon), Merkle root display, source-correlation result (N of M met/not met), confidence score (visual gauge/number), plain-language reason for the score, routing outcome banner ("Auto-approved for issuance" or "Escalated to verifier review")

**Actions:** (Issuer) view only, link to submit more evidence if failed; (Verifier) approve / reject / request more evidence, each requiring a short recorded reason

**States:** Validating (in progress), high-confidence/auto-approved, low-confidence/escalated, verifier-approved, verifier-rejected, validation failed (insufficient evidence)

**Errors:** Scoring engine failure (retry), integrity check failure on all submitted evidence (blocks progress, prompts re-submission)

**Empty State:** N/A (only reached once evidence has been submitted)

---

### Screen: Credit Detail / Audit Trail

**Purpose:** Show the complete, single-view lifecycle of one credit from registration through to its current state — the screen every persona ends up on.

**Primary user:** All roles

**Inputs:** Credit ID or project ID (search)

**Components:** Vertical timeline (Registered → Evidence Submitted → Validated → Risk Scored → [Verified] → Issued → Transferred(s) → Retired/Disputed/Revoked), each step expandable to show underlying data (hash, confidence score + reason, verifier decision, transaction hash), current status badge

**Actions:** Expand/collapse timeline steps, copy transaction hashes, (if owner) initiate transfer/retire from here, (if verifier/regulator) initiate dispute

**States:** Loading, full trail loaded, partial trail (credit not yet issued — shows progress so far)

**Errors:** Credit/project ID not found

**Empty State:** N/A (requires a valid ID to reach this screen)

---

### Screen: Credit Wallet (Transfer / Retire)

**Purpose:** Let a credit owner manage their held credits.

**Primary user:** Corporate Buyer, Project Issuer (post-issuance)

**Inputs:** Recipient address (for transfer), retirement reason (optional, for retire)

**Components:** List of owned credits (status: Issued/Transferred/Retired), per-credit "Transfer" and "Retire" actions, confirmation modal for each action

**Actions:** Transfer credit, retire credit, view credit's audit trail

**States:** Empty wallet, populated wallet, transaction pending, transaction confirmed, transaction failed

**Errors:** Transfer/retire attempted on a retired/disputed credit (blocked with explanation), transaction rejected by wallet, contract revert (shown with reason)

**Empty State:** "No credits in this wallet yet"

---

### Screen: Verification Queue

**Purpose:** Give the Verifier a prioritized list of evidence bundles awaiting human review.

**Primary user:** Verifier / Auditor

**Inputs:** None (read view); filters by status/date

**Components:** Queue list (project name, flagged reason snippet, confidence score, time waiting), click-through to Validation & Risk Result screen for the decision

**Actions:** Open a queued item, approve/reject/request more evidence (performed on the Validation & Risk Result screen)

**States:** Empty queue, populated queue

**Errors:** Failed to load queue

**Empty State:** "No evidence currently awaiting review"

## 4. Component Library

- **Status Badge** — colored pill per Section 5 status (color-coded: neutral/blue = in progress, green = positive terminal state, red = negative/blocked, amber = needs attention)
- **Confidence Gauge** — 0–100 score with a color band (red/amber/green) and a one-line reason beneath it
- **Evidence Source Card** — icon per source type, timestamp, integrity check result
- **Lifecycle Timeline** — vertical stepper used on Credit Detail/Audit Trail screen
- **Action Confirmation Modal** — used for transfer, retire, verifier decisions, dispute submission — always states the consequence (e.g., "Retiring is permanent and cannot be undone")
- **Transaction Toast** — pending/confirmed/failed feedback for any on-chain action, with a link to the transaction hash

## 5. Status System

- `PROJECT_REGISTERED`
- `EVIDENCE_PENDING`
- `VALIDATING`
- `REVIEW_REQUIRED`
- `VERIFIED`
- `MINT_AUTHORIZED`
- `ISSUED`
- `TRANSFERRED`
- `RETIRED`
- `DISPUTED`
- `REVOKED`

Each status maps to exactly one badge color and one icon, used consistently across every screen (Dashboard, Credit Detail, Wallet, Verification Queue) — a status must look identical wherever it appears.

## 6. Data Visualization

- **Confidence Gauge** on the Validation & Risk Result screen — primary demo visual, must clearly differentiate a high-confidence pass from a flagged anomaly at a glance
- **Lifecycle Timeline** on Credit Detail screen — the audit-trail visual; this is what closes the demo, so it must render cleanly with real transaction hashes, not placeholder text
- **Evidence source comparison** (optional, P2) — simple bar/scatter showing how each source's reading compares, visually supporting "why" an anomaly was flagged

## 7. Responsive Behavior

- Primary demo target is desktop/laptop (judging happens on a presenter's screen) — desktop layout is P0
- Tablet/mobile responsive layout is P2 (nice to have, not required for judging)
- No functionality should be exclusive to a non-desktop breakpoint

## 8. Accessibility

- Status badges use both color and text/icon (not color alone) so states are distinguishable without relying on color perception
- Sufficient contrast on all status colors and confidence gauge bands
- All primary actions (register, submit, approve/reject, transfer, retire) reachable via keyboard
- Form fields have visible labels, not placeholder-only text

## 9. Demo-Critical Screens

These four screens are what the judges actually watch — prioritize polish here over anything else in the UI:

1. **Evidence Submission** — shows the multi-source evidence-first claim in action
2. **Validation & Risk Result** — the proof screen; must clearly show the clean-pass vs. anomaly-flagged branch (Flows 4 and 5)
3. **Verification Queue + decision** — shows the human-in-the-loop escalation working, not just claimed
4. **Credit Detail / Audit Trail** — the closing screen; must show a real, complete, clickable lifecycle for the credit used in the live demo
