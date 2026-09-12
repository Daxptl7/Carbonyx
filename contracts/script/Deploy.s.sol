// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script, console } from "forge-std/Script.sol";
import "../src/CarbonCreditNFT.sol";
import "../src/CarbonRegistry.sol";
import "../src/VerifierStakingLedger.sol";
import "../src/EscrowSettlement.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deploying Carbonyx Protocol Contracts (Phase C3) ===");
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy CarbonCreditNFT
        CarbonCreditNFT nft = new CarbonCreditNFT("Carbonyx Verified Carbon Credit", "CARBX");
        console.log("CarbonCreditNFT deployed at:", address(nft));

        // 2. Deploy VerifierStakingLedger
        VerifierStakingLedger staking = new VerifierStakingLedger();
        console.log("VerifierStakingLedger deployed at:", address(staking));

        // 3. Deploy EscrowSettlement
        EscrowSettlement escrow = new EscrowSettlement();
        console.log("EscrowSettlement deployed at:", address(escrow));

        // 4. Deploy CarbonRegistry
        CarbonRegistry registry = new CarbonRegistry();
        console.log("CarbonRegistry deployed at:", address(registry));

        // 5. Interlink Contracts
        registry.setCarbonCreditNFT(address(nft));
        registry.setVerifierStakingLedger(address(staking));
        registry.setEscrowSettlement(address(escrow));
        registry.setTrustedRelayer(deployer, true);

        nft.setRegistry(address(registry));
        nft.setEscrowContract(address(escrow));

        staking.setRegistry(address(registry));

        escrow.setRegistry(address(registry));
        escrow.setCarbonCreditNFT(address(nft));

        console.log("All 4 Protocol Contracts linked and configured successfully!");

        vm.stopBroadcast();
    }
}
