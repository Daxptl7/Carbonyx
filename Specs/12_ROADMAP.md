# Roadmap / Execution Plan

## 1. Roadmap Principles

- This document is item **6 in the Project Constitution's Source-of-Truth Hierarchy (Section 10)** — it sits below all nine specs and the patent, and above code. Nothing here overrides 01–11; every task below cites the spec section it implements.
- **36-hour window**, phased so that a working end-to-end flow exists as early as possible and every subsequent phase adds capability without ever leaving the system in a non-demoable state for long (Constitution Section 7: "a working end-to-end flow beats a partially-built full architecture").
- **Scope freezes at Hour 12** (Scope Spec Section 9), which falls inside Phase 2 below. No new P0/P1 feature may start after that mark — only bugfixes and polish on what Section 4 of the Scope Spec already lists.
- **If a P0 item is at risk near the freeze, cut a P1/P2 item to protect it** — P0 is never dropped (Scope Spec Section 9). Section 12 of this document names exactly which P1/P2 items are the ones to cut, in order, so that decision doesn't have to be made live under pressure.
- Every phase ends with an explicit **Exit Criteria** checklist and a **Tests** list. A phase is not "done" until both are satisfied — moving on with a failing exit criterion is itself a scope violation per Constitution Section 11 (silent resolution of ambiguity/risk is not allowed; it must be flagged).

## 2. Team & Ownership Map

| Person | Primary Ownership | Specs Owned | Secondary |
|---|---|---|---|
| **Jash Bohare** | Blockchain / Smart Contracts | 09_SMART_CONTRACT_SPECIFICATION (all contract code, Foundry tests, testnet deployment) | Reviews on-chain calls made from backend (Dax) and frontend (Hilag) against contract ABI |
| **Dax** | Full-Stack (Backend orchestrator) + AI/ML integration | 11_API_SPECIFICATION (backend implementation), Evidence Service (Merkle/hashing), event listener | Bridges Siddhant's ML service into the pipeline; owns trusted-relayer transaction submission |
| **Siddhant** | AI/ML | 10_AI_ML_SPECIFICATION (model, feature engineering, `/score` service, seed dataset) | Works from Hour 0 largely independently (07 ADR-004); syncs with Dax on the `/score` contract |
| **Hilag** | Frontend (MERN — React) | 06_UI_UX_SPECIFICATION (all screens), wallet integration (Ethers.js), owner-signed transaction submission | Consumes `onChainCallData` objects from Dax's API (11 Section 1) rather than building contract calls independently |

**Module traceability** (Constitution Section 9 mapping → primary owner):

| Patent Module | MVP Implementation | Primary Owner | Supporting |
|---|---|---|---|
| 102 Project Registration/DID | Simplified registration | Jash (contract) | Hilag (form UI), Dax (off-chain metadata) |
| 104A–D Evidence Acquisition | Seeded multi-source submission | Hilag (UI), Dax (storage) | Siddhant (seed payload shapes) |
| 106 Evidence Aggregation & Hashing | Merkle root in backend | Dax | Jash (on-chain commitment check) |
| 108 Cryptographic Validation | Hash/signature integrity check | Dax | — |
| 110 Correlation/Risk/Anomaly | ML confidence scoring | Siddhant | Dax (N-of-M diversity gate, distinct per 10_AI_ML_SPECIFICATION Section 7) |
| 112/114 Verifier Assignment/Reputation | Single allow-listed verifier | Jash (allow-list on-chain) | Hilag (queue UI), Dax (queue backend) |
| 116 Smart Contract Policy Engine | On-chain mint conditions | Jash | — |
| 118 Blockchain Registry & Issuance | ERC-721 credit | Jash | Dax (relayer trigger) |
| 120 Lifecycle Management | Transfer/retire | Jash (contract) | Hilag (UI) |
| 122 Dispute & Revocation | Flag/revoke, single admin | Jash (contract) | Hilag (UI), Dax (backend) |
| 124 Settlement | **Out of scope** | — | — |

