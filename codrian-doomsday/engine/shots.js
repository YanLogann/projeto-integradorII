// Decupagem: cada plano com câmera, parâmetros de shader, camadas 2D e pós. Tempos casados com a trilha (grade de 0,25 s).
'use strict';
(function () {
const { compile, W, H } = ENGINE; const S = SHADERS;
const { clamp, lerp, ss, outExpo, outCubic, inOut, glow, COL, C } = FX;
const PR = { space: compile(S.FS_SPACE, 'space'), city: compile(S.FS_CITY, 'city'), servers: compile(S.FS_SERVERS, 'servers'), void: compile(S.FS_VOID, 'void'), mask: compile(S.FS_MASK, 'mask'), blast: compile(S.FS_BLAST, 'blast') };
const L3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const U = (tgt, lt, t, A, B, Cc, D) => ({ uRes: [tgt.w, tgt.h], uT: lt, uG: t, uA: A, uB: B || [0, 0, 0, 0], uC: Cc || [0, 0, 0, 0], uD: D || [0, 0, 0, 0] });
const pulse = (t, t0, att, dec) => t < t0 - att ? 0 : t < t0 ? (t - t0 + att) / att : Math.exp(-(t - t0) / dec);
const shake = (t, t0, amp, dec) => { if (t < t0) return [0, 0]; const e = amp * Math.exp(-(t - t0) / dec); return [Math.sin(t * 73.1) * e + Math.sin(t * 131.7) * e * .5, Math.cos(t * 61.3) * e + Math.sin(t * 97.9) * e * .5]; };
const addSh = (...a) => a.reduce((s, v) => [s[0] + v[0], s[1] + v[1]], [0, 0]);
const BEAT = .5;

// marca d'água de cena para glitch nos cortes
const glitchAt = (t, cuts, w = .12, amp = .8) => cuts.reduce((g, c) => Math.max(g, amp * clamp(1 - Math.abs(t - c) / w)), 0);

const SHOTS = [];
const add = (start, end, o) => SHOTS.push(Object.assign({ start, end }, o));

// ======================= CENA 1 · O PRESSÁGIO (0 – 8,24) =======================
// 1A: limbo da Terra, o céu se rasga no golpe de 0,23
add(0, 4.24, { prog: PR.space, half: false, subframes: 1,
  uniforms: (lt, t, g) => {
    const k = lt / 4.24;
    const ro = L3([.05, 1.06, 1.7], [.0, 1.1, 1.45], inOut(k));
    const an = clamp((t - .2) / .5); const size = .05 + outExpo(an) * 1.05 + k * .25;
    return U(g, lt, t, [...ro, 2.1], [0, 1.42, -1, .06 - k * .03], [1, 1.2, 0, 1], [.15, 2.6, -2.6, t < .23 ? .18 + t * .3 : size]);
  },
  fx: (add, over, lt, t) => { FX.debris(over, t, { n: 12, speed: .4, seed: 3 });
    // rasgo: clarão e anel de choque no golpe
    const e = pulse(t, .26, .03, .35); FX.ring(add, W * .56, H * .28, 40 + (t - .23) * 2200, 'rgba(255,90,80,1)', e * .9, 10);
    glow(add, W * .56, H * .28, 900, COL.crimson, e * .7); },
  post: (lt, t) => ({ flash: pulse(t, .25, .02, .12) * .55, flashCol: [1, .5, .45], shake: shake(t, .23, .012, .5), ca: .004 + pulse(t, .25, .02, .4) * .02, bloom: 1.1, thr: .9, vig: .7 }) });
// 1B: plano aberto — a anomalia se aproxima, destroços passam pela câmera
add(4.24, 8.24, { prog: PR.space, subframes: 2,
  uniforms: (lt, t, g) => { const k = lt / 4;
    const ro = L3([.55, .25, 4.6], [.2, .32, 3.05], inOut(k));
    return U(g, lt, t, [...ro, 1.9], [0, .62, 0, -.08 + k * .05], [1, 1.2, 0, .7], [.35, 1.85, -2.4, 1.25 + k * 1.1]); },
  fx: (add, over, lt, t) => { FX.debris(over, t, { n: 34, speed: 1.1, seed: 9 }); FX.dust(add, t, { n: 40, col: COL.violet, alpha: .6 });
    const w = ss(3.4, 4, lt); glow(add, W * .55, H * .27, 1400 * w, COL.crimson, w * .8); },
  post: (lt, t) => ({ flash: ss(7.86, 8.24, t) * .9, flashCol: [1, .85, .85], shake: addSh(shake(t, 4.24, .004, 2), [Math.sin(t * 40) * .002 * ss(6, 8, t), 0]), ca: .003 + ss(6.5, 8.2, t) * .01, bloom: 1, vig: .7 }) });

// ======================= CENA 2 · O COLAPSO (8,24 – 16,0) =======================
// 2A: cidade vista do alto se apagando em onda
add(8.24, 9.5, { prog: PR.city, half: true, subframes: 2,
  uniforms: (lt, t, g) => { const k = lt / 1.26;
    const ro = [lerp(-2, 2, k), 11 - k * 1.5, lerp(8, 4, k)]; const ta = [ro[0] + 1, 0, ro[2] - 12];
    return U(g, lt, t, [...ro, 1.6], [...ta, .12], [Math.max(0, (lt - .45) * 26), 0, 3, .016], [ro[0] + 2, ro[2] - 20, 0, 14]); },
  fx: (add, over, lt, t) => FX.dust(add, t, { n: 30, alpha: .4 }),
  post: (lt, t) => ({ flash: pulse(t, 8.26, .01, .05) * .5, dof: .6, shake: shake(t, 8.24, .006, .3), glitch: glitchAt(t, [9.5], .08), bloom: 1.1, thr: .8 }) });
// 2B: corredor de servidores falhando
add(9.5, 10.75, { prog: PR.servers, half: true, subframes: 2,
  uniforms: (lt, t, g) => U(g, lt, t, [8 - lt * 2.2, 1, 1.5, clamp(lt / 1.1)], [ss(.2, .6, lt), 1 - ss(.7, 1.1, lt) * .8, 0, 0]),
  fx: (add, over, lt, t) => FX.sparks(add, lt, { seed: 21, bursts: 9, dur: 1.1 }),
  post: (lt, t) => ({ dof: .5, shake: shake(t, 9.5, .006, .4), glitch: glitchAt(t, [9.5, 10.75], .08) + pulse(t, 10.2, .02, .08) * .6, bloom: 1.2, thr: .7, ca: .006 }) });
// 2C: o mapa — empresas desaparecendo
add(10.75, 12.5, { prog: PR.void, subframes: 1,
  uniforms: (lt, t, g) => U(g, lt, t, [.5, .5, .7, .45], [0, 0, .8, 1]),
  fx: (add, over, lt, t) => { const z = 1 + lt * .06; over.save(); over.translate(W / 2, H / 2); over.scale(z, z); over.translate(-W / 2, -H / 2);
    FX.panelMap(over, 70, 330, 940, 1260, clamp(lt / 1.6), 1, 'vanish'); over.restore();
    const n = Math.max(0, Math.round(24 * (1 - clamp((lt - .05) / 1.45))));
    over.save(); over.font = '400 34px Silkscreen'; over.fillStyle = n ? C.mist : C.crimson; over.textAlign = 'left'; over.fillText(`EMPRESAS ENCONTRADAS: ${n}`, 110, 300); over.restore(); },
  post: (lt, t) => ({ glitch: glitchAt(t, [10.75, 12.5], .07) + (Math.sin(t * 37) > .93 ? .3 : 0), bloom: .8, ca: .004 }) });
// 2D: telas em pane — 404
add(12.5, 13.75, { prog: PR.void, subframes: 1,
  uniforms: (lt, t, g) => U(g, lt, t, [.5, .45, .6, .8], [.0, 0, 1, 1.2]),
  fx: (add, over, lt, t) => { const z = 1.04 - lt * .03;
    over.save(); over.translate(W / 2, H / 2); over.rotate(-.04); over.scale(z * .82, z * .82); over.translate(-W / 2, -H / 2); FX.panelOffline(over, 90, 1330, 900, 480, .55, t, clamp(lt / 1.1)); over.restore();
    over.save(); over.translate(W / 2, H / 2); over.scale(z, z); over.translate(-W / 2, -H / 2); FX.panel404(over, 70, 250, 940, 820, 1, t); over.restore(); },
  post: (lt, t) => ({ glitch: .25 + glitchAt(t, [12.5, 13.75], .08) + (Math.floor(t * 12) % 5 === 0 ? .4 : 0), ca: .01, bloom: .9, shake: shake(t, 12.5, .004, .2) }) });
// 2E: a Terra se apaga
add(13.75, 16.0, { prog: PR.space, subframes: 1,
  uniforms: (lt, t, g) => { const k = lt / 2.25;
    const ro = L3([-.35, .2, 3.0], [-.25, .18, 2.55], k);
    return U(g, lt, t, [...ro, 1.8], [0, .25, 0, .05], [1, lerp(1.05, -1, ss(.1, 2.1, lt)), 0, .5], [.5, 1.6, -2.2, 2.3 + k * .4]); },
  fx: (add, over, lt, t) => FX.debris(over, t, { n: 14, speed: .5, seed: 15 }),
  post: (lt, t) => ({ glitch: glitchAt(t, [13.75], .08), fade: ss(15.8, 16.0, t), bloom: 1, vig: .75 }) });

// ======================= CENA 3 · A CHEGADA (16,0 – 31,23) =======================
// 3A: a aterrissagem — silhueta na fumaça, contraluz carmim
add(16.0, 19.75, { prog: PR.mask, half: true, subframes: 1,
  uniforms: (lt, t, g) => { const k = lt / 3.75;
    const ro = L3([.6, -3.6, 10.5], [.3, -3.2, 9.0], outCubic(k));
    return U(g, lt, t, [...ro, 1.7], [0, -1.4, 0, .03], [.12 * ss(1, 3, lt), -2, pulse(t, 16.02, .01, .25) * 1.5, .7], [0, 1, 1.3, 9]); },
  fx: (add, over, lt, t) => { FX.embers(add, t, { n: 180, seed: 5, speed: 1.3 });
    // poeira da onda de choque
    const e = clamp(lt / 1.6); add.save(); add.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) { const a = i / 70 * 6.283, rr = 60 + outCubic(e) * (500 + FX.hash(i) * 700); glow(add, W / 2 + Math.cos(a) * rr, H * .78 + Math.sin(a) * rr * .18, 90 + e * 120, COL.dust, (1 - e) * .35); }
    add.restore(); },
  post: (lt, t) => ({ flash: pulse(t, 16.02, .01, .18) * .7, flashCol: [1, .7, .65], shake: shake(t, 16.0, .02, .5), dof: .45, bloom: 1.1, thr: .7, vig: .8, ca: .004 }) });
// 3B: aproximação lenta, relâmpagos revelam a armadura
add(19.75, 24.0, { prog: PR.mask, half: true, subframes: 1,
  uniforms: (lt, t, g) => { const k = lt / 4.25;
    const ro = L3([-.35, -1.5, 6.6], [-.15, -.9, 4.9], inOut(k));
    const lf = Math.max(pulse(t, 21.26, .02, .12), pulse(t, 21.5, .02, .08) * .6, pulse(t, 23.0, .02, .15));
    return U(g, lt, t, [...ro, 1.9], [0, -.45, 0, -.015], [.22, -2, lf * 1.1, .85], [0, .9, 1.1, length3(ro)]); },
  fx: (add, over, lt, t) => FX.embers(add, t, { n: 150, seed: 8, speed: .7 }),
  post: (lt, t) => ({ dof: .5, bloom: 1, thr: .7, vig: .82, shake: [Math.sin(t * 1.3) * .0015, Math.cos(t * 1.1) * .0015] }) });
// 3C: close 3/4 — luz de varredura revela a máscara aos poucos
add(24.0, 28.2, { prog: PR.mask, half: true, subframes: 1,
  uniforms: (lt, t, g) => { const k = lt / 4.2;
    const ro = L3([.4, .05, 2.6], [.15, .1, 2.15], inOut(k));
    return U(g, lt, t, [...ro, 2.1], [0, .02, 0, .01], [.25, lerp(-1.3, 1.1, ss(.2, 3.8, lt)), pulse(t, 24.02, .01, .2) * 1.4, .55], [0, .5, .8, 2.6]); },
  fx: (add, over, lt, t) => FX.embers(add, t, { n: 90, seed: 12, speed: .5, alpha: .7 }),
  post: (lt, t) => ({ dof: .7, bloom: 1, thr: .75, vig: .85, flash: pulse(t, 24.02, .01, .1) * .3 }) });
// 3D: silêncio. Close extremo; os olhos acendem em "passado"
add(28.2, 31.23, { prog: PR.mask, half: true, subframes: 1,
  uniforms: (lt, t, g) => { const k = lt / 3;
    const ro = L3([0, .14, 1.95], [0, .14, 1.62], k);
    const eyes = ss(29.55, 30.35, t) * (1 + pulse(t, 30.3, .05, .3) * .8);
    return U(g, lt, t, [...ro, 2.0], [0, .1, 0, 0], [eyes, -2, 0, .35], [0, .3, .4, 1.85]); },
  fx: (add, over, lt, t) => FX.embers(add, t, { n: 40, seed: 31, speed: .3, alpha: .5 }),
  post: (lt, t) => ({ dof: .9, bloom: 1.3, thr: .6, vig: .9, fade: ss(30.95, 31.05, t), shake: shake(t, 30.3, .003, .4) }) });

// ======================= CENA 4 · A VIRADA (31,23 – 48,5) =======================
// 4A: a faísca — um ponto lima, anéis, a rede acende
add(31.23, 33.75, { prog: PR.void, subframes: 2,
  uniforms: (lt, t, g) => U(g, lt, t, [.5, .5, .35 + lt * .25, .25 + lt * .3], [0, 0, 0, .5], [0, 0, lt < .02 ? 0 : .5, .5]),
  fx: (add, over, lt, t) => { FX.network(add, lt, { speed: 4, wave: lt * 18 - 1 });
    for (let i = 0; i < 3; i++) { const k = clamp((lt - i * .22) / 1.6); FX.ring(add, W / 2, H / 2, 20 + outCubic(k) * 900, i ? 'rgba(139,108,255,1)' : 'rgba(183,255,74,1)', (1 - k) * .9, 5); } },
  post: (lt, t) => ({ flash: pulse(t, 31.25, .01, .2) * .5, flashCol: [.6, .45, 1], bloom: 1.3, thr: .6, shake: shake(t, 31.23, .008, .35) }) });
// 4B: a cidade volta — em violeta, do centro para fora
add(33.75, 35.5, { prog: PR.city, half: true, subframes: 2,
  uniforms: (lt, t, g) => { const k = lt / 1.75;
    const ro = [lerp(1, -1.5, k), 6.5 + k * 2.2, lerp(3, 0, k)]; const ta = [0, 0, -9];
    return U(g, lt, t, [...ro, 1.5], [...ta, -.1], [100, Math.max(.01, lt * 13), 3, .02], [0, -10, 0, 9]); },
  fx: (add, over, lt, t) => FX.dust(add, t, { n: 30, col: COL.violet, alpha: .5 }),
  post: (lt, t) => ({ dof: .5, glitch: glitchAt(t, [33.75], .06), bloom: 1.3, thr: .6 }) });
// 4C: painéis em fio — site, IA, automação se constroem
add(35.5, 39.22, { prog: PR.void, subframes: 1,
  uniforms: (lt, t, g) => U(g, lt, t, [.5, .62, .7, .55], [.8, 1.5, 0, .4], [0, .32, 0, 0]),
  fx: (add, over, lt, t) => { FX.network(add, lt + 3, { speed: 1.5, wave: 99, alpha: .35 });
    const pz = (k, z0) => z0 + k * .12;
    const site = clamp(lt / 2.2), chat = clamp((lt - .6) / 2.4), flow = clamp((lt - 1.2) / 2.2);
    const draw = (fn, x, y, w, h, prog, sc, rotA, alpha, blur) => { over.save(); over.translate(x, y); over.rotate(rotA); over.scale(sc, sc); if (blur) over.filter = `blur(${blur}px)`; fn(over, -w / 2, -h / 2, w, h, prog, alpha); over.restore(); };
    draw((c, x, y, w, h, p, a) => FX.panelChat(c, x, y, w, h, p, a), W * .29 - lt * 8, 1540, 620, 560, chat, pz(lt / 3.7, .7), -.05, clamp((lt - .6) / .4), 0);
    draw((c, x, y, w, h, p, a) => FX.panelFlow(c, x, y, w, h, p, a), W * .75 + lt * 8, 1530, 560, 560, flow, pz(lt / 3.7, .62), .05, clamp((lt - 1.2) / .4), 1.5);
    draw((c, x, y, w, h, p, a) => FX.panelSite(c, x, y, w, h, p, a, 'Barbearia Aurora'), W / 2, 640, 720, 1000, site, pz(lt / 3.7, .72), .015, clamp(lt / .35), 0); },
  post: (lt, t) => ({ bloom: 1.1, thr: .75, glitch: glitchAt(t, [35.5], .06), ca: .003 }) });
// 4D: o golpe — a máscara se desfaz em energia violeta
add(39.22, 40.24, { prog: PR.mask, half: true, subframes: 2,
  uniforms: (lt, t, g) => { const ro = L3([0, .1, 2.6], [0, .1, 3.3], outCubic(lt)); return U(g, lt, t, [...ro, 1.9], [0, .02, 0, 0], [.9 * (1 - ss(.2, .6, lt)), -2, 0, .8], [ss(.0, .85, lt), .4, .3, 2.6]); },
  fx: (add, over, lt, t) => { add.globalCompositeOperation = 'lighter'; const r = FX.rng(66);
    for (let i = 0; i < 260; i++) { const a = r() * 6.283, sp = 300 + r() * 1700, d = outCubic(clamp(lt * 1.3)) * sp; glow(add, W / 2 + Math.cos(a) * d, H * .47 + Math.sin(a) * d * 1.2 - lt * 200 * r(), 10 + r() * 30, r() < .08 ? COL.lime : COL.violet, (1 - lt) * .55); } },
  post: (lt, t) => ({ flash: pulse(t, 39.23, .01, .15) * .6, flashCol: [.55, .4, 1], shake: shake(t, 39.22, .02, .4), bloom: 1.1, thr: .8, ca: .008, glitch: glitchAt(t, [40.24], .07) }) });
// 4E: cartões — o que a Codrian faz, um por tempo forte
const CARDS = [['SITES.', 'Sua empresa no mapa.'], ['IA.', 'Atendimento no WhatsApp.'], ['AUTOMAÇÃO.', 'Menos trabalho manual.'], ['SISTEMAS.', 'Tudo conectado.']];
CARDS.forEach(([word, sub], i) => {
  const t0 = 40.24 + i, t1 = t0 + 1;
  const bg = i === 0 ? { prog: PR.city, half: true, uniforms: (lt, t, g) => U(g, lt, t, [0 + lt * .6, 4.5, 2 - lt * .8, 1.5], [0, 0, -8, .05], [100, 30, 3, .025], [0, -10, 0, 7]) }
    : i === 3 ? { prog: PR.space, uniforms: (lt, t, g) => U(g, lt, t, [.4 - lt * .1, .3, 2.7 - lt * .15, 1.8], [0, .3, 0, 0], [1, -1, 1, .9], [0, 0, 0, 0]) }
    : { prog: PR.void, uniforms: (lt, t, g) => U(g, lt, t, [.5, .48, .6, .7], [0, 3, 0, .6], [0, .3, 0, 0]) };
  add(t0, t1, Object.assign({ subframes: 2 }, bg, {
    fx: (add, over, lt, t) => {
      if (i === 1) { over.save(); over.translate(W / 2, H * .5); over.scale(1.15 + lt * .1, 1.15 + lt * .1); over.filter = 'blur(6px)'; FX.panelChat(over, -310, -280, 620, 560, 1, .4); over.restore(); }
      if (i === 2) { over.save(); over.translate(W / 2, H * .5); over.scale(1.25 + lt * .1, 1.25 + lt * .1); over.filter = 'blur(6px)'; FX.panelFlow(over, -280, -280, 560, 560, 1, .4); over.restore(); }
      if (i === 2 || i === 1) FX.network(add, lt + 5, { speed: 8, wave: 99, alpha: .6 });
      const k = clamp(lt / .16), out = ss(.86, 1, lt);
      glow(add, W / 2, 900, 700, COL.violet, .3 * k * (1 - out));
    },
    top: (ctx, lt, t) => { const k = clamp(lt / .16), e = outExpo(k), out = ss(.86, 1, lt);
      ctx.save(); const gg = ctx.createLinearGradient(0, 700, 0, 1180); gg.addColorStop(0, 'rgba(16,12,28,0)'); gg.addColorStop(.5, 'rgba(16,12,28,.45)'); gg.addColorStop(1, 'rgba(16,12,28,0)'); ctx.fillStyle = gg; ctx.globalAlpha = k * (1 - out); ctx.fillRect(0, 700, W, 480); ctx.restore();
      FX.text(ctx, word, W / 2, 960, { size: word.length > 6 ? 150 : 210, ls: 2, scale: 1.12 - .12 * e + out * .05, blur: 10 * (1 - e) + out * 8, a: k * (1 - out) });
      FX.text(ctx, sub, W / 2, 1060, { w: 500, size: 46, col: C.mist, a: clamp((lt - .12) / .15) * (1 - out) }); },
    post: (lt, t) => ({ flash: pulse(t, t0 + .01, .01, .08) * .35, flashCol: [.6, .45, 1], shake: shake(t, t0, .006, .2), glitch: glitchAt(t, [t1], .06), bloom: 1.2, thr: .7 }),
  }));
});
// 4F: a Terra renasce em violeta; o sol nasce no limbo
add(44.24, 48.5, { prog: PR.space, subframes: 1,
  uniforms: (lt, t, g) => { const k = lt / 4.26;
    const ro = L3([-.2, .55, 2.6], [.0, 1.0, 1.75], inOut(k));
    return U(g, lt, t, [...ro, 2.0], [-.3, 1.2, -1, .04], [1, -1, 1, .5 + ss(1.5, 4, lt) * 2.5], [.35, 2.2, -2.4, Math.max(0, 1.4 * (1 - ss(0, 3.2, lt)))]); },
  fx: (add, over, lt, t) => { FX.network(add, lt + 8, { speed: 2, wave: 99, alpha: .25 }); FX.flare(add, W * .2, H * .36, ss(2.5, 4.2, lt) * .8); },
  post: (lt, t) => ({ bloom: 1.2, thr: .7, flash: ss(48.3, 48.5, t) * .8, flashCol: [.7, .6, 1] }) });

// ======================= CENA 5 · A REVELAÇÃO (48,5 – 60) =======================
const LOGO_SCALE = .2, IMPACT = 51.8;
// 5A: explosão de energia roxa e verde → implosão para um único ponto
add(48.5, 50.9, { prog: PR.blast, subframes: 2,
  uniforms: (lt, t, g) => U(g, lt, t, [clamp(lt / 1.6), ss(1.75, 2.4, lt), .55, outCubic(clamp(lt / 1.4)) * 2.4]),
  fx: (add, over, lt, t) => { const r = FX.rng(88); const im = ss(1.75, 2.4, lt);
    for (let i = 0; i < 320; i++) { const a = r() * 6.283, sp = 200 + r() * 1500, d = outCubic(clamp(lt / 1.7)) * sp * (1 - im);
      glow(add, W / 2 + Math.cos(a) * d, H * .45 + Math.sin(a) * d, 8 + r() * 26, r() < .14 ? COL.lime : COL.violet, (1 - clamp(lt / 2.2)) * .7); } },
  post: (lt, t) => ({ exposure: .75, flash: pulse(t, 48.52, .01, .25) * .7, flashCol: [.75, .65, 1], shake: shake(t, 48.5, .03, .6), bloom: 1.1, thr: .8, ca: .008, fade: ss(2.25, 2.4, lt) * .85 }) });
// 5B: vácuo — só o ponto lima crescendo (15% → 90%); 5C: impacto e logo
add(50.9, 60.01, { prog: PR.void, subframes: 1,
  uniforms: (lt, t, g) => { const ti = t - IMPACT; const gl = ti < 0 ? 0 : .35 + .35 * Math.exp(-ti * .8);
    return U(g, lt, t, [.5, .55, .55, gl], [0, 0, 0, ti < 0 ? 0 : .5], [0, 0, 0, 0]); },
  fx: (add, over, lt, t) => { const ti = t - IMPACT; const L = FX.logoLayout(LOGO_SCALE);
    if (ti >= 0) { // flash lima 50% decaindo 220ms; dois anéis até 9x, o segundo 120ms depois
      const R0 = FX.LOGO.dot.r * LOGO_SCALE;
      FX.ring(add, L.dot[0], L.dot[1], R0 * (1 + 8 * outExpo(clamp(ti / .9))), 'rgba(183,255,74,1)', 1 - clamp(ti / .9), 4);
      FX.ring(add, L.dot[0], L.dot[1], R0 * (1 + 8 * outExpo(clamp((ti - .12) / .9))), 'rgba(139,108,255,1)', ti > .12 ? 1 - clamp((ti - .12) / .9) : 0, 4);
      FX.dust(add, t, { n: 50, col: COL.violet, alpha: .5 }); } },
  top: (ctx, lt, t) => { const ti = t - IMPACT; const L = FX.logoLayout(LOGO_SCALE);
    // ponto: cresce antes do impacto e oscila depois (1 + 0,28·e^(−7t)·cos(14t))
    const k = ti < 0 ? lerp(.15, .9, clamp((t - 50.95) / .85)) : 1 + .28 * Math.exp(-7 * ti) * Math.cos(14 * ti);
    if (t >= 50.95) FX.drawDot(ctx, L, k);
    if (ti >= 0) {
      FX.drawLogo(ctx, ti, LOGO_SCALE);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 * Math.exp(-ti / .22); ctx.fillStyle = '#DFFFB0'; ctx.fillRect(0, 0, W, H); ctx.restore();
      // assinatura do trailer em duas linhas (sobe 70% da linha, blur 6px, 850ms out-cubic, 2ª linha +600ms)
      const lines = ['Tecnologia para quem não', 'nasceu para ficar parado.'];
      lines.forEach((s, i) => { const tt = t - (54.02 + i * .6); const kk = clamp(tt / .85), e = outCubic(kk); if (kk <= 0) return;
        FX.text(ctx, s, W / 2, 1010 + i * 64 + (1 - e) * 64 * .7, { w: 500, size: 50, col: C.mist, a: kk, blur: 6 * (1 - e) }); });
      // chamada para ação
      const c = clamp((t - 57.3) / .32), ce = outExpo(c);
      if (c > 0) { ctx.save(); ctx.globalAlpha = c; ctx.translate(W / 2, 1255 + (1 - ce) * 30);
        FX.rrect(ctx, -250, -56, 500, 112, 56); ctx.fillStyle = C.violet; ctx.fill();
        ctx.fillStyle = C.ink; ctx.font = FX.F(700, 44); ctx.textAlign = 'center'; ctx.fillText('Siga a Codrian', 0, 15); ctx.restore();
        FX.text(ctx, 'Sites que colocam sua empresa no mapa.', W / 2, 1390, { w: 500, size: 32, col: C.muted, a: clamp((t - 57.7) / .4) });
        FX.text(ctx, 'IA que ajuda ela a crescer.', W / 2, 1434, { w: 500, size: 32, col: C.muted, a: clamp((t - 58.0) / .4) }); }
    } },
  post: (lt, t) => ({ bloom: .7, thr: 1, shake: shake(t, IMPACT, .012, .35), grain: .07, fade: ss(59.6, 60, t) }) });

function length3(v) { return Math.hypot(v[0], v[1], v[2]); }
SHOTS.sort((a, b) => a.start - b.start);
window.getShot = (t) => { let s = SHOTS.find(s => t >= s.start && t < s.end) || SHOTS[SHOTS.length - 1]; return Object.assign({}, s, { lt: t - s.start }); };
window.SHOTS = SHOTS;
})();
