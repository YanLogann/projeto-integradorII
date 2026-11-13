import * as THREE from 'three';
import gsap from 'gsap';
import { BRAND, COPY, T, SCENES, VO } from '../config.js';
import { CameraRig } from '../core/camera-rig.js';
import { ParticleField } from '../core/particles.js';
import { makeCity, makeEnv, beam, glowSprite, col } from '../core/gfx.js';
import { buildPerson, buildSandwich } from '../core/characters.js';
import { makeSky } from './s1-apocalypse.js';
import { bolt } from '../core/overlay2d.js';
import { clamp, remap, pulse, ampAt, lerp, smooth, noise1, mulberry32, easeOutCubic } from '../core/math.js';
import { el, flash, shakeEl, glitchBurst } from '../ui/text-fx.js';

const S = SCENES.s2, ABS = (t) => t - S.start;
const LUNCH = ABS(VO.s2.at), LUNCH_END = LUNCH + 1.75;
const PAUSE = ABS(T.comicPause);

export function createS2(ctx) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(44, 1080 / 1920, 0.05, 600);
  scene.background = col(BRAND.black);
  const envTex = ctx.envTex || (ctx.envTex = makeEnv(ctx.stage.renderer)); scene.environment = envTex; scene.environmentIntensity = 0.55;

  // ---- sala ----
  const sky = makeSky(300); sky.mesh.position.set(0, 0, -20); scene.add(sky.mesh);
  const city = makeCity({ seed: 3, count: 150, zRange: [-12, -260], gap: 40, wRange: [10, 26], hRange: [30, 150], lean: 0.02, lit: 0.55, decay: 0.45, fogDensity: 0.006, fogColor: '#1a0f3d', mirror: false });
  city.position.set(0, -6, 0); scene.add(city);
  const stdM = (c, r = 0.5, m = 0.2, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...o });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2), stdM('#0c0816', 0.18, 0.75, { envMapIntensity: 1.2 })); scene.add(floor);
  const wallM = stdM('#0e0a1a', 0.6, 0.1);
  const wall = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.5), wallM); m.position.set(x, y, -9); scene.add(m); return m; };
  wall(10, 14, -9, 5); wall(10, 14, 9, 5); wall(8, 1.4, 0, 0.7); wall(8, 5, 0, 10.5);
  // moldura luminosa da janela
  const edgeM = new THREE.MeshBasicMaterial({ color: col(BRAND.violetHi).multiplyScalar(2.2) });
  [[8, 0.06, 0, 1.4], [8, 0.06, 0, 8.0], [0.06, 6.6, -4, 4.7], [0.06, 6.6, 4, 4.7]].forEach(([w, h, x, y]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), edgeM); m.position.set(x, y, -8.7); scene.add(m); });
  for (let i = -3; i <= 3; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 6.6, 0.06), new THREE.MeshBasicMaterial({ color: col(BRAND.violetHi).multiplyScalar(0.5) })); m.position.set(i * 1.14, 4.7, -8.72); scene.add(m); }

  // mesa
  const desk = new THREE.Group(); desk.position.set(0, 0, -2.0); scene.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 1.3), stdM('#1a1230', 0.25, 0.7)); top.position.y = 0.78; desk.add(top);
  const front = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.74, 0.06), stdM('#120c22', 0.4, 0.5)); front.position.set(0, 0.4, 0.58); desk.add(front);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: col(BRAND.lime).multiplyScalar(1.4) })); strip.position.set(0, 0.74, 0.62); desk.add(strip);
  const laptop = new THREE.Group(); laptop.position.set(-0.85, 0.82, -0.1); laptop.rotation.y = 0.35; desk.add(laptop);
  const lb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.025, 0.34), stdM('#2a2146', 0.3, 0.8)); laptop.add(lb);
  const ls = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.018), stdM('#2a2146', 0.3, 0.8)); ls.position.set(0, 0.17, -0.16); ls.rotation.x = -0.12; laptop.add(ls);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshBasicMaterial({ color: col(BRAND.lime).multiplyScalar(3) })); led.position.set(0, 0.17, -0.15); ls.add(led); led.position.set(0, 0, 0.012);
  const phone = new THREE.Group(); phone.position.set(0.95, 0.835, 0.15); phone.rotation.y = -0.25; desk.add(phone);
  const pb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.014, 0.4), stdM('#0a0714', 0.2, 0.8)); phone.add(pb);
  const psMat = new THREE.MeshBasicMaterial({ color: col(BRAND.violetHi).multiplyScalar(1.2) }); const ps = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.37).rotateX(-Math.PI / 2), psMat); ps.position.y = 0.0085; phone.add(ps);
  const phoneGlow = glowSprite(BRAND.violetHi, 1.4, 0.0); phoneGlow.position.set(0, 0.2, 0); phone.add(phoneGlow);
  // cadeira
  const chair = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.9, 6, 16), stdM('#120c24', 0.5, 0.3)); chair.scale.set(1, 1, 0.35); chair.position.set(0, 1.25, -3.75); scene.add(chair);
  const chairEdge = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.012, 8, 40), new THREE.MeshBasicMaterial({ color: col(BRAND.violetHi).multiplyScalar(2) })); chairEdge.position.set(0, 1.25, -3.58); chairEdge.scale.set(1, 1.9, 1); chairEdge.visible = false;

  // personagem
  const biz = buildPerson({ skin: '#e2a883', suit: '#1d1a45', shirt: '#f3f0ff', tie: BRAND.lime, hair: '#2a1a14', hairStyle: 'short', trim: BRAND.violetHi, env: envTex });
  biz.root.position.set(0, 1.12, -3.12); scene.add(biz.root);
  const sandwich = buildSandwich(envTex); sandwich.position.set(0, -0.4, 0.06); sandwich.rotation.set(1.2, 0, 0.3); biz.R.el.add(sandwich);

  // luzes
  scene.add(new THREE.AmbientLight('#4a3a8a', 0.5));
  const key = new THREE.DirectionalLight('#cbbcff', 2.2); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(BRAND.lime, 8, 9, 1.6); rim.position.set(2.8, 2.2, -4.5); scene.add(rim);
  const back = new THREE.PointLight(BRAND.violetHi, 12, 14, 1.4); back.position.set(-2.5, 2.8, -6); scene.add(back);
  const lightning = new THREE.PointLight('#d8ccff', 0, 30, 1.2); lightning.position.set(0, 5, -7); scene.add(lightning);
  const beams = [[-2.5, -7.5, 0.2], [3, -8, -0.15]].map(([x, z, r], i) => { const b = beam({ color: BRAND.violetHi, length: 10, r0: 0.1, r1: 1.8, opacity: 0.13, seed: i }); b.position.set(x, 7.5, z); b.rotation.z = r; scene.add(b); return b; });

  // partículas
  const dust = new ParticleField({ count: 700, mode: 'ambient', seed: 2, colors: ['#ffffff', BRAND.violetHi, BRAND.violetHi], size: 0.012, box: [8, 4, 10], center: [0, 2, -2], speed: 0.06, turb: 0.15, alpha: 0.7 });
  const crumbs = new ParticleField({ count: 260, mode: 'burst', seed: 9, colors: ['#e0a050', '#ffd58a', BRAND.lime], size: 0.018, center: [0, 1.7, -2.6], speed: 3.2, drag: 2.2, turb: 0.3, birth: LUNCH + 0.12, life: 1.6 });
  const sweat = new ParticleField({ count: 90, mode: 'burst', seed: 19, colors: ['#9fd8ff', '#ffffff', '#9fd8ff'], size: 0.014, center: [0.2, 1.85, -2.7], speed: 1.8, drag: 1.4, turb: 0.2, birth: LUNCH + 0.2, life: 1.2 });
  scene.add(dust.points, crumbs.points, sweat.points);

  // câmera (tempo local da cena)
  const rig = new CameraRig(camera, [
    { t: 0.0, p: [1.4, 1.5, 3.4], l: [0, 0.95, -3], fov: 48, roll: 0.03 },
    { t: 1.6, p: [0.7, 1.45, 2.3], l: [0, 0.98, -3], fov: 44, roll: 0.0 },
    { t: PAUSE - 0.05, p: [0.3, 1.45, 1.7], l: [0, 1.02, -3], fov: 42, roll: -0.01 },
    { t: PAUSE, p: [0.3, 1.45, 1.7], l: [0, 1.02, -3], fov: 42, roll: -0.01 },
    { t: LUNCH - 0.1, p: [0.0, 1.62, -0.55], l: [0, 1.36, -3], fov: 40, roll: 0.0 },
    { t: LUNCH + 0.15, p: [0.0, 1.64, -0.7], l: [0, 1.38, -3], fov: 38, roll: 0.02 },
    { t: LUNCH_END, p: [0.1, 1.6, 0.0], l: [0, 1.32, -3], fov: 42, roll: -0.03 },
    { t: 6.0, p: [0.0, 1.5, 1.3], l: [0, 1.0, -3], fov: 44, roll: 0.0 }
  ], { handheld: 0.012, seed: 6, shakes: [{ t: 0.0, dur: 0.4, amp: 0.1 }, { t: LUNCH, dur: 0.9, amp: 0.08, roll: 0.02, freq: 34 }, { t: ABS(T.notif1), dur: 0.3, amp: 0.03 }, { t: ABS(T.notif3), dur: 0.5, amp: 0.05 }] });

  // ---- DOM ----
  const root = el('div', 'scene'); root.id = 's2';
  const tag = el('div', 'abs pix lime', '12:41 · hora do almoço', root); tag.style.cssText = 'left:60px;top:150px;font-size:34px;opacity:0';
  const cards = COPY.notifs.map((txt, i) => {
    const c = el('div', 'abs glass', '', root);
    c.style.cssText = `width:880px;padding:30px 36px;display:flex;gap:28px;align-items:center;opacity:0;${i === 2 ? 'border-color:rgba(255,77,109,.85);box-shadow:0 0 70px rgba(255,77,109,.45);' : ''}`;
    c.innerHTML = `<div style="flex:none;width:96px;height:96px;border-radius:50%;background:${i === 2 ? '#FF4D6D' : 'var(--violet)'};display:grid;place-items:center;font-weight:900;font-size:46px;box-shadow:0 0 30px ${i === 2 ? 'rgba(255,77,109,.7)' : 'rgba(105,56,232,.8)'}">${['O', '?', '×'][i]}</div>
      <div><div class="pix" style="font-size:26px;color:${i === 2 ? '#ff9db0' : 'var(--mist)'};margin-bottom:10px">${['cliente novo · agora', 'cliente novo · 3 min', 'cliente · 12 min'][i]}</div>
      <div style="font-weight:800;font-size:54px;line-height:1.05">${txt}</div></div>`;
    return c;
  });
  const pos = [{ l: 100, t: 200 }, { l: 60, t: 410 }, { l: 90, t: 620 }];
  cards.forEach((c, i) => { c.style.left = pos[i].l + 'px'; c.style.top = pos[i].t + 'px'; });
  const stamp = el('div', 'abs h-xl danger glow-r', 'LEAD PERDIDO', root); stamp.style.cssText = 'left:0;right:0;top:1000px;font-size:118px;opacity:0;border:10px solid var(--danger);width:820px;margin:0 auto;padding:6px 0;border-radius:18px;transform:rotate(-7deg)';
  const bz = el('div', 'abs', '', root); // bolha de "!!" cômica
  const tl = gsap.timeline();
  const A = (t) => ABS(t);
  tl.fromTo(tag, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out' }, 0.25).to(tag, { opacity: 0, duration: 0.2 }, A(T.notif1) + 0.1);
  // notificações com velocidades / easings distintos
  tl.fromTo(cards[0], { x: 1400, rotation: 6, opacity: 1, scale: 1.0 }, { x: 0, rotation: 0, duration: 0.32, ease: 'expo.out' }, A(T.notif1));
  tl.fromTo(cards[1], { x: -1300, rotationY: 55, opacity: 1 }, { x: 0, rotationY: 0, duration: 0.6, ease: 'back.out(1.8)' }, A(T.notif2));
  tl.fromTo(cards[2], { y: -1000, rotation: -12, opacity: 1 }, { y: 0, rotation: 0, duration: 0.95, ease: 'bounce.out' }, A(T.notif3));
  cards.forEach((c, i) => { // desenvolvimento: flutuação leve
    tl.to(c, { y: '+=14', duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: 1 }, A([T.notif1, T.notif2, T.notif3][i]) + 1.0);
  });
  tl.fromTo(stamp, { opacity: 0, scale: 3.4, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.25, ease: 'expo.out' }, A(T.notif3) + 0.62);
  shakeEl(tl, stamp, A(T.notif3) + 0.7, 0.3, 18, 77);
  // pausa cômica: tudo escurece/desfoca por um instante
  tl.to(cards, { opacity: 0.35, filter: 'blur(5px)', scale: 0.96, duration: 0.15 }, PAUSE).to(stamp, { opacity: 0.4, duration: 0.15 }, PAUSE);
  // explosão: sai tudo rápido
  tl.to(cards, { opacity: 0, x: (i) => (i % 2 ? -1300 : 1300), duration: 0.28, ease: 'power3.in', stagger: 0.03 }, LUNCH - 0.12).to(stamp, { opacity: 0, scale: 2, duration: 0.2 }, LUNCH - 0.1);
  flash(tl, PAUSE, { peak: 0.25, dur: 0.18, color: '#000' }); flash(tl, LUNCH, { peak: 0.55, dur: 0.22, color: '#ffffff' });

  const speed = (t, g) => { // linhas de velocidade cômicas
    const e = pulse(t, LUNCH, 1.2); if (!e) return; const r = mulberry32(Math.floor(t * 24) + 5); g.save(); g.translate(540, 700); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) { const a = r() * 6.283, r0 = 330 + r() * 160, r1 = r0 + 260 + r() * 520; g.strokeStyle = r() < 0.18 ? BRAND.lime : (r() < 0.5 ? BRAND.violetHi : '#ffffff'); g.globalAlpha = 0.55 * e * (0.4 + r() * 0.6); g.lineWidth = 2 + r() * 5; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 1.2); g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * 1.2); g.stroke(); }
    g.restore();
  };

  const lightningT = [0.6, 2.1, 3.4, 5.1];
  return {
    id: 's2', ...S, three: { scene, camera }, dom: root, tl,
    transition: { mode: 1, dur: 0.32 },
    update(t) {
      rig.update(t); sky.mat.uniforms.uT.value = t;
      const L = lightningT.reduce((m, f) => Math.max(m, pulse(t, f, 0.25)), 0);
      lightning.intensity = L * 140; city.userData.update(t, { glitch: 0.1 + 0.35 * pulse(t, PAUSE, 0.3), flash: L * 0.5 });
      beams.forEach((b) => b.userData.update(t));
      // ---- expressões / poses ----
      const env = ctx.envelopes[VO.s2.file], amp = ampAt(env, t - LUNCH);
      const n1 = remap(t, ABS(T.notif1), ABS(T.notif1) + 0.4), n3 = remap(t, ABS(T.notif3), ABS(T.notif3) + 0.9), hold = t >= PAUSE && t < LUNCH ? 1 : 0;
      const line = remap(t, LUNCH, LUNCH + 0.12) * (1 - remap(t, LUNCH_END, LUNCH_END + 0.35)), post = remap(t, LUNCH_END, LUNCH_END + 0.5);
      const chew = Math.max(0, 1 - n3) * (Math.sin(t * 17) * 0.5 + 0.5);
      const ex = {
        eye: lerp(lerp(0.78, 1.15, n1 * 0.5 + n3 * 0.5), 1.55, line) * (1 - post * 0.55), eyeScale: lerp(1, 1.3, line), brow: lerp(n3 * 0.9, 1.4, line) - post * 0.8,
        tilt: line * 0.9, mouth: line ? clamp(0.15 + amp * 1.5, 0, 1) : chew * 0.28 * (1 - n3), smile: lerp(0.7, -0.6, Math.max(n3, post)), px: lerp(0, -0.9, n1 * (1 - n3)) + (t > PAUSE ? 0 : 0), py: lerp(0.6, 0, n3),
        sweat: clamp(n3 * 0.5 + line, 0, 1) , blush: line * 0.6
      };
      if (t >= PAUSE && t < LUNCH) { ex.mouth = 0; ex.smile = -0.2; ex.eye = 1.15; ex.px = 0; ex.py = 0; }
      biz.setExpr(ex);
      const shake = line * (Math.sin(t * 46) * 0.05);
      biz.P = null; biz.head.rotation.set(0.05 + 0.06 * chew - post * 0.35, shake * 2 + Math.sin(t * 1.1) * 0.05, shake * 1.5);
      biz.torso.position.y = 0 + Math.sin(t * 1.6) * 0.004 + line * (Math.abs(Math.sin(t * 38)) * 0.02);
      biz.torso.rotation.x = 0.04 - post * 0.12;
      // braço direito: sanduíche à boca -> baixa -> sobe tremendo
      const toMouth = 1 - remap(t, ABS(T.notif3) - 0.1, ABS(T.notif3) + 0.5);
      biz.R.sh.rotation.set(lerp(-0.25, -0.2, toMouth) - line * 1.1 + post * 0.5, 0, lerp(-0.12, -0.35, line));
      biz.R.el.rotation.set(lerp(-0.7, -2.2, toMouth) - line * 0.3, 0, 0);
      biz.L.sh.rotation.set(-0.55 - line * 1.3 + post * 0.4, 0, 0.15 + line * 0.35);
      biz.L.el.rotation.set(-0.9 - line * 0.4, 0, 0);
      sandwich.rotation.z = 0.3 + line * Math.sin(t * 40) * 0.25; sandwich.scale.setScalar(1 - line * 0.18);
      // telefone vibrando
      const buzz = [T.notif1, T.notif2, T.notif3].reduce((m, f) => Math.max(m, pulse(t, ABS(f), 0.5)), 0);
      phone.position.x = 0.95 + Math.sin(t * 90) * 0.008 * buzz; phone.position.z = 0.15 + Math.cos(t * 83) * 0.006 * buzz;
      phoneGlow.material.opacity = buzz * 0.9 + 0.08; psMat.color.set(buzz > 0.1 ? BRAND.lime : BRAND.violetHi).multiplyScalar(1.2 + buzz * 1.5);
      [dust, crumbs, sweat].forEach((p) => p.update(t, camera));
    },
    draw2d(g, t) { speed(t, g); },
    post(t) {
      const L = lightningT.reduce((m, f) => Math.max(m, pulse(t, f, 0.25)), 0), line = pulse(t, LUNCH, 0.9);
      return { bloom: { strength: 0.45 + L * 0.3 + line * 0.3, threshold: 0.78 }, final: { uCA: 0.8 + line * 3 + pulse(t, PAUSE, 0.25) * 2, uGlitch: pulse(t, PAUSE, 0.22) * 0.7 + pulse(t, LUNCH, 0.2) * 0.5, uExposure: 0.95 } };
    }
  };
}
