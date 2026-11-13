// ===== MARCA CODRIAN (ID Visual oficial: tokens.json do artefato "Codrian - ID Visual") =====
export const C = {
  navy: '#100c1c', // void  – fundo principal
  navy2: '#271942', // deep – superfície
  violet: '#6938e8',
  hi: '#8b6cff', // violet-hi – destaque
  lime: '#b7ff4a', // a faísca
  white: '#f4f1ff', // ink
  mist: '#cfc6ee',
  muted: '#8e83b8',
  yellow: '#8b6cff', // legado: destaque de palavra = violet-hi
  cyan: '#8b6cff',
  coral: '#FF4D5E', // só para erro/alarme (cor semântica fora da marca)
  green: '#25D366', // cor do botão WhatsApp do site fictício do cliente
  paper: '#F4F6FB',
  wall: '#2b1d52',
  floor: '#0c0916',
  suit: '#3a2a73',
  skinA: '#F2B58A',
  skinB: '#C98B5E',
  skinC: '#8D5A3B',
  ink: '#100c1c',
};
export const FONT = '"DM Sans", system-ui, sans-serif';
export const PIXEL = '"Silkscreen", ui-monospace, monospace';
export const BRAND = {name: 'codrian', handle: '@codrian', glyph: '</>'};
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const s2f = (s: number) => Math.round(s * FPS);
