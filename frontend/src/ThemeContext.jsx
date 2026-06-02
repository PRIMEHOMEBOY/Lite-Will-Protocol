import { createContext, useContext, useState } from "react";
const ThemeContext = createContext();
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("lw-theme") || "dark");
  const toggleTheme = () => { const next = theme === "dark" ? "light" : "dark"; setTheme(next); localStorage.setItem("lw-theme", next); };
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`theme-${theme}`} style={{ minHeight: "100vh" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
