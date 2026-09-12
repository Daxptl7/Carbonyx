// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IVerifierStakingLedger } from "./interfaces/IVerifierStakingLedger.sol";

/**
 * @title VerifierStakingLedger
 * @notice Manages staked collateral, reputation scores, slashing, and verifier pool eligibility.
 */
contract VerifierStakingLedger is Ownable, IVerifierStakingLedger {
    uint256 public constant MINIMUM_STAKE = 0.1 ether;
    address public registry;

    struct VerifierProfile {
        uint256 stakedAmount;
        uint256 reputationScore;
        uint256 totalVerified;
        uint256 totalSlashed;
        bool exists;
    }

    mapping(address => VerifierProfile) private _verifiers;

    modifier onlyRegistryOrOwner() {
        require(msg.sender == registry || msg.sender == owner(), "Not registry or owner");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
    }

    function stake() external payable override {
        require(msg.value > 0, "Stake must be > 0");

        VerifierProfile storage profile = _verifiers[msg.sender];
        if (!profile.exists) {
            profile.exists = true;
            profile.reputationScore = 100;
        }

        profile.stakedAmount += msg.value;
        emit VerifierStaked(msg.sender, msg.value);
    }

    function unstake(uint256 amount) external override {
        VerifierProfile storage profile = _verifiers[msg.sender];
        require(profile.stakedAmount >= amount, "Insufficient staked balance");
        require(profile.stakedAmount - amount >= MINIMUM_STAKE || profile.stakedAmount - amount == 0, "Remaining stake must meet minimum or be 0");

        profile.stakedAmount -= amount;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to send ETH");

        emit VerifierUnstaked(msg.sender, amount);
    }

    function slashVerifier(address verifier, uint256 percentage) external override onlyRegistryOrOwner returns (uint256 slashedAmount) {
        require(percentage > 0 && percentage <= 100, "Invalid slash percentage");
        VerifierProfile storage profile = _verifiers[verifier];
        require(profile.stakedAmount > 0, "Verifier has no stake to slash");

        slashedAmount = (profile.stakedAmount * percentage) / 100;
        profile.stakedAmount -= slashedAmount;
        profile.totalSlashed += slashedAmount;

        // Reduce reputation proportionally
        if (profile.reputationScore >= 30) {
            profile.reputationScore -= 30;
        } else {
            profile.reputationScore = 0;
        }

        emit VerifierSlashed(verifier, slashedAmount, bytes32(0));
        emit ReputationUpdated(verifier, profile.reputationScore);
        return slashedAmount;
    }

    function updateReputation(address verifier, bool successfulAudit) external override onlyRegistryOrOwner {
        VerifierProfile storage profile = _verifiers[verifier];
        require(profile.exists, "Verifier does not exist");

        profile.totalVerified++;
        if (successfulAudit) {
            if (profile.reputationScore < 100) {
                profile.reputationScore = profile.reputationScore + 1 > 100 ? 100 : profile.reputationScore + 1;
            }
        } else {
            if (profile.reputationScore > 5) {
                profile.reputationScore -= 5;
            } else {
                profile.reputationScore = 0;
            }
        }

        emit ReputationUpdated(verifier, profile.reputationScore);
    }

    function isStaked(address verifier) external view override returns (bool) {
        return _verifiers[verifier].stakedAmount >= MINIMUM_STAKE;
    }

    function getVerifierProfile(address verifier) external view override returns (
        uint256 stakedAmount,
        uint256 reputationScore,
        uint256 totalVerified,
        uint256 totalSlashed
    ) {
        VerifierProfile storage p = _verifiers[verifier];
        return (p.stakedAmount, p.reputationScore, p.totalVerified, p.totalSlashed);
    }
}
