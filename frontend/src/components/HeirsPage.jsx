import { useAccount } from "wagmi";
import { useOwnerVaults, useHeirVaults, useHeirs, useVault } from "../hooks/useDeadVault";

function HeirRow({vaultId}){
  const {data:heirs=[]}=useHeirs(vaultId);
  const {data:d}=useVault(vaultId);
  if(!d||heirs.length===0)return null;
  const vaultName=d[2]||`Vault #${vaultId}`;
  return heirs.map((h,i)=>(
    <div key={`${vaultId}-${i}`} className="card fade-up" style={{marginBottom:12,animationDelay:`${i*0.06}s`,opacity:0}}>
      <div className="row-between">
        <div>
          <div style={{fontFamily:"var(--font-display)",fontSize:14,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:10}}>{h.label||`Heir ${i+1}`}{h.claimed&&<span className="badge badge-done">Claimed</span>}</div>
          <div className="text-mono text-muted" style={{fontSize:11}}>{String(h.wallet).slice(0,10)}...{String(h.wallet).slice(-6)}</div>
          <div className="label" style={{marginTop:6}}>Vault: {vaultName} · VLT-{String(vaultId).padStart(4,"0")}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:28,fontWeight:900,color:"var(--red)"}}>{(Number(h.shareBps)/100).toFixed(0)}%</div>
          <div className="label">share</div>
        </div>
      </div>
    </div>
  ));
}

function CoSignerRow({vaultId}){
  const {data:d}=useVault(vaultId);
  if(!d)return null;
  const coSigner=d[9],vaultName=d[2]||`Vault #${vaultId}`;
  return(
    <div className="card fade-up" style={{marginBottom:12,opacity:0}}>
      <div className="row-between">
        <div>
          <div style={{fontFamily:"var(--font-display)",fontSize:14,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:10}}>Co-Signer<span className="badge" style={{color:"var(--violet)",borderColor:"rgba(167,139,250,.3)",background:"rgba(167,139,250,.08)"}}>CO-SIGNER</span></div>
          <div className="text-mono text-muted" style={{fontSize:11}}>{String(coSigner).slice(0,10)}...{String(coSigner).slice(-6)}</div>
          <div className="label" style={{marginTop:6}}>Vault: {vaultName} · VLT-{String(vaultId).padStart(4,"0")}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:22,fontWeight:700,color:"var(--violet)"}}>✍</div>
          <div className="label">approver</div>
        </div>
      </div>
    </div>
  );
}

export default function HeirsPage(){
  const {isConnected}=useAccount();
  const {data:ownerIds=[]}=useOwnerVaults();
  const {data:heirIds=[]}=useHeirVaults();
  if(!isConnected)return(<div className="empty-state fade-in"><div className="empty-icon">🔌</div><div className="empty-title">Wallet not connected</div></div>);
  return(
    <div className="fade-in">
      {ownerIds.length>0&&(<>
        <div className="section-title"><div className="section-num">↓</div>Heirs on Your Vaults</div>
        {ownerIds.map(id=><HeirRow key={String(id)} vaultId={id}/>)}
        <div className="section-title" style={{marginTop:28}}><div className="section-num">↓</div>Co-Signers on Your Vaults</div>
        {ownerIds.map(id=><CoSignerRow key={`cs-${String(id)}`} vaultId={id}/>)}
      </>)}
      {heirIds.length>0&&(<>
        <div className="section-title" style={{marginTop:36}}><div className="section-num">↓</div>Vaults You're an Heir On</div>
        {heirIds.map(id=><HeirRow key={`h-${String(id)}`} vaultId={id}/>)}
      </>)}
      {ownerIds.length===0&&heirIds.length===0&&(<div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">No heirs registered</div><div style={{color:"var(--text-muted)",fontFamily:"var(--font-mono)",fontSize:11}}>Create a vault to add heirs and co-signers</div></div>)}
    </div>
  );
}
