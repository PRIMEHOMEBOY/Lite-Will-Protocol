import { defineChain } from "viem";
import { createConfig, http } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet, rabbyWallet, coinbaseWallet } from "@rainbow-me/rainbowkit/wallets";

export const litvm = defineChain({
  id: 4441,
  name: "LitVM LiteForge Testnet",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_LITVM_RPC_URL || "https://rpc.litvm-testnet.io"] },
  },
  blockExplorers: {
    default: { name: "LitVM Explorer", url: import.meta.env.VITE_LITVM_EXPLORER || "https://testnet.litvm.com" },
  },
  testnet: true,
});

const connectors = connectorsForWallets(
  [{ groupName: "Recommended", wallets: [metaMaskWallet, rabbyWallet, coinbaseWallet] }],
  { appName: "LiteWill Vault", projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "deadvault" }
);

export const wagmiConfig = createConfig({
  chains: [litvm],
  connectors,
  transports: { [litvm.id]: http() },
});

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
