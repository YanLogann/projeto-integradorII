import * as THREE from 'three';
import gsap from 'gsap';
import { BRAND, COPY, T, SCENES, VO } from '../config.js';
import { CameraRig } from '../core/camera-rig.js';
import { ParticleField } from '../core/particles.js';
import { beam, glowSprite, col, canvasTex } from '../core/gfx.js';
import { logoCanvas, sampleTargets } from '../brand/logo.js';
import { clamp, remap, pulse, lerp, hash, easeOutCubic } from '../core/math.js';
import { el, buildLines, slamIn, glitchBurst, shakeEl, flash } from '../ui/text-fx.js';
import { bolt } from '../core/overlay2d.js';

const S = SCENES.s6, A = (t) => t - S.start, REV = A(T.reveal);
const LOGO_W = 4.0; // largura do logo em unidades de mundo (ocupa ~90% da largura da tela a 10u)

export function createS6(ctx) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.1, 200);
  scene.background = col('#020104');
  // logo (fidelidade ao brand book): texto + ponto lima separados para animar o ponto à parte
  const full = logoCanvas(360), txt = logoCanvas(360, { textOnly: true }), dot = logoCanvas(360, { dotOnly: true });
  const aspect = full.height / full.width, ptsT = sampleTargets(txt, LOGO_W, 11000, 2), ptsD = sampleTargets(dot, LOGO_W, 1400, 1);
  const tex = new THREE.CanvasTexture(full); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const U = { uMap: { value: tex }, uA: { value: 0 }, uT: { value: 0 }, uSheen: { value: 0 } };
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(LOGO_W, LOGO_W * aspect), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform sampler2D uMap; uniform float uA,uT,uSheen; varying vec2 vU;
      void main(){ vec4 c=texture2D(uMap,vU); float band=smoothstep(0.09,0.0,abs(vU.x*0.8+vU.y*0.45 - (uSheen*1.9-0.35))); vec3 rgb=c.rgb + vec3(0.8,0.75,1.0)*band*c.a*0.85; gl_FragColor=vec4(rgb, c.a*uA); }` }));
  logo.position.y = 0.55; scene.add(logo);
  // converge: letras (tinta/violeta) e ponto lima
  const mk = (pts, colors, size, seed, n) => new ParticleField({ count: n, mode: 'converge', seed, colors, size, targets: pts, birth: 0.0, life: REV - 0.1, shell: 7, turb: 0.5, swirl: 5, alpha: 1, depthTest: false });
  const pl = mk(ptsT, ['#F4F1FF', BRAND.violetHi, '#ffffff'], 0.016, 3, 11000), pd = mk(ptsD, [BRAND.lime, BRAND.lime, '#e8ffb0'], 0.02, 4, 1400);
  [pl, pd].forEach((p) => { p.points.position.y = 0.55; scene.add(p.points); });
  const sparkle = new ParticleField({ count: 1800, mode: 'ambient', seed: 15, colors: ['#ffffff', BRAND.violetHi, BRAND.lime], size: 0.016, box: [9, 12, 9], center: [0, 0, 0], speed: 0.15, turb: 0.35, alpha: 0.8 });
  const burst = new ParticleField({ count: 3500, mode: 'burst', seed: 17, colors: [BRAND.violetHi, '#ffffff', BRAND.lime], size: 0.014, center: [0, 0.55, 0], speed: 8, drag: 1.4, turb: 0.8, birth: REV, life: 2.6, alpha: 0.9 });
  scene.add(sparkle.points, burst.points);
  // feixes volumétricos atrás do logo
  const beams = [[-2.6, 0.5], [2.6, -0.5], [0, 0.0], [-1.2, 0.25], [1.4, -0.25]].map(([x, r], i) => { const b = beam({ color: i % 2 ? BRAND.violetHi : BRAND.violet, length: 22, r0: 0.2, r1: 2.6 + (i === 2 ? 1.5 : 0), opacity: 0.3, seed: i }); b.position.set(x, 9, -3 - i * 0.2); b.rotation.z = r * 0.35; scene.add(b); return b; });
  const halo = glowSprite(BRAND.violet, 14, 0.0); halo.position.set(0, 0.55, -1.2); scene.add(halo);
  const dotGlow = glowSprite(BRAND.lime, 0.75, 0.0); // posição do ponto: logo à direita, na linha de base
  { const m = (full.width); /* ponto fica em x = (pad + w + d*0.62) */ }
  scene.add(dotGlow);
  // pings (anéis do ponto lima) — grafismo "estar no radar"
  const pings = Array.from({ length: 3 }, () => { const mt = new THREE.MeshBasicMaterial({ color: col(BRAND.lime).multiplyScalar(1.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); const r = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 96), mt); scene.add(r); return r; });
  // posição do ponto lima em mundo: centroide dos alvos do ponto
  let dx = 0, dy = 0; for (let i = 0; i < ptsD.length; i += 3) { dx += ptsD[i]; dy += ptsD[i + 1]; } dx /= ptsD.length / 3; dy /= ptsD.length / 3; dy += 0.55;
  dotGlow.position.set(dx, dy, 0.05); pings.forEach((p) => p.position.set(dx, dy, 0.02));

  const rig = new CameraRig(camera, [
    { t: 0, p: [0.8, 0.9, 13.5], l: [0, 0.4, 0], fov: 46, roll: 0.05 },
    { t: REV, p: [0.1, 0.65, 11.0], l: [0, 0.5, 0], fov: 42, roll: 0.0 },
    { t: 6, p: [-0.15, 0.55, 10.0], l: [0, 0.55, 0], fov: 41, roll: -0.01 }
  ], { handheld: 0.012, seed: 9, shakes: [{ t: REV, dur: 0.8, amp: 0.18, freq: 24 }] });

  // ---- DOM ----
  const root = el('div', 'scene'); root.id = 's6';
  const tg = A(T.tagline), cta = A(T.cta);
  const tag = buildLines(root, ['NÃO FIQUE', 'PARA TRÁS.'], { size: 140, width: 900, classes: ['', 'lime glow-l'] }); tag.root.style.cssText += ';position:absolute;left:90px;top:1130px;width:900px;text-shadow:0 6px 40px rgba(0,0,0,.95)';
  const pill = el('div', 'abs glass', 'Siga <b class="lime" style="font-weight:900">@codrian</b> e descubra<br>o próximo nível.', root);
  pill.style.cssText = 'left:90px;top:1470px;width:900px;padding:34px 20px;text-align:center;font-weight:800;font-size:54px;line-height:1.18;opacity:0;border-color:#B7FF4A;box-shadow:0 0 70px rgba(183,255,74,.35),inset 0 0 30px rgba(183,255,74,.08)';
  const tl = gsap.timeline();
  flash(tl, REV, { peak: 0.9, dur: 0.5, color: '#ffffff' });
  slamIn(tl, tag.lines[0].chars, tg, { dur: 0.5, stagger: 0.02, from: 3.2 }); slamIn(tl, tag.lines[1].chars, tg + 0.22, { dur: 0.55, stagger: 0.025, from: 3.6, blur: 30 });
  shakeEl(tl, tag.root, tg + 0.05, 0.4, 14, 61); glitchBurst(tl, tag.lines[1].el, tg + 0.7, 0.22, { seed: 62, amp: 24 });
  tl.fromTo(pill, { opacity: 0, y: 60, scale: 0.9, filter: 'blur(12px)' }, { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' }, cta);
  tl.to(pill, { scale: 1.025, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: 2 }, cta + 0.5);
  tl.to(tag.root, { y: -14, duration: 2.2, ease: 'sine.inOut' }, tg + 0.8);

  return {
    id: 's6', ...S, three: { scene, camera }, dom: root, tl, transition: { mode: 1, dur: 0.35 },
    update(t) {
      rig.update(t); U.uT.value = t; const rv = remap(t, REV, REV + 0.45);
      U.uA.value = easeOutCubic(rv) * 0.92; U.uSheen.value = remap(t, REV + 0.2, REV + 1.6);
      // partículas: convergem, depois ficam como brilho residual
      [pl, pd].forEach((p, k) => { p.update(t, camera); p.u.uAlpha.value = lerp(1, 0.22, easeOutCubic(rv)); p.u.uSize.value = (k ? 0.02 : 0.016) * (1 - 0.2 * rv); });
      sparkle.update(t, camera); burst.update(t, camera);
      beams.forEach((b, i) => { b.userData.update(t); b.material.uniforms.uO.value = (0.004 + 0.03 * easeOutCubic(remap(t, REV - 0.3, REV + 1.0))) * (0.85 + 0.15 * Math.sin(t * 2 + i)); });
      halo.material.opacity = 0.05 * easeOutCubic(remap(t, REV - 0.4, REV + 0.8)); halo.scale.setScalar(14 + Math.sin(t * 1.4) * 0.6);
      dotGlow.material.opacity = 0.9 * rv * (0.7 + 0.3 * Math.sin(t * 5));
      pings.forEach((p, i) => { const ph = ((t - REV) * 0.5 + i / 3) % 1; const on = t > REV + 0.25; p.scale.setScalar(0.1 + ph * 1.5); p.material.opacity = on ? Math.pow(1 - ph, 1.8) * 0.85 : 0; });
    },
    draw2d(g, t) {
      const e = pulse(t, REV, 0.5); if (e < 0.02) return;
      for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283 + Math.floor(t * 18); bolt(g, 540, 700, 540 + Math.cos(a) * 640, 700 + Math.sin(a) * 640, i + Math.floor(t * 24), { color: i % 2 ? BRAND.lime : BRAND.violetHi, width: 2.6 * e, jag: 0.18, branches: 1, glow: 26 }); }
    },
    post(t) { const rv = pulse(t, REV, 1.3); return { bloom: { strength: 0.35 + rv * 0.6, threshold: 0.92 }, final: { uCA: 0.6 + rv * 3, uGlitch: pulse(t, REV, 0.25) * 0.5, uVig: 1 } }; }
  };
}
