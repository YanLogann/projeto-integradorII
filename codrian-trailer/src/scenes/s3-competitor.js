import * as THREE from 'three';
import gsap from 'gsap';
import { BRAND, COPY, T, SCENES, VO } from '../config.js';
import { CameraRig } from '../core/camera-rig.js';
import { ParticleField } from '../core/particles.js';
import { makeEnv, beam, glowSprite, canvasTex, gridFloor, col } from '../core/gfx.js';
import { buildPerson } from '../core/characters.js';
import { clamp, remap, pulse, ampAt, lerp, easeOutCubic, easeInOutCubic, noise1, hash, smooth } from '../core/math.js';
import { el, flash, glitchBurst, shakeEl } from '../ui/text-fx.js';

const S = SCENES.s3, ABS = (t) => t - S.start;
export const WAVE = { start: 17.4, dur: 1.8, ease: 'power2.inOut', center: [0.5, 0.5] };

export function createS3(ctx) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(46, 1080 / 1920, 0.05, 300);
  scene.background = col('#05030a'); scene.fog = new THREE.FogExp2('#05030a', 0.05);
  const envTex = ctx.envTex || (ctx.envTex = makeEnv(ctx.stage.renderer)); scene.environment = envTex; scene.environmentIntensity = 0.18;
  const stdM = (c, r = 0.5, m = 0.2, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...o });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), stdM('#07050c', 0.16, 0.9)); scene.add(floor);
  const grid = gridFloor({ size: 60, step: 1.2, color: BRAND.violetHi, accent: BRAND.lime, y: 0.01, opacity: 0.55 }); scene.add(grid);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), stdM('#040309', 0.95, 0.0)); back.position.set(0, 5, -9); scene.add(back);

  // painel holográfico curvo com dashboard animado (canvas)
  const dash = canvasTex(1024, 640, (g, w, h, t) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(14,10,28,0.80)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(139,108,255,.8)'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = BRAND.mist; g.font = '400 30px Silkscreen'; g.fillText('PAINEL · CLIENTES', 36, 62);
    const grow = easeOutCubic(clamp((t - 0.2) / 2.2));
    for (let i = 0; i < 14; i++) { const v = (0.22 + 0.55 * ((i / 13) * 0.8 + 0.2 * hash(i * 3.1))) * grow, bh = v * 300, x = 40 + i * 41, y = 470 - bh; g.fillStyle = i >= 11 ? BRAND.lime : BRAND.violet; g.fillRect(x, y, 30, bh); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, 30, 5); }
    g.strokeStyle = BRAND.lime; g.lineWidth = 6; g.shadowColor = BRAND.lime; g.shadowBlur = 18; g.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40 * grow, x = 40 + (i / 40) * 560, y = 440 - u * 250 - Math.sin(i * 0.9) * 16 * grow; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.shadowBlur = 0;
    // gauge
    g.lineWidth = 22; g.strokeStyle = 'rgba(139,108,255,.25)'; g.beginPath(); g.arc(800, 250, 110, 0, 7); g.stroke();
    g.strokeStyle = BRAND.lime; g.lineCap = 'round'; g.beginPath(); g.arc(800, 250, 110, -Math.PI / 2, -Math.PI / 2 + 6.283 * 0.72 * grow); g.stroke();
    // feed de clientes
    g.font = '700 30px "JetBrains Mono"'; for (let k = 0; k < 4; k++) { const n = Math.floor(t * 1.3) + 12 - k; g.globalAlpha = 1 - k * 0.22; g.fillStyle = BRAND.ink; g.fillText(`+ NOVO CLIENTE  #${n}`, 640, 440 + k * 46); g.fillStyle = BRAND.lime; g.fillText('✓', 600, 440 + k * 46); } g.globalAlpha = 1;
  });
  const panelMat = new THREE.MeshBasicMaterial({ map: dash, transparent: true, toneMapped: false, color: col('#ffffff').multiplyScalar(1.15), side: THREE.DoubleSide });
  const panel = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 3.5, 48, 1, true, Math.PI - 0.62, 1.24), panelMat); panel.scale.x = -1; panel.position.set(0, 2.4, -3.6 + 5.2 * 0.0); scene.add(panel);
  const panelGlow = glowSprite(BRAND.violetHi, 6, 0.16); panelGlow.position.set(0, 2.4, -4.2); scene.add(panelGlow);

  // cadeira giratória + rival
  const rival = buildPerson({ skin: '#c98e68', suit: '#0d0a1a', shirt: '#201a3a', tie: BRAND.violetHi, hair: '#0f0b14', hairStyle: 'slick', trim: BRAND.lime, env: envTex });
  const seat = new THREE.Group(); seat.position.set(0, 0, -1.4); scene.add(seat);
  rival.root.position.set(0, 0.98, 0); seat.add(rival.root);
  const chairBack = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.8, 6, 14), stdM('#150f2a', 0.4, 0.5)); chairBack.scale.set(1, 1, 0.3); chairBack.position.set(0, 1.18, -0.38); seat.add(chairBack);
  const cs = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 24), stdM('#150f2a', 0.4, 0.5)); cs.position.y = 0.62; seat.add(cs);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 10), stdM('#555070', 0.3, 0.9)); pole.position.y = 0.33; seat.add(pole);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283, l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.5), stdM('#555070', 0.3, 0.9)); l.position.set(Math.sin(a) * 0.25, 0.07, Math.cos(a) * 0.25); l.rotation.y = a; seat.add(l); }
  const chairTrim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.012, 8, 40, Math.PI), new THREE.MeshBasicMaterial({ color: col(BRAND.lime).multiplyScalar(2) })); chairTrim.position.set(0, 1.62, -0.36); chairTrim.visible = false; seat.add(chairTrim);

  // luzes verde/roxa
  scene.add(new THREE.AmbientLight('#2a1f5a', 0.12));
  const lv = new THREE.SpotLight(BRAND.violet, 38, 18, 0.7, 0.7, 1.4); lv.position.set(-4, 5, 1); lv.target.position.set(0, 1.2, -1.4); scene.add(lv, lv.target);
  const lg = new THREE.SpotLight(BRAND.lime, 16, 18, 0.6, 0.7, 1.4); lg.position.set(4.2, 4.5, 0.5); lg.target.position.set(0, 1.3, -1.4); scene.add(lg, lg.target);
  const rimL = new THREE.PointLight(BRAND.violetHi, 14, 9, 1.4); rimL.position.set(0, 2.6, -3.2); scene.add(rimL);
  const beams = [[-4, 1, 0.5, BRAND.violet], [4.2, 0.5, -0.5, BRAND.lime]].map(([x, z, r, c], i) => { const b = beam({ color: c, length: 7, r0: 0.08, r1: 1.4, opacity: 0.2, seed: i }); b.position.set(x, 6, z); b.rotation.z = r; scene.add(b); return b; });
  const motes = new ParticleField({ count: 900, mode: 'ambient', seed: 14, colors: ['#ffffff', BRAND.violetHi, BRAND.lime], size: 0.018, box: [10, 5, 10], center: [0, 2.2, -1], speed: 0.1, turb: 0.2, alpha: 0.9 });
  scene.add(motes.points);
  // cubos holográficos flutuantes
  const cubes = []; const eg = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  for (let i = 0; i < 14; i++) { const m = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: col(i % 3 ? BRAND.violetHi : BRAND.lime).multiplyScalar(1.5), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })); const s = 0.12 + hash(i * 3) * 0.3; m.scale.setScalar(s); m.userData = { x: (hash(i) - 0.5) * 6, y: 0.6 + hash(i + 9) * 3.4, z: -3 + hash(i + 4) * 4, s }; scene.add(m); cubes.push(m); }

  const SPIN = ABS(T.rivalSpin), LINE = ABS(VO.s3.at), LINE_END = LINE + 1.7, SEARCH = ABS(T.search);
  const rig = new CameraRig(camera, [
    { t: 0.0, p: [-3.4, 1.7, 2.4], l: [0.2, 1.7, -2.4], fov: 46, roll: 0.05 },
    { t: 1.2, p: [-1.6, 1.55, 3.0], l: [0.1, 1.7, -2.0], fov: 44, roll: 0.02 },
    { t: SPIN + 0.45, p: [0.1, 1.62, 1.35], l: [0, 1.98, -1.5], fov: 40, roll: 0.0 },
    { t: LINE_END, p: [0.2, 1.6, 1.0], l: [0, 1.78, -1.5], fov: 36, roll: -0.02 },
    { t: SEARCH + 0.2, p: [0.1, 1.55, 3.2], l: [0, 1.2, -1.5], fov: 44, roll: 0.0 },
    { t: 6.0, p: [0.0, 1.5, 3.6], l: [0, 1.15, -1.5], fov: 45, roll: 0.01 }
  ], { handheld: 0.012, seed: 8, shakes: [{ t: SPIN, dur: 0.5, amp: 0.06 }, { t: LINE, dur: 0.4, amp: 0.03 }] });

  // ---- DOM: busca ----
  const root = el('div', 'scene'); root.id = 's3';
  root.style.cssText += ';-webkit-mask-image:radial-gradient(circle at 50% 50%, transparent var(--r,0px), #000 calc(var(--r,0px) + 70px));mask-image:radial-gradient(circle at 50% 50%, transparent var(--r,0px), #000 calc(var(--r,0px) + 70px));';
  const lab = el('div', 'abs pix lime', 'busca · "orçamento perto de mim"', root); lab.style.cssText = 'left:60px;top:150px;font-size:30px;opacity:0';
  const list = el('div', 'abs', '', root); list.style.cssText = 'left:60px;right:60px;top:210px;display:flex;flex-direction:column;gap:22px';
  const rows = [
    { n: 'Rival Digital', sub: 'Anúncio · site e atendimento 24h', hi: true },
    { n: 'Empresa B', sub: 'site · atende por WhatsApp' },
    { n: 'Empresa C', sub: 'site · avaliações no mapa' },
    { n: 'SUA EMPRESA', sub: 'não encontrada', ghost: true }
  ].map((r, i) => {
    const d = el('div', 'glass', '', list);
    d.style.cssText = `padding:26px 34px;opacity:0;${r.hi ? 'border-color:#B7FF4A;box-shadow:0 0 80px rgba(183,255,74,.45),inset 0 0 40px rgba(183,255,74,.12);' : ''}${r.ghost ? 'border-color:rgba(255,77,109,.7);border-style:dashed;background:rgba(40,12,24,.7)' : ''}`;
    d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:800;font-size:${r.hi ? 62 : 52}px;line-height:1;color:${r.hi ? '#B7FF4A' : r.ghost ? '#FF4D6D' : '#F4F1FF'}">${r.n}</div><div class="pix" style="font-size:24px;margin-top:10px;color:var(--mist)">${r.sub}</div></div><div class="pix" style="font-size:40px;color:${r.hi ? '#B7FF4A' : 'var(--muted)'}">#${i + 1}</div></div>`;
    return d;
  });
  const tag = el('div', 'abs mono', COPY.rival, root); tag.style.display = 'none';
  const tl = gsap.timeline();
  tl.fromTo(lab, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.25 }, SEARCH - 0.05);
  rows.forEach((r, i) => tl.fromTo(r, { opacity: 0, x: i % 2 ? 300 : -300, scale: 0.92 }, { opacity: i === 3 ? 0.85 : 1, x: 0, scale: 1, duration: 0.45, ease: 'expo.out' }, SEARCH + i * 0.2));
  tl.fromTo(rows[0], { filter: 'brightness(2.4)' }, { filter: 'brightness(1)', duration: 0.5 }, SEARCH + 0.1);
  glitchBurst(tl, rows[3], SEARCH + 0.95, 0.4, { seed: 12, amp: 30 });
  tl.to(rows[0], { scale: 1.03, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: 1 }, SEARCH + 0.7);
  flash(tl, SPIN + 0.4, { peak: 0.15, dur: 0.2, color: '#B7FF4A' });
  // máscara radial da onda de energia que apaga esta cena (sincronizada com o shader de transição)
  tl.fromTo(root, { '--r': '0px' }, { '--r': (2.4 * 1920) + 'px', duration: WAVE.dur, ease: WAVE.ease }, WAVE.start - S.start);

  return {
    id: 's3', ...S, domEnd: WAVE.start + WAVE.dur + 0.1, three: { scene, camera }, dom: root, tl,
    transition: { mode: 1, dur: 0.32 },
    update(t) {
      rig.update(t);
      const env = ctx.envelopes[VO.s3.file], amp = ampAt(env, t - LINE);
      const sp = easeInOutCubic(remap(t, SPIN, SPIN + 0.65));
      seat.rotation.y = Math.PI * (1 - sp) + Math.sin(t * 0.9) * 0.06 * (1 - sp);
      const talk = t >= LINE && t < LINE_END ? 1 : 0, win = remap(t, LINE + 1.0, LINE + 1.35);
      rival.setExpr({ eye: 0.85, shades: 1, smile: 0.9, smirk: 1, brow: 0.2 + win * 0.3, mouth: talk ? clamp(0.1 + amp * 1.1, 0, 0.8) : 0, tilt: 0.2 });
      rival.head.rotation.set(0.03, -0.14 * sp + (win ? -0.1 : 0), 0.06 * sp);
      rival.R.sh.rotation.set(-0.35 - win * 1.6 * (1 - remap(t, LINE + 1.9, LINE + 2.3)), 0, -0.25); rival.R.el.rotation.set(-0.9 - win * 0.8, 0, 0);
      rival.L.sh.rotation.set(-0.45, 0, 0.18); rival.L.el.rotation.set(-1.0, 0, 0);
      dash.userData.redraw(t);
      panelMat.color.setScalar(1.05 + 0.1 * Math.sin(t * 11) + pulse(t, SPIN, 0.4) * 0.4);
      beams.forEach((b) => b.userData.update(t)); grid.userData.update(t);
      cubes.forEach((c, i) => { const u = c.userData; c.position.set(u.x + Math.sin(t * 0.5 + i) * 0.2, u.y + Math.sin(t * 0.7 + i * 2) * 0.2, u.z); c.rotation.set(t * 0.4 + i, t * 0.3 + i * 2, 0); });
      motes.update(t, camera);
    },
    post(t) { return { bloom: { strength: 0.62, threshold: 0.72 }, final: { uCA: 0.8 + pulse(t, SPIN, 0.3) * 2, uExposure: 0.98 } }; }
  };
}
