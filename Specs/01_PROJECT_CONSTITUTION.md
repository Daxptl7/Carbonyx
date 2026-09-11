# Project Constitution
## Verifiable Carbon Credit & Offset Tracking System

## 1. Project Identity
- Hackathon: HackOut'26
- Problem Statement: Verifiable Carbon Credit & Offset Tracking System (Theme: Circular Carbon Ecosystem)
- Team: Jash Bohare (Blockchain / Smart Contracts & Web3), Dax (Full-Stack + AI/ML Integration), Siddhant (AI/ML Engine), Hilag (MERN Stack & UI/UX)
- Hackathon Duration: 36 hours
- Development Approach: Spec-first, AI-agent-assisted coding. No code is written before the relevant spec exists and is agreed upon.
- Repository: Monorepo with `/contracts`, `/backend`, `/ml-engine`, `/frontend`, `/Specs`
- Patent Reference: Process Patent (*"An Automated System and Method for Evidence-First Verification, Issuance, and Lifecycle Management of Carbon Credits Using Blockchain-Based Multi-Source Validation"*)

## 2. Product Vision

Existing blockchain-based carbon registries make credit *records* transparent, but they do not verify the *environmental evidence* behind a credit before it is minted — they secure data only after submission. This system flips that order:
1. It validates environmental evidence from multiple independent sources (IoT sensors, satellite vegetation telemetry, and operational documentation).
2. It generates cryptographic Decentralized Identifiers (DID) and KYC attestations for project proponents (Patent Module 102).
3. It computes an explainable ML anomaly & confidence score (Patent Module 110).
4. It routes low-confidence claims to a protocol-managed Verifier Staking Pool where verifiers put collateral on the line (Patent Modules 112 & 114).
5. A smart contract policy engine gates the issuance of a Dynamic ERC-721 NFT Carbon Credit (Patent Modules 116 & 118).
6. Credits are traded via an Escrow Settlement Contract that protects buyers from fraud (Patent Module 124).
7. If fraudulent credits are revoked during a dispute, buyer funds are refunded and the approving verifier's stake is slashed (Patent Modules 122 & 124).

Every step — evidence submission, validation, verifier staking, issuance, escrow trading, and retirement — is recorded immutably on-chain.

## 3. Core Problem

Carbon credit markets suffer from double-counting, opaque issuance, phantom credits, and weak verification because centralized registries rely on manually submitted, self-reported project data that is trusted retroactively. Blockchain registries that exist today only make the *paper trail* immutable — they do not check whether the underlying evidence is real, consistent, or anomalous before issuing a credit, and lack economic accountability for verifiers.

## 4. Core Principle

Evidence must be cryptographically and algorithmically validated before a carbon credit NFT can be issued, and all participant actions must be economically and immutably accountable.

## 5. Product North Star

A verifiable dynamic carbon credit NFT that cannot be minted unless independently corroborated, anomaly-checked evidence backs it — protected by verifier staking collateral, escrowed trading settlement, and permanent retirement burn proofs.

## 6. Hackathon Success Criteria

The prototype must demonstrate:

1. **Project Registration & DID:** Generation of `did:carbonyx:0x...` with cryptographic KYC attestation badge.
2. **Multi-Source Evidence Ingestion:** Ingestion of sensor, satellite, and documentation payloads.
3. **Evidence Integrity Verification:** Digital signature verification and Merkle tree root commitment.
4. **AI Anomaly & Risk Assessment:** Explainable confidence score with anomaly flags and human-readable reasoning.
5. **Verifier Staking & Pool Management:** Verifiers depositing stake collateral into the on-chain pool with reputation tracking.
6. **Smart-Contract-Gated Issuance:** Dynamic ERC-721 NFT minted only when cryptographic and ML policy gates pass.
7. **Marketplace Trading with Escrow:** Buyers purchasing credits with funds held in on-chain escrow until settlement.
8. **Credit Retirement:** Permanent burning/retirement of NFT with an immutable on-chain Certificate of Retirement.
9. **Dispute Resolution & Stake Slashing:** Escalated dispute upholding fraud, triggering credit revocation, escrow refund, and 50% verifier stake slashing.
10. **Immutable Lifecycle Audit Trail:** Single-view cryptographic provenance from raw sensor data to final retirement.

