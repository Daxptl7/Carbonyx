# Smart Contract Specification

## 1. Purpose

Define the exact on-chain contracts, functions, events, and invariants required to enforce the Core Principle ("evidence must be validated before a carbon credit can be issued") as code — not as a UI convention. This document is the frozen interface Jash builds against; any change to a function signature or invariant must be reflected here first (Constitution, Section 10).

## 2. Contract Architecture

Scope decision: for a 36-hour build, the patent's `Blockchain Registry & Carbon Credit Issuance Module (118)`, `Lifecycle Management Module (120)`, and `Dispute & Revocation Module (122)` are merged into a single `CarbonCreditRegistry` contract instead of three separately deployed contracts. This reduces cross-contract call complexity and gas overhead while preserving every required invariant. `Smart Contract Policy Engine (116)` logic lives inside `CarbonCreditRegistry.mintCredit()` as a modifier/check rather than a separate deployed contract.

### ProjectRegistry
Simplified implementation of patent Module 102. Stores a minimal on-chain reference per project (no real DID/KYC — Scope Spec Section 5). Owns no tokens; purely a registration + ownership-check source.

### EvidenceRegistry
Implements patent Modules 106/108/110's on-chain footprint: stores the Merkle root commitment per evidence bundle and the correlation-threshold-met / confidence-threshold-met flags computed off-chain and submitted by the backend. Does not store or verify raw evidence — that stays off-chain (Technical Architecture, Section 6).

### CarbonCreditRegistry (ERC-721)
Implements patent Modules 116/118/120/122. Each carbon credit is a unique ERC-721 token, minted only when `EvidenceRegistry` shows a bundle as authenticated + threshold-met + (if escalated) verifier-approved, and only once per bundle. Handles transfer, retirement, dispute, and revocation.

**Not included in MVP (per Scope Spec, out of scope):** `VerifierStakingLedger`, `EscrowSettlement`, `ZKEvidenceModule`, `RegistryInteropBridge`, full `GovernanceDAO`.

## 3. Roles

- **Admin** — deployer address; manages verifier allow-list, resolves disputes (simplified governance stand-in). Single address or small multisig for the demo.
- **ProjectIssuer** — any address that has registered a project; can submit evidence bundles for that project.
- **Verifier** — allow-listed address(es) set by Admin; can record verification decisions on escalated bundles.
- **Buyer** — any address holding a `CarbonCreditRegistry` token; can transfer or retire credits it owns.
- **Registry (system)** — the contract itself, acting as the authoritative on-chain state; the backend calls into it but never bypasses its checks.

## 4. Contract State

**ProjectRegistry**
```solidity
mapping(bytes32 => address) public projectOwner;       // projectId => owner
mapping(bytes32 => bool) public projectActive;         // projectId => is registered/active
```

**EvidenceRegistry**
```solidity
struct Bundle {
    bytes32 projectId;
    bytes32 merkleRoot;
    bool correlationThresholdMet;
    bool confidenceThresholdMet;   // set true directly if auto-approved, or after verifier approval
    bool verifierRequired;
    bool verifierApproved;
    bool issued;                   // true once a credit has been minted against this bundle
}
mapping(bytes32 => Bundle) public bundles;              // bundleId => Bundle
mapping(address => bool) public isVerifier;             // verifier allow-list
```

**CarbonCreditRegistry**
```solidity
enum CreditStatus { ISSUED, TRANSFERRED, RETIRED, DISPUTED, REVOKED }
struct Credit {
    bytes32 projectId;
    bytes32 bundleId;
    CreditStatus status;
    uint256 co2eQuantity;
    address currentOwner;   // mirrors ERC-721 owner but kept explicit for clarity/events
}
mapping(uint256 => Credit) public credits;               // tokenId (creditId) => Credit
mapping(bytes32 => bool) public bundleHasCredit;          // bundleId => credit already minted (hard duplicate guard)
address public admin;
```

## 5. Functions

### registerProject()
**Inputs:** `bytes32 projectId, string calldata metadataURI`
**Validation:** `projectId` not already registered (`!projectActive[projectId]`)
**State Changes:** `projectOwner[projectId] = msg.sender; projectActive[projectId] = true;`
**Events:** `ProjectRegistered(projectId, msg.sender)`

