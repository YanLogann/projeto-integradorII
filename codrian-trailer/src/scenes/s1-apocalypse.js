import * as THREE from 'three';
import gsap from 'gsap';
import { BRAND, COPY, T, SCENES } from '../config.js';
import { CameraRig } from '../core/camera-rig.js';
import { ParticleField } from '../core/particles.js';
import { makeCity, holoSign, canvasTex, beam, col, glowSprite } from '../core/gfx.js';
import { bolt } from '../core/overlay2d.js';
import { mulberry32, pulse, clamp, remap, easeInCubic, hash } from '../core/math.js';
import { buildLines, slamIn, slamOut, glitchBurst, shakeEl, flash } from '../ui/text-fx.js';

const S = SCENES.s1;
export const SKY_FS = `varying vec3 vD; uniform float uT;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=0.5; } return s; }
  void main(){ vec3 d=normalize(vD); float y=d.y;
    vec3 top=vec3(0.012,0.008,0.03), mid=vec3(0.07,0.03,0.17), hor=vec3(0.24,0.11,0.52);
    vec3 c=mix(hor, mid, smoothstep(0.0,0.35,y)); c=mix(c, top, smoothstep(0.25,0.9,y));
    float cl=fbm(d.xz/(abs(y)+0.35)*1.6 + vec2(uT*0.05,0.0)); c+=vec3(0.12,0.05,0.3)*cl*smoothstep(0.0,0.5,y)*0.9;
    // radar "ping" no horizonte (grafismo da marca): anéis + ponto lima
    vec2 q=vec2(d.x, d.y-0.04)*vec2(1.0,2.2)/max(-d.z,0.2); float r=length(q+vec2(0.0,0.0));
    float ring=0.0; for(int i=0;i<3;i++){ float rr=fract(uT*0.35+float(i)/3.0); ring+=exp(-pow((r-rr*0.9)/0.012,2.0))*(1.0-rr); }
    c+=vec3(0.55,0.4,1.0)*ring*0.8*step(d.z,-0.2) + vec3(0.72,1.0,0.29)*exp(-r*r*900.0)*1.6*step(d.z,-0.2);
    gl_FragColor=vec4(c,1.0); }`;

export function makeSky(radius = 500) {
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ', fragmentShader: SKY_FS });
  return { mesh: new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), mat), mat };
}

