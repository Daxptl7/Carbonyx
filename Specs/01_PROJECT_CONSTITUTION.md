# Project Constitution
## Verifiable Carbon Credit & Offset Tracking System

## 1. Project Identity
- Hackathon: HackOut'26
- Problem Statement: Verifiable Carbon Credit & Offset Tracking System (Theme: Circular Carbon Ecosystem)
- Team: Jash Bohare (Blockchain/Smart Contracts), Dax (Full-Stack + AI/ML), Siddhant (AI/ML), Hilag (MERN Stack)
- Hackathon Duration: 36 hours
- Development Approach: Spec-first, AI-agent-assisted coding. No code is written before the relevant spec exists and is agreed on.
- Repository: TBD — mono-repo with `/contracts`, `/backend`, `/ml-engine`, `/frontend`, `/specs`

## 2. Product Vision

Existing blockchain-based carbon registries make credit *records* transparent, but they do not verify the *environmental evidence* behind a credit before it is minted — they secure data only after submission. This system flips that order: it validates environmental evidence from multiple independent sources, computes a confidence/risk score, routes low-confidence or anomalous claims to a verifier, and only then allows a smart contract to mint a carbon credit. Every step — evidence submission, validation, verification decision, issuance, transfer, and retirement — is recorded immutably on-chain, producing a carbon credit that is provably backed by validated evidence rather than institutional trust alone.

## 3. Core Problem

Carbon credit markets suffer from double-counting, opaque issuance, and weak verification because centralized registries rely on manually submitted, self-reported project data that is trusted retroactively rather than verified before a credit is created. Blockchain registries that exist today only make the *paper trail* immutable — they don't check whether the underlying evidence is real, consistent, or anomalous before issuing a credit.

## 4. Core Principle

Evidence must be validated before a carbon credit can be issued.

## 5. Product North Star

A carbon credit that cannot be minted unless independently corroborated, anomaly-checked evidence backs it — and cannot be duplicated, forged, or silently retired once it is.

## 6. Hackathon Success Criteria

The prototype must demonstrate:

1. Project registration
2. Evidence submission
3. Evidence integrity verification
4. Multi-source validation
5. Risk/confidence assessment
6. Verification decision
7. Smart-contract-controlled issuance
8. Credit ownership transfer
9. Credit retirement
10. Immutable/auditable lifecycle trail

## 7. Non-Negotiable Constraints

- 36-hour hackathon
- Prototype, not production carbon registry
- No feature may be added without updating scope
- Every major claim must be demonstrable in the UI
- Blockchain must enforce actual business rules (not just log events after the fact)
- AI must produce an explainable result (a confidence score with a reason, not a black-box yes/no)
- Demo must work end-to-end with seeded/sample data
- Every module built must map to a named module in the patent architecture — no scope drift into unrelated features
- Judging-day priority: a working end-to-end flow beats a partially-built full architecture

## 8. Out of Scope

Explicitly exclude:

- Full KYC infrastructure
- Real-world carbon-market regulatory certification
- Production DID infrastructure
- Real verifier marketplace
- Real verifier staking economy
- Insurance integrations
- Real escrow settlement
- Cross-registry interoperability
- ZK proofs
- Full satellite infrastructure
- Production IoT hardware
- Full DAO governance
- Production-grade carbon accounting methodology

## 9. Architecture Rule

The patent is the architectural reference.
The hackathon MVP is a reduced implementation of that architecture.

Reduced module mapping (patent module → MVP implementation):
- Project Registration & DID (102) → simplified project registration (wallet address + project metadata, no real KYC/DID)
- Evidence Acquisition Layer (104A–104D) → seeded/mock multi-source evidence (sensor, satellite, verifier, docs) submitted via API/UI
- Evidence Aggregation & Hashing (106) → backend hashing + Merkle root computation over submitted evidence
- Cryptographic Validation Engine (108) → signature/hash integrity check on evidence payloads
- Multi-Source Correlation, Risk & Anomaly Detection (110) → ML confidence scoring (isolation forest / statistical threshold) across sources
- Protocol-Managed Verifier Assignment (112) + Reputation Ledger (114) → simplified — single mock verifier role, no staking/reputation math
- Smart Contract Policy Engine (116) → on-chain issuance conditions (confidence threshold met + no unresolved flags)
- Blockchain Registry & Issuance Module (118) → ERC-style carbon credit token, minted only via policy engine
- Lifecycle Management (120) → transfer + retire functions, on-chain
- Dispute & Revocation (122) → basic flag/revoke function, simplified governance (single admin/DAO stub, not full DAO)
- Settlement Module (124) → out of scope for MVP

## 10. Source-of-Truth Hierarchy

1. Project Constitution
2. Product Specification
3. Scope Specification
4. Technical Architecture
5. Domain/Contract/API specifications
6. Roadmap
7. Code

When documents conflict, higher-level documents win.

## 11. AI Coding Rules

AI coding agents MUST:
- read relevant specs before implementation
- not invent requirements
- not introduce unnecessary dependencies
- not change architecture without updating specs
- not implement out-of-scope features
- preserve interfaces/contracts defined by specifications
- write tests alongside implementation
- flag ambiguity in a spec rather than silently resolving it with an assumption
- keep every implemented module traceable to a Section 9 mapping entry
