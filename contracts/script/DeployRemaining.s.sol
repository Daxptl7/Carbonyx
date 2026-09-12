// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script, console } from "forge-std/Script.sol";
import "../src/CarbonRegistry.sol";
import "../src/VerifierStakingLedger.sol";
import "../src/EscrowSettlement.sol";
import "../src/CarbonCreditNFT.sol";

contract DeployRemainingScript is Script {
    // Already deployed CarbonCreditNFT on Sepolia
    address constant NFT_ADDRESS = 0x201cF066262ad3B2544bE085860246cD41BdeC21;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deploying Remaining 3 Carbonyx Contracts ===");
        console.log("Deployer:", deployer);
        console.log("Using existing CarbonCreditNFT at:", NFT_ADDRESS);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy VerifierStakingLedger
        VerifierStakingLedger staking = new VerifierStakingLedger();
        console.log("VerifierStakingLedger deployed at:", address(staking));

        // 2. Deploy EscrowSettlement
        EscrowSettlement escrow = new EscrowSettlement();
        console.log("EscrowSettlement deployed at:", address(escrow));

        // 3. Deploy CarbonRegistry
        CarbonRegistry registry = new CarbonRegistry();
        console.log("CarbonRegistry deployed at:", address(registry));

        // 4. Interlink all contracts
        registry.setCarbonCreditNFT(NFT_ADDRESS);
        registry.setVerifierStakingLedger(address(staking));
        registry.setEscrowSettlement(address(escrow));
        registry.setTrustedRelayer(deployer, true);

        CarbonCreditNFT nft = CarbonCreditNFT(NFT_ADDRESS);
        nft.setRegistry(address(registry));
        nft.setEscrowContract(address(escrow));

        staking.setRegistry(address(registry));

        escrow.setRegistry(address(registry));
        escrow.setCarbonCreditNFT(NFT_ADDRESS);

        console.log("All 3 remaining contracts deployed and fully linked!");

        vm.stopBroadcast();
    }
}
