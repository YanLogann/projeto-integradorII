import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { BRAND } from '../config.js';

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const NOISE = `
float hash11(float n){ return fract(sin(n*127.1+311.7)*43758.5453); }
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }`;

// Mistura de duas cenas: glitch por faixas, onda de energia radial, ou apenas A/B.
const MIX_FS = `
uniform sampler2D tA, tB; uniform float uMode, uP, uTime, uAspect; uniform vec2 uCenter; uniform vec3 uColA, uColB;
varying vec2 vUv; ${NOISE}
void main(){
  vec2 uv = vUv;
  if (uMode < 0.5) { gl_FragColor = texture2D(tA, uv); return; }
  if (uMode < 1.5) {                           // GLITCH CUT: faixas horizontais trocam de cena em ordem aleatória
    float ft = floor(uTime*30.0);
    float n = mix(14.0, 46.0, hash11(ft));
    float band = floor(uv.y*n);
    float th = hash11(band*1.7 + ft*0.31);
    float on = step(th, uP*1.15);
    float off = (hash11(band + ft) - 0.5) * 0.18 * sin(uP*3.14159);
    vec2 u2 = vec2(uv.x + off, uv.y);
    vec4 a = texture2D(tA, u2), b = texture2D(tB, u2);
    vec4 c = mix(a, b, on);
    c.rgb += (1.0 - abs(on - 0.5)*2.0) * 0.0;
    gl_FragColor = c; return;
  }
  // WAVE: onda de energia (violeta/lima) que atravessa a tela revelando B
  vec2 d = (uv - uCenter) * vec2(uAspect, 1.0);
  float r = length(d);
  float edge = uP * 2.4;
  float w = 0.06;
  float ring = exp(-pow((r - edge)/w, 2.0));
  float ring2 = exp(-pow((r - edge + 0.12)/0.1, 2.0));
  vec2 dir = d / max(r, 1e-4);
  vec2 off = dir * ring * 0.035 * vec2(1.0/uAspect, 1.0);
  float inside = smoothstep(edge + 0.01, edge - 0.01, r);
  vec4 a = texture2D(tA, uv - off), b = texture2D(tB, uv - off);
  vec4 c = mix(a, b, inside);
  float hue = 0.5 + 0.5*sin(atan(d.y, d.x)*3.0 + uTime*2.0);
  vec3 col = mix(uColA, uColB, hue);
  c.rgb += col * (ring*4.5 + ring2*1.2) * step(0.001, uP) * (1.0 - smoothstep(0.85, 1.0, uP));
  gl_FragColor = c;
}`;

const FINAL_FS = `
uniform sampler2D tMain; uniform float uTime, uFlash, uGlitch, uCA, uFreeze, uVig, uGrain, uFade, uExposure, uShake; uniform vec3 uFlashCol;
varying vec2 vUv; ${NOISE}
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
void main(){
  vec2 uv = vUv;
  float ft = floor(uTime*30.0);
  float bands = mix(24.0, 80.0, hash11(ft*1.3));
  float band = floor(uv.y*bands);
  float g = step(1.0 - uGlitch*0.55, hash11(band*3.7 + ft*5.1)) * uGlitch;
  uv.x += g * (hash11(band + ft*2.0) - 0.5) * 0.14;
  vec2 dir = uv - 0.5;
  float ca = uCA * (0.0025 + dot(dir,dir)*0.02) + g*0.012;
  vec3 col = vec3(texture2D(tMain, uv + dir*ca).r, texture2D(tMain, uv).g, texture2D(tMain, uv - dir*ca).b);
  col *= uExposure;
  col = mix(clamp(col, 0.0, 1.0), aces(col), 0.65);
  // freeze: dessatura e esfria
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(lum)*vec3(0.82, 0.9, 1.15), uFreeze);
  // grade: blacks levantados para o 'void' da marca
  col += vec3(0.0016, 0.0009, 0.0026) * (1.0 - col);   // piso de preto ≈ void #100C1C depois do gamma
  float v = smoothstep(0.95, 0.25, length(dir*vec2(0.85, 0.62)));
  col *= mix(1.0, v, uVig);
  col *= 0.96 + 0.04*sin(uv.y*1920.0*1.2);          // scanline sutil
  col = mix(col, uFlashCol, uFlash);
  col *= (1.0 - uFade);
  vec3 o = pow(max(col, 0.0), vec3(1.0/2.2));
  o += (hash21(uv*vec2(1080.0,1920.0) + ft) - 0.5) * uGrain * 0.55;   // grão depois do gamma: não levanta o preto
  gl_FragColor = vec4(o, 1.0);
}`;

