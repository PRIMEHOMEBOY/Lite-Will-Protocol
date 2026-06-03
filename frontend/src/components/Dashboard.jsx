import { useAccount } from "wagmi";
import { useOwnerVaults, useHeirVaults, useTotalVaults, useVault } from "../hooks/useDeadVault";
import VaultCard from "./VaultCard";

function StatCard({label,value,color,delay}){
  return(<div className="card fade-up" style={{animationDelay:`${delay}s`,opacity:0}}><div className="label" style={{marginBottom:10}}>{label}</div><div style={{fontFamily:"'Orbitron',monospace",fontSize:38,fontWeight:900,color,lineHeight:1,textShadow:`0 0 20px ${color}50`}}>{value}</div></div>);
}

function VaultLoader({id,onAction,index}){
  const {data:d}=useVault(id);
  if(!d)return null;
  if(Number(d[10])===3)return null;
  const vault={id,owner:d[1],name:d[2],encryptedDataCID:d[3],encryptedSymKey:d[4],secretType:d[5],intervalSeconds:d[6],lastCheckIn:d[7],deadline:d[8],coSigner:d[9],status:d[10],createdAt:d[11]};
  return <VaultCard vault={vault} onAction={onAction} animDelay={index*0.08}/>;
}

export default function Dashboard({onTabChange,onAction}){
  const {isConnected}=useAccount();
  const {data:ownerIds=[]}=useOwnerVaults();
  const {data:heirIds=[]}=useHeirVaults();
  const {data:total=0}=useTotalVaults();

  if(!isConnected)return(
    <div className="empty-state fade-in">
      {/* Subtle centered logo — like the skull was */}
      <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
        <img src="/logo.png" alt="" style={{width:80,height:80,objectFit:"contain",opacity:.12}}/>
      </div>
      <div className="empty-title">Connect your wallet</div>
      <div style={{color:"var(--text-muted)",fontFamily:"monospace",fontSize:12,marginBottom:28}}>Connect to LiteForge Testnet to access your vaults</div>
    </div>
  );

  return(
    <div className="fade-in">
      <div className="grid-3" style={{marginBottom:36}}>
        <StatCard label="Your Vaults"    value={ownerIds.length} color="var(--text)"        delay={0}/>
        <StatCard label="As Heir"        value={heirIds.length}  color="var(--green)"       delay={0.08}/>
        <StatCard label="Total On-Chain" value={String(total)}   color="var(--accent-text)" delay={0.16}/>
      </div>
      <div className="section-title"><div className="section-num">↓</div>Your Vaults</div>
      {ownerIds.length===0?(
        <div className="empty-state" style={{padding:"40px 0"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
            <img src="/logo.png" alt="" style={{width:60,height:60,objectFit:"contain",opacity:.1}}/>
          </div>
          <div className="empty-title" style={{fontSize:12}}>No vaults yet</div>
          <div style={{color:"var(--text-muted)",fontFamily:"monospace",fontSize:11,marginBottom:20}}>Create your first vault to protect your digital legacy</div>
          <button className="btn btn-primary btn-sm" onClick={()=>onTabChange("Create Vault")}>+ Create Vault</button>
        </div>
      ):ownerIds.map((id,i)=><VaultLoader key={String(id)} id={id} onAction={onAction} index={i}/>)}
      {heirIds.length>0&&(<>
        <div className="section-title" style={{marginTop:36}}><div className="section-num">↓</div>Vaults Where You Are an Heir</div>
        {heirIds.map((id,i)=><VaultLoader key={`h-${String(id)}`} id={id} onAction={onAction} index={i}/>)}
      </>)}
    </div>
  );
}
