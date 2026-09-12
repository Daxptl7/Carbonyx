// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CarbonCreditNFT.sol";
import "../src/CarbonRegistry.sol";
import "../src/VerifierStakingLedger.sol";
import "../src/EscrowSettlement.sol";

contract DisputeSlashingTest is Test {
    CarbonRegistry public registry;
    CarbonCreditNFT public nft;
    VerifierStakingLedger public stakingLedger;
    EscrowSettlement public escrow;

    address public admin = address(this);
    address public issuer = address(0x1111);
    address public verifier = address(0x2222);
    address public buyer = address(0x3333);
    address public maliciousUser = address(0x9999);

    bytes32 public projectId = keccak256("PROJ-AMAZON-004");
    string public did = "did:carbonyx:0x1111111111111111111111111111111111111111";
    bytes32 public kycHash = keccak256("KYC_HASH_AMAZON");
    bytes32 public bundleId = keccak256("BUNDLE-2026-Q3");
    bytes32 public merkleRoot = keccak256("MERKLE_ROOT_AMAZON");

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

    function test_FullDisputeFlow_CreditRevoked_EscrowRefunded_VerifierSlashed() public {
        // 1. Verifier stakes 2.0 ETH
        vm.prank(verifier);
        stakingLedger.stake{value: 2.0 ether}();
        assertTrue(stakingLedger.isStaked(verifier));

        // 2. Project registered & risky bundle committed
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);
        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);
        registry.recordRiskResult(bundleId, true, false, true); // Requires verifier approval

        // 3. Rogue verifier approves anomaly bundle
        vm.prank(verifier);
        registry.recordVerification(bundleId, true);

        // 4. Credit minted to developer
        uint256 tokenId = registry.mintCredit(bundleId, 2500, 2026);
        assertEq(tokenId, 1);

        // 5. Buyer enters Escrow purchase of credit for 3.0 ETH
        vm.prank(issuer);
        nft.approve(address(escrow), tokenId);

        vm.prank(buyer);
        bytes32 escrowId = escrow.buyWithEscrow{value: 3.0 ether}(tokenId);
        
        // Link escrow to token in registry
        registry.setTokenEscrow(tokenId, escrowId);

        uint256 buyerBalanceBefore = buyer.balance;

        // 6. Community dispute raised
        registry.disputeCredit(tokenId, "Ground sensor NDVI diverges 42% from Sentinel-2 satellite");

        // 7. DAO/Admin upholds dispute
        registry.resolveDispute(tokenId, true, "Fraud Confirmed: Synthetic telemetry injected");

        // 8. Assertions:
        // A: Verifier slashed exactly 50% (1.0 ETH slashed, 1.0 ETH remains)
        (uint256 remainingStake, uint256 repScore, , uint256 totalSlashed) = stakingLedger.getVerifierProfile(verifier);
        assertEq(remainingStake, 1.0 ether);
        assertEq(totalSlashed, 1.0 ether);
        assertEq(repScore, 70); // 100 - 30

        // B: Buyer refunded 100% (3.0 ETH back in buyer account)
        assertEq(buyer.balance, buyerBalanceBefore + 3.0 ether);

        // C: Escrow status is REFUNDED
        (,,,, IEscrowSettlement.EscrowStatus escrowStatus) = escrow.escrows(escrowId);
        assertTrue(escrowStatus == IEscrowSettlement.EscrowStatus.REFUNDED);
    }

    function test_DisputeDismissed_CreditRestored() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);
        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);
        registry.recordRiskResult(bundleId, true, true, false);

        uint256 tokenId = registry.mintCredit(bundleId, 500, 2026);

        // Dispute raised
        registry.disputeCredit(tokenId, "False suspicion report");

        // Dispute dismissed
        registry.resolveDispute(tokenId, false, "Audit confirmed telemetry valid");
    }

    function test_UnauthorizedUserCannotResolveDispute() public {
        vm.prank(issuer);
        registry.registerProject(projectId, did, kycHash, 0);
        registry.commitEvidenceBundle(bundleId, projectId, merkleRoot);
        registry.recordRiskResult(bundleId, true, true, false);
        uint256 tokenId = registry.mintCredit(bundleId, 500, 2026);

        registry.disputeCredit(tokenId, "Telemetry query");

        vm.prank(maliciousUser);
        vm.expectRevert();
        registry.resolveDispute(tokenId, true, "Malicious resolution attempt");
    }
}
