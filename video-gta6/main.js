// Codrian x "radar" — vídeo vertical 9:16, 32 s. Tudo é função do tempo t (determinístico, quadro a quadro).
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1080, H = 1920;
const C = { // paleta Codrian (tokens.css)
  void: 0x100c1c, deep: 0x271942, violet: 0x6938e8, violetHi: 0x8b6cff,
  lime: 0xb7ff4a, ink: 0xf4f1ff, mist: 0xcfc6ee, muted: 0x8e83b8,
};
const SHOP = new THREE.Vector3(0, 0, 32);      // fachada da loja
const LAND = new THREE.Vector3(-16, 0, 6);      // onde o "c." cai
const PHONE = new THREE.Vector3(0, 74, 10);    // celular flutuando acima da praça
const T_IMPACT = 10.4;

// ---------- utilidades ----------
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp01((t - a) / (b - a));
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = s => ((ax * s + bx) * s + cx) * s, sy = s => ((ay * s + by) * s + cy) * s;
  const dx = s => (3 * ax * s + 2 * bx) * s + cx;
  return x => { if (x <= 0) return 0; if (x >= 1) return 1; let s = x; for (let i = 0; i < 8; i++) { const e = sx(s) - x; const d = dx(s); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; s -= e / d; } return sy(clamp01(s)); };
}
const outExpo = bezier(0.16, 1, 0.3, 1);     // --ease-out-expo
const inOut = bezier(0.65, 0, 0.35, 1);      // --ease-in-out
const outCubic = bezier(0.33, 1, 0.68, 1);   // --ease-out-cubic
const inCubic = x => x * x * x;
const smooth = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const hex = h => new THREE.Color(h);
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- renderer ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, W / H, 0.5, 5000);

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.7, 0.5, 0.86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- uniforms globais (troca de paleta) ----------
const U = {
  uWaveR: { value: -100 },              // raio da onda de paleta
  uWaveC: { value: new THREE.Vector2(LAND.x, LAND.z) },
  uGlobal: { value: 0 },                // 0 = pôr do sol, 1 = Codrian em todo lugar
  uSky: { value: 0 },                   // mistura do céu
  uTime: { value: 0 },
  uSunDir: { value: v3(0.12, 0.055, 1).normalize() },
};

const COMMON = /* glsl */`
uniform float uWaveR; uniform vec2 uWaveC; uniform float uGlobal; uniform float uSky; uniform float uTime; uniform vec3 uSunDir;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float palMix(vec3 wp){ float d = length(wp.xz - uWaveC); return max(uGlobal, 1.0 - smoothstep(uWaveR - 70.0, uWaveR, d)); }
float waveFront(vec3 wp){ float d = length(wp.xz - uWaveC); return smoothstep(uWaveR - 60.0, uWaveR - 8.0, d) * (1.0 - smoothstep(uWaveR - 8.0, uWaveR, d)) * (1.0 - uGlobal); }
vec3 skySunset(vec3 d){
  float y = d.y;
  vec3 hor = vec3(1.0, .42, .12), mid = vec3(.78, .1, .40), top = vec3(.09, .025, .2);
  vec3 col = mix(hor, mid, smoothstep(0.0, .16, y));
  col = mix(col, top, smoothstep(.12, .55, y));
  col = mix(col, vec3(.55,.16,.30), smoothstep(0.0, -.08, y));
  float s = dot(normalize(d), uSunDir);
  col += vec3(1.0, .4, .15) * pow(max(s, 0.0), 30.0) * .7;
  float disc = smoothstep(.9965, .9972, s);
  float yy = (d.y - uSunDir.y) * 140.0;
  float stripes = d.y < uSunDir.y ? step(.38 + (uSunDir.y - d.y) * 22.0, fract(yy)) : 1.0;
  vec3 sunC = mix(vec3(1.0, .35, .55), vec3(1.0, .88, .45), smoothstep(-.03, .03, d.y - uSunDir.y));
  col = mix(col, sunC * 2.2, disc * stripes);
  return col;
}
vec3 skyCodrian(vec3 d){
  float y = d.y;
  vec3 voidC = vec3(.0627,.047,.11), deepC = vec3(.153,.098,.259), violetC = vec3(.41,.22,.91);
  vec3 col = mix(deepC, voidC, smoothstep(0.0, .35, y));
  col += violetC * .55 * exp(-abs(y) * 14.0);
  return col;
}
vec3 skyColor(vec3 d){ return mix(skySunset(d), skyCodrian(d), uSky); }
vec3 fogColor(vec3 d, float m){
  float s = max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uSunDir.x, 0.0, uSunDir.z))), 0.0);
  vec3 fs = mix(vec3(.2, .06, .2), vec3(.8, .3, .2), pow(s, 4.0));
  vec3 fc = vec3(.075, .055, .135);
  return mix(fs, fc, m);
}
vec3 applyFog(vec3 col, vec3 wp, float m){
  vec3 dv = wp - cameraPosition; float dist = length(dv);
  float f = 1.0 - exp(-dist * mix(.0011, .0016, m));
  f = clamp(f, 0.0, .92);
  return mix(col, fogColor(dv, m), f);
}
`;

function shaderMat(vert, frag, extra = {}, opts = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...U, ...extra }, vertexShader: vert, fragmentShader: COMMON + frag, ...opts });
}

