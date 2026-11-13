import * as THREE from 'three';
import gsap from 'gsap';
import { BRAND, COPY, T, SCENES, VO } from '../config.js';
import { CameraRig } from '../core/camera-rig.js';
import { ParticleField } from '../core/particles.js';
import { beam, glowSprite, canvasTex, col } from '../core/gfx.js';
import { clamp, remap, pulse, ampAt, lerp, hash, easeOutCubic } from '../core/math.js';
import { el, buildLines, slamIn, slamOut, glitchBurst, shakeEl, flash } from '../ui/text-fx.js';
import { bolt, glowLine } from '../core/overlay2d.js';
import { WAVE } from './s3-competitor.js';

const S = SCENES.s4, ABS = (t) => t - S.start;
const W0 = ABS(WAVE.start), VO0 = ABS(VO.s4.at), OUT = ABS(T.aiOut);
const NOISE = `float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x), mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x), f.y), mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x), mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x), f.y), f.z); }
float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<4;i++){ s+=a*n3(p); p*=2.02; a*=0.5; } return s; }`;

export function createS4(ctx) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1080 / 1920, 0.05, 400);
  scene.background = col('#04020a');
  const U = { uT: { value: 0 }, uAmp: { value: 0 }, uBirth: { value: W0 }, uEnergy: { value: 0 } };
  // nebulosa de fundo
  const neb = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: U,
    vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform float uT,uEnergy; varying vec3 vP; ${NOISE}
      void main(){ vec3 d=normalize(vP); float f=fbm(d*3.0+vec3(0.0,uT*0.04,0.0)); float g=fbm(d*6.0-uT*0.03);
        vec3 c=vec3(0.012,0.008,0.03)+vec3(0.20,0.08,0.55)*pow(f,2.2)*0.9+vec3(0.45,0.7,0.12)*pow(g,4.0)*0.18*uEnergy; gl_FragColor=vec4(c,1.0); }` }));
  scene.add(neb);
  // disco do portal (espiral)
  const portal = new THREE.Mesh(new THREE.CircleGeometry(7, 96), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: U,
    vertexShader: 'varying vec2 vU; void main(){ vU=uv*2.0-1.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform float uT,uBirth,uAmp; varying vec2 vU; ${NOISE}
      void main(){ float r=length(vU), a=atan(vU.y,vU.x); float age=max(uT-uBirth,0.0); float open=smoothstep(0.0,1.2,age);
        float sp=sin(a*5.0 + r*14.0 - uT*2.5)*0.5+0.5; float arms=pow(sp,3.0);
        float n=fbm(vec3(vU*3.0, uT*0.3)); float m=smoothstep(1.0,0.3,r)*smoothstep(0.0,0.35,r)*open;
        vec3 c=mix(vec3(0.41,0.22,0.91), vec3(0.72,1.0,0.29), arms*0.6+n*0.3);
        float al=(arms*0.55+n*0.35)*m; gl_FragColor=vec4(c*al*0.65, al*0.7); }` }));
  portal.position.z = -1.5; scene.add(portal);
  // orbe da IA
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.15, 96, 64), new THREE.ShaderMaterial({ uniforms: U,
    vertexShader: `uniform float uT,uAmp; varying vec3 vN,vV,vP; ${NOISE}
      void main(){ float d=n3(position*2.2+vec3(0.0,uT*0.7,0.0))*(0.12+uAmp*0.3); vec3 p=position*(1.0+d); vP=position; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(p,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uT,uAmp,uEnergy; varying vec3 vN,vV,vP; ${NOISE}
      void main(){ float fr=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.2); float n=fbm(vP*3.0+uT*0.6);
        vec3 core=mix(vec3(0.41,0.22,0.91), vec3(0.55,0.42,1.0), n); vec3 rim=mix(vec3(0.55,0.42,1.0), vec3(0.72,1.0,0.29), smoothstep(0.35,0.9,fr+uAmp*0.4));
        vec3 c=core*(0.12+n*0.55)+rim*fr*2.4+vec3(0.9,1.0,0.7)*pow(n,4.0)*(0.3+uAmp*1.0); gl_FragColor=vec4(c*uEnergy*0.5,1.0); }` }));
  scene.add(orb);
  const halo = glowSprite(BRAND.violetHi, 9, 0.3); scene.add(halo); const halo2 = glowSprite(BRAND.lime, 3.4, 0.0); scene.add(halo2);
  // anéis de energia
  const ringMats = [], rings = [];
  for (let i = 0; i < 7; i++) {
    const R = 1.9 + i * 0.55, m = new THREE.MeshBasicMaterial({ color: col(i % 3 === 2 ? BRAND.lime : BRAND.violetHi).multiplyScalar(1.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012 + (i % 3) * 0.012, 8, 160), m); mesh.userData = { i, ax: [hash(i) - 0.5, hash(i + 3) - 0.5, 0.4], sp: (i % 2 ? 1 : -1) * (0.25 + hash(i + 5) * 0.4) }; scene.add(mesh); rings.push(mesh); ringMats.push(m);
  }
  // pulsos "Ping" (grafismo da marca): anéis que se expandem a partir do ponto
  const pings = Array.from({ length: 4 }, (_, i) => { const m = new THREE.MeshBasicMaterial({ color: col(BRAND.lime).multiplyScalar(1.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, side: THREE.DoubleSide }); const r = new THREE.Mesh(new THREE.RingGeometry(0.985, 1.0, 128), m); scene.add(r); return r; });
  // hologramas orbitando
  const mkTex = (kind) => { const t = canvasTex(512, 640, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(16,12,28,.78)'; g.fillRect(0, 0, w, h); g.strokeStyle = BRAND.violetHi; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = BRAND.mist; g.font = '400 26px Silkscreen'; g.fillText(['ATENDIMENTO', 'ROTINA', 'SITE', 'RADAR'][kind], 30, 60);
    if (kind === 0) { g.fillStyle = BRAND.violet; g.beginPath(); g.roundRect(30, 100, 400, 90, 22); g.fill(); g.fillStyle = '#fff'; g.font = '700 32px "DM Sans"'; g.fillText('Oi, gostaria de um', 50, 140); g.fillText('orçamento.', 50, 178); g.fillStyle = BRAND.lime; g.beginPath(); g.roundRect(80, 230, 400, 90, 22); g.fill(); g.fillStyle = '#10101c'; g.fillText('Claro! Já te respondo.', 100, 285); g.fillStyle = BRAND.mist; g.font = '400 22px Silkscreen'; g.fillText('24H · AUTOMÁTICO', 30, 580); }
    if (kind === 1) { for (let i = 0; i < 5; i++) { g.fillStyle = BRAND.lime; g.fillRect(34, 110 + i * 90, 36, 36); g.fillStyle = '#10101c'; g.font = '800 30px "DM Sans"'; g.fillText('✓', 41, 139 + i * 90); g.fillStyle = 'rgba(244,241,255,.9)'; g.fillRect(90, 118 + i * 90, 250 + (i % 3) * 50, 20); } }
    if (kind === 2) { g.fillStyle = 'rgba(139,108,255,.35)'; g.fillRect(30, 100, 450, 70); g.fillStyle = BRAND.violet; g.fillRect(30, 190, 450, 190); g.fillStyle = BRAND.lime; g.fillRect(50, 330, 140, 30); [0, 1, 2].forEach((i) => { g.fillStyle = 'rgba(139,108,255,.5)'; g.fillRect(30 + i * 155, 410, 140, 150); }); }
    if (kind === 3) { g.strokeStyle = BRAND.violetHi; g.lineWidth = 3; [60, 110, 160, 210].forEach((r) => { g.beginPath(); g.arc(w / 2, 330, r, 0, 7); g.stroke(); }); g.fillStyle = BRAND.lime; g.beginPath(); g.arc(w / 2, 330, 18, 0, 7); g.fill(); } });
    t.userData.redraw(); return t; };
  const holos = [0, 1, 2, 3, 0, 2].map((k, i) => { const m = new THREE.MeshBasicMaterial({ map: mkTex(k), transparent: true, opacity: 0, toneMapped: false, color: col('#ffffff').multiplyScalar(1.3), side: THREE.DoubleSide, depthWrite: false }); const p = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), m); p.userData = { a: (i / 6) * 6.283, r: 3.3 + (i % 2) * 0.7, y: (hash(i + 2) - 0.5) * 2.4 }; scene.add(p); return p; });
  // partículas
  const burst = new ParticleField({ count: 7000, mode: 'burst', seed: 5, colors: [BRAND.violetHi, '#ffffff', BRAND.lime], size: 0.02, center: [0, 0, 0], speed: 16, drag: 1.1, turb: 1.4, birth: W0, life: 3.8, alpha: 0.7 });
  const burst2 = new ParticleField({ count: 2500, mode: 'burst', seed: 6, colors: [BRAND.lime, BRAND.violetHi, '#ffffff'], size: 0.016, center: [0, 0, 0], speed: 9, drag: 1.0, turb: 0.8, birth: VO0, life: 3.0, alpha: 0.6 });
  const amb = new ParticleField({ count: 2500, mode: 'ambient', seed: 22, colors: ['#ffffff', BRAND.violetHi, BRAND.lime], size: 0.014, box: [18, 24, 18], center: [0, 0, 0], speed: 0.5, turb: 0.8, alpha: 0.9 });
  scene.add(burst.points, burst2.points, amb.points);
  const bm = beam({ color: BRAND.violetHi, length: 40, r0: 0.4, r1: 5, opacity: 0.18 }); bm.position.set(0, 18, -3); scene.add(bm);

  const rig = new CameraRig(camera, [
    { t: 0.0, p: [0, 0.3, 15], l: [0, 0, 0], fov: 52 },
    { t: W0, p: [0, 0.3, 14.5], l: [0, 0, 0], fov: 52, roll: 0 },
    { t: W0 + 1.7, p: [0.3, 0.2, 9.0], l: [0, 0.2, 0], fov: 55, roll: 0.05 },
    { t: VO0, p: [-0.7, 0.4, 8.8], l: [0, 0.2, 0], fov: 48, roll: -0.04 },
    { t: OUT, p: [0.6, 0.1, 7.2], l: [0, 0.2, 0], fov: 46, roll: 0.03 },
    { t: 8.0, p: [0, 0, 3.4], l: [0, 0, 0], fov: 60, roll: 0 }
  ], { handheld: 0.03, seed: 12, shakes: [{ t: W0, dur: 1.0, amp: 0.5, freq: 22 }, { t: VO0, dur: 0.5, amp: 0.12 }] });

  // ---- DOM ----
  const root = el('div', 'scene'); root.id = 's4';
  // HUD circular (SVG) — surge progressivamente
  const shade = el('div', 'abs', '', root); shade.style.cssText = 'left:0;right:0;top:1080px;height:840px;background:linear-gradient(180deg,rgba(6,4,13,0),rgba(6,4,13,.88) 40%,rgba(6,4,13,.92))';
  const hud = el('div', 'abs', '', root); hud.style.cssText = 'left:90px;top:410px;width:900px;height:900px';
  hud.innerHTML = `<svg viewBox="-450 -450 900 900" width="900" height="900" style="overflow:visible">
    <g id="r1"><circle r="430" fill="none" stroke="#8B6CFF" stroke-width="3" stroke-dasharray="3 14" pathLength="1000"/></g>
    <g id="r2"><circle r="390" fill="none" stroke="#B7FF4A" stroke-width="5" stroke-dasharray="180 820" stroke-linecap="round" pathLength="1000"/></g>
    <g id="r3"><circle r="350" fill="none" stroke="#8B6CFF" stroke-width="2" pathLength="1000" stroke-dasharray="1000"/><path d="M0 -350 L0 -380 M350 0 L380 0 M0 350 L0 380 M-350 0 L-380 0" stroke="#F4F1FF" stroke-width="4"/></g></svg>`;
  const lab = el('div', 'abs pix lime', 'codrian.ai // online', root); lab.style.cssText = 'left:70px;top:160px;font-size:34px;opacity:0';
  const logLines = ['> iniciando atendimento', '> lendo mensagens ✓', '> respondendo 24h ✓', '> automatizando rotina ✓'];
  const log = el('div', 'abs mono', '', root); log.style.cssText = 'left:70px;top:222px;font-size:32px;line-height:1.5;color:var(--mist);font-weight:500';
  const logEls = logLines.map((l) => el('div', '', l, log)); logEls.forEach((e) => (e.style.opacity = 0));
  const L1 = buildLines(root, ['VOCÊ NÃO PRECISA', 'TRABALHAR MAIS.'], { size: 100, width: 920, classes: ['', ''] }); L1.root.style.cssText += ';position:absolute;left:80px;top:1230px;width:920px';
  const L2 = buildLines(root, ['PRECISA TRABALHAR', 'MELHOR.'], { size: 130, width: 920, classes: ['', 'lime glow-l'] }); L2.root.style.cssText += ';position:absolute;left:80px;top:1230px;width:920px';
  [L1.root, L2.root].forEach((r) => (r.style.textShadow = '0 6px 40px rgba(0,0,0,.95)'));
  const strike = el('div', 'abs', '', L1.lines[1].el); strike.style.cssText = 'left:0;right:0;top:52%;height:12px;background:var(--danger);transform-origin:left;transform:scaleX(0);box-shadow:0 0 30px var(--danger)'; L1.lines[1].el.style.position = 'relative';

  const tl = gsap.timeline();
  flash(tl, 0.0, { peak: 0.85, dur: 0.12 });                      // o "tranco" do congelamento
    flash(tl, W0, { peak: 0.9, dur: 0.5, color: '#d9ccff' });
  const rr = ['#r1', '#r2', '#r3'].map((q) => hud.querySelector(q)); tl.fromTo(rr, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%', svgOrigin: '0 0' }, { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out', stagger: 0.18 }, W0 + 0.9);
  tl.to(rr[0], { rotation: 180, svgOrigin: '0 0', duration: S.end - S.start - W0, ease: 'none' }, W0 + 0.9).to(rr[1], { rotation: -360, svgOrigin: '0 0', duration: S.end - S.start - W0, ease: 'none' }, W0 + 0.9);
  tl.fromTo(lab, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power3.out' }, W0 + 1.2);
  logEls.forEach((e, i) => tl.fromTo(e, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out' }, W0 + 1.6 + i * 0.45));
  tl.to([lab, log], { opacity: 0, x: -40, duration: 0.3, ease: 'power2.in' }, OUT - 0.2);
  // fala da IA (frase 1 -> frase 2)
  const s1 = VO0 + 0.05, s2 = VO0 + 2.0;
  slamIn(tl, L1.lines[0].chars, s1, { dur: 0.5, stagger: 0.018, from: 2.4, y: 40 }); slamIn(tl, L1.lines[1].chars, s1 + 0.45, { dur: 0.5, stagger: 0.02, from: 2.4, y: 40 });
  tl.to(strike, { scaleX: 1, duration: 0.22, ease: 'power3.out' }, s1 + 1.15);
  slamOut(tl, [...L1.lines[0].chars, ...L1.lines[1].chars], s2 - 0.12, { dur: 0.25, stagger: 0.004, to: 1.3, blur: 18 }); tl.to(strike, { opacity: 0, duration: 0.2 }, s2 - 0.12);
  slamIn(tl, L2.lines[0].chars, s2 + 0.1, { dur: 0.5, stagger: 0.016, from: 2.8, y: 40 }); slamIn(tl, L2.lines[1].chars, s2 + 0.5, { dur: 0.6, stagger: 0.03, from: 4, blur: 34, y: -60 });
  shakeEl(tl, L2.lines[1].el, s2 + 0.55, 0.4, 20, 44); glitchBurst(tl, L2.lines[1].el, s2 + 0.9, 0.25, { seed: 31, amp: 30 });
  tl.to(L2.lines[1].el, { scale: 1.05, duration: 1.2, ease: 'sine.inOut' }, s2 + 1.1);
  slamOut(tl, [...L2.lines[0].chars, ...L2.lines[1].chars], OUT - 0.1, { dur: 0.4, stagger: 0.006, to: 1.8, blur: 26 });
  flash(tl, 7.92, { peak: 1.0, dur: 0.18, color: '#ffffff' });

  const ease = gsap.parseEase(WAVE.ease);
  const energy = (t) => easeOutCubic(remap(t, W0 - 0.2, W0 + 1.2));
  return {
    id: 's4', ...S, three: { scene, camera }, dom: root, tl,
    transition: { mode: 2, dur: 3.4, center: WAVE.center, prevFreeze: SCENES.s3.end - SCENES.s3.start - 0.04,
      holdA: (lt) => ease(clamp((lt - W0) / WAVE.dur)),
      post: (lt) => ({ final: { uFreeze: 1 - remap(lt, W0, W0 + 0.35), uCA: 0.6 + pulse(lt, W0, 0.5) * 4, uGlitch: pulse(lt, 0, 0.2) * 0.6, uVig: 1 } }) },
    update(t) {
      rig.update(t); U.uT.value = t; U.uEnergy.value = energy(t);
      const amp = ampAt(ctx.envelopes[VO.s4.file], t - VO0); U.uAmp.value = amp;
      const e = energy(t), collapse = remap(t, OUT, 8.0);
      orb.scale.setScalar((0.25 + 0.75 * e) * (1 + amp * 0.22) * (1 - collapse * 0.3)); orb.rotation.y = t * 0.3; halo.material.opacity = 0.28 * e * (0.8 + amp * 0.6); halo.scale.setScalar(8 + amp * 3 + collapse * 6);
      halo2.material.opacity = (0.12 + amp * 0.25) * e; portal.rotation.z = -t * 0.18; portal.scale.setScalar(1 + collapse * 0.8);
      rings.forEach((r, i) => { const u = r.userData, k = remap(t, W0 + i * 0.12, W0 + 0.9 + i * 0.12); r.material.opacity = easeOutCubic(k) * (0.5 - collapse * 0.3); r.scale.setScalar(lerp(2.6, 1, easeOutCubic(k))); r.rotation.set(t * u.ax[0] * u.sp * 2.1 + 1.2, t * u.ax[1] * u.sp * 2.1, t * u.sp); });
      pings.forEach((p, i) => { const ph = ((t * 0.55 + i / 4) % 1), on = t > W0 + 0.8; p.scale.setScalar(0.4 + ph * 7.5); p.material.opacity = on ? Math.pow(1 - ph, 1.6) * 0.9 : 0; });
      holos.forEach((h, i) => { const u = h.userData, k = remap(t, W0 + 1.4 + i * 0.18, W0 + 2.0 + i * 0.18), a = u.a + t * 0.32; h.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 0.8 + i) * 0.15, Math.sin(a) * u.r * 0.6 - 0.5); h.lookAt(camera.position.x * 0.5, h.position.y, camera.position.z); h.material.opacity = easeOutCubic(k) * 0.9 * (1 - collapse); h.scale.setScalar(0.7 + 0.3 * easeOutCubic(k)); });
      [burst, burst2, amb].forEach((p) => p.update(t, camera));
    },
    draw2d(g, t) {
      const k = pulse(t, W0, 0.8), k2 = pulse(t, VO0, 0.6);
      if (k > 0.02) for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283 + Math.floor(t * 20) * 0.7, r = 160 + hash(i + Math.floor(t * 24)) * 700; bolt(g, 540, 870, 540 + Math.cos(a) * r, 870 + Math.sin(a) * r * 1.1, i * 7 + Math.floor(t * 30), { color: i % 2 ? BRAND.lime : BRAND.violetHi, width: 2.2 * k, jag: 0.2, branches: 2, glow: 30 }); }
      if (k2 > 0.02) for (let i = 0; i < 4; i++) { const a = hash(i + 3) * 6.28; bolt(g, 540, 870, 540 + Math.cos(a) * 520, 870 + Math.sin(a) * 520, i + Math.floor(t * 14), { color: BRAND.lime, width: 1.6 * k2, jag: 0.15, branches: 1, glow: 22 }); }
    },
    post(t) {
      const e = energy(t), amp = ampAt(ctx.envelopes[VO.s4.file], t - VO0), col2 = remap(t, OUT, 8.0);
      return { bloom: { strength: 0.4 + pulse(t, W0, 1.2) * 0.45 + amp * 0.2 + col2 * 0.9, threshold: 0.75 }, final: { uCA: 0.8 + pulse(t, W0, 0.8) * 3, uGlitch: pulse(t, W0, 0.5) * 0.4 } };
    }
  };
}
