console.log("MAIN.TSX LOADED");

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";

console.log("ABOUT TO RENDER APP");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
