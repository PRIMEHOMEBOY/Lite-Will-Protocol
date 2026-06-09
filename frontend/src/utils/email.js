import emailjs from "@emailjs/browser";

const SERVICE_ID  = "service_z95ljpz";
const TEMPLATE_ID = "template_at28ltj";
const PUBLIC_KEY  = "ubRxFXzP7S6gKHgQa";

emailjs.init(PUBLIC_KEY);

async function sendEmail(params) {
  if (!params.to_email || !params.to_email.includes("@")) {
    console.warn("No valid email for:", params.to_name);
    return { ok: false, reason: "No valid email" };
  }
  try {
    // EmailJS sends to the address in the template's "To Email" field.
    // Make sure your EmailJS template has {{to_email}} in the "To Email" field.
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
    return { ok: true };
  } catch (err) {
    console.error("EmailJS error:", err);
    return { ok: false, reason: err?.text || "Send failed" };
  }
}

// Build the claim guide text to include in emails
function buildClaimGuide() {
  return `
STEP-BY-STEP CLAIMING GUIDE
============================

Step 1: Install MetaMask
Download MetaMask from the Google Play Store (by ConsenSys).
Create a new wallet and write down your 12-word recovery phrase safely.

Step 2: Add LiteForge Network to MetaMask
Tap the network at the top → Add Network → Add manually.
Network Name: LiteForge Testnet
RPC URL: https://liteforge.rpc.caldera.xyz/http
Chain ID: 4441
Currency: zkLTC

Step 3: Get free zkLTC tokens
Visit hub.caldera.xyz, connect your MetaMask, select LiteForge Testnet, claim free tokens.

Step 4: Open LiteWill Protocol
Go to https://lite-will-vault.vercel.app in your browser.
Connect your MetaMask wallet.

Step 5: Find and claim your vault
Go to Dashboard. Find the vault under "Vaults Where You Are an Heir".
Tap View Details → Initiate Claim.

Step 6: Wait for co-signer approval
The co-signer must also approve. After approval, a 3-day safety period begins.
After 3 days, return to the app and tap Execute Release.

Need help? Email: liteprotocol@gmail.com
`.trim();
}

/**
 * Send vault claimable notifications automatically when vault is triggered.
 * Called right after triggerClaimable succeeds.
 */
export async function notifyVaultClaimable(vaultId) {
  try {
    const raw = localStorage.getItem(`lw-contacts-${vaultId}`)
      || localStorage.getItem("lw-contacts-pending");
    if (!raw) { console.warn("No contacts found for vault", vaultId); return; }

    const contacts = JSON.parse(raw);
    const profileRaw = localStorage.getItem("lw-profile");
    const profile = profileRaw ? JSON.parse(profileRaw) : {};

    const ownerName       = profile.name || "The Vault Owner";
    const vaultName       = contacts.vaultName || `Vault #${vaultId}`;
    const coSignerName    = contacts.coSigner?.name || "Co-Signer";
    const coSignerContact = contacts.coSigner?.contact || "Not provided";
    const coSignerWallet  = contacts.coSigner?.address
      ? `${contacts.coSigner.address.slice(0,10)}...${contacts.coSigner.address.slice(-6)}`
      : "—";

    const heirList = (contacts.heirs || [])
      .map((h, i) => `Heir ${i+1}: ${h.name||"—"} | ${h.contact||"—"} | Share: ${(Number(h.shareBps||0)/100).toFixed(0)}%`)
      .join("\n");

    const claimGuide = buildClaimGuide();

    // ── Notify each heir ──────────────────────────────────────────────
    for (const heir of (contacts.heirs || [])) {
      if (!heir.contact?.includes("@")) continue;
      await sendEmail({
        to_email:         heir.contact,           // Goes to heir's email
        to_name:          heir.name || "Heir",
        role:             "heir",
        vault_name:       vaultName,
        owner_name:       ownerName,
        status:           "CLAIMABLE — ACTION REQUIRED",
        message:          `${ownerName} has not checked in and their vault "${vaultName}" is now claimable.\n\nAs a designated heir, you can now initiate a claim. Your share is ${(Number(heir.shareBps||0)/100).toFixed(0)}%.\n\nYou will need the co-signer's approval before the vault is released.\n\n${claimGuide}`,
        cosigner_name:    coSignerName,
        cosigner_contact: coSignerContact,
        cosigner_wallet:  coSignerWallet,
        heir_details:     heirList,
      });
    }

    // ── Notify co-signer ──────────────────────────────────────────────
    if (contacts.coSigner?.contact?.includes("@")) {
      await sendEmail({
        to_email:         contacts.coSigner.contact,  // Goes to co-signer's email
        to_name:          coSignerName,
        role:             "co-signer",
        vault_name:       vaultName,
        owner_name:       ownerName,
        status:           "APPROVAL REQUIRED",
        message:          `${ownerName} has not checked in and their vault "${vaultName}" is now claimable.\n\nAs the designated co-signer, your approval is required to release the vault to the heirs.\n\nPlease open LiteWill Protocol and go to Dashboard → "Vaults Where You Are Co-Signer" → Approve Claim.\n\nApp: https://lite-will-vault.vercel.app`,
        cosigner_name:    coSignerName,
        cosigner_contact: coSignerContact,
        cosigner_wallet:  coSignerWallet,
        heir_details:     heirList,
      });
    }

    // Save contacts permanently under vault ID
    localStorage.setItem(`lw-contacts-${vaultId}`, raw);
    localStorage.removeItem("lw-contacts-pending");

  } catch (err) {
    console.error("Notification error:", err);
  }
}

export function saveVaultContacts(vaultId, contacts) {
  localStorage.setItem(`lw-contacts-${vaultId}`, JSON.stringify(contacts));
  localStorage.removeItem("lw-contacts-pending");
}

export function getVaultContacts(vaultId) {
  try {
    const raw = localStorage.getItem(`lw-contacts-${vaultId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
