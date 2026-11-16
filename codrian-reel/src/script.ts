// FONTE ÚNICA do roteiro. Textos na tela, narração e vozes saem daqui.
// gen-voice.mjs importa este arquivo (Node 22+ roda .ts com type-stripping).

// ID visual: artefato "Codrian - ID Visual" (logo, cores, fontes, motion)
export const BRAND = {
  name: 'Codrian',
  handle: '@codrian_ofc',
  signature: ['Sites que colocam', 'sua empresa no mapa.'],
}

// Loja fictícia usada na demonstração
export const STORE = {
  name: 'Doce Lima Confeitaria',
  short: 'Doce Lima',
  handle: '@docelima.confeitaria',
  city: 'Campinas, SP',
  competitor: 'Confeitaria Aurora',
  competitorRating: '4,8',
  competitorReviews: '312',
}

export type SceneId = 'gancho' | 'dor' | 'virada' | 'serie' | 'cta'

export interface SceneScript {
  id: SceneId
  /** duração mínima visual (s). A cena dura max(min, fala + respiro). */
  minDuration: number
  /** texto narrado — também vira a legenda queimada */
  narration: string
}

export const SCENES: SceneScript[] = [
  { id: 'gancho', minDuration: 2, narration: 'Só no Instagram?' },
  {
    id: 'dor',
    minDuration: 5,
    narration: 'Seu cliente te procura no Google e não vê uma apresentação da sua empresa. Só a do concorrente.',
  },
  {
    id: 'virada',
    minDuration: 9,
    narration:
      'A Codrian transforma seu perfil num site completo: cardápio, endereço, avaliações e um botão direto pro seu WhatsApp.',
  },
  {
    id: 'serie',
    minDuration: 5.4,
    narration: 'Olha quem saiu só do Instagram e passou a ser encontrado no Google.',
  },
  {
    id: 'cta',
    minDuration: 5,
    narration: 'Segue a Codrian. Seu próximo cliente tá te procurando agora.',
  },
]

// Textos de tela (não narrados)
export const COPY = {
  gancho: { pre: 'SÓ', post: 'NO INSTAGRAM?' },
  dor: {
    query: STORE.name,
    results: [
      { site: 'instagram.com › docelima.confeitaria', title: 'Doce Lima (@docelima.confeitaria) • Instagram', snippet: '48 posts · 1.240 seguidores' },
      { site: 'guiadobairro.com.br › campinas', title: 'Doce Lima Confeitaria – Campinas, SP', snippet: 'Telefone e horário não informados.' },
    ],
    missingTitle: 'Nenhuma apresentação da empresa',
    missing: ['Sem site', 'sem cardápio', 'sem fotos dos produtos'],
    rivalHas: ['Site', 'Cardápio', 'Fotos', 'WhatsApp'],
  },
  virada: {
    heroTitle: 'Bolos que viram memória.',
    heroSub: 'Encomendas para festas e eventos em Campinas.',
    sections: ['Cardápio', 'Como chegar', 'Avaliações'],
    menu: [
      { item: 'Bolo de limão siciliano', price: 'R$ 89' },
      { item: 'Naked cake frutas vermelhas', price: 'R$ 129' },
      { item: 'Caixa 12 brigadeiros', price: 'R$ 42' },
    ],
    address: 'R. das Laranjeiras, 214 · Cambuí',
    rating: '4,9',
    review: '“Achei pelo Google e encomendei no mesmo dia.”',
    whatsapp: 'Pedir no WhatsApp',
  },
  serie: {
    title: ['Antes', 'depois'],
    cases: [
      { name: 'Barbearia Navalha', before: '/cases/navalha-antes.svg', after: '/cases/navalha-depois.svg', result: 'Agenda online + WhatsApp' },
      { name: 'Pet Toca', before: '/cases/pettoca-antes.svg', after: '/cases/pettoca-depois.svg', result: 'Serviços, preços e mapa' },
      { name: 'Ateliê Flor de Sal', before: '/cases/flordesal-antes.svg', after: '/cases/flordesal-depois.svg', result: 'Catálogo com pedido no WhatsApp' },
    ],
    disclaimer: 'CASOS ILUSTRATIVOS',
  },
  cta: { follow: 'Seguir', following: 'Seguindo' },
}

// Vozes para comparação (biblioteca ElevenLabs, sotaque brasileiro)
export const VOICES = {
  masculina: { id: 'cXmaMIwfUQ3FpdM3KmoB', label: 'Masculina firme — Márcio Duarte' },
  feminina: { id: 'TOXnXBKJSHqTwwqoWW0D', label: 'Feminina clara — Christine' },
  jovem: { id: '6PhbMr9YjdeOaTNz9y24', label: 'Jovem — Davi Leão' },
} as const

export type VoiceKey = keyof typeof VOICES

export const TTS = {
  model: 'eleven_v4',
  language: 'pt',
  /** silêncio antes da fala dentro da cena (s) */
  lead: 0.15,
  /** respiro depois da fala (s) */
  tail: 0.35,
}
