# Product & Business Specification

## 1. Executive Summary

Carbonyx is a patented, evidence-first carbon credit verification, issuance, and lifecycle tracking protocol. Instead of trusting self-reported project documentation and tokenizing unverified claims after the fact — which is the root cause of phantom carbon credits and market collapse — Carbonyx enforces multi-source cryptographic evidence corroboration and AI anomaly detection *before* a smart contract can mint an ERC-721 Carbon Credit NFT.

Furthermore, Carbonyx introduces an economic accountability layer: independent verifiers must lock collateral into a Staking Ledger (subject to slashing on fraud), and credit trading operates via an Escrow Settlement Contract that protects buyers from fraudulent or revoked credits.

## 2. Market Problem & Pain Points

1. **Phantom Credits & Over-Crediting:** Projects claim carbon absorption (e.g. 10,000 tCO2e) that contradicts independent satellite remote sensing.
2. **Double-Counting & Re-Selling:** The same carbon reduction event is sold across multiple registries or re-issued after retirement.
3. **Lack of Economic Penalties for Corrupt/Lazy Verifiers:** Centralized auditing bodies face zero financial downside if they approve fraudulent project baselines.
4. **Buyer Insecurity:** Corporate ESG buyers have no recourse if purchased credits are later exposed as fraudulent and revoked.

## 3. The Carbonyx Solution Architecture

```
[IoT Sensors + Satellites + Docs]
              │
              ▼
    [106. Merkle Aggregation & Hash Engine]
              │
              ▼
    [110. AI Anomaly & Correlation Engine]
              │
        ┌─────┴─────────────────────────┐
        │                               │
  Confidence >= 85%               Confidence < 85%
        │                               │
        │                               ▼
        │                 [112. Verifier Staking Pool]
        │                 [114. Collateral & Reputation]
        │                               │
        │                     Verifier Approves / Rejects
        │                               │
        └───────────────┬───────────────┘
                        ▼
    [116. Smart Contract Policy Gates]
                        │
                        ▼
    [118. Dynamic ERC-721 NFT Minting]
                        │
                        ▼
    [124. Marketplace & Escrow Settlement]
              │                         │
              ▼                         ▼
    [120. Final Retirement Burn]   [122. Dispute & Stake Slashing]
```

## 4. Key Value Propositions by Stakeholder

### For Project Proponents (Issuers)
- **Instant Credibility:** Issuers with high-integrity sensor and satellite data achieve automated, rapid credit issuance without waiting 6–12 months for manual audit.
- **W3C Decentralized Identity (DID):** Verifiable credentials (`did:carbonyx:0x...`) prove ownership without disclosing confidential commercial agreements.

### For Independent Verifiers
- **Decentralized Staking Pool:** Verifiers deposit collateral into the protocol to earn verification fee yields on reviewed projects.
- **Reputation-Weighted Selection:** Verifiers with high historical accuracy receive priority routing for higher-fee project audits.

### For Corporate Buyers
- **Escrow-Protected Trading:** Payment is held in smart-contract escrow during the dispute window; if a credit is revoked, funds are immediately returned.
- **Dynamic NFT Certificate:** Interactive ERC-721 token linking directly to the on-chain Merkle root and cryptographic evidence tree.
- **Provable Retirement:** Burning an NFT emits an immutable on-chain certificate that cannot be double-claimed.

### For Regulators & Auditors
- **100% Provenance Audit Trail:** Single-click verification of every lifecycle state (Registration → Evidence Ingestion → ML Score → Verifier Signature → Mint → Escrow Trade → Retirement Burn).
- **Economic Slashing Transparency:** Public audit logs of verifier penalties and dispute settlements.

## 5. Revenue & Business Model (Patent Commercialization)

1. **Protocol Issuance Fee:** 1.5% fee on newly minted carbon credit NFTs.
2. **Marketplace Escrow Fee:** 0.5% protocol settlement fee on secondary trades.
3. **Verifier Staking & Slashing Yield:** Staking pool reserves generate protocol liquidity while penalizing malicious actors.