export function createS1(ctx) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(62, 1080 / 1920, 0.1, 900);
  scene.background = col(BRAND.black);

  // céu
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ', fragmentShader: SKY_FS });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), skyMat); scene.add(sky);

  // cidade em colapso
  const city = makeCity({ seed: 11, count: 230, zRange: [70, -330], gap: 17, wRange: [8, 17], hRange: [28, 120], lean: 0.1, lit: 0.62, decay: 0.15, fogDensity: 0.0105 });
  scene.add(city);

  // fragmentos holográficos suspensos (arestas luminosas)
  const rnd = mulberry32(5), shardPos = [];
  const box = new THREE.BoxGeometry(1, 1, 1), edges = new THREE.EdgesGeometry(box);
  const ep = edges.attributes.position; const verts = [];
  for (let i = 0; i < 160; i++) {
    const s = 0.8 + rnd() * 3.4, sx = s * (0.4 + rnd()), sy = s * (0.3 + rnd() * 1.2), sz = s * (0.3 + rnd());
    const p = new THREE.Vector3((rnd() - 0.5) * 20, 3 + rnd() * 34, 60 - rnd() * 380), q = new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3);
    const m = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(q), new THREE.Vector3(sx, sy, sz));
    for (let k = 0; k < ep.count; k++) { const v = new THREE.Vector3().fromBufferAttribute(ep, k).applyMatrix4(m); verts.push(v.x, v.y, v.z); }
  }
  const shg = new THREE.BufferGeometry(); shg.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  const shards = new THREE.LineSegments(shg, new THREE.LineBasicMaterial({ color: col('#9a80ff').multiplyScalar(1.6), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  shards.frustumCulled = false; scene.add(shards);

  // placas de erro nas fachadas (narrativa: ninguém atende)
  const signs = []; const texts = ['SEM RESPOSTA', '404', 'OFFLINE', 'LEAD PERDIDO', 'ERRO', 'SEM RESPOSTA', 'CLIENTE SAIU'];
  texts.forEach((txt, i) => {
    const tex = holoSign(txt, { w: 640, h: 200, size: txt.length > 8 ? 78 : 130, danger: i % 2 === 0, color: BRAND.violetHi });
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, color: col('#ffffff').multiplyScalar(1.6) });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.8), mat);
    const side = i % 2 ? 1 : -1; m.position.set(side * 8.6, 7 + (i * 3.7) % 14, 20 - i * 42); m.rotation.y = -side * Math.PI / 2; m.userData.i = i; scene.add(m); signs.push(m);
  });

  // feixes de luz (iluminação volumétrica)
  const beams = [];
  [[-6, -40], [7, -95], [-4, -150], [5, -30]].forEach(([x, z], i) => { const b = beam({ color: i % 2 ? BRAND.violetHi : '#b9a5ff', length: 120, r0: 0.5, r1: 7, opacity: 0.22, seed: i }); b.position.set(x, 110, z); b.rotation.z = (i % 2 ? 1 : -1) * 0.12; scene.add(b); beams.push(b); });

  // R$ evaporando (dinheiro vazando)
  const rTex = canvasTex(128, 128, (g) => { g.clearRect(0, 0, 128, 128); g.font = '900 78px "DM Sans"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = BRAND.lime; g.shadowBlur = 18; g.fillStyle = BRAND.lime; g.fillText('R$', 64, 70); }); rTex.userData.redraw();
  const money = new ParticleField({ count: 150, mode: 'ambient', seed: 31, colors: [BRAND.lime, BRAND.lime, '#e8ffb0'], size: 0.9, box: [26, 40, 60], speed: 6, turb: 1.2, map: rTex, alpha: 0.8 });
  const dust = new ParticleField({ count: 2600, mode: 'ambient', seed: 21, colors: ['#ffffff', BRAND.violetHi, '#b9a5ff'], size: 0.055, box: [30, 36, 70], speed: 0.8, turb: 0.8 });
  const sparks = new ParticleField({ count: 700, mode: 'ambient', seed: 8, colors: [BRAND.lime, BRAND.violetHi, '#ffffff'], size: 0.04, box: [24, 30, 60], speed: 3.5, turb: 0.4 });
  scene.add(money.points, dust.points, sparks.points);

  // câmera: voo rasante atravessando o desfiladeiro, subindo no fim
  const rig = new CameraRig(camera, [
    { t: 0.0, p: [0, 9, 62], l: [0, 12, -40], fov: 78, roll: 0.0 },
    { t: 1.0, p: [-3.5, 8.0, 18], l: [2, 13, -60], fov: 70, roll: -0.10 },
    { t: 2.0, p: [3.8, 11, -28], l: [-2, 15, -95], fov: 64, roll: 0.14 },
    { t: 3.0, p: [-2.2, 8.5, -78], l: [1, 20, -140], fov: 60, roll: -0.08 },
    { t: 4.2, p: [0.5, 15, -128], l: [0, 34, -210], fov: 56, roll: 0.04 }
  ], { handheld: 0.18, seed: 4, shakes: [{ t: 0.0, dur: 0.5, amp: 0.8 }, { t: T.headline, dur: 0.5, amp: 0.9 }, { t: 2.35, dur: 0.35, amp: 0.5 }] });

  // ---- DOM ----
  const root = document.createElement('div'); root.className = 'scene'; root.id = 's1';
  const wrap = document.createElement('div'); wrap.className = 'abs'; wrap.style.cssText = 'left:70px;top:620px;width:940px'; root.appendChild(wrap);
  const { root: h, lines } = buildLines(wrap, ['SUA EMPRESA', 'ESTÁ PERDENDO', 'DINHEIRO.'], { size: 150, width: 940, classes: ['', '', 'danger glow-r'] });
  h.style.textShadow = '0 6px 50px rgba(0,0,0,.95), 0 0 60px rgba(105,56,232,.65)';
  const tag = document.createElement('div'); tag.className = 'abs pix lime'; tag.style.cssText = 'left:0;right:0;top:150px;text-align:center;font-size:30px;opacity:0'; tag.textContent = '// sinal perdido'; root.appendChild(tag);

  const tl = gsap.timeline();
  const a = T.headline; // 1.15
  lines.forEach((l, i) => {
    const at = a + i * 0.42 - 0.02;
    slamIn(tl, l.chars, at, { dur: 0.6, stagger: 0.016, from: 3.8 - i * 0.4, blur: 30 });
    shakeEl(tl, l.el, at + 0.05, 0.35, 16 - i * 3, 40 + i);
    glitchBurst(tl, l.el, at + 0.5, 0.18, { seed: 70 + i, amp: 24 });
  });
  glitchBurst(tl, lines[2].el, 2.6, 0.5, { seed: 91, amp: 36 });
  tl.fromTo(h, { scale: 1.0 }, { scale: 1.06, duration: 2.0, ease: 'none' }, a);
  tl.fromTo(tag, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' }, 0.4).to(tag, { opacity: 0, duration: 0.2 }, 1.0);
  tl.set(tag, { opacity: 1 }, 0.6).set(tag, { opacity: 0 }, 0.7).set(tag, { opacity: 1 }, 0.78).set(tag, { opacity: 0 }, 0.9);
  slamOut(tl, lines.flatMap((l) => l.chars), 3.38, { dur: 0.5, stagger: 0.008, to: 2.2, blur: 28 });
  flash(tl, 0.0, { peak: 0.9, dur: 0.25 }); flash(tl, a, { peak: 0.35, dur: 0.25, color: '#b9a5ff' }); flash(tl, 3.95, { peak: 0.7, dur: 0.12 });

  const bolts = [[0.35, 0.34, 0.1, 0.55, 0.75], [0.9, 0.7, 0.88, 0.5, 0.2], [2.4, 0.5, 0.05, 0.4, 0.7], [3.2, 0.78, 0.02, 0.62, 0.8], [3.55, 0.2, 0.0, 0.3, 0.55]];
  const flashAt = [0.35, 0.9, 2.4, 3.2, 3.55];
  const lightning = (t) => flashAt.reduce((m, f) => Math.max(m, pulse(t, f, 0.22) * (1 + 0.6 * Math.sin((t - f) * 90))), 0);

  return {
    id: 's1', ...S, three: { scene, camera }, dom: root, tl,
    update(t) {
      const L = clamp(lightning(t), 0, 1.0);
      rig.update(t);
      skyMat.uniforms.uT.value = t;
      city.userData.update(t, { glitch: 0.15 + 0.55 * pulse(t, 0.3, 0.6) + 0.5 * pulse(t, 2.5, 0.6) + 0.4 * remap(t, 2.6, 4.0), flash: L, decay: 0.12 + 0.55 * remap(t, 0, 4) });
      beams.forEach((b) => b.userData.update(t));
      shards.material.opacity = 0.6 + 0.35 * Math.sin(t * 9) * Math.sin(t * 3.1);
      signs.forEach((m) => { const f = hash(Math.floor(t * 14) + m.userData.i * 7) > 0.18; m.material.opacity = f ? 0.95 : 0.15; m.position.x += 0; });
      const c = camera.position;
      [money, dust, sparks].forEach((p) => { p.u.uCenter.value.set(c.x, c.y - 4, c.z - 22); p.update(t, camera); });
    },
    draw2d(g, t) {
      bolts.forEach(([t0, x0, y0, x1, y1], i) => {
        const e = pulse(t, t0, 0.22); if (!e) return;
        const seed = i * 13 + Math.floor(t * 30);
        bolt(g, x0 * 1080, y0 * 1920, x1 * 1080, y1 * 1920, seed, { color: i % 2 ? BRAND.violetHi : '#b9a5ff', width: 5 * (0.4 + e), jag: 0.16, branches: 3, glow: 40 });
      });
    },
    post(t) {
      const open = pulse(t, 0, 0.3);
      return { bloom: { strength: 0.5 + lightning(t) * 0.35, threshold: 0.78 }, final: { uGlitch: 0.08 + 0.5 * pulse(t, 0.3, 0.4) + 0.45 * pulse(t, 2.5, 0.5) + 0.35 * remap(t, 3.5, 4), uCA: 0.9 + open * 3 + pulse(t, T.headline, 0.4) * 2, uFlash: open * 0.45, uExposure: 0.92 } };
    }
  };
}