## 7. Non-Negotiable Constraints

- 36-hour hackathon execution window.
- Prototype with rich demoable realism, adhering strictly to the Process Patent architecture.
- No feature may be added without updating scope in `03_SCOPE_SPECIFICATION.md`.
- Every major claim must be demonstrable in the UI.
- Blockchain smart contracts must enforce actual business rules, staking balances, and escrow states (not just passive event logs).
- AI must produce an explainable result (numeric confidence + plain-language reason + anomaly tags).
- Demo must work end-to-end with pre-seeded test scenarios (Clean Path vs. Fraud Prevention Path).

## 8. Out of Scope

Explicitly excluded for the 36-hour hackathon:

- Full banking/fiat currency payment gateways (simulated with testnet tokens / native ETH).
- Physical deployment of IoT hardware and orbital satellite feeds (seeded with realistic JSON telemetry).
- Legal jurisdiction-specific regulatory certification filings.
- Production-scale multi-million zk-SNARK prover circuits (simulated Merkle proofs used for integrity).
- Cross-chain bridge relays to legacy Web2 registries (Verra / Gold Standard bridges reserved for post-hackathon roadmap).

## 9. Architecture Rule: Patent-to-Implementation Mapping

The Process Patent is the structural architectural reference. All 12 modules map to our implementation:

- **Module 102 (Project Registration & DID):** Wallet authentication, deterministic DID generation (`did:carbonyx:0x...`), KYC attestation signature, and challenge window tracking.
- **Module 104 (Multi-Source Evidence Ingestion):** Ingestion endpoints for IoT sensors, satellite vegetation indices, and operational documentation.
- **Module 106 (Evidence Aggregation & Hashing):** Merkle tree construction and `bytes32 merkleRoot` calculation over evidence items.
- **Module 108 (Cryptographic Validation Engine):** Digital signature verification and cryptographic payload hash validation.
- **Module 110 (Multi-Source Correlation & AI Anomaly Engine):** Isolation Forest / Z-Score anomaly detection, cross-source delta analysis, confidence scoring, and plain-language explanation generation.
- **Module 112 (Protocol-Managed Verifier Assignment):** Active verifier pool selection based on stake weight, reputation, and specialization.
- **Module 114 (Verifier Staking & Reputation Ledger):** On-chain collateral deposit (`stake()`), reputation score tracking, and 50% slashing on fraudulent approval.
- **Module 116 (Smart Contract Policy Engine):** Strict boolean gate checks (`correlationMet`, `confidenceMet`, `verifierApproved`) before minting is unlocked.
- **Module 118 (Dynamic Carbon Credit NFT Issuance):** Dynamic ERC-721 token containing on-chain metadata, vintage year, tonnage, Merkle root, and state machine (`ISSUED`, `ESCROWED`, `TRANSFERRED`, `RETIRED`, `DISPUTED`, `REVOKED`).
- **Module 120 (Lifecycle Management & Audit Trail):** State transition enforcement, immutable event emission, and unified provenance explorer.
- **Module 122 (Dispute & Revocation Module):** Community dispute raising, arbiter review, and permanent credit revocation.
- **Module 124 (Insurance & Escrow Settlement Module):** Buyer funds locked in escrow during trade, released upon confirmation, or refunded to buyer upon dispute revocation with slashed verifier penalty.

## 10. Source-of-Truth Hierarchy

1. Project Constitution (`01`)
2. Product Specification (`02`)
3. Scope Specification (`03`)
4. Technical Architecture (`07`)
5. Smart Contract & Domain & API Specifications (`08`, `09`, `10`, `11`)
6. Roadmap (`12`)
7. Code

When documents conflict, higher-level documents win.

## 11. AI Coding Rules

AI coding agents MUST:
- Read relevant specs before implementation.
- Not invent requirements or drop specified patent modules.
- Preserve interfaces/contracts defined by specifications.
- Write tests alongside implementation (Foundry for Solidity, Pytest for ML, Jest/Supertest for Backend).
- Flag ambiguity in a spec rather than silently resolving it with an assumption.
- Ensure all implemented features trace back to the 12 Patent Modules.
