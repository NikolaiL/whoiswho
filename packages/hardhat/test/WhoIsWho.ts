import { expect } from "chai";
import { ethers } from "hardhat";
import { WhoIsWho } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhoIsWho", function () {
  let whoIsWho: WhoIsWho;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const INITIAL_MINT_PRICE = 0; // Free minting
  const TEST_FID = 12345;
  const TEST_TOKEN_URI = "ipfs://QmTest123abc";

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const whoIsWhoFactory = await ethers.getContractFactory("WhoIsWho");
    whoIsWho = (await whoIsWhoFactory.deploy(owner.address, INITIAL_MINT_PRICE)) as WhoIsWho;
    await whoIsWho.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await whoIsWho.owner()).to.equal(owner.address);
    });

    it("Should set the correct initial mint price", async function () {
      expect(await whoIsWho.mintPrice()).to.equal(INITIAL_MINT_PRICE);
    });

    it("Should start token ID at 1", async function () {
      expect(await whoIsWho.getCurrentTokenId()).to.equal(1);
    });

    it("Should have correct name and symbol", async function () {
      expect(await whoIsWho.name()).to.equal("WhoIsWho Profile");
      expect(await whoIsWho.symbol()).to.equal("WHOISWHO");
    });
  });

  describe("Minting", function () {
    it("Should mint an NFT with correct data", async function () {
      const tx = await whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI);
      await tx.wait();

      // Check token was minted
      expect(await whoIsWho.ownerOf(1)).to.equal(user1.address);
      expect(await whoIsWho.tokenURI(1)).to.equal(TEST_TOKEN_URI);
      expect(await whoIsWho.getTokenFid(1)).to.equal(TEST_FID);
      expect(await whoIsWho.getCurrentTokenId()).to.equal(2);
    });

    it("Should record mint timestamp", async function () {
      const tx = await whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const mintTime = await whoIsWho.getTokenMintTime(1);
      expect(mintTime).to.equal(block!.timestamp);
    });

    it("Should track user tokens", async function () {
      await whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI);
      await whoIsWho.connect(user1).mint(TEST_FID + 1, "ipfs://QmTest456");

      const userTokens = await whoIsWho.getUserTokens(user1.address);
      expect(userTokens.length).to.equal(2);
      expect(userTokens[0]).to.equal(1);
      expect(userTokens[1]).to.equal(2);
    });

    it("Should emit Minted event", async function () {
      const tx = await whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(whoIsWho, "Minted")
        .withArgs(1, TEST_FID, user1.address, "QmTest123abc", block!.timestamp);
    });

    it("Should allow multiple mints per user (snapshots)", async function () {
      await whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI);
      await whoIsWho.connect(user1).mint(TEST_FID, "ipfs://QmTest456");
      await whoIsWho.connect(user1).mint(TEST_FID, "ipfs://QmTest789");

      const userTokens = await whoIsWho.getUserTokens(user1.address);
      expect(userTokens.length).to.equal(3);

      // All three tokens should be for the same FID
      expect(await whoIsWho.getTokenFid(1)).to.equal(TEST_FID);
      expect(await whoIsWho.getTokenFid(2)).to.equal(TEST_FID);
      expect(await whoIsWho.getTokenFid(3)).to.equal(TEST_FID);
    });

    it("Should fail with invalid FID", async function () {
      await expect(whoIsWho.connect(user1).mint(0, TEST_TOKEN_URI)).to.be.revertedWith("Invalid FID");
    });

    it("Should fail with empty token URI", async function () {
      await expect(whoIsWho.connect(user1).mint(TEST_FID, "")).to.be.revertedWith("Empty token URI");
    });
  });

  describe("Mint Price", function () {
    it("Should mint successfully with exact payment", async function () {
      const newPrice = ethers.parseEther("0.01");
      await whoIsWho.connect(owner).setMintPrice(newPrice);

      await expect(whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI, { value: newPrice })).to.not.be.reverted;

      expect(await whoIsWho.ownerOf(1)).to.equal(user1.address);
    });

    it("Should mint successfully with overpayment", async function () {
      const newPrice = ethers.parseEther("0.01");
      await whoIsWho.connect(owner).setMintPrice(newPrice);

      const overpayment = ethers.parseEther("0.02");
      await expect(whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI, { value: overpayment })).to.not.be.reverted;
    });

    it("Should fail with insufficient payment", async function () {
      const newPrice = ethers.parseEther("0.01");
      await whoIsWho.connect(owner).setMintPrice(newPrice);

      const underpayment = ethers.parseEther("0.005");
      await expect(whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI, { value: underpayment })).to.be.revertedWith(
        "Insufficient payment",
      );
    });

    it("Should only allow owner to update mint price", async function () {
      const newPrice = ethers.parseEther("0.01");

      await expect(whoIsWho.connect(user1).setMintPrice(newPrice)).to.be.revertedWithCustomError(
        whoIsWho,
        "OwnableUnauthorizedAccount",
      );

      await expect(whoIsWho.connect(owner).setMintPrice(newPrice)).to.not.be.reverted;

      expect(await whoIsWho.mintPrice()).to.equal(newPrice);
    });

    it("Should emit MintPriceUpdated event", async function () {
      const oldPrice = await whoIsWho.mintPrice();
      const newPrice = ethers.parseEther("0.01");

      await expect(whoIsWho.connect(owner).setMintPrice(newPrice))
        .to.emit(whoIsWho, "MintPriceUpdated")
        .withArgs(oldPrice, newPrice);
    });
  });

  describe("Withdrawals", function () {
    it("Should allow owner to withdraw funds", async function () {
      // Set mint price and mint an NFT
      const mintPrice = ethers.parseEther("0.1");
      await whoIsWho.connect(owner).setMintPrice(mintPrice);
      await whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI, { value: mintPrice });

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await whoIsWho.getAddress());

      expect(contractBalance).to.equal(mintPrice);

      const tx = await whoIsWho.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + mintPrice - gasUsed);
      expect(await ethers.provider.getBalance(await whoIsWho.getAddress())).to.equal(0);
    });

    it("Should only allow owner to withdraw", async function () {
      await expect(whoIsWho.connect(user1).withdraw()).to.be.revertedWithCustomError(
        whoIsWho,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should fail if no balance to withdraw", async function () {
      await expect(whoIsWho.connect(owner).withdraw()).to.be.revertedWith("No balance to withdraw");
    });
  });

  describe("Token Queries", function () {
    beforeEach(async function () {
      await whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI);
      await whoIsWho.connect(user2).mint(TEST_FID + 1, "ipfs://QmTest456");
    });

    it("Should return correct FID for token", async function () {
      expect(await whoIsWho.getTokenFid(1)).to.equal(TEST_FID);
      expect(await whoIsWho.getTokenFid(2)).to.equal(TEST_FID + 1);
    });

    it("Should return correct mint time for token", async function () {
      const mintTime1 = await whoIsWho.getTokenMintTime(1);
      const mintTime2 = await whoIsWho.getTokenMintTime(2);

      expect(mintTime1).to.be.gt(0);
      expect(mintTime2).to.be.gte(mintTime1);
    });

    it("Should return empty array for user with no tokens", async function () {
      const userTokens = await whoIsWho.getUserTokens(owner.address);
      expect(userTokens.length).to.equal(0);
    });

    it("Should return correct tokens for each user", async function () {
      const user1Tokens = await whoIsWho.getUserTokens(user1.address);
      const user2Tokens = await whoIsWho.getUserTokens(user2.address);

      expect(user1Tokens.length).to.equal(1);
      expect(user1Tokens[0]).to.equal(1);

      expect(user2Tokens.length).to.equal(1);
      expect(user2Tokens[0]).to.equal(2);
    });
  });

  describe("IPFS Hash Extraction", function () {
    it("Should extract IPFS hash from URI in event", async function () {
      const tx = await whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(whoIsWho, "Minted")
        .withArgs(1, TEST_FID, user1.address, "QmTest123abc", block!.timestamp);
    });

    it("Should handle non-ipfs URI gracefully", async function () {
      const httpUri = "https://example.com/metadata.json";
      const tx = await whoIsWho.connect(user1).mint(TEST_FID, httpUri);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      // Event should still contain the original URI if not ipfs:// format
      await expect(tx).to.emit(whoIsWho, "Minted").withArgs(1, TEST_FID, user1.address, httpUri, block!.timestamp);
    });
  });

  describe("ERC721 Standard Compliance", function () {
    beforeEach(async function () {
      await whoIsWho.connect(user1).mint(TEST_FID, TEST_TOKEN_URI);
    });

    it("Should support transfer", async function () {
      await whoIsWho.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await whoIsWho.ownerOf(1)).to.equal(user2.address);
    });

    it("Should support approval", async function () {
      await whoIsWho.connect(user1).approve(user2.address, 1);
      expect(await whoIsWho.getApproved(1)).to.equal(user2.address);
    });

    it("Should support safe transfer", async function () {
      await whoIsWho.connect(user1)["safeTransferFrom(address,address,uint256)"](user1.address, user2.address, 1);
      expect(await whoIsWho.ownerOf(1)).to.equal(user2.address);
    });
  });
});
