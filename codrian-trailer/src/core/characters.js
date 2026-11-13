import * as THREE from 'three';
import { canvasTex } from './gfx.js';
import { clamp } from './math.js';

// Personagens estilizados (vinyl-toy sci-fi) 100% procedurais: cabeça com rosto desenhado em canvas (expressões animáveis),
// torso de terno, braços articulados. Sem assets de terceiros.
export const DEFAULT_EXPR = { eye: 1, eyeScale: 1, brow: 0, tilt: 0, mouth: 0, smile: 0.2, px: 0, py: 0, sweat: 0, blush: 0, shades: 0, smirk: 0, lashes: 0 };

export function drawFace(g, S, e, skin = '#e9b48d') {
  g.clearRect(0, 0, S, S); g.fillStyle = skin; g.fillRect(0, 0, S, S);
  const cx = S / 2, ex = S * 0.215, ey = S * 0.46, R = S * 0.105 * e.eyeScale;
  // bochechas
  if (e.blush > 0) { g.fillStyle = `rgba(255,90,110,${0.35 * e.blush})`; [-1, 1].forEach((k) => { g.beginPath(); g.ellipse(cx + k * S * 0.3, S * 0.62, S * 0.07, S * 0.045, 0, 0, 7); g.fill(); }); }
  // olhos
  [-1, 1].forEach((k) => {
    const x = cx + k * ex; g.save(); g.beginPath(); g.ellipse(x, ey, R * 1.12, R * 1.25 * clamp(e.eye, 0.04, 1.6), 0, 0, 7); g.clip();
    g.fillStyle = '#fff'; g.fillRect(x - R * 2, ey - R * 2, R * 4, R * 4);
    g.fillStyle = '#1a1020'; g.beginPath(); g.arc(x + e.px * R * 0.55, ey + e.py * R * 0.55, R * 0.55, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + e.px * R * 0.55 - R * 0.18, ey + e.py * R * 0.55 - R * 0.2, R * 0.16, 0, 7); g.fill(); g.restore();
    g.strokeStyle = '#2a1424'; g.lineWidth = S * 0.012; g.beginPath(); g.ellipse(x, ey, R * 1.12, R * 1.25 * clamp(e.eye, 0.04, 1.6), 0, 0, 7); g.stroke();
    // sobrancelhas
    g.save(); g.translate(x, ey - R * (1.7 + e.brow * 0.7)); g.rotate(k * (e.tilt * 0.5 - 0.1) * -1);
    g.strokeStyle = '#2b1a14'; g.lineCap = 'round'; g.lineWidth = S * 0.032; g.beginPath(); g.moveTo(-R * 1.0, 0); g.quadraticCurveTo(0, -R * 0.35 * (1 + e.brow), R * 1.0, 0); g.stroke(); g.restore();
  });
  if (e.shades > 0) { // óculos escuros (concorrente) com reflexo verde/violeta
    g.save(); g.globalAlpha = e.shades; const y = ey - S * 0.01;
    g.fillStyle = '#0a0612'; [-1, 1].forEach((k) => { g.beginPath(); g.roundRect(cx + k * ex - S * 0.19, y - S * 0.095, S * 0.38, S * 0.2, S * 0.05); g.fill(); });
    g.fillRect(cx - S * 0.03, y - S * 0.03, S * 0.06, S * 0.03);
    const gr = g.createLinearGradient(0, y - S * 0.1, S, y + S * 0.1); gr.addColorStop(0, 'rgba(139,108,255,.85)'); gr.addColorStop(1, 'rgba(183,255,74,.8)');
    g.fillStyle = gr; [-1, 1].forEach((k) => { g.beginPath(); g.roundRect(cx + k * ex - S * 0.16, y - S * 0.07, S * 0.14, S * 0.05, S * 0.02); g.fill(); }); g.restore();
  }
  // nariz
  g.strokeStyle = 'rgba(120,60,40,.45)'; g.lineWidth = S * 0.012; g.beginPath(); g.moveTo(cx - S * 0.015, S * 0.54); g.quadraticCurveTo(cx + S * 0.035, S * 0.58, cx - S * 0.02, S * 0.595); g.stroke();
  // boca
  const my = S * 0.72, mw = S * (0.13 + e.mouth * 0.07), mh = S * (0.012 + e.mouth * 0.15);
  g.save(); g.translate(cx + e.smirk * S * 0.03, my);
  if (e.mouth > 0.06) {
    g.beginPath(); g.ellipse(0, mh * 0.35, mw, mh, 0, 0, 7); g.fillStyle = '#3a0d1c'; g.fill();
    g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(-mw, -mh * 0.7, mw * 2, mh * 0.55); g.fillStyle = '#ff6f8c'; g.beginPath(); g.ellipse(0, mh * 1.2, mw * 0.55, mh * 0.55, 0, 0, 7); g.fill(); g.restore();
    g.strokeStyle = '#2a1424'; g.lineWidth = S * 0.012; g.beginPath(); g.ellipse(0, mh * 0.35, mw, mh, 0, 0, 7); g.stroke();
  } else {
    g.strokeStyle = '#7a2a3a'; g.lineWidth = S * 0.02; g.lineCap = 'round'; g.beginPath();
    const sm = e.smile * S * 0.06; g.moveTo(-mw, -sm * 0.2 + e.smirk * -S * 0.02); g.quadraticCurveTo(0, sm * 1.4, mw, -sm * 0.2 - e.smirk * S * 0.03 * 1.4); g.stroke();
  }
  g.restore();
  if (e.sweat > 0) { g.fillStyle = 'rgba(150,210,255,.95)'; const sx = cx + S * 0.36, sy = S * 0.3 + e.sweat * S * 0.1; g.beginPath(); g.moveTo(sx, sy - S * 0.05); g.quadraticCurveTo(sx + S * 0.035, sy + S * 0.01, sx, sy + S * 0.035); g.quadraticCurveTo(sx - S * 0.035, sy + S * 0.01, sx, sy - S * 0.05); g.fill(); }
}

