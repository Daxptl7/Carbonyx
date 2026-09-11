# User Personas & Use Cases

## Persona 1 — Project Proponent (Issuer)
- **Role:** Carbon reduction / removal project developer (e.g., Reforestation, Methane Capture).
- **Goals:** Register project, generate DID, submit multi-source evidence, receive tradeable ERC-721 NFT credits upon automated verification, receive payout upon escrow clearance.
- **Key Actions:**
  1. Connect wallet & generate `did:carbonyx:0x...`.
  2. Complete simulated KYC attestation.
  3. Upload telemetry bundle (IoT sensor, Sentinel-2 satellite biomass data, audit report).
  4. Track evidence validation, Merkle root, and AI confidence score.
  5. List verified credits on the Carbonyx Marketplace.

## Persona 2 — Independent Verifier
- **Role:** Third-party environmental auditor / carbon methodology expert.
- **Goals:** Deposit stake into the protocol to earn audit fees, review escalated (low-confidence) project bundles, maintain high reputation, avoid stake slashing.
- **Key Actions:**
  1. Deposit collateral into `VerifierStakingLedger` contract (`stake() >= MIN_STAKE`).
  2. View assigned escalated bundles flagged by the AI engine.
  3. Inspect sensor vs. satellite discrepancy diffs.
  4. Submit cryptographic `approve` or `reject` verification decision on-chain.
  5. Monitor reputation score and earned yields.

## Persona 3 — Corporate ESG Buyer
- **Role:** Enterprise sustainability officer purchasing verified carbon credits to meet net-zero targets.
- **Goals:** Browse verified carbon credits on marketplace, purchase with escrow protection, hold dynamic NFT assets, permanently retire credits and generate tamper-proof offset certificates.
- **Key Actions:**
  1. Browse marketplace listings filtered by project type, vintage, and confidence rating.
  2. Purchase credits using `buyWithEscrow()`.
  3. View interactive digital NFT Certificate with direct Merkle proof link.
  4. Execute on-chain `retireCredit()` to burn NFT and claim verifiable ESG offset.

## Persona 4 — Regulator & Independent Auditor
- **Role:** Carbon market regulator, international compliance auditor (e.g. Article 6 supervisor).
- **Goals:** Verify authenticity of any credit, detect double-counting, review dispute history, audit verifier slashing actions.
- **Key Actions:**
  1. Query any `tokenId` or `projectId` to view full provenance timeline.
  2. Verify cryptographic inclusion proof against on-chain Merkle root.
  3. Inspect verifier staking and penalty logs.
  4. Review and arbitrate contested credit disputes.
