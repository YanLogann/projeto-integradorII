import * as THREE from 'three';
import { noise1, pulse } from './math.js';

// Câmera por keyframes com interpolação Hermite (velocidade contínua), handheld e shakes por evento.
export class CameraRig {
  constructor(camera, keys, { handheld = 0.02, shakes = [], seed = 1 } = {}) {
    this.cam = camera; this.keys = keys; this.handheld = handheld; this.shakes = shakes; this.seed = seed;
    this.p = new THREE.Vector3(); this.l = new THREE.Vector3(); this.up = new THREE.Vector3(0, 1, 0);
  }
  _tan(arr, i, comp) {
    const k = this.keys, n = k.length;
    const a = k[Math.max(i - 1, 0)], b = k[Math.min(i + 1, n - 1)];
    const dt = b.t - a.t || 1;
    return (b[arr][comp] - a[arr][comp]) / dt;
  }
  _sc(name, i) {
    const k = this.keys, n = k.length;
    const a = k[Math.max(i - 1, 0)], b = k[Math.min(i + 1, n - 1)];
    return ((b[name] ?? 0) - (a[name] ?? 0)) / (b.t - a.t || 1);
  }
  sample(t) {
    const k = this.keys;
    t = Math.min(Math.max(t, k[0].t), k[k.length - 1].t);
    let i = 0; while (i < k.length - 2 && t > k[i + 1].t) i++;
    const a = k[i], b = k[i + 1], dt = b.t - a.t, u = (t - a.t) / dt;
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
    const out = {};
    for (const arr of ['p', 'l']) {
      out[arr] = [0, 1, 2].map((c) => h00 * a[arr][c] + h10 * dt * this._tan(arr, i, c) + h01 * b[arr][c] + h11 * dt * this._tan(arr, i + 1, c));
    }
    for (const s of ['fov', 'roll']) {
      const av = a[s] ?? (s === 'fov' ? 50 : 0), bv = b[s] ?? (s === 'fov' ? 50 : 0);
      out[s] = h00 * av + h10 * dt * this._sc(s, i) + h01 * bv + h11 * dt * this._sc(s, i + 1);
    }
    return out;
  }
  update(t) {
    const s = this.sample(t);
    let [x, y, z] = s.p, [lx, ly, lz] = s.l, roll = s.roll || 0;
    const hh = this.handheld;
    x += noise1(t * 0.9, this.seed) * hh; y += noise1(t * 0.8, this.seed + 3) * hh; z += noise1(t * 0.7, this.seed + 5) * hh * 0.5;
    lx += noise1(t * 0.6, this.seed + 7) * hh * 0.6; ly += noise1(t * 0.55, this.seed + 9) * hh * 0.6;
    roll += noise1(t * 0.5, this.seed + 11) * hh * 0.08;
    for (const sh of this.shakes) {
      const e = pulse(t, sh.t, sh.dur); if (!e) continue;
      const f = sh.freq || 28;
      x += noise1(t * f, 21) * sh.amp * e; y += noise1(t * f, 22) * sh.amp * e; z += noise1(t * f, 23) * sh.amp * 0.4 * e;
      roll += noise1(t * f, 24) * (sh.roll ?? sh.amp * 0.05) * e;
    }
    this.cam.position.set(x, y, z);
    this.up.set(Math.sin(roll), Math.cos(roll), 0);
    this.cam.up.copy(this.up);
    this.cam.lookAt(lx, ly, lz);
    if (this.cam.fov !== s.fov) { this.cam.fov = s.fov; this.cam.updateProjectionMatrix(); }
  }
}
