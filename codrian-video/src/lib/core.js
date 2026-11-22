// Núcleo: namespace, matemática, easing, aleatoriedade determinística, câmera com parallax.
window.CD = window.CD || {};
(function (CD) {
  CD.W = 1080; CD.H = 1920;          // espaço lógico (sempre 1080x1920)
  CD.FPS_ANIM = 12;                  // cadência "stop motion"
  CD.C = {                           // paleta CODRIAN + set
    bg0: '#0b0910', bg1: '#15111d', bg2: '#211a2c', bg3: '#2e2540',
    purple: '#7b3fe4', purpleL: '#a77bff', purpleD: '#46208f', purpleDD: '#2a1457',
    green: '#2fd67b', greenD: '#1a8f50', white: '#f4f1ea', ink: '#141018',
    card: '#6e5239', cardD: '#4a3727', cardL: '#8c6a4b', floor: '#2b2119',
    skin: '#e3a67c', skinD: '#c4835a', hair: '#2a1c15', gray: '#4c4757', grayL: '#6d6779', grayD: '#2f2b38',
  };
  CD.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  CD.lerp = (a, b, t) => a + (b - a) * t;
  CD.prog = (t, a, b) => CD.clamp((t - a) / (b - a));
  CD.ease = {
    lin: (t) => t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  };
  // aleatório determinístico (mesmo frame => mesmo resultado; render reproduzível)
  CD.rnd = (a = 0, b = 0, c = 0) => { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); };
  CD.rs = (a, b, c) => CD.rnd(a, b, c) * 2 - 1;
  // anima de A até B entre t0 e t1 com easing
  CD.tw = (t, t0, t1, a, b, e = CD.ease.inOut) => CD.lerp(a, b, e(CD.prog(t, t0, t1)));
  // "pop" de entrada (escala 0 -> 1 com overshoot)
  CD.pop = (t, t0, d = 0.35) => CD.ease.back(CD.prog(t, t0, t0 + d));

  // Câmera: x,y = ponto do mundo no centro da tela; z = zoom; r = rotação
  CD.cam = { x: 540, y: 960, z: 1, r: 0 };
  CD.setCam = (x, y, z = 1, r = 0) => { CD.cam = { x, y, z, r }; };
  // Desenha uma camada com profundidade d (0 = infinito, 1 = plano principal, >1 = primeiro plano)
  CD.layer = (d, fn) => {
    const { ctx, cam, W, H } = CD;
    const z = 1 + (cam.z - 1) * d;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(cam.r * d);
    ctx.scale(z, z);
    ctx.translate(-(cam.x * d + (W / 2) * (1 - d)), -(cam.y * d + (H / 2) * (1 - d)));
    CD.zNow = z;
    fn(CD.ctx);
    ctx.restore();
    CD.zNow = 1;
  };
  CD.zNow = 1;
  // tremor de câmera (passos de stop motion)
  CD.shake = (amp) => [CD.rs(CD.step, 1) * amp, CD.rs(CD.step, 2) * amp];
})(window.CD);
(function (CD) {
  CD.toScreen = (x, y, d = 1) => { const c = CD.cam, z = 1 + (c.z - 1) * d; return [CD.W / 2 + (x - (c.x * d + CD.W / 2 * (1 - d))) * z, CD.H / 2 + (y - (c.y * d + CD.H / 2 * (1 - d))) * z]; };
  CD.screen = () => CD.ctx.setTransform(CD.S, 0, 0, CD.S, 0, 0);
  CD.scene = {};
})(window.CD);