// ---------- céu ----------
{
  const m = shaderMat(`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
    `varying vec3 vDir; void main(){ gl_FragColor = vec4(skyColor(normalize(vDir)), 1.0); }`, {}, { side: THREE.BackSide, depthWrite: false });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), m);
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);
  scene.userData.sky = sky;
}

// ---------- cidade ----------
const rnd = mulberry32(20261119);
const BLOCK = 52, LOT = 40;
const buildings = []; // {x,z,w,d,h,neon}
const NEON_A = [hex(0xff4fa3), hex(0x4ff3ff), hex(0xff8a3d), hex(0xff5fd0)];
const NEON_B = [hex(C.violetHi), hex(C.violet), hex(C.mist), hex(C.violetHi)];
for (let i = -7; i <= 7; i++) for (let j = -8; j <= 1; j++) {
  const cx = i * BLOCK, cz = j * BLOCK;
  if (i === 0 && j === 0) continue;                    // praça onde o logo cai
  const distC = Math.hypot(cx - 40, cz + 120);
  const tall = Math.max(0.25, 1.6 - distC / 260);
  if (i === 0 && j === 1) {                             // quarteirão da loja: dois prédios nas laterais
    buildings.push({ x: -13.5, z: cz + 4, w: 12, d: 30, h: 26, neon: 1, k: 0 });
    buildings.push({ x: 13.5, z: cz + 4, w: 12, d: 30, h: 34, neon: 1, k: 1 });
    buildings.push({ x: 0, z: cz + 12, w: 14, d: 14, h: 18, neon: 0, k: 2 });
    continue;
  }
  const n = rnd() < 0.35 ? 1 : (rnd() < 0.5 ? 2 : 4);
  const subs = n === 1 ? [[0, 0, LOT, LOT]] : n === 2 ? [[-10.5, 0, 18, LOT], [10.5, 0, 18, LOT]] : [[-10.5, -10.5, 18, 18], [10.5, -10.5, 18, 18], [-10.5, 10.5, 18, 18], [10.5, 10.5, 18, 18]];
  for (const [ox, oz, w, d] of subs) {
    const inset = 1 + rnd() * 3;
    let h = (8 + rnd() * 30) * tall + (rnd() < 0.12 * tall ? 60 + rnd() * 70 : 0);
    if (j === 1) h = Math.min(h, 30);
    buildings.push({ x: cx + ox, z: cz + oz, w: w - inset, d: d - inset, h, neon: rnd() < 0.45 ? 1 : 0, k: Math.floor(rnd() * 4) });
  }
}
{
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const n = buildings.length;
  const aSeed = new Float32Array(n), aH = new Float32Array(n), aNeon = new Float32Array(n), aNA = new Float32Array(n * 3), aNB = new Float32Array(n * 3);
  const mesh = new THREE.InstancedMesh(geo, null, n);
  const mtx = new THREE.Matrix4();
  buildings.forEach((b, i) => {
    mtx.compose(v3(b.x, 0, b.z), new THREE.Quaternion(), v3(b.w, b.h, b.d));
    mesh.setMatrixAt(i, mtx);
    aSeed[i] = i * 1.37; aH[i] = b.h; aNeon[i] = b.neon;
    NEON_A[b.k].toArray(aNA, i * 3); NEON_B[b.k].toArray(aNB, i * 3);
  });
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  geo.setAttribute('aH', new THREE.InstancedBufferAttribute(aH, 1));
  geo.setAttribute('aNeon', new THREE.InstancedBufferAttribute(aNeon, 1));
  geo.setAttribute('aNA', new THREE.InstancedBufferAttribute(aNA, 3));
  geo.setAttribute('aNB', new THREE.InstancedBufferAttribute(aNB, 3));
  mesh.material = shaderMat(`
    attribute float aSeed; attribute float aH; attribute float aNeon; attribute vec3 aNA; attribute vec3 aNB;
    varying vec3 vW; varying vec3 vN; varying float vSeed; varying float vH; varying float vNeon; varying vec3 vNA; varying vec3 vNB;
    void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position,1.); vW = w.xyz; vN = normalize(mat3(instanceMatrix) * normal);
      vSeed = aSeed; vH = aH; vNeon = aNeon; vNA = aNA; vNB = aNB; gl_Position = projectionMatrix * viewMatrix * w; }`, `
    varying vec3 vW; varying vec3 vN; varying float vSeed; varying float vH; varying float vNeon; varying vec3 vNA; varying vec3 vNB;
    void main(){
      vec3 n = normalize(vN); float m = palMix(vW);
      float side = 1.0 - step(.5, abs(n.y));
      float u = abs(n.x) > .5 ? vW.z : vW.x; float v = vW.y;
      vec2 cell = vec2(u / 3.2, v / 3.6); vec2 f = fract(cell); vec2 id = floor(cell);
      float win = step(.2, f.x) * step(f.x, .8) * step(.28, f.y) * step(f.y, .78) * step(3.0, v) * step(v, vH - 1.6) * side;
      float h = hash12(id + vec2(vSeed * 3.1, n.x * 5. + n.z * 9.));
      float lit = step(.5, h);
      float h2 = hash12(id * 1.7 + vSeed);
      vec3 winA = h2 < .62 ? vec3(1.0, .74, .42) : (h2 < .82 ? vec3(1.0, .45, .72) : vec3(.5, .95, 1.0));
      vec3 winB = h2 < .6 ? vec3(.545, .424, 1.0) : (h2 < .85 ? vec3(.81, .78, .93) : vec3(.41,.22,.91));
      float hf = clamp(v / max(vH, 1.0), 0., 1.);
      vec3 baseA = vec3(.15, .065, .12) + vec3(1.0, .42, .22) * max(dot(n, normalize(vec3(uSunDir.x, .35, uSunDir.z))), 0.0) * (.22 + .34 * hf);
      vec3 baseB = vec3(.07, .05, .12) + vec3(.41, .22, .91) * max(dot(n, normalize(vec3(-.3, .5, .8))), 0.0) * .16 * (.4 + hf);
      if (n.y > .5) { baseA = vec3(.09,.05,.11); baseB = vec3(.06,.045,.1); }
      vec3 col = mix(baseA, baseB, m);
      col += mix(winA, winB, m) * win * lit * mix(1.1, 0.95, m);
      col += mix(winA, winB, m) * win * (1.0 - lit) * .04;
      float band = vNeon * side * step(vH - 1.1, v) * step(v, vH - .5);
      col += mix(vNA, vNB, m) * band * 3.2;
      float vbar = vNeon * side * step(abs(fract(u / 41.0 + vSeed) - .5), .012) * step(4.0, v) * step(v, vH - 2.0);
      col += mix(vNA, vNB, m) * vbar * 2.4;
      col += vec3(.545,.424,1.0) * waveFront(vW) * 5.0;
      gl_FragColor = vec4(applyFog(col, vW, m), 1.0);
    }`);
  mesh.frustumCulled = false;
  scene.add(mesh);
}

// chão: ruas, calçadas, areia
{
  const m = shaderMat(`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`, `
    varying vec3 vW;
    void main(){
      float m = palMix(vW);
      vec2 g = mod(vW.xz + 26.0, 52.0);
      float street = 1.0 - step(6.0, g.x) * step(g.x, 46.0) * step(6.0, g.y) * step(g.y, 46.0);
      float walk = 1.0 - step(7.5, g.x) * step(g.x, 44.5) * step(7.5, g.y) * step(g.y, 44.5);
      vec3 asphA = vec3(.07,.04,.08), asphB = vec3(.045,.035,.075);
      vec3 walkA = vec3(.17,.09,.14), walkB = vec3(.09,.07,.15);
      vec3 lotA = vec3(.1,.06,.1), lotB = vec3(.06,.045,.1);
      vec3 col = mix(lotA, lotB, m);
      col = mix(col, mix(walkA, walkB, m), walk);
      col = mix(col, mix(asphA, asphB, m), street * (1.0 - step(7.5, min(g.x, 52. - g.x)) * 0.0));
      // linha central tracejada
      float cx = abs(g.x - 0.0); float cz = abs(g.y - 0.0);
      float dashX = step(abs(mod(vW.x, 52.) - 26.), 0.0);
      float lineZ = (1.0 - step(.18, abs(fract((vW.x + 26.) / 52.) * 52. - 0.0) )) ;
      float ax = abs(mod(vW.x + 26.0, 52.0)); ax = min(ax, 52.0 - ax);
      float az = abs(mod(vW.z + 26.0, 52.0)); az = min(az, 52.0 - az);
      float dash = (step(ax, .18) * step(.5, fract(vW.z / 6.0)) * step(6.0, az)) + (step(az, .18) * step(.5, fract(vW.x / 6.0)) * step(6.0, ax));
      col += mix(vec3(1.0,.6,.3), vec3(.545,.424,1.0), m) * dash * .55;
      // praça
      float plaza = step(abs(vW.x), 20.0) * step(abs(vW.z), 20.0);
      col = mix(col, mix(vec3(.15,.08,.13), vec3(.08,.06,.13), m), plaza);
      // areia e mar ao fundo
      float sand = smoothstep(108.0, 112.0, vW.z);
      col = mix(col, mix(vec3(.55,.28,.25), vec3(.12,.08,.2), m), sand);
      col += vec3(.545,.424,1.0) * waveFront(vW) * 4.0;
      gl_FragColor = vec4(applyFog(col, vW, m), 1.0);
    }`);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1200), m);
  g.rotation.x = -Math.PI / 2; g.position.set(0, 0, -150);
  scene.add(g);
}
// mar
{
  const m = shaderMat(`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`, `
    varying vec3 vW;
    void main(){
      float m = palMix(vW);
      vec3 vd = normalize(vW - cameraPosition);
      vec3 nn = normalize(vec3(sin(vW.x * .08 + uTime * 1.3) * .03 + sin(vW.z * .21 - uTime) * .02, 1.0, cos(vW.z * .13 + uTime * .7) * .05));
      vec3 r = reflect(vd, nn); r.y = abs(r.y);
      vec3 col = skyColor(r) * .75;
      float fres = pow(1.0 - max(dot(-vd, nn), 0.0), 3.0);
      col = mix(col * .5, col, fres) + vec3(.02,.01,.04);
      gl_FragColor = vec4(applyFog(col, vW, m) , 1.0);
    }`);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(6000, 3000, 1, 1), m);
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.2, 135 + 1500);
  scene.add(sea);
}
// palmeiras (silhuetas)
{
  const parts = [];
  for (let s = 0; s < 6; s++) {
    const seg = new THREE.CylinderGeometry(0.28 - s * 0.02, 0.32 - s * 0.02, 2.1, 6);
    seg.rotateZ(-0.04 * s); seg.translate(0.09 * s * s * 0.5, 1.05 + s * 2.0, 0);
    parts.push(seg);
  }
  const topX = 0.09 * 25 * 0.5 + 0.2, topY = 12.2;
  for (let f = 0; f < 9; f++) {
    const fr = new THREE.ConeGeometry(0.55, 6.5, 4, 1);
    fr.scale(1, 1, 0.18); fr.translate(0, 3.25, 0);
    fr.rotateZ(-1.95 + (f % 3) * 0.12); fr.rotateY(f / 9 * Math.PI * 2);
    fr.translate(topX, topY, 0);
    parts.push(fr);
  }
  const palmGeo = mergeGeometries(parts.map(p => p.toNonIndexed ? p.toNonIndexed() : p));
  const pos = [];
  for (let x = -360; x <= 360; x += 13) { pos.push([x + (rnd() - .5) * 4, 104 + rnd() * 10]); }
  for (let z = -400; z <= 90; z += 26) { if (z + 5 < -70 || z + 5 > 40) pos.push([-26 + 4.8, z + 5]); pos.push([26 - 4.8, z + 18]); }
  const mesh = new THREE.InstancedMesh(palmGeo, shaderMat(`
      varying vec3 vW; void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`, `
      varying vec3 vW; void main(){ float m = palMix(vW); vec3 col = mix(vec3(.07,.025,.07), vec3(.04,.03,.07), m); gl_FragColor = vec4(applyFog(col, vW, m), 1.); }`), pos.length);
  const mtx = new THREE.Matrix4();
  pos.forEach(([x, z], i) => { const s = 0.85 + rnd() * 0.5; mtx.compose(v3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd() * 6.28, 0)), v3(s, s, s)); mesh.setMatrixAt(i, mtx); });
  mesh.frustumCulled = false;
  scene.add(mesh);
}
// carros (rastros de luz)
const cars = [];
{
  const n = 160;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const aCol = new Float32Array(n * 3), aColB = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const alongX = rnd() < 0.5;
    const lane = Math.round((rnd() - 0.5) * 14) * BLOCK + 26 * 0 ;
    const dir = rnd() < 0.5 ? 1 : -1;
    cars.push({ alongX, line: (Math.floor((rnd() - 0.7) * 12)) * BLOCK - 26 + (dir > 0 ? 2.2 : -2.2), dir, off: rnd() * 800, speed: 14 + rnd() * 10 });
    const head = dir > 0;
    (rnd() < 0.5 ? hex(0xffe3b0) : hex(0xff3355)).toArray(aCol, i * 3);
    (rnd() < 0.5 ? hex(C.ink) : hex(C.violetHi)).toArray(aColB, i * 3);
  }
  geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3));
  geo.setAttribute('aColB', new THREE.InstancedBufferAttribute(aColB, 3));
  const mesh = new THREE.InstancedMesh(geo, shaderMat(`
      attribute vec3 aCol; attribute vec3 aColB; varying vec3 vC; varying vec3 vCB; varying vec3 vW;
      void main(){ vC = aCol; vCB = aColB; vec4 w = modelMatrix * instanceMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`, `
      varying vec3 vC; varying vec3 vCB; varying vec3 vW;
      void main(){ float m = palMix(vW); gl_FragColor = vec4(applyFog(mix(vC, vCB, m) * 3.0, vW, m), 1.); }`), n);
  mesh.frustumCulled = false;
  scene.add(mesh);
  scene.userData.cars = mesh;
}
const _m = new THREE.Matrix4();
function updateCars(t) {
  const mesh = scene.userData.cars;
  cars.forEach((c, i) => {
    let s = ((c.off + t * c.speed * c.dir) % 840 + 840) % 840 - 420;
    const len = 3.5 + c.speed * 0.18;
    if (c.alongX) _m.compose(v3(s, 0.7, c.line), new THREE.Quaternion(), v3(len, 0.5, 0.35));
    else _m.compose(v3(c.line, 0.7, Math.min(s - 200, 100)), new THREE.Quaternion(), v3(0.35, 0.5, len));
    mesh.setMatrixAt(i, _m);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

// ---------- a loja ----------
const shop = new THREE.Group();
const shopU = { uLit: { value: 0 } };
{
  shop.position.copy(SHOP);
  // corpo
  const body = new THREE.Mesh(new THREE.BoxGeometry(14, 6.5, 8).translate(0, 3.25, 4), shaderMat(
    `varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vN = normal; gl_Position = projectionMatrix * viewMatrix * w; }`,
    `uniform float uLit; varying vec3 vW; varying vec3 vN;
     void main(){ float m = palMix(vW); vec3 col = mix(vec3(.11,.06,.12), vec3(.09,.065,.15), m);
       col += vec3(.41,.22,.91) * uLit * .25 * max(dot(normalize(vN), vec3(0.,0.,-1.)), 0.);
       gl_FragColor = vec4(applyFog(col, vW, m), 1.); }`, shopU));
  shop.add(body);
  // vitrine
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 3.4), shaderMat(
    `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    `uniform float uLit; varying vec2 vUv; varying vec3 vW;
     void main(){ float m = palMix(vW);
       vec3 off = vec3(.03,.02,.04);
       float shelves = step(.82, fract(vUv.y * 3.0)) * .5;
       vec3 on = mix(vec3(.81,.78,.93), vec3(.95,.93,1.0), vUv.y) * (.9 + shelves) * 1.4;
       gl_FragColor = vec4(applyFog(mix(off, on, uLit), vW, m), 1.); }`, shopU));
  glass.rotation.y = Math.PI; glass.position.set(-1.6, 2.2, -0.02);
  shop.add(glass);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 3.6), glass.material);
  door.rotation.y = Math.PI; door.position.set(5.0, 1.8, -0.02);
  shop.add(door);
  // toldo
  const awn = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.35, 2.2), shaderMat(
    `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    `uniform float uLit; varying vec3 vW; void main(){ float m = palMix(vW); vec3 col = mix(vec3(.08,.05,.1), vec3(.41,.22,.91) * (.35 + uLit * .9), m);
       gl_FragColor = vec4(applyFog(col, vW, m), 1.); }`, shopU));
  awn.position.set(0, 4.25, -1.0); awn.rotation.x = -0.18;
  shop.add(awn);
  // letreiro
  const sc = document.createElement('canvas'); sc.width = 1024; sc.height = 160;
  const stex = new THREE.CanvasTexture(sc); stex.colorSpace = THREE.SRGBColorSpace;
  shop.userData.signCanvas = sc; shop.userData.signTex = stex;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.9), shaderMat(
    `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    `uniform sampler2D map; uniform float uLit; varying vec2 vUv; varying vec3 vW;
     void main(){ float m = palMix(vW); vec4 tx = texture2D(map, vUv);
       vec3 bg = mix(vec3(.05,.035,.07), vec3(.153,.098,.259), uLit);
       vec3 txt = mix(vec3(.16,.13,.2), vec3(.96,.945,1.0) * 2.2, uLit);
       vec3 col = mix(bg, txt, tx.r);
       float border = (1.0 - step(.015, vUv.x) * step(vUv.x, .985) * step(.08, vUv.y) * step(vUv.y, .92));
       col = mix(col, vec3(.545,.424,1.0) * (0.15 + uLit * 1.6), border);
       gl_FragColor = vec4(applyFog(col, vW, m), 1.); }`, { ...shopU, map: { value: stex } }));
  sign.rotation.y = Math.PI; sign.position.set(0, 5.4, -0.05);
  shop.add(sign);
  scene.add(shop);
}
function drawSign() {
  const c = shop.userData.signCanvas, g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.font = '700 92px "DM Sans"'; g.textBaseline = 'middle';
  g.letterSpacing = '-4px';
  const s = 'Padaria Vila Nova'; const w = g.measureText(s).width;
  g.fillText(s, (c.width - w) / 2, c.height / 2 + 4);
  shop.userData.signTex.needsUpdate = true;
}

