// Paleta oficial extraída das variáveis CSS de codrian.com.br
export const C = {
  void: "#100C1C",
  black: "#05030A",
  deep: "#271942",
  violet: "#6938E8",
  violetHi: "#8B6CFF",
  lime: "#B7FF4A",
  ink: "#F4F1FF",
  mist: "#CFC6EE",
  muted: "#8E83B8",
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 22 * FPS; // 660

// Área segura do Reels para texto
export const SAFE_TOP = 220;
export const SAFE_BOTTOM = H - 380; // 1540

// Centro da boca (espaço da cena)
export const MX = 560;
export const MY = 760;
export const MR = 330;

// Linha do tempo (frames). Notação do roteiro "X:YY" lida como segundos (1:30 = 1,5 s).
export const T = {
  s1: 0,
  s2: 45, // 1,5 s
  s3: 180, // 6 s
  lineStart: 222,
  connect: 240, // sucção congela
  pulse: 258, // fim do silêncio, pulso + voz
  s4: 315, // 10,5 s
  explode: 330,
  rebuild: 380,
  pin: 425,
  network: 440,
  s5: 480, // 16 s
  end: 660,
};
