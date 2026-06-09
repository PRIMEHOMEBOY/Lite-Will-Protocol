import { useState } from "react";
import { useVault, useHeirs } from "../hooks/useDeadVault";
import { useAccount } from "wagmi";

export default function VaultContents({ vaultId, onClose }) {
  const { address } = useAccount();
  const { data: d } = useVault(vaultId);
  const { data: heirs = [] } = useHeirs(vaultId);
  const [revealed, setRevealed] = useState(false);

  if (!d) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",padding:"40px 0",color:"var(--text-muted)",fontFamily:"monospace"}}>
          <span className="spinner"/> Loading...
        </div>
      </div>
    </div>
  );

  // Old contract: d[0]=id, d[1]=owner, d[2]=name, d[3]=encryptedDataCID,
  // d[5]=secretType, d[10]=status
  const vaultName    = d[2];
  const secretData   = d[3]; // The stored secret/CID
  const secretType   = d[5];
  const status       = Number(d[10]);
  const isOwner      = d[1]?.toLowerCase() === address?.toLowerCase();
  const isHeir       = heirs.some(h => String(h.wallet).toLowerCase() === address?.toLowerCase());
  const heirClaimed  = heirs.find(h => String(h.wallet).toLowerCase() === address?.toLowerCase())?.claimed;

  // Only released heirs or owner can see contents
  const canView = isOwner || (isHeir && (status === 1 || status === 2));

  if (!canView) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:18}}>✕</button>
        <div className="alert alert-danger">
          You do not have permission to view this vault's contents. Only heirs with an active or released claim can access the secret.
        </div>
        <button className="btn btn-ghost btn-full btn-sm" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:540}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:18}}>✕</button>

        <div style={{fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:700,marginBottom:6}}>Vault Contents</div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"var(--text-muted)",marginBottom:20}}>
          {vaultName} · {secretType?.toUpperCase()}
        </div>

        {!revealed ? (
          <div>
            <div className="alert alert-warn" style={{marginBottom:20}}>
              ⚠ You are about to view sensitive encrypted data. Make sure you are in a private location before revealing the contents.
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={()=>setRevealed(true)}>
              🔓 Reveal Vault Contents
            </button>
          </div>
        ) : (
          <div>
            <div className="alert alert-success" style={{marginBottom:16}}>
              ✓ Vault contents revealed
            </div>

            {/* Show secret data based on type */}
            {(secretType === "text" || secretType === "keys") && (
              <div>
                <div className="field-label" style={{marginBottom:8}}>
                  {secretType === "keys" ? "Seed Phrase / Private Key" : "Secret Message"}
                </div>
                <div style={{
                  background:"var(--page-bg)",
                  border:"1px solid var(--border-accent)",
                  padding:20,
                  fontFamily:"'Share Tech Mono',monospace",
                  fontSize:14,
                  lineHeight:1.8,
                  wordBreak:"break-all",
                  color:"var(--accent-text)",
                  marginBottom:16,
                  userSelect:"text",
                }}>
                  {secretData || "No content found"}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={()=>{navigator.clipboard?.writeText(secretData||"");}}
                  style={{marginBottom:16}}
                >
                  📋 Copy to Clipboard
                </button>
              </div>
            )}

            {secretType === "links" && (
              <div>
                <div className="field-label" style={{marginBottom:8}}>Links</div>
                <div style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:20,marginBottom:16}}>
                  {(secretData||"").split("\n").filter(Boolean).map((link,i)=>(
                    <div key={i} style={{marginBottom:8}}>
                      <a href={link.startsWith("http")?link:`https://${link}`} target="_blank" rel="noopener noreferrer"
                        style={{color:"var(--accent-text)",fontFamily:"monospace",fontSize:13,wordBreak:"break-all"}}>
                        {link}
                      </a>
                    </div>
                  ))}
                  {!secretData && <div style={{color:"var(--text-muted)",fontFamily:"monospace",fontSize:12}}>No links found</div>}
                </div>
              </div>
            )}

            {secretType === "file" && (
              <div>
                <div className="field-label" style={{marginBottom:8}}>File Reference</div>
                <div style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:20,marginBottom:16}}>
                  <div style={{fontFamily:"monospace",fontSize:13,color:"var(--accent-text)",marginBottom:8,wordBreak:"break-all"}}>
                    {secretData || "No file reference found"}
                  </div>
                  {secretData?.startsWith("Qm") && (
                    <a href={`https://ipfs.io/ipfs/${secretData}`} target="_blank" rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm">
                      🌐 Open on IPFS
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="alert alert-warn" style={{marginTop:8,fontSize:11}}>
              ⚠ Store this information safely. Close this window when done. Do not share your screen.
            </div>

            <button className="btn btn-ghost btn-full btn-sm" style={{marginTop:12}} onClick={onClose}>
              ✓ Done — Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
