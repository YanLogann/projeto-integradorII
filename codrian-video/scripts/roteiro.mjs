// Roteiro "O CLIENTE FOI ROUBADO" — CODRIAN (45s, vertical)
// Cada fala vira um arquivo de voz (ElevenLabs) + legenda sincronizada por timestamp.
// `at` = segundo em que a fala começa no vídeo final. `cue` = nome usado pelas cenas.

export const VOICES = {
  detetive: { id: 'jkiD8IhCU1i2V7VvmNwi', name: 'Randel - Deep Epic', settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true } },
  vitima:   { id: '6PhbMr9YjdeOaTNz9y24', name: 'Davi Leão - Natural', settings: { stability: 0.35, similarity_boost: 0.8, style: 0.45, use_speaker_boost: true } },
};

export const FALAS = [
  { cue: 'caso',      voz: 'detetive', at: 0.6,  texto: 'Caso zero quarenta e sete. Um cliente desapareceu.' },
  { cue: 'vitima',    voz: 'detetive', at: 5.0,  texto: 'A vítima: Marcos. Doze anos de mercado.' },
  { cue: 'depoimento',voz: 'vitima',   at: 8.2,  texto: 'Ele pediu orçamento no direct… e sumiu.' },
  { cue: 'pista',     voz: 'detetive', at: 11.2, texto: 'Pesquisou no Google. Achou o Marcos. Quatro segundos… e saiu.' },
  { cue: 'concorrente',voz:'detetive', at: 17.4, texto: 'Seis minutos depois, fechou com o concorrente.' },
  { cue: 'twist',     voz: 'detetive', at: 21.6, texto: 'Mas ninguém roubou esse cliente.' },
  { cue: 'entregue',  voz: 'detetive', at: 24.2, texto: 'Ele foi entregue. Por um perfil sem site, sem prova, sem caminho.' },
  { cue: 'arma',      voz: 'detetive', at: 29.3, texto: 'A arma do concorrente? Uma Landing Page.' },
  { cue: 'lp',        voz: 'detetive', at: 32.4, texto: 'Abre em um segundo. Mostra prova. E leva direto pro WhatsApp.' },
  { cue: 'encerrado', voz: 'detetive', at: 37.6, texto: 'Caso encerrado. CODRIAN.' },
  { cue: 'cta',       voz: 'detetive', at: 40.6, texto: 'Siga a CODRIAN… antes que o próximo seja o seu.' },
];

// Legendas: texto exibido (pode diferir do falado, ex.: números).
export const LEGENDA_OVERRIDE = {
  caso: { 'zero quarenta e sete.': '047.' },
};

export const DURACAO = 45;
