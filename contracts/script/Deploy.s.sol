// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script, console } from "forge-std/Script.sol";
import { CarbonCreditNFT } from "../src/CarbonCreditNFT.sol";
import { VerifierStakingLedger } from "../src/VerifierStakingLedger.sol";
import { EscrowSettlement } from "../src/EscrowSettlement.sol";
import { CarbonRegistry } from "../src/CarbonRegistry.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public returns (
        address nftAddress,
        address stakingAddress,
        address escrowAddress,
        address registryAddress
    ) {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying Carbonyx Protocol Suite...");

        // 1. Deploy CarbonCreditNFT
        CarbonCreditNFT nft = new CarbonCreditNFT();
        nftAddress = address(nft);
        console.log("CarbonCreditNFT deployed to:", nftAddress);

        // 2. Deploy VerifierStakingLedger
        VerifierStakingLedger staking = new VerifierStakingLedger();
        stakingAddress = address(staking);
        console.log("VerifierStakingLedger deployed to:", stakingAddress);

        // 3. Deploy EscrowSettlement
        EscrowSettlement escrow = new EscrowSettlement();
        escrowAddress = address(escrow);
        console.log("EscrowSettlement deployed to:", escrowAddress);

        // 4. Deploy CarbonRegistry
        CarbonRegistry registry = new CarbonRegistry(nftAddress, stakingAddress, escrowAddress);
        registryAddress = address(registry);
        console.log("CarbonRegistry deployed to:", registryAddress);

        // 5. Wire authorization
        nft.setRegistry(registryAddress);
        staking.setRegistry(registryAddress);
        escrow.setRegistry(registryAddress);
        escrow.setNFTContract(nftAddress);

        console.log("Carbonyx Protocol Suite wired successfully.");

        vm.stopBroadcast();
    }
}