export class Stage {
  constructor(canvas, W, H) {
    this.W = W; this.H = H;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(1); r.setSize(W, H, false); r.setClearColor(BRAND.black, 1);
    const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.rtA = new THREE.WebGLRenderTarget(W, H, { ...opts, samples: 4 });
    this.rtB = new THREE.WebGLRenderTarget(W, H, { ...opts, samples: 4 });
    this.rtM = new THREE.WebGLRenderTarget(W, H, { ...opts, depthBuffer: false });
    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.9, 0.7, 0.62);
    this.quad = new FullScreenQuad();
    this.mixMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: MIX_FS, depthTest: false,
      uniforms: { tA: { value: null }, tB: { value: null }, uMode: { value: 0 }, uP: { value: 0 }, uTime: { value: 0 }, uAspect: { value: W / H }, uCenter: { value: new THREE.Vector2(0.5, 0.5) },
        uColA: { value: new THREE.Color(BRAND.violetHi) }, uColB: { value: new THREE.Color(BRAND.lime) } }
    });
    this.finalMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FINAL_FS, depthTest: false,
      uniforms: { tMain: { value: null }, uTime: { value: 0 }, uFlash: { value: 0 }, uGlitch: { value: 0 }, uCA: { value: 0.6 }, uFreeze: { value: 0 }, uVig: { value: 1 },
        uGrain: { value: 0.045 }, uFade: { value: 0 }, uExposure: { value: 1 }, uShake: { value: 0 }, uFlashCol: { value: new THREE.Color('#ffffff') } }
    });
  }
  _draw(scene, camera, rt) { const r = this.renderer; r.setRenderTarget(rt); r.clear(); r.render(scene, camera); }
  /**
   * @param {{scene,camera}} A  cena principal
   * @param {{scene,camera}|null} B  segunda cena (transição)
   * @param {object} fx  { mode, p, center, time, bloom:{strength,threshold,radius}, final:{...uniformes} }
   */
  render(A, B, fx = {}) {
    const r = this.renderer;
    this._draw(A.scene, A.camera, this.rtA);
    if (B) this._draw(B.scene, B.camera, this.rtB);
    const m = this.mixMat.uniforms;
    m.tA.value = this.rtA.texture; m.tB.value = B ? this.rtB.texture : this.rtA.texture;
    m.uMode.value = B ? (fx.mode ?? 1) : 0; m.uP.value = fx.p ?? 0; m.uTime.value = fx.time ?? 0;
    if (fx.center) m.uCenter.value.set(fx.center[0], fx.center[1]);
    this.quad.material = this.mixMat; r.setRenderTarget(this.rtM); r.clear(); this.quad.render(r);
    const b = fx.bloom || {};
    this.bloom.strength = b.strength ?? 0.9; this.bloom.threshold = b.threshold ?? 0.62; this.bloom.radius = b.radius ?? 0.7;
    this.bloom.render(r, null, this.rtM, 0, false);
    const f = this.finalMat.uniforms, o = fx.final || {};
    f.tMain.value = this.rtM.texture; f.uTime.value = fx.time ?? 0;
    for (const k of ['uFlash', 'uGlitch', 'uCA', 'uFreeze', 'uVig', 'uGrain', 'uFade', 'uExposure']) {
      const d = { uCA: 0.6, uVig: 1, uGrain: 0.045, uExposure: 1 }[k] ?? 0;
      f[k].value = o[k] ?? d;
    }
    f.uFlashCol.value.set(o.flashColor || '#ffffff');
    this.quad.material = this.finalMat; r.setRenderTarget(null); this.quad.render(r);
  }
}
