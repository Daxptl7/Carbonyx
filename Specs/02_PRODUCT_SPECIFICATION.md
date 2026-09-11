# Product & Business Specification

## 1. Executive Summary

This system is an evidence-first carbon credit verification and lifecycle platform. Instead of trusting self-reported project data and tokenizing it after the fact — which is what every existing blockchain carbon registry does — it requires environmental evidence from multiple independent sources to be aggregated, cryptographically authenticated, and risk/anomaly-scored *before* a smart contract is permitted to mint a credit. Once issued, the credit's entire lifecycle (transfer, retirement, dispute, revocation) is enforced and recorded on-chain, closing the two biggest holes in current carbon markets: unverifiable claims at issuance, and double-counting after issuance.

## 2. Problem Statement

### Current Problem
Carbon credit issuance today depends on centralized registries (Verra, Gold Standard, etc.) that accept project-generated, self-reported monitoring data, verify it periodically and manually through accredited third-party bodies, and issue credits based on institutional trust rather than continuously validated evidence. Even blockchain-based registries (IBM/Energy Blockchain Labs, Northern Trust, JPMorgan Kinexys) only make the *ledger record* immutable — they do not verify the authenticity of the evidence before it's recorded.

### Why Current Systems Fail
- Single-source, self-reported evidence with no cross-validation
- Verification is periodic and retrospective, not continuous
- Baselines and additionality claims are estimated, not evidence-backed
- Fragmented, non-interoperable registries make duplicate issuance and duplicate retirement hard to catch
- Verifiers are project-hired, creating conflict-of-interest risk
- Blockchain, where used, secures the record — not the truth of what's being recorded

### Consequences
- Inflated or fraudulent carbon credits enter the market
- Corporate buyers purchase offsets that don't represent real emission reductions
- Regulators and auditors have no reliable way to trace a credit back to verifiable evidence
- Trust in voluntary carbon markets erodes, slowing climate finance

## 3. Target Users

### Carbon Project Issuer
- **Goals:** Get legitimate emission-reduction work verified and monetized as tradeable credits, quickly and credibly.
- **Problems:** Slow, opaque, manual verification cycles; no way to prove evidence integrity to skeptical buyers.
- **Actions:** Registers project, submits evidence from multiple sources, tracks verification status, receives issued credits.

### Corporate Buyer
- **Goals:** Purchase credits that will hold up to scrutiny (internal ESG audit, regulator, public claims).
- **Problems:** Can't currently tell a rigorously verified credit from a rubber-stamped one; reputational risk from buying low-integrity offsets.
- **Actions:** Browses/purchases credits, inspects full evidence + verification trail before buying, retires credits against their own emissions.

### Auditor / Verifier
- **Goals:** Efficiently verify only the projects that actually need human judgment; trust the evidence they're shown.
- **Problems:** Currently review everything manually with no pre-filtering; no cryptographic guarantee the evidence hasn't been altered.
- **Actions:** Receives pre-screened, anomaly-flagged submissions; approves, rejects, or requests field verification; decision is permanently and transparently recorded.

### Regulator
- **Goals:** Oversee market integrity, catch fraud, ensure credits map to real reductions.
- **Problems:** No unified, auditable view across fragmented registries; double-counting and duplicate retirement are hard to detect after the fact.
- **Actions:** Queries the immutable ledger for full lifecycle history of any credit; investigates disputes and anomaly flags.

## 4. Product Vision

A carbon credit registry where trust is earned cryptographically and statistically before issuance — not asserted institutionally after the fact.

## 5. Product Value Proposition

For carbon markets that are losing credibility to fraud and double-counting, this platform is an evidence-first issuance and lifecycle system that validates environmental claims from multiple independent sources and flags anomalies *before* a credit can exist — unlike existing blockchain registries, which only make already-submitted, unverified data immutable.

## 6. Core Product Workflow

Project
→ Evidence
→ Validation
→ Risk Assessment
→ Verification
→ Issuance
→ Transfer
→ Retirement

## 7. Core Product Capabilities

### Project Registration
Project proponent registers a project (identifier, type, location, proponent wallet) — the anchor for all subsequent evidence and credits.

### Evidence Submission
Evidence is submitted from multiple independent mock source types (sensor/field, satellite/remote-sensing, verifier attestation, project documentation) against a registered project.

### Evidence Validation
Submitted evidence is hashed (Merkle root) and integrity-checked (signature/hash match) — tamper-evident before it's ever evaluated.

### Multi-source Correlation
The system checks whether enough independent source types corroborate the same claim (N-of-M rule) before treating the evidence as credible.

