// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script, console } from "forge-std/Script.sol";
import "../src/CarbonCreditNFT.sol";
import "../src/CarbonRegistry.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deploying Carbonyx Protocol Contracts ===");
        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy CarbonCreditNFT
        CarbonCreditNFT nft = new CarbonCreditNFT("Carbonyx Verified Carbon Credit", "CARBX");
        console.log("CarbonCreditNFT deployed at:", address(nft));

        // 2. Deploy CarbonRegistry
        CarbonRegistry registry = new CarbonRegistry();
        console.log("CarbonRegistry deployed at:", address(registry));

        // 3. Link Contracts
        registry.setCarbonCreditNFT(address(nft));
        nft.setRegistry(address(registry));
        registry.setTrustedRelayer(deployer, true);

        console.log("Contracts linked successfully!");

        vm.stopBroadcast();
    }
}
