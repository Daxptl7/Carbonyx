// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/ICarbonCreditNFT.sol";

/**
 * @title CarbonCreditNFT
 * @notice Dynamic ERC-721 token representing verified carbon credits with on-chain metadata and lifecycle states.
 */
contract CarbonCreditNFT is ERC721, Ownable, ICarbonCreditNFT {
    using Strings for uint256;
    using Strings for uint16;

    struct CreditMetadata {
        bytes32 projectId;
        bytes32 bundleId;
        bytes32 merkleRoot;
        uint256 tonnage;
        uint16 vintage;
        CreditStatus status;
        string retirementReason;
        uint256 retiredAt;
    }

    uint256 private _nextTokenId = 1;
    address public registry;
    address public escrowContract;

    mapping(uint256 => CreditMetadata) private _credits;

    error UnauthorizedRegistry(address caller);
    error UnauthorizedCaller(address caller);
    error CreditAlreadyRetired(uint256 tokenId);
    error CreditRevoked(uint256 tokenId);
    error InvalidTokenId(uint256 tokenId);

    modifier onlyRegistry() {
        if (msg.sender != registry && msg.sender != owner()) {
            revert UnauthorizedRegistry(msg.sender);
        }
        _;
    }

    modifier onlyRegistryOrEscrow() {
        if (msg.sender != registry && msg.sender != escrowContract && msg.sender != owner()) {
            revert UnauthorizedCaller(msg.sender);
        }
        _;
    }

    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable(msg.sender) {}

    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
    }

    function setEscrowContract(address _escrow) external onlyOwner {
        escrowContract = _escrow;
    }

    function mint(
        address recipient,
        bytes32 projectId,
        bytes32 bundleId,
        bytes32 merkleRoot,
        uint256 tonnage,
        uint16 vintage
    ) external onlyRegistry returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _safeMint(recipient, tokenId);

        _credits[tokenId] = CreditMetadata({
            projectId: projectId,
            bundleId: bundleId,
            merkleRoot: merkleRoot,
            tonnage: tonnage,
            vintage: vintage,
            status: CreditStatus.ISSUED,
            retirementReason: "",
            retiredAt: 0
        });

        emit CreditMinted(tokenId, projectId, bundleId, recipient, tonnage);
        emit CreditStatusUpdated(tokenId, CreditStatus.ISSUED);

        return tokenId;
    }

    function setCreditStatus(uint256 tokenId, CreditStatus newStatus) external onlyRegistryOrEscrow {
        if (_ownerOf(tokenId) == address(0) && _credits[tokenId].status != CreditStatus.RETIRED) {
            revert InvalidTokenId(tokenId);
        }

        CreditMetadata storage credit = _credits[tokenId];
        if (credit.status == CreditStatus.RETIRED) {
            revert CreditAlreadyRetired(tokenId);
        }
        if (credit.status == CreditStatus.REVOKED) {
            revert CreditRevoked(tokenId);
        }

        credit.status = newStatus;
        emit CreditStatusUpdated(tokenId, newStatus);
    }

    function retireCredit(uint256 tokenId, string calldata retirementReason) external {
        address tokenOwner = ownerOf(tokenId);
        if (msg.sender != tokenOwner && !isApprovedForAll(tokenOwner, msg.sender) && getApproved(tokenId) != msg.sender) {
            revert UnauthorizedCaller(msg.sender);
        }

        CreditMetadata storage credit = _credits[tokenId];
        if (credit.status == CreditStatus.RETIRED) {
            revert CreditAlreadyRetired(tokenId);
        }
        if (credit.status == CreditStatus.REVOKED) {
            revert CreditRevoked(tokenId);
        }

        credit.status = CreditStatus.RETIRED;
        credit.retirementReason = retirementReason;
        credit.retiredAt = block.timestamp;

        _burn(tokenId);

        emit CreditRetired(tokenId, tokenOwner, retirementReason);
        emit CreditStatusUpdated(tokenId, CreditStatus.RETIRED);
    }

    function getCreditDetails(uint256 tokenId)
        external
        view
        returns (
            bytes32 projectId,
            bytes32 bundleId,
            bytes32 merkleRoot,
            uint256 tonnage,
            uint16 vintage,
            CreditStatus status
        )
    {
        CreditMetadata storage credit = _credits[tokenId];
        return (
            credit.projectId,
            credit.bundleId,
            credit.merkleRoot,
            credit.tonnage,
            credit.vintage,
            credit.status
        );
    }

    function getExtendedDetails(uint256 tokenId)
        external
        view
        returns (
            CreditMetadata memory
        )
    {
        return _credits[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        CreditMetadata storage credit = _credits[tokenId];
        
        string memory statusStr;
        if (credit.status == CreditStatus.ISSUED) statusStr = "ISSUED";
        else if (credit.status == CreditStatus.ESCROWED) statusStr = "ESCROWED";
        else if (credit.status == CreditStatus.TRANSFERRED) statusStr = "TRANSFERRED";
        else if (credit.status == CreditStatus.RETIRED) statusStr = "RETIRED";
        else if (credit.status == CreditStatus.DISPUTED) statusStr = "DISPUTED";
        else statusStr = "REVOKED";

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Carbonyx Verified Offset #', tokenId.toString(), '",',
                        '"description": "Cryptographically verified, AI-audited carbon credit certificate issued on Carbonyx Protocol.",',
                        '"attributes": [',
                        '{"trait_type": "Tonnage (tCO2e)", "value": ', credit.tonnage.toString(), '},',
                        '{"trait_type": "Vintage Year", "value": ', uint256(credit.vintage).toString(), '},',
                        '{"trait_type": "Status", "value": "', statusStr, '"},',
                        '{"trait_type": "Merkle Root", "value": "', Strings.toHexString(uint256(credit.merkleRoot), 32), '"}',
                        ']}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}
