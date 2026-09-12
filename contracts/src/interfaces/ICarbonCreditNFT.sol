// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ICarbonCreditNFT is IERC721 {
    enum CreditStatus { ISSUED, ESCROWED, TRANSFERRED, RETIRED, DISPUTED, REVOKED }

    event CreditMinted(uint256 indexed tokenId, bytes32 indexed projectId, bytes32 indexed bundleId, address owner, uint256 tonnage);
    event CreditStatusUpdated(uint256 indexed tokenId, CreditStatus newStatus);
    event CreditRetired(uint256 indexed tokenId, address indexed owner, string reason);

    function mint(address recipient, bytes32 projectId, bytes32 bundleId, bytes32 merkleRoot, uint256 tonnage, uint16 vintage) external returns (uint256);
    function setCreditStatus(uint256 tokenId, CreditStatus newStatus) external;
    function retireCredit(uint256 tokenId, string calldata retirementReason) external;
    function getCreditDetails(uint256 tokenId) external view returns (bytes32 projectId, bytes32 bundleId, bytes32 merkleRoot, uint256 tonnage, uint16 vintage, CreditStatus status);
}
