// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEscrowSettlement {
    enum EscrowStatus { LOCKED, RELEASED, REFUNDED }

    event EscrowCreated(bytes32 indexed escrowId, uint256 indexed tokenId, address buyer, uint256 amount);
    event EscrowReleased(bytes32 indexed escrowId, address seller, uint256 amount);
    event EscrowRefunded(bytes32 indexed escrowId, address buyer, uint256 amount);

    function buyWithEscrow(uint256 tokenId) external payable returns (bytes32 escrowId);
    function releaseEscrow(bytes32 escrowId) external;
    function refundEscrow(bytes32 escrowId) external;
}
