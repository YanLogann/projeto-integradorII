// Timeline mestre. Tempos em segundos. A voz (ElevenLabs) dita o ritmo:
// cada fala começa em CD.T[id]; palavras-chave usam o alinhamento por palavra (CD.VO).
(function (CD) {
  CD.T = { d1: 1.15, d2: 2.95, n1: 4.7, n2: 10.0, n3: 14.9, n4: 23.5, n5: 29.9 };
  CD.DUR = 34.5;
  CD.SCENES = [
    { id: 's1', a: 0, b: 4.5 }, { id: 's2', a: 4.5, b: 9.8 }, { id: 's3', a: 9.8, b: 14.5 },
    { id: 's4', a: 14.5, b: 23.2 }, { id: 's5', a: 23.2, b: 29.4 }, { id: 's6', a: 29.4, b: 34.5 },
  ];
  // tempo absoluto da palavra (por prefixo) dentro de uma fala
  CD.wt = (id, prefix, nth = 0) => {
    const ws = CD.VO[id].words; let k = 0;
    for (const w of ws) if (w.w.toLowerCase().startsWith(prefix.toLowerCase())) { if (k++ === nth) return CD.T[id] + w.s; }
    throw new Error('palavra não encontrada: ' + id + ' ' + prefix);
  };
  // momentos-chave derivados da narração
  CD.K = {};
  CD.buildKeys = () => {
    const K = CD.K, w = CD.wt;
    K.facil = w('n1', 'mais'); K.encontrar = w('n1', 'encontrar');
    K.semSite = 10.55; K.semInfo = 11.25; K.semPres = 11.95;
    K.pagina = w('n3', 'página'); K.apresenta = w('n3', 'apresenta'); K.valoriza = w('n3', 'valoriza');
    K.servicos = w('n3', 'serviços'); K.transforma = w('n3', 'transforma'); K.visitas = w('n3', 'visitas'); K.oport = w('n3', 'oportunidades');
    K.encontrada = w('n4', 'encontrada'); K.lembrada = w('n4', 'lembrada');
    K.logo = 30.75;
    K.falls = [11.55, 12.15, 12.75, 13.35, 13.95];
    // efeitos sonoros (arquivo em audio/sfx/<s>.wav, ganho g)
    CD.CUES = [
      { t: 0.0, s: 'ring', g: 0.9 }, { t: 1.0, s: 'pickup', g: 0.8 },
      { t: 3.72, s: 'hangup', g: 0.8 }, { t: 3.82, s: 'busy', g: 0.35 },
      { t: 3.55, s: 'slap', g: 0.7 }, { t: 3.7, s: 'slap', g: 0.7 }, { t: 3.85, s: 'slap', g: 0.9 },
      { t: 4.45, s: 'whoosh', g: 0.6 }, { t: 5.1, s: 'typing', g: 0.5 }, { t: 6.8, s: 'tap', g: 0.7 },
      { t: 7.0, s: 'whoosh', g: 0.55 }, { t: K.facil, s: 'slap', g: 0.6 }, { t: K.encontrar, s: 'slap', g: 0.7 },
      { t: 9.8, s: 'darkhit', g: 0.9 },
      { t: K.semSite, s: 'pop', g: 0.6 }, { t: K.semInfo, s: 'pop', g: 0.6 }, { t: K.semPres, s: 'pop', g: 0.6 },
      { t: 14.5, s: 'freeze', g: 0.9 }, { t: 14.75, s: 'rise', g: 0.6 }, { t: 15.45, s: 'tear', g: 0.7 },
      { t: 16.45, s: 'thump', g: 0.8 },
      { t: 22.25, s: 'click', g: 0.8 }, { t: 22.3, s: 'chime', g: 0.6 },
      { t: 23.0, s: 'whoosh', g: 0.55 }, { t: 23.9, s: 'bell', g: 0.5 },
      { t: 24.3, s: 'ding', g: 0.5 }, { t: 25.0, s: 'ding', g: 0.5 }, { t: 25.7, s: 'ding', g: 0.5 },
      { t: 26.6, s: 'whoosh', g: 0.5 }, { t: K.encontrada, s: 'slap', g: 0.6 }, { t: K.lembrada, s: 'slap', g: 0.7 },
      ...K.falls.map((t) => ({ t, s: 'fall', g: 0.45 })),
      { t: 29.3, s: 'tear', g: 0.6 }, { t: 29.75, s: 'flutter', g: 0.6 }, { t: K.logo, s: 'logohit', g: 1.0 },
      { t: 31.55, s: 'slap', g: 0.5 }, { t: 31.95, s: 'slap', g: 0.55 }, { t: 32.8, s: 'pop', g: 0.6 },
    ];
    // encaixes da landing page (cena 4) — também geram "snap"
    CD.buildLP(K);
    CD.LP_PIECES.forEach((p) => CD.CUES.push({ t: p.t, s: 'snap', g: 0.55 }));
  };
})(window.CD);
