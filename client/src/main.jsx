import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css"
import { ApiCallProvider } from "./Context/apiCount.js";
import { useState } from "react";


createRoot(document.getElementById("root")).render(
  
    
      <App />

);
