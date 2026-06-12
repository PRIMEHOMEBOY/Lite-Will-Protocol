import { useState } from "react";

const STEPS = [
  {
    title: "What is LiteWill Protocol?",
    content: `You have been named as an heir in a LiteWill Protocol vault. This means someone who cares about you has set aside digital assets — crypto keys, documents, or important files — to be passed on to you.\n\nThis guide will walk you through exactly what to do, step by step. You do not need to know anything about crypto.`,
    action: "I understand — continue",
  },
  {
    title: "Step 1 — Install MetaMask",
    content: `MetaMask is a free digital wallet app. You need it to access the vault.\n\n1. Open the Google Play Store on your phone\n2. Search for "MetaMask"\n3. Install the app by ConsenSys\n4. Open MetaMask and tap "Create a new wallet"\n5. Write down your 12-word recovery phrase on paper and keep it safe\n6. Complete the setup`,
    action: "I have MetaMask installed",
  },
  {
    title: "Step 2 — Add LiteForge Network",
    content: `MetaMask needs to be connected to the LiteForge network where the vault lives.\n\n1. Open MetaMask\n2. Tap the network name at the top (it says "Ethereum Mainnet")\n3. Tap "Add Network"\n4. Tap "Add a network manually"\n5. Fill in these details:\n\nNetwork Name: LiteForge Testnet\nRPC URL: https://liteforge.rpc.caldera.xyz/http\nChain ID: 4441\nCurrency: zkLTC\n\n6. Tap Save`,
    action: "Network added — continue",
  },
  {
    title: "Step 3 — Get Testnet Tokens",
    content: `You need a small amount of zkLTC to pay for the claiming transaction. It is completely free.\n\n1. Open your browser and go to: hub.caldera.xyz\n2. Connect your MetaMask wallet\n3. Select LiteForge Testnet\n4. Tap "Claim" to receive free zkLTC\n5. Wait about 30 seconds`,
    action: "I have zkLTC — continue",
  },
  {
    title: "Step 4 — Open LiteWill Protocol",
    content: `Now you are ready to claim your inheritance.\n\n1. Open your browser and go to:\nhttps://lite-will-protocol.vercel.app\n\n2. Tap "Connect Wallet" in the top right\n3. Select MetaMask and approve the connection\n4. Make sure you are on LiteForge Testnet\n5. Go to "Dashboard" — you should see the vault listed under "Vaults Where You Are an Heir"\n6. Tap "View Details"\n7. Tap "Initiate Claim"`,
    action: "Claim initiated — continue",
  },
  {
    title: "Step 5 — Wait for Co-Signer Approval",
    content: `After you initiate the claim, the co-signer (a trusted person named by the vault owner) must also approve it.\n\nThe co-signer has already been notified by email. Once they approve:\n\n• A 3-day safety period begins\n• After 3 days, you can return to the app and tap "Execute Release"\n• Your share of the vault will be released to you\n\nIf the co-signer does not respond, their approval is automatically waived after the waiver period set by the vault owner.`,
    action: "I understand — finish",
  },
];

export default function ClaimWizard({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <button onClick={onClose} style={{ position:"absolute",top:16,right:16,background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:18 }}>✕</button>

        {/* Progress */}
        <div style={{ display:"flex", gap:4, marginBottom:24 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex:1, height:3, background: i <= step ? "var(--accent)" : "var(--border)", borderRadius:2, transition:"background .3s" }}/>
          ))}
        </div>

        <div className="label" style={{ marginBottom:8 }}>Step {step + 1} of {STEPS.length}</div>
        <div style={{ fontFamily:"'Orbitron',monospace", fontSize:15, fontWeight:700, marginBottom:20, color:"var(--text)" }}>
          {current.title}
        </div>

        <div style={{
          background:"var(--page-bg)", border:"1px solid var(--border)",
          padding:20, marginBottom:24,
          fontFamily:"'Rajdhani',sans-serif", fontSize:14,
          color:"var(--text-dim)", lineHeight:1.8,
          whiteSpace:"pre-line",
        }}>
          {current.content}
        </div>

        <div className="grid-2">
          {step > 0 && (
            <button className="btn btn-ghost btn-full" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <button
            className="btn btn-primary btn-full"
            style={{ gridColumn: step === 0 ? "1 / -1" : "auto" }}
            onClick={() => isLast ? onClose() : setStep(s => s + 1)}
          >
            {isLast ? "✓ Done" : current.action}
          </button>
        </div>
      </div>
    </div>
  );
}
