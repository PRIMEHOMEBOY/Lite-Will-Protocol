import { ConnectButton } from "@rainbow-me/rainbowkit";
const TABS = ["Dashboard","Create Vault","My Vaults","Heirs"];
export default function Header({ activeTab, onTabChange }) {
  return (
    <header style={{position:"relative",zIndex:10}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"24px 0 18px",borderBottom:"1px solid rgba(37,99,235,.2)",marginBottom:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <img src="/logo.png" alt="LiteWill Vault" style={{width:44,height:44,objectFit:"contain"}} />
          <div>
            <div style={{fontFamily:"var(--font-display)",fontSize:16,fontWeight:700,letterSpacing:".1em",color:"#60a5fa",textShadow:"0 0 18px rgba(37,99,235,.5)"}}>LITEWILL VAULT</div>
            <div style={{fontFamily:"var(--font-mono)",fontSize:9,letterSpacing:".28em",color:"var(--text-muted)",textTransform:"uppercase"}}>Trustless Digital Inheritance · LitVM</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",border:"1px solid rgba(34,197,94,.2)",background:"rgba(34,197,94,.05)"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",boxShadow:"0 0 6px var(--green)"}}/>
            <span style={{fontFamily:"var(--font-mono)",fontSize:9,letterSpacing:".2em",color:"rgba(34,197,94,.8)",textTransform:"uppercase"}}>LiteForge Testnet</span>
          </div>
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address"/>
        </div>
      </div>
      <nav style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.05)",marginBottom:36}}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => onTabChange(tab)} style={{background:"transparent",border:"none",borderBottom:activeTab===tab?"2px solid #2563eb":"2px solid transparent",color:activeTab===tab?"#60a5fa":"var(--text-muted)",padding:"14px 22px",fontFamily:"var(--font-mono)",fontSize:"10px",letterSpacing:".2em",textTransform:"uppercase",cursor:"pointer",transition:"all var(--transition)",marginBottom:"-1px"}}>{tab}</button>
        ))}
      </nav>
    </header>
  );
}
