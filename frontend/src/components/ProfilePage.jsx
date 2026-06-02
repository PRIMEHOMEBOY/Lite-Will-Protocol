import { useState, useRef } from "react";
import { useAccount, useDisconnect } from "wagmi";

const STORAGE_KEY = "lw-profile";
function loadProfile() { try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : {name:"",email:"",photo:null}; } catch { return {name:"",email:"",photo:null}; } }

export default function ProfilePage() {
  const {address,isConnected}=useAccount();
  const {disconnect}=useDisconnect();
  const fileRef=useRef(null);
  const [profile,setProfile]=useState(loadProfile);
  const [editing,setEditing]=useState(false);
  const [saved,setSaved]=useState(false);
  const [form,setForm]=useState({...loadProfile()});

  if(!isConnected)return(<div className="empty-state fade-in"><div className="empty-icon">👤</div><div className="empty-title">Wallet not connected</div></div>);

  const handlePhotoChange=(e)=>{ const file=e.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=(ev)=>setForm(f=>({...f,photo:ev.target.result})); reader.readAsDataURL(file); };
  const handleSave=()=>{ const updated={...form}; setProfile(updated); localStorage.setItem(STORAGE_KEY,JSON.stringify(updated)); setEditing(false); setSaved(true); setTimeout(()=>setSaved(false),3000); };
  const short=(addr)=>addr?`${addr.slice(0,8)}...${addr.slice(-6)}`:"—";

  return(
    <div className="fade-in">
      {saved&&<div className="toast toast-success">✓ Profile saved</div>}
      <div className="section-title"><div className="section-num">⚙</div>Profile & Settings</div>
      <div className="card" style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:24}}>
          <div style={{position:"relative",cursor:editing?"pointer":"default"}} onClick={()=>editing&&fileRef.current?.click()}>
            <input type="file" ref={fileRef} style={{display:"none"}} accept="image/*" onChange={handlePhotoChange}/>
            <div style={{width:72,height:72,borderRadius:"50%",border:"2px solid var(--accent)",background:"var(--accent-subtle)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
              {(editing?form.photo:profile.photo)?<img src={editing?form.photo:profile.photo} alt="Profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:28}}>👤</span>}
            </div>
            {editing&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.5)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📷</div>}
          </div>
          <div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:700,color:"var(--text)",marginBottom:4}}>{profile.name||"No name set"}</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"var(--text-muted)"}}>{short(address)}</div>
            {profile.email&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"var(--text-muted)",marginTop:2}}>{profile.email}</div>}
          </div>
        </div>
        {!editing?(
          <button className="btn btn-ghost btn-sm" onClick={()=>{setForm({...profile});setEditing(true);}}>Edit Profile</button>
        ):(
          <div>
            <div className="field"><label className="field-label">Full Name</label><input className="input" placeholder="Your real name (shown in heir notifications)" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/><div className="field-hint">This name appears in emails sent to your heirs.</div></div>
            <div className="field"><label className="field-label">Email Address</label><input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
            <div className="field"><label className="field-label">Profile Photo</label><button className="btn btn-ghost btn-sm" onClick={()=>fileRef.current?.click()}>📷 Choose Photo</button>{form.photo&&<img src={form.photo} alt="Preview" style={{display:"block",marginTop:8,width:60,height:60,objectFit:"cover",border:"1px solid var(--border)"}}/>}</div>
            <div className="grid-2"><button className="btn btn-ghost btn-full btn-sm" onClick={()=>setEditing(false)}>Cancel</button><button className="btn btn-primary btn-full btn-sm" onClick={handleSave}>Save</button></div>
          </div>
        )}
      </div>
      <div className="card" style={{marginBottom:20}}>
        <div className="section-title" style={{marginBottom:16}}><div className="section-num">🔐</div>Connected Wallet</div>
        {[["Address",short(address)],["Network","LiteForge Testnet"],["Chain ID","4441"],["Token","zkLTC"]].map(([k,v])=>(<div key={k} className="review-row"><span className="review-key">{k}</span><span className="review-val">{v}</span></div>))}
        <button className="btn btn-danger btn-sm" style={{marginTop:16}} onClick={()=>disconnect()}>↩ Disconnect Wallet</button>
      </div>
      <div className="card">
        <div className="section-title" style={{marginBottom:16}}><div className="section-num">i</div>About</div>
        {[["Version","1.0.0"],["Network","LitVM LiteForge Testnet"],["Contract","0x58f699B5a80e631A6356df0Cb46242f18044E1B7"],["Support","liteprotocol@gmail.com"]].map(([k,v])=>(<div key={k} className="review-row"><span className="review-key">{k}</span><span className="review-val" style={{wordBreak:"break-all"}}>{v}</span></div>))}
      </div>
    </div>
  );
}