// ---------- logo 3D "c." (path do codrian-icone-app.svg) ----------
const C_PATH = 'M310 12Q234 12 175.0 -22.0Q116 -56 83.0 -115.0Q50 -174 50 -250Q50 -328 83.0 -387.5Q116 -447 175.0 -481.5Q234 -516 310 -516Q407 -516 473.0 -465.0Q539 -414 557 -325H414Q405 -360 376.5 -380.0Q348 -400 309 -400Q274 -400 246.5 -382.5Q219 -365 203.5 -331.5Q188 -298 188 -252Q188 -217 197.0 -189.5Q206 -162 222.0 -142.5Q238 -123 260.5 -113.0Q283 -103 309 -103Q335 -103 356.5 -112.0Q378 -121 393.0 -137.5Q408 -154 414 -178H557Q539 -91 472.5 -39.5Q406 12 310 12Z';
const logo = new THREE.Group();
const logoInner = new THREE.Group();
let logoDot;
{
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${C_PATH}"/></svg>`);
  const shapes = data.paths[0].toShapes(true);
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 110, bevelEnabled: true, bevelThickness: 10, bevelSize: 7, bevelSegments: 3, curveSegments: 24 });
  const cMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.32, metalness: 0.15, emissive: C.ink, emissiveIntensity: 0.04 }));
  const dotGeo = new THREE.CylinderGeometry(100, 100, 110, 48); dotGeo.rotateX(Math.PI / 2); dotGeo.translate(0, 0, 55);
  logoDot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime).multiplyScalar(1.8), toneMapped: false }));
  logoDot.position.set(737, -100, 0);
  logoInner.add(cMesh, logoDot);
  // SVG: y para baixo; centraliza em x (443.5) e assenta a linha de base em y=0
  logoInner.scale.set(0.018, -0.018, 0.018);
  logoInner.position.set(443.5 * 0.018, 0, -1);
  logoInner.rotation.y = Math.PI; // face para -z (para a câmera)
  logo.add(logoInner);
  logo.position.copy(LAND);
  scene.add(logo);
  // luzes só da marca (neutras/violeta)
  scene.add(new THREE.HemisphereLight(0xcfc6ee, 0x100c1c, 0.6));
  const key = new THREE.DirectionalLight(0xf4f1ff, 1.0); key.position.set(-30, 40, -60); scene.add(key);
  const rim = new THREE.PointLight(0x8b6cff, 4000, 200, 2); rim.position.set(20, 25, 30); scene.add(rim);
  const rim2 = new THREE.PointLight(0x6938e8, 3000, 120, 2); rim2.position.set(-6, 82, 20); scene.add(rim2);
}
// feixe de queda + anéis de impacto
const fallBeam = new THREE.Mesh(new THREE.PlaneGeometry(6, 140), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uO: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
  fragmentShader: 'uniform float uO; varying vec2 vUv; void main(){ float a = (1.0 - abs(vUv.x - .5) * 2.0); a = a*a; a *= smoothstep(1.0, .0, vUv.y); gl_FragColor = vec4(vec3(.545,.424,1.0) * 1.6 * a * uO, 1.); }',
}));
scene.add(fallBeam);
function ringMesh(color) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.2), transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.rotation.x = -Math.PI / 2; m.position.set(LAND.x, 0.15, LAND.z); scene.add(m); return m;
}
const ringA = ringMesh(C.lime), ringB = ringMesh(C.violetHi);

