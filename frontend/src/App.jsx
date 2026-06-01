import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import Background  from "./components/Background";
import Header      from "./components/Header";
import Dashboard   from "./components/Dashboard";
import CreateVault from "./components/CreateVault";
import MyVaults    from "./components/MyVaults";
import HeirsPage   from "./components/HeirsPage";
import VaultDetail from "./components/VaultDetail";
import Toast       from "./components/Toast";
import { useRevokeVault } from "./hooks/useDeadVault";
import { CONTRACT_ADDRESS } from "./utils/config";

export default function App() {
  const { isConnected } = useAccount();
  const [tab,setTab]=useState("Dashboard");
  const [toast,setToast]=useState(null);
  const [detailId,setDetailId]=useState(null);
  const [confirmRevoke,setConfirmRevoke]=useState(null);
  const { revokeVault, isPending:isRevoking } = useRevokeVault();

  const showToast=useCallback((message,type="success")=>setToast({message,type}),[]);
  const handleAction=useCallback((action,id)=>{
    if(action==="view"||action==="edit"||action==="claim"){setDetailId(id);return;}
    if(action==="revoke"){setConfirmRevoke(id);return;}
  },[]);
  const handleRevoke=()=>{if(!confirmRevoke)return;revokeVault(confirmRevoke);setConfirmRevoke(null);showToast("Vault revocation submitted","info");};

  const noContract=!CONTRACT_ADDRESS||CONTRACT_ADDRESS==="";
  return(
    <>
      <Background/>
      {noContract&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:50,background:"rgba(245,158,11,.12)",borderBottom:"1px solid rgba(245,158,11,.4)",padding:"10px 20px",textAlign:"center",fontFamily:"var(--font-mono)",fontSize:11,letterSpacing:".15em",color:"#fcd34d"}}>⚠ CONTRACT NOT CONFIGURED — add VITE_CONTRACT_ADDRESS to your .env after deployment</div>}
      <div className="page-wrap" style={{paddingTop:noContract?44:0}}>
        <Header activeTab={tab} onTabChange={setTab}/>
        {tab==="Dashboard"    &&<Dashboard  onTabChange={setTab} onAction={handleAction}/>}
        {tab==="Create Vault" &&<CreateVault onTabChange={setTab}/>}
        {tab==="My Vaults"    &&<MyVaults    onAction={handleAction} onTabChange={setTab}/>}
        {tab==="Heirs"        &&<HeirsPage/>}
        <div style={{marginTop:60,paddingTop:20,borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <div style={{fontFamily:"var(--font-mono)",fontSize:10,letterSpacing:".2em",color:"var(--text-muted)"}}>⚖ LITE-WILL PROTOCOL · LITVM LITEFORGE TESTNET · CHAIN ID 4441</div>
          <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--text-muted)"}}>{CONTRACT_ADDRESS?`Contract: ${CONTRACT_ADDRESS.slice(0,10)}...${CONTRACT_ADDRESS.slice(-6)}`:"Contract: not deployed"}</div>
        </div>
      </div>
      {detailId!==null&&<VaultDetail vaultId={detailId} onClose={()=>setDetailId(null)}/>}
      {confirmRevoke!==null&&(
        <div className="modal-overlay" onClick={()=>setConfirmRevoke(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"var(--font-display)",fontSize:18,fontWeight:700,color:"var(--red)",marginBottom:16}}>Revoke Vault?</div>
            <div className="alert alert-danger" style={{marginBottom:24}}>This action is permanent. The vault will be closed forever.</div>
            <div className="grid-2">
              <button className="btn btn-ghost btn-full" onClick={()=>setConfirmRevoke(null)}>Cancel</button>
              <button className="btn btn-danger btn-full" onClick={handleRevoke} disabled={isRevoking}>{isRevoking?<><span className="spinner"/> Revoking...</>:"✕ Confirm Revoke"}</button>
            </div>
          </div>
        </div>
      )}
      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
    </>
  );
}
