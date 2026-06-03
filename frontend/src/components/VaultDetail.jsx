import { useState } from "react";
import { useAccount } from "wagmi";
import { useVault,useHeirs,useClaimRequest,useInitiateClaim,useApproveClaim,useExecuteRelease,useTriggerClaimable,useRevokeVault } from "../hooks/useDeadVault";
import Countdown from "./Countdown";
import ClaimWizard from "./ClaimWizard";
import PrintInstructions from "./PrintInstructions";
import { notifyVaultClaimable } from "../utils/email";

const STATUS_LABELS=["Active","Claimable","Released","Revoked"];

export default function VaultDetail({vaultId,onClose}){
  const {address}=useAccount();
  const {data:d}=useVault(vaultId);
  const {data:heirs=[]}=useHeirs(vaultId);
  const {data:claim}=useClaimRequest(vaultId);
  const {triggerClaimable,isPending:isTrigger}=useTriggerClaimable();
  const {initiateClaim,isPending:isInitiate}=useInitiateClaim();
  const {approveClaim,isPending:isApprove}=useApproveClaim();
  const {executeRelease,isPending:isExecute}=useExecuteRelease();
  const {revokeVault,isPending:isRevoke}=useRevokeVault();
  const [showWizard,setShowWizard]=useState(false);
  const [showPrint,setShowPrint]=useState(false);
  const [notifSent,setNotifSent]=useState(false);
  const [notifSending,setNotifSending]=useState(false);

  if(!d)return(<div className="modal-overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",padding:"40px 0",color:"var(--text-muted)",fontFamily:"monospace"}}><span className="spinner"/> Loading...</div></div></div>);

  const vault={id:vaultId,owner:d[1],name:d[2],encryptedDataCID:d[3],secretType:d[5],intervalSeconds:d[6],lastCheckIn:d[7],deadline:d[8],coSigner:d[9],status:d[10],createdAt:d[11]};
  const status=Number(vault.status);
  const isOwner=vault.owner?.toLowerCase()===address?.toLowerCase();
  const isHeir=heirs.some(h=>String(h.wallet).toLowerCase()===address?.toLowerCase());
  const isCoSign=vault.coSigner?.toLowerCase()===address?.toLowerCase();
  const now=Math.floor(Date.now()/1000);
  const isExpired=now>Number(vault.deadline);
  const timelockExpiry=claim?Number(claim.approvedAt)+3*86400:0;
  const timelockDone=now>timelockExpiry;
  const short=(a)=>a?`${a.slice(0,8)}...${a.slice(-6)}`:"—";
  const dateOf=(ts)=>ts?new Date(Number(ts)*1000).toLocaleDateString():"—";

  const handleTriggerAndNotify = async () => {
    triggerClaimable(vaultId);
    // Send email notifications
    setNotifSending(true);
    await notifyVaultClaimable(vaultId);
    setNotifSending(false);
    setNotifSent(true);
  };

  return(
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:560,maxHeight:"90vh",overflowY:"auto"}}>
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:18}}>✕</button>

          <div style={{marginBottom:24}}>
            <div className="label" style={{marginBottom:6}}>VLT-{String(vaultId).padStart(4,"0")} · {vault.secretType}</div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:700,marginBottom:8}}>{vault.name}</div>
            <span className={`badge badge-${["active","urgent","done","revoked"][status]||"active"}`}>{STATUS_LABELS[status]}</span>
          </div>

          <hr className="divider"/>
          {status===0&&(<><div className="label" style={{marginBottom:8}}>Time Until Release</div><Countdown deadlineTs={vault.deadline} urgent={isExpired}/></>)}

          {[["Owner",short(vault.owner)],["Co-Signer",short(vault.coSigner)],["Created",dateOf(vault.createdAt)],["Interval",`${Math.floor(Number(vault.intervalSeconds)/86400)} days`],["Last Check-In",dateOf(vault.lastCheckIn)]].map(([k,v])=>(<div key={k} className="review-row"><span className="review-key">{k}</span><span className="review-val">{v}</span></div>))}

          <hr className="divider"/>
          <div className="label" style={{marginBottom:12}}>Heirs ({heirs.length})</div>
          {heirs.map((h,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"var(--page-bg)",border:"1px solid var(--border)",marginBottom:8}}>
              <div><div style={{fontFamily:"monospace",fontSize:12}}>{h.label||`Heir ${i+1}`}</div><div style={{fontFamily:"monospace",fontSize:10,color:"var(--text-muted)"}}>{short(h.wallet)}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:700,color:"var(--accent)"}}>{(Number(h.shareBps)/100).toFixed(0)}%</span>
                {h.claimed&&<span className="badge badge-done">Claimed</span>}
              </div>
            </div>
          ))}

          {status===1&&claim&&(<><hr className="divider"/><div className="label" style={{marginBottom:12}}>Claim Status</div><div className="alert alert-warn" style={{marginBottom:12}}>Claim initiated by {short(claim.initiatedBy)}{claim.coSignerApproved?` · Co-signer approved · Timelock ${timelockDone?"expired ✓":"pending"}`:" · Awaiting co-signer approval"}</div></>)}

          {notifSent&&<div className="alert alert-success">✓ Email notifications sent to heirs and co-signer</div>}

          <hr className="divider"/>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>

            {/* Heir guide button */}
            {isHeir&&<button className="btn btn-ghost btn-full btn-sm" onClick={()=>setShowWizard(true)}>📋 Claiming Guide (Step-by-Step)</button>}

            {/* Print instructions */}
            {isOwner&&<button className="btn btn-ghost btn-full btn-sm" onClick={()=>setShowPrint(true)}>🖨 Print Heir Instructions</button>}

            {/* Trigger claimable + notify */}
            {status===0&&isExpired&&(
              <button className="btn btn-danger btn-full" onClick={handleTriggerAndNotify} disabled={isTrigger||notifSending}>
                {isTrigger||notifSending?<><span className="spinner"/> {notifSending?"Notifying...":"Confirming..."}</>:"⚡ Trigger Claimable + Notify Heirs"}
              </button>
            )}

            {status===1&&isHeir&&!claim?.initiatedAt&&<button className="btn btn-primary btn-full" onClick={()=>initiateClaim(vaultId)} disabled={isInitiate}>{isInitiate?<><span className="spinner"/> Confirming...</>:"📋 Initiate Claim"}</button>}
            {status===1&&isCoSign&&claim?.initiatedAt&&!claim.coSignerApproved&&<button className="btn btn-success btn-full" onClick={()=>approveClaim(vaultId)} disabled={isApprove}>{isApprove?<><span className="spinner"/> Confirming...</>:"✓ Approve Claim (Co-Signer)"}</button>}
            {status===1&&isHeir&&claim?.coSignerApproved&&timelockDone&&<button className="btn btn-primary btn-full" onClick={()=>executeRelease(vaultId)} disabled={isExecute}>{isExecute?<><span className="spinner"/> Confirming...</>:"🔓 Execute Release"}</button>}
            {status===0&&isOwner&&<button className="btn btn-danger btn-full btn-sm" onClick={()=>{revokeVault(vaultId);onClose();}} disabled={isRevoke}>{isRevoke?<><span className="spinner"/> Revoking...</>:"✕ Revoke Vault"}</button>}
            <button className="btn btn-ghost btn-full btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {showWizard&&<ClaimWizard onClose={()=>setShowWizard(false)}/>}
      {showPrint&&<PrintInstructions vaultId={vaultId} vaultName={vault.name} onClose={()=>setShowPrint(false)}/>}
    </>
  );
}
