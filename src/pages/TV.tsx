/**
 * TELA DE APRESENTAÇÃO (TV) - MULTI-TV
 * 
 * Esta página deve ser aberta nas TVs em modo fullscreen/kiosk.
 * Cada TV é identificada por um ID na URL.
 * 
 * USO:
 * 1. TV 1: /tv?id=tv1
 * 2. TV 2: /tv?id=tv2
 * 3. TV 3: /tv?id=tv3
 * 4. TV 4: /tv?id=tv4
 * 5. Pressione F11 para fullscreen
 * 
 * MODOS DE EXIBIÇÃO:
 * - race: Placar principal (iframe)
 * - race2: Corrida alternativa (outro iframe)
 * - sponsors: Slideshow de patrocinadores
 * 
 * ANIMAÇÕES:
 * - Transições suaves entre modos (fade-zoom, slide, etc.)
 * - Configurável via kioskConfig.animation
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useKioskSync } from "@/hooks/useKioskSync";
import { kioskConfig, KioskMode } from "@/config/kioskConfig";

const TV = () => {
  // Obtém o ID da TV da URL (?id=tv1)
  const [searchParams] = useSearchParams();
  const tvId = searchParams.get("id") || "tv1";

  // Valida se o ID é válido
  const isValidTv = useMemo(() => 
    kioskConfig.tvs.some(tv => tv.id === tvId),
    [tvId]
  );

  // Hook de sincronização (modo TV = não é controller)
  const { state, nextSlide } = useKioskSync({ isController: false, tvId });
  
  // Estado para detectar erro no iframe
  const [iframeError, setIframeError] = useState(false);
  const [iframe2Error, setIframe2Error] = useState(false);
  
  // Estado de animação - controla transições entre modos
  const [displayMode, setDisplayMode] = useState<KioskMode>(state.mode);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<"enter" | "exit" | "idle">("idle");
  
  // Estado do slide atual para animação
  const [displaySlide, setDisplaySlide] = useState(state.currentSlide);
  const [slideAnimating, setSlideAnimating] = useState(false);
  
  // Timer do slideshow
  const slideshowTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Classe CSS para o tipo de animação configurado
   */
  const getAnimationClass = useCallback((phase: "enter" | "exit") => {
    const { type } = kioskConfig.animation;
    
    // Fallback: se navegador não suportar animações
    if (!CSS.supports("animation", "none")) {
      return "";
    }
    
    switch (type) {
      case "fade":
        return phase === "exit" ? "anim-fade-out" : "anim-fade-in";
      case "fade-zoom":
        return phase === "exit" ? "anim-fade-zoom-out" : "anim-fade-zoom-in";
      case "slide-left":
        return phase === "exit" ? "anim-slide-left-out" : "anim-slide-left-in";
      case "slide-right":
        return phase === "exit" ? "anim-slide-right-out" : "anim-slide-right-in";
      case "slide-up":
        return phase === "exit" ? "anim-slide-up-out" : "anim-slide-up-in";
      case "none":
      default:
        return "";
    }
  }, []);

  /**
   * Gerencia transição animada ao trocar de modo
   */
  useEffect(() => {
    if (state.mode !== displayMode && !isAnimating) {
      const { duration } = kioskConfig.animation;
      
      setIsAnimating(true);
      setAnimationPhase("exit");
      
      setTimeout(() => {
        setDisplayMode(state.mode);
        setAnimationPhase("enter");
        
        setTimeout(() => {
          setIsAnimating(false);
          setAnimationPhase("idle");
        }, duration);
      }, duration);
    }
  }, [state.mode, displayMode, isAnimating]);

  /**
   * Gerencia animação de transição entre slides
   */
  useEffect(() => {
    if (state.currentSlide !== displaySlide && !slideAnimating && displayMode === "sponsors") {
      const { duration } = kioskConfig.animation;
      
      setSlideAnimating(true);
      
      setTimeout(() => {
        setDisplaySlide(state.currentSlide);
        setSlideAnimating(false);
      }, duration / 2);
    }
  }, [state.currentSlide, displaySlide, slideAnimating, displayMode]);

  /**
   * Gerencia o slideshow automático de patrocinadores
   */
  useEffect(() => {
    if (state.mode === "sponsors") {
      slideshowTimer.current = setInterval(() => {
        nextSlide();
      }, state.slideTime * 1000);
    }

    return () => {
      if (slideshowTimer.current) {
        clearInterval(slideshowTimer.current);
      }
    };
  }, [state.mode, state.slideTime, nextSlide]);

  /**
   * Esconde o cursor após 1 segundo de inatividade
   */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    const hideCursor = () => {
      document.body.classList.add("hide-cursor");
    };
    
    const showCursor = () => {
      document.body.classList.remove("hide-cursor");
      clearTimeout(timer);
      timer = setTimeout(hideCursor, 1000);
    };

    timer = setTimeout(hideCursor, 1000);
    
    window.addEventListener("mousemove", showCursor);
    
    return () => {
      window.removeEventListener("mousemove", showCursor);
      clearTimeout(timer);
      document.body.classList.remove("hide-cursor");
    };
  }, []);

  /**
   * Ativa fullscreen automaticamente ao clicar
   */
  const handleClick = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // Classe de animação baseada na fase atual
  const contentAnimationClass = animationPhase !== "idle" 
    ? getAnimationClass(animationPhase) 
    : "";

  // Duração CSS para animações
  const animationStyle = {
    "--animation-duration": `${kioskConfig.animation.duration}ms`
  } as React.CSSProperties;

  // Se TV ID inválido, mostra erro
  if (!isValidTv) {
    return (
      <div className="tv-container" style={animationStyle}>
        <div className="tv-fallback">
          <div className="tv-fallback-icon">❌</div>
          <h1 className="tv-fallback-title">TV não encontrada</h1>
          <p className="tv-fallback-text">
            O ID "{tvId}" não é válido.
          </p>
          <p className="tv-fallback-url">
            Use: /tv?id=tv1 | tv2 | tv3 | tv4
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="tv-container"
      onClick={handleClick}
      style={animationStyle}
    >
      {/* Indicador de TV (visível apenas brevemente) */}
      <div className="tv-id-indicator">{tvId.toUpperCase()}</div>

      {/* MODO CORRIDA 1: exibe iframe principal */}
      {displayMode === "race" && (
        <div className={`tv-content ${contentAnimationClass}`}>
          {iframeError ? (
            <div className="tv-fallback">
              <div className="tv-fallback-icon">🏁</div>
              <h1 className="tv-fallback-title">Placar ao Vivo</h1>
              <p className="tv-fallback-text">
                O site do placar não permite exibição em iframe.
              </p>
              <p className="tv-fallback-url">{state.iframeUrl}</p>
            </div>
          ) : (
            <iframe
              src={state.iframeUrl}
              className="tv-iframe"
              title="Placar da Corrida"
              allow="autoplay; fullscreen"
              onError={() => setIframeError(true)}
            />
          )}
        </div>
      )}

      {/* MODO CORRIDA 2: exibe iframe alternativo */}
      {displayMode === "race2" && (
        <div className={`tv-content ${contentAnimationClass}`}>
          {iframe2Error ? (
            <div className="tv-fallback">
              <div className="tv-fallback-icon">🏎️</div>
              <h1 className="tv-fallback-title">Corrida Alternativa</h1>
              <p className="tv-fallback-text">
                O site não permite exibição em iframe.
              </p>
              <p className="tv-fallback-url">{state.iframeUrl2}</p>
            </div>
          ) : (
            <iframe
              src={state.iframeUrl2}
              className="tv-iframe"
              title="Corrida Alternativa"
              allow="autoplay; fullscreen"
              onError={() => setIframe2Error(true)}
            />
          )}
        </div>
      )}

      {/* MODO PATROCINADORES: slideshow com animações */}
      {displayMode === "sponsors" && (
        <div className={`tv-sponsors ${contentAnimationClass}`}>
          {(state.sponsors || kioskConfig.sponsors).map((sponsor, index) => (
            <div
              key={sponsor.id}
              className={`tv-sponsor-slide ${
                index === displaySlide ? "active" : "inactive"
              } ${slideAnimating && index === displaySlide ? "slide-entering" : ""}`}
            >
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="tv-sponsor-logo"
                onError={(e) => {
                  // Se imagem falhar, esconde o slide
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="tv-sponsor-name">{sponsor.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TV;
