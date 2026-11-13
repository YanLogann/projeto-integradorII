import * as THREE from 'three';
import { mulberry32 } from './math.js';

const VS = /* glsl */`
uniform float uTime, uSize, uScale, uMode, uBirth, uLife, uSpeed, uDrag, uTurb, uAlpha, uSwirl;
uniform vec3 uBox, uCenter, uC1, uC2, uC3;
attribute vec4 aSeed; attribute vec3 aTarget;
varying vec4 vCol; varying float vRot;
void main(){
  vec3 p; float a = 1.0;
  float s = aSeed.w;
  if (uMode < 0.5) {            // AMBIENT: poeira em suspensão com deriva + turbulência, volume que se repete
    vec3 q = position + vec3(0.0, uTime * uSpeed * (0.2 + aSeed.y), 0.0);
    q += uTurb * vec3(sin(uTime*0.6 + s*40.0), cos(uTime*0.5 + aSeed.x*30.0), sin(uTime*0.55 + aSeed.y*50.0));
    p = mod(q + uBox*0.5, uBox) - uBox*0.5 + uCenter;
    a = 0.35 + 0.65*(0.5 + 0.5*sin(uTime*(0.8 + s*2.5) + aSeed.z*20.0));
  } else if (uMode < 1.5) {     // BURST: explosão esférica com arrasto
    float age = uTime - uBirth - s*0.12;
    vec3 d = normalize(position + 1e-4);
    float sp = uSpeed*(0.25 + aSeed.x*1.25);
    float dist = sp*(1.0 - exp(-uDrag*max(age,0.0)))/uDrag;
    p = uCenter + d*dist;
    p += uTurb * vec3(sin(age*3.0+s*30.0), cos(age*2.5+aSeed.x*20.0), sin(age*2.0+aSeed.y*25.0)) * min(age,1.5);
    float life = uLife*(0.45 + aSeed.y*0.8);
    a = age < 0.0 ? 0.0 : pow(1.0 - clamp(age/life,0.0,1.0), 1.4);
  } else {                      // CONVERGE: partículas espiralam até o alvo (silhueta do logotipo)
    float delay = aSeed.x*0.35;
    float u = clamp((uTime - uBirth)/uLife - delay, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - u, 3.0);
    vec3 dir = position - aTarget;
    float ang = (1.0 - e) * uSwirl * (0.5 + aSeed.y);
    float cs = cos(ang), sn = sin(ang);
    vec3 d2 = vec3(dir.x*cs - dir.y*sn, dir.x*sn + dir.y*cs, dir.z);
    p = aTarget + d2*(1.0 - e);
    p += uTurb * (1.0 - e) * vec3(sin(uTime*2.0+s*30.0), cos(uTime*1.7+aSeed.x*30.0), 0.0);
    a = (u <= 0.0 ? 0.0 : 1.0) * (0.35 + 0.65*smoothstep(0.0, 0.2, u));
    a *= 0.75 + 0.25*sin(uTime*6.0 + s*50.0);
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(uSize * (0.35 + aSeed.z*1.1) * uScale / max(-mv.z, 0.1), 0.0);
  float m = fract(s*7.0);
  vec3 c = m < 0.5 ? mix(uC1, uC2, m*2.0) : mix(uC2, uC3, (m-0.5)*2.0);
  vCol = vec4(c, a * uAlpha);
  vRot = s * 6.28;
}`;
const FS = /* glsl */`
uniform sampler2D uMap; uniform float uHasMap;
varying vec4 vCol; varying float vRot;
void main(){
  vec2 pc = gl_PointCoord - 0.5;
  float m;
  if (uHasMap > 0.5) {
    float cs = cos(vRot*0.0), sn = sin(vRot*0.0);
    vec4 t = texture2D(uMap, gl_PointCoord);
    m = t.a;
  } else {
    float d = length(pc);
    m = smoothstep(0.5, 0.0, d);
    m = m*m*(1.0 + 1.5*smoothstep(0.25, 0.0, d));
  }
  if (vCol.a * m < 0.003) discard;
  gl_FragColor = vec4(vCol.rgb * (0.55 + 0.7*m), vCol.a * m);
}`;

export class ParticleField {
  /** mode: 'ambient' | 'burst' | 'converge' */
  constructor({ count = 2000, mode = 'ambient', seed = 1, colors = ['#ffffff', '#8B6CFF', '#B7FF4A'], size = 0.1, box = [30, 20, 30],
    center = [0, 0, 0], speed = 0.4, drag = 1.5, turb = 0.3, birth = 0, life = 3, radius = 1, shell = 20, targets = null, map = null, alpha = 1, swirl = 3, depthTest = true }) {
    const rnd = mulberry32(seed);
    const pos = new Float32Array(count * 3), seeds = new Float32Array(count * 4), tgt = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      seeds.set([rnd(), rnd(), rnd(), rnd()], i * 4);
      if (mode === 'ambient') pos.set([(rnd() - 0.5) * box[0], (rnd() - 0.5) * box[1], (rnd() - 0.5) * box[2]], i * 3);
      else if (mode === 'burst') { const z = rnd() * 2 - 1, a = rnd() * 6.2832, r = Math.sqrt(1 - z * z); const k = 0.4 + rnd() * 0.6; pos.set([r * Math.cos(a) * k, r * Math.sin(a) * k, z * k], i * 3); }
      else {
        const z = rnd() * 2 - 1, a = rnd() * 6.2832, r = Math.sqrt(1 - z * z), R = shell * (0.6 + rnd() * 0.8);
        const t = targets ? i % (targets.length / 3) : 0;
        const tx = targets ? targets[t * 3] : 0, ty = targets ? targets[t * 3 + 1] : 0, tz = targets ? targets[t * 3 + 2] : 0;
        tgt.set([tx, ty, tz], i * 3);
        pos.set([tx + r * Math.cos(a) * R, ty + r * Math.sin(a) * R, tz + z * R * 0.6], i * 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    g.setAttribute('aTarget', new THREE.BufferAttribute(tgt, 3));
    this.u = {
      uTime: { value: 0 }, uSize: { value: size }, uScale: { value: 1000 }, uMode: { value: { ambient: 0, burst: 1, converge: 2 }[mode] },
      uBirth: { value: birth }, uLife: { value: life }, uSpeed: { value: speed }, uDrag: { value: drag }, uTurb: { value: turb },
      uBox: { value: new THREE.Vector3(...box) }, uCenter: { value: new THREE.Vector3(...center) }, uAlpha: { value: alpha }, uSwirl: { value: swirl },
      uC1: { value: new THREE.Color(colors[0]) }, uC2: { value: new THREE.Color(colors[1]) }, uC3: { value: new THREE.Color(colors[2]) },
      uMap: { value: map }, uHasMap: { value: map ? 1 : 0 }
    };
    const m = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest, blending: THREE.AdditiveBlending });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
  }
  update(t, camera, height = 1920) { this.u.uTime.value = t; this.u.uScale.value = (height * 0.5) / Math.tan((camera.fov * Math.PI) / 360); }
}
