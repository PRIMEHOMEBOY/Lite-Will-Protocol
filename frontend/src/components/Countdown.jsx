import { useState, useEffect } from "react";
function pad(n) { return String(n).padStart(2, "0"); }
export default function Countdown({ deadlineTs, urgent }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const calc = () => { const now = Math.floor(Date.now()/1000); setRemaining(Math.max(0, Number(deadlineTs)-now)); };
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, [deadlineTs]);
  const days=Math.floor(remaining/86400), hours=Math.floor((remaining%86400)/3600), mins=Math.floor((remaining%3600)/60), secs=remaining%60;
  const blocks=[{label:"Days",val:days},{label:"Hrs",val:hours},{label:"Min",val:mins},{label:"Sec",val:secs}];
  return (
    <div className="countdown-wrap">
      {blocks.map((b,i) => (
        <span key={b.label} style={{display:"contents"}}>
          <div className={`time-block${urgent?" urgent":""}`}>
            <div className={`time-num${urgent?" urgent":""}`}>{pad(b.val)}</div>
            <div className="time-unit">{b.label}</div>
          </div>
          {i<3 && <span className="colon">:</span>}
        </span>
      ))}
      {urgent && <div style={{padding:"6px 12px",border:"1px solid var(--red)",background:"var(--red-subtle)",fontFamily:"var(--font-mono)",fontSize:9,letterSpacing:".2em",color:"var(--red)",textTransform:"uppercase",animation:"ticker 1s infinite",marginLeft:8}}>⚡ CHECK IN NOW</div>}
    </div>
  );
}
