import { useTheme } from "../ThemeContext";
export default function Background() {
  const { theme } = useTheme();
  if (theme === "light") return null;
  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",backgroundImage:`linear-gradient(rgba(37,99,235,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.025) 1px,transparent 1px)`,backgroundSize:"44px 44px"}}/>
      <div style={{position:"fixed",top:0,left:0,right:0,height:"2px",background:"linear-gradient(transparent,rgba(37,99,235,.15),transparent)",animation:"scanline 10s linear infinite",pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse at center,transparent 60%,rgba(0,0,0,.6) 100%)"}}/>
    </>
  );
}
