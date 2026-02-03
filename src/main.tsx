import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // ← IMPORTANTE: importe isso se ainda não tiver
import App from "./App.tsx";
import "./index.css";

// basename deve ser exatamente o nome do repositório (maiúsculo ou minúsculo — teste os dois se necessário)
// Use "/AGROSPEED/" ou "/agrospeed/" dependendo do que funcionar no seu caso
// Recomendação inicial: "/AGROSPEED/" (com maiúsculas, pois o repo é AGROSPEED)
const BASENAME = "/AGROSPEED/"; // ← Mude para "/agrospeed/" se o link verde usar minúsculas

createRoot(document.getElementById("root")!).render(
  <BrowserRouter basename={BASENAME}>
    <App />
  </BrowserRouter>
);