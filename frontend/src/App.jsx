import { useState, useCallback } from "react";
import Background  from "./components/Background";
import Header      from "./components/Header";
import Dashboard   from "./components/Dashboard";
import CreateVault from "./components/CreateVault";
import MyVaults    from "./components/MyVaults";
import HeirsPage   from "./components/HeirsPage";
import VaultDetail from "./components/VaultDetail";
import ProfilePage from "./components/ProfilePage";
import Footer      from "./components/Footer";
import Toast       from "./components/Toast";
import EditVault   from "./components/EditVault";
import { DocsPage,PrivacyPage,TermsPage,SupportPage } from "./components/FooterPages";
import { useRevokeVault } from "./hooks/useDeadVault";
import { CONTRACT_ADDRESS } from "./utils/config";

export default function App() {
  const [tab,setTab]=useState("Dashboard");
  const [toast,setToast]=useState(null);
  const [detailId,setDetailId]=useState(null);
  const [editId,setEditId]=useState(null);
  const [confirmRevoke,setConfirmRevoke]=useState(null);
  const {revokeVault,isPending:isRevoking}=useRevokeVault();

  const showToast=useCallback((msg,type="success")=>setToast({message:msg,type}),[]);
  const handleTabChange=(t)=>{setTab(t);window.scrollTo(0,0);};
  const handleAction=useCallback((action,id)=>{
    if(action==="view"||action==="claim"){setDetailId(id);return;}
    if(action==="edit"){setEditId(id);return;}
    if(action==="revoke"){setConfirmRevoke(id);return;}
  },[]);
  const handleRevoke=()=>{if(!confirmRevoke)return;revokeVault(confirmRevoke);setConfirmRevoke(null);showToast("Vault revocation submitted","info");};
  const noContract=!CONTRACT_ADDRESS||CONTRACT_ADDRESS==="";

  return(
    <>
      <Background/>
      {noContract&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:50,background:"rgba(245,158,11,.12)",borderBottom:"1px solid rgba(245,158,11,.4)",padding:"10px 20px",textAlign:"center",fontFamily:"'Share Tech Mono',monospace",fontSize:11,letterSpacing:".15em",color:"#fcd34d"}}>⚠ CONTRACT NOT CONFIGURED</div>}
      <div className="page-wrap" style={{paddingTop:noContract?44:0,position:"relative",zIndex:2}}>
        <Header activeTab={tab} onTabChange={handleTabChange}/>
        {tab==="Dashboard"    &&<Dashboard    onTabChange={handleTabChange} onAction={handleAction}/>}
        {tab==="Create Vault" &&<CreateVault  onTabChange={handleTabChange}/>}
        {tab==="My Vaults"    &&<MyVaults     onAction={handleAction} onTabChange={handleTabChange}/>}
        {tab==="Heirs"        &&<HeirsPage/>}
        {tab==="Profile"      &&<ProfilePage/>}
        {tab==="docs"         &&<DocsPage/>}
        {tab==="privacy"      &&<PrivacyPage/>}
        {tab==="terms"        &&<TermsPage/>}
        {tab==="support"      &&<SupportPage/>}
      </div>
      <Footer onNavigate={handleTabChange} activeTab={tab}/>

      {/* Edit vault modal */}
      {editId!==null&&<EditVault vaultId={editId} onClose={()=>setEditId(null)} onSaved={()=>{setEditId(null);showToast("Vault updated successfully");}}/>}

      {/* View detail modal */}
      {detailId!==null&&<VaultDetail vaultId={detailId} onClose={()=>setDetailId(null)}/>}

      {/* Revoke confirm */}
      {confirmRevoke!==null&&(
        <div className="modal-overlay" onClick={()=>setConfirmRevoke(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:700,color:"var(--red)",marginBottom:16}}>Revoke Vault?</div>
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