// ---------- celular 3D ----------
const phone = new THREE.Group();
const SCR_W = 840, SCR_H = 1800;
const screenCanvas = document.createElement('canvas'); screenCanvas.width = SCR_W; screenCanvas.height = SCR_H;
const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
{
  const bw = 3.3, bh = 6.9, bd = 0.34;
  const body = new THREE.Mesh(new RoundedBoxGeometry(bw, bh, bd, 6, 0.42), new THREE.MeshStandardMaterial({ color: C.deep, roughness: 0.3, metalness: 0.55 }));
  const outline = new THREE.Mesh(new RoundedBoxGeometry(bw + 0.07, bh + 0.07, bd + 0.07, 6, 0.45), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.violetHi).multiplyScalar(1.2), side: THREE.BackSide, toneMapped: false }));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.22, (bw - 0.22) * SCR_H / SCR_W), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
  screen.position.z = bd / 2 + 0.006;
  phone.add(outline, body, screen);
  phone.position.copy(PHONE);
  phone.rotation.y = Math.PI; // tela voltada para -z
  phone.visible = false;
  scene.add(phone);
}
// ícones flutuantes (linha, estilo "painéis em fio")
function iconTexture(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.lineWidth = 11; g.lineJoin = 'round'; g.lineCap = 'round'; draw(g);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const VH = '#8b6cff', INK = '#f4f1ff';
const icons = [
  { // WhatsApp: balão com fone (em linha)
    tex: iconTexture(g => { g.strokeStyle = VH; g.beginPath(); g.arc(128, 122, 82, 0.15 * Math.PI, 2.62 * Math.PI * 0.83 + 0.1); g.stroke();
      g.beginPath(); g.moveTo(66, 176); g.lineTo(48, 222); g.lineTo(98, 204); g.stroke();
      g.strokeStyle = INK; g.beginPath(); g.moveTo(98, 92); g.quadraticCurveTo(96, 150, 160, 160); g.stroke();
      g.beginPath(); g.moveTo(92, 86); g.lineTo(108, 82); g.lineTo(116, 104); g.lineTo(104, 112); g.stroke();
      g.beginPath(); g.moveTo(150, 150); g.lineTo(158, 138); g.lineTo(178, 148); g.lineTo(172, 164); g.stroke(); }),
    pos: v3(-2.6, -1.9, 0.6), size: 1.55, t0: 19.2,
  },
  { // pin de mapa
    tex: iconTexture(g => { g.strokeStyle = VH; g.beginPath(); g.moveTo(128, 232); g.bezierCurveTo(60, 150, 50, 120, 50, 98); g.arc(128, 98, 78, Math.PI, 0); g.bezierCurveTo(206, 120, 196, 150, 128, 232); g.stroke();
      g.strokeStyle = INK; g.beginPath(); g.arc(128, 98, 26, 0, Math.PI * 2); g.stroke(); }),
    pos: v3(2.55, 0.4, 0.5), size: 1.5, t0: 18.6,
  },
  ...[0, 1, 2].map(i => ({
    tex: iconTexture(g => { g.strokeStyle = i === 1 ? INK : VH; g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 44 : 104; const a = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(128 + Math.cos(a) * r, 136 + Math.sin(a) * r); } g.closePath(); g.stroke(); }),
    pos: v3(-2.4 + i * 0.95, 3.0 + (i === 1 ? 0.45 : 0), 0.7), size: 0.95, t0: 17.6 + i * 0.12,
  })),
];
icons.forEach(ic => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ic.tex, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, opacity: 0 }));
  m.material.color.setScalar(1.5);
  ic.mesh = m; phone.add(m);
});

// ---------- faróis lima da cena 5 ----------
const beacons = [];
{
  const picks = buildings.filter(b => b.h > 10 && b.h < 70 && Math.abs(b.x) < 300 && b.z > -380).sort((a, b) => (a.x * 13 + a.z * 7) % 17 - (b.x * 13 + b.z * 7) % 17);
  const chosen = [{ x: SHOP.x, z: SHOP.z + 4, h: 7, shop: true }];
  for (const b of picks) { if (chosen.length >= 11) break; if (chosen.every(c => Math.hypot(c.x - b.x, c.z - b.z) > 85)) chosen.push(b); }
  chosen.forEach((b, i) => {
    const g = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 120, 12, 1, true).translate(0, 60, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime).multiplyScalar(0.9), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(2.2, 20, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime).multiplyScalar(2.2), toneMapped: false }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.lime).multiplyScalar(2), transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.3;
    g.add(beam, dot, ring); g.position.set(b.x, b.h + 0.5, b.z); g.visible = false;
    scene.add(g);
    beacons.push({ g, beam, dot, ring, t0: 24.5 + i * 0.32, x: b.x, z: b.z });
  });
}

