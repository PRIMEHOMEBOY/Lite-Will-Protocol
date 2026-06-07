const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time }   = require("@nomicfoundation/hardhat-network-helpers");

describe("DeadVault", function () {
  let deadVault;
  let owner, heir1, heir2, coSigner, stranger;
  const INTERVAL = 30 * 24 * 60 * 60;

  beforeEach(async function () {
    [owner, heir1, heir2, coSigner, stranger] = await ethers.getSigners();
    const DeadVault = await ethers.getContractFactory("DeadVault");
    deadVault = await DeadVault.deploy();
    await deadVault.waitForDeployment();
  });

  async function createDefaultVault() {
    return deadVault.connect(owner).createVault(
      "Test Vault", "QmTestCID", "lit-sym-key", "text",
      INTERVAL, coSigner.address,
      [heir1.address, heir2.address], [6000, 4000], ["Spouse", "Child"]
    );
  }

  describe("Deployment", () => {
    it("deploys with zero vaults", async () => {
      expect(await deadVault.totalVaults()).to.equal(0);
    });
  });

  describe("createVault()", () => {
    it("creates vault and emits VaultCreated", async () => {
      await expect(createDefaultVault()).to.emit(deadVault, "VaultCreated").withArgs(1, owner.address, "Test Vault", INTERVAL, 2);
      expect(await deadVault.totalVaults()).to.equal(1);
    });
    it("stores vault data correctly", async () => {
      await createDefaultVault();
      const v = await deadVault.getVault(1);
      expect(v[1]).to.equal(owner.address);
      expect(v[2]).to.equal("Test Vault");
      expect(v[10]).to.equal(0);
    });
    it("stores heirs correctly", async () => {
      await createDefaultVault();
      const heirs = await deadVault.getHeirs(1);
      expect(heirs.length).to.equal(2);
      expect(heirs[0].wallet).to.equal(heir1.address);
      expect(heirs[0].shareBps).to.equal(6000);
    });
    it("reverts if interval too short", async () => {
      await expect(deadVault.connect(owner).createVault("V","CID","K","text",3600,coSigner.address,[heir1.address],[10000],["H"])).to.be.revertedWithCustomError(deadVault,"InvalidInterval");
    });
    it("reverts if shares don't sum to 10000", async () => {
      await expect(deadVault.connect(owner).createVault("V","CID","K","text",INTERVAL,coSigner.address,[heir1.address,heir2.address],[5000,3000],["A","B"])).to.be.revertedWithCustomError(deadVault,"InvalidShareTotal");
    });
    it("reverts with empty encrypted data", async () => {
      await expect(deadVault.connect(owner).createVault("V","","K","text",INTERVAL,coSigner.address,[heir1.address],[10000],["H"])).to.be.revertedWithCustomError(deadVault,"EmptyEncryptedData");
    });
  });

  describe("checkIn()", () => {
    it("resets deadline and emits CheckedIn", async () => {
      await createDefaultVault();
      await time.increase(15 * 86400);
      await expect(deadVault.connect(owner).checkIn(1)).to.emit(deadVault,"CheckedIn");
    });
    it("reverts if called by non-owner", async () => {
      await createDefaultVault();
      await expect(deadVault.connect(stranger).checkIn(1)).to.be.revertedWithCustomError(deadVault,"NotOwner");
    });
  });

  describe("triggerClaimable()", () => {
    it("marks vault claimable after deadline", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + 1);
      await expect(deadVault.connect(stranger).triggerClaimable(1)).to.emit(deadVault,"VaultClaimable");
      expect((await deadVault.getVault(1))[10]).to.equal(1);
    });
    it("reverts if deadline not passed", async () => {
      await createDefaultVault();
      await expect(deadVault.connect(stranger).triggerClaimable(1)).to.be.revertedWithCustomError(deadVault,"DeadlineNotPassed");
    });
  });

  describe("Full claim flow", () => {
    it("completes: trigger → initiate → cosign → timelock → release", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + 1);
      await deadVault.connect(stranger).triggerClaimable(1);
      await expect(deadVault.connect(heir1).initiateClaim(1)).to.emit(deadVault,"ClaimInitiated");
      await expect(deadVault.connect(coSigner).approveClaim(1)).to.emit(deadVault,"ClaimCoSigned");
      await time.increase(3 * 86400 + 1);
      await expect(deadVault.connect(heir1).executeRelease(1)).to.emit(deadVault,"VaultReleased").withArgs(1,heir1.address,6000);
      await deadVault.connect(heir2).executeRelease(1);
      expect((await deadVault.getVault(1))[10]).to.equal(2);
    });
    it("reverts if non-heir initiates claim", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + 1);
      await deadVault.connect(stranger).triggerClaimable(1);
      await expect(deadVault.connect(stranger).initiateClaim(1)).to.be.revertedWithCustomError(deadVault,"NotHeir");
    });
    it("reverts if timelock not expired", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + 1);
      await deadVault.connect(stranger).triggerClaimable(1);
      await deadVault.connect(heir1).initiateClaim(1);
      await deadVault.connect(coSigner).approveClaim(1);
      await expect(deadVault.connect(heir1).executeRelease(1)).to.be.revertedWithCustomError(deadVault,"TimelockNotExpired");
    });
  });

  describe("revokeVault()", () => {
    it("allows owner to revoke", async () => {
      await createDefaultVault();
      await expect(deadVault.connect(owner).revokeVault(1)).to.emit(deadVault,"VaultRevoked").withArgs(1,owner.address);
      expect((await deadVault.getVault(1))[10]).to.equal(3);
    });
    it("reverts if non-owner revokes", async () => {
      await createDefaultVault();
      await expect(deadVault.connect(stranger).revokeVault(1)).to.be.revertedWithCustomError(deadVault,"NotOwner");
    });
  });

  describe("View functions", () => {
    it("returns correct owner vaults", async () => {
      await createDefaultVault(); await createDefaultVault();
      expect((await deadVault.getOwnerVaults(owner.address)).length).to.equal(2);
    });
    it("returns zero timeUntilDeadline after deadline", async () => {
      await createDefaultVault();
      await time.increase(INTERVAL + 1);
      expect(await deadVault.timeUntilDeadline(1)).to.equal(0);
    });
  });
});
