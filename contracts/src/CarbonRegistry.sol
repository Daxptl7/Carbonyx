// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICarbonRegistry.sol";
import "./interfaces/ICarbonCreditNFT.sol";

/**
 * @title CarbonRegistry
 * @notice Central registry for project DIDs, cryptographic evidence bundle Merkle commitments, and policy gates.
 */
contract CarbonRegistry is Ownable, ICarbonRegistry {

    struct Project {
        bytes32 projectId;
        string did;
        address owner;
        bytes32 kycAttestationHash;
        uint256 baselineChallengeExpiry;
        ProjectStatus status;
        bool exists;
    }

    struct EvidenceBundle {
        bytes32 bundleId;
        bytes32 projectId;
        bytes32 merkleRoot;
        bool isCommitted;
        bool riskEvaluated;
        bool correlationMet;
        bool confidenceMet;
        bool verifierRequired;
        bool verifierApproved;
        address assignedVerifier;
        bool isMinted;
        uint256 mintedTokenId;
    }

    ICarbonCreditNFT public carbonCreditNFT;
    address public verifierStakingLedger;
    address public escrowSettlement;

    mapping(bytes32 => Project) public projects;
    mapping(bytes32 => EvidenceBundle) public evidenceBundles;
    mapping(address => bool) public trustedRelayers;

    error ProjectAlreadyRegistered(bytes32 projectId);
    error ProjectNotActive(bytes32 projectId);
    error BundleAlreadyCommitted(bytes32 bundleId);
    error BundleNotCommitted(bytes32 bundleId);
    error BundleAlreadyMinted(bytes32 bundleId);
    error RiskNotEvaluated(bytes32 bundleId);
    error CorrelationNotMet(bytes32 bundleId);
    error ConfidenceThresholdNotMet(bytes32 bundleId);
    error VerifierApprovalRequired(bytes32 bundleId);
    error UnauthorizedRelayer(address caller);
    error UnauthorizedCaller(address caller);
    error InvalidNFTContract();

    modifier onlyRelayerOrOwner() {
        if (!trustedRelayers[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedRelayer(msg.sender);
        }
        _;
    }

    constructor() Ownable(msg.sender) {
        trustedRelayers[msg.sender] = true;
    }

    function setCarbonCreditNFT(address _nft) external onlyOwner {
        carbonCreditNFT = ICarbonCreditNFT(_nft);
    }

    function setVerifierStakingLedger(address _ledger) external onlyOwner {
        verifierStakingLedger = _ledger;
    }

    function setEscrowSettlement(address _escrow) external onlyOwner {
        escrowSettlement = _escrow;
    }

    function setTrustedRelayer(address relayer, bool isTrusted) external onlyOwner {
        trustedRelayers[relayer] = isTrusted;
    }

    function registerProject(
        bytes32 projectId,
        string calldata did,
        bytes32 kycHash,
        uint256 challengeDuration
    ) external {
        if (projects[projectId].exists) {
            revert ProjectAlreadyRegistered(projectId);
        }

        projects[projectId] = Project({
            projectId: projectId,
            did: did,
            owner: msg.sender,
            kycAttestationHash: kycHash,
            baselineChallengeExpiry: block.timestamp + challengeDuration,
            status: ProjectStatus.ACTIVE,
            exists: true
        });

        emit ProjectRegistered(projectId, did, msg.sender);
    }

    function commitEvidenceBundle(
        bytes32 bundleId,
        bytes32 projectId,
        bytes32 merkleRoot
    ) external onlyRelayerOrOwner {
        Project storage project = projects[projectId];
        if (!project.exists || project.status != ProjectStatus.ACTIVE) {
            revert ProjectNotActive(projectId);
        }
        if (evidenceBundles[bundleId].isCommitted) {
            revert BundleAlreadyCommitted(bundleId);
        }

        evidenceBundles[bundleId] = EvidenceBundle({
            bundleId: bundleId,
            projectId: projectId,
            merkleRoot: merkleRoot,
            isCommitted: true,
            riskEvaluated: false,
            correlationMet: false,
            confidenceMet: false,
            verifierRequired: false,
            verifierApproved: false,
            assignedVerifier: address(0),
            isMinted: false,
            mintedTokenId: 0
        });

        emit EvidenceCommitted(bundleId, projectId, merkleRoot);
    }

    function recordRiskResult(
        bytes32 bundleId,
        bool correlationMet,
        bool confidenceMet,
        bool verifierRequired
    ) external onlyRelayerOrOwner {
        EvidenceBundle storage bundle = evidenceBundles[bundleId];
        if (!bundle.isCommitted) {
            revert BundleNotCommitted(bundleId);
        }

        bundle.riskEvaluated = true;
        bundle.correlationMet = correlationMet;
        bundle.confidenceMet = confidenceMet;
        bundle.verifierRequired = verifierRequired;

        emit RiskResultRecorded(bundleId, correlationMet, confidenceMet, verifierRequired);
    }

    function recordVerification(bytes32 bundleId, bool approved) external {
        EvidenceBundle storage bundle = evidenceBundles[bundleId];
        if (!bundle.isCommitted) {
            revert BundleNotCommitted(bundleId);
        }
        if (!bundle.verifierRequired) {
            revert UnauthorizedCaller(msg.sender);
        }

        bundle.assignedVerifier = msg.sender;
        bundle.verifierApproved = approved;

        emit VerificationRecorded(bundleId, msg.sender, approved);
    }

    function mintCredit(
        bytes32 bundleId,
        uint256 co2Tonnage,
        uint16 vintageYear
    ) external returns (uint256 tokenId) {
        if (address(carbonCreditNFT) == address(0)) {
            revert InvalidNFTContract();
        }

        EvidenceBundle storage bundle = evidenceBundles[bundleId];
        if (!bundle.isCommitted) {
            revert BundleNotCommitted(bundleId);
        }
        if (bundle.isMinted) {
            revert BundleAlreadyMinted(bundleId);
        }
        if (!bundle.riskEvaluated) {
            revert RiskNotEvaluated(bundleId);
        }
        if (!bundle.correlationMet) {
            revert CorrelationNotMet(bundleId);
        }

        // Patent Policy Invariant:
        // Must meet confidence >= 85% OR have an approved verified audit
        if (!bundle.confidenceMet) {
            if (!bundle.verifierRequired || !bundle.verifierApproved) {
                revert ConfidenceThresholdNotMet(bundleId);
            }
        }

        Project storage project = projects[bundle.projectId];
        if (!project.exists || project.status != ProjectStatus.ACTIVE) {
            revert ProjectNotActive(bundle.projectId);
        }

        address recipient = project.owner;

        bundle.isMinted = true;
        tokenId = carbonCreditNFT.mint(
            recipient,
            bundle.projectId,
            bundleId,
            bundle.merkleRoot,
            co2Tonnage,
            vintageYear
        );

        bundle.mintedTokenId = tokenId;

        emit CreditIssued(tokenId, bundle.projectId, bundleId, recipient);
        return tokenId;
    }

    function disputeCredit(uint256 tokenId, string calldata reason) external {
        if (address(carbonCreditNFT) != address(0)) {
            carbonCreditNFT.setCreditStatus(tokenId, ICarbonCreditNFT.CreditStatus.DISPUTED);
        }
        emit CreditDisputed(tokenId, msg.sender, reason);
    }

    function resolveDispute(
        uint256 tokenId,
        bool upholdDispute,
        string calldata resolutionDetails
    ) external onlyOwner {
        if (address(carbonCreditNFT) != address(0)) {
            if (upholdDispute) {
                carbonCreditNFT.setCreditStatus(tokenId, ICarbonCreditNFT.CreditStatus.REVOKED);
                emit CreditRevoked(tokenId, resolutionDetails);
            } else {
                carbonCreditNFT.setCreditStatus(tokenId, ICarbonCreditNFT.CreditStatus.ISSUED);
                emit DisputeDismissed(tokenId);
            }
        }
    }
}
