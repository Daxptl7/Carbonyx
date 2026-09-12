// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ICarbonCreditNFT } from "./interfaces/ICarbonCreditNFT.sol";

/**
 * @title CarbonCreditNFT
 * @notice Dynamic ERC-721 token representing verified carbon credits with cryptographic provenance.
 */
contract CarbonCreditNFT is ERC721URIStorage, Ownable, ICarbonCreditNFT {
    uint256 private _nextTokenId;
    address public registry;

    struct Credit {
        bytes32 projectId;
        bytes32 bundleId;
        bytes32 merkleRoot;
        uint256 tonnage;
        uint16 vintage;
        CreditStatus status;
        string retirementReason;
    }

    mapping(uint256 => Credit) private _credits;

    modifier onlyRegistryOrOwner() {
        require(msg.sender == registry || msg.sender == owner(), "Caller is not registry or owner");
        _;
    }

    constructor() ERC721("Carbonyx Verified Carbon Credit", "CBNX") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
    }

    function mint(
        address recipient,
        bytes32 projectId,
        bytes32 bundleId,
        bytes32 merkleRoot,
        uint256 tonnage,
        uint16 vintage
    ) external override onlyRegistryOrOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);

        _credits[tokenId] = Credit({
            projectId: projectId,
            bundleId: bundleId,
            merkleRoot: merkleRoot,
            tonnage: tonnage,
            vintage: vintage,
            status: CreditStatus.ISSUED,
            retirementReason: ""
        });

        emit CreditMinted(tokenId, projectId, bundleId, recipient, tonnage);
        return tokenId;
    }

    function setCreditStatus(uint256 tokenId, CreditStatus newStatus) external override onlyRegistryOrOwner {
        require(_ownerOf(tokenId) != address(0), "Credit does not exist");
        _credits[tokenId].status = newStatus;
        emit CreditStatusUpdated(tokenId, newStatus);
    }

    function retireCredit(uint256 tokenId, string calldata retirementReason) external override {
        require(ownerOf(tokenId) == msg.sender || msg.sender == registry, "Not credit owner or registry");
        require(_credits[tokenId].status != CreditStatus.RETIRED, "Already retired");
        require(_credits[tokenId].status != CreditStatus.REVOKED, "Credit revoked");

        _credits[tokenId].status = CreditStatus.RETIRED;
        _credits[tokenId].retirementReason = retirementReason;

        emit CreditRetired(tokenId, msg.sender, retirementReason);
    }

    function getCreditDetails(uint256 tokenId) external view override returns (
        bytes32 projectId,
        bytes32 bundleId,
        bytes32 merkleRoot,
        uint256 tonnage,
        uint16 vintage,
        CreditStatus status
    ) {
        require(_ownerOf(tokenId) != address(0), "Credit does not exist");
        Credit storage c = _credits[tokenId];
        return (c.projectId, c.bundleId, c.merkleRoot, c.tonnage, c.vintage, c.status);
    }

    function getRetirementReason(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Credit does not exist");
        return _credits[tokenId].retirementReason;
    }
}