### commitEvidenceBundle()
*(implements the "registerEvidence" step — named to match Technical Architecture's `EvidenceCommitted` event)*
**Inputs:** `bytes32 bundleId, bytes32 projectId, bytes32 merkleRoot, bool correlationThresholdMet`
**Validation:** caller is backend/oracle address (trusted relayer for off-chain-computed values) OR `msg.sender == projectOwner[projectId]` with backend co-signing (implementation detail decided at build time — see ADR note below); `projectActive[projectId] == true`; bundle does not already exist
**State Changes:** creates `Bundle` entry with `issued = false`, `confidenceThresholdMet = false`, `verifierApproved = false`
**Events:** `EvidenceCommitted(bundleId, projectId, merkleRoot)`

### recordRiskResult()
**Inputs:** `bytes32 bundleId, bool confidenceThresholdMet, bool verifierRequired`
**Validation:** caller is trusted backend/oracle address; bundle exists; bundle not yet issued
**State Changes:** sets `bundles[bundleId].confidenceThresholdMet` and `.verifierRequired`
**Events:** `RiskResultRecorded(bundleId, confidenceThresholdMet, verifierRequired)`

### recordVerification()
*(implements "authorizeMint" gate for escalated bundles)*
**Inputs:** `bytes32 bundleId, bool approved`
**Validation:** `isVerifier[msg.sender] == true`; `bundles[bundleId].verifierRequired == true`; bundle not yet issued
**State Changes:** `bundles[bundleId].verifierApproved = approved`
**Events:** `VerificationRecorded(bundleId, msg.sender, approved)`

### mintCredit()
**Inputs:** `bytes32 bundleId, address recipient, uint256 co2eQuantity`
**Validation (all must hold — this is the Smart Contract Policy Engine, Module 116):**
- `bundles[bundleId].correlationThresholdMet == true`
- `bundles[bundleId].confidenceThresholdMet == true`
- `bundles[bundleId].verifierRequired == false OR bundles[bundleId].verifierApproved == true`
- `bundles[bundleId].issued == false` (duplicate-issuance guard)
- `bundleHasCredit[bundleId] == false` (redundant second guard, per Domain Spec Rule 1)
- caller is trusted backend/oracle address, or `recipient == projectOwner[bundles[bundleId].projectId]` for issuer self-mint path
**State Changes:** mints new ERC-721 `tokenId` (creditId) to `recipient`; creates `Credit` struct with `status = ISSUED`; sets `bundles[bundleId].issued = true`; `bundleHasCredit[bundleId] = true`
**Events:** `CreditIssued(creditId, projectId, bundleId, recipient)`. If validation fails, function reverts with a specific reason (see Section 9) — no `MintDenied` event is emitted on revert (reverted transactions do not persist events); the backend surfaces the revert reason to the UI directly.

### transferCredit()
**Inputs:** `uint256 creditId, address to`
**Validation:** `msg.sender == credits[creditId].currentOwner` (or approved via standard ERC-721 approval); `credits[creditId].status == ISSUED OR status == TRANSFERRED`; `to != address(0)`
**State Changes:** ERC-721 `_transfer`; `credits[creditId].currentOwner = to`; `credits[creditId].status = TRANSFERRED`
**Events:** `CreditTransferred(creditId, from, to)`

### retireCredit()
**Inputs:** `uint256 creditId, string calldata reason`
**Validation:** `msg.sender == credits[creditId].currentOwner`; `credits[creditId].status == ISSUED OR status == TRANSFERRED` (i.e., not already `RETIRED`, `DISPUTED`, or `REVOKED`)
**State Changes:** `credits[creditId].status = RETIRED`
**Events:** `CreditRetired(creditId, msg.sender, reason)`

### disputeCredit()
**Inputs:** `uint256 creditId, string calldata reason`
**Validation:** caller is `Verifier` or `Admin`; `credits[creditId].status == ISSUED OR status == TRANSFERRED` (cannot dispute an already-retired or already-disputed credit)
**State Changes:** `credits[creditId].status = DISPUTED`
**Events:** `CreditDisputed(creditId, msg.sender, reason)`

### resolveDispute()
**Inputs:** `uint256 creditId, bool upheld`
**Validation:** `msg.sender == admin`; `credits[creditId].status == DISPUTED`
**State Changes:** if `upheld`, `credits[creditId].status = REVOKED` (terminal); else, `credits[creditId].status` reverts to `ISSUED` or `TRANSFERRED` based on transfer history (implementation tracks prior status)
**Events:** `CreditRevoked(creditId, reason)` if upheld, else `DisputeDismissed(creditId)`

## 6. Invariants

- Cannot mint without `correlationThresholdMet && confidenceThresholdMet && (!verifierRequired || verifierApproved)`
- Same evidence bundle cannot mint twice (`bundles[bundleId].issued` and `bundleHasCredit[bundleId]` both checked)
- Retired credits cannot transfer
- Retired credits cannot be retired again
- Disputed credits cannot transfer or be retired until the dispute is resolved
- Revoked credits are permanently non-transferable and non-retirable (terminal, same as retired)
- Unauthorized (non-allow-listed) addresses cannot record a verification decision
- Unauthorized (non-owner, non-approved) addresses cannot mint, transfer, retire, or dispute a specific credit
- Only `admin` can resolve a dispute
- A project must be active/registered before any evidence bundle can be committed against it

## 7. Events

```solidity
event ProjectRegistered(bytes32 indexed projectId, address indexed owner);
event EvidenceCommitted(bytes32 indexed bundleId, bytes32 indexed projectId, bytes32 merkleRoot);
event RiskResultRecorded(bytes32 indexed bundleId, bool confidenceThresholdMet, bool verifierRequired);
event VerificationRecorded(bytes32 indexed bundleId, address indexed verifier, bool approved);
event CreditIssued(uint256 indexed creditId, bytes32 indexed projectId, bytes32 indexed bundleId, address recipient);
event CreditTransferred(uint256 indexed creditId, address indexed from, address indexed to);
event CreditRetired(uint256 indexed creditId, address indexed owner, string reason);
event CreditDisputed(uint256 indexed creditId, address indexed initiator, string reason);
event CreditRevoked(uint256 indexed creditId, string reason);
event DisputeDismissed(uint256 indexed creditId);
```

## 8. Access Control

- `onlyAdmin` modifier: `resolveDispute()`, verifier allow-list management (`addVerifier()`, `removeVerifier()`)
- `onlyVerifier` modifier: `recordVerification()`, `disputeCredit()` (Admin may also dispute)
- `onlyTrustedRelayer` modifier (backend/oracle address, set at deploy time): `commitEvidenceBundle()`, `recordRiskResult()` — these carry off-chain-computed values (hash results, ML scores) that the contract cannot independently compute, so the relayer address is trusted for data relay only, never for bypassing the mint policy checks themselves
- `onlyCreditOwner` modifier (via ERC-721 ownership + explicit `currentOwner` check): `transferCredit()`, `retireCredit()`
- No function allows an arbitrary address to mint directly — `mintCredit()` always re-checks the full policy regardless of caller

## 9. Error Conditions

Custom errors (gas-efficient, and give the backend/UI a specific reason string per Technical Architecture, Section 9 — "fail loud, not silent"):

```solidity
error ProjectNotRegistered(bytes32 projectId);
error ProjectAlreadyRegistered(bytes32 projectId);
error BundleAlreadyExists(bytes32 bundleId);
error BundleNotFound(bytes32 bundleId);
error CorrelationThresholdNotMet(bytes32 bundleId);
error ConfidenceThresholdNotMet(bytes32 bundleId);
error VerificationRequired(bytes32 bundleId);
error VerificationNotApproved(bytes32 bundleId);
error BundleAlreadyIssued(bytes32 bundleId);
error NotCreditOwner(uint256 creditId, address caller);
error CreditNotTransferable(uint256 creditId, uint8 currentStatus);
error CreditNotRetireable(uint256 creditId, uint8 currentStatus);
error CreditNotDisputable(uint256 creditId, uint8 currentStatus);
error NotAVerifier(address caller);
error NotAdmin(address caller);
error DisputeNotActive(uint256 creditId);
```

## 10. Gas Considerations

- Raw evidence never touches storage — only a `bytes32` Merkle root per bundle, keeping `commitEvidenceBundle()` cheap.
- `Bundle` and `Credit` structs are packed where possible (bools and small enums grouped) to minimize storage slots.
- Custom errors used instead of `require(string)` to reduce deployment and revert gas cost.
- `bundleHasCredit` mapping is a deliberate redundancy against `bundles[bundleId].issued` — both are single `SLOAD`/`SSTORE` operations, so the extra safety costs negligible gas while giving a second independent guard against the single most important invariant (no duplicate issuance).
- No on-chain loops over evidence items or verifiers — all correlation/anomaly computation happens off-chain; the contract only checks pre-computed boolean flags, keeping every function's gas cost constant regardless of evidence volume.

## 11. Security Considerations

- **Trusted relayer risk:** `commitEvidenceBundle()` and `recordRiskResult()` trust the backend/oracle address for data relay. This is a disclosed, explicit trust boundary (Technical Architecture, Section 11) appropriate for a hackathon MVP — mitigated by the fact that this address can relay false *data* but still cannot bypass the mint policy checks themselves (it can't set `bundleHasCredit` or `issued` directly, only through the same `mintCredit()` path everyone else uses).
- **Reentrancy:** `transferCredit()`, `retireCredit()`, and `mintCredit()` follow checks-effects-interactions ordering; no external calls are made mid-state-change (ERC-721 `_transfer` is the only external-facing call and is OpenZeppelin's audited implementation).
- **Front-running:** minting is idempotent per `bundleId` — even if two mint transactions for the same bundle are both submitted, only the first succeeds; the second reverts on `BundleAlreadyIssued`.
- **Admin key risk:** single-admin dispute resolution is a known, disclosed centralization point for the MVP (Scope Spec — full DAO governance out of scope); framed explicitly as future work in the pitch.
- **Verifier allow-list integrity:** only `admin` can add/remove verifiers — compromise of a verifier key is limited to blocking/approving individual bundles, not minting or transferring credits directly.

## 12. Test Requirements

**Unit tests (Foundry):**
- `registerProject()` succeeds once, reverts on duplicate `projectId`
- `commitEvidenceBundle()` reverts if project inactive, reverts on duplicate `bundleId`
- `mintCredit()` succeeds only when all three policy conditions hold; reverts individually for each missing condition (correlation, confidence, verification)
- `mintCredit()` reverts on second attempt against the same `bundleId`
- `transferCredit()` succeeds for owner, reverts for non-owner, reverts on retired/disputed/revoked credit
- `retireCredit()` succeeds once, reverts on second retirement attempt
- `disputeCredit()` / `resolveDispute()` correctly transitions to `REVOKED` (upheld) or back to prior status (dismissed)
- Access control: non-verifier cannot call `recordVerification()`, non-admin cannot call `resolveDispute()`

**Fuzz tests:**
- Fuzz `mintCredit()` policy-condition combinations (random booleans for correlation/confidence/verifier-required/verifier-approved) — assert mint succeeds if and only if the exact invariant in Section 6 holds
- Fuzz transfer/retire/dispute call sequences from random callers — assert only the correct owner/role ever succeeds

**Invariant tests:**
- No `bundleId` ever backs more than one minted credit, across arbitrary sequences of calls
- No credit ever leaves the `RETIRED` or `REVOKED` state through any sequence of calls
- Total minted credits always equals the count of bundles with `issued == true`

**Integration tests:**
- Full happy path: register project → commit bundle → record risk result (auto-approve) → mint → transfer → retire, asserting correct events at each step
- Full escalation path: register project → commit bundle → record risk result (escalate) → verifier approves → mint → dispute → admin upholds → revoked
- Full rejection path: escalate → verifier rejects → confirm `mintCredit()` reverts with `VerificationNotApproved`