## 3. Timeline Overview

| Phase | Hours | Focus |
|---|---|---|
| 0 | 0–2 | Setup & Interface Freeze |
| 1 | 2–10 | Foundations (parallel build) |
| 2 | 10–18 | Core Pipeline Integration — **Scope Freeze at Hour 12** |
| 3 | 18–26 | Verification, Issuance & Lifecycle |
| 4 | 26–31 | Audit Trail, Dispute & UI Polish |
| 5 | 31–36 | Hardening, Testing & Demo Rehearsal |

---

## 4. Phase 0 — Setup & Interface Freeze (Hour 0–2)

**Goal:** Everyone can start writing code against a frozen, shared contract (specs + repo + env) with zero blocking dependencies on each other for the first work block.

| Task | Owner | Supporting |
|---|---|---|
| Confirm the `commitEvidenceBundle` trusted-relayer decision (11_API_SPECIFICATION Section 1) — sign off or override before any contract code is written | Jash | Dax |
| Scaffold mono-repo: `/contracts`, `/backend`, `/ml-engine`, `/frontend`, `/specs` (Constitution Section 1) | Jash | All |
| Initialize Foundry project, install OpenZeppelin (ERC-721) | Jash | — |
| Initialize Node.js + Express backend skeleton, connect to MongoDB Atlas (or local fallback per 07 Section 13) | Dax | — |
| Initialize Python service skeleton (FastAPI/Flask), install scikit-learn | Siddhant | — |
| Initialize React app, install Ethers.js, Tailwind | Hilag | — |
| Set shared `.env.example` covering: RPC URL, contract addresses (placeholder), Mongo URI, ML service URL, relayer private key var name | Dax | Jash |
| Agree on branch strategy (one branch per person, PR into `main`, no direct pushes to `main` after Phase 1) | All | — |
| Set up a shared testnet (Base Sepolia or Sepolia) faucet-funded relayer wallet + verifier demo wallet + admin wallet + 1–2 buyer demo wallets | Jash | Dax |

**Exit Criteria:**
- [ ] Repo structure matches Constitution Section 1, pushed and cloneable by all four
- [ ] Each person's local environment runs their own component in isolation (empty contract deploys locally, backend boots and connects to Mongo, ML service responds to a health check, frontend renders a blank shell)
- [ ] `.env.example` covers every variable named in 07_TECHNICAL_ARCHITECTURE Section 4–5
- [ ] Relayer/verifier/admin/buyer wallets funded on testnet

**Tests:**
- Smoke test only: each service starts without crashing. No functional tests yet — nothing to test.

---

## 5. Phase 1 — Foundations (Hour 2–10)

**Goal:** Each component's core building block exists and is independently testable, even though nothing is wired together yet. This is the parallel-build phase enabled by the frozen interfaces (07 Section 2: "interfaces before implementation").

