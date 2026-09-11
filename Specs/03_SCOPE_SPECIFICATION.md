# Scope & MVP Specification

## 1. Purpose

Define exactly what will and will not be built during the hackathon.

## 2. Patent-to-MVP Mapping

| Patent Capability | MVP |
|---|---|
| Project Registration/DID | Simplified |
| Evidence Acquisition | Yes |
| Evidence Aggregation | Yes |
| Merkle Root | Yes |
| Cryptographic Validation | Yes |
| Multi-source Correlation | Yes |
| Anomaly Detection | Yes |
| Confidence Score | Yes |
| Protocol Verifier Assignment | Simulated |
| Verifier Reputation/Staking | Out of scope |
| Smart Contract Policy | Yes |
| Credit Issuance | Yes |
| Transfer | Yes |
| Retirement | Yes |
| Dispute | Simplified |
| Revocation | Optional |
| Escrow | Out of scope |
| Insurance | Out of scope |
| ZK Proofs | Out of scope |
| Registry Interoperability | Out of scope |

## 3. MVP Definition

The MVP is complete only when, using seeded/sample data and no manual database edits:

1. A project can be registered through the UI and appears on-chain/in the backend with a persistent project ID.
2. Evidence from at least 3 distinct mock source types (sensor, satellite, verifier attestation) can be submitted against a registered project.
3. Submitted evidence is hashed and a Merkle root is computed and stored, visible in the UI or via API.
4. At least one integrity check (signature or hash mismatch) can be demonstrated failing on a tampered payload.
5. The risk-scoring engine returns a confidence score plus a human-readable reason for at least two distinct scenarios: a clean bundle and an anomalous bundle.
6. A clean, high-confidence bundle results in automatic smart-contract issuance with no human step.
7. An anomalous or low-confidence bundle is routed to a verifier screen, where a human decision (approve/reject) determines whether issuance proceeds.
8. The smart contract refuses to mint a second credit against the same evidence bundle (duplicate-issuance prevention is demonstrable, not just claimed).
9. An issued credit can be transferred to a second wallet, and the transfer is visible on-chain and in the UI.
10. An issued credit can be retired, after which any further transfer or re-issuance attempt against it is rejected on-chain (demonstrable, not just claimed).
11. The full lifecycle of any single credit (registration → evidence → validation → verification → issuance → transfer → retirement) can be pulled up from one query/screen.
12. The entire flow above runs end-to-end live, without needing a fallback video, at least once before demo day.

If items 6–10 are not all demonstrable live, the MVP is not complete — these are the claims the whole pitch rests on.

## 4. In-Scope Features

- Project registration (proponent wallet + project metadata)
- Multi-source evidence submission (seeded/mock sensor, satellite, verifier, documentation data)
- Evidence hashing + Merkle root generation
- Basic cryptographic/hash integrity check
- N-of-M source correlation check
- ML-based anomaly/confidence scoring with explainable output
- Confidence-threshold routing (auto-issue vs. escalate to verifier)
- Single verifier role with approve/reject/request-more-evidence actions
- Smart contract issuance policy enforcing evidence-authenticated + threshold-met conditions
- Duplicate issuance prevention at contract level
- Credit transfer
- Credit retirement with enforced non-reuse
- Basic dispute flag → revoke path (single admin decision, not full governance)
- End-to-end lifecycle audit trail view

## 5. Out-of-Scope Features

- Full KYC / production identity verification
- Production Decentralized Identifier (DID) infrastructure
- Real verifier marketplace, staking economy, or reputation scoring
- Insurance or escrow/settlement integrations
- Zero-knowledge proof implementation
- Cross-registry interoperability bridges
- Live satellite/IoT hardware integration
- Full DAO governance for disputes
- Production-grade carbon accounting/baseline methodology
- Multi-verifier consensus or weighted assignment logic
- Mainnet deployment

## 6. Future Features

(Explicitly framed in the pitch as "patent roadmap," not hackathon deliverables)

- Full DID + KYC onboarding for project proponents
- Verifier staking, reputation ledger, and slashing for misconduct
- Zero-knowledge selective disclosure of sensitive project data
- Real satellite/remote-sensing and IoT sensor integrations
- Interoperability bridge with Verra/Gold Standard-style legacy registries
- Insurance-backed escrow settlement for disputed credits
- Full DAO-based governance for dispute adjudication

## 7. Demo-Only Simulation

Real-world components that are simulated for the demo, and must be labeled as such in the pitch:

- **Sensor/field evidence** — synthetic readings generated to represent tamper-evident device output, not real hardware
- **Satellite/remote-sensing evidence** — mocked imagery metadata/change-detection reports, not a live provider API
- **Verifier** — a single demo account playing the verifier role, not a marketplace of accredited third-party verifiers
- **Carbon projects** — synthetic reforestation/renewable-energy project records, not real registered projects
- **Financial/documentation evidence** — sample project documentation, not real invoices/operational logs

## 8. Feature Priorities

**P0 = must work**
- Project registration
- Evidence submission (3+ source types)
- Merkle root hashing
- Confidence scoring with clean vs. anomalous demo cases
- Smart-contract issuance gated on confidence threshold
- Duplicate issuance prevention
- Transfer
- Retirement with enforced non-reuse
- End-to-end lifecycle view

**P1 = should work**
- Manual verifier approve/reject screen for escalated cases
- Signature/hash tamper-detection demo case
- Dispute flag → revoke path

**P2 = nice to have**
- Polished UI animations/visualizations for confidence scoring
- Multiple seeded project "stories" to demo different outcomes
- Basic role-based views (issuer vs. buyer vs. verifier vs. regulator)

**P3 = do not build during hackathon**
- Everything listed in Section 5 (Out-of-Scope) and Section 6 (Future Features)

## 9. Scope Freeze Rules

- Scope freezes at the **12-hour mark**: no new P0/P1 features may be added after this point, only bugfixes and polish on what's already defined.
- Any feature not listed in Section 4 (In-Scope) requires an explicit, logged update to this document before any code is written for it — no silent scope additions by any team member or AI coding agent.
- If a P0 item is at risk by the freeze point, the response is to cut a P1/P2 item to protect it — P0 items are never dropped in favor of new ideas.
- Any deviation from this document must be reflected here first; code that contradicts this document is treated as a bug, not a new feature.
