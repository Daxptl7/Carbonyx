// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test, console } from "forge-std/Test.sol";
import { ICarbonRegistry } from "../src/interfaces/ICarbonRegistry.sol";
import { ICarbonCreditNFT } from "../src/interfaces/ICarbonCreditNFT.sol";
import { IVerifierStakingLedger } from "../src/interfaces/IVerifierStakingLedger.sol";
import { IEscrowSettlement } from "../src/interfaces/IEscrowSettlement.sol";

contract ScaffoldTest is Test {
    function setUp() public {}

    function test_InterfacesCompiles() public {
        assertTrue(true, "All interfaces compiled and referenced successfully");
    }
}
