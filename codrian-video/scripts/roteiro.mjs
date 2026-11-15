// Roteiro "O CLIENTE FOI ROUBADO" — CODRIAN (45s, vertical)
// Cada fala vira um arquivo de voz (ElevenLabs) + legenda sincronizada por timestamp.
// `at` = segundo em que a fala começa no vídeo final. `cue` = nome usado pelas cenas.

export const MODEL = 'eleven_v3'; // v3 aceita tags de emoção entre colchetes

export const VOICES = {
  detetive: { id: 'jkiD8IhCU1i2V7VvmNwi', name: 'Randel - Deep Epic', settings: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true } },
  vitima:   { id: '6PhbMr9YjdeOaTNz9y24', name: 'Davi Leão - Natural', settings: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true } },
};

// `tag` = direção de atuação (não é falada nem vai para a legenda).
// Todas as falas do detetive são geradas numa ÚNICA tomada contínua (arco emocional sem quebras)
// e depois recortadas nos silêncios entre as frases.
export const FALAS = [
  { cue: 'caso',       voz: 'detetive', at: 0.5,  tag: '[serious]',    texto: 'Caso zero quarenta e sete. Um cliente desapareceu.' },
  { cue: 'vitima',     voz: 'detetive', at: 4.4,  tag: '[grave]',      texto: 'A vítima: Marcos. Doze anos de mercado.' },
  { cue: 'depoimento', voz: 'vitima',   at: 8.05,  tag: '[frustrated]', texto: 'Ele pediu orçamento no direct… e sumiu.' },
  { cue: 'pista',      voz: 'detetive', at: 12.0, tag: '[suspicious]', texto: 'Pesquisou no Google. Achou o Marcos. Quatro segundos… e saiu.' },
  { cue: 'concorrente',voz: 'detetive', at: 17.3, tag: '[tense]',      texto: 'Seis minutos depois, fechou com o concorrente.' },
  { cue: 'twist',      voz: 'detetive', at: 21.5, tag: '[whispers]',   texto: 'Mas ninguém roubou esse cliente.' },
  { cue: 'entregue',   voz: 'detetive', at: 23.9, tag: '[intense]',    texto: 'Ele foi entregue. Por um perfil sem site, sem prova, sem caminho.' },
  { cue: 'arma',       voz: 'detetive', at: 29.05, tag: '[dramatic]',   texto: 'A arma do concorrente? Uma Landing Page.' },
  { cue: 'lp',         voz: 'detetive', at: 32.2, tag: '[confident]',  texto: 'Abre em um segundo. Mostra prova. E leva direto pro WhatsApp.' },
  { cue: 'encerrado',  voz: 'detetive', at: 37.4, tag: '[satisfied]',  texto: 'Caso encerrado. CODRIAN.' },
  { cue: 'cta',        voz: 'detetive', at: 40.5, tag: '[warmly]',     texto: 'Siga a CODRIAN… antes que o próximo seja o seu.' },
];

// Legendas: texto exibido (pode diferir do falado, ex.: números).
export const LEGENDA_OVERRIDE = {
  caso: { 'zero quarenta e sete.': '047.' },
};

export const DURACAO = 45;
