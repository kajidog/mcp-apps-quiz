import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { QuizClientProvider } from "./client/provider.js";
import "./global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QuizClientProvider>
      <App />
    </QuizClientProvider>
  </StrictMode>,
);