// ---------- câmera: planos e cortes ----------
const shots = [
  { a: 0.0, b: 1.5, p0: v3(-230, 150, -330), p1: v3(-150, 118, -230), l0: v3(0, 10, 120), l1: v3(20, 5, 140), fov: 58, ease: x => x },
  { a: 1.5, b: 2.7, p0: v3(-26, 9, -260), p1: v3(-26, 7, -150), l0: v3(-24, 6, -120), l1: v3(-23, 5, -20), fov: 66, ease: x => x, roll: 0.03 },
  { a: 2.7, b: 4.0, orbit: { c: v3(60, 0, -150), r: 175, y0: 110, y1: 95, a0: -2.2, a1: -1.55 }, look: v3(40, 30, -60), fov: 56 },
  { a: 4.0, b: 6.6, p0: v3(-70, 120, -70), p1: v3(-4, 9, -12), l0: v3(0, 0, 40), l1: v3(0, 4.5, 32), fov: 56, ease: inOut },
  { a: 6.6, b: 9.0, p0: v3(1.5, 2.4, -6), p1: v3(0.6, 2.8, 4), l0: v3(0, 5.6, 32), l1: v3(0, 5.2, 32), fov: 52, ease: outCubic, punch: 7.25 },
  { a: 9.0, b: 10.6, p0: v3(-27, 2.6, -40), p1: v3(-26, 3.2, -30), l0: v3(-16, 18, 6), l1: v3(-16, 6, 6), fov: 58, ease: inOut, logoCam: true },
  { a: 10.6, b: 12.4, p0: v3(-150, 150, -170), p1: v3(-175, 185, -205), l0: v3(0, 0, 20), l1: v3(0, 0, 20), fov: 62, ease: x => x },
  { a: 12.4, b: 15.0, orbit: { c: v3(-4, 0, 12), r: 27, y0: 4.0, y1: 6.0, a0: -1.0, a1: -1.55 }, look: v3(-5, 4.2, 26), fov: 60 },
  { a: 15.0, b: 19.5, orbit: { c: PHONE, r: 12.6, y0: 1.4, y1: 0.6, a0: -1.95, a1: -1.48 }, look: PHONE.clone().add(v3(0, -1.5, 0)), fov: 50, phone: true },
  { a: 19.5, b: 24.0, orbit: { c: PHONE, r: 12.4, y0: -0.4, y1: 0.4, a0: -1.42, a1: -1.15 }, look: PHONE.clone().add(v3(0, -1.4, 0)), fov: 50, phone: true },
  { a: 24.0, b: 28.6, p0: v3(-8, 14, -6), p1: v3(-170, 330, -330), l0: v3(0, 4, 30), l1: v3(0, 0, -20), fov: 56, ease: inOut },
  { a: 28.6, b: 32.1, p0: v3(-170, 330, -330), p1: v3(-175, 340, -340), l0: v3(0, 0, -20), l1: v3(0, 0, -20), fov: 56, ease: x => x },
];
const CUTS = [1.5, 2.7, 4.0, 9.0, 10.6, 12.4, 15.0, 19.5, 24.0];
function cameraAt(t) {
  const s = shots.find(s => t >= s.a && t < s.b) || shots[shots.length - 1];
  const k = prog(t, s.a, s.b);
  let pos, look;
  if (s.orbit) {
    const o = s.orbit, kk = inOut(k);
    const ang = lerp(o.a0, o.a1, kk);
    pos = v3(o.c.x + Math.cos(ang) * o.r, o.c.y + lerp(o.y0, o.y1, kk), o.c.z + Math.sin(ang) * o.r);
    look = s.look.clone();
  } else {
    const e = s.ease(k);
    pos = s.p0.clone().lerp(s.p1, e); look = s.l0.clone().lerp(s.l1, e);
  }
  if (s.logoCam) { // segue o logo caindo
    look = v3(LAND.x, Math.max(logo.position.y + 4.5, 5), LAND.z);
  }
  let fov = s.fov;
  if (s.punch) { const p = t - s.punch; if (p > 0) fov -= 7 * outExpo(clamp01(p / 0.5)); }
  // tremor do impacto
  const ti = t - T_IMPACT;
  if (ti > 0 && ti < 0.45) { const a = (1 - ti / 0.45) * 0.7; pos.x += Math.sin(ti * 90) * a; pos.y += Math.cos(ti * 77) * a; }
  // respiração (câmera na mão)
  pos.x += Math.sin(t * 1.3) * 0.25; pos.y += Math.sin(t * 1.7 + 1) * 0.18;
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.lookAt(look);
  if (s.roll) camera.rotateZ(Math.sin(k * 3.1) * s.roll);
  return s;
}

