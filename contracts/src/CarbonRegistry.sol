// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ICarbonRegistry } from "./interfaces/ICarbonRegistry.sol";
import { ICarbonCreditNFT } from "./interfaces/ICarbonCreditNFT.sol";
import { IVerifierStakingLedger } from "./interfaces/IVerifierStakingLedger.sol";
import { IEscrowSettlement } from "./interfaces/IEscrowSettlement.sol";

/**
 * @title CarbonRegistry
 * @notice Central registry orchestrating project DIDs, evidence Merkle roots,
 *         risk score gates, staked verifier sign-offs, dynamic NFT issuance,
 *         and dispute resolution with slashing.
 */
contract CarbonRegistry is Ownable, ICarbonRegistry {
    ICarbonCreditNFT public carbonCreditNFT;
    IVerifierStakingLedger public verifierStakingLedger;
    IEscrowSettlement public escrowSettlement;

    struct Project {
        string did;
        address owner;
        bytes32 kycHash;
        uint256 challengeExpiry;
        ProjectStatus status;
        bool exists;
    }

    struct Bundle {
        bytes32 projectId;
        bytes32 merkleRoot;
        bool committed;
        bool riskRecorded;
        bool correlationMet;
        bool confidenceMet;
        bool verifierRequired;
        bool verified;
        bool verificationApproved;
        address assignedVerifier;
        bool minted;
    }

    struct CreditRecord {
        bytes32 bundleId;
        bytes32 projectId;
        address verifier;
        bool disputed;
        string disputeReason;
        address disputeInitiator;
    }

    mapping(bytes32 => Project) public projects;
    mapping(bytes32 => Bundle) public bundles;
    mapping(uint256 => CreditRecord) public creditRecords;
    mapping(uint256 => bytes32) public tokenToEscrow;

    constructor(
        address _nft,
        address _staking,
        address _escrow
    ) Ownable(msg.sender) {
        carbonCreditNFT = ICarbonCreditNFT(_nft);
        verifierStakingLedger = IVerifierStakingLedger(_staking);
        escrowSettlement = IEscrowSettlement(_escrow);
    }

    function setContracts(address _nft, address _staking, address _escrow) external onlyOwner {
        carbonCreditNFT = ICarbonCreditNFT(_nft);
        verifierStakingLedger = IVerifierStakingLedger(_staking);
        escrowSettlement = IEscrowSettlement(_escrow);
    }

    function registerProject(
        bytes32 projectId,
        string calldata did,
        bytes32 kycHash,
        uint256 challengeDuration
    ) external override {
        require(!projects[projectId].exists, "Project already registered");

        projects[projectId] = Project({
            did: did,
            owner: msg.sender,
            kycHash: kycHash,
            challengeExpiry: block.timestamp + challengeDuration,
            status: ProjectStatus.ACTIVE,
            exists: true
        });

        emit ProjectRegistered(projectId, did, msg.sender);
    }

    function commitEvidenceBundle(
        bytes32 bundleId,
        bytes32 projectId,
        bytes32 merkleRoot
    ) external override {
        require(projects[projectId].exists, "Project not registered");
        require(!bundles[bundleId].committed, "Bundle already committed");

        bundles[bundleId].projectId = projectId;
        bundles[bundleId].merkleRoot = merkleRoot;
        bundles[bundleId].committed = true;

        emit EvidenceCommitted(bundleId, projectId, merkleRoot);
    }

    function recordRiskResult(
        bytes32 bundleId,
        bool correlationMet,
        bool confidenceMet,
        bool verifierRequired
    ) external override onlyOwner {
        require(bundles[bundleId].committed, "Bundle not committed");
        Bundle storage b = bundles[bundleId];

        b.riskRecorded = true;
        b.correlationMet = correlationMet;
        b.confidenceMet = confidenceMet;
        b.verifierRequired = verifierRequired;

        emit RiskResultRecorded(bundleId, correlationMet, confidenceMet, verifierRequired);
    }

    function recordVerification(
        bytes32 bundleId,
        bool approved
    ) external override {
        require(bundles[bundleId].committed, "Bundle not committed");
        require(bundles[bundleId].riskRecorded, "Risk not yet evaluated");
        require(verifierStakingLedger.isStaked(msg.sender), "Caller is not a staked verifier");

        Bundle storage b = bundles[bundleId];
        b.verified = true;
        b.verificationApproved = approved;
        b.assignedVerifier = msg.sender;

        verifierStakingLedger.updateReputation(msg.sender, approved);

        emit VerificationRecorded(bundleId, msg.sender, approved);
    }

    function mintCredit(
        bytes32 bundleId,
        uint256 co2Tonnage,
        uint16 vintageYear
    ) external override returns (uint256 tokenId) {
        Bundle storage b = bundles[bundleId];
        require(b.committed, "Bundle not committed");
        require(b.riskRecorded, "Risk not recorded");
        require(!b.minted, "Credit already minted for bundle");

        // Policy Gate Enforcement:
        // Either: Auto-mint eligible (confidenceMet && correlationMet && !verifierRequired)
        // Or: Staked verifier manual approval is recorded
        if (b.verifierRequired) {
            require(b.verified && b.verificationApproved, "Verifier approval required before minting");
        } else {
            require(b.confidenceMet && b.correlationMet, "Confidence or correlation criteria failed");
        }

        b.minted = true;
        Project storage p = projects[b.projectId];
        address recipient = p.owner != address(0) ? p.owner : msg.sender;

        tokenId = carbonCreditNFT.mint(
            recipient,
            b.projectId,
            bundleId,
            b.merkleRoot,
            co2Tonnage,
            vintageYear
        );

        creditRecords[tokenId] = CreditRecord({
            bundleId: bundleId,
            projectId: b.projectId,
            verifier: b.assignedVerifier,
            disputed: false,
            disputeReason: "",
            disputeInitiator: address(0)
        });

        emit CreditIssued(tokenId, b.projectId, bundleId, recipient);
        return tokenId;
    }

    function disputeCredit(uint256 tokenId, string calldata reason) external override {
        require(!creditRecords[tokenId].disputed, "Credit already disputed");

        creditRecords[tokenId].disputed = true;
        creditRecords[tokenId].disputeReason = reason;
        creditRecords[tokenId].disputeInitiator = msg.sender;

        carbonCreditNFT.setCreditStatus(tokenId, ICarbonCreditNFT.CreditStatus.DISPUTED);
        emit CreditDisputed(tokenId, msg.sender, reason);
    }

    function resolveDispute(
        uint256 tokenId,
        bool upholdDispute,
        string calldata resolutionDetails
    ) external override onlyOwner {
        CreditRecord storage cr = creditRecords[tokenId];
        require(cr.disputed, "Credit not in disputed state");

        if (upholdDispute) {
            // 1. Revoke the NFT credit permanently
            carbonCreditNFT.setCreditStatus(tokenId, ICarbonCreditNFT.CreditStatus.REVOKED);

            // 2. Refund buyer if held in escrow
            bytes32 escrowId = tokenToEscrow[tokenId];
            if (escrowId != bytes32(0)) {
                escrowSettlement.refundEscrow(escrowId);
            }

            // 3. Slash 50% of the approving verifier's staked collateral
            if (cr.verifier != address(0)) {
                verifierStakingLedger.slashVerifier(cr.verifier, 50);
            }

            emit CreditRevoked(tokenId, resolutionDetails);
        } else {
            cr.disputed = false;
            carbonCreditNFT.setCreditStatus(tokenId, ICarbonCreditNFT.CreditStatus.ISSUED);
            emit DisputeDismissed(tokenId);
        }
    }

    function setTokenEscrow(uint256 tokenId, bytes32 escrowId) external onlyOwner {
        tokenToEscrow[tokenId] = escrowId;
    }
}
