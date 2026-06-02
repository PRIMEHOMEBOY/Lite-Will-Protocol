import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTheme } from "../ThemeContext";

function SunIcon(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>)}
function MoonIcon(){return(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>)}

const TABS = ["Dashboard","Create Vault","My Vaults","Heirs","Profile"];
export default function Header({ activeTab, onTabChange }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <header style={{position:"relative",zIndex:10}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 0 16px",borderBottom:"1px solid var(--border-accent)",marginBottom:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>onTabChange("Dashboard")}>
          <img src="/logo.png" alt="LiteWill Protocol" style={{width:42,height:42,objectFit:"contain"}}/>
          <div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:700,letterSpacing:".1em",color:"var(--accent-text)",textShadow:"0 0 16px var(--accent-glow)"}}>LITEWILL PROTOCOL</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:".25em",color:"var(--text-muted)",textTransform:"uppercase"}}>Trustless Digital Inheritance · LitVM</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={toggleTheme} style={{background:"var(--page-bg)",border:"1px solid var(--border)",color:"var(--text-dim)",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all .18s"}} title={theme==="light"?"Dark mode":"Light mode"}>
            {theme==="light"?<MoonIcon/>:<SunIcon/>}
          </button>
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",border:"1px solid rgba(34,197,94,.25)",background:"rgba(34,197,94,.05)"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"var(--green)",boxShadow:"0 0 6px var(--green)"}}/>
            <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:".18em",color:"var(--green)",textTransform:"uppercase"}}>LiteForge Testnet</span>
          </div>
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address"/>
        </div>
      </div>
      <nav style={{display:"flex",borderBottom:"1px solid var(--border)",marginBottom:36,overflowX:"auto"}}>
        {TABS.map(tab=>(
          <button key={tab} onClick={()=>onTabChange(tab)} style={{background:"transparent",border:"none",borderBottom:activeTab===tab?"2px solid var(--accent)":"2px solid transparent",color:activeTab===tab?"var(--accent-text)":"var(--text-muted)",padding:"14px 20px",fontFamily:"'Share Tech Mono',monospace",fontSize:"10px",letterSpacing:".18em",textTransform:"uppercase",cursor:"pointer",transition:"all .18s",marginBottom:"-1px",whiteSpace:"nowrap"}}>{tab}</button>
        ))}
      </nav>
    </header>
  );
}
