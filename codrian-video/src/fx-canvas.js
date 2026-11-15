// Camadas em Canvas desenhadas em função do tempo t (determinístico):
// bokeh de cidade, chuva, poeira volumétrica, explosões de partículas e granulação.
(() => {
  const { rng } = K;
  const W = 1080, H = 1920;
  const back = document.getElementById('fx-back').getContext('2d');
  const front = document.getElementById('fx-front').getContext('2d');
  const grainC = document.getElementById('grain');
  const grain = grainC.getContext('2d');

  const R = rng(7);
  const bokeh = Array.from({ length: 46 }, () => ({ x: R() * W, y: R() * H * 0.75, r: 20 + R() * 90, c: R() > .55 ? '123,44,255' : (R() > .5 ? '34,229,139' : '255,255,255'), a: .05 + R() * .18, sp: .2 + R() * .8, ph: R() * 6 }));
  const rain = Array.from({ length: 260 }, () => ({ x: R() * W * 1.3, y: R() * H, l: 30 + R() * 70, v: 1800 + R() * 1400, a: .08 + R() * .25 }));
  const dust = Array.from({ length: 90 }, () => ({ x: R() * W, y: R() * H, r: 1 + R() * 3.5, vx: (R() - .5) * 18, vy: -6 - R() * 22, a: .15 + R() * .5, ph: R() * 6 }));

  // explosões: {t, x, y, color, n}
  const bursts = [];
  window.FX = { burst: (t, x, y, color = '34,229,139', n = 80, power = 1) => bursts.push({ t, x, y, color, n, power, seed: Math.floor(t * 100) }) };

  // janelas onde cada efeito aparece (alpha com fade)
  const win = (t, a, b, f = .4) => Math.max(0, Math.min(1, (t - a) / f, (b - t) / f));

  function draw(t) {
    back.clearRect(0, 0, W, H); front.clearRect(0, 0, W, H);

    // bokeh urbano (início e fim)
    const ab = Math.max(win(t, -1, 8.2), win(t, 40.2, 46) * .7, win(t, 17.0, 21.3) * .35);
    if (ab > 0) {
      back.globalCompositeOperation = 'lighter';
      for (const b of bokeh) {
        const x = b.x + Math.sin(t * b.sp + b.ph) * 30, y = b.y + Math.cos(t * b.sp * .7 + b.ph) * 18;
        const g = back.createRadialGradient(x, y, 0, x, y, b.r);
        const a = b.a * ab * (0.7 + 0.3 * Math.sin(t * 3 + b.ph));
        g.addColorStop(0, `rgba(${b.c},${a})`); g.addColorStop(.7, `rgba(${b.c},${a * .5})`); g.addColorStop(1, `rgba(${b.c},0)`);
        back.fillStyle = g; back.beginPath(); back.arc(x, y, b.r, 0, 7); back.fill();
      }
      back.globalCompositeOperation = 'source-over';
    }

    // chuva diagonal (frente)
    const ar = Math.max(win(t, -1, 8.0), win(t, 40.4, 46) * .6);
    if (ar > 0) {
      front.lineCap = 'round';
      for (const d of rain) {
        const y = ((d.y + t * d.v) % (H + 200)) - 100;
        const x = d.x - y * 0.18;
        front.strokeStyle = `rgba(200,180,255,${d.a * ar})`; front.lineWidth = 2;
        front.beginPath(); front.moveTo(x, y); front.lineTo(x - d.l * .18, y + d.l); front.stroke();
      }
    }

    // poeira volumétrica — sempre, mais forte nas cenas de luz
    const ad = 0.45 + 0.55 * Math.max(win(t, 29, 37.5), win(t, 37.4, 45));
    for (const p of dust) {
      const x = (p.x + p.vx * t + Math.sin(t + p.ph) * 12 + W) % W;
      const y = ((p.y + p.vy * t) % H + H) % H;
      back.fillStyle = `rgba(190,160,255,${p.a * ad * (0.5 + 0.5 * Math.sin(t * 2 + p.ph))})`;
      back.beginPath(); back.arc(x, y, p.r, 0, 7); back.fill();
    }

    // explosões de partículas
    front.globalCompositeOperation = 'lighter';
    for (const b of bursts) {
      const dt = t - b.t; if (dt < 0 || dt > 1.6) continue;
      const r = rng(b.seed);
      for (let i = 0; i < b.n; i++) {
        const ang = r() * Math.PI * 2, sp = (300 + r() * 900) * b.power, sz = 2 + r() * 5;
        const k = 1 - Math.exp(-dt * 3);
        const x = b.x + Math.cos(ang) * sp * k * .6, y = b.y + Math.sin(ang) * sp * k * .6 + dt * dt * 120;
        const a = Math.max(0, 1 - dt / 1.6) * (0.5 + r() * .5);
        front.fillStyle = `rgba(${b.color},${a})`;
        front.beginPath(); front.arc(x, y, sz * (1 - dt / 2), 0, 7); front.fill();
      }
    }
    front.globalCompositeOperation = 'source-over';

    // granulação de filme (muda a cada quadro, seed pelo tempo)
    const gr = rng(Math.floor(t * 24) + 1);
    const img = grain.createImageData(grainC.width, grainC.height);
    for (let i = 0; i < img.data.length; i += 4) { const v = gr() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    grain.putImageData(img, 0, 0);
  }
  window.drawFX = draw;
})();
