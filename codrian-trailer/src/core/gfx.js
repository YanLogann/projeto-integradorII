import * as THREE from 'three';
import { mulberry32 } from './math.js';
import { BRAND } from '../config.js';

export const col = (hex) => new THREE.Color(hex);

export function glowTexture(size = 128, stops = [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, s]) => gr.addColorStop(o, s)); g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function glowSprite(color, scale, opacity = 1) {
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color: col(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity });
  const s = new THREE.Sprite(m); s.scale.setScalar(scale); return s;
}
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData = { c, g: c.getContext('2d'), redraw(...a) { draw(this.g, w, h, ...a); t.needsUpdate = true; } };
  return t;
}

// Ambiente procedural para reflexos metálicos/vidro (sem HDRI externo).
export function makeEnv(renderer, lights = [[BRAND.violetHi, 6, [-6, 4, 3]], [BRAND.lime, 3, [6, 2, -4]], ['#ffffff', 4, [0, 8, 2]]]) {
  const s = new THREE.Scene(); s.background = col('#05030a');
  lights.forEach(([c, k, p]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 0.5), new THREE.MeshBasicMaterial({ color: col(c).multiplyScalar(k) })); m.position.set(...p); m.lookAt(0, 0, 0); s.add(m); });
  const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(s, 0.04); pm.dispose(); return rt.texture;
}

// Feixe de luz volumétrico falso (cone aditivo com gradiente e fresnel).
export function beam({ color = BRAND.violetHi, length = 30, r0 = 0.1, r1 = 5, opacity = 0.35, seed = 0 } = {}) {
  const g = new THREE.CylinderGeometry(r1, r0, length, 32, 1, true); g.translate(0, -length / 2, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: col(color) }, uO: { value: opacity }, uT: { value: 0 }, uS: { value: seed } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
      void main(){ vUv=uv; vP=position; vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uC; uniform float uO,uT,uS; varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vP;
      void main(){ float f=pow(abs(dot(normalize(vN),normalize(vV))),1.6);
        float along = 1.0 - vUv.y; float streak = 0.75+0.25*sin(atan(vP.z,vP.x)*7.0 + uT*0.6 + uS*10.0 + vUv.y*3.0);
        float a = f*pow(1.0-along*0.9, 1.4)*streak*uO; gl_FragColor=vec4(uC*a*2.0, a); }`
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.userData.update = (t) => { m.uniforms.uT.value = t; }; return mesh;
}

// Chão em grade com brilho e fade por distância.
export function gridFloor({ size = 400, step = 4, color = BRAND.violetHi, accent = BRAND.lime, y = 0, opacity = 0.9 } = {}) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uC: { value: col(color) }, uA: { value: col(accent) }, uStep: { value: step }, uO: { value: opacity }, uT: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uC,uA; uniform float uStep,uO,uT; varying vec3 vW;
      float line(float x){ float d=abs(fract(x-0.5)-0.5)/fwidth(x); return 1.0-min(d,1.0); }
      void main(){ vec2 p=vW.xz/uStep; float l=max(line(p.x),line(p.y)); float big=max(line(p.x/5.0),line(p.y/5.0));
        float dist=length(vW.xz-cameraPosition.xz); float fade=exp(-dist*0.012);
        vec3 c=uC*l*0.9+uA*big*0.5; gl_FragColor=vec4(c*fade*2.0, (l*0.5+big*0.4)*fade*uO); }`
  });
  m.extensions = { derivatives: true };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), m); mesh.position.y = y; mesh.userData.update = (t) => { m.uniforms.uT.value = t; }; return mesh;
}

