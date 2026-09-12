// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CarbonCreditNFT.sol";
import "../src/CarbonRegistry.sol";
import "../src/VerifierStakingLedger.sol";
import "../src/EscrowSettlement.sol";

contract VerifierEscrowTest is Test {
    CarbonRegistry public registry;
    CarbonCreditNFT public nft;
    VerifierStakingLedger public stakingLedger;
    EscrowSettlement public escrow;

    address public owner = address(this);
    address public issuer = address(0x1111);
    address public verifier = address(0x2222);
    address public buyer = address(0x3333);

    bytes32 public projectId = keccak256("PROJ-BORNEO-002");
    string public did = "did:carbonyx:0x1111111111111111111111111111111111111111";
    bytes32 public kycHash = keccak256("KYC_HASH_BORNEO");
    bytes32 public bundleId = keccak256("BUNDLE-2026-Q2");
    bytes32 public merkleRoot = keccak256("MERKLE_ROOT_BORNEO");

    function setUp() public {
        registry = new CarbonRegistry();
        nft = new CarbonCreditNFT("Carbonyx Verified Carbon Credit", "CARBX");
        stakingLedger = new VerifierStakingLedger();
        escrow = new EscrowSettlement();

        registry.setCarbonCreditNFT(address(nft));
        registry.setVerifierStakingLedger(address(stakingLedger));
        registry.setEscrowSettlement(address(escrow));

        nft.setRegistry(address(registry));
        nft.setEscrowContract(address(escrow));

        stakingLedger.setRegistry(address(registry));
        escrow.setRegistry(address(registry));
        escrow.setCarbonCreditNFT(address(nft));

        vm.deal(verifier, 10 ether);
        vm.deal(buyer, 10 ether);
        vm.deal(issuer, 1 ether);
    }

    function test_VerifierStakingActivation() public {
        vm.prank(verifier);
        stakingLedger.stake{value: 1 ether}();

        assertTrue(stakingLedger.isStaked(verifier));

        (uint256 staked, uint256 rep, uint256 verified, uint256 slashed) = stakingLedger.getVerifierProfile(verifier);
        assertEq(staked, 1 ether);
        assertEq(rep, 100);
        assertEq(verified, 0);
        assertEq(slashed, 0);
    }

    function test_RejectUnstakedVerifierReview() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);
        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);
        registry.recordRiskResult(bundleId, true, false, true);

        vm.prank(verifier);
        vm.expectRevert(abi.encodeWithSelector(CarbonRegistry.InsufficientVerifierStake.selector, verifier));
        registry.recordVerification(bundleId, true);
    }

    function test_StakedVerifierReviewAndMint() public {
        vm.prank(verifier);
        stakingLedger.stake{value: 1 ether}();

        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);
        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);
        registry.recordRiskResult(bundleId, true, false, true);

        vm.prank(verifier);
        registry.recordVerification(bundleId, true);

        uint256 tokenId = registry.mintCredit(bundleId, 1000, 2026);
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), issuer);
    }

    function test_EscrowBuyAndRelease() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);
        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);
        registry.recordRiskResult(bundleId, true, true, false);
        uint256 tokenId = registry.mintCredit(bundleId, 1000, 2026);

        vm.prank(issuer);
        nft.approve(address(escrow), tokenId);

        vm.prank(buyer);
        bytes32 escrowId = escrow.buyWithEscrow{value: 2 ether}(tokenId);

        (,, address seller, uint256 amount, IEscrowSettlement.EscrowStatus status) = escrow.escrows(escrowId);
        assertEq(seller, issuer);
        assertEq(amount, 2 ether);
        assertTrue(status == IEscrowSettlement.EscrowStatus.LOCKED);

        uint256 issuerBalanceBefore = issuer.balance;
        vm.prank(address(this));
        escrow.releaseEscrow(escrowId);

        assertEq(issuer.balance, issuerBalanceBefore + 2 ether);
    }

    function test_DisputeRevocationAndSlashing() public {
        vm.prank(verifier);
        stakingLedger.stake{value: 1 ether}();

        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);
        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);
        registry.recordRiskResult(bundleId, true, false, true);

        vm.prank(verifier);
        registry.recordVerification(bundleId, true);

        uint256 tokenId = registry.mintCredit(bundleId, 1000, 2026);

        registry.disputeCredit(tokenId, "Fraudulent satellite data identified");
        registry.resolveDispute(tokenId, true, "Upheld: satellite canopy over-claimed by 40%");

        (uint256 staked, uint256 rep, , uint256 slashed) = stakingLedger.getVerifierProfile(verifier);
        assertEq(staked, 0.5 ether);
        assertEq(slashed, 0.5 ether);
        assertEq(rep, 70);
    }
}
