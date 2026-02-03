import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // ← ADICIONE ISSO AQUI (obrigatório para GitHub Pages em repo específico)
  base: "/AGROSPEED/",  // Use exatamente o nome do repositório em maiúsculas (ou teste minúsculas: "/agrospeed/")
                        // Se usar Actions para build auto, pode dinamizar com process.env, mas por agora fixo resolve.

  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },

  plugins: [
    react(),
    // Só ativa o tagger em dev (como já estava)
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));