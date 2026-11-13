import * as THREE from 'three';
import gsap from 'gsap';
import { BRAND, T, SCENES } from '../config.js';
import { CameraRig } from '../core/camera-rig.js';
import { ParticleField } from '../core/particles.js';
import { gridFloor, glowSprite, col } from '../core/gfx.js';
import { clamp, remap, pulse, hash, lerp } from '../core/math.js';
import { el, buildLines, slamIn, glitchBurst, shakeEl, flash } from '../ui/text-fx.js';

const S = SCENES.s5, A = (t) => t - S.start;
// Cortes alinhados à narração/música (120 BPM): site | automações | IA | gestão | presença | recap
const CUTS = [T.s5, 25.4, T.cutIA, T.cutCRM, T.cutPresence, T.recap, S.end].map(A);
const TITLES = ['SITES', 'AUTOMAÇÕES', 'INTELIGÊNCIA ARTIFICIAL', 'GESTÃO DE CLIENTES', 'PRESENÇA DIGITAL'];

export function createS5(ctx) {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(66, 1080 / 1920, 0.1, 300);
  scene.background = col('#05030b'); scene.fog = new THREE.FogExp2('#05030b', 0.028);
  // túnel de dados
  const rings = Array.from({ length: 36 }, (_, i) => { const m = new THREE.MeshBasicMaterial({ color: col(i % 4 === 0 ? BRAND.lime : BRAND.violetHi).multiplyScalar(1.1), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
    const r = new THREE.Mesh(new THREE.TorusGeometry(7 + (i % 3) * 0.6, 0.025, 6, 6 + (i % 3) * 2), m); r.userData.i = i; scene.add(r); return r; });
  const floor = gridFloor({ size: 300, step: 3, y: -5, color: BRAND.violetHi, accent: BRAND.lime, opacity: 0.8 }), ceil = gridFloor({ size: 300, step: 3, y: 5, color: BRAND.violetHi, accent: BRAND.violetHi, opacity: 0.4 }); ceil.rotation.x = Math.PI; scene.add(floor, ceil);
  const dust = new ParticleField({ count: 2200, mode: 'ambient', seed: 33, colors: ['#ffffff', BRAND.violetHi, BRAND.lime], size: 0.04, box: [18, 10, 90], speed: 0.2, turb: 0.3 });
  scene.add(dust.points);
  const glow = glowSprite(BRAND.violet, 30, 0.5); glow.position.set(0, 0, -60); scene.add(glow);
  const rig = new CameraRig(camera, [{ t: 0, p: [0, 0, 0], l: [0, 0, -10], fov: 66 }, { t: 10, p: [0, 0, 0], l: [0, 0, -10], fov: 66 }], { handheld: 0.05, seed: 3, shakes: CUTS.slice(0, 6).map((t) => ({ t, dur: 0.35, amp: 0.25 })) });
  const SPEED = 38;

  // ---- DOM ----
  const root = el('div', 'scene'); root.id = 's5';
  const dim = el('div', 'abs', '', root); dim.style.cssText = 'inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(6,4,13,0) 30%,rgba(6,4,13,.55) 100%)';
  const mod = (css) => { const d = el('div', 'abs', '', root); d.style.cssText = `left:0;top:0;width:1080px;height:1920px;opacity:0;${css || ''}`; return d; };
  const mods = [mod(), mod(), mod(), mod(), mod()];
  const tl = gsap.timeline();
  const titles = mods.map((m, i) => { const w = el('div', 'abs', '', m); w.style.cssText = 'left:70px;top:150px;width:940px'; const L = buildLines(w, [TITLES[i]], { size: i === 2 ? 96 : 130, width: 940 }); L.root.style.textShadow = '0 0 40px rgba(105,56,232,.9), 0 6px 30px rgba(0,0,0,.9)';
    const bar = el('div', 'abs', '', m); bar.style.cssText = 'left:70px;top:330px;width:940px;height:8px;background:var(--lime);transform-origin:left;box-shadow:0 0 24px rgba(183,255,74,.8);transform:scaleX(0)'; return { L, bar }; });
  const G = (m, css, html, cls = '') => { const d = el('div', 'abs ' + cls, html || '', m); d.style.cssText = css; return d; };

  // ---------- 1) SITE sendo construído ----------
  { const m = mods[0], t0 = CUTS[0], br = G(m, 'left:90px;top:420px;width:900px;height:860px;border-radius:26px;overflow:hidden', '', 'glass');
    G(br, 'left:0;top:0;right:0;height:64px;background:rgba(39,25,66,.9);border-bottom:2px solid rgba(139,108,255,.5)', '<span style="position:absolute;left:24px;top:22px;width:18px;height:18px;border-radius:50%;background:#FF4D6D"></span><span style="position:absolute;left:56px;top:22px;width:18px;height:18px;border-radius:50%;background:#ffd24d"></span><span style="position:absolute;left:88px;top:22px;width:18px;height:18px;border-radius:50%;background:#B7FF4A"></span><span class="pix" style="position:absolute;left:150px;top:18px;font-size:22px;color:var(--mist)">seunegocio.com.br</span>');
    const nav = G(br, 'left:30px;right:30px;top:90px;height:56px;border:2px dashed #8B6CFF;border-radius:12px');
    const hero = G(br, 'left:30px;right:30px;top:170px;height:300px;border:2px dashed #8B6CFF;border-radius:18px');
    const h1 = G(br, 'left:60px;top:210px;width:560px;height:46px;background:#F4F1FF;border-radius:8px'), h2 = G(br, 'left:60px;top:276px;width:420px;height:46px;background:#F4F1FF;border-radius:8px'), p1 = G(br, 'left:60px;top:352px;width:500px;height:18px;background:#8E83B8;border-radius:8px');
    const btn = G(br, 'left:60px;top:395px;width:220px;height:58px;background:#B7FF4A;border-radius:30px;box-shadow:0 0 40px rgba(183,255,74,.7)');
    const cards = [0, 1, 2].map((i) => G(br, `left:${30 + i * 292}px;top:520px;width:270px;height:300px;border:2px dashed #8B6CFF;border-radius:18px`));
    const code = G(m, 'left:70px;top:1310px;width:940px;font-size:26px;line-height:1.4;color:#8B6CFF;opacity:0', '&lt;section class="hero"&gt;<br>&nbsp;&nbsp;&lt;h1&gt;Sua empresa no mapa&lt;/h1&gt;<br>&nbsp;&nbsp;&lt;a class="cta"&gt;Chame no WhatsApp&lt;/a&gt;', 'mono');
    tl.fromTo(br, { rotationY: -40, rotationX: 12, x: -240, scale: 0.8, opacity: 0, filter: 'blur(14px)' }, { rotationY: -6, rotationX: 5, x: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' }, t0);
    tl.fromTo(nav, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.25, ease: 'power3.out' }, t0 + 0.12).fromTo(hero, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, t0 + 0.2);
    [h1, h2, p1].forEach((e, i) => tl.fromTo(e, { scaleX: 0, transformOrigin: 'left' }, { scaleX: 1, duration: 0.25, ease: 'expo.out' }, t0 + 0.3 + i * 0.07));
    tl.fromTo(btn, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, t0 + 0.5);
    cards.forEach((c, i) => tl.fromTo(c, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'expo.out' }, t0 + 0.4 + i * 0.08));
    tl.to([nav, hero, ...cards], { backgroundColor: 'rgba(105,56,232,.35)', borderStyle: 'solid', borderColor: '#8B6CFF', duration: 0.25 }, t0 + 0.8);
    tl.to(cards[1], { backgroundColor: 'rgba(183,255,74,.18)', borderColor: '#B7FF4A', duration: 0.2 }, t0 + 0.95);
    tl.fromTo(code, { opacity: 0, x: 40 }, { opacity: 0.9, x: 0, duration: 0.3 }, t0 + 0.5);
    tl.to(br, { rotationY: 4, x: 20, duration: CUTS[1] - t0, ease: 'none' }, t0 + 0.5);
    tl.fromTo(mods[0], { opacity: 0 }, { opacity: 1, duration: 0.05 }, t0).to(mods[0], { opacity: 0, duration: 0.12 }, CUTS[1] - 0.1);
  }
  // ---------- 2) AUTOMAÇÕES ----------
  { const m = mods[1], t0 = CUTS[1], nodes = [['MENSAGEM', '✉', 120, 440], ['IA', '✦', 560, 640], ['RESPOSTA', '↩', 120, 840], ['CONTATO SALVO', '✓', 560, 1040]];
    const els = nodes.map(([n, ic, x, y], i) => G(m, `left:${x}px;top:${y}px;width:400px;height:150px;opacity:0;display:flex;align-items:center;gap:22px;padding:0 28px;${i === 3 ? 'border-color:#B7FF4A' : ''}`, `<div style="width:76px;height:76px;border-radius:20px;background:${i === 1 ? '#6938E8' : i === 3 ? '#B7FF4A' : '#271942'};display:grid;place-items:center;font-size:42px;color:${i === 3 ? '#10101c' : '#fff'};border:2px solid #8B6CFF">${ic}</div><div class="pix" style="font-size:28px;line-height:1.2">${n}</div>`, 'glass'));
    const lines = [[320, 590, 240, 0, 0.18], [680, 790, 0, 0, 0]].length && [
      G(m, 'left:320px;top:520px;width:300px;height:6px;background:#8B6CFF;transform-origin:left;transform:rotate(23deg) scaleX(0);box-shadow:0 0 18px #8B6CFF'),
      G(m, 'left:560px;top:715px;width:300px;height:6px;background:#8B6CFF;transform-origin:left;transform:rotate(-23deg) scaleX(0);box-shadow:0 0 18px #8B6CFF'),
      G(m, 'left:320px;top:915px;width:300px;height:6px;background:#8B6CFF;transform-origin:left;transform:rotate(23deg) scaleX(0);box-shadow:0 0 18px #8B6CFF')];
    // linhas em z-index entre cards: posiciona por rotação (aproximação visual)
    lines[0].style.top = '545px'; lines[0].style.left = '470px'; lines[0].style.width = '170px'; lines[0].style.transform = 'rotate(42deg) scaleX(0)';
    lines[1].style.top = '770px'; lines[1].style.left = '300px'; lines[1].style.width = '330px'; lines[1].style.transform = 'rotate(-34deg) scaleX(0)'; lines[1].style.display = 'none';
    lines[2].style.top = '965px'; lines[2].style.left = '300px'; lines[2].style.width = '330px'; lines[2].style.transform = 'rotate(-24deg) scaleX(0)'; lines[2].style.display = 'none';
    tl.fromTo(m, { opacity: 0 }, { opacity: 1, duration: 0.05 }, t0).to(m, { opacity: 0, duration: 0.12 }, CUTS[2] - 0.1);
    els.forEach((e, i) => tl.fromTo(e, { scale: 0.3, opacity: 0, rotation: i % 2 ? 12 : -12, filter: 'blur(10px)' }, { scale: 1, opacity: 1, rotation: 0, filter: 'blur(0px)', duration: 0.4, ease: 'back.out(2.2)' }, t0 + 0.12 + i * 0.28));
    // fluxo de pulsos viajando entre nós
    const pulses = [0, 1, 2].map(() => G(m, 'width:26px;height:26px;border-radius:50%;background:#B7FF4A;box-shadow:0 0 30px #B7FF4A;opacity:0;left:0;top:0'));
    const path = [[320, 515], [520, 715], [320, 915], [520, 1115]];
    pulses.forEach((p, k) => { tl.set(p, { opacity: 1, x: path[0][0], y: path[0][1] }, t0 + 0.45 + k * 0.15); path.slice(1).forEach(([x, y], j) => tl.to(p, { x, y, duration: 0.22, ease: 'power2.inOut' }, t0 + 0.5 + k * 0.15 + j * 0.24)); tl.to(p, { opacity: 0, scale: 3, duration: 0.15 }, t0 + 1.25 + k * 0.1); });
    tl.fromTo(els[3], { boxShadow: '0 0 0 rgba(183,255,74,0)' }, { boxShadow: '0 0 80px rgba(183,255,74,.7)', duration: 0.25, yoyo: true, repeat: 1 }, t0 + 1.15);
    G(m, 'left:70px;top:1260px;width:940px;font-size:30px;color:var(--mist);opacity:.9', 'mensagem → IA → resposta → contato salvo', 'pix');
  }
  // ---------- 3) INTELIGÊNCIA ARTIFICIAL (chat) ----------
  { const m = mods[2], t0 = CUTS[2];
    const chat = G(m, 'left:90px;top:420px;width:900px;height:860px;overflow:hidden;opacity:0', '', 'glass');
    G(chat, 'left:0;top:0;right:0;height:92px;background:rgba(39,25,66,.9);border-bottom:2px solid rgba(139,108,255,.5)', '<span class="pix lime" style="position:absolute;left:36px;top:30px;font-size:28px">● IA · online 24h</span>');
    const b1 = G(chat, 'left:36px;top:130px;max-width:640px;padding:26px 32px;background:#271942;border:2px solid #8B6CFF;border-radius:30px 30px 30px 6px;font-size:44px;font-weight:700;opacity:0', 'Oi, gostaria de um orçamento.');
    const typing = G(chat, 'right:36px;top:340px;padding:24px 34px;background:#6938E8;border-radius:30px 30px 6px 30px;font-size:46px;letter-spacing:8px;opacity:0', '•••');
    const b2 = G(chat, 'right:36px;top:340px;max-width:660px;padding:26px 32px;background:#6938E8;border-radius:30px 30px 6px 30px;font-size:44px;font-weight:700;opacity:0', 'Claro! Me conta o que você precisa.');
    const b3 = G(chat, 'left:36px;top:560px;max-width:600px;padding:26px 32px;background:#271942;border:2px solid #8B6CFF;border-radius:30px 30px 30px 6px;font-size:44px;font-weight:700;opacity:0', 'Pode ser site com WhatsApp?');
    const b4 = G(chat, 'right:36px;top:700px;max-width:660px;padding:26px 32px;background:#B7FF4A;color:#10101c;border-radius:30px 30px 6px 30px;font-size:44px;font-weight:800;opacity:0', 'Pode! Já anotei seu contato ✓');
    tl.fromTo(m, { opacity: 0 }, { opacity: 1, duration: 0.05 }, t0).to(m, { opacity: 0, duration: 0.12 }, CUTS[3] - 0.1);
    tl.fromTo(chat, { rotationY: 38, rotationX: -10, x: 240, scale: 0.8, opacity: 0, filter: 'blur(14px)' }, { rotationY: 5, rotationX: 4, x: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' }, t0);
    const pop = (e, at) => tl.fromTo(e, { opacity: 0, y: 40, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'back.out(2.4)' }, at);
    pop(b1, t0 + 0.15); tl.fromTo(typing, { opacity: 0 }, { opacity: 1, duration: 0.1 }, t0 + 0.4).set(typing, { opacity: 0 }, t0 + 0.58); pop(b2, t0 + 0.58); pop(b3, t0 + 0.8); pop(b4, t0 + 1.08);
    tl.to(chat, { rotationY: -2, duration: CUTS[3] - t0, ease: 'none' }, t0 + 0.5);
  }
  // ---------- 4) GESTÃO DE CLIENTES (CRM / funil) ----------
  { const m = mods[3], t0 = CUTS[3], cols = ['NOVO', 'EM CONTATO', 'FECHADO'];
    const board = G(m, 'left:60px;top:420px;width:960px;height:860px;opacity:0', '', 'glass');
    const colEls = cols.map((c, i) => { G(board, `left:${24 + i * 306}px;top:24px;width:290px;font-size:26px;color:${i === 2 ? '#B7FF4A' : '#CFC6EE'}`, c, 'pix'); return G(board, `left:${24 + i * 306}px;top:76px;width:290px;height:740px;border-radius:18px;background:rgba(16,12,28,.55);border:2px dashed rgba(139,108,255,.5)`); });
    const names = ['Studio Lua', 'Padaria Sol', 'Dra. Camila', 'Oficina Rocha', 'Barbearia 14'];
    const cardEls = names.map((n, i) => G(board, `left:${34}px;top:${96 + i * 128}px;width:270px;height:110px;opacity:0;padding:18px 20px;background:#271942;border:2px solid #8B6CFF;border-radius:16px`, `<div style="font-weight:800;font-size:30px">${n}</div><div class="pix" style="font-size:20px;color:var(--mist);margin-top:12px">cliente</div>`));
    tl.fromTo(m, { opacity: 0 }, { opacity: 1, duration: 0.05 }, t0).to(m, { opacity: 0, duration: 0.12 }, CUTS[4] - 0.1);
    tl.fromTo(board, { rotationX: 40, y: 200, scale: 0.8, opacity: 0, filter: 'blur(14px)' }, { rotationX: 6, y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' }, t0);
    cardEls.forEach((c, i) => tl.fromTo(c, { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: 0.28, ease: 'back.out(2)' }, t0 + 0.2 + i * 0.1));
    [[0, 1, 0.85], [1, 1, 1.1], [2, 2, 1.35], [3, 2, 1.55], [4, 1, 1.35]].forEach(([i, col, at]) => tl.to(cardEls[i], { x: col * 306, y: col === 2 ? `+=${0}` : 0, duration: 0.35, ease: 'power3.inOut' }, t0 + at));
    [2, 3].forEach((i) => tl.to(cardEls[i], { borderColor: '#B7FF4A', backgroundColor: 'rgba(183,255,74,.16)', boxShadow: '0 0 40px rgba(183,255,74,.5)', duration: 0.2 }, t0 + 1.7 + (i - 2) * 0.1));
  }
  // ---------- 5) PRESENÇA DIGITAL + recap ----------
  { const m = mods[4], t0 = CUTS[4];
    const map = G(m, 'left:90px;top:420px;width:900px;height:700px;overflow:hidden;opacity:0;background:#140f26;background-image:linear-gradient(rgba(139,108,255,.18) 2px,transparent 2px),linear-gradient(90deg,rgba(139,108,255,.18) 2px,transparent 2px);background-size:90px 90px', '', 'glass');
    const pin = G(map, 'left:430px;top:290px;width:40px;height:40px;border-radius:50%;background:#B7FF4A;box-shadow:0 0 40px #B7FF4A;opacity:0');
    const rg = [0, 1, 2].map(() => G(map, 'left:450px;top:310px;width:40px;height:40px;margin:-20px;border-radius:50%;border:4px solid #B7FF4A;opacity:0'));
    const lab = G(map, 'left:330px;top:350px;font-size:34px;font-weight:800;opacity:0', 'sua empresa', ''); const tiles = [0, 1, 2].map((i) => G(m, `left:${90 + i * 308}px;top:1160px;width:284px;height:170px;opacity:0;display:grid;place-items:center;font-size:30px;font-weight:800`, ['SITE', 'WHATSAPP', 'NO MAPA'][i], 'glass'));
    tl.fromTo(m, { opacity: 0 }, { opacity: 1, duration: 0.05 }, t0).to(m, { opacity: 0, scale: 0.7, filter: 'blur(14px)', duration: 0.3, ease: 'power3.in' }, CUTS[5] - 0.12);
    tl.fromTo(map, { rotationX: 40, y: 160, scale: 0.8, opacity: 0, filter: 'blur(14px)' }, { rotationX: 8, y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.55, ease: 'expo.out' }, t0);
    tl.fromTo(pin, { y: -500, opacity: 0, scale: 0.4 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'bounce.out' }, t0 + 0.5).fromTo(lab, { opacity: 0 }, { opacity: 1, duration: 0.2 }, t0 + 0.9);
    rg.forEach((r, i) => tl.fromTo(r, { opacity: 0.9, scale: 0.5 }, { opacity: 0, scale: 14, duration: 1.1, ease: 'power2.out', repeat: 1, repeatDelay: 0 }, t0 + 0.95 + i * 0.3));
    tiles.forEach((tt, i) => tl.fromTo(tt, { y: 100, opacity: 0, scale: 0.85 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, t0 + 1.0 + i * 0.12));
    // recap: sobe um flash e a tela "recolhe" para o centro (entrega para a revelação da marca)
    flash(tl, CUTS[5] - 0.02, { peak: 0.4, dur: 0.25, color: '#B7FF4A' });
  }
  const recap = el('div', 'abs', '', root); recap.style.cssText = 'left:0;top:0;width:1080px;height:1920px;opacity:0';
  const rt = buildLines(recap, ['TUDO', 'CONECTADO.'], { size: 150, width: 900, classes: ['', 'lime glow-l'] }); rt.root.style.cssText += ';position:absolute;left:90px;top:640px;width:900px';
  tl.fromTo(recap, { opacity: 0 }, { opacity: 1, duration: 0.05 }, CUTS[5]);
  slamIn(tl, rt.lines[0].chars, CUTS[5] + 0.02, { dur: 0.45, stagger: 0.03, from: 3 }); slamIn(tl, rt.lines[1].chars, CUTS[5] + 0.2, { dur: 0.5, stagger: 0.03, from: 3 });
  tl.to(rt.lines.flatMap((l) => l.chars), { scale: 2.4, opacity: 0, filter: 'blur(24px)', duration: 0.3, ease: 'power3.in', stagger: 0.01 }, CUTS[6] - 0.45);
  // títulos de módulo entram com impacto, no corte
  titles.forEach((tt, i) => { const t0 = CUTS[i];
    slamIn(tl, tt.L.lines[0].chars, t0 + 0.02, { dur: 0.45, stagger: 0.015, from: 3, y: -30 }); tl.fromTo(tt.bar, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'expo.out' }, t0 + 0.12);
    glitchBurst(tl, tt.L.lines[0].el, t0 + 0.35, 0.15, { seed: 50 + i, amp: 20 });
    CUTS[i + 1] && tl.to(tt.L.lines[0].chars, { opacity: 0, duration: 0.1 }, CUTS[i + 1] - 0.1);
  });
  CUTS.slice(0, 6).forEach((t, i) => flash(tl, t, { peak: i === 5 ? 0.0 : 0.45, dur: 0.18, color: i % 2 ? '#c9b8ff' : '#e6ffbf' }));
  flash(tl, S.end - S.start - 0.12, { peak: 1.0, dur: 0.2, color: '#ffffff' });

  return {
    id: 's5', ...S, three: { scene, camera }, dom: root, tl, transition: { mode: 1, dur: 0.3 },
    update(t) {
      const z = t * SPEED; camera.position.set(Math.sin(t * 0.7) * 0.5, Math.sin(t * 0.9) * 0.3, -z); camera.lookAt(Math.sin(t * 0.5) * 1.2, Math.sin(t * 0.8) * 0.6, -z - 10);
      const punch = CUTS.reduce((m, c) => Math.max(m, pulse(t, c, 0.35)), 0);
      camera.fov = 66 + punch * 16; camera.updateProjectionMatrix(); camera.rotation.z += Math.sin(t * 0.6) * 0.04 + punch * 0.05 * (hash(Math.floor(t * 2)) - 0.5);
      rings.forEach((r) => { const i = r.userData.i, d = 240, zz = -(((i * 6.7 - z) % d) + d) % d; r.position.set(0, 0, -z + zz * -1 - 0); r.position.z = camera.position.z - (((i * 6.7 - z) % d) + d) % d; r.rotation.z = t * 0.4 + i; r.material.opacity = 0.5 + 0.4 * punch; });
      floor.position.z = camera.position.z; ceil.position.z = camera.position.z; floor.userData.update(t); dust.u.uCenter.value.set(0, 0, camera.position.z - 30); dust.update(t, camera); glow.position.z = camera.position.z - 70;
    },
    post(t) { const punch = CUTS.reduce((m, c) => Math.max(m, pulse(t, c, 0.3)), 0); return { bloom: { strength: 0.45 + punch * 0.4, threshold: 0.72 }, final: { uCA: 0.8 + punch * 3.5, uGlitch: punch * 0.5 * (hash(Math.floor(t * 30)) > 0.5 ? 1 : 0), uExposure: 0.95 } }; }
  };
}
