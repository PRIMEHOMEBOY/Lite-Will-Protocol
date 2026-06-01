import { useState } from "react";
import { useAccount } from "wagmi";
import { useCreateVault } from "../hooks/useDeadVault";

const SECRET_TYPES=[{key:"text",icon:"📝",label:"Encrypted Text"},{key:"keys",icon:"🔑",label:"Crypto Keys"},{key:"file",icon:"📁",label:"File / IPFS"},{key:"ipfs",icon:"🔗",label:"IPFS Link"}];
const INTERVALS=[{label:"7 days",seconds:7*86400},{label:"14 days",seconds:14*86400},{label:"30 days",seconds:30*86400},{label:"Custom",seconds:null}];
const STEPS=["Secret","Heirs","Check-In","Review"];

function StepTrack({step}){
  return(
    <div className="step-track">
      {STEPS.map((s,i)=>(
        <div key={s} className="step-item">
          <div className={`step-line ${i<step?"done":i===step?"active":""}`}/>
          <span className={`step-label-text ${i<step?"done":i===step?"active":""}`}>{s}</span>
        </div>
      ))}
    </div>
  );
}

export default function CreateVault({ onTabChange }) {
  const { isConnected } = useAccount();
  const { createVault, isPending, isConfirming, isSuccess, error } = useCreateVault();
  const [step,setStep]=useState(0);
  const [vaultName,setVaultName]=useState("");
  const [secretType,setSecretType]=useState("text");
  const [secretText,setSecretText]=useState("");
  const [ipfsLink,setIpfsLink]=useState("");
  const [interval,setInterval]=useState(INTERVALS[2]);
  const [customDays,setCustomDays]=useState("");
  const [heirs,setHeirs]=useState([{address:"",pct:100,label:""}]);
  const [coSigner,setCoSigner]=useState("");
  const [notifEmail,setNotifEmail]=useState(true);
  const [notifPush,setNotifPush]=useState(true);
  const [email,setEmail]=useState("");

  if(!isConnected) return(<div className="empty-state fade-in"><div className="empty-icon">🔌</div><div className="empty-title">Wallet not connected</div></div>);

  const totalPct=heirs.reduce((s,h)=>s+Number(h.pct||0),0);
  const pctValid=totalPct===100;
  const addHeir=()=>setHeirs([...heirs,{address:"",pct:0,label:""}]);
  const removeHeir=(i)=>setHeirs(heirs.filter((_,idx)=>idx!==i));
  const updateHeir=(i,f,v)=>{const h=[...heirs];h[i][f]=v;setHeirs(h);};
  const intervalSeconds=interval.seconds?interval.seconds:Number(customDays)*86400;

  const handleDeploy=()=>{
    createVault({
      name:vaultName, encryptedDataCID:secretText||ipfsLink||"QmPlaceholderCID",
      encryptedSymKey:"lit-sym-key-placeholder", secretType, intervalSeconds, coSigner,
      heirWallets:heirs.map(h=>h.address), heirShares:heirs.map(h=>Math.round(Number(h.pct)*100)), heirLabels:heirs.map(h=>h.label||"Heir"),
    });
  };

  if(isSuccess) return(
    <div className="empty-state fade-in">
      <div style={{fontSize:48,marginBottom:16}}>✅</div>
      <div className="empty-title" style={{color:"var(--green)"}}>Vault Deployed!</div>
      <div style={{color:"var(--text-muted)",fontFamily:"var(--font-mono)",fontSize:12,marginBottom:28}}>Your Dead Man's Switch is live on LiteForge Testnet</div>
      <button className="btn btn-success" onClick={()=>onTabChange("Dashboard")}>→ View Dashboard</button>
    </div>
  );

  const step0=(
    <div className="fade-in">
      <div className="field">
        <label className="field-label">Vault Name</label>
        <input className="input" placeholder="e.g. Primary Digital Estate" value={vaultName} onChange={e=>setVaultName(e.target.value)}/>
      </div>
      <div className="section-title" style={{marginTop:28}}><div className="section-num">2</div>Secret Type</div>
      <div className="grid-4" style={{marginBottom:20}}>
        {SECRET_TYPES.map(t=><div key={t.key} className={`secret-type-btn${secretType===t.key?" active":""}`} onClick={()=>setSecretType(t.key)}><span className="secret-type-icon">{t.icon}</span>{t.label}</div>)}
      </div>
      {(secretType==="text"||secretType==="keys")&&(<div className="field"><label className="field-label">{secretType==="keys"?"Seed Phrase / Private Key":"Message / Passwords"}</label><textarea className="textarea" style={secretType==="keys"?{fontFamily:"var(--font-mono)"}:{}} placeholder={secretType==="keys"?"word1 word2 ... word24":"Enter your secret text here"} value={secretText} onChange={e=>setSecretText(e.target.value)}/><div className="field-hint">⚡ Encrypted client-side via Lit Protocol before upload.</div></div>)}
      {secretType==="file"&&(<div className="dropzone"><div style={{fontSize:28,marginBottom:10}}>📁</div><div style={{fontFamily:"var(--font-mono)",fontSize:11,letterSpacing:".2em",color:"var(--text-muted)",textTransform:"uppercase"}}>Drop files or tap to upload</div><div style={{fontSize:10,color:"var(--text-muted)",marginTop:6}}>PDF, DOC, Images · Max 50MB · Stored encrypted on IPFS</div></div>)}
      {secretType==="ipfs"&&(<div className="field"><label className="field-label">IPFS Hash / External Link</label><input className="input" placeholder="ipfs://Qm... or https://" value={ipfsLink} onChange={e=>setIpfsLink(e.target.value)}/></div>)}
      <div className="alert alert-warn" style={{marginTop:24}}>⚠ All secrets are encrypted client-side before storage. Raw data never leaves your browser.</div>
      <button className="btn btn-primary btn-full btn-lg" style={{marginTop:24}} onClick={()=>setStep(1)} disabled={!vaultName.trim()}>Continue → Define Heirs</button>
    </div>
  );

  const step1=(
    <div className="fade-in">
      <div className="section-title"><div className="section-num">1</div>Heir Wallets & Splits</div>
      {heirs.map((heir,i)=>(
        <div key={i} className="heir-row">
          <input className="input" placeholder={`Heir ${i+1} wallet (0x...)`} value={heir.address} onChange={e=>updateHeir(i,"address",e.target.value)}/>
          <input className="input heir-label-input" placeholder="Label" value={heir.label} onChange={e=>updateHeir(i,"label",e.target.value)}/>
          <input className="pct-input" type="number" min="0" max="100" value={heir.pct} onChange={e=>updateHeir(i,"pct",e.target.value)}/>
          <button className="remove-btn" onClick={()=>removeHeir(i)}>×</button>
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontFamily:"var(--font-mono)",color:pctValid?"var(--green)":"var(--red)",marginBottom:8}}>
        <span>{pctValid?"✓ Split valid (100%)":` ⚠ Total: ${totalPct}% — must equal 100%`}</span>
        <span style={{color:"var(--text-muted)"}}>{heirs.length} heir{heirs.length!==1?"s":""}</span>
      </div>
      <button className="add-btn" onClick={addHeir}>+ Add Heir</button>
      <div className="section-title" style={{marginTop:28}}><div className="section-num">2</div>Trusted Co-Signer</div>
      <div className="field">
        <label className="field-label">Co-Signer Wallet Address</label>
        <input className="input" placeholder="0x... attorney, family member, or trusted contact" value={coSigner} onChange={e=>setCoSigner(e.target.value)}/>
        <div className="field-hint">Release requires BOTH heir AND co-signer approval.</div>
      </div>
      <div className="alert alert-info">🔐 Dual approval prevents unauthorized claims.</div>
      <div className="grid-2" style={{marginTop:24}}>
        <button className="btn btn-ghost btn-full" onClick={()=>setStep(0)}>← Back</button>
        <button className="btn btn-primary btn-full" onClick={()=>setStep(2)} disabled={!pctValid||heirs.some(h=>!h.address.trim())||!coSigner.trim()}>Continue →</button>
      </div>
    </div>
  );

  const step2=(
    <div className="fade-in">
      <div className="section-title"><div className="section-num">1</div>Check-In Interval</div>
      <div className="grid-4" style={{marginBottom:16}}>
        {INTERVALS.map(opt=><div key={opt.label} className={`interval-opt${interval.label===opt.label?" active":""}`} onClick={()=>setInterval(opt)}>{opt.label}</div>)}
      </div>
      {interval.label==="Custom"&&(<div className="field"><label className="field-label">Number of Days</label><input className="input" type="number" min="1" max="365" placeholder="e.g. 60" value={customDays} onChange={e=>setCustomDays(e.target.value)}/></div>)}
      <div className="section-title" style={{marginTop:28}}><div className="section-num">2</div>Reminder Notifications</div>
      <div className="row" style={{marginBottom:16}}>
        <div className={`notif-btn${notifEmail?" active":""}`} onClick={()=>setNotifEmail(!notifEmail)}><div style={{marginBottom:4}}>📧 Email</div><div style={{fontSize:9,opacity:.6}}>3 days before</div></div>
        <div className={`notif-btn${notifPush?" active":""}`} onClick={()=>setNotifPush(!notifPush)}><div style={{marginBottom:4}}>🔔 Browser Push</div><div style={{fontSize:9,opacity:.6}}>24 hrs before</div></div>
      </div>
      {notifEmail&&(<div className="field"><label className="field-label">Email Address</label><input className="input" type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>)}
      <div className="grid-2" style={{marginTop:24}}>
        <button className="btn btn-ghost btn-full" onClick={()=>setStep(1)}>← Back</button>
        <button className="btn btn-primary btn-full" onClick={()=>setStep(3)} disabled={interval.label==="Custom"&&(!customDays||Number(customDays)<1)}>Continue → Review</button>
      </div>
    </div>
  );

  const step3=(
    <div className="fade-in">
      <div className="alert alert-danger" style={{marginBottom:24}}>💀 FINAL REVIEW — Once deployed this contract is live on LiteForge Testnet. You must check in every {interval.label==="Custom"?`${customDays} days`:interval.label} or the vault releases.</div>
      <div style={{background:"rgba(255,255,255,.02)",border:"1px solid var(--border)",padding:24,marginBottom:24}}>
        {[["Vault Name",vaultName],["Secret Type",SECRET_TYPES.find(s=>s.key===secretType)?.label],["Heirs",`${heirs.length} wallet${heirs.length!==1?"s":""}`],["Co-Signer",coSigner?`${coSigner.slice(0,8)}...${coSigner.slice(-4)}`:"—"],["Check-In Interval",interval.label==="Custom"?`${customDays} days`:interval.label],["Notifications",[notifEmail&&"Email",notifPush&&"Push"].filter(Boolean).join(", ")||"None"],["Network","LiteForge Testnet (Chain ID: 4441)"],["Release Condition","Heir + Co-Signer dual approval"]].map(([k,v])=>(
          <div key={k} className="review-row"><span className="review-key">{k}</span><span className="review-val">{v}</span></div>
        ))}
      </div>
      {error&&<div className="alert alert-danger" style={{marginBottom:16}}>✕ {error.shortMessage||error.message||"Transaction failed"}</div>}
      <div className="grid-2">
        <button className="btn btn-ghost btn-full" onClick={()=>setStep(2)} disabled={isPending||isConfirming}>← Back</button>
        <button className="btn btn-primary btn-full btn-lg" style={{background:"linear-gradient(135deg,#7f1d1d,#e63946)"}} onClick={handleDeploy} disabled={isPending||isConfirming}>
          {isPending&&<><span className="spinner"/> Confirm in Wallet...</>}
          {isConfirming&&<><span className="spinner"/> Deploying...</>}
          {!isPending&&!isConfirming&&"💀 Deploy Vault to LitVM"}
        </button>
      </div>
    </div>
  );

  return(<div className="fade-in"><StepTrack step={step}/>{[step0,step1,step2,step3][step]}</div>);
}
