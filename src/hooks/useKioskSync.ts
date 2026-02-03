/**
 * HOOK DE SINCRONIZAÇÃO DO KIOSK - MULTI-TV
 * 
 * Gerencia a comunicação entre múltiplas Telas TV e Tela Controle
 * usando BroadcastChannel com fallback para localStorage.
 * 
 * Cada TV possui seu próprio estado e responde apenas aos comandos
 * direcionados ao seu ID.
 * 
 * Funciona apenas na mesma origem (same-origin).
 * Para redes diferentes, seria necessário WebSocket com backend.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  kioskConfig, 
  TVState, 
  KioskCommand, 
  KioskMode,
  createDefaultTVState 
} from "@/config/kioskConfig";

interface UseKioskSyncOptions {
  // Se true, este é o controle que envia comandos
  // Se false, é a TV que recebe comandos
  isController: boolean;
  // ID da TV (obrigatório se não for controller)
  tvId?: string;
}

// Estado de todas as TVs (para o controller)
type AllTVsState = Record<string, TVState>;

export const useKioskSync = ({ isController, tvId }: UseKioskSyncOptions) => {
  // Para TV: estado da própria TV
  // Para Controller: estado de todas as TVs
  const [tvState, setTvState] = useState<TVState>(() => {
    if (!isController && tvId) {
      try {
        const saved = localStorage.getItem(kioskConfig.storageKeyPrefix + tvId);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.warn("Erro ao recuperar estado:", e);
      }
      return createDefaultTVState(tvId);
    }
    return createDefaultTVState("unknown");
  });

  const [allTvsState, setAllTvsState] = useState<AllTVsState>(() => {
    if (isController) {
      const initialState: AllTVsState = {};
      kioskConfig.tvs.forEach(tv => {
        try {
          const saved = localStorage.getItem(kioskConfig.storageKeyPrefix + tv.id);
          if (saved) {
            initialState[tv.id] = JSON.parse(saved);
          } else {
            initialState[tv.id] = createDefaultTVState(tv.id);
          }
        } catch (e) {
          initialState[tv.id] = createDefaultTVState(tv.id);
        }
      });
      return initialState;
    }
    return {};
  });

  // Indica se há TVs conectadas
  const [connectedTvs, setConnectedTvs] = useState<Set<string>>(new Set());

  // Referência para o BroadcastChannel
  const channelRef = useRef<BroadcastChannel | null>(null);

  /**
   * Persiste o estado de uma TV no localStorage
   */
  const persistState = useCallback((state: TVState) => {
    try {
      localStorage.setItem(kioskConfig.storageKeyPrefix + state.tvId, JSON.stringify(state));
    } catch (e) {
      console.warn("Erro ao salvar estado:", e);
    }
  }, []);

  /**
   * Envia um comando via BroadcastChannel
   */
  const sendCommand = useCallback((command: KioskCommand) => {
    if (channelRef.current) {
      channelRef.current.postMessage(command);
    }
    
    // Fallback: CustomEvent para mesma tab
    const event = new CustomEvent("kiosk-command", { detail: command });
    window.dispatchEvent(event);
  }, []);

  /**
   * COMANDOS DO CONTROLLER - Envia para uma TV específica
   */
  const setMode = useCallback((targetTvId: string, mode: KioskMode) => {
    sendCommand({ type: "SET_MODE", tvId: targetTvId, mode });
    
    // Atualiza estado local do controller
    setAllTvsState(prev => ({
      ...prev,
      [targetTvId]: { ...prev[targetTvId], mode, currentSlide: 0, lastUpdate: Date.now() }
    }));
    persistState({ ...allTvsState[targetTvId], mode, currentSlide: 0, lastUpdate: Date.now() });
  }, [sendCommand, allTvsState, persistState]);

  const setSlide = useCallback((targetTvId: string, index: number) => {
    sendCommand({ type: "SET_SLIDE", tvId: targetTvId, index });
    
    setAllTvsState(prev => ({
      ...prev,
      [targetTvId]: { ...prev[targetTvId], currentSlide: index, lastUpdate: Date.now() }
    }));
  }, [sendCommand]);

  const setAutoMode = useCallback((targetTvId: string, enabled: boolean) => {
    sendCommand({ type: "SET_AUTO_MODE", tvId: targetTvId, enabled });
    
    setAllTvsState(prev => ({
      ...prev,
      [targetTvId]: { ...prev[targetTvId], autoMode: enabled, lastUpdate: Date.now() }
    }));
  }, [sendCommand]);

  const setSlideTime = useCallback((targetTvId: string, seconds: number) => {
    sendCommand({ type: "SET_SLIDE_TIME", tvId: targetTvId, seconds });
    
    setAllTvsState(prev => ({
      ...prev,
      [targetTvId]: { ...prev[targetTvId], slideTime: seconds, lastUpdate: Date.now() }
    }));
  }, [sendCommand]);

  const setIframeUrl = useCallback((targetTvId: string, url: string, urlType: "race" | "race2" = "race") => {
    sendCommand({ type: "SET_IFRAME_URL", tvId: targetTvId, url, urlType });
    
    setAllTvsState(prev => {
      const updated = {
        ...prev[targetTvId],
        [urlType === "race" ? "iframeUrl" : "iframeUrl2"]: url,
        lastUpdate: Date.now()
      };
      persistState(updated);
      return { ...prev, [targetTvId]: updated };
    });
  }, [sendCommand, persistState]);

  /**
   * Atualiza patrocinadores de uma TV
   */
  const updateSponsors = useCallback((targetTvId: string, sponsors: typeof kioskConfig.sponsors) => {
    sendCommand({ type: "UPDATE_SPONSORS", tvId: targetTvId, sponsors });
    
    setAllTvsState(prev => {
      const updated = {
        ...prev[targetTvId],
        sponsors,
        currentSlide: 0,
        lastUpdate: Date.now()
      };
      persistState(updated);
      return { ...prev, [targetTvId]: updated };
    });
  }, [sendCommand, persistState]);

  /**
   * Aplica comando para todas as TVs
   */
  const applyToAll = useCallback((action: { type: string; [key: string]: any }) => {
    kioskConfig.tvs.forEach(tv => {
      sendCommand({ ...action, tvId: tv.id } as KioskCommand);
    });
    
    // Atualiza estado local de todas as TVs
    setAllTvsState(prev => {
      const updated = { ...prev };
      kioskConfig.tvs.forEach(tv => {
        if (action.type === "SET_MODE") {
          updated[tv.id] = { ...updated[tv.id], mode: action.mode, currentSlide: 0, lastUpdate: Date.now() };
        } else if (action.type === "SET_IFRAME_URL") {
          const urlKey = action.urlType === "race" ? "iframeUrl" : "iframeUrl2";
          updated[tv.id] = { ...updated[tv.id], [urlKey]: action.url, lastUpdate: Date.now() };
        } else if (action.type === "UPDATE_SPONSORS") {
          updated[tv.id] = { ...updated[tv.id], sponsors: action.sponsors, currentSlide: 0, lastUpdate: Date.now() };
        }
        persistState(updated[tv.id]);
      });
      return updated;
    });
  }, [sendCommand, persistState]);

  /**
   * Próximo slide (para a TV)
   */
  const nextSlide = useCallback(() => {
    if (!isController && tvId) {
      setTvState(prev => {
        const nextIndex = (prev.currentSlide + 1) % kioskConfig.sponsors.length;
        const newState = { ...prev, currentSlide: nextIndex, lastUpdate: Date.now() };
        persistState(newState);
        return newState;
      });
    }
  }, [isController, tvId, persistState]);

  /**
   * Processa comandos recebidos (para a TV)
   */
  const handleCommand = useCallback((command: KioskCommand) => {
    // TV só processa comandos para seu próprio ID
    if (!isController && tvId) {
      if ("tvId" in command && command.tvId !== tvId) {
        return; // Ignora comandos para outras TVs
      }

      switch (command.type) {
        case "SET_MODE":
          setTvState(prev => {
            const newState = { ...prev, mode: command.mode, currentSlide: 0, lastUpdate: Date.now() };
            persistState(newState);
            return newState;
          });
          break;
        case "SET_SLIDE":
          setTvState(prev => {
            const newState = { ...prev, currentSlide: command.index, lastUpdate: Date.now() };
            persistState(newState);
            return newState;
          });
          break;
        case "NEXT_SLIDE":
          nextSlide();
          break;
        case "SET_AUTO_MODE":
          setTvState(prev => {
            const newState = { ...prev, autoMode: command.enabled, lastUpdate: Date.now() };
            persistState(newState);
            return newState;
          });
          break;
        case "SET_SLIDE_TIME":
          setTvState(prev => {
            const newState = { ...prev, slideTime: command.seconds, lastUpdate: Date.now() };
            persistState(newState);
            return newState;
          });
          break;
        case "SET_IFRAME_URL":
          setTvState(prev => {
            const urlKey = command.urlType === "race" ? "iframeUrl" : "iframeUrl2";
            const newState = { ...prev, [urlKey]: command.url, lastUpdate: Date.now() };
            persistState(newState);
            return newState;
          });
          break;
        case "UPDATE_SPONSORS":
          setTvState(prev => {
            const newState = { ...prev, sponsors: command.sponsors, currentSlide: 0, lastUpdate: Date.now() };
            persistState(newState);
            return newState;
          });
          break;
        case "SYNC_STATE":
          setTvState(command.state);
          persistState(command.state);
          break;
        case "REQUEST_STATE":
          // Responde com o estado atual
          sendCommand({ type: "SYNC_STATE", tvId, state: tvState });
          break;
      }
    }

    // Controller atualiza estado quando recebe SYNC_STATE
    if (isController && command.type === "SYNC_STATE") {
      setAllTvsState(prev => ({
        ...prev,
        [command.tvId]: command.state
      }));
      setConnectedTvs(prev => new Set([...prev, command.tvId]));
    }
  }, [isController, tvId, persistState, sendCommand, nextSlide, tvState]);

  /**
   * Inicializa o BroadcastChannel
   */
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel(kioskConfig.channelName);
      
      channelRef.current.onmessage = (event) => {
        handleCommand(event.data as KioskCommand);
      };

      // Se é TV, solicita estado atual
      if (!isController && tvId) {
        channelRef.current.postMessage({ type: "REQUEST_STATE", tvId });
      }

      // Se é Controller, solicita estado de todas as TVs
      if (isController) {
        kioskConfig.tvs.forEach(tv => {
          channelRef.current?.postMessage({ type: "REQUEST_STATE", tvId: tv.id });
        });
      }

    } catch (e) {
      console.warn("BroadcastChannel não suportado, usando fallback:", e);
    }

    // Listener para fallback via CustomEvent
    const handleCustomEvent = (e: Event) => {
      const command = (e as CustomEvent<KioskCommand>).detail;
      handleCommand(command);
    };
    window.addEventListener("kiosk-command", handleCustomEvent);

    // Listener para storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(kioskConfig.storageKeyPrefix) && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue) as TVState;
          if (!isController && tvId && newState.tvId === tvId) {
            setTvState(newState);
          }
          if (isController) {
            setAllTvsState(prev => ({ ...prev, [newState.tvId]: newState }));
          }
        } catch (err) {
          console.warn("Erro ao processar storage event:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      channelRef.current?.close();
      window.removeEventListener("kiosk-command", handleCustomEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, [handleCommand, isController, tvId]);

  return {
    // Para TV
    state: tvState,
    nextSlide,
    
    // Para Controller
    allTvsState,
    connectedTvs,
    setMode,
    setSlide,
    setAutoMode,
    setSlideTime,
    setIframeUrl,
    updateSponsors,
    applyToAll,
    sendCommand,
  };
};
