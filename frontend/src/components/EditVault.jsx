import { useState } from "react";
import { useVault, useHeirs } from "../hooks/useDeadVault";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS } from "../utils/config";
import DeadVaultABI from "../abi/DeadVault.json";

const TABS = ["Content","Settings"];

export default function EditVault({vaultId,onClose,onSaved}){
  const {data:d}=useVault(vaultId);
  const {data:heirs=[]}=useHeirs(vaultId);
  const [activeTab,setActiveTab]=useState("Content");

  // Content fields
  const [secretText,setSecretText]=useState("");
  const [newCID,setNewCID]=useState("");

  // Settings fields
  const [newInterval,setNewInterval]=useState("");
  const [newCoSigner,setNewCoSigner]=useState("");

  const {writeContract,data:hash,isPending}=useWriteContract();
  const {isLoading:isConfirming,isSuccess}=useWaitForTransactionReceipt({hash});

  if(!d)return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:"center",padding:"40px 0",color:"var(--text-muted)",fontFamily:"monospace"}}><span className="spinner"/> Loading...</div>
      </div>
    </div>
  );

  if(isSuccess){onSaved();return null;}

  const vault={name:d[2],secretType:d[5],intervalSeconds:d[6],coSigner:d[9]};
  const currentDays=Math.floor(Number(vault.intervalSeconds)/86400);

  const handleUpdateContent=()=>{
    const cid=secretText||newCID||d[3];
    writeContract({address:CONTRACT_ADDRESS,abi:DeadVaultABI.abi,functionName:"updateEncryptedData",args:[BigInt(vaultId),cid,d[4]]});
  };

  const handleUpdateInterval=()=>{
    const secs=BigInt(Number(newInterval)*86400);
    writeContract({address:CONTRACT_ADDRESS,abi:DeadVaultABI.abi,functionName:"updateInterval",args:[BigInt(vaultId),secs]});
  };

  const handleUpdateCoSigner=()=>{
    writeContract({address:CONTRACT_ADDRESS,abi:DeadVaultABI.abi,functionName:"updateCoSigner",args:[BigInt(vaultId),newCoSigner]});
  };

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:520}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:18}}>✕</button>

        <div style={{fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:700,marginBottom:6}}>Edit Vault</div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"var(--text-muted)",marginBottom:20}}>VLT-{String(vaultId).padStart(4,"0")} · {vault.name}</div>

        {/* Tabs */}
        <div style={{display:"flex",gap:0,borderBottom:"1px solid var(--border)",marginBottom:24}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={{background:"transparent",border:"none",borderBottom:activeTab===t?"2px solid var(--accent)":"2px solid transparent",color:activeTab===t?"var(--accent-text)":"var(--text-muted)",padding:"10px 18px",fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:".18em",textTransform:"uppercase",cursor:"pointer",marginBottom:"-1px"}}>{t}</button>
          ))}
        </div>

        {/* Content tab */}
        {activeTab==="Content"&&(
          <div>
            <div className="alert alert-accent" style={{marginBottom:20}}>
              Updating the secret re-encrypts and replaces the stored content. The current secret will be overwritten.
            </div>
            <div className="field">
              <label className="field-label">New Secret Content</label>
              <textarea className="textarea" placeholder={`Current type: ${vault.secretType}. Enter new content to replace it.`} value={secretText} onChange={e=>setSecretText(e.target.value)}/>
            </div>
            <button className="btn btn-primary btn-full" onClick={handleUpdateContent} disabled={(!secretText&&!newCID)||isPending||isConfirming}>
              {isPending||isConfirming?<><span className="spinner"/> Updating...</>:"Update Secret Content"}
            </button>
          </div>
        )}

        {/* Settings tab */}
        {activeTab==="Settings"&&(
          <div>
            {/* Update check-in interval */}
            <div style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:16,marginBottom:16}}>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:".2em",color:"var(--accent-text)",textTransform:"uppercase",marginBottom:12}}>Check-In Interval</div>
              <div style={{fontFamily:"monospace",fontSize:12,color:"var(--text-dim)",marginBottom:12}}>Current: {currentDays} days</div>
              <div className="field" style={{marginBottom:10}}>
                <label className="field-label">New Interval (days)</label>
                <input className="input" type="number" min="1" max="365" placeholder={`Currently ${currentDays} days`} value={newInterval} onChange={e=>setNewInterval(e.target.value)}/>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleUpdateInterval} disabled={!newInterval||isPending||isConfirming}>
                {isPending||isConfirming?<><span className="spinner"/> Updating...</>:"Update Interval"}
              </button>
            </div>

            {/* Update co-signer */}
            <div style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:16,marginBottom:16}}>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:".2em",color:"var(--accent-text)",textTransform:"uppercase",marginBottom:12}}>Co-Signer</div>
              <div style={{fontFamily:"monospace",fontSize:11,color:"var(--text-dim)",marginBottom:12,wordBreak:"break-all"}}>Current: {vault.coSigner?`${vault.coSigner.slice(0,10)}...${vault.coSigner.slice(-6)}`:"—"}</div>
              <div className="field" style={{marginBottom:10}}>
                <label className="field-label">New Co-Signer Wallet</label>
                <input className="input" placeholder="0x... new co-signer address" value={newCoSigner} onChange={e=>setNewCoSigner(e.target.value)}/>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleUpdateCoSigner} disabled={!newCoSigner||isPending||isConfirming}>
                {isPending||isConfirming?<><span className="spinner"/> Updating...</>:"Update Co-Signer"}
              </button>
            </div>

            <div className="alert alert-warn">
              ⚠ All changes are permanent on-chain. Updating the interval also resets the deadline based on your last check-in.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