| Task | Owner | Spec Reference |
|---|---|---|
| Implement `ProjectRegistry` and `EvidenceRegistry` contracts (state + `registerProject`, `commitEvidenceBundle`, `recordRiskResult`) | Jash | 09 Sections 4–5 |
| Write Foundry unit tests for `registerProject` (succeeds once, reverts on duplicate) | Jash | 09 Section 12 |
| Implement Mongo schemas/models for `projects`, `evidence_items`, `evidence_bundles` (08 Sections 3–5) | Dax | 08, 11 Sections 3–4 |
| Implement `POST /projects`, `GET /projects/:id`, `GET /projects` | Dax | 11 Section 3 |
| Implement `POST /projects/:id/evidence`, `GET /projects/:id/evidence` (raw payload storage + SHA-256 hashing) | Dax | 11 Section 4, 08 Section 4 |
| Build the synthetic "clean" model-fitting dataset (30–50 bundles) and fit initial Isolation Forest | Siddhant | 10 Section 14 |
| Implement feature-extraction function (Section 3 feature table) | Siddhant | 10 Section 3 |
| Stand up `POST /score` with rule-based validation (Section 4/6) working even before the model is fully tuned | Siddhant | 10 Sections 4, 6, 12 |
| Build wallet-connect flow (MetaMask via Ethers.js), session auth against `POST /auth/verify` | Hilag | 11 Section 2 |
| Build Project Registration Form + Project Dashboard (static data first, wire to API once Dax's endpoints are live) | Hilag | 06 Section 3 |
| Build Evidence Submission screen shell (source-type tabs/cards) | Hilag | 06 Section 3 |

**Exit Criteria:**
- [ ] A project can be registered end-to-end within the contract layer alone (Foundry test, no backend/frontend involved)
- [ ] A project can be registered end-to-end within the backend+Mongo layer alone (Postman/curl, no contract call yet)
- [ ] `POST /score` returns a valid response shape for a hand-crafted request, even if scoring accuracy isn't tuned yet
- [ ] Wallet connects in the frontend and a session token is obtained
- [ ] Project Registration Form renders and can submit to Dax's `POST /projects` (still without the on-chain step)

**Tests:**
- Contracts: Foundry unit tests for `registerProject`, `commitEvidenceBundle` per 09 Section 12 (duplicate-`projectId` revert, duplicate-`bundleId` revert)
- Backend: endpoint-level tests for `POST /projects`, `POST /projects/:id/evidence` (happy path + the format-validation failure case from 05_USER_FLOWS Flow 2)
- ML: TC1/TC2 from 10_AI_ML_SPECIFICATION Section 16 against the hand-crafted demo bundles (even with an untuned model — confirms the pipeline shape, not yet accuracy)
- Frontend: manual click-through of Registration Form + wallet connect

---

## 6. Phase 2 — Core Pipeline Integration (Hour 10–18)

**⚠ Scope Freeze at Hour 12** (Scope Spec Section 9) falls inside this phase. By Hour 12: no new P0/P1 feature may be started that isn't already listed in Scope Spec Section 4. If a task below is behind at Hour 12, apply Section 12 of this roadmap (cut list) rather than adding scope.

**Goal:** The full clean-bundle path (Flow 4) works end-to-end, live, through every layer — this is the single most important milestone in the whole build, because it's the backbone the anomalous/escalation path (Phase 3) extends.

| Task | Owner | Spec Reference |
|---|---|---|
| Wire frontend registration to actually submit the on-chain `registerProject` tx via the returned `onChainCallData` | Hilag | 11 Section 3, `onChainCallData` pattern |
| Implement Merkle root computation + integrity (hash/signature) check in the Evidence Service | Dax | 07 Section 5, 09 Section 5 |
| Implement N-of-M source-diversity check (distinct from Siddhant's quantitative correlation) | Dax | 05 Flow 3 step 5, 10 Section 7 |
| Implement `POST /projects/:id/evidence/submit`, `POST /validation/run`, `GET /validation/:id` | Dax | 11 Sections 4–5 |
| Implement backend → ML service call (`POST /risk/analyze` → ML `/score`) and persist `RiskAssessment` | Dax | 11 Section 6, 10 Section 12 |
| Implement trusted-relayer `commitEvidenceBundle()` and `recordRiskResult()` calls from backend | Dax | 09 Section 5, 11 Section 1 |
| Implement `mintCredit()` in `CarbonCreditRegistry` (ERC-721), including all five policy checks + duplicate guard | Jash | 09 Sections 4–6 |
| Implement backend trusted-relayer call to `mintCredit()` on `auto_approve` | Dax | 11 Section 8 |
| Implement on-chain event listener for `ProjectRegistered`, `EvidenceCommitted`, `RiskResultRecorded`, `CreditIssued` | Dax | 07 Section 8, 11 Section 12 |
| Tune the Isolation Forest + weighting (10 Section 8) against the clean and anomalous demo bundles until separation target is met (≥30-point gap, Section 15) | Siddhant | 10 Sections 14–15 |
| Wire Evidence Submission screen fully to backend (upload → hash → "Submit for Validation" CTA gated on source diversity per 06 Section 3) | Hilag | 06, 11 Section 4 |
| Build Validation & Risk Result screen: integrity results, Merkle root display, confidence gauge, auto-approve banner | Hilag | 06 Section 3, Section 6 |
| Deploy all three contracts to testnet, verify on block explorer | Jash | 07 Section 13 |

**Exit Criteria (this is the Phase 2 "walking skeleton" demo):**
- [ ] A project can be registered live through the UI, confirmed on-chain, visible in the dashboard
- [ ] A clean, engineered evidence bundle can be submitted through the UI across 3+ source types
- [ ] Merkle root + integrity checks visibly pass in the UI
- [ ] Confidence score returns ≥ the auto-approve threshold with a correct, specific `reason` string
- [ ] A credit is automatically minted with **no manual step**, visible on-chain and in the UI
- [ ] Contracts are deployed and verified on the public testnet

**Tests:**
- Contracts: Foundry tests for `mintCredit()` — succeeds only when all three policy conditions hold; reverts individually for each missing condition (09 Section 12)
- Contracts: fuzz test on `mintCredit()` policy-condition combinations (09 Section 12)
- Backend: integration test of the full `evidence/submit → validation/run → risk/analyze → mint` chain against the clean demo bundle
- ML: TC1 (clean bundle → `auto_approve`) and TC9 (determinism) from 10 Section 16
- End-to-end: one full live run of Flow 4 (Product Spec Section 6 workflow, stages 1–6) with no manual intervention

---

## 7. Phase 3 — Verification, Issuance & Lifecycle (Hour 18–26)

**Goal:** The anomalous/escalation path (Flow 5) works end-to-end, plus transfer, retirement, and duplicate-issuance/reuse prevention — this phase completes every P0 item in Scope Spec Section 3 (MVP Definition items 6–10).

| Task | Owner | Spec Reference |
|---|---|---|
| Implement `recordVerification()`, verifier allow-list (`addVerifier`/`removeVerifier`) | Jash | 09 Sections 5, 8 |
| Implement `transferCredit()`, `retireCredit()` with full status-guard checks | Jash | 09 Section 5 |
| Foundry tests: duplicate-mint revert, transfer/retire owner + status guards (09 Section 12) | Jash | 09 Section 12 |
| Implement `GET /verifications`, `GET /verifications/:id`, `POST /verifications/:id/{approve,reject,request-more-evidence}` | Dax | 11 Section 7 |
| Implement escalation branch: on `recommendation: escalate`, create Verification Queue entry instead of minting | Dax | 11 Section 6 |
| Implement `POST /credits/:id/transfer`, `POST /credits/:id/retire`, `GET /credits`, `GET /credits/:id` | Dax | 11 Section 8 |
| Confirm ML engine reliably escalates the anomalous demo bundle with a specific, correct reason (e.g., naming the exact deviation %) | Siddhant | 10 Sections 11, 16 (TC2) |
| Add TC3–TC8 test bundles (missing source, tampered/excluded item, timestamp-outside-period, duplicate hash, service-unavailable, fallback) | Siddhant | 10 Section 16 |
| Build Verification Queue screen (list + click-through to decision) | Hilag | 06 Section 3 |
| Wire Validation & Risk Result screen's verifier-acting view (approve/reject/request-more-evidence, each requiring a reason) | Hilag | 06 Section 3 |
| Build Credit Wallet screen (owned credits, transfer/retire actions + confirmation modals) | Hilag | 06 Section 3 |
| Wire transfer/retire to submit owner-signed `onChainCallData` directly via connected wallet | Hilag | 11 Section 1 pattern 2 |

**Exit Criteria:**
- [ ] An engineered anomalous bundle is correctly escalated to the Verification Queue with a specific, correct reason shown in the UI
- [ ] A verifier can approve an escalated bundle from the queue, and the credit is minted afterward with a recorded "manually verified" trail
- [ ] A verifier can reject a bundle, and no credit is minted; `mintCredit()` reverts with `VerificationNotApproved` if attempted
- [ ] A second mint attempt against the same bundle is rejected on-chain (`BundleAlreadyIssued`), demonstrated live
- [ ] An issued credit can be transferred to a second wallet, visible on-chain and in both wallets' UI
- [ ] A retired credit rejects any further transfer or re-issuance attempt, demonstrated live

**Tests:**
- Contracts: full invariant test — no `bundleId` ever backs more than one minted credit across arbitrary call sequences (09 Section 12)
- Contracts: access-control tests — non-verifier cannot call `recordVerification`, non-owner cannot transfer/retire (09 Section 12)
- ML: TC2–TC8 from 10 Section 16
- Integration: full escalation path (register → commit → escalate → verifier approves → mint → transfer → retire), and full rejection path (escalate → verifier rejects → confirm `mintCredit()` reverts), per 09 Section 12 "Integration tests"
- End-to-end: this phase's exit criteria **are** MVP Definition items 6–10 (Scope Spec Section 3) — each must be shown live, not just unit-tested

---

## 8. Phase 4 — Audit Trail, Dispute & UI Polish (Hour 26–31)

**Goal:** The closing demo screen (audit trail) is complete and credible, the P1 dispute path exists, and the four demo-critical screens (06_UI_UX_SPECIFICATION Section 9) get the polish pass judges will actually see.

| Task | Owner | Spec Reference |
|---|---|---|
| Implement `disputeCredit()`, `resolveDispute()` | Jash | 09 Section 5 |
| Foundry tests: dispute → uphold → revoked; dispute → reject → reverts to prior status | Jash | 09 Section 12 |
| Implement `POST /credits/:id/dispute`, `POST /credits/:id/resolve-dispute` | Dax | 11 Section 8 |
| Implement `GET /projects/:id/audit`, `GET /credits/:id/audit` (merge `lifecycle_events` with live on-chain state) | Dax | 11 Section 9, 08 Section 11 |
| Verify reconciliation job catches any events missed by the live listener | Dax | 11 Section 12 |
| Build Credit Detail / Audit Trail screen: vertical timeline, expandable steps, real tx hashes | Hilag | 06 Section 3 |
| Build dispute UI (verifier/regulator initiate, admin resolve) with consequence-stating confirmation modal | Hilag | 06 Section 4 |
| Polish pass on the 4 demo-critical screens specifically: Evidence Submission, Validation & Risk Result, Verification Queue, Credit Detail/Audit Trail | Hilag | 06 Section 9 |
| Apply Status Badge consistency check — every status renders identically everywhere it appears | Hilag | 06 Section 5 |
| Confirm accessibility basics: color+text/icon on badges, keyboard reachability of primary actions | Hilag | 06 Section 8 |

**Exit Criteria:**
- [ ] Full lifecycle of a credit (registration → evidence → validation → verification → issuance → transfer → retirement) pulls up from a single project **or** credit ID query
- [ ] A dispute can be filed, frozen (no transfer/retire while disputed), and resolved (upheld → revoked, or rejected → reverts)
- [ ] All 4 demo-critical screens match their 06_UI_UX_SPECIFICATION component/state requirements, not just a rough approximation
- [ ] No status renders with inconsistent color/label across screens

**Tests:**
- Contracts: dispute/resolve-dispute unit tests (09 Section 12)
- Integration: audit trail query returns identical, complete data whether searched by project ID or credit ID
- Manual: click through all four demo-critical screens against both the clean and anomalous demo bundles, confirming visual correctness against 06 Section 3's stated components/states/errors for each screen
- Regression: re-run Phase 2 and Phase 3 exit-criteria demos in full to confirm nothing broke during this phase's changes

---

## 9. Phase 5 — Hardening, Testing & Demo Rehearsal (Hour 31–36)

**Goal:** MVP Definition item 12 (Scope Spec Section 3) — the entire flow runs end-to-end live, without a fallback video, at least once before demo day — is satisfied, and the team has a rehearsed, timed run-through plus a working offline fallback.

| Task | Owner |
|---|---|
| Run full Foundry test suite (unit + fuzz + invariant + integration, 09 Section 12) and fix any failures | Jash |
| Confirm local Anvil fallback chain deploys and behaves identically to testnet, per 07 Section 13's stated fallback plan | Jash |
| Run full backend integration test suite against both demo bundles; verify failure-handling paths (07 Section 9) behave as specified, not silently | Dax |
| Verify reconciliation job / event listener recovers correctly from a simulated dropped connection | Dax |
| Final ML determinism + latency check (P95 < 2s, 10 Section 15) under demo-like conditions | Siddhant |
| Freeze the exact seed values for the clean and anomalous demo bundles (no further tuning after this point) | Siddhant |
| Full manual walkthrough of the Product Spec Section 14 demo story, timed | Hilag (drives UI) + all (present) |
| Fix any last visual bugs found during rehearsal — **no new features**, per scope freeze | Hilag |
| Record a pre-recorded fallback run-through video (Product Spec Section 12 risk mitigation) | All |
| Prepare the block-explorer links, contract addresses, and a one-slide patent-to-MVP module mapping for the pitch (Constitution Section 9 table) | All |

**Exit Criteria (final MVP Definition checklist, Scope Spec Section 3 — every item must be checked):**
- [ ] 1. Project registers through UI, appears on-chain with persistent ID
- [ ] 2. Evidence from 3+ source types submits against a registered project
- [ ] 3. Merkle root computed and stored, visible in UI/API
- [ ] 4. At least one integrity-check failure demonstrable on a tampered payload
- [ ] 5. Confidence score + reason shown for both a clean and an anomalous bundle
- [ ] 6. Clean bundle → automatic issuance, no human step
- [ ] 7. Anomalous bundle → verifier screen → human decision gates issuance
- [ ] 8. Second mint against the same bundle is rejected on-chain
- [ ] 9. Credit transfers to a second wallet, visible on-chain and in UI
- [ ] 10. Retired credit rejects further transfer/re-issuance, on-chain
- [ ] 11. Full lifecycle pulls up from one query/screen
- [ ] 12. **Entire flow runs live, end-to-end, at least once, with no fallback video needed**

**Tests:**
- Full regression of every "Tests" list from Phases 1–4, run back-to-back without resets, simulating the actual demo sequence
- At least two full timed dry-runs of the Product Spec Section 14 demo story, by two different people driving the UI, to confirm the flow isn't dependent on one person's muscle memory
- Network-failure drill: disconnect and reconnect mid-flow once, confirm the UI's retry-able error states (07 Section 9) behave correctly rather than corrupting state

---

## 10. Cross-Phase Testing Matrix

| Test Type | Owner | Runs |
|---|---|---|
| Contract unit tests | Jash | Continuously from Phase 1 onward; full suite gated at end of Phases 2, 3, 4, 5 |
| Contract fuzz/invariant tests | Jash | From Phase 2 onward (once `mintCredit` exists); mandatory before Phase 5 exit |
| Backend endpoint tests | Dax | Continuously from Phase 1 onward |
| Backend integration tests (multi-step chains) | Dax | From Phase 2 onward |
| ML test cases (TC1–TC10) | Siddhant | TC1/TC2 from Phase 1; full set by end of Phase 3 |
| Frontend manual click-through | Hilag | End of every phase, against that phase's exit criteria |
| Full end-to-end live run | All | End of Phase 2 (clean path only), end of Phase 3 (both paths), end of Phase 5 (full story, twice) |

## 11. Definition of Done — Mapped to MVP Definition

| Scope Spec Section 3 Item | Delivered By | Verified By |
|---|---|---|
| 1. Project registration | Phase 2 | Phase 2 exit criteria |
| 2. Multi-source evidence submission | Phase 2 | Phase 2 exit criteria |
| 3. Merkle root hashing | Phase 2 | Phase 2 exit criteria |
| 4. Integrity failure demonstrable | Phase 3 (TC6 duplicate-hash / tampered-payload case) | Phase 3 tests |
| 5. Confidence score + reason (clean & anomalous) | Phase 2 (clean), Phase 3 (anomalous) | Phase 2/3 exit criteria |
| 6. Auto-issuance, clean bundle | Phase 2 | Phase 2 exit criteria |
| 7. Escalation + verifier decision gates issuance | Phase 3 | Phase 3 exit criteria |
| 8. Duplicate-issuance prevention | Phase 3 | Phase 3 exit criteria + invariant test |
| 9. Transfer | Phase 3 | Phase 3 exit criteria |
| 10. Retirement + enforced non-reuse | Phase 3 | Phase 3 exit criteria |
| 11. Single-query lifecycle trail | Phase 4 | Phase 4 exit criteria |
| 12. Full live end-to-end run, no fallback needed | Phase 5 | Phase 5 exit criteria (two dry runs) |

## 12. Risk Register & Contingencies

| Risk | Trigger Point | Contingency | Cut-List Order (if a P0 item is at risk at Hour 12) |
|---|---|---|---|
| ML model overfits/misbehaves on small seeded dataset | Phase 1–2 tuning | Fall back to rule-based-only scoring (10 Section 13) for the demo if the model isn't separating the two demo bundles reliably by Hour 18 | — |
| Contract/backend/ML integration is the critical path | Phase 2 | Phase 2's sole goal is proving this integration on the clean path first, in isolation, before adding the escalation branch | 1. Cut P2 items (UI animation polish, multiple seeded project "stories", role-based views) |
| Demo-day network/wallet issues | Phase 5 | Local Anvil fallback chain (07 Section 13) rehearsed once during Phase 5; pre-recorded fallback video prepared | 2. Cut P1 dispute/revocation path (Phase 4) — MVP Definition does not require it, only Section 3's 12 items do |
| Scope creep toward full patent architecture | Any phase | Constitution Section 9's reduced-module mapping is the only architecture in scope; anything not in Scope Spec Section 4 requires a logged update to that document before any code is written (Scope Spec Section 9) | 3. Cut P1 signature/hash tamper-detection *UI* polish (keep the underlying check, simplify its on-screen presentation) |
| A P0 item is genuinely behind at Hour 12 | Hour 12 checkpoint | Apply the cut-list at left, in order, starting from P2 | — |

## 13. Demo Day Runbook

Sequence matches Product Spec Section 14 exactly; this section only adds who is driving each beat and which roadmap phase proves it works.

| Beat | Driven By | Proven By |
|---|---|---|
| 1. Set the stakes (30s) — reference the patent | Presenter (any) | — |
| 2. Register project + submit evidence (live) | Hilag (UI) | Phase 2 |
| 3. Show validation — Merkle proof, confidence score + reason | Hilag (UI), narrated by Siddhant for the ML explanation | Phase 2 (clean), Phase 3 (anomalous) |
| 4. Branch: clean bundle auto-issues, anomalous bundle escalates to verifier | Hilag (UI), Jash narrates the on-chain policy check | Phase 3 |
| 5. Issue, transfer, retire; attempt reuse and show on-chain rejection | Hilag (UI) | Phase 3 |
| 6. Close on the audit trail, tie back to the patent | Hilag (UI), Dax narrates the lifecycle-event architecture | Phase 4 |

Fallback: if live network fails at any beat, switch immediately to the Phase 5 pre-recorded run-through rather than attempting to debug live.
