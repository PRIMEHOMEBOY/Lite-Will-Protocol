import { useState } from "react";
import { useVault, useHeirs } from "../hooks/useDeadVault";
import { useAccount } from "wagmi";

function tryParseJSON(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function Section({ icon, title, children }) {
  return (
    <div style={{
      background: "var(--page-bg)",
      border: "1px solid var(--border)",
      borderRadius: 2,
      overflow: "hidden",
      marginBottom: 14,
    }}>
      <div style={{
        background: "var(--accent-subtle)",
        borderBottom: "1px solid var(--border-accent)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: "var(--accent-text)",
          fontWeight: 700,
        }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="btn btn-ghost btn-sm" onClick={copy} style={{ marginTop: 10 }}>
      {copied ? "✓ Copied!" : "📋 Copy to Clipboard"}
    </button>
  );
}

export default function VaultContents({ vaultId, onClose }) {
  const { address } = useAccount();
  const { data: d } = useVault(vaultId);
  const { data: heirs = [] } = useHeirs(vaultId);
  const [revealed, setRevealed] = useState(false);

  if (!d) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontFamily: "monospace" }}>
          <span className="spinner" /> Loading...
        </div>
      </div>
    </div>
  );

  const vaultName  = d[2];
  const rawContent = d[3]; // encryptedDataCID — stores all content
  const status     = Number(d[10]);
  const isOwner    = d[1]?.toLowerCase() === address?.toLowerCase();
  const myHeir     = heirs.find(h => String(h.wallet).toLowerCase() === address?.toLowerCase());
  const isHeir     = !!myHeir;
  const hasClaimed = myHeir?.claimed === true;

  // Access: owner anytime, heir only after status===2 and claimed
  const canView = isOwner || (isHeir && status === 2 && hasClaimed);
  const isPending = isHeir && status === 1;

  if (!canView && !isPending) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          Vault contents are only accessible after the vault has been fully released and your claim has been executed.
        </div>
        <button className="btn btn-ghost btn-full btn-sm" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  if (isPending && !isOwner) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
        <div className="alert alert-warn" style={{ marginBottom: 16 }}>
          ⏳ Vault is claimable but not yet released. Complete the claim process first, then return here to access the contents.
        </div>
        <button className="btn btn-ghost btn-full btn-sm" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  // Parse content — handle both JSON (new) and plain text (old vaults)
  const parsed = tryParseJSON(rawContent);

  // For old vaults stored as plain text, detect the type and put in right section
  const secretType = d[5];
  let displayText  = "";
  let displayKeys  = "";
  let displayLinks = "";
  let displayFile  = "";

  if (parsed) {
    displayText  = parsed.text  || "";
    displayKeys  = parsed.keys  || "";
    displayLinks = parsed.links || "";
    displayFile  = parsed.file  || "";
  } else {
    // Old vault — single value, put in correct section based on secretType
    if (secretType === "text")  displayText  = rawContent || "";
    if (secretType === "keys")  displayKeys  = rawContent || "";
    if (secretType === "links") displayLinks = rawContent || "";
    if (secretType === "file")  displayFile  = rawContent || "";
    // Fallback — if secretType unknown, show as text
    if (!secretType || !["text","keys","links","file"].includes(secretType)) {
      displayText = rawContent || "";
    }
  }

  const hasAny = displayText || displayKeys || displayLinks || displayFile;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>✕</button>

        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
          Vault Contents
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "var(--text-muted)", marginBottom: 20 }}>
          {vaultName}
        </div>

        {!revealed ? (
          <div>
            <div className="alert alert-warn" style={{ marginBottom: 20 }}>
              ⚠ You are about to view sensitive vault contents. Make sure you are in a private, secure location.
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={() => setRevealed(true)}>
              🔓 Reveal Vault Contents
            </button>
          </div>
        ) : (
          <div>
            <div className="alert alert-success" style={{ marginBottom: 20 }}>
              ✓ Vault unlocked — all contents shown below
            </div>

            {!hasAny && (
              <div className="alert alert-info">No content found in this vault.</div>
            )}

            {/* ── Secret Text ── */}
            {displayText && (
              <Section icon="📝" title="Secret Message / Text">
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: "var(--text)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}>
                  {displayText}
                </div>
                <CopyButton text={displayText} />
              </Section>
            )}

            {/* ── Crypto Keys / Seed Phrase ── */}
            {displayKeys && (
              <Section icon="🔑" title="Crypto Keys / Seed Phrase">
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 15,
                  lineHeight: 2,
                  color: "var(--accent-text)",
                  wordBreak: "break-all",
                  letterSpacing: "0.06em",
                  background: "var(--bg)",
                  padding: "12px 14px",
                  border: "1px solid var(--border-accent)",
                }}>
                  {displayKeys}
                </div>
                <CopyButton text={displayKeys} />
              </Section>
            )}

            {/* ── Files / Documents ── */}
            {displayFile && (
              <Section icon="📁" title="Files / Documents">
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 13,
                  color: "var(--text)",
                  marginBottom: 10,
                  wordBreak: "break-all",
                }}>
                  {parsed?.fileName || displayFile}
                </div>
                {displayFile.startsWith("Qm") || displayFile.startsWith("bafy") ? (
                  <a
                    href={`https://ipfs.io/ipfs/${displayFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    🌐 Open File on IPFS
                  </a>
                ) : (
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>
                    File reference stored. Access through your file storage provider.
                  </div>
                )}
                <CopyButton text={displayFile} />
              </Section>
            )}

            {/* ── Links ── */}
            {displayLinks && (
              <Section icon="🔗" title="Links">
                {displayLinks.split("\n").filter(l => l.trim()).map((link, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <a
                      href={link.trim().startsWith("http") ? link.trim() : `https://${link.trim()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--accent-text)",
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 13,
                        wordBreak: "break-all",
                        display: "block",
                      }}
                    >
                      {link.trim()}
                    </a>
                  </div>
                ))}
                <CopyButton text={displayLinks} />
              </Section>
            )}

            <div className="alert alert-warn" style={{ marginTop: 8, fontSize: 11 }}>
              ⚠ Store this information safely. Close this window when done. Never share your screen in public.
            </div>
            <button className="btn btn-ghost btn-full btn-sm" style={{ marginTop: 12 }} onClick={onClose}>
              ✓ Done — Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
