/**
 * KIOSK DISPLAY SYSTEM
 * 
 * Aplicação para exibição em TVs com controle remoto.
 * 
 * ROTAS:
 * - /tv       → Tela de apresentação (abrir nas TVs)
 * - /controle → Tela de controle (dispositivo do operador)
 * - /         → Redireciona para /controle
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TV from "./pages/TV";
import Controle from "./pages/Controle";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Página principal redireciona para controle */}
          <Route path="/" element={<Navigate to="/controle" replace />} />
          
          {/* Tela de apresentação para TVs */}
          <Route path="/tv" element={<TV />} />
          
          {/* Tela de controle para operador */}
          <Route path="/controle" element={<Controle />} />
          
          {/* Página não encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
