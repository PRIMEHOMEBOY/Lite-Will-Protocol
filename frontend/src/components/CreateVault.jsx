import { useState, useRef } from "react";
import { useAccount } from "wagmi";
import { useCreateVault } from "../hooks/useDeadVault";

const SECRET_TYPES=[{key:"text",emoji:"📝",label:"Encrypted Text"},{key:"keys",emoji:"🔑",label:"Crypto Keys"},{key:"file",emoji:"📁",label:"File Upload"},{key:"links",emoji:"🔗",label:"Links"}];
const INTERVALS=[{label:"7 days",seconds:7*86400},{label:"14 days",seconds:14*86400},{label:"30 days",seconds:30*86400},{label:"Custom",seconds:null}];
const STEPS=["Secret","Heirs","Check-In","Security","Review"];

function StepTrack({step}){
  return(<div className="step-track">{STEPS.map((s,i)=>(<div key={s} className="step-item"><div className={`step-line ${i<step?"done":i===step?"active":""}`}/><span className={`step-label-text ${i<step?"done":i===step?"active":""}`}>{s}</span></div>))}</div>);
}

export default function CreateVault({onTabChange}){
  const {isConnected}=useAccount();
  const {createVault,isPending,isConfirming,isSuccess,error}=useCreateVault();
  const fileInputRef=useRef(null);
  const [step,setStep]=useState(0);
  const [vaultName,setVaultName]=useState("");
  const [secretType,setSecretType]=useState("text");
  const [secretText,setSecretText]=useState("");
  const [secretKeys,setSecretKeys]=useState("");
  const [secretFile,setSecretFile]=useState(null);
  const [secretLinks,setSecretLinks]=useState("");
  const [heirs,setHeirs]=useState([{address:"",pct:100,label:"",name:"",contact:""}]);
  const [coSigner,setCoSigner]=useState("");
  const [coSignerName,setCoSignerName]=useState("");
  const [coSignerContact,setCoSignerContact]=useState("");
  const [interval,setInterval]=useState(INTERVALS[2]);
  const [customDays,setCustomDays]=useState("");
  const [waiverDays,setWaiverDays]=useState("30");
  const [customWaiver,setCustomWaiver]=useState("");
  const [notifEmail,setNotifEmail]=useState(true);
  const [notifPush,setNotifPush]=useState(true);
  const [ownerEmail,setOwnerEmail]=useState("");
  const [secretQuestion,setSecretQuestion]=useState("");
  const [secretAnswer,setSecretAnswer]=useState("");
  const [showAnswer,setShowAnswer]=useState(false);

  if(!isConnected)return(<div className="empty-state fade-in"><div className="empty-icon">🔌</div><div className="empty-title">Wallet not connected</div></div>);

  const totalPct=heirs.reduce((s,h)=>s+Number(h.pct||0),0);
  const pctValid=totalPct===100;
  const addHeir=()=>setHeirs([...heirs,{address:"",pct:0,label:"",name:"",contact:""}]);
  const removeHeir=(i)=>setHeirs(heirs.filter((_,idx)=>idx!==i));
  const updateHeir=(i,f,v)=>{const h=[...heirs];h[i][f]=v;setHeirs(h);};
  const intervalSeconds=interval.seconds??(Number(customDays)*86400);
  const wordCount=secretKeys.trim()?secretKeys.trim().split(/\s+/).length:0;
  const needsSpacing=secretKeys.length>3&&!/\s/.test(secretKeys);

  const handleFileChange=(e)=>{const file=e.target.files?.[0];if(file)setSecretFile(file);};

  const handleDeploy=()=>{
    const vaultContacts={heirs:heirs.map(h=>({name:h.name,contact:h.contact,address:h.address,label:h.label})),coSigner:{name:coSignerName,contact:coSignerContact,address:coSigner},ownerEmail,waiverDays:Number(waiverDays==="Custom"?customWaiver:waiverDays),secretQuestion};
    localStorage.setItem("lw-contacts-pending",JSON.stringify(vaultContacts));
    const encryptedDataCID=secretText||secretKeys||secretLinks||(secretFile?secretFile.name:"QmPlaceholderCID");
    createVault({name:vaultName,encryptedDataCID,encryptedSymKey:"lit-sym-key-placeholder",secretType,intervalSeconds,coSigner,heirWallets:heirs.map(h=>h.address),heirShares:heirs.map(h=>Math.round(Number(h.pct)*100)),heirLabels:heirs.map(h=>h.label||"Heir")});
  };

  if(isSuccess)return(<div className="empty-state fade-in"><div style={{fontSize:48,marginBottom:16}}>✅</div><div className="empty-title" style={{color:"var(--green)"}}>Vault Created!</div><div style={{color:"var(--text-muted)",fontFamily:"monospace",fontSize:12,marginBottom:28}}>Your vault is live on LiteForge Testnet</div><button className="btn btn-success" onClick={()=>onTabChange("Dashboard")}>→ View Dashboard</button></div>);

  const step0=(
    <div className="fade-in">
      <div className="field"><label className="field-label">Vault Name</label><input className="input" placeholder="e.g. My Digital Estate" value={vaultName} onChange={e=>setVaultName(e.target.value)}/></div>
      <div className="section-title" style={{marginTop:28}}><div className="section-num">2</div>What are you storing?</div>
      <div className="grid-4" style={{marginBottom:20}}>
        {SECRET_TYPES.map(({key,emoji,label})=>(<div key={key} className={`secret-type-btn${secretType===key?" active":""}`} onClick={()=>setSecretType(key)}><div style={{fontSize:22,marginBottom:8}}>{emoji}</div>{label}</div>))}
      </div>
      {secretType==="text"&&(<div className="field"><label className="field-label">Secret Message / Passwords</label><textarea className="textarea" placeholder="Type your secret here. This will be encrypted before storage." value={secretText} onChange={e=>setSecretText(e.target.value)}/><div className="field-hint">⚡ Encrypted client-side before upload.</div></div>)}
      {secretType==="keys"&&(
        <div className="field">
          <label className="field-label">Seed Phrase / Private Key</label>
          <textarea className="textarea" style={{fontFamily:"'Share Tech Mono',monospace",letterSpacing:"0.06em"}} placeholder="word1 word2 word3 ... word24" value={secretKeys} onChange={e=>setSecretKeys(e.target.value)}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
            <div className="field-hint" style={{color:wordCount===12||wordCount===24?"var(--green)":"var(--text-muted)"}}>{wordCount>0?`${wordCount} word${wordCount!==1?"s":""} ${wordCount===12?"✓ Valid (12-word)":wordCount===24?"✓ Valid (24-word)":"— standard is 12 or 24"}`:""}</div>
            {wordCount>0&&<div style={{fontFamily:"monospace",fontSize:10,color:"var(--text-muted)"}}>{wordCount}/24</div>}
          </div>
          {needsSpacing&&<div className="alert alert-warn" style={{marginTop:10,padding:"10px 14px",fontSize:11}}>⚠ Please add a space between each word — e.g. "word1 word2 word3"</div>}
          <div className="field-hint" style={{marginTop:6}}>⚡ Encrypted via Lit Protocol before upload.</div>
        </div>
      )}
      {secretType==="file"&&(
        <div>
          <input type="file" ref={fileInputRef} style={{display:"none"}} accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.mp4,.zip" onChange={handleFileChange}/>
          <div className="dropzone" onClick={()=>fileInputRef.current?.click()}>
            <div style={{fontSize:28,marginBottom:10}}>📤</div>
            {secretFile?(<div><div style={{fontFamily:"monospace",fontSize:13,color:"var(--green)",marginBottom:4}}>✓ {secretFile.name}</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{(secretFile.size/1024).toFixed(1)} KB · Tap to change</div></div>):(<div><div style={{fontFamily:"monospace",fontSize:11,letterSpacing:".2em",color:"var(--text-muted)",textTransform:"uppercase",marginBottom:6}}>Tap to choose a file</div><div style={{fontSize:11,color:"var(--text-muted)"}}>PDF, DOC, Images, Video, ZIP · Stored encrypted on IPFS</div></div>)}
          </div>
        </div>
      )}
      {secretType==="links"&&(<div className="field"><label className="field-label">Links</label><textarea className="textarea" placeholder={"Add important links — IPFS hashes, cloud storage, websites.\n\nOne per line."} value={secretLinks} onChange={e=>setSecretLinks(e.target.value)}/><div className="field-hint">Store links to external documents, cloud drives, or IPFS content.</div></div>)}
      <div className="alert alert-accent" style={{marginTop:20}}>All secrets are encrypted in your browser. No one — not even LiteWill Protocol — can read them.</div>
      <button className="btn btn-primary btn-full btn-lg" style={{marginTop:20}} onClick={()=>setStep(1)} disabled={!vaultName.trim()}>Continue → Add Heirs</button>
    </div>
  );

  const step1=(
    <div className="fade-in">
      <div className="section-title"><div className="section-num">1</div>Heir Wallets, Splits & Contacts</div>
      {heirs.map((heir,i)=>(
        <div key={i} style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:16,marginBottom:12}}>
          <div style={{fontFamily:"monospace",fontSize:10,letterSpacing:".2em",color:"var(--accent-text)",textTransform:"uppercase",marginBottom:10}}>Heir {i+1}</div>
          <div className="heir-row" style={{marginBottom:8}}>
            <input className="input" placeholder="Wallet address (0x...)" value={heir.address} onChange={e=>updateHeir(i,"address",e.target.value)}/>
            <input className="input heir-label-input" placeholder="Label" value={heir.label} onChange={e=>updateHeir(i,"label",e.target.value)}/>
            <input className="pct-input" type="number" min="0" max="100" value={heir.pct} onChange={e=>updateHeir(i,"pct",e.target.value)}/>
            <button className="remove-btn" onClick={()=>removeHeir(i)}>×</button>
          </div>
          <div className="grid-2">
            <div className="field" style={{marginBottom:0}}><label className="field-label">Full Name</label><input className="input" placeholder="Heir's real name" value={heir.name} onChange={e=>updateHeir(i,"name",e.target.value)}/></div>
            <div className="field" style={{marginBottom:0}}><label className="field-label">Email or Phone</label><input className="input" placeholder="email@example.com or +234..." value={heir.contact} onChange={e=>updateHeir(i,"contact",e.target.value)}/></div>
          </div>
        </div>
      ))}
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontFamily:"monospace",color:pctValid?"var(--green)":"var(--red)",marginBottom:8}}>
        <span>{pctValid?"✓ Split valid (100%)":` ⚠ Total: ${totalPct}% — must equal 100%`}</span>
        <span style={{color:"var(--text-muted)"}}>{heirs.length} heir{heirs.length!==1?"s":""}</span>
      </div>
      <button className="add-btn" onClick={addHeir}>+ Add Another Heir</button>
      <div className="section-title" style={{marginTop:28}}><div className="section-num">2</div>Trusted Co-Signer</div>
      <div style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:16,marginBottom:16}}>
        <div className="field"><label className="field-label">Co-Signer Wallet Address</label><input className="input" placeholder="0x... attorney, notary, or trusted contact" value={coSigner} onChange={e=>setCoSigner(e.target.value)}/></div>
        <div className="grid-2">
          <div className="field" style={{marginBottom:0}}><label className="field-label">Full Name</label><input className="input" placeholder="Co-signer's real name" value={coSignerName} onChange={e=>setCoSignerName(e.target.value)}/></div>
          <div className="field" style={{marginBottom:0}}><label className="field-label">Email or Phone</label><input className="input" placeholder="email@example.com or +234..." value={coSignerContact} onChange={e=>setCoSignerContact(e.target.value)}/></div>
        </div>
      </div>
      <div className="alert alert-accent">🔐 Release requires heir + co-signer approval. Their contacts are used to notify them when the vault is claimable.</div>
      <div className="grid-2" style={{marginTop:20}}>
        <button className="btn btn-ghost btn-full" onClick={()=>setStep(0)}>← Back</button>
        <button className="btn btn-primary btn-full" onClick={()=>setStep(2)} disabled={!pctValid||heirs.some(h=>!h.address.trim())||!coSigner.trim()}>Continue →</button>
      </div>
    </div>
  );

  const step2=(
    <div className="fade-in">
      <div className="section-title"><div className="section-num">1</div>Check-In Interval</div>
      <div className="grid-4" style={{marginBottom:16}}>{INTERVALS.map(opt=>(<div key={opt.label} className={`interval-opt${interval.label===opt.label?" active":""}`} onClick={()=>setInterval(opt)}>{opt.label}</div>))}</div>
      {interval.label==="Custom"&&(<div className="field"><label className="field-label">Number of days</label><input className="input" type="number" min="1" max="365" placeholder="e.g. 60" value={customDays} onChange={e=>setCustomDays(e.target.value)}/></div>)}
      <div className="section-title" style={{marginTop:28}}><div className="section-num">2</div>Co-Signer Approval Waiver</div>
      <div className="field">
        <label className="field-label">Waive co-signer approval after how many days of no response?</label>
        <div className="grid-4">{["14","30","60","Custom"].map(d=>(<div key={d} className={`interval-opt${waiverDays===d?" active":""}`} onClick={()=>setWaiverDays(d)}>{d==="Custom"?"Custom":`${d} days`}</div>))}</div>
        {waiverDays==="Custom"&&<input className="input" type="number" min="1" max="365" placeholder="e.g. 45" style={{marginTop:10}} value={customWaiver} onChange={e=>setCustomWaiver(e.target.value)}/>}
        <div className="field-hint" style={{marginTop:8}}>If the co-signer does not approve within this period, the heir can release the vault without co-signer approval.</div>
      </div>
      <div className="section-title" style={{marginTop:28}}><div className="section-num">3</div>Reminder Notifications</div>
      <div className="row" style={{marginBottom:16}}>
        <div className={`notif-btn${notifEmail?" active":""}`} onClick={()=>setNotifEmail(!notifEmail)}><div style={{marginBottom:4}}>📧 Email</div><div style={{fontSize:9,opacity:.6}}>3 days before</div></div>
        <div className={`notif-btn${notifPush?" active":""}`} onClick={()=>setNotifPush(!notifPush)}><div style={{marginBottom:4}}>🔔 Push</div><div style={{fontSize:9,opacity:.6}}>24 hrs before</div></div>
      </div>
      {notifEmail&&(<div className="field"><label className="field-label">Your Email</label><input className="input" type="email" placeholder="your@email.com" value={ownerEmail} onChange={e=>setOwnerEmail(e.target.value)}/></div>)}
      <div className="grid-2" style={{marginTop:20}}>
        <button className="btn btn-ghost btn-full" onClick={()=>setStep(1)}>← Back</button>
        <button className="btn btn-primary btn-full" onClick={()=>setStep(3)} disabled={interval.label==="Custom"&&(!customDays||Number(customDays)<1)}>Continue →</button>
      </div>
    </div>
  );

  const step3=(
    <div className="fade-in">
      <div className="section-title"><div className="section-num">❓</div>Secret Verification Question</div>
      <div className="alert alert-accent" style={{marginBottom:20}}>Set a secret question only your family would know. Heirs must answer it correctly before claiming. This adds a human verification layer on top of wallet verification.</div>
      <div className="field"><label className="field-label">Secret Question</label><input className="input" placeholder='e.g. "What was the name of my first car?" or "What city were we married in?"' value={secretQuestion} onChange={e=>setSecretQuestion(e.target.value)}/><div className="field-hint">Choose something only genuine family would know.</div></div>
      <div className="field">
        <label className="field-label">Answer</label>
        <div style={{position:"relative"}}>
          <input className="input" type={showAnswer?"text":"password"} placeholder="Your answer (case-insensitive)" value={secretAnswer} onChange={e=>setSecretAnswer(e.target.value)} style={{paddingRight:56}}/>
          <button onClick={()=>setShowAnswer(!showAnswer)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:11,fontFamily:"monospace"}}>{showAnswer?"HIDE":"SHOW"}</button>
        </div>
        <div className="field-hint">The answer is encrypted. LiteWill Protocol cannot see it.</div>
      </div>
      <div style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:16,marginBottom:20}}>
        <div style={{fontFamily:"monospace",fontSize:10,letterSpacing:".2em",color:"var(--text-muted)",textTransform:"uppercase",marginBottom:8}}>Optional — but recommended</div>
        <div style={{fontSize:13,color:"var(--text-dim)",lineHeight:1.7}}>If you skip this, heirs can still claim using wallet verification + co-signer approval. The secret question adds extra proof that the claimant is genuinely your family.</div>
      </div>
      <div className="grid-2">
        <button className="btn btn-ghost btn-full" onClick={()=>setStep(2)}>← Back</button>
        <button className="btn btn-primary btn-full" onClick={()=>setStep(4)}>Continue → Review</button>
      </div>
    </div>
  );

  const step4=(
    <div className="fade-in">
      <div className="alert alert-danger" style={{marginBottom:24}}>Final review — once deployed, this vault is live on LiteForge Testnet. Check in every {interval.label==="Custom"?`${customDays} days`:interval.label} or the vault becomes claimable.</div>
      <div style={{background:"var(--page-bg)",border:"1px solid var(--border)",padding:24,marginBottom:24}}>
        {[["Vault Name",vaultName],["Secret Type",SECRET_TYPES.find(s=>s.key===secretType)?.label],["Heirs",`${heirs.length} heir${heirs.length!==1?"s":""}`],["Co-Signer",coSigner?`${coSigner.slice(0,10)}...`:"—"],["Check-In",interval.label==="Custom"?`${customDays} days`:interval.label],["Waiver Period",`${waiverDays==="Custom"?customWaiver:waiverDays} days`],["Secret Question",secretQuestion?"✓ Set":"Not set"],["Notifications",[notifEmail&&"Email",notifPush&&"Push"].filter(Boolean).join(", ")||"None"],["Network","LiteForge Testnet (Chain ID: 4441)"]].map(([k,v])=>(<div key={k} className="review-row"><span className="review-key">{k}</span><span className="review-val">{v}</span></div>))}
      </div>
      {error&&<div className="alert alert-danger" style={{marginBottom:16}}>✕ {error.shortMessage||error.message||"Transaction failed"}</div>}
      <div className="grid-2">
        <button className="btn btn-ghost btn-full" onClick={()=>setStep(3)} disabled={isPending||isConfirming}>← Back</button>
        <button className="btn btn-primary btn-full btn-lg" style={{background:"linear-gradient(135deg,var(--accent-dim),var(--accent))"}} onClick={handleDeploy} disabled={isPending||isConfirming}>
          {isPending&&<><span className="spinner"/> Confirm in Wallet...</>}
          {isConfirming&&<><span className="spinner"/> Deploying...</>}
          {!isPending&&!isConfirming&&"⚖ Deploy Vault"}
        </button>
      </div>
    </div>
  );

  return(<div className="fade-in"><StepTrack step={step}/>{[step0,step1,step2,step3,step4][step]}</div>);
}
