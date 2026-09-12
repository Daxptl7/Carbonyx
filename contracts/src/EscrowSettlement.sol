// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IEscrowSettlement } from "./interfaces/IEscrowSettlement.sol";
import { ICarbonCreditNFT } from "./interfaces/ICarbonCreditNFT.sol";

/**
 * @title EscrowSettlement
 * @notice Safe custodial escrow contract for carbon credit purchases with challenge windows.
 */
contract EscrowSettlement is Ownable, IEscrowSettlement {
    address public registry;
    address public nftContract;

    struct Escrow {
        uint256 tokenId;
        address buyer;
        address seller;
        uint256 amount;
        EscrowStatus status;
    }

    mapping(bytes32 => Escrow) public escrows;
    uint256 private _escrowNonce;

    modifier onlyRegistryOrOwner() {
        require(msg.sender == registry || msg.sender == owner(), "Not registry or owner");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
    }

    function setCarbonCreditNFT(address _nftContract) external onlyOwner {
        nftContract = _nftContract;
    }

    function setNFTContract(address _nftContract) external onlyOwner {
        nftContract = _nftContract;
    }

    function buyWithEscrow(uint256 tokenId) external payable override returns (bytes32 escrowId) {
        require(msg.value > 0, "Payment must be > 0");
        require(nftContract != address(0), "NFT contract not configured");

        address currentOwner = IERC721(nftContract).ownerOf(tokenId);
        require(currentOwner != msg.sender, "Cannot buy own credit");

        _escrowNonce++;
        escrowId = keccak256(abi.encodePacked(block.timestamp, msg.sender, tokenId, _escrowNonce));

        escrows[escrowId] = Escrow({
            tokenId: tokenId,
            buyer: msg.sender,
            seller: currentOwner,
            amount: msg.value,
            status: EscrowStatus.LOCKED
        });

        // Set NFT status to ESCROWED
        ICarbonCreditNFT(nftContract).setCreditStatus(tokenId, ICarbonCreditNFT.CreditStatus.ESCROWED);

        emit EscrowCreated(escrowId, tokenId, msg.sender, msg.value);
        return escrowId;
    }

    function releaseEscrow(bytes32 escrowId) external override onlyRegistryOrOwner {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.LOCKED, "Escrow not locked");

        e.status = EscrowStatus.RELEASED;

        // Transfer funds to seller
        (bool sent, ) = payable(e.seller).call{value: e.amount}("");
        require(sent, "Payout to seller failed");

        // Transfer NFT to buyer and set status to ISSUED/TRANSFERRED
        IERC721(nftContract).safeTransferFrom(e.seller, e.buyer, e.tokenId);
        ICarbonCreditNFT(nftContract).setCreditStatus(e.tokenId, ICarbonCreditNFT.CreditStatus.ISSUED);

        emit EscrowReleased(escrowId, e.seller, e.amount);
    }

    function refundEscrow(bytes32 escrowId) external override onlyRegistryOrOwner {
        Escrow storage e = escrows[escrowId];
        require(e.status == EscrowStatus.LOCKED, "Escrow not locked");

        e.status = EscrowStatus.REFUNDED;

        // Return funds to buyer
        (bool sent, ) = payable(e.buyer).call{value: e.amount}("");
        require(sent, "Refund to buyer failed");

        // Restore NFT status for seller
        ICarbonCreditNFT(nftContract).setCreditStatus(e.tokenId, ICarbonCreditNFT.CreditStatus.ISSUED);

        emit EscrowRefunded(escrowId, e.buyer, e.amount);
    }
}
