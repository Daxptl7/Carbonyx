# Smart Contract Specification

## 1. Architecture & Deployed Contracts

The protocol consists of 4 tightly integrated smart contracts:

1. **`CarbonRegistry.sol`:** Project registration (Module 102), Evidence Merkle root commitments (Module 106), Cryptographic integrity gates (Module 108), and Minting Policy Engine (Module 116).
2. **`VerifierStakingLedger.sol`:** Verifier collateral staking, reputation ledger, pool routing, and slashing penalties (Modules 112 & 114).
3. **`CarbonCreditNFT.sol`:** Dynamic ERC-721 token representing verified carbon credits with on-chain metadata, lifecycle state tracking, and retirement burn mechanism (Modules 118 & 120).
4. **`EscrowSettlement.sol`:** Custodial trading escrow holding buyer payments, releasing funds upon settlement, and executing 100% refunds upon dispute revocation (Modules 122 & 124).

## 2. Core Interfaces & Structs

### Structs
```solidity
enum CreditStatus { ISSUED, ESCROWED, TRANSFERRED, RETIRED, DISPUTED, REVOKED }
enum EscrowStatus { LOCKED, RELEASED, REFUNDED }

struct Project {
    bytes32 projectId;
    string did;
    address owner;
    bytes32 kycAttestationHash;
    uint256 baselineChallengeExpiry;
    bool isActive;
}

struct EvidenceBundle {
    bytes32 bundleId;
    bytes32 projectId;
    bytes32 merkleRoot;
    bool correlationMet;
    bool confidenceMet;
    bool verifierRequired;
    bool verifierApproved;
    address assignedVerifier;
    bool isMinted;
}

struct VerifierProfile {
    uint256 stakedAmount;
    uint256 reputationScore; // 0 - 100
    uint256 totalVerified;
    uint256 totalSlashed;
    bool isActive;
}

struct EscrowOrder {
    bytes32 escrowId;
    uint256 tokenId;
    address buyer;
    address seller;
    uint256 amount;
    uint256 releaseTime;
    EscrowStatus status;
}
```

## 3. Function Signatures by Contract

### `CarbonRegistry.sol`
```solidity
// Project Registration (Module 102)
function registerProject(bytes32 projectId, string calldata did, bytes32 kycHash, uint256 challengeDuration) external;

// Evidence Commitment (Module 106)
function commitEvidenceBundle(bytes32 bundleId, bytes32 projectId, bytes32 merkleRoot) external onlyTrustedRelayer;

// Risk Recording (Module 110)
function recordRiskResult(bytes32 bundleId, bool correlationMet, bool confidenceMet, bool verifierRequired) external onlyTrustedRelayer;

// Verifier Decision (Module 112/114)
function recordVerification(bytes32 bundleId, bool approved) external;

// Gated Minting (Module 116/118)
function mintCredit(bytes32 bundleId, uint256 co2Tonnage, uint16 vintageYear) external returns (uint256 tokenId);

// Dispute Resolution (Module 122)
function disputeCredit(uint256 tokenId, string calldata reason) external;
function resolveDispute(uint256 tokenId, bool upholdDispute, string calldata resolutionDetails) external onlyAdmin;
```

### `VerifierStakingLedger.sol`
```solidity
function stake() external payable;
function unstake(uint256 amount) external;
function slashVerifier(address verifier, uint256 percentage) external onlyRegistry returns (uint256 slashedAmount);
function updateReputation(address verifier, bool successfulAudit) external onlyRegistry;
function isStaked(address verifier) external view returns (bool);
```

### `CarbonCreditNFT.sol` (ERC-721)
```solidity
function mint(address recipient, bytes32 projectId, bytes32 bundleId, bytes32 merkleRoot, uint256 tonnage, uint16 vintage) external onlyRegistry returns (uint256);
function setCreditStatus(uint256 tokenId, CreditStatus newStatus) external onlyRegistryOrEscrow;
function retireCredit(uint256 tokenId, string calldata retirementReason) external;
function getCreditDetails(uint256 tokenId) external view returns (bytes32 projectId, bytes32 bundleId, bytes32 merkleRoot, uint256 tonnage, uint16 vintage, CreditStatus status);
function tokenURI(uint256 tokenId) public view override returns (string memory);
```

### `EscrowSettlement.sol`
```solidity
function buyWithEscrow(uint256 tokenId) external payable returns (bytes32 escrowId);
function releaseEscrow(bytes32 escrowId) external;
function refundEscrow(bytes32 escrowId) external onlyRegistry;
```

## 4. Smart Contract Invariants

1. **Zero Unverified Minting:** A credit CANNOT be minted unless `correlationMet == true && (confidenceMet == true || (verifierRequired == true && verifierApproved == true))`.
2. **Strict Single-Issuance:** A single `bundleId` cannot be minted more than once (`bundle.isMinted == true` permanently locks future mint attempts).
3. **No Revived Retired Credits:** A credit in `RETIRED` or `REVOKED` state CANNOT be transferred, re-retired, or escrowed.
4. **Staking Prerequisite:** A verifier CANNOT record an on-chain verification decision unless their active staked balance `>= MIN_STAKE`.
5. **Economic Slashing Invariant:** When a credit is revoked for fraud in dispute, the approving verifier MUST have 50% of their staked balance automatically slashed.
6. **Escrow Guarantee:** If a credit in escrow is disputed and revoked, 100% of escrowed funds MUST be returned to the buyer.

## 5. Custom Errors & Gas Optimization

```solidity
error ProjectNotActive(bytes32 projectId);
error InsufficientVerifierStake(address verifier, uint256 currentStake, uint256 requiredStake);
error ConfidenceThresholdNotMet(bytes32 bundleId);
error VerifierApprovalRequired(bytes32 bundleId);
error BundleAlreadyMinted(bytes32 bundleId);
error CreditAlreadyRetired(uint256 tokenId);
error CreditRevoked(uint256 tokenId);
error EscrowAlreadySettled(bytes32 escrowId);
error UnauthorizedCaller(address caller);
```
