require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY   = process.env.PRIVATE_KEY   || "0x0000000000000000000000000000000000000000000000000000000000000001";
const LITVM_RPC_URL = process.env.LITVM_RPC_URL || "https://rpc.litvm-testnet.io";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true },
  },
  networks: {
    litvm: {
      url:     LITVM_RPC_URL,
      chainId: 4441,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      gas:      "auto",
      timeout:  60000,
    },
    localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
    hardhat:   { chainId: 31337 },
  },
  paths: { sources: "./contracts", tests: "./test", cache: "./cache", artifacts: "./artifacts" },
};
