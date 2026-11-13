// Fonte única de verdade: formato, paleta (brand book Codrian), cenas e marcos de som.
export const W = 1080, H = 1920, FPS = 30, DURATION = 40;

// Paleta oficial (Pacote do Yan, seção 3). O "verde" institucional é o lima #B7FF4A (a faísca).
export const BRAND = {
  void: '#100C1C', deep: '#271942', violet: '#6938E8', violetHi: '#8B6CFF',
  lime: '#B7FF4A', ink: '#F4F1FF', mist: '#CFC6EE', muted: '#8E83B8', black: '#06040D',
  danger: '#FF4D6D'
};

export const SCENES = {
  s1: { start: 0,  end: 4,  name: 'DIGITAL APOCALYPSE' },
  s2: { start: 4,  end: 10, name: 'THE BUSINESSMAN' },
  s3: { start: 10, end: 16, name: 'THE COMPETITOR' },
  s4: { start: 16, end: 24, name: 'THE AI AWAKENS' },
  s5: { start: 24, end: 34, name: 'THE SOLUTION' },
  s6: { start: 34, end: 40, name: 'CODRIAN REVEAL' }
};

// Marcos de sincronia (segundos). 120 BPM -> 1 beat = 0.5s, 1 compasso = 2s.
export const BPM = 120;
export const T = {
  open: 0.0, headline: 1.15,
  officeCut: 4.0, notif1: 4.55, notif2: 5.35, notif3: 6.15, comicPause: 6.95, lunch: 7.45,
  rivalCut: 10.0, rivalSpin: 12.1, rivalLine: 12.75, search: 14.1,
  freeze: 16.0, wave: 17.4, aiLine: 19.7, aiOut: 23.2,
  s5: 24.0, cutIA: 27.0, cutCRM: 28.5, cutPresence: 30.5, recap: 33.0,
  reveal: 35.0, tagline: 38.4, cta: 39.05, end: 40
};

// Locuções (ElevenLabs): vozes Yan v1 e Rodrigo Ishikawa em destaque.
export const VO = {
  s1:  { file: 's1_headline', at: 1.15, gain: 1.0, fx: 'deep' },
  s2:  { file: 's2_lunch',    at: 7.45, gain: 1.1, fx: 'dry' },
  s3:  { file: 's3_rival',    at: 12.75, gain: 1.0, fx: 'room' },
  s4:  { file: 's4_ai',       at: 19.7, gain: 1.05, fx: 'ai' },
  s5:  { file: 's5_narr',     at: 24.5, gain: 1.0, fx: 'narr' },
  s6a: { file: 's6_brand',    at: 35.0, gain: 1.05, fx: 'narr' },
  s6b: { file: 's6_cta',      at: 38.4, gain: 1.0, fx: 'narr' }
};

// Textos (roteiro aprovado).
export const COPY = {
  headline: 'SUA EMPRESA ESTÁ PERDENDO DINHEIRO.',
  notifs: ['Oi, gostaria de um orçamento.', 'Tem alguém aí?', 'Fechei com outra empresa.'],
  lunch: 'MAS EU ESTAVA NO ALMOÇO!',
  rival: 'Mais um cliente conquistado.',
  ai: ['VOCÊ NÃO PRECISA TRABALHAR MAIS.', 'PRECISA TRABALHAR MELHOR.'],
  narr: 'Sites, automações, inteligência artificial e soluções tecnológicas para transformar a maneira como sua empresa trabalha.',
  brand: 'CODRIAN. A tecnologia trabalhando a favor do seu negócio.',
  tagline: 'NÃO FIQUE PARA TRÁS.',
  cta: 'Siga @codrian e descubra o próximo nível.',
  brandLines: ['Sites que colocam sua empresa no mapa.', 'IA que ajuda ela a crescer.']
};
