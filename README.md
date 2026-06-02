# ⚖ LiteWill Vault

> **Trustless Digital Inheritance on LitVM**

LiteWill Vault is a trustless on-chain inheritance protocol built on LitVM LiteForge Testnet — store encrypted secrets, assign heirs with percentage splits, and if you stop checking in, your digital wealth automatically passes to your family.

---

## 🌐 Live App

**[https://lite-will-vault.vercel.app](https://lite-will-vault.vercel.app)**

---

## 🔗 Contract

Deployed on **LitVM LiteForge Testnet (Chain ID: 4441)**

```
0x58f699B5a80e631A6356df0Cb46242f18044E1B7
```

[View on Explorer](https://testnet.litvm.com/address/0x58f699B5a80e631A6356df0Cb46242f18044E1B7)

---

## 💡 The Problem

Every year, billions in crypto assets become permanently inaccessible because private keys die with their owners. Families who should be grieving instead fight over passwords, get locked out of wallets, or watch life savings disappear forever.

There is no trustless, automated way to pass on digital wealth. **LiteWill Vault fixes that.**

---

## ⚙ How It Works

1. **Create a Vault** — deposit encrypted secrets (keys, passwords, documents) and assign heirs with percentage splits
2. **Check In Regularly** — prove you're alive every 7, 14, or 30 days
3. **If You Go Dark** — anyone can mark the vault as claimable after your deadline passes
4. **Heirs Claim** — an heir initiates the claim, a trusted co-signer approves, and after a 3-day safety timelock the inheritance is released

---

## ✨ Key Features

- ⚖ **Percentage-based heir splits** — divide assets fairly among multiple heirs
- 🔐 **Dual-approval release** — heir + co-signer must both approve
- ⏱ **Flexible check-in intervals** — 7, 14, 30 days or custom
- 📧 **Reminder notifications** — email and browser push before deadline
- 💀 **Fully trustless** — no lawyers, no banks, no middlemen
- 🛡 **3-day safety timelock** — prevents rushed or fraudulent claims
- 📁 **Multi-format secrets** — text, crypto keys, files, IPFS links
- 🔒 **Client-side encryption** — raw data never leaves your browser

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | LitVM LiteForge Testnet (Chain ID: 4441) |
| Smart Contract | Solidity 0.8.24 + OpenZeppelin |
| Dev Framework | Hardhat |
| Frontend | React 18 + Vite |
| Wallet | RainbowKit + Wagmi v2 + Viem |
| Encryption | Lit Protocol (Datil-Test) |
| Storage | IPFS (encrypted blobs only) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MetaMask with LitVM LiteForge Testnet added

### Add LitVM to MetaMask

| Field | Value |
|---|---|
| Network Name | LiteForge Testnet |
| RPC URL | https://liteforge.rpc.caldera.xyz/http |
| Chain ID | 4441 |
| Currency | zkLTC |
| Explorer | https://testnet.litvm.com |

### Installation

```bash
# Clone the repo
git clone https://github.com/PRIMEHOMEBOY/Lite-Will-Protocol.git
cd Lite-Will-Protocol

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Start the frontend
npm run dev
```

### Environment Variables

Create a `.env` file in the root:

```env
PRIVATE_KEY=your_private_key
LITVM_RPC_URL=https://liteforge.rpc.caldera.xyz/http
VITE_CONTRACT_ADDRESS=0x58f699B5a80e631A6356df0Cb46242f18044E1B7
VITE_LITVM_RPC_URL=https://liteforge.rpc.caldera.xyz/http
VITE_LITVM_CHAIN_ID=4441
VITE_LITVM_EXPLORER=https://testnet.litvm.com
```

---

## 🔐 Security Model

- Secrets encrypted client-side via Lit Protocol before any upload
- Release requires BOTH heir AND co-signer approval
- 3-day timelock after co-sign before release executes
- ReentrancyGuard on all state-changing functions
- Heir share splits validated to sum to exactly 100%
- Owner can revoke vault at any time while active

---

## 🌍 Built For

LiteWill Vault was built for the LITECOIN ECOSYSTEM — one of the first real-world dApps deployed on LitVM. 

## 👤 Builder

**PRIMEHOMEBOY** — LiteForge Hackathon 2026

---

*⚖ LiteWill Vault
