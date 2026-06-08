import { useAccount } from "wagmi";
import Countdown from "./Countdown";
import { useCheckIn, useHeirs } from "../hooks/useDeadVault";

const STATUS_LABELS=["Active","Claimable","Released","Revoked"];
const STATUS_BADGES=["badge-active","badge-urgent","badge-done","badge-revoked"];

export default function VaultCard({vault,onAction,animDelay=0}){
  const {address}=useAccount();
  const {checkIn,isPending,isConfirming}=useCheckIn();
  const {data:heirs=[]}=useHeirs(vault.id);
  const status=Number(vault.status);
  const deadline=Number(vault.deadline);
  const interval=Number(vault.intervalSeconds);
  const now=Math.floor(Date.now()/1000);
  const isOwner=vault.owner?.toLowerCase()===address?.toLowerCase();
  const isUrgent=status===0&&(deadline-now)<3*86400;
  const isExpired=status===0&&now>deadline;
  const elapsed=now-(deadline-interval);
  const pct=Math.min(100,Math.max(0,(elapsed/interval)*100));
  const pgClass=pct>80?"danger":pct>50?"warn":"safe";

  return(
    <div className="card fade-up" style={{marginBottom:14,animationDelay:`${animDelay}s`,opacity:0}}>
      <div className="row-between" style={{marginBottom:16}}>
        <div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:15,fontWeight:700,letterSpacing:".06em",marginBottom:4}}>{vault.name||"Unnamed Vault"}</div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}><span className="label">{vault.id?`VLT-${String(vault.id).padStart(4,"0")}`:""}</span><span style={{color:"var(--text-muted)"}}>·</span><span className="label">{vault.secretType||"—"}</span></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
          <span className={`badge ${STATUS_BADGES[status]||"badge-active"}`}>{isUrgent?"⚡ URGENT":STATUS_LABELS[status]||"UNKNOWN"}</span>
          <span className="label">{heirs.length} heir{heirs.length!==1?"s":""}</span>
        </div>
      </div>
      {status===0&&(<>
        <div className="label" style={{marginBottom:8}}>{isExpired?"⚠ DEADLINE PASSED":"Time until release"}</div>
        {isExpired?<div style={{color:"var(--accent-text)",fontFamily:"monospace",fontSize:13,marginBottom:16}}>Deadline passed. Heirs may now initiate a claim.</div>:<Countdown deadlineTs={deadline} urgent={isUrgent}/>}
        <div className="progress-track" style={{marginBottom:20}}><div className={`progress-fill ${pgClass}`} style={{width:`${pct}%`}}/></div>
      </>)}
      {status===1&&<div className="alert alert-accent" style={{marginBottom:16}}>Vault is claimable. Awaiting heir claim and co-signer approval.</div>}
      {status===2&&<div className="alert alert-info" style={{marginBottom:16}}>Vault has been fully released to heirs.</div>}
      {status===3&&<div className="alert" style={{background:"rgba(255,255,255,.02)",borderColor:"var(--border)",color:"var(--text-muted)",marginBottom:16}}>This vault has been revoked.</div>}
      <div className="row" style={{flexWrap:"wrap"}}>
        {isOwner&&status===0&&<button className="btn btn-success btn-sm" onClick={()=>checkIn(vault.id)} disabled={isPending||isConfirming}>{isPending||isConfirming?<><span className="spinner"/> Confirming...</>:"✓ Check In"}</button>}
        {status===1&&<button className="btn btn-primary btn-sm" onClick={()=>onAction("claim",vault.id)}>Initiate Claim</button>}
        <button className="btn btn-ghost btn-sm" onClick={()=>onAction("view",vault.id)}>View Details</button>
        {isOwner&&status===0&&<><button className="btn btn-ghost btn-sm" onClick={()=>onAction("edit",vault.id)}>Edit</button><button className="btn btn-danger btn-sm" style={{marginLeft:"auto"}} onClick={()=>onAction("revoke",vault.id)}>Revoke</button></>}
      </div>
    </div>
  );
}
