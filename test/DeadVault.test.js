const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time }   = require("@nomicfoundation/hardhat-network-helpers");

describe("DeadVault v2", function () {
  let deadVault;
  let owner, heir1, heir2, coSigner, stranger;
  const INTERVAL     = 30 * 24 * 60 * 60;
  const GRACE        = 7  * 24 * 60 * 60;
  const CREATE_FEE   = ethers.parseEther("0.21");
  const CLAIM_FEE    = ethers.parseEther("0.21");

  beforeEach(async function () {
    [owner, heir1, heir2, coSigner, stranger] = await ethers.getSigners();
    const DeadVault = await ethers.getContractFactory("DeadVault");
    deadVault = await DeadVault.deploy();
    await deadVault.waitForDeployment();
  });

  async function createDefaultVault() {
    return deadVault.connect(owner).createVault(
      "Test Vault", "QmTestCID", "lit-sym-key", "text",
      INTERVAL, GRACE, coSigner.address,
      [heir1.address, heir2.address], [6000, 4000], ["Spouse", "Child"],
      { value: CREATE_FEE }
    );
  }

  describe("Fees", () => {
    it("reverts if creation fee not paid", async () => {
      await expect(
        deadVault.connect(owner).createVault("V","CID","K","text",INTERVAL,GRACE,coSigner.address,[heir1.address],[10000],["H"],{value:0})
      ).to.be.revertedWithCustomError(deadVault,"InsufficientFee");
    });
    it("accepts correct creation fee", async () => {
      await expect(createDefaultVault()).to.emit(deadVault,"VaultCreated");
    });
    it("emits FeePaid on vault creation", async () => {
      await expect(createDefaultVault()).to.emit(deadVault,"FeePaid");
    });
  });

  describe("Grace Period", () => {
    it("cannot trigger claimable during grace period", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + 1);
      // Deadline passed but grace period not over
      await expect(deadVault.connect(heir1).triggerClaimable(1))
        .to.be.revertedWithCustomError(deadVault,"GracePeriodNotOver");
    });
    it("can trigger claimable after grace period", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + GRACE + 1);
      await expect(deadVault.connect(heir1).triggerClaimable(1))
        .to.emit(deadVault,"VaultClaimable");
    });
    it("owner cannot trigger claimable", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + GRACE + 1);
      await expect(deadVault.connect(owner).triggerClaimable(1))
        .to.be.revertedWithCustomError(deadVault,"NotHeirOrCoSigner");
    });
    it("stranger cannot trigger claimable", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + GRACE + 1);
      await expect(deadVault.connect(stranger).triggerClaimable(1))
        .to.be.revertedWithCustomError(deadVault,"NotHeirOrCoSigner");
    });
  });

  describe("Claim with fees", () => {
    it("reverts initiateClaim if fee not paid", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + GRACE + 1);
      await deadVault.connect(heir1).triggerClaimable(1);
      await expect(deadVault.connect(heir1).initiateClaim(1,{value:0}))
        .to.be.revertedWithCustomError(deadVault,"InsufficientFee");
    });
    it("reverts approveClaim if fee not paid", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + GRACE + 1);
      await deadVault.connect(heir1).triggerClaimable(1);
      await deadVault.connect(heir1).initiateClaim(1,{value:CLAIM_FEE});
      await expect(deadVault.connect(coSigner).approveClaim(1,{value:0}))
        .to.be.revertedWithCustomError(deadVault,"InsufficientFee");
    });
  });

  describe("Full flow with fees + grace period", () => {
    it("completes: create → checkin → expire → grace → trigger → claim → cosign → release", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + GRACE + 1);
      await deadVault.connect(heir1).triggerClaimable(1);
      await deadVault.connect(heir1).initiateClaim(1,{value:CLAIM_FEE});
      await deadVault.connect(coSigner).approveClaim(1,{value:CLAIM_FEE});
      await time.increase(3*86400+1);
      await expect(deadVault.connect(heir1).executeRelease(1))
        .to.emit(deadVault,"VaultReleased").withArgs(1,heir1.address,6000);
    });
  });

  describe("View functions", () => {
    it("returns vault creation fee", async () => {
      expect(await deadVault.getVaultCreationFee()).to.equal(CREATE_FEE);
    });
    it("returns claim fee", async () => {
      expect(await deadVault.getClaimFee()).to.equal(CLAIM_FEE);
    });
    it("returns claimableAt correctly", async () => {
      await createDefaultVault();
      const vault = await deadVault.getVault(1);
      const deadline = vault[9];
      const grace    = vault[7];
      expect(await deadVault.claimableAt(1)).to.equal(deadline + grace);
    });
  });
});