export function buildPerson({ skin = '#e9b48d', suit = '#1b1740', shirt = '#f1eefc', tie = '#B7FF4A', hair = '#2b1a14', hairStyle = 'short', trim = '#8B6CFF', env = null, size = 1 } = {}) {
  const root = new THREE.Group(), P = {};
  const mat = (c, r = 0.55, m = 0.05) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, envMap: env, envMapIntensity: 0.9 });
  const skinM = mat(skin, 0.6, 0), suitM = mat(suit, 0.5, 0.1), trimM = new THREE.MeshStandardMaterial({ color: trim, emissive: trim, emissiveIntensity: 1.4, roughness: 0.4 });
  // torso
  const torso = new THREE.Group(); root.add(torso); P.torso = torso;
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.30, 0.34, 8, 24), suitM); chest.scale.set(1.18, 1, 0.74); chest.position.y = 0.0; torso.add(chest);
  const shirtM = new THREE.Mesh(new THREE.CircleGeometry(0.17, 3), mat(shirt, 0.7, 0)); shirtM.rotation.z = Math.PI; shirtM.scale.set(0.8, 1.45, 1); shirtM.position.set(0, 0.2, 0.226); torso.add(shirtM);
  const tieM = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.42, 4), mat(tie, 0.4, 0.1)); tieM.scale.z = 0.4; tieM.position.set(0, 0.1, 0.236); torso.add(tieM);
  const lap = [-1, 1].map((k) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.02), trimM); m.position.set(k * 0.1, 0.16, 0.235); m.rotation.z = k * -0.35; torso.add(m); return m; });
  // pescoço + cabeça
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.14, 16), skinM); neck.position.y = 0.36; torso.add(neck);
  const head = new THREE.Group(); head.position.y = 0.6; torso.add(head); P.head = head;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.235, 40, 32), skinM); skull.scale.set(1, 1.1, 1.0); head.add(skull);
  const faceTex = canvasTex(512, 512, (g, w, h, e) => drawFace(g, 512, e, skin)); faceTex.userData.redraw(DEFAULT_EXPR);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.2365, 40, 32, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.82, 1.64), new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.65, metalness: 0, envMap: env, envMapIntensity: 0.4 }));
  face.scale.set(1, 1.1, 1.0); head.add(face); P.faceTex = faceTex;
  [-1, 1].forEach((k) => { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), skinM); ear.scale.set(0.5, 1, 0.8); ear.position.set(k * 0.235, 0.0, 0); head.add(ear); });
  const hairM = mat(hair, 0.4, 0.2);
  if (hairStyle === 'short') { const h = new THREE.Mesh(new THREE.SphereGeometry(0.244, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.40), hairM); h.scale.set(1.0, 1.14, 1.04); h.position.set(0, 0.03, -0.045); h.rotation.x = -0.55; head.add(h); }
  if (hairStyle === 'slick') { const h = new THREE.Mesh(new THREE.SphereGeometry(0.243, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.46), hairM); h.scale.set(1.0, 1.2, 1.1); h.position.set(0, 0.03, -0.015); h.rotation.x = -0.45; head.add(h); }
  // braços (ombro -> cotovelo -> mão)
  const mkArm = (k) => {
    const sh = new THREE.Group(); sh.position.set(k * 0.4, 0.22, 0); torso.add(sh);
    const up = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.3, 6, 14), suitM); up.position.y = -0.18; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.38; sh.add(el);
    const lo = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.28, 6, 14), suitM); lo.position.y = -0.17; el.add(lo);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.012, 8, 20), trimM); cuff.rotation.x = Math.PI / 2; cuff.position.y = -0.3; el.add(cuff);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), skinM); hand.position.y = -0.37; hand.scale.set(1, 1.15, 0.8); el.add(hand);
    return { sh, el, hand };
  };
  P.L = mkArm(-1); P.R = mkArm(1);
  root.scale.setScalar(size);
  P.root = root;
  P.setExpr = (e) => faceTex.userData.redraw({ ...DEFAULT_EXPR, ...e });
  return P;
}

export function buildSandwich(env) {
  const g = new THREE.Group();
  const bun = new THREE.MeshStandardMaterial({ color: '#d9964a', roughness: 0.7 });
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), bun); top.scale.set(1, 0.75, 1); top.position.y = 0.06; g.add(top);
  const bot = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.09, 0.04, 20), bun); bot.position.y = -0.04; g.add(bot);
  const pat = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.102, 0.035, 20), new THREE.MeshStandardMaterial({ color: '#4a2316', roughness: 0.8 })); pat.position.y = 0.0; g.add(pat);
  const let_ = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.108, 0.018, 20), new THREE.MeshStandardMaterial({ color: '#7bd13f', roughness: 0.6 })); let_.position.y = 0.025; g.add(let_);
  const che = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.2), new THREE.MeshStandardMaterial({ color: '#ffc83d', roughness: 0.5 })); che.rotation.y = 0.78; che.position.y = 0.04; g.add(che);
  return g;
}
