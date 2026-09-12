// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CarbonCreditNFT.sol";
import "../src/CarbonRegistry.sol";

contract CarbonPipelineTest is Test {
    CarbonRegistry public registry;
    CarbonCreditNFT public nft;

    address public owner = address(this);
    address public issuer = address(0x1111);
    address public verifier = address(0x2222);
    address public buyer = address(0x3333);

    bytes32 public projectId = keccak256("PROJ-AMAZON-001");
    string public did = "did:carbonyx:0x1111111111111111111111111111111111111111";
    bytes32 public kycHash = keccak256("KYC_PASSPORT_HASH");
    bytes32 public bundleId = keccak256("BUNDLE-2026-Q1");
    bytes32 public merkleRoot = keccak256("MERKLE_ROOT_SHA256_TELEMETRY");

    function setUp() public {
        registry = new CarbonRegistry();
        nft = new CarbonCreditNFT("Carbonyx Carbon Credit", "CARBX");

        registry.setCarbonCreditNFT(address(nft));
        nft.setRegistry(address(registry));
    }

    function test_RegisterProject() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);

        (
            bytes32 storedId,
            string memory storedDid,
            address storedOwner,
            ,
            ,
            ICarbonRegistry.ProjectStatus status,
            bool exists
        ) = registry.projects(projectId);

        assertEq(storedId, projectId);
        assertEq(storedDid, did);
        assertEq(storedOwner, issuer);
        assertTrue(status == ICarbonRegistry.ProjectStatus.ACTIVE);
        assertTrue(exists);
    }

    function test_CommitEvidenceBundle() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);

        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);

        (
            bytes32 storedBundleId,
            bytes32 storedProjectId,
            bytes32 storedRoot,
            bool isCommitted,
            bool riskEvaluated,
            ,
            ,
            ,
            ,
            ,
            bool isMinted,
        ) = registry.evidenceBundles(bundleId);

        assertEq(storedBundleId, bundleId);
        assertEq(storedProjectId, projectId);
        assertEq(storedRoot, merkleRoot);
        assertTrue(isCommitted);
        assertFalse(riskEvaluated);
        assertFalse(isMinted);
    }

    function test_HighConfidenceAutoMint() public {
        // 1. Register Project
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);

        // 2. Commit Evidence
        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);

        // 3. Record High Confidence ML Risk Evaluation (correlationMet=true, confidenceMet=true, verifierRequired=false)
        registry.recordRiskResult(bundleId, true, true, false);

        // 4. Mint Credit
        uint256 tokenId = registry.mintCredit(bundleId, 500, 2026);

        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), issuer);
        assertEq(nft.balanceOf(issuer), 1);

        (
            bytes32 proj,
            bytes32 bun,
            bytes32 root,
            uint256 tonnage,
            uint16 vintage,
            ICarbonCreditNFT.CreditStatus status
        ) = nft.getCreditDetails(tokenId);

        assertEq(proj, projectId);
        assertEq(bun, bundleId);
        assertEq(root, merkleRoot);
        assertEq(tonnage, 500);
        assertEq(vintage, 2026);
        assertTrue(status == ICarbonCreditNFT.CreditStatus.ISSUED);
    }

    function test_RejectLowConfidenceWithoutVerifierApproval() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);

        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);

        // Low confidence: confidenceMet=false, verifierRequired=true
        registry.recordRiskResult(bundleId, true, false, true);

        // Should revert on mint attempt without verifier approval
        vm.expectRevert(abi.encodeWithSelector(CarbonRegistry.ConfidenceThresholdNotMet.selector, bundleId));
        registry.mintCredit(bundleId, 500, 2026);
    }

    function test_MintWithVerifierApprovalForMediumConfidence() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);

        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);

        // Low/Medium confidence requires verifier
        registry.recordRiskResult(bundleId, true, false, true);

        // Verifier approves
        vm.prank(verifier);
        registry.recordVerification(bundleId, true);

        // Mint should now succeed
        uint256 tokenId = registry.mintCredit(bundleId, 500, 2026);
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), issuer);
    }

    function test_PreventDoubleMinting() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);

        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);
        registry.recordRiskResult(bundleId, true, true, false);

        // First mint succeeds
        registry.mintCredit(bundleId, 500, 2026);

        // Second mint fails with BundleAlreadyMinted
        vm.expectRevert(abi.encodeWithSelector(CarbonRegistry.BundleAlreadyMinted.selector, bundleId));
        registry.mintCredit(bundleId, 500, 2026);
    }

    function test_RetireCreditBurn() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);

        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);
        registry.recordRiskResult(bundleId, true, true, false);

        uint256 tokenId = registry.mintCredit(bundleId, 500, 2026);

        // Issuer retires the credit
        vm.prank(issuer);
        nft.retireCredit(tokenId, "Corporate Scope-1 emissions neutralization Q1 2026");

        // Token is burned
        assertEq(nft.balanceOf(issuer), 0);

        // Status is RETIRED
        (, , , , , ICarbonCreditNFT.CreditStatus status) = nft.getCreditDetails(tokenId);
        assertTrue(status == ICarbonCreditNFT.CreditStatus.RETIRED);
    }

    function test_TokenURI() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);
        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);
        registry.recordRiskResult(bundleId, true, true, false);

        uint256 tokenId = registry.mintCredit(bundleId, 500, 2026);
        string memory uri = nft.tokenURI(tokenId);
        assertTrue(bytes(uri).length > 0);
    }
}