// ---------- HUD: minimapa ----------
const hud = document.getElementById('hudc'), hg = hud.getContext('2d');
const POIS = (() => { const r = mulberry32(7); const out = []; for (let i = 0; i < 22; i++) out.push({ x: (r() - .5) * 640, z: -420 + r() * 520, ph: r() * 6.28 }); return out; })();
function drawHUD(t, opts) {
  const S = 2, R = 160 * S, cx = 170 * S, cy = 170 * S;
  hg.clearRect(0, 0, hud.width, hud.height);
  hg.globalAlpha = opts.alpha; if (opts.alpha <= 0) return;
  const scale = opts.scale * S;                         // px por metro
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
  const yaw = Math.atan2(fwd.x, fwd.z);
  const center = opts.center;
  const toMap = (x, z) => { const dx = x - center.x, dz = z - center.z; const c = Math.cos(yaw), s = Math.sin(yaw); const rx = dx * c - dz * s, rz = dx * s + dz * c; return [cx - rx * scale, cy - rz * scale]; };
  hg.save();
  hg.beginPath(); hg.arc(cx, cy, R, 0, Math.PI * 2); hg.closePath();
  hg.fillStyle = 'rgba(16,12,28,.86)'; hg.fill();
  hg.clip();
  // água
  hg.fillStyle = 'rgba(39,25,66,.95)';
  { const pts = [[-2000, 112], [2000, 112], [2000, 3000], [-2000, 3000]].map(([x, z]) => toMap(x, z)); hg.beginPath(); pts.forEach((p, i) => i ? hg.lineTo(...p) : hg.moveTo(...p)); hg.fill(); }
  // quarteirões
  hg.fillStyle = 'rgba(39,25,66,.9)';
  for (let i = -8; i <= 8; i++) for (let j = -9; j <= 1; j++) {
    if (i === 0 && j === 0) continue;
    const pts = [[-20, -20], [20, -20], [20, 20], [-20, 20]].map(([a, b]) => toMap(i * BLOCK + a, j * BLOCK + b));
    hg.beginPath(); pts.forEach((p, k) => k ? hg.lineTo(...p) : hg.moveTo(...p)); hg.closePath(); hg.fill();
  }
  // ruas (linhas violeta)
  hg.strokeStyle = 'rgba(105,56,232,.55)'; hg.lineWidth = 2.2 * S;
  for (let i = -9; i <= 9; i++) { const x = i * BLOCK - 26; const a = toMap(x, -700), b = toMap(x, 110); hg.beginPath(); hg.moveTo(...a); hg.lineTo(...b); hg.stroke(); }
  for (let j = -10; j <= 2; j++) { const z = j * BLOCK - 26; const a = toMap(-700, z), b = toMap(700, z); hg.beginPath(); hg.moveTo(...a); hg.lineTo(...b); hg.stroke(); }
  // pontos de todo mundo (violet-hi 55%)
  if (opts.pois > 0) {
    POIS.forEach(p => { const [x, y] = toMap(p.x, p.z); const pulse = 0.6 + 0.4 * Math.sin(t * 5 + p.ph);
      hg.globalAlpha = opts.alpha * opts.pois * 0.55; hg.fillStyle = '#8b6cff'; hg.beginPath(); hg.arc(x, y, 7 * S, 0, 7); hg.fill();
      hg.globalAlpha = opts.alpha * opts.pois * 0.3 * pulse; hg.strokeStyle = '#8b6cff'; hg.lineWidth = 1.5 * S; hg.beginPath(); hg.arc(x, y, (9 + 6 * (1 - pulse)) * S, 0, 7); hg.stroke(); });
    hg.globalAlpha = opts.alpha;
  }
  const [sx, sy] = toMap(SHOP.x, SHOP.z);
  // loja ausente: anel tracejado vazio
  if (opts.missing > 0) {
    hg.globalAlpha = opts.alpha * opts.missing * (0.55 + 0.45 * (Math.sin(t * 9) > 0 ? 1 : 0.2));
    hg.setLineDash([5 * S, 5 * S]); hg.strokeStyle = '#8e83b8'; hg.lineWidth = 2 * S; hg.beginPath(); hg.arc(sx, sy, 15 * S, 0, 7); hg.stroke(); hg.setLineDash([]);
    hg.globalAlpha = opts.alpha;
  }
  // faíscas lima
  const pings = [];
  if (opts.shopPing > 0) pings.push({ x: sx, y: sy, k: opts.shopPing, big: true });
  (opts.extra || []).forEach(e => { const [x, y] = toMap(e.x, e.z); pings.push({ x, y, k: e.k }); });
  pings.forEach(p => {
    const r0 = (p.big ? 7 : 5) * S * outExpo(clamp01(p.k * 3));
    hg.save(); hg.shadowColor = 'rgba(183,255,74,.7)'; hg.shadowBlur = 18 * S;
    hg.fillStyle = '#b7ff4a'; hg.beginPath(); hg.arc(p.x, p.y, r0, 0, 7); hg.fill(); hg.restore();
    for (let q = 0; q < 2; q++) { const ph = ((t * 0.9 + q * 0.5) % 1); hg.globalAlpha = opts.alpha * (1 - ph) * (q ? .7 : 1) * clamp01(p.k * 3);
      hg.strokeStyle = q ? '#8b6cff' : '#b7ff4a'; hg.lineWidth = 2 * S; hg.beginPath(); hg.arc(p.x, p.y, r0 + ph * 26 * S, 0, 7); hg.stroke(); }
    hg.globalAlpha = opts.alpha;
  });
  hg.restore();
  // jogador (seta ink no centro)
  hg.fillStyle = '#f4f1ff'; hg.beginPath(); hg.moveTo(cx, cy - 13 * S); hg.lineTo(cx + 9 * S, cy + 9 * S); hg.lineTo(cx, cy + 4 * S); hg.lineTo(cx - 9 * S, cy + 9 * S); hg.closePath(); hg.fill();
  // borda (line) + anel externo
  hg.strokeStyle = 'rgba(139,108,255,.25)'; hg.lineWidth = 3 * S; hg.beginPath(); hg.arc(cx, cy, R - 1.5 * S, 0, 7); hg.stroke();
  hg.strokeStyle = 'rgba(139,108,255,.6)'; hg.lineWidth = 1.5 * S; hg.beginPath(); hg.arc(cx, cy, R + 6 * S, -0.35, 0.35); hg.stroke(); hg.beginPath(); hg.arc(cx, cy, R + 6 * S, Math.PI - 0.35, Math.PI + 0.35); hg.stroke();
  // N
  hg.font = `${20 * S}px Silkscreen`; hg.fillStyle = '#8e83b8'; hg.textAlign = 'center'; hg.textBaseline = 'middle';
  const nAng = -yaw + Math.PI; hg.fillText('N', cx + Math.sin(nAng) * (R - 22 * S) * -1, cy - Math.cos(nAng) * (R - 22 * S) * -1);
  // rótulo HUD
  hg.textAlign = 'left'; hg.font = `${24 * S}px Silkscreen`; hg.fillStyle = '#8e83b8';
  hg.fillText(opts.label, 6 * S, (340 + 34) * S);
  // etiqueta "SUA EMPRESA"
  if (opts.tag > 0) {
    const e = outExpo(clamp01(opts.tag));
    hg.globalAlpha = opts.alpha * e;
    hg.font = `${24 * S}px Silkscreen`; const txt = 'SUA EMPRESA'; const tw = hg.measureText(txt).width;
    const bx = Math.min(sx + 18 * S, 330 * S - tw - 28 * S), by = sy - 52 * S + (1 - e) * 10 * S;
    hg.fillStyle = 'rgba(16,12,28,.85)'; roundRect(hg, bx, by, tw + 28 * S, 40 * S, 8 * S); hg.fill();
    hg.strokeStyle = 'rgba(183,255,74,.5)'; hg.lineWidth = 1.5 * S; roundRect(hg, bx, by, tw + 28 * S, 40 * S, 8 * S); hg.stroke();
    hg.fillStyle = '#f4f1ff'; hg.textBaseline = 'middle'; hg.fillText(txt, bx + 14 * S, by + 21 * S);
    hg.globalAlpha = opts.alpha;
  }
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------- tela do celular: o site sendo montado ----------
function drawScreen(tp) {
  const g = screenCanvas.getContext('2d'), w = SCR_W, h = SCR_H, M = 56;
  g.fillStyle = '#100c1c'; g.fillRect(0, 0, w, h);
  // brilho violeta
  const gr = g.createRadialGradient(w * 0.7, 380, 10, w * 0.7, 380, 700); gr.addColorStop(0, 'rgba(105,56,232,.45)'); gr.addColorStop(1, 'rgba(105,56,232,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // barra de status
  g.fillStyle = '#cfc6ee'; g.font = '500 30px "DM Sans"'; g.textBaseline = 'middle'; g.fillText('18:47', M, 54);
  g.fillRect(w - M - 52, 42, 46, 22); g.fillRect(w - M - 120, 50, 8, 14); g.fillRect(w - M - 106, 45, 8, 19); g.fillRect(w - M - 92, 40, 8, 24);
  const block = (t0, y, hh, fn) => {
    const sk = clamp01((tp - t0 + 0.35) / 0.35);      // esqueleto
    const k = outExpo(clamp01((tp - t0) / 0.5));       // conteúdo
    if (sk <= 0) return;
    if (k < 1) { g.globalAlpha = sk * (1 - k); g.fillStyle = '#271942'; roundRect(g, M, y, w - 2 * M, hh, 22); g.fill();
      const sh = ((tp * 1.6) % 1) * (w + 400) - 200; const lg = g.createLinearGradient(sh - 120, 0, sh + 120, 0); lg.addColorStop(0, 'rgba(139,108,255,0)'); lg.addColorStop(.5, 'rgba(139,108,255,.22)'); lg.addColorStop(1, 'rgba(139,108,255,0)'); g.fillStyle = lg; roundRect(g, M, y, w - 2 * M, hh, 22); g.fill(); }
    if (k > 0) { g.save(); g.globalAlpha = k; g.translate(0, (1 - k) * 40); fn(); g.restore(); }
    g.globalAlpha = 1;
  };
  // cabeçalho
  block(0.4, 110, 90, () => {
    g.fillStyle = '#f4f1ff'; g.font = '700 46px "DM Sans"'; g.letterSpacing = '-2px'; g.fillText('Padaria Vila Nova', M, 156); g.letterSpacing = '0px';
    g.fillStyle = '#cfc6ee'; for (let i = 0; i < 3; i++) g.fillRect(w - M - 48, 140 + i * 14, 48, 5);
  });
  // imagem (painel em fio)
  block(1.0, 230, 430, () => {
    g.fillStyle = '#271942'; roundRect(g, M, 230, w - 2 * M, 430, 22); g.fill();
    g.strokeStyle = 'rgba(139,108,255,.25)'; g.lineWidth = 2; roundRect(g, M, 230, w - 2 * M, 430, 22); g.stroke();
    g.strokeStyle = '#8b6cff'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.ellipse(w / 2, 470, 210, 105, 0, Math.PI, 0); g.lineTo(w / 2 + 210, 520); g.lineTo(w / 2 - 210, 520); g.closePath(); g.stroke();
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(w / 2 + i * 70 - 22, 420 + Math.abs(i) * 14); g.lineTo(w / 2 + i * 70 + 22, 395 + Math.abs(i) * 14); g.stroke(); }
    g.strokeStyle = '#cfc6ee'; g.lineWidth = 4; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(w / 2 - 60 + i * 60, 330); g.quadraticCurveTo(w / 2 - 40 + i * 60, 300, w / 2 - 60 + i * 60, 270); g.stroke(); }
  });
  // título digitando
  if (tp > 1.7) {
    const full = 'Pão quentinho todo dia, aqui na esquina.';
    const n = Math.floor(clamp01((tp - 1.7) / 1.2) * full.length);
    const txt = full.slice(0, n);
    g.fillStyle = '#f4f1ff'; g.font = '700 74px "DM Sans"'; g.letterSpacing = '-3.3px';
    const words = txt.split(' '); let line = '', y = 760; const lines = [];
    for (const wd of words) { const test = line ? line + ' ' + wd : wd; if (g.measureText(test).width > w - 2 * M) { lines.push(line); line = wd; } else line = test; }
    lines.push(line);
    lines.forEach((l, i) => g.fillText(l, M, y + i * 78));
    g.letterSpacing = '0px';
    if (n < full.length || Math.floor(tp * 2.5) % 2 === 0) { const last = lines[lines.length - 1]; g.font = '700 74px "DM Sans"'; g.letterSpacing = '-3.3px'; const lw = g.measureText(last).width; g.letterSpacing = '0px'; g.fillStyle = '#8b6cff'; g.fillRect(M + lw + 8, y + (lines.length - 1) * 78 - 36, 6, 72); }
  }
  // estrelas
  block(3.0, 1010, 70, () => {
    for (let i = 0; i < 5; i++) { const fill = clamp01((tp - 3.1 - i * 0.12) / 0.2); const x = M + 30 + i * 62, y = 1045;
      g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 11 : 26; const a = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath();
      g.strokeStyle = '#8b6cff'; g.lineWidth = 3; g.stroke(); g.globalAlpha *= 1; g.fillStyle = `rgba(244,241,255,${fill})`; g.fill(); }
    g.fillStyle = '#cfc6ee'; g.font = '500 32px "DM Sans"'; g.fillText('Avaliações no Google', M + 340, 1047);
  });
  // mapa
  block(3.6, 1110, 300, () => {
    g.fillStyle = '#271942'; roundRect(g, M, 1110, w - 2 * M, 300, 22); g.fill();
    g.save(); roundRect(g, M, 1110, w - 2 * M, 300, 22); g.clip();
    g.strokeStyle = 'rgba(105,56,232,.6)'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(M + i * 150 - 40, 1110); g.lineTo(M + i * 150 + 40, 1410); g.stroke(); }
    for (let j = 0; j < 3; j++) { g.beginPath(); g.moveTo(M, 1150 + j * 110); g.lineTo(w - M, 1130 + j * 110); g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(139,108,255,.25)'; g.lineWidth = 2; roundRect(g, M, 1110, w - 2 * M, 300, 22); g.stroke();
    const px = w / 2 + 40, py = 1250; g.strokeStyle = '#8b6cff'; g.lineWidth = 6; g.beginPath(); g.moveTo(px, py + 60); g.bezierCurveTo(px - 40, py + 10, px - 42, py - 6, px - 42, py - 20); g.arc(px, py - 20, 42, Math.PI, 0); g.bezierCurveTo(px + 42, py - 6, px + 40, py + 10, px, py + 60); g.stroke();
    g.fillStyle = '#f4f1ff'; g.beginPath(); g.arc(px, py - 20, 13, 0, 7); g.fill();
    g.fillStyle = '#f4f1ff'; g.font = '700 34px "DM Sans"'; g.fillText('Como chegar', M + 30, 1375);
  });
  // botão lima (a faísca da cena)
  block(4.3, 1450, 120, () => {
    g.fillStyle = '#b7ff4a'; roundRect(g, M, 1450, w - 2 * M, 120, 60); g.fill();
    g.fillStyle = '#100c1c'; g.font = '700 44px "DM Sans"'; g.letterSpacing = '-1px'; const s = 'Chame no WhatsApp'; const tw = g.measureText(s).width; g.fillText(s, (w - tw) / 2, 1512); g.letterSpacing = '0px';
  });
  // selo "feito pela codrian."
  block(5.1, 1620, 70, () => {
    g.font = '500 28px "DM Sans"'; const a = 'feito pela'; const aw = g.measureText(a).width;
    g.font = '700 30px "DM Sans"'; g.letterSpacing = '-1.3px'; const b = 'codrian'; const bw2 = g.measureText(b).width; g.letterSpacing = '0px';
    const pw = aw + bw2 + 70, px = (w - pw) / 2;
    g.strokeStyle = 'rgba(207,198,238,.5)'; g.lineWidth = 2; roundRect(g, px, 1622, pw, 62, 31); g.stroke();
    g.fillStyle = '#cfc6ee'; g.font = '500 28px "DM Sans"'; g.fillText(a, px + 24, 1654);
    g.font = '700 30px "DM Sans"'; g.letterSpacing = '-1.3px'; g.fillText(b, px + 34 + aw, 1654); g.letterSpacing = '0px';
    g.beginPath(); g.arc(px + 34 + aw + bw2 + 9, 1662, 5, 0, 7); g.fill();
  });
  screenTex.needsUpdate = true;
}

