// Orquestra: inicialização, escolha de cena pela timeline, legendas e pós.
(function (CD) {
  CD.init = async (canvas, scale = 0.5) => {
    CD.cv = canvas; canvas.width = Math.round(1080 * scale); canvas.height = Math.round(1920 * scale); CD.S = scale;
    CD.ctx = canvas.getContext('2d');
    await Promise.all(['400 60px Anton', '800 60px Inter', '700 60px Inter', '400 60px Inter'].map((f) => document.fonts.load(f)));
    CD.initPaper(); CD.buildKeys(); CD.buildCaptions(); CD.ready = true;
  };
  CD.render = (t) => {
    t = Math.min(Math.max(t, 0), CD.DUR - 1e-4);
    CD.t = t; CD.frame = Math.round(t * 30); CD.step = Math.floor(t * CD.FPS_ANIM + 1e-4); CD.ta = CD.step / CD.FPS_ANIM; CD.boil = CD.step % 3;
    const ctx = CD.ctx; CD.screen(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    CD.fill(CD.C.bg0);
    const sc = CD.SCENES.find((s) => t >= s.a && t < s.b) || CD.SCENES[CD.SCENES.length - 1];
    CD.scene[sc.id](CD.ta, t);
    CD.screen(); CD.setCam(540, 960, 1, 0);
    CD.captions(t);
    CD.post({ vig: sc.id === 's6' ? 0.3 : 0.62 });
  };
  CD.frameJPEG = (t, q = 0.82) => { CD.render(t); return CD.cv.toDataURL('image/jpeg', q); };
})(window.CD);
