import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient,QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider,darkTheme,lightTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "./utils/config";
import { ThemeProvider } from "./ThemeContext";
import App from "./App";
import "./index.css";
import "@rainbow-me/rainbowkit/styles.css";
const queryClient=new QueryClient();
const stored=localStorage.getItem("lw-theme")||"dark";
const rkTheme=stored==="light"?lightTheme({accentColor:"#2563eb",accentColorForeground:"white",borderRadius:"none"}):darkTheme({accentColor:"#2563eb",accentColorForeground:"white",borderRadius:"none",fontStack:"system",overlayBlur:"small"});
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RainbowKitProvider theme={rkTheme} modalSize="compact">
            <App/>
          </RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