// ---------- Cidade procedural (instanced + shader de fachada) ----------
const CITY_VS = `
uniform float uTime, uGlitch; attribute vec2 aSeed;
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec2 vFc; varying vec2 vSeed; varying float vDepth; varying vec2 vSize; varying float vRoof;
float h(float n){ return fract(sin(n*127.1+311.7)*43758.5453); }
void main(){
  vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  // glitch estrutural: faixas de prédio deslocadas
  float band = floor(wp.y*0.18 + aSeed.x*10.0); float ft = floor(uTime*12.0);
  float gl = step(1.0 - uGlitch*0.35, h(band*3.1 + ft + aSeed.y*40.0));
  wp.x += gl * (h(band + ft*1.7) - 0.5) * 5.0 * uGlitch;
  vec3 n = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vN = n; vW = wp.xyz; vUv = uv; vSeed = aSeed; vRoof = step(0.5, n.y);
  vFc = abs(normal.x) > 0.5 ? vec2(position.z*sc.z, position.y*sc.y) : vec2(position.x*sc.x, position.y*sc.y);
  vSize = abs(normal.x) > 0.5 ? vec2(sc.z, sc.y) : vec2(sc.x, sc.y);
  vec4 mv = viewMatrix * wp; vDepth = -mv.z; gl_Position = projectionMatrix * mv;
}`;
const CITY_FS = `
uniform float uTime, uDecay, uFlash, uFog, uLit; uniform vec3 uFogCol, uA, uB, uC;
varying vec2 vUv; varying vec3 vN; varying vec3 vW; varying vec2 vFc; varying vec2 vSeed; varying float vDepth; varying vec2 vSize; varying float vRoof;
float h(float n){ return fract(sin(n*127.1+311.7)*43758.5453); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec3 base = vec3(0.035, 0.026, 0.07);
  vec2 cs = vec2(1.6, 2.5); vec2 g = vFc / cs; vec2 cell = floor(g) + floor(vSeed.x*100.0); vec2 f = fract(g);
  float win = step(0.2, f.x)*step(f.x, 0.8)*step(0.22, f.y)*step(f.y, 0.78);
  float lit = step(h2(cell + vSeed.y*9.0), uLit*(0.3 + vSeed.x*0.7));
  float blink = step(0.97 - 0.5*vSeed.y*0.3, h2(cell*1.3 + floor(uTime*(2.0+vSeed.x*6.0))));
  float dead = step(h2(cell*2.7 + 4.0) , uDecay*(0.4+vSeed.y*0.9));     // colapso digital: janelas morrem / viram erro
  float err = step(0.985 - uDecay*0.05, h2(cell + floor(uTime*3.0)));
  float pick = h2(cell*3.3);
  vec3 wc = pick < 0.55 ? uA : (pick < 0.85 ? vec3(0.9,0.88,1.0) : uB);
  wc = mix(wc, uC, err);
  float on = win * lit * (1.0 - dead*0.85) * mix(1.0, blink, 0.6);
  on = max(on, win*err*step(0.4, h2(cell + 9.0)));
  vec3 c = base * (0.6 + 0.4*vN.x*vN.x + 0.5*max(vN.y,0.0));
  c += wc * on * (0.85 + uFlash*0.35);
  // contorno luminoso nas arestas (grafismo "painéis em fio" da marca)
  vec2 sz = vSize; float ed = min(min(vUv.x*sz.x, (1.0-vUv.x)*sz.x), min(vUv.y*sz.y, (1.0-vUv.y)*sz.y));
  float edge = 1.0 - smoothstep(0.0, 0.22, ed);
  c += uA * edge * (0.32 + 0.2*sin(uTime*2.0 + vSeed.x*20.0)) * (0.6 + 0.4*vSeed.y);
  c += uA * vRoof * 0.12;
  // varredura vertical (scan) subindo pelas fachadas
  float scan = smoothstep(0.0, 1.0, 1.0 - abs(fract(vW.y*0.02 - uTime*0.25 + vSeed.x) - 0.5)*12.0);
  c += uB * scan * 0.05;
  c += uFlash * vec3(0.30, 0.22, 0.6) * (0.25 + 0.75*abs(vN.x));
  float fog = 1.0 - exp(-pow(vDepth*uFog, 1.6));
  float hf = exp(-max(vW.y,0.0)*0.012);
  c = mix(c, uFogCol, clamp(fog*(0.7+0.3*hf), 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0);
}`;

export function makeCity({ seed = 7, count = 280, zRange = [30, -280], gap = 16, wRange = [7, 16], hRange = [22, 95], lean = 0.12, lit = 0.6, decay = 0, fogDensity = 0.011, accent = BRAND.violetHi, spark = BRAND.lime, fogColor = '#0c0620', mirror = true } = {}) {
  const rnd = mulberry32(seed);
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const uniforms = { uTime: { value: 0 }, uGlitch: { value: 0 }, uDecay: { value: decay }, uFlash: { value: 0 }, uFog: { value: fogDensity }, uLit: { value: lit },
    uFogCol: { value: col(fogColor) }, uA: { value: col(accent) }, uB: { value: col(spark) }, uC: { value: col(BRAND.danger) } };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: CITY_VS, fragmentShader: CITY_FS, side: THREE.DoubleSide });
  const group = new THREE.Group();
  const make = (flip) => {
    const im = new THREE.InstancedMesh(geo, mat, count), seeds = new Float32Array(count * 2); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); const r2 = mulberry32(seed);
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1, w = wRange[0] + r2() * (wRange[1] - wRange[0]), d = wRange[0] + r2() * (wRange[1] - wRange[0]), hh = hRange[0] + Math.pow(r2(), 1.6) * (hRange[1] - hRange[0]);
      const x = side * (gap * 0.5 + w * 0.5 + r2() * 14), z = zRange[0] + (zRange[1] - zRange[0]) * (i / count) + r2() * 8;
      e.set(0, (r2() - 0.5) * 0.08, side * (r2() - 0.4) * lean * (r2() < 0.35 ? 1 : 0.15)); q.setFromEuler(e);
      m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(w, hh * (flip ? -1 : 1), d)); im.setMatrixAt(i, m);
      seeds[i * 2] = r2(); seeds[i * 2 + 1] = r2();
    }
    im.geometry = geo.clone(); im.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 2)); im.frustumCulled = false; return im;
  };
  group.add(make(false)); if (mirror) { const mr = make(true); group.add(mr); }
  group.userData.update = (t, o = {}) => { uniforms.uTime.value = t; if (o.glitch !== undefined) uniforms.uGlitch.value = o.glitch; if (o.flash !== undefined) uniforms.uFlash.value = o.flash; if (o.decay !== undefined) uniforms.uDecay.value = o.decay; };
  group.userData.uniforms = uniforms; return group;
}

// Placas/holografias com texto (canvas), com scanlines e flicker
export function holoSign(text, { w = 512, h = 160, color = BRAND.violetHi, size = 90, bg = 'rgba(16,12,28,0.65)', danger = false } = {}) {
  const t = canvasTex(w, h, (g) => {
    g.clearRect(0, 0, w, h); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = danger ? BRAND.danger : color; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    g.font = `800 ${size}px "DM Sans"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = danger ? BRAND.danger : '#F4F1FF'; g.fillText(text, w / 2, h / 2 + 4);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1.5);
  });
  t.userData.redraw();
  return t;
}
