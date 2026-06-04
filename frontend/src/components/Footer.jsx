function GithubIcon(){return(<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>)}

/* Twitter/X logo SVG — the proper bird/X brand icon */
function TwitterXIcon(){return(<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>)}

const LINKS=[{label:"Docs",key:"docs"},{label:"Privacy",key:"privacy"},{label:"Terms",key:"terms"},{label:"Support",key:"support"}];

export default function Footer({onNavigate,activeTab}){
  return(
    <footer style={{borderTop:"1px solid var(--border)",background:"var(--footer-bg)",padding:"28px 20px 40px",marginTop:60}}>
      <div style={{maxWidth:1080,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>

        {/* Left — bigger logo */}
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <img src="/logo.png" alt="LiteWill Protocol" style={{width:48,height:48,objectFit:"contain",opacity:.95}}/>
          <div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:14,fontWeight:800,letterSpacing:".1em",color:"var(--accent-text)"}}>LITEWILL PROTOCOL</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"var(--text-muted)",marginTop:3}}>© 2026 LiteWill Protocol. Built on LitVM.</div>
          </div>
        </div>

        {/* Right — links + ONE X icon only */}
        <div style={{display:"flex",alignItems:"center",gap:22,flexWrap:"wrap"}}>
          {LINKS.map(link=>(
            <button key={link.key} onClick={()=>onNavigate(link.key)} className={`footer-link${activeTab===link.key?" active":""}`}>{link.label}</button>
          ))}
          <a href="https://github.com/PRIMEHOMEBOY" target="_blank" rel="noopener noreferrer" className="footer-link" style={{display:"flex",alignItems:"center",gap:6}}>
            <GithubIcon/>GitHub
          </a>
          {/* Only ONE X — with the Twitter X icon */}
          <a href="https://x.com/lite_will_pro" target="_blank" rel="noopener noreferrer" className="footer-link" style={{display:"flex",alignItems:"center",gap:6}}>
            <TwitterXIcon/>
          </a>
        </div>
      </div>
    </footer>
  );
}
