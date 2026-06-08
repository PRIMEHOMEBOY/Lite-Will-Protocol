import { useState } from "react";
import { useAccount } from "wagmi";
import { useOwnerVaults, useVault } from "../hooks/useDeadVault";
import VaultCard from "./VaultCard";

const FILTERS=["all","active","claimable","released","revoked"];

function VaultLoader({id,onAction,index,filter}){
  const {data:d}=useVault(id);
  if(!d)return null;
  const vault={id,owner:d[1],name:d[2],encryptedDataCID:d[3],encryptedSymKey:d[4],secretType:d[5],intervalSeconds:d[6],lastCheckIn:d[7],deadline:d[8],coSigner:d[9],status:d[10],createdAt:d[11]};
  const statusNum=Number(vault.status);
  if(filter!=="all"){const m={active:0,claimable:1,released:2,revoked:3};if(m[filter]!==statusNum)return null;}
  return <VaultCard vault={vault} onAction={onAction} animDelay={index*0.07}/>;
}

export default function MyVaults({onAction,onTabChange}){
  const {isConnected}=useAccount();
  const {data:ids=[],isLoading}=useOwnerVaults();
  const [filter,setFilter]=useState("all");
  if(!isConnected)return(<div className="empty-state fade-in"><div className="empty-icon">🔌</div><div className="empty-title">Wallet not connected</div></div>);
  return(
    <div className="fade-in">
      <div style={{display:"flex",gap:8,marginBottom:28,flexWrap:"wrap"}}>
        {FILTERS.map(f=><button key={f} onClick={()=>setFilter(f)} className={`btn btn-sm ${filter===f?"btn-primary":"btn-ghost"}`}>{f.toUpperCase()}</button>)}
        <div style={{marginLeft:"auto",fontFamily:"monospace",fontSize:11,color:"var(--text-muted)",alignSelf:"center"}}>{ids.length} vault{ids.length!==1?"s":""}</div>
      </div>
      {isLoading&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--text-muted)",fontFamily:"monospace",fontSize:12}}><span className="spinner" style={{marginRight:10}}/>Loading vaults...</div>}
      {!isLoading&&ids.length===0&&(<div className="empty-state"><div className="empty-icon">🔒</div><div className="empty-title">No vaults found</div><button className="btn btn-primary btn-sm" style={{marginTop:16}} onClick={()=>onTabChange("Create Vault")}>+ Create Vault</button></div>)}
      {ids.map((id,i)=><VaultLoader key={String(id)} id={id} onAction={onAction} index={i} filter={filter}/>)}
    </div>
  );
}
