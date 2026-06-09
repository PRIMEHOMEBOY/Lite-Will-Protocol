import { useState } from "react";
import { useVault, useHeirs } from "../hooks/useDeadVault";
import { useAccount } from "wagmi";

function tryParseContent(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

export default function VaultContents({ vaultId, onClose }) {
  const { address } = useAccount();
  const { data: d } = useVault(vaultId);
  const { data: heirs = [] } = useHeirs(vaultId);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState("");

  if (!d) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",padding:"40px 0",color:"var(--text-muted)",fontFamily:"monospace"}}>
          <span className="spinner"/> Loading...
        </div>
      </div>
    </div>
  );

  // Old contract indices
  const vaultName  = d[2];
  const secretData = d[3]; // encryptedDataCID — stores all content
  const secretType = d[5];
  const status     = Number(d[10]);
  const isOwner    = d[1]?.toLowerCase() === address?.toLowerCase();
  const myHeirEntry = heirs.find(h => String(h.wallet).toLowerCase() === address?.toLowerCase());
  const isHeir     = !!myHeirEntry;
  const hasClaimed = myHeirEntry?.claimed === true;

  // ── Access rules ──────────────────────────────────────────────────────
  // Owner: always
  // Heir: only after status === Released (2) AND their claimed flag is true
  const canView = isOwner || (isHeir && status === 2 && hasClaimed);
  const claimablButNotReleased = isHeir && status === 1;

  if (!canView && !claimablButNotReleased) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:18}}>✕</button>
        <div className="alert alert-danger" style={{marginBottom:16}}>
          You cannot view this vault's contents yet. Contents are only accessible after the vault has been fully released and your claim has been executed.
        </div>
        <button className="btn btn-ghost btn-full btn-sm" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  if (claimablButNotReleased && !isOwner) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:18}}>✕</button>
        <div className="alert alert-warn" style={{marginBottom:16}}>
          ⏳ The vault is claimable but not yet released. Complete the claim process first — initiate claim, get co-signer approval, wait 3 days, then execute release. Contents will be available after that.
        </div>
        <button className="btn btn-ghost btn-full btn-sm" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  // Try to parse content as JSON (multi-type) or treat as single value
  const parsed = tryParseContent(secretData);

  const copyText = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const CopyBtn = ({ text, id }) => (
    <button
      className="btn btn-ghost btn-sm"
      style={{marginTop:8}}
      onClick={() => copyText(text, id)}
    >
      {copied === id ? "✓ Copied!" : "📋 Copy"}
    </button>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:560,maxHeight:"90vh",overflowY:"auto"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:18}}>✕</button>

        <div style={{fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:700,marginBottom:6}}>Vault Contents</div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"var(--text-muted)",marginBottom:20}}>
          {vaultName}
        </div>

        {!revealed ? (
          <div>
            <div className="alert alert-warn" style={{marginBottom:20}}>
              ⚠ You are about to view sensitive vault contents. Make sure you are in a private, secure location before revealing.
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={()=>setRevealed(true)}>
              🔓 Reveal Vault Contents
            </button>
          </div>
        ) : (
          <div>
            <div className="alert alert-success" style={{marginBottom:20}}>✓ Vault contents unlocked</div>

            {/* ── Multi-type content (JSON) ── */}
            {parsed ? (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {parsed.text && (
                  <div style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:16}}>
                    <div className="field-label" style={{marginBottom:8}}>📝 Secret Message / Text</div>
                    <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:13,lineHeight:1.8,color:"var(--text)",whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{parsed.text}</div>
                    <CopyBtn text={parsed.text} id="text"/>
                  </div>
                )}
                {parsed.keys && (
                  <div style={{background:"var(--page-bg)",border:"1px solid var(--border-accent)",padding:16}}>
                    <div className="field-label" style={{marginBottom:8}}>🔑 Seed Phrase / Private Key</div>
                    <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:14,lineHeight:1.8,color:"var(--accent-text)",wordBreak:"break-all",letterSpacing:"0.05em"}}>{parsed.keys}</div>
                    <CopyBtn text={parsed.keys} id="keys"/>
                  </div>
                )}
                {parsed.links && (
                  <div style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:16}}>
                    <div className="field-label" style={{marginBottom:8}}>🔗 Links</div>
                    {parsed.links.split("\n").filter(Boolean).map((link,i)=>(
                      <div key={i} style={{marginBottom:8}}>
                        <a href={link.startsWith("http")?link:`https://${link}`} target="_blank" rel="noopener noreferrer"
                          style={{color:"var(--accent-text)",fontFamily:"monospace",fontSize:13,wordBreak:"break-all"}}>
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
                {parsed.file && (
                  <div style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:16}}>
                    <div className="field-label" style={{marginBottom:8}}>📁 File</div>
                    <div style={{fontFamily:"monospace",fontSize:13,color:"var(--text)",marginBottom:8}}>{parsed.fileName||parsed.file}</div>
                    {parsed.file.startsWith("Qm") ? (
                      <a href={`https://ipfs.io/ipfs/${parsed.file}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">🌐 Open on IPFS</a>
                    ) : (
                      <div style={{fontFamily:"monospace",fontSize:11,color:"var(--text-muted)"}}>File reference: {parsed.file}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ── Single-type content (legacy) ── */
              <div style={{background:"var(--page-bg)",border:"1px solid var(--border-accent)",padding:20}}>
                <div className="field-label" style={{marginBottom:8}}>
                  {secretType==="keys"?"🔑 Seed Phrase / Private Key":secretType==="links"?"🔗 Links":secretType==="file"?"📁 File":"📝 Secret Content"}
                </div>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:14,lineHeight:1.8,color:"var(--accent-text)",wordBreak:"break-all",whiteSpace:"pre-wrap"}}>
                  {secretData||"No content found"}
                </div>
                {secretData&&<CopyBtn text={secretData} id="single"/>}
              </div>
            )}

            <div className="alert alert-warn" style={{marginTop:16,fontSize:11}}>
              ⚠ Store this information safely. Close this window when done. Never share your screen or take screenshots in public.
            </div>
            <button className="btn btn-ghost btn-full btn-sm" style={{marginTop:12}} onClick={onClose}>✓ Done — Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