### Risk Scoring
An ML model scores the evidence bundle for anomalies/inconsistencies and produces a confidence score with a human-readable reason — not a black-box pass/fail.

### Human Verification
Evidence below the confidence threshold, or flagged as anomalous, routes to a verifier role for manual approve/reject/request-more-evidence.

### Credit Issuance
A smart contract mints a credit only if: evidence is authenticated, correlation threshold is met, and (where triggered) verifier approval is recorded on-chain. Duplicate issuance for the same evidence bundle is blocked at the contract level.

### Ownership Transfer
Issued credits can be transferred between wallets, recorded immutably.

### Retirement
Credits can be permanently retired (burned/flagged non-transferable); once retired, no further transfer or reuse is possible — enforced on-chain, not just by convention.

### Audit Trail
Every state change (registration, evidence submission, validation, verification decision, issuance, transfer, retirement, dispute) is queryable end-to-end from a single credit ID.

## 8. Differentiation

Why this is not merely "carbon credits on blockchain":

Nearly every blockchain carbon project (IFC/Chia, IBM/Energy Blockchain Labs, Northern Trust, JPMorgan Kinexys) tokenizes a credit **after** a centralized, off-chain MRV process has already decided it's legitimate — the blockchain's job starts *after* trust has already been established elsewhere. This system moves multi-source evidence validation, anomaly detection, and a confidence threshold **in front of** issuance, and lets the smart contract itself enforce that threshold as a minting condition. The chain isn't just a record of a decision made elsewhere — it's part of how the decision gets made and can never be un-made.

## 9. User Outcomes

- Issuers get faster, more credible verification for legitimate projects, and pre-screening that reduces reviewer backlog.
- Buyers can inspect a credit's full evidence-to-issuance trail before purchase, reducing reputational and compliance risk.
- Verifiers spend their attention only where it's needed — low-confidence or anomalous submissions — instead of reviewing everything uniformly.
- Regulators get a single, queryable, tamper-proof source of truth instead of reconciling fragmented registries.

## 10. Success Metrics

- % of evidence sources successfully validated (hash/signature integrity pass rate)
- number of anomalous/inconsistent submissions correctly flagged before issuance
- successful prevention of duplicate issuance for the same evidence bundle (0 duplicates allowed through in demo)
- successful prevention of transfer/reuse after retirement (0 allowed through in demo)
- complete, single-query lifecycle traceability for any issued credit (registration → evidence → verification → issuance → transfer → retirement)

## 11. Assumptions

- Evidence sources (sensor, satellite, verifier, docs) are simulated/seeded for the demo, not live integrations
- A single verifier role stands in for a full verifier marketplace
- Testnet deployment (e.g., Sepolia/Base Sepolia) is sufficient; no mainnet requirement
- Judges evaluate on demonstrated end-to-end flow and technical depth, not regulatory completeness

## 12. Risks

- Scope creep toward full patent architecture within a 36-hour window
- ML anomaly model overfitting to a small seeded dataset — mitigate by using clearly-engineered anomalous vs. clean sample sets for the demo
- Smart contract / backend / ML integration surface being the critical path — mitigate by defining and freezing interfaces early (see Technical Architecture spec)
- Demo-day network or wallet issues — mitigate with a pre-recorded fallback run-through

## 13. Constraints

Same as Project Constitution, Sections 7–8 (non-negotiable constraints and out-of-scope list govern this specification).

## 14. Hackathon Demo Story

1. **Set the stakes (30s):** "Carbon markets lose credibility to fraud and double-counting because blockchain registries only make already-unverified data immutable." Reference the patent as the research behind this build.
2. **Register a project + submit evidence (live):** Register a reforestation/renewable project, submit evidence from 3–4 mock sources through the UI.
3. **Show validation happening (live):** Hashing/Merkle proof confirmation, then the risk-scoring engine producing a confidence score with a visible reason.
4. **Branch the story:** Run one *clean* evidence bundle that sails through to auto-issuance, and one *anomalous* bundle that gets flagged and routed to the verifier screen — this is the moment that proves the "evidence-first" claim, not just a pass-through mint button.
5. **Issue, transfer, retire (live):** Mint the credit, transfer it to a "buyer" wallet, retire it, then attempt to transfer/re-issue against the same retired credit or evidence bundle and show it get rejected on-chain.
6. **Close on the audit trail:** Pull up the full lifecycle of the issued credit in one view — registration → evidence → validation → verification → issuance → transfer → retirement — and tie it back to the filed patent as proof this isn't a hackathon-invented idea but real, protected research being demonstrated live.
