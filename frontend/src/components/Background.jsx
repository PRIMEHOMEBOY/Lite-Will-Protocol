export default function Background() {
  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",backgroundImage:`linear-gradient(rgba(37,99,235,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.025) 1px,transparent 1px)`,backgroundSize:"44px 44px"}}/>
      <div style={{position:"fixed",top:0,left:0,right:0,height:"2px",background:"linear-gradient(transparent,rgba(37,99,235,.15),transparent)",animation:"scanline 10s linear infinite",pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse at center,transparent 60%,rgba(0,0,0,.7) 100%)"}}/>
      <div style={{position:"fixed",top:0,left:0,width:200,height:200,zIndex:0,pointerEvents:"none",background:"radial-gradient(circle at 0 0,rgba(37,99,235,.08) 0%,transparent 70%)"}}/>
      <div style={{position:"fixed",bottom:0,right:0,width:200,height:200,zIndex:0,pointerEvents:"none",background:"radial-gradient(circle at 100% 100%,rgba(37,99,235,.06) 0%,transparent 70%)"}}/>
    </>
  );
}
