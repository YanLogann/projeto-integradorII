// CENA 01 — O CLIENTE DESAPARECE (0–4.5s)
(function (CD) {
  const C = CD.C;
  CD.scene.s1 = (t) => {
    const T = CD.T, E = CD.ease;
    const ringing = (t < 0.42) || (t > 0.55 && t < 0.98);
    // câmera: colada no telefone, recua rápido, depois aproxima no rosto no "Não..."
    const pull = E.out(CD.prog(t, 0.5, 1.15));
    let z = CD.lerp(3.1, 1.0, pull), x = CD.lerp(250, 540, pull), y = CD.lerp(1090, 960, pull);
    const push = E.inOut(CD.prog(t, T.d2 - 0.1, T.d2 + 0.9));
    z *= 1 + 0.16 * push; x += (500 - x) * push * 0.6; y += (820 - y) * push * 0.5;
    const sk = ringing ? CD.shake(6) : [0, 0];
    CD.setCam(x + sk[0], y + sk[1], z, ringing ? CD.rs(CD.step, 5) * 0.012 : 0);

    // fone: no gancho → orelha → gancho
    const up = E.out(CD.prog(t, 1.0, 1.18)), down = E.in(CD.prog(t, 3.6, 3.72));
    const k = up * (1 - down);
    const ear = [425, 772];
    const hs = { x: CD.lerp(250, ear[0], k), y: CD.lerp(1098, ear[1], k) + (ringing ? -14 - CD.rnd(CD.step) * 14 : 0), rot: CD.lerp(ringing ? CD.rs(CD.step, 3) * 0.12 : 0, -1.25, k) };
    const holding = k > 0.5;
    const talking = t > T.d2 + 0.02 && t < T.d2 + 0.7;
    const mood = t < T.d2 - 0.2 ? 'neutral' : t < 3.9 ? 'worried' : 'sad';
    const owner = {
      mood, talk: talking ? (CD.step % 2 ? 0.8 : 0.3) : 0, blink: CD.step % 29 === 0, look: t > 3.2 ? [10, 4] : [-6, 0], sweat: CD.prog(t, 3.0, 3.3),
      phoneArm: holding ? [hs.x - 520 + 40, hs.y - 1190 + 30] : null,
    };
    // cliente na porta: chega, olha, vai embora
    const door = () => {
      if (t < 2.4) return;
      const arrive = E.out(CD.prog(t, 2.4, 2.9)), leave = E.in(CD.prog(t, 3.75, 4.35));
      const px = CD.lerp(1060, 880, arrive) + leave * 260;
      const front = t > 2.95 && t < 3.7;
      CD.person(px, 1390, 1.55, { col: '#6a7fae', hair: '#5a3a22', face: t > 3.7 ? 1 : -1, walk: (arrive < 1 || leave > 0) ? CD.ta * 14 : null, front, seed: 7 });
    };
    CD.fill(C.bg0);
    CD.drawShop(t, { owner, handset: hs, door, phoneShake: ringing ? CD.shake(5) : [0, 0] });

    // luz dramática: foco na luminária / empresário
    const c = CD.toScreen(520, 820, 0.92);
    CD.dark(c[0], c[1], 980 * CD.cam.z, 0.78);

    CD.layer(1, () => {
      // onomatopeia do telefone
      if (ringing) {
        const a = CD.step % 2;
        CD.label('TRIM!', a ? 380 : 130, a ? 1000 : 985, { size: 56, rot: a ? -0.22 : 0.2, bg: C.green, color: C.ink, sh: 0.8, seed: a });
        for (let i = 0; i < 3; i++) { const an = -2.4 + i * 0.45 + (a ? 1.75 : 0); CD.stroke([[250 + Math.cos(an) * 120, 1080 + Math.sin(an) * 120], [250 + Math.cos(an) * 160, 1080 + Math.sin(an) * 160]], C.white, 7, i + a * 5); }
      }
    });
    CD.layer(0.95, () => {
      // balões
      const b1 = CD.pop(t, T.d1 + 0.05, 0.3) * (1 - E.in(CD.prog(t, 2.8, 2.95)));
      if (b1 > 0.01) CD.bubble(300, 600, 'Alô? Vocês\ntêm site?', { sc: b1, size: 50, tail: [60, 150], rot: -0.04 });
      const b2 = CD.pop(t, T.d2, 0.25) * (1 - E.in(CD.prog(t, 3.85, 4.0)));
      if (b2 > 0.01) CD.bubble(760, 650, 'Não…', { sc: b2, size: 60, tail: [-150, 90], rot: 0.05 });
      if (t > 3.75 && t < 4.3) CD.text('tu… tu… tu…', 240, 1010, { size: 34, fam: 'Inter', weight: '700', color: 'rgba(244,241,234,0.7)', alpha: 1 - CD.prog(t, 4.1, 4.3) });
    });
    // manchete
    CD.screen();
    const L = [['MAIS UM', 3.55, 310, -0.05, C.white, C.ink], ['CLIENTE', 3.7, 450, 0.035, C.white, C.ink], ['PERDIDO.', 3.85, 600, -0.03, C.purple, C.white]];
    for (const [s, t0, yy, r, bg, col] of L) {
      if (t < t0) continue; const p = CD.ease.back(CD.prog(t, t0, t0 + 0.14));
      CD.label(s, 540, yy, { size: 120, rot: r, sc: CD.lerp(1.8, 1, p), bg, color: col, alpha: CD.prog(t, t0, t0 + 0.05), sh: 1.6 });
    }
  };
})(window.CD);
