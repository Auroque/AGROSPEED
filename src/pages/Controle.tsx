/**
 * TELA DE CONTROLE (OPERADOR) - MULTI-TV
 * 
 * Controla individualmente cada uma das 4 TVs.
 * Permite alternar modos, trocar URLs de iframe em tempo real.
 * 
 * USO:
 * 1. Abra as TVs com: /tv?id=tv1, /tv?id=tv2, etc.
 * 2. Abra esta URL no dispositivo do operador: /controle
 * 3. Selecione a TV desejada e use os controles
 * 
 * FUNCIONALIDADES:
 * - Controle individual por TV
 * - Trocar URL do iframe em tempo real
 * - Aplicar comandos para todas as TVs de uma vez
 */

import { useState, useMemo } from "react";
import { useKioskSync } from "@/hooks/useKioskSync";
import { kioskConfig, KioskMode, Sponsor } from "@/config/kioskConfig";
import { 
  Play, 
  Users, 
  Clock, 
  Monitor, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Tv2,
  Link,
  Send,
  CheckCircle,
  Flag,
  Image,
  RefreshCw
} from "lucide-react";

const Controle = () => {
  // Hook de sincronização (modo Controller)
  const { 
    allTvsState,
    connectedTvs,
    setMode, 
    setSlide, 
    setAutoMode,
    setSlideTime,
    setIframeUrl,
    updateSponsors,
    applyToAll,
  } = useKioskSync({ isController: true });

  // TV selecionada atualmente
  const [selectedTv, setSelectedTv] = useState(kioskConfig.tvs[0].id);
  
  // URLs editáveis
  const [editedUrl1, setEditedUrl1] = useState("");
  const [editedUrl2, setEditedUrl2] = useState("");
  
  // Texto de patrocinadores (uma URL por linha)
  const [sponsorUrls, setSponsorUrls] = useState("");
  
  // Painel de configurações
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Estado da TV selecionada
  const currentTvState = allTvsState[selectedTv];

  // Patrocinadores atuais da TV selecionada
  const currentSponsors = useMemo(() => 
    currentTvState?.sponsors || kioskConfig.sponsors,
    [currentTvState]
  );

  // Atualiza URLs editáveis quando muda de TV
  const handleTvSelect = (tvId: string) => {
    setSelectedTv(tvId);
    setEditedUrl1(allTvsState[tvId]?.iframeUrl || "");
    setEditedUrl2(allTvsState[tvId]?.iframeUrl2 || "");
    // Carrega patrocinadores atuais da TV no textarea
    const tvSponsors = allTvsState[tvId]?.sponsors || kioskConfig.sponsors;
    setSponsorUrls(tvSponsors.map(s => s.logo).join("\n"));
  };

  // Aplica URL apenas para a TV selecionada
  const applyUrlToSelected = (urlType: "race" | "race2") => {
    const url = urlType === "race" ? editedUrl1 : editedUrl2;
    if (url.trim()) {
      setIframeUrl(selectedTv, url.trim(), urlType);
    }
  };

  // Aplica URL para todas as TVs
  const applyUrlToAll = (urlType: "race" | "race2") => {
    const url = urlType === "race" ? editedUrl1 : editedUrl2;
    if (url.trim()) {
      applyToAll({ type: "SET_IFRAME_URL", url: url.trim(), urlType });
    }
  };

  // Converte texto de URLs em lista de patrocinadores
  const parseSponsorsFromText = (text: string): Sponsor[] => {
    return text
      .split("\n")
      .map((line, index) => line.trim())
      .filter(url => url.length > 0 && (url.startsWith("http://") || url.startsWith("https://")))
      .map((url, index) => ({
        id: index + 1,
        name: `Patrocinador ${index + 1}`,
        logo: url
      }));
  };

  // Aplica patrocinadores para a TV selecionada
  const applySponsorsToSelected = () => {
    const sponsors = parseSponsorsFromText(sponsorUrls);
    if (sponsors.length > 0) {
      updateSponsors(selectedTv, sponsors);
    }
  };

  // Aplica patrocinadores para todas as TVs
  const applySponsorsToAll = () => {
    const sponsors = parseSponsorsFromText(sponsorUrls);
    if (sponsors.length > 0) {
      applyToAll({ type: "UPDATE_SPONSORS", sponsors });
    }
  };

  // Aplica modo para todas as TVs
  const applyModeToAll = (mode: KioskMode) => {
    applyToAll({ type: "SET_MODE", mode });
  };

  // Helper para mostrar ícone de modo
  const getModeIcon = (mode: KioskMode) => {
    switch (mode) {
      case "race": return <Play className="w-4 h-4" />;
      case "race2": return <Flag className="w-4 h-4" />;
      case "sponsors": return <Users className="w-4 h-4" />;
    }
  };

  // Helper para nome do modo
  const getModeName = (mode: KioskMode) => {
    switch (mode) {
      case "race": return "Placar";
      case "race2": return "Corrida";
      case "sponsors": return "Patrocinadores";
    }
  };

  return (
    <div className="control-container">
      {/* Header */}
      <header className="control-header">
        <div className="control-header-content">
          <h1 className="control-title">
            <Monitor className="w-6 h-6" />
            Controle Multi-TV
          </h1>
          <div className="control-status">
            <span className="status-connected">
              <Wifi className="w-4 h-4" />
              {connectedTvs.size} TV(s) conectada(s)
            </span>
          </div>
        </div>
      </header>

      <main className="control-main">
        {/* Seletor de TVs */}
        <section className="control-section">
          <h2 className="section-title">Selecione a TV</h2>
          <div className="tv-selector">
            {kioskConfig.tvs.map((tv) => {
              const tvState = allTvsState[tv.id];
              const isConnected = connectedTvs.has(tv.id);
              
              return (
                <button
                  key={tv.id}
                  onClick={() => handleTvSelect(tv.id)}
                  className={`tv-select-btn ${selectedTv === tv.id ? "active" : ""}`}
                >
                  <div className="tv-select-header">
                    <Tv2 className="w-5 h-5" />
                    <span>{tv.name}</span>
                    {isConnected ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="tv-select-status">
                    {getModeIcon(tvState?.mode || "race")}
                    <span>{getModeName(tvState?.mode || "race")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Status da TV selecionada */}
        <section className="control-section">
          <h2 className="section-title">
            Estado Atual - {kioskConfig.tvs.find(t => t.id === selectedTv)?.name}
          </h2>
          <div className="current-mode">
            <div className={`mode-card ${currentTvState?.mode === "race" ? "active" : ""}`}>
              <Play className="w-8 h-8" />
              <span>Placar</span>
            </div>
            <div className={`mode-card ${currentTvState?.mode === "race2" ? "active" : ""}`}>
              <Flag className="w-8 h-8" />
              <span>Corrida</span>
            </div>
            <div className={`mode-card ${currentTvState?.mode === "sponsors" ? "active" : ""}`}>
              <Users className="w-8 h-8" />
              <span>Patrocinadores</span>
            </div>
          </div>
        </section>

        {/* Controles de modo */}
        <section className="control-section">
          <h2 className="section-title">Controles de Modo</h2>
          <div className="control-buttons">
            <button
              onClick={() => setMode(selectedTv, "race")}
              className={`control-btn-main ${currentTvState?.mode === "race" ? "active" : ""}`}
            >
              <Play className="w-6 h-6" />
              Mostrar Placar
            </button>
            <button
              onClick={() => setMode(selectedTv, "race2")}
              className={`control-btn-main race2 ${currentTvState?.mode === "race2" ? "active" : ""}`}
            >
              <Flag className="w-6 h-6" />
              Mostrar Corrida
            </button>
            <button
              onClick={() => setMode(selectedTv, "sponsors")}
              className={`control-btn-main sponsors ${currentTvState?.mode === "sponsors" ? "active" : ""}`}
            >
              <Users className="w-6 h-6" />
              Mostrar Patrocinadores
            </button>
          </div>
          
          {/* Botões para aplicar a todas */}
          <div className="apply-all-section">
            <span className="apply-all-label">Aplicar para todas as TVs:</span>
            <div className="apply-all-buttons">
              <button onClick={() => applyModeToAll("race")} className="apply-all-btn">
                <Play className="w-4 h-4" /> Placar
              </button>
              <button onClick={() => applyModeToAll("race2")} className="apply-all-btn">
                <Flag className="w-4 h-4" /> Corrida
              </button>
              <button onClick={() => applyModeToAll("sponsors")} className="apply-all-btn">
                <Users className="w-4 h-4" /> Patrocinadores
              </button>
            </div>
          </div>
        </section>

        {/* Editor de URLs */}
        <section className="control-section">
          <h2 className="section-title">
            <Link className="w-5 h-5" />
            URLs dos Iframes
          </h2>
          
          {/* URL do Placar */}
          <div className="url-editor">
            <label className="url-label">
              <Play className="w-4 h-4" />
              URL do Placar (race)
            </label>
            <div className="url-input-group">
              <input
                type="url"
                value={editedUrl1 || currentTvState?.iframeUrl || ""}
                onChange={(e) => setEditedUrl1(e.target.value)}
                placeholder="https://exemplo.com/placar"
                className="url-input"
              />
              <button 
                onClick={() => applyUrlToSelected("race")} 
                className="url-btn"
                title="Aplicar nesta TV"
              >
                <Send className="w-4 h-4" />
              </button>
              <button 
                onClick={() => applyUrlToAll("race")} 
                className="url-btn all"
                title="Aplicar em todas"
              >
                Todas
              </button>
            </div>
          </div>

          {/* URL da Corrida alternativa */}
          <div className="url-editor">
            <label className="url-label">
              <Flag className="w-4 h-4" />
              URL da Corrida (race2)
            </label>
            <div className="url-input-group">
              <input
                type="url"
                value={editedUrl2 || currentTvState?.iframeUrl2 || ""}
                onChange={(e) => setEditedUrl2(e.target.value)}
                placeholder="https://exemplo.com/corrida"
                className="url-input"
              />
              <button 
                onClick={() => applyUrlToSelected("race2")} 
                className="url-btn"
                title="Aplicar nesta TV"
              >
                <Send className="w-4 h-4" />
              </button>
              <button 
                onClick={() => applyUrlToAll("race2")} 
                className="url-btn all"
                title="Aplicar em todas"
              >
                Todas
              </button>
            </div>
          </div>
        </section>

        {/* Configuração de Patrocinadores */}
        <section className="control-section">
          <h2 className="section-title">
            <Image className="w-5 h-5" />
            Patrocinadores (Imagens)
          </h2>
          <div className="sponsors-editor">
            <label className="url-label">
              Cole os links das imagens (um por linha)
            </label>
            <textarea
              value={sponsorUrls}
              onChange={(e) => setSponsorUrls(e.target.value)}
              placeholder={`https://exemplo.com/logo1.png\nhttps://exemplo.com/logo2.jpg\nhttps://exemplo.com/logo3.png`}
              className="sponsors-textarea"
              rows={5}
            />
            <div className="sponsors-actions">
              <button 
                onClick={applySponsorsToSelected} 
                className="url-btn"
                title="Aplicar nesta TV"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar nesta TV
              </button>
              <button 
                onClick={applySponsorsToAll} 
                className="url-btn all"
                title="Aplicar em todas"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar em todas
              </button>
            </div>
            <p className="sponsors-count">
              {parseSponsorsFromText(sponsorUrls).length} imagem(ns) válida(s)
            </p>
          </div>
          
          {/* Preview dos patrocinadores atuais */}
          <div className="current-sponsors">
            <h3 className="sponsors-subtitle">Patrocinadores atuais ({currentSponsors.length}):</h3>
            <div className="sponsors-preview-grid">
              {currentSponsors.map((sponsor, index) => (
                <div key={sponsor.id} className="sponsor-preview-item">
                  <img 
                    src={sponsor.logo} 
                    alt={sponsor.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60' viewBox='0 0 100 60'%3E%3Crect fill='%23333' width='100' height='60'/%3E%3Ctext fill='%23666' font-size='10' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EErro%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <span>{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Navegação de slides (só aparece no modo patrocinadores) */}
        {currentTvState?.mode === "sponsors" && (
          <section className="control-section">
            <h2 className="section-title">Navegação de Slides</h2>
            <div className="slide-navigation">
              <button
                onClick={() => setSlide(selectedTv, (currentTvState.currentSlide - 1 + currentSponsors.length) % currentSponsors.length)}
                className="nav-btn"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="slide-indicator">
                <span className="slide-current">{currentTvState.currentSlide + 1}</span>
                <span className="slide-separator">/</span>
                <span className="slide-total">{currentSponsors.length}</span>
              </div>
              <button
                onClick={() => setSlide(selectedTv, (currentTvState.currentSlide + 1) % currentSponsors.length)}
                className="nav-btn"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            
            {/* Preview dos slides */}
            <div className="slide-previews">
              {currentSponsors.map((sponsor, index) => (
                <button
                  key={sponsor.id}
                  onClick={() => setSlide(selectedTv, index)}
                  className={`slide-preview ${index === currentTvState.currentSlide ? "active" : ""}`}
                >
                  <img src={sponsor.logo} alt={sponsor.name} />
                  <span>{sponsor.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Configurações */}
        <section className="control-section">
          <button 
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="settings-toggle"
          >
            <Settings className="w-5 h-5" />
            <span>Configurações da {kioskConfig.tvs.find(t => t.id === selectedTv)?.name}</span>
            <ChevronRight className={`w-5 h-5 transition-transform ${settingsOpen ? "rotate-90" : ""}`} />
          </button>
          
          {settingsOpen && (
            <div className="settings-panel">
              <div className="setting-item">
                <label>
                  <Clock className="w-4 h-4" />
                  Tempo por slide (segundos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={currentTvState?.slideTime || 5}
                  onChange={(e) => setSlideTime(selectedTv, Number(e.target.value))}
                  className="setting-input"
                />
              </div>
              
              <div className="setting-item">
                <label>Modo Automático</label>
                <button
                  onClick={() => setAutoMode(selectedTv, !currentTvState?.autoMode)}
                  className={`auto-toggle-small ${currentTvState?.autoMode ? "active" : ""}`}
                >
                  {currentTvState?.autoMode ? "ATIVO" : "INATIVO"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Instruções */}
        <section className="control-section instructions">
          <h2 className="section-title">Instruções</h2>
          <ol className="instructions-list">
            <li>Abra cada TV com sua URL: <code>/tv?id=tv1</code>, <code>/tv?id=tv2</code>, etc.</li>
            <li>Selecione a TV desejada acima</li>
            <li>Use os botões para alternar o conteúdo</li>
            <li>Altere as URLs dos iframes em tempo real</li>
            <li>Cole links de imagens dos patrocinadores (um por linha)</li>
            <li>Use "Todas" para aplicar em todas as TVs</li>
          </ol>
          <div className="network-warning">
            <strong>⚠️ Importante:</strong> A comunicação funciona apenas 
            se TV e Controle estiverem no mesmo domínio/origem.
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="control-footer">
        <p>Kiosk Multi-TV Control v2.0</p>
      </footer>
    </div>
  );
};

export default Controle;