// ---------- DOM: títulos, transições, encerramento ----------
const $ = id => document.getElementById(id);
const titles = [
  { el: $('t1'), a: 0.25, b: 3.85 },
  { el: $('t2'), a: 6.75, b: 8.9 },
  { el: $('t3'), a: 11.2, b: 14.85 },
  { el: $('t4'), a: 16.0, b: 23.85 },
];
function updateTitle(T, t) {
  const lines = [...T.el.querySelectorAll('.ln')];
  const out = clamp01((t - T.b) / 0.22);
  T.el.style.visibility = (t >= T.a && t < T.b + 0.25) ? 'visible' : 'hidden';
  lines.forEach((ln, i) => {
    const k = outCubic(clamp01((t - T.a - i * (T.el.id === 't4' ? 0.6 : 0.16)) / 0.85));
    const lh = parseFloat(T.el.style.fontSize) * 1.02;
    ln.style.opacity = (k * (1 - out)).toFixed(3);
    ln.style.transform = `translateY(${((1 - k) * 0.7 * lh).toFixed(1)}px)`;
    ln.style.filter = `blur(${((1 - k) * 6 + out * 8).toFixed(2)}px)`;
  });
}
const scrim = $('scrim');
function updateScrim(t) {
  // escurece a faixa do texto para manter ink sobre fundo escuro (contraste do brand book)
  let a = 0, top = 780, bot = 1320;
  if (t < 4.0) a = 1;
  if (t > 11 && t < 15) { a = 1; top = 1250; bot = 1650; }
  if (t > 6.6 && t < 9) { a = smooth(6.6, 6.9, t); top = 1250; bot = 1580; }
  if (t >= 15 && t < 24) { a = 1; top = 1240; bot = 1720; }
  scrim.style.opacity = a;
  scrim.style.background = `linear-gradient(180deg, rgba(16,12,28,0) ${top - 260}px, rgba(16,12,28,.72) ${top}px, rgba(16,12,28,.72) ${bot}px, rgba(16,12,28,0) ${bot + 220}px)`;
}
const beamsEl = $('beams'), beamBars = [...beamsEl.querySelectorAll('i')];
function updateBeams(t) {
  let best = 1e9, c0 = 0; for (const c of CUTS) { const d = t - c; if (d > -0.18 && d < 0.32 && Math.abs(d) < Math.abs(best)) { best = d; c0 = c; } }
  if (best > 1e8) { beamsEl.style.opacity = 0; return; }
  const k = (best + 0.18) / 0.5;
  beamsEl.style.opacity = (Math.sin(k * Math.PI)).toFixed(3);
  beamBars.forEach((b, i) => { b.style.transform = `translateX(${((k - 0.5) * 900 * (i % 2 ? -1 : 1)).toFixed(0)}px) skewX(-18deg)`; });
}
const flashEl = $('flash');
const endEl = $('end'), handleEl = $('handle'), logoSvg = $('logo');
// wordmark (codrian-logo-negativo.svg): letras em curvas
const WORD = [];
async function buildWordmark() {
  const txt = await (await fetch('assets/codrian-logo-negativo.svg')).text();
  const d = txt.match(/<path d="([^"]+)"/)[1];
  const parts = d.split(' M').map((p, i) => (i ? 'M' : '') + p); // c, o, d, r, i, a, n
  const NS = 'http://www.w3.org/2000/svg';
  parts.forEach(p => { const el = document.createElementNS(NS, 'path'); el.setAttribute('d', p); el.setAttribute('fill', '#F4F1FF'); logoSvg.appendChild(el); WORD.push(el); });
  const rings = document.createElementNS(NS, 'g'); logoSvg.appendChild(rings);
  ['#B7FF4A', '#8B6CFF'].forEach(col => { const r = document.createElementNS(NS, 'circle'); r.setAttribute('cx', 3643); r.setAttribute('cy', -100); r.setAttribute('r', 100); r.setAttribute('fill', 'none'); r.setAttribute('stroke', col); r.setAttribute('stroke-width', 14); rings.appendChild(r); });
  const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('cx', 3643); dot.setAttribute('cy', -100); dot.setAttribute('r', 100); dot.setAttribute('fill', '#B7FF4A');
  dot.style.filter = 'drop-shadow(0 0 60px rgba(183,255,74,.45))';
  logoSvg.appendChild(dot);
  logoSvg.userData = { dot, rings: [...rings.children] };
}
const END_IMPACT = 29.35;
function updateEnd(t) {
  const a = smooth(28.45, 28.85, t);
  endEl.style.opacity = a.toFixed(3);
  if (a <= 0) return;
  const { dot, rings } = logoSvg.userData;
  // ponto: 15% -> 90% antes do impacto; oscila depois
  let sc;
  if (t < END_IMPACT) sc = lerp(0.15, 0.9, inOut(prog(t, 28.75, END_IMPACT)));
  else { const ti = t - END_IMPACT; sc = 1 + 0.28 * Math.exp(-7 * ti) * Math.cos(14 * ti); }
  dot.setAttribute('r', (100 * sc).toFixed(2));
  rings.forEach((r, i) => { const ti = t - END_IMPACT - i * 0.12; const k = clamp01(ti / 1.1); r.setAttribute('r', (100 * (1 + 8 * outExpo(k))).toFixed(1)); r.setAttribute('opacity', ti > 0 ? (1 - k).toFixed(3) : 0); });
  // letras nascem do ponto, da direita para a esquerda (85ms entre elas, 950ms cada)
  const em = 1000;
  WORD.forEach((el, i) => { const order = WORD.length - 1 - i; const k = outExpo(clamp01((t - END_IMPACT - 0.08 - order * 0.085) / 0.95));
    el.style.opacity = k.toFixed(3); el.style.transform = `translate(${((1 - k) * 0.5 * em).toFixed(1)}px, ${((1 - k) * 0.1 * em).toFixed(1)}px)`; el.style.filter = `blur(${((1 - k) * 14 * 4.4).toFixed(1)}px)`; });
  // @handle sobe (out-cubic, 850ms, desfoque 6px)
  const hk = outCubic(clamp01((t - 30.75) / 0.85));
  handleEl.style.opacity = hk.toFixed(3); handleEl.style.transform = `translateY(${((1 - hk) * 0.7 * 52).toFixed(1)}px)`; handleEl.style.filter = `blur(${((1 - hk) * 6).toFixed(2)}px)`;
  // flash lima do impacto (50%, 220ms)
}
const grain = $('grain'), gg = grain.getContext('2d'); const grainImg = gg.createImageData(540, 960);
function updateGrain(frame) {
  const r = mulberry32(frame * 9973 + 1); const d = grainImg.data;
  for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  gg.putImageData(grainImg, 0, 0);
}

