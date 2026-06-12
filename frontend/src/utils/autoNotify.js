import { notifyVaultClaimable } from "./email";

const NOTIFIED_KEY = "lw-notified-vaults"; // track which vaults already notified

function getNotifiedVaults() {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function markVaultNotified(vaultId) {
  const notified = getNotifiedVaults();
  if (!notified.includes(String(vaultId))) {
    notified.push(String(vaultId));
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
  }
}

function isVaultNotified(vaultId) {
  return getNotifiedVaults().includes(String(vaultId));
}

/**
 * Check all vaults with saved contacts and send notifications
 * if their deadline has passed. Called on every page load.
 * Works for any visitor — no wallet connection needed.
 */
export async function runAutoNotifications() {
  try {
    const now = Math.floor(Date.now() / 1000);

    // Find all vault contact keys in localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith("lw-contacts-") && k !== "lw-contacts-pending");

    for (const key of keys) {
      const vaultId = key.replace("lw-contacts-", "");
      if (isVaultNotified(vaultId)) continue; // already sent, skip

      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const contacts = JSON.parse(raw);

        // Check if deadline has passed
        const deadline = contacts.deadline;
        if (!deadline) continue;

        if (now > Number(deadline)) {
          console.log(`[AutoNotify] Vault ${vaultId} deadline passed — sending notifications`);
          await notifyVaultClaimable(vaultId);
          markVaultNotified(vaultId);
          console.log(`[AutoNotify] Notifications sent for vault ${vaultId}`);
        }
      } catch (err) {
        console.error(`[AutoNotify] Error for vault ${vaultId}:`, err);
      }
    }
  } catch (err) {
    console.error("[AutoNotify] Error:", err);
  }
}

/**
 * Register vault deadline for auto-notification tracking.
 * Call this when a vault is successfully created.
 */
export function registerVaultDeadline(vaultId, deadline) {
  try {
    const key = `lw-contacts-${vaultId}`;
    const raw = localStorage.getItem(key) || localStorage.getItem("lw-contacts-pending");
    if (!raw) return;
    const contacts = JSON.parse(raw);
    contacts.deadline = deadline;
    contacts.vaultId  = vaultId;
    localStorage.setItem(key, JSON.stringify(contacts));
    localStorage.removeItem("lw-contacts-pending");
  } catch (err) {
    console.error("[AutoNotify] registerVaultDeadline error:", err);
  }
}
