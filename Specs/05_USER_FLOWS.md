# User Flows

## Flow 1 — Project Registration & DID Generation
**Actor:** Project Proponent (Issuer)
1. Issuer connects wallet on the frontend.
2. System computes deterministic Decentralized Identifier: `did:carbonyx:<keccak256(ownerAddress + projectId)>`.
3. Issuer submits project metadata (name, projectType, location, claimedAnnualTonnage).
4. System generates simulated cryptographic KYC attestation hash signed by authority.
5. Issuer signs transaction `registerProject(projectId, did, kycAttestationHash)` on-chain.
6. Baseline challenge window begins (configurable timer, e.g. 7 days or demo 5 minutes).

## Flow 2 — Multi-Source Evidence Ingestion & Hashing
**Actor:** Issuer / Automated Telemetry Relayer
1. Telemetry payloads uploaded (IoT sensors, Sentinel-2 satellite vegetation indices, operational audit docs).
2. Cryptographic Validation Engine verifies payload signatures and hashes.
3. Backend Evidence Aggregator computes SHA-256 leaf hashes and builds Merkle Tree.
4. Relayer submits `commitEvidenceBundle(bundleId, projectId, merkleRoot)` to `CarbonRegistry.sol`.

## Flow 3 — AI Anomaly Detection & Risk Scoring
**Actor:** AI/ML Service (Automated)
1. ML engine fetches raw evidence bundle.
2. Cross-source correlation check evaluates N-of-M source agreement.
3. Isolation Forest & Z-Score models check for abnormal spikes, sensor-satellite discrepancies, or historical anomalies.
4. Service returns: `confidenceScore` (0–100%), `riskLevel` (LOW / MEDIUM / HIGH), `anomalyFlags`, and human-readable `explanationReason`.
5. If `confidenceScore >= 85%`: Backend records `recordRiskResult(bundleId, confidenceMet=true, verifierRequired=false)`.
6. If `confidenceScore < 85%`: Backend records `recordRiskResult(bundleId, confidenceMet=false, verifierRequired=true)` and triggers Verifier Escalation.

## Flow 4 — Verifier Staking & Pool Review (Low-Confidence Escalation)
**Actor:** Independent Verifier
1. Verifier deposits collateral into `VerifierStakingLedger.sol` via `stake()` (must meet `MIN_STAKE`).
2. Protocol-managed verifier pool assigns escalated bundle to an active staked verifier.
3. Verifier logs into portal, inspects side-by-side evidence diffs and AI anomaly flags.
4. Verifier submits on-chain decision via `recordVerification(bundleId, approved=true|false)`.
5. If approved: Policy engine unlocks minting; verifier earns verification reward and increases reputation score.
6. If rejected: Bundle is permanently blocked from minting.

## Flow 5 — Smart-Contract-Gated Dynamic NFT Minting
**Actor:** Issuer / Relayer
1. Policy engine validates all conditions on-chain:
   - Evidence committed & valid Merkle root exists.
   - `correlationMet == true`.
   - `(confidenceMet == true) OR (verifierRequired == true AND verifierApproved == true)`.
   - `bundleAlreadyMinted == false`.
2. Smart contract calls `CarbonCreditNFT.mintCredit(recipient, projectId, bundleId, tonnage, vintageYear)`.
3. An ERC-721 token is minted with dynamic on-chain metadata linking to the Merkle root.

## Flow 6 — Marketplace Listing & Escrow-Protected Purchase
**Actor:** Buyer & Issuer
1. Issuer lists minted Carbon Credit NFT on the Carbonyx Marketplace with a unit price.
2. Corporate Buyer clicks "Buy with Escrow Protection" and sends funds to `EscrowSettlement.sol`.
3. Funds are locked in escrow (`ESCROW_LOCKED`), and the NFT is held in custodial escrow state.
4. Once the challenge/inspection window clears without dispute, buyer or relayer calls `releaseEscrow()`.
5. Funds are transferred to the Issuer, and the Carbon Credit NFT is transferred to the Buyer's wallet.

## Flow 7 — Credit Retirement & Proof-of-Offset Generation
**Actor:** Corporate Buyer
1. Buyer navigates to "My Carbon Portfolio" and clicks "Retire Credit".
2. Buyer provides public retirement reason (e.g., "2026 Scope 1 & 2 Emissions Offset").
3. Transaction `retireCredit(tokenId, reason)` updates status to `RETIRED` and permanently disables future transfers.
4. Protocol generates an immutable, shareable cryptographic **Certificate of Retirement**.

## Flow 8 — Dispute Resolution, Credit Revocation & Stake Slashing
**Actor:** Auditor / Regulator / Stakeholder
1. Stakeholder discovers post-issuance fraud and initiates `disputeCredit(tokenId, evidenceUri)`.
2. Credit status flips to `DISPUTED` (trading/retirement locked).
3. If dispute is UPHELD by arbiter:
   - Credit status permanently transitions to `REVOKED`.
   - If in escrow: Escrow funds are 100% refunded to the buyer (`refundEscrow()`).
   - The verifier who approved the fraudulent bundle has **50% of their staked collateral slashed** (`slashVerifier()`), and their reputation score is heavily penalized.
   - Slashed funds are distributed to the dispute initiator and the insurance/compensation pool.
4. If dispute is DISMISSED: Credit reverts to active state.