// ---------- quadro ----------
function renderFrame(t, frame) {
  U.uTime.value = t;
  // troca de paleta: onda a partir do impacto
  const wk = prog(t, T_IMPACT, T_IMPACT + 3.0);
  U.uWaveR.value = t < T_IMPACT ? -100 : lerp(0, 1100, inOut(wk) * 0.6 + wk * 0.4);
  U.uGlobal.value = smooth(T_IMPACT + 2.6, T_IMPACT + 3.2, t);
  U.uSky.value = smooth(T_IMPACT + 0.3, T_IMPACT + 2.2, t);
  bloom.strength = 0.7 + (t > 15 && t < 24 ? -0.15 : 0);

  // logo: cai do céu
  if (t < 9.0) { logo.visible = false; }
  else {
    logo.visible = true;
    const fk = prog(t, 9.0, T_IMPACT);
    logo.position.y = t < T_IMPACT ? lerp(75, 0, inCubic(fk)) : 0;
    logo.rotation.x = t < T_IMPACT ? -0.55 * (1 - inCubic(fk)) : 0;
    const ti = t - T_IMPACT;
    const sq = ti > 0 && ti < 0.5 ? 1 - 0.12 * Math.exp(-9 * ti) * Math.cos(18 * ti) : 1;
    logo.scale.set(1 / Math.sqrt(sq), sq, 1);
    const ds = ti > 0 ? 1 + 0.28 * Math.exp(-7 * ti) * Math.cos(14 * ti) : 1;
    logoDot.scale.set(ds, ds, 1);
    logoDot.material.color.copy(new THREE.Color(C.lime).multiplyScalar(1.8 + (ti > 0 ? 2.5 * Math.exp(-8 * ti) : 0)));
  }
  fallBeam.visible = t > 9.0 && t < T_IMPACT + 0.3;
  fallBeam.position.set(LAND.x, logo.position.y + 75, LAND.z + 0.5);
  fallBeam.lookAt(camera.position.x, fallBeam.position.y, camera.position.z);
  fallBeam.material.uniforms.uO.value = t < T_IMPACT ? smooth(9.0, 9.4, t) : 1 - prog(t, T_IMPACT, T_IMPACT + 0.3);
  [ringA, ringB].forEach((r, i) => { const ti = t - T_IMPACT - i * 0.12; const k = clamp01(ti / 1.2); const s = 4 * (1 + 8 * outExpo(k)); r.scale.set(s, s, s); r.material.opacity = ti > 0 ? (1 - k) : 0; });

  // loja acende
  shopU.uLit.value = smooth(11.0, 11.9, t) * (0.92 + 0.08 * Math.sin(t * 40) * (t < 12 ? 1 : 0));

  // celular
  const shot = cameraAt(t);
  phone.visible = !!shot.phone;
  if (phone.visible) {
    const tp = t - 15.0;
    phone.position.set(PHONE.x, PHONE.y + Math.sin(t * 1.4) * 0.12, PHONE.z);
    phone.rotation.set(Math.sin(t * 0.9) * 0.04, Math.PI + Math.sin(t * 0.6) * 0.06, Math.sin(t * 0.7) * 0.03);
    drawScreen(tp);
    icons.forEach((ic, i) => { const k = outExpo(clamp01((t - ic.t0) / 0.6)); ic.mesh.material.opacity = k;
      const s = ic.size * (0.6 + 0.4 * k); ic.mesh.scale.set(s, s, s);
      ic.mesh.position.set(ic.pos.x, ic.pos.y + Math.sin(t * 1.6 + i) * 0.08 + (1 - k) * -0.4, ic.pos.z);
      ic.mesh.rotation.set(0, Math.sin(t * 0.8 + i) * 0.35, 0); });
  }

  // faróis
  beacons.forEach(b => { const k = t - b.t0; b.g.visible = t > 24 && k > 0;
    if (!b.g.visible) return;
    const e = outExpo(clamp01(k / 0.6)); b.dot.scale.setScalar(e * (b.g.position.y < 10 ? 0.8 : 1.6)); b.beam.material.opacity = 0.35 * e;
    b.beam.scale.set(1, e, 1); const ph = (k * 0.8) % 1; b.ring.scale.setScalar(2 + ph * 26); b.ring.material.opacity = (1 - ph) * 0.8 * e; });

  updateCars(t);
  composer.render();

  // HUD
  const hudVisible = t < 15 || (t >= 24 && t < 28.6);
  const hudA = t < 15 ? smooth(0.05, 0.4, t) * (1 - smooth(14.7, 15, t)) : smooth(24.0, 24.35, t) * (1 - smooth(28.3, 28.6, t));
  if (hudVisible || hudA > 0) {
    drawHUD(t, {
      alpha: hudA, center: t >= 4 && t < 15 ? v3(SHOP.x, 0, SHOP.z - 10) : camera.position, scale: t >= 24 ? lerp(0.55, 0.32, inOut(prog(t, 24, 27))) : (t >= 4 ? 0.9 : 0.42),
      pois: t < 4 ? 1 : (t < 9 ? 1 - smooth(4.0, 4.6, t) * 0.5 : 0.5),
      missing: (t > 6.6 && t < 12.6) ? smooth(6.6, 6.9, t) * (1 - smooth(12.4, 12.6, t)) : 0,
      shopPing: t >= 24 ? 1 : (t > 12.6 ? (t - 12.6) : 0),
      tag: t > 13.0 && t < 15 ? (t - 13.0) / 0.6 : 0,
      extra: t >= 24 ? beacons.slice(1).map(b => ({ x: b.x, z: b.z, k: clamp01(t - b.t0) })).filter(b => b.k > 0) : [],
      label: t < 9 ? 'RADAR' : (t < 15 ? 'RADAR · NO MAPA' : 'RADAR'),
    });
  } else hg.clearRect(0, 0, hud.width, hud.height);
  $('hud').style.display = hudA > 0 ? 'block' : 'none';

  titles.forEach(T => updateTitle(T, t));
  updateScrim(t);
  updateBeams(t);
  const fi = t - T_IMPACT, fe = t - END_IMPACT;
  let fl = 0; if (fi > 0 && fi < 0.6) fl = 0.5 * Math.exp(-fi / 0.22 * 3); if (fe > 0 && fe < 0.6) fl = Math.max(fl, 0.5 * Math.exp(-fe / 0.22 * 3));
  flashEl.style.opacity = fl.toFixed(3);
  updateEnd(t);
  updateGrain(frame);
}

window.__ready = (async () => {
  await Promise.all([document.fonts.load('700 100px "DM Sans"'), document.fonts.load('500 40px "DM Sans"'), document.fonts.load('24px Silkscreen')]);
  drawSign();
  await buildWordmark();
  return true;
})();
window.__render = (t, frame) => { renderFrame(t, frame ?? Math.round(t * 30)); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); };
