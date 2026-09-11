# Scope & MVP Specification

## 1. Purpose

Define the exact hackathon deliverables for the 36-hour build, harmonizing the 12-module Process Patent architecture with a reliable, live-demoable product.

## 2. Patent-to-MVP Mapping

| Patent Capability | Patent Module | Hackathon MVP Scope | Implementation Level |
|---|---|---|---|
| Project Registration & DID | Module 102 | Deterministic `did:carbonyx:0x...` + KYC badge | P1 (In-Scope) |
| Baseline Challenge Period | Module 102 | Challenge window timer + dispute trigger | P2 (In-Scope) |
| Evidence Acquisition | Module 104 | Seeded IoT, Satellite, and Doc Ingestion | P0 (In-Scope) |
| Merkle Aggregation & Hashing | Module 106 | `bytes32 merkleRoot` tree construction | P0 (In-Scope) |
| Cryptographic Integrity | Module 108 | Digital signature & hash verification | P0 (In-Scope) |
| Multi-Source Correlation | Module 110 | N-of-M source agreement check | P0 (In-Scope) |
| AI Anomaly & Risk Scoring | Module 110 | Isolation Forest + Z-score + Plain-text XAI | P0 (In-Scope) |
| Verifier Pool & Routing | Module 112 | Active pool registry & assignment logic | P1 (In-Scope) |
| Verifier Staking & Slashing | Module 114 | `stake()`, `reputation`, 50% slashing on fraud | P1 (In-Scope) |
| Smart Contract Minting Gate | Module 116 | Boolean policy preconditions in Solidity | P0 (In-Scope) |
| Dynamic Carbon Credit NFT | Module 118 | ERC-721 token with dynamic on-chain metadata | P0 (In-Scope) |
| Lifecycle Management | Module 120 | State machine: Mint → Escrow → Transfer → Retire | P0 (In-Scope) |
| Dispute & Revocation | Module 122 | Arbiter dispute resolution & NFT revocation | P1 (In-Scope) |
| Escrow Settlement | Module 124 | `buyWithEscrow()`, `release()`, `refund()` | P1 (In-Scope) |
| ZK Proofs | Module 106 | Out of scope (Merkle proofs used) | Out of Scope |
| Legacy Registry Bridge | - | Out of scope (Roadmap item) | Out of Scope |

## 3. Feature Priorities

### P0 (Critical - Core Path)
- Project Registration with owner wallet
- Multi-source evidence ingestion (IoT sensor, Satellite, Documentation)
- Cryptographic signature check & Merkle root calculation
- AI Anomaly scoring with clean vs. anomalous demo scenarios
- Smart-contract-gated ERC-721 NFT minting
- Direct NFT transfer & permanent retirement burn
- End-to-end cryptographic audit trail explorer

### P1 (High Priority - Patent Differentiators)
- Decentralized Identifier (`did:carbonyx:0x...`) & KYC Attestation Badge
- Verifier Staking Ledger (`stake()`, reputation score, 50% slashing on revocation)
- Verifier Review Dashboard for escalated low-confidence bundles
- Marketplace Trading Suite with Escrow Settlement (`buyWithEscrow`, `releaseEscrow`, `refundEscrow`)
- Dispute trigger and smart contract revocation with stake penalty

### P2 (Polish & Demo Enhancement)
- Interactive dynamic NFT Certificate card preview (SVG/Canvas)
- Baseline challenge window countdown timer
- Seeded interactive fraud demonstration story (Clean Path vs. Fraud Prevention Path)

## 4. Scope Freeze Rules
- Scope is frozen strictly to P0 + P1 + P2 items above.
- No new features outside of these specifications may be added during the 36-hour sprint.
