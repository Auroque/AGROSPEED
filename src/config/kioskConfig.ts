/**
 * CONFIGURAÇÕES CENTRALIZADAS DO KIOSK - MULTI-TV
 * 
 * Suporta controle individual de múltiplas TVs.
 * Cada TV é identificada por um ID único (tv1, tv2, tv3, tv4).
 * 
 * Altere os valores abaixo conforme necessário.
 */

// Tipos de animação disponíveis
export type AnimationType = "fade" | "fade-zoom" | "slide-left" | "slide-right" | "slide-up" | "none";

// Modos de exibição possíveis
export type KioskMode = "race" | "race2" | "sponsors";

// Interface para configuração de uma TV
export interface TVConfig {
  id: string;
  name: string;
}

export const kioskConfig = {
  // Lista de TVs disponíveis no sistema
  tvs: [
    { id: "tv1", name: "TV 1" },
    { id: "tv2", name: "TV 2" },
    { id: "tv3", name: "TV 3" },
    { id: "tv4", name: "TV 4" },
  ] as TVConfig[],

  // URLs padrão dos iframes
  defaultUrls: {
    race: "https://www.formula1.com/en/racing/2024",
    race2: "https://www.formula1.com/en/results/2024/races",
  },
  
  // Lista de imagens dos patrocinadores
  sponsors: [
    {
      id: 1,
      name: "Patrocinador Premium",
      logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=400&fit=crop",
    },
    {
      id: 2,
      name: "Patrocinador Ouro", 
      logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=800&h=400&fit=crop",
    },
    {
      id: 3,
      name: "Patrocinador Prata",
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=400&fit=crop",
    },
    {
      id: 4,
      name: "Patrocinador Bronze",
      logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=400&fit=crop",
    },
  ],
  
  // Tempo de exibição de cada slide (em segundos)
  defaultSlideTime: 5,
  
  // Tempo do modo automático - exibir patrocinadores a cada X segundos
  defaultAutoInterval: 300, // 5 minutos
  
  // Tempo para retornar ao placar automaticamente (em segundos)
  defaultAutoReturn: 30,
  
  // CONFIGURAÇÕES DE ANIMAÇÃO
  animation: {
    // Tipo de animação: "fade" | "fade-zoom" | "slide-left" | "slide-right" | "slide-up" | "none"
    type: "fade-zoom" as AnimationType,
    // Duração da animação em milissegundos (300-800ms recomendado)
    duration: 500,
    // Animação de entrada do slideshow
    slideAnimation: "fade" as AnimationType,
  },
  
  // Canal de comunicação (BroadcastChannel)
  channelName: "kiosk-sync-channel-v2",
  
  // Prefixo da chave do localStorage para estado persistente
  storageKeyPrefix: "kiosk-state-",
};

// Estrutura de um patrocinador
export interface Sponsor {
  id: number;
  name: string;
  logo: string;
}

// Estado de uma TV individual
export interface TVState {
  tvId: string;
  mode: KioskMode;
  currentSlide: number;
  autoMode: boolean;
  slideTime: number;
  autoInterval: number;
  autoReturn: number;
  iframeUrl: string;      // URL atual do iframe (dinâmica)
  iframeUrl2: string;     // URL da corrida alternativa
  sponsors: Sponsor[];    // Lista dinâmica de patrocinadores
  lastUpdate: number;
  isTransitioning?: boolean;
}

// Estado inicial padrão para uma TV
export const createDefaultTVState = (tvId: string): TVState => ({
  tvId,
  mode: "race",
  currentSlide: 0,
  autoMode: false,
  slideTime: kioskConfig.defaultSlideTime,
  autoInterval: kioskConfig.defaultAutoInterval,
  autoReturn: kioskConfig.defaultAutoReturn,
  iframeUrl: kioskConfig.defaultUrls.race,
  iframeUrl2: kioskConfig.defaultUrls.race2,
  sponsors: kioskConfig.sponsors, // Começa com patrocinadores padrão
  lastUpdate: Date.now(),
  isTransitioning: false,
});

// Tipos de comandos para sincronização
export type KioskCommand = 
  | { type: "SET_MODE"; tvId: string; mode: KioskMode }
  | { type: "SET_SLIDE"; tvId: string; index: number }
  | { type: "NEXT_SLIDE"; tvId: string }
  | { type: "SET_AUTO_MODE"; tvId: string; enabled: boolean }
  | { type: "SET_SLIDE_TIME"; tvId: string; seconds: number }
  | { type: "SET_IFRAME_URL"; tvId: string; url: string; urlType: "race" | "race2" }
  | { type: "UPDATE_SPONSORS"; tvId: string; sponsors: Sponsor[] }
  | { type: "SYNC_STATE"; tvId: string; state: TVState }
  | { type: "REQUEST_STATE"; tvId: string }
  | { type: "APPLY_TO_ALL"; action: Omit<KioskCommand, "tvId"> & { tvId?: string } };
