import emailjs from "@emailjs/browser";

const SERVICE_ID  = "service_z95ljpz";
const TEMPLATE_ID = "template_at28ltj";
const PUBLIC_KEY  = "ubRxFXzP7S6gKHgQa";

emailjs.init(PUBLIC_KEY);

/**
 * Send notification email to a single recipient
 */
async function sendEmail({ to_email, to_name, role, vault_name, owner_name, status, message, cosigner_name, cosigner_contact, heir_details }) {
  if (!to_email || !to_email.includes("@")) return { ok: false, reason: "No valid email" };
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      to_email, to_name, role, vault_name, owner_name,
      status, message, cosigner_name, cosigner_contact, heir_details,
    });
    return { ok: true };
  } catch (err) {
    console.error("EmailJS error:", err);
    return { ok: false, reason: err?.text || "Send failed" };
  }
}

/**
 * Send vault claimable notifications to all heirs and co-signer
 * Called when a vault deadline passes
 */
export async function notifyVaultClaimable(vaultId) {
  try {
    // Load contact data saved during vault creation
    const raw = localStorage.getItem(`lw-contacts-${vaultId}`)
      || localStorage.getItem("lw-contacts-pending");
    if (!raw) return;
    const contacts = JSON.parse(raw);

    const profileRaw = localStorage.getItem("lw-profile");
    const profile    = profileRaw ? JSON.parse(profileRaw) : {};

    const ownerName    = profile.name || "The Vault Owner";
    const vaultName    = contacts.vaultName || `Vault #${vaultId}`;
    const coSignerName = contacts.coSigner?.name || "Co-Signer";
    const coSignerContact = contacts.coSigner?.contact || "—";

    const heirList = (contacts.heirs || [])
      .map((h, i) => `Heir ${i+1}: ${h.name || "—"} | ${h.contact || "—"} | ${h.label || ""} | ${h.address?.slice(0,10)}...`)
      .join("\n");

    // Notify each heir
    for (const heir of (contacts.heirs || [])) {
      if (!heir.contact?.includes("@")) continue;
      await sendEmail({
        to_email:         heir.contact,
        to_name:          heir.name || "Heir",
        role:             "heir",
        vault_name:       vaultName,
        owner_name:       ownerName,
        status:           "CLAIMABLE",
        message:          `${ownerName} has not checked in and their vault is now claimable. As a designated heir, you can now initiate a claim. The co-signer must also approve before release.\n\nYour share: ${(Number(heir.shareBps||0)/100).toFixed(0)}%`,
        cosigner_name:    coSignerName,
        cosigner_contact: coSignerContact,
        heir_details:     heirList,
      });
    }

    // Notify co-signer
    if (contacts.coSigner?.contact?.includes("@")) {
      await sendEmail({
        to_email:         contacts.coSigner.contact,
        to_name:          coSignerName,
        role:             "co-signer",
        vault_name:       vaultName,
        owner_name:       ownerName,
        status:           "CLAIMABLE — APPROVAL REQUIRED",
        message:          `${ownerName} has not checked in and their vault is now claimable. As the designated co-signer, your approval is required to release the vault to the heirs. Please open the LiteWill Protocol app and approve the claim.`,
        cosigner_name:    coSignerName,
        cosigner_contact: coSignerContact,
        heir_details:     heirList,
      });
    }

    // Save contacts permanently under vault ID
    localStorage.setItem(`lw-contacts-${vaultId}`, raw);

  } catch (err) {
    console.error("Notification error:", err);
  }
}

/**
 * Save vault contacts after successful deployment
 */
export function saveVaultContacts(vaultId, contacts) {
  localStorage.setItem(`lw-contacts-${vaultId}`, JSON.stringify(contacts));
  // Clear pending
  localStorage.removeItem("lw-contacts-pending");
}

/**
 * Get vault contacts
 */
export function getVaultContacts(vaultId) {
  try {
    const raw = localStorage.getItem(`lw-contacts-${vaultId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
