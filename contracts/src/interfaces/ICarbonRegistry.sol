// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICarbonRegistry {
    enum ProjectStatus { PENDING_CHALLENGE, ACTIVE, SUSPENDED }
    
    event ProjectRegistered(bytes32 indexed projectId, string did, address indexed owner);
    event EvidenceCommitted(bytes32 indexed bundleId, bytes32 indexed projectId, bytes32 merkleRoot);
    event RiskResultRecorded(bytes32 indexed bundleId, bool correlationMet, bool confidenceMet, bool verifierRequired);
    event VerificationRecorded(bytes32 indexed bundleId, address indexed verifier, bool approved);
    event CreditIssued(uint256 indexed tokenId, bytes32 indexed projectId, bytes32 indexed bundleId, address recipient);
    event CreditDisputed(uint256 indexed tokenId, address indexed initiator, string reason);
    event CreditRevoked(uint256 indexed tokenId, string reason);
    event DisputeDismissed(uint256 indexed tokenId);

    function registerProject(bytes32 projectId, string calldata did, bytes32 kycHash, uint256 challengeDuration) external;
    function commitEvidenceBundle(bytes32 bundleId, bytes32 projectId, bytes32 merkleRoot) external;
    function recordRiskResult(bytes32 bundleId, bool correlationMet, bool confidenceMet, bool verifierRequired) external;
    function recordVerification(bytes32 bundleId, bool approved) external;
    function mintCredit(bytes32 bundleId, uint256 co2Tonnage, uint16 vintageYear) external returns (uint256 tokenId);
    function disputeCredit(uint256 tokenId, string calldata reason) external;
    function resolveDispute(uint256 tokenId, bool upholdDispute, string calldata resolutionDetails) external;
}
