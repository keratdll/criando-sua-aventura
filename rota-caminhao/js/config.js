/* Configurações gerais, perfis de caminhão e regras regionais. */
(function (root) {
  'use strict';
  root.RC = root.RC || {};

  root.RC.config = {
    // Servidor público e gratuito do Valhalla (OpenStreetMap), com perfil de caminhão.
    valhallaUrl: 'https://valhalla1.openstreetmap.de',
    nominatimUrl: 'https://nominatim.openstreetmap.org',
    viacepUrl: 'https://viacep.com.br/ws',
    // Ruas com restrição para caminhão (gerado do OpenStreetMap por ferramentas/extrair_ruas.py).
    restrictionsFile: 'dados/ruas-restritas.json',
    // Zoom mínimo para desenhar as ruas proibidas (evita poluir o mapa afastado).
    restrictionsMinZoom: 12,

    // Região Metropolitana de SP + Baixada Santista: [oeste, norte, leste, sul]
    regionViewbox: [-47.25, -23.15, -45.65, -24.35],
    mapCenter: [-23.72, -46.55],
    mapZoom: 10,

    // Limite do servidor: soma dos perímetros das áreas evitadas ≤ 10 km.
    excludeSquareHalfMeters: 20,
    excludeMaxPerimeter: 9500,

    // Medidas típicas. O motorista ajusta para o seu veículo na aba "Caminhão".
    truckPresets: {
      toco: {
        id: 'toco', nome: 'Toco', descricao: '2 eixos · 1 eixo traseiro',
        height: 4.0, width: 2.6, length: 9.5, weight: 16, axles: 2, hazmat: false,
      },
      truck: {
        id: 'truck', nome: 'Truck', descricao: '3 eixos · 2 eixos traseiros',
        height: 4.2, width: 2.6, length: 12.5, weight: 23, axles: 3, hazmat: false,
      },
      carreta: {
        id: 'carreta', nome: 'Carreta', descricao: 'Cavalo + semirreboque · 5 eixos',
        height: 4.4, width: 2.6, length: 18.6, weight: 41.5, axles: 5, hazmat: false,
      },
    },

    // Tipos de problema que o motorista pode reportar no mapa.
    reportTypes: {
      ponte_baixa: {
        label: 'Ponte / viaduto baixo', icon: '🌉', field: 'height',
        fieldLabel: 'Altura livre (m)', hint: 'Se souber a altura, o app só desvia caminhões mais altos.',
      },
      rua_estreita: {
        label: 'Rua estreita / curva fechada', icon: '↔️', field: 'length',
        fieldLabel: 'Comprimento máximo que passa (m)', hint: 'Opcional. Em branco = evita para todos.',
      },
      proibido: { label: 'Proibido para caminhão', icon: '⛔' },
      peso: {
        label: 'Limite de peso', icon: '⚖️', field: 'weight',
        fieldLabel: 'Peso máximo (t)', hint: 'O app só desvia caminhões mais pesados.',
      },
      obra: { label: 'Obra / via bloqueada', icon: '🚧', ttlMinutes: 24 * 60 },
      congestionamento: { label: 'Congestionamento', icon: '🚦', ttlMinutes: 60 },
    },

    /*
     * ZMRC — Zona de Máxima Restrição de Circulação (São Paulo).
     * Polígono APROXIMADO do centro expandido (marginais Tietê e Pinheiros,
     * Av. dos Bandeirantes, Juntas Provisórias, Tancredo Neves e Salim Farah Maluf).
     * Serve apenas para alertar o motorista; confirme sempre as regras na CET.
     */
    zmrc: {
      nome: 'ZMRC (centro expandido de SP)',
      // Restrição para caminhões (exceto VUC): seg–sex 5h–21h, sáb 10h–14h.
      windows: { 1: [[5, 21]], 2: [[5, 21]], 3: [[5, 21]], 4: [[5, 21]], 5: [[5, 21]], 6: [[10, 14]] },
      rulesText: 'Caminhões (exceto VUC) não podem circular seg–sex das 5h às 21h e sáb das 10h às 14h, salvo autorização da CET.',
      polygon: [
        [-23.5225, -46.7440], [-23.5150, -46.7180], [-23.5110, -46.6900],
        [-23.5130, -46.6600], [-23.5170, -46.6300], [-23.5225, -46.6000],
        [-23.5270, -46.5720], [-23.5400, -46.5660], [-23.5600, -46.5700],
        [-23.5850, -46.5790], [-23.5990, -46.5870], [-23.6080, -46.6000],
        [-23.6120, -46.6230], [-23.6120, -46.6420], [-23.6130, -46.6650],
        [-23.6150, -46.6900], [-23.6040, -46.6960], [-23.5880, -46.6950],
        [-23.5700, -46.7020], [-23.5540, -46.7150], [-23.5400, -46.7350],
      ],
    },

    // Mapa de trânsito ao vivo (opcional): plano gratuito da TomTom, chave em "Ajustes".
    tomtomTrafficUrl: 'https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key={key}&tileSize=256',
  };
})(typeof self !== 'undefined' ? self : this);
