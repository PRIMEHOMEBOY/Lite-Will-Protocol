const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   DeadVault v2 — Deploying to LitVM         ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network:  ${network.name} (Chain ID: ${network.chainId})`);

  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);
  console.log(`👛 Deployer: ${deployer.address}`);
  console.log(`💰 Balance:  ${ethers.formatEther(balance)} zkLTC\n`);

  if (balance === 0n) {
    console.error("❌ No zkLTC. Get testnet tokens from Caldera Hub faucet.");
    process.exit(1);
  }

  console.log("🚀 Deploying DeadVault v2...");
  const DeadVault = await ethers.getContractFactory("DeadVault");
  const deadVault = await DeadVault.deploy();
  await deadVault.waitForDeployment();

  const address  = await deadVault.getAddress();
  const deployTx = deadVault.deploymentTransaction();

  console.log("\n✅ DeadVault v2 deployed!");
  console.log(`📄 Contract:    ${address}`);
  console.log(`🔗 Tx Hash:     ${deployTx.hash}`);
  console.log(`💰 Create Fee:  0.21 zkLTC`);
  console.log(`💰 Claim Fee:   0.21 zkLTC`);
  console.log(`🏦 Treasury:    0x1af0e38B4B627BB5d7a071B20E103aEa0380452A`);
  console.log(`\n🌐 Explorer:   https://testnet.litvm.com/address/${address}\n`);

  const info = {
    version:   "v2",
    network:   "LitVM LiteForge Testnet",
    chainId:   network.chainId.toString(),
    address,
    deployer:  deployer.address,
    txHash:    deployTx.hash,
    treasury:  "0x1af0e38B4B627BB5d7a071B20E103aEa0380452A",
    createFee: "0.21 zkLTC",
    claimFee:  "0.21 zkLTC",
    deployedAt: new Date().toISOString(),
  };

  const dir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "litvm-testnet.json"), JSON.stringify(info, null, 2));
  console.log("💾 Saved to deployments/litvm-testnet.json");

  const artifactPath = path.join(__dirname, "../artifacts/contracts/DeadVault.sol/DeadVault.json");
  const frontendPath = path.join(__dirname, "../frontend/src/abi/DeadVault.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    fs.writeFileSync(frontendPath, JSON.stringify({ address, chainId: network.chainId.toString(), abi: artifact.abi }, null, 2));
    console.log("📋 ABI copied to frontend/src/abi/DeadVault.json");
  }

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║  Next: update VITE_CONTRACT_ADDRESS in .env  ║");
  console.log("╚══════════════════════════════════════════════╝\n");
}

main().then(()=>process.exit(0)).catch(err=>{console.error("❌",err);process.exit(1);});
