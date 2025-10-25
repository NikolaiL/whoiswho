//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WhoIsWho
 * @author BuidlGuidl
 * @notice A smart contract for minting Farcaster profile snapshots as NFTs
 * @dev Users can mint multiple snapshots of their profiles over time, stored on IPFS
 */
contract WhoIsWho is ERC721, ERC721URIStorage, Ownable {
    // State Variables
    uint256 public mintPrice;
    uint256 private _nextTokenId = 1;
    
    // Mappings
    mapping(uint256 => uint256) public tokenToFid; // tokenId => FID
    mapping(uint256 => uint256) public tokenMintTime; // tokenId => timestamp
    mapping(address => uint256[]) private _userTokens; // user => tokenIds
    
    // Events
    event Minted(
        uint256 indexed tokenId,
        uint256 indexed fid,
        address indexed owner,
        string ipfsHash,
        uint256 timestamp
    );
    
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    
    /**
     * @notice Constructor
     * @param _owner Address of the contract owner
     * @param _initialMintPrice Initial price to mint an NFT (in wei)
     */
    constructor(address _owner, uint256 _initialMintPrice) 
        ERC721("WhoIsWho Profile", "WHOISWHO") 
        Ownable(_owner) 
    {
        mintPrice = _initialMintPrice;
    }
    
    /**
     * @notice Set the mint price (only owner)
     * @param _newPrice New mint price in wei
     */
    function setMintPrice(uint256 _newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = _newPrice;
        emit MintPriceUpdated(oldPrice, _newPrice);
    }
    
    /**
     * @notice Mint a new profile snapshot NFT
     * @param fid The Farcaster ID of the profile
     * @param _tokenURI The IPFS URI for the token metadata (ipfs://...)
     */
    function mint(uint256 fid, string memory _tokenURI) external payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(fid > 0, "Invalid FID");
        require(bytes(_tokenURI).length > 0, "Empty token URI");
        
        uint256 tokenId = _nextTokenId++;
        uint256 timestamp = block.timestamp;
        
        // Mint the NFT to the caller
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        // Store metadata
        tokenToFid[tokenId] = fid;
        tokenMintTime[tokenId] = timestamp;
        _userTokens[msg.sender].push(tokenId);
        
        // Extract IPFS hash from _tokenURI for event (remove "ipfs://" prefix)
        string memory ipfsHash = _extractIpfsHash(_tokenURI);
        
        emit Minted(tokenId, fid, msg.sender, ipfsHash, timestamp);
    }
    
    /**
     * @notice Get all token IDs owned by a user
     * @param user Address of the user
     * @return Array of token IDs
     */
    function getUserTokens(address user) external view returns (uint256[] memory) {
        return _userTokens[user];
    }
    
    /**
     * @notice Get the FID associated with a token
     * @param tokenId The token ID
     * @return The Farcaster ID
     */
    function getTokenFid(uint256 tokenId) external view returns (uint256) {
        return tokenToFid[tokenId];
    }
    
    /**
     * @notice Get the mint timestamp of a token
     * @param tokenId The token ID
     * @return The timestamp when the token was minted
     */
    function getTokenMintTime(uint256 tokenId) external view returns (uint256) {
        return tokenMintTime[tokenId];
    }
    
    /**
     * @notice Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Get the current token ID counter
     * @return The next token ID that will be minted
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
    
    /**
     * @dev Extract IPFS hash from URI (remove "ipfs://" prefix)
     * @param uri The full IPFS URI
     * @return The hash portion only
     */
    function _extractIpfsHash(string memory uri) private pure returns (string memory) {
        bytes memory uriBytes = bytes(uri);
        if (uriBytes.length > 7) {
            // Check if starts with "ipfs://"
            if (
                uriBytes[0] == 'i' &&
                uriBytes[1] == 'p' &&
                uriBytes[2] == 'f' &&
                uriBytes[3] == 's' &&
                uriBytes[4] == ':' &&
                uriBytes[5] == '/' &&
                uriBytes[6] == '/'
            ) {
                bytes memory hashBytes = new bytes(uriBytes.length - 7);
                for (uint i = 0; i < hashBytes.length; i++) {
                    hashBytes[i] = uriBytes[i + 7];
                }
                return string(hashBytes);
            }
        }
        return uri; // Return as-is if not ipfs:// format
    }
    
    // Required overrides for ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

