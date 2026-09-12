// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVerifierStakingLedger {
    event VerifierStaked(address indexed verifier, uint256 amount);
    event VerifierUnstaked(address indexed verifier, uint256 amount);
    event VerifierSlashed(address indexed verifier, uint256 amount, bytes32 indexed bundleId);
    event ReputationUpdated(address indexed verifier, uint256 newScore);

    function stake() external payable;
    function unstake(uint256 amount) external;
    function slashVerifier(address verifier, uint256 percentage) external returns (uint256 slashedAmount);
    function updateReputation(address verifier, bool successfulAudit) external;
    function isStaked(address verifier) external view returns (bool);
    function getVerifierProfile(address verifier) external view returns (uint256 stakedAmount, uint256 reputationScore, uint256 totalVerified, uint256 totalSlashed);
}
