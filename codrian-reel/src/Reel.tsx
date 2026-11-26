import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/fonts';
import tl from './timeline.json';

// ---------- fonts (local files in public/fonts, from @fontsource/*) ----------
for (const w of ['400', '500', '700', '800']) {
  loadFont({family: 'DM Sans', url: staticFile(`fonts/dm-sans-latin-${w}-normal.woff2`), weight: w});
}
loadFont({family: 'Silkscreen', url: staticFile('fonts/silkscreen-latin-400-normal.woff2'), weight: '400'});

// ---------- brand tokens (read from codrian.com.br CSS) ----------
const C = {
  void: '#100C1C', deep: '#271942', ink: '#F4F1FF', mist: '#CFC6EE', muted: '#8E83B8',
  lime: '#B7FF4A', page: '#17122A',
};
const SANS = '"DM Sans", system-ui, sans-serif';
const PIXEL = 'Silkscreen, monospace';

// ---------- timing helpers ----------
const EASE = Easing.bezier(0.16, 1, 0.3, 1); // brand --ease
const IO = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ramp = (t: number, a: number, b: number, e = EASE) =>
  interpolate(t, [a, b], [0, 1], {...clamp, easing: e});
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const S = tl.stages;

export type ReelProps = {draft: boolean};

// ---------- camera ----------
type Cam = {t: number; fx: number; fy: number; s: number; rx: number; ry: number; sy: number};
// Zoom levels keep every letter inside a >=40px margin (site is 900 wide; text spans x 60..860).
const K: Cam[] = [
  {t: S.grid, fx: 450, fy: 940, s: 0.78, rx: 20, ry: -12, sy: 960},
  {t: S.type - 0.1, fx: 450, fy: 960, s: 0.88, rx: 11, ry: -5, sy: 960},
  {t: S.type + 0.7, fx: 450, fy: 860, s: 1.12, rx: 4, ry: 3, sy: 960},
  {t: S.color - 0.15, fx: 450, fy: 870, s: 1.16, rx: 2, ry: 2, sy: 960},
  {t: S.color + 0.7, fx: 450, fy: 975, s: 0.92, rx: -8, ry: 9, sy: 960},
  {t: S.photo - 0.15, fx: 450, fy: 975, s: 0.96, rx: -5, ry: 4, sy: 960},
  {t: S.photo + 0.75, fx: 450, fy: 1548, s: 1.2, rx: 5, ry: -3, sy: 960},
  {t: S.pullback, fx: 450, fy: 1548, s: 1.24, rx: 3, ry: -1, sy: 960},
  {t: S.reveal + 0.35, fx: 450, fy: 975, s: 0.6, rx: 2, ry: -9, sy: 1190},
  {t: S.cta, fx: 450, fy: 975, s: 0.62, rx: 4, ry: 8, sy: 1180},
];
const camAt = (t: number): Cam => {
  if (t <= K[0].t) return K[0];
  for (let i = 0; i < K.length - 1; i++) {
    const a = K[i], b = K[i + 1];
    if (t <= b.t) {
      const p = IO((t - a.t) / (b.t - a.t));
      return {t, fx: mix(a.fx, b.fx, p), fy: mix(a.fy, b.fy, p), s: mix(a.s, b.s, p),
        rx: mix(a.rx, b.rx, p), ry: mix(a.ry, b.ry, p), sy: mix(a.sy, b.sy, p)};
    }
  }
  return K[K.length - 1];
};

// ---------- small pieces ----------
const Word: React.FC<{t: number; at: number; children: React.ReactNode; color?: string; dur?: number}> =
  ({t, at, children, color, dur = 0.28}) => {
    const p = ramp(t, at - 0.04, at - 0.04 + dur);
    return (
      <span style={{display: 'inline-block', opacity: p, color,
        transform: `translateY(${(1 - p) * 0.35}em)`, filter: `blur(${(1 - p) * 10}px)`}}>{children}</span>
    );
  };

const Draw: React.FC<{p: number; x: number; y: number; w: number; h: number; r?: number; label?: string; o?: number}> =
  ({p, x, y, w, h, r = 18, label, o = 1}) => (
    <g opacity={o}>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={C.lime} strokeWidth={2.5}
        strokeOpacity={0.75} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
      {label && (
        <text x={x + 14} y={y - 12} fill={C.lime} fillOpacity={0.8 * p} fontFamily={PIXEL} fontSize={20}>{label}</text>
      )}
    </g>
  );

// Code-drawn "photo" of the fictional bakery (no generated imagery, no text inside it)
const Photo: React.FC<{t: number}> = ({t}) => {
  const kb = mix(1.12, 1.0, ramp(t, tl.photoSnap - 0.6, tl.photoSnap + 4, Easing.out(Easing.quad)));
  const bokeh = [[110, 120, 60], [640, 90, 80], [520, 210, 40], [250, 60, 34], [720, 260, 50], [380, 140, 26], [60, 300, 44]];
  return (
    <svg viewBox="0 0 780 600" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
      style={{transform: `scale(${kb})`}}>
      <defs>
        <radialGradient id="bg" cx="50%" cy="35%" r="80%">
          <stop offset="0" stopColor="#5a341a" /><stop offset="0.55" stopColor="#24140b" /><stop offset="1" stopColor="#0d0805" />
        </radialGradient>
        <linearGradient id="table" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2416" /><stop offset="1" stopColor="#140c07" />
        </linearGradient>
        <radialGradient id="loaf" cx="45%" cy="30%" r="75%">
          <stop offset="0" stopColor="#e0a463" /><stop offset="0.5" stopColor="#a8622c" /><stop offset="1" stopColor="#4a2610" />
        </radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="soft2"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <rect width="780" height="600" fill="url(#bg)" />
      {bokeh.map(([x, y, r], i) => (
        <circle key={i} cx={x + Math.sin(t * 0.6 + i) * 8} cy={y} r={r} fill="#ffb764"
          opacity={0.18 + 0.06 * Math.sin(t * 1.3 + i * 2)} filter="url(#soft)" />
      ))}
      <rect y="380" width="780" height="220" fill="url(#table)" />
      <ellipse cx="400" cy="470" rx="250" ry="34" fill="#000" opacity="0.55" filter="url(#soft)" />
      <g>
        <path d="M170 455 C170 330 290 268 400 268 C520 268 640 330 636 455 C560 478 250 480 170 455 Z" fill="url(#loaf)" />
        {[0, 1, 2].map(i => (
          <path key={i} d={`M${265 + i * 95} ${360 - (i === 1 ? 22 : 8)} q 48 -40 98 -6`} stroke="#f3cf9a"
            strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.85" filter="url(#soft2)" />
        ))}
        <path d="M200 400 C260 300 360 276 430 276" stroke="#ffd9a0" strokeWidth="5" fill="none" opacity="0.45" filter="url(#soft2)" />
      </g>
      <rect width="780" height="600" fill="url(#bg)" opacity="0.15" />
    </svg>
  );
};

// ---------- the website being built ----------
const W = 900, H = 1950;
const Site: React.FC<{t: number; frame: number}> = ({t}) => {
  const g = tl.gridLines, ty = tl.typeItems, co = tl.colorItems;
  const gp = (i: number) => ramp(t, g[i], g[i] + 0.55, IO);
  // rack focus: grid -> type -> photo
  const gridBlur = mix(10, 0, ramp(t, S.grid, S.grid + 0.6)) + 5 * ramp(t, S.type, S.type + 0.6) - 5 * ramp(t, S.pullback, S.reveal);
  const gridOp = mix(1, 0.45, ramp(t, S.type, S.type + 0.8)) * mix(1, 0.12, ramp(t, S.color, S.color + 1)) * (1 - ramp(t, S.pullback, S.reveal));
  const contentBlur = mix(14, 0, ramp(t, S.type, S.type + 0.7)) + 5 * ramp(t, S.photo, S.photo + 0.7) * (1 - ramp(t, S.pullback, S.pullback + 0.8));
  const bgP = ramp(t, co[0], co[0] + 0.9);
  const cardP = ramp(t, co[1], co[1] + 0.7);
  const tintP = ramp(t, co[2], co[2] + 0.6);
  const ign = ramp(t, co[3], co[3] + 0.5);
  const flare = Math.exp(-Math.max(0, t - co[3]) * 2.2) * (t >= co[3] ? 1 : 0);
  // photo snap
  const ph = ramp(t, tl.photoSnap - 0.6, tl.photoSnap, Easing.bezier(0.3, 0, 0.2, 1));
  const after = Math.max(0, t - tl.photoSnap);
  const settle = t >= tl.photoSnap ? Math.exp(-after * 7) * Math.sin(after * 30) * 0.018 : 0;
  // button
  const bIn = ramp(t, tl.buttonIn - 0.05, tl.buttonIn + 0.45);
  const pulse = tl.pulses.reduce((acc, p) => acc + (t >= p ? Math.exp(-(t - p) * 6) : 0), 0);
  const rings = tl.pulses.map(p => ({p: ramp(t, p, p + 0.9, Easing.out(Easing.cubic)), on: t >= p && t < p + 0.9}));
  const typeP = (i: number) => ramp(t, ty[i] - 0.05, ty[i] + 0.55);

  const layer = (z: number, blur = 0, extra: React.CSSProperties = {}): React.CSSProperties => ({
    position: 'absolute', inset: 0, transform: `translateZ(${z}px)`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined, ...extra,
  });

  const head = ['Pão de', 'fermentação', 'natural, todo', 'dia às 6h.'];
  return (
    <div style={{position: 'absolute', width: W, height: H, transformStyle: 'preserve-3d'}}>
      {/* page background */}
      <div style={layer(0, 0, {borderRadius: 88, overflow: 'hidden', opacity: bgP,
        background: `radial-gradient(120% 60% at 20% 0%, ${C.deep} 0%, ${C.page} 55%, #120e20 100%)`})} />
      {/* grid / wireframe */}
      <svg width={W} height={H} style={layer(10, gridBlur, {opacity: gridOp})}>
        {[60, 280, 500, 720, 840].map((x, i) => (
          <line key={x} x1={x} x2={x} y1={0} y2={H * gp(0)} stroke={C.lime} strokeOpacity={i === 0 || i === 4 ? 0.6 : 0.22} strokeWidth={2} />
        ))}
        <Draw p={gp(1)} x={60} y={60} w={780} h={90} label="NAV" />
        <Draw p={gp(2)} x={60} y={220} w={780} h={400} label="H1" />
        <Draw p={gp(3)} x={60} y={650} w={600} h={110} label="TXT" />
        <Draw p={gp(4)} x={60} y={820} w={780} h={600} r={40} label="IMG" />
        <Draw p={gp(5)} x={60} y={1480} w={780} h={120} r={60} label="CTA" />
        <Draw p={gp(6)} x={60} y={1680} w={375} h={200} r={30} label="INFO" />
        <Draw p={gp(7)} x={465} y={1680} w={375} h={200} r={30} />
      </svg>
      {/* info cards */}
      <div style={layer(30, contentBlur * 0.6)}>
        {[0, 1].map(i => (
          <div key={i} style={{position: 'absolute', left: 60 + i * 405, top: 1680, width: 375, height: 200, borderRadius: 30,
            background: `rgba(207,198,238,${0.07 * cardP})`, border: `2px solid rgba(207,198,238,${0.14 * cardP})`,
            opacity: typeP(3), padding: '34px 30px', boxSizing: 'border-box', fontFamily: SANS}}>
            <div style={{fontSize: 22, color: C.muted, fontWeight: 500, letterSpacing: '0.04em'}}>{i === 0 ? 'HOJE' : 'ONDE'}</div>
            <div style={{fontSize: 36, color: C.ink, fontWeight: 700, marginTop: 14, lineHeight: 1.1}}>
              {i === 0 ? '6h às 19h' : 'Centro, São Gabriel'}
            </div>
          </div>
        ))}
      </div>
      {/* typography */}
      <div style={layer(45, contentBlur, {fontFamily: SANS, color: C.ink, opacity: 1 - ramp(t, S.photo, S.photo + 0.45) * (1 - ramp(t, S.reveal - 0.1, S.reveal + 0.4))})}>
        {/* nav */}
        <div style={{position: 'absolute', left: 60, top: 60, width: 780, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', opacity: typeP(0),
            transform: `translateX(${(1 - typeP(0)) * -30}px)`}}>
            Casa Aurora<span style={{color: ign > 0 ? C.lime : C.ink, opacity: 0.4 + 0.6 * ign}}>.</span>
          </div>
          <div style={{display: 'flex', gap: 10, alignItems: 'center', opacity: typeP(3)}}>
            <div style={{width: 14, height: 14, borderRadius: 7, background: C.lime, opacity: ign,
              boxShadow: `0 0 ${18 * ign}px ${C.lime}`}} />
            <div style={{fontSize: 24, fontWeight: 500, color: C.mist}}>Aberto agora</div>
          </div>
        </div>
        {/* headline */}
        <div style={{position: 'absolute', left: 60, top: 232, width: 800, fontSize: 98, lineHeight: 0.98, fontWeight: 800, letterSpacing: '-0.045em'}}>
          {head.map((line, i) => {
            const p = ramp(t, ty[1] + i * 0.09, ty[1] + i * 0.09 + 0.6);
            const accent = i >= 2;
            return (
              <div key={i} style={{overflow: 'hidden', paddingBottom: 6}}>
                <div style={{transform: `translateY(${(1 - p) * 105}%)`, opacity: p,
                  color: accent ? `color-mix(in srgb, ${C.lime} ${tintP * 100}%, ${C.ink})` : C.ink}}>{line}</div>
              </div>
            );
          })}
          <div style={{height: 8, width: 360 * ign, background: C.lime, borderRadius: 4, marginTop: 14,
            boxShadow: `0 0 ${40 * flare}px ${C.lime}`}} />
        </div>
        {/* sub */}
        <div style={{position: 'absolute', left: 60, top: 672, width: 620, fontSize: 34, lineHeight: 1.3, color: C.mist, fontWeight: 400,
          opacity: typeP(2), transform: `translateY(${(1 - typeP(2)) * 24}px)`}}>
          Café, pães e doces feitos aqui, com farinha da região.
        </div>
      </div>
      {/* photo */}
      <div style={layer(mix(380, 90, ph), 0, {
        top: 820, left: 60, width: 780, height: 600, inset: undefined, borderRadius: 40, overflow: 'hidden',
        opacity: ramp(t, tl.photoSnap - 0.6, tl.photoSnap - 0.35),
        transform: `translateZ(${mix(380, 90, ph)}px) translateY(${(1 - ph) * 900}px) rotateX(${(1 - ph) * -28}deg) scale(${1 + settle})`,
        boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 0 2px rgba(244,241,255,0.08)`,
      })}>
        <Photo t={t} />
      </div>
      {/* WhatsApp button (link only, no automation promised) */}
      <div style={{position: 'absolute', left: 60, top: 1480, width: 780, height: 120, transform: `translateZ(130px)`,
        opacity: bIn}}>
        {rings.map((r, i) => r.on && (
          <div key={i} style={{position: 'absolute', inset: 0, borderRadius: 60, border: `3px solid ${C.lime}`,
            opacity: 0.7 * (1 - r.p), transform: `scale(${1 + 0.14 * r.p}, ${1 + 0.5 * r.p})`}} />
        ))}
        <div style={{position: 'absolute', inset: 0, borderRadius: 60, background: C.lime, display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 22, fontFamily: SANS, fontWeight: 700, fontSize: 40,
          color: C.void, letterSpacing: '-0.02em',
          transform: `scale(${mix(0.7, 1, bIn) * (1 + 0.035 * pulse)})`,
          boxShadow: `0 0 ${30 + 60 * pulse}px rgba(183,255,74,${0.25 + 0.35 * pulse})`}}>
          <svg width="46" height="46" viewBox="0 0 24 24">
            <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke={C.void} strokeWidth="2.2" strokeLinejoin="round" />
          </svg>
          Chamar no WhatsApp
        </div>
      </div>
    </div>
  );
};

// ---------- scenes ----------
const Hook: React.FC<{t: number}> = ({t}) => {
  if (t >= S.hookEnd) return null;
  const w = tl.words.hook;
  const push = mix(1, 1.07, ramp(t, 0, S.hookEnd, Easing.linear));
  const lines = [[0, 1], [2, 3], [4, 5]];
  return (
    <AbsoluteFill style={{background: C.void, justifyContent: 'center', padding: '0 72px'}}>
      <div style={{transform: `scale(${push})`, transformOrigin: '20% 50%', fontFamily: SANS, fontWeight: 800,
        fontSize: 176, lineHeight: 0.94, letterSpacing: '-0.055em', color: C.ink}}>
        {lines.map((ids, li) => (
          <div key={li}>
            {ids.map(i => (
              <React.Fragment key={i}>
                <Word t={t} at={w[i].s} color={li === 1 ? C.lime : undefined}>{w[i].w}</Word>{' '}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Caret: React.FC<{t: number}> = ({t}) => {
  if (t < S.blackEnd || t > S.grid + 0.5) return null;
  const blink = t < S.grid - 0.15 ? (Math.floor((t - S.blackEnd) / 0.42) % 2 === 0 ? 1 : 0.15) : 1;
  const grow = ramp(t, S.grid - 0.15, S.grid + 0.35, IO);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 10, height: mix(120, 1920, grow), background: C.lime, opacity: blink * (1 - ramp(t, S.grid + 0.1, S.grid + 0.5)),
        boxShadow: `0 0 40px ${C.lime}`}} />
    </AbsoluteFill>
  );
};

const Stage: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  if (t < S.grid - 0.05 || t > S.cta + 1) return null;
  const c = camAt(t);
  const exit = ramp(t, S.cta, S.cta + 0.7, Easing.bezier(0.7, 0, 0.84, 0));
  const bezel = ramp(t, S.pullback + 0.3, S.reveal + 0.2);
  const flash = t >= S.reveal ? Math.exp(-(t - S.reveal) * 2.5) : 0;
  const ringP = ramp(t, S.reveal, S.reveal + 1.4, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{perspective: 2600, opacity: 1 - exit, filter: exit > 0 ? `blur(${exit * 24}px)` : undefined}}>
      {/* glow behind the phone */}
      <div style={{position: 'absolute', left: 540 - 520, top: c.sy - 520, width: 1040, height: 1040, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(183,255,74,${0.1 * bezel + 0.25 * flash}) 0%, transparent 65%)`}} />
      {t >= S.reveal && (
        <div style={{position: 'absolute', left: 540 - 700 * ringP, top: c.sy - 700 * ringP, width: 1400 * ringP, height: 1400 * ringP,
          borderRadius: '50%', border: `3px solid rgba(183,255,74,${0.5 * (1 - ringP)})`}} />
      )}
      <div style={{position: 'absolute', left: 540, top: c.sy - exit * 500, width: 0, height: 0, transformStyle: 'preserve-3d',
        transform: `rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(${c.s})`}}>
        <div style={{position: 'absolute', left: -c.fx, top: -c.fy, width: W, height: H, transformStyle: 'preserve-3d'}}>
          {/* phone bezel */}
          <div style={{position: 'absolute', left: -26, top: -26, width: W + 52, height: H + 52, borderRadius: 112,
            background: '#0a0812', opacity: bezel, transform: 'translateZ(-20px)',
            boxShadow: `0 0 0 3px rgba(207,198,238,0.22), 0 60px 160px rgba(0,0,0,0.8)`}} />
          <div style={{position: 'absolute', left: W / 2 - 90, top: 22, width: 180, height: 48, borderRadius: 24, background: '#05040a',
            opacity: bezel, transform: 'translateZ(160px)'}} />
          <Site t={t} frame={frame} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Tagline: React.FC<{t: number}> = ({t}) => {
  if (t < S.reveal - 0.2 || t > S.cta + 0.8) return null;
  const w = tl.words.ready;
  const out = ramp(t, S.cta, S.cta + 0.5);
  return (
    <AbsoluteFill style={{padding: '210px 72px 0', fontFamily: SANS, opacity: 1 - out,
      transform: `translateY(${-out * 80}px)`}}>
      <Word t={t} at={w[0].s}><div style={{fontFamily: PIXEL, color: C.lime, fontSize: 34, letterSpacing: '0.08em', marginBottom: 24}}>PRONTO.</div></Word>
      <div style={{fontWeight: 800, fontSize: 90, lineHeight: 1, letterSpacing: '-0.05em', color: C.ink}}>
        <div>{[1, 2, 3].map(i => <React.Fragment key={i}><Word t={t} at={w[i].s}>{w[i].w}</Word>{' '}</React.Fragment>)}</div>
        <div>{[4, 5, 6].map(i => <React.Fragment key={i}><Word t={t} at={w[i].s} color={i === 6 ? C.lime : undefined}>{w[i].w}</Word>{' '}</React.Fragment>)}</div>
      </div>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{t: number}> = ({t}) => {
  if (t < S.cta) return null;
  const w = tl.words.cta;
  const handle = ramp(t, S.cta + 0.35, S.cta + 0.9);
  const drift = mix(1.02, 1, ramp(t, S.cta, S.end, Easing.out(Easing.quad)));
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', fontFamily: SANS, textAlign: 'center',
      transform: `scale(${drift}) translateY(-60px)`}}>
      <div style={{fontWeight: 800, fontSize: 118, letterSpacing: '-0.055em', color: C.ink, lineHeight: 1}}>
        {[0, 1, 2].map(i => <React.Fragment key={i}><Word t={t} at={w[i].s} color={i === 2 ? C.lime : undefined}>{w[i].w}</Word>{' '}</React.Fragment>)}
      </div>
      <div style={{fontWeight: 500, fontSize: 60, letterSpacing: '-0.02em', color: C.mist, marginTop: 36, lineHeight: 1.15, maxWidth: 900}}>
        {w.slice(3).map((x, i) => <React.Fragment key={i}><Word t={t} at={x.s}>{x.w}</Word>{' '}</React.Fragment>)}
      </div>
      <div style={{marginTop: 90, opacity: handle, transform: `translateY(${(1 - handle) * 30}px)`, display: 'flex', alignItems: 'center', gap: 18,
        padding: '22px 38px', borderRadius: 60, border: `2px solid rgba(183,255,74,0.5)`, fontFamily: PIXEL, fontSize: 34, color: C.lime}}>
        @codrian_ofc
      </div>
    </AbsoluteFill>
  );
};

// word-by-word captions for the build section (hook, tagline and CTA are already word-synced on screen)
const CAP_KEYS = ['zero', 'grid', 'type', 'color', 'photo'] as const;
type Wd = {w: string; s: number; e: number};
const chunks: Wd[][] = (() => {
  const out: Wd[][] = [];
  for (const k of CAP_KEYS) {
    let cur: Wd[] = [];
    for (const wd of tl.words[k]) {
      cur.push(wd);
      if (/[.,!?]$/.test(wd.w) || cur.length >= 4) { out.push(cur); cur = []; }
    }
    if (cur.length) out.push(cur);
  }
  return out;
})();

const Captions: React.FC<{t: number}> = ({t}) => {
  const idx = chunks.findIndex((c, i) => t >= c[0].s - 0.06 && t < Math.min(c[c.length - 1].e + 0.35, chunks[i + 1]?.[0].s - 0.06 || 1e9));
  if (idx < 0) return null;
  const c = chunks[idx];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1300, height: 420,
        background: 'linear-gradient(180deg, transparent, rgba(16,12,28,0.75) 45%, rgba(16,12,28,0.75) 70%, transparent)'}} />
      <div style={{position: 'absolute', left: 70, right: 70, top: 1440, textAlign: 'center', fontFamily: SANS, fontWeight: 700,
        fontSize: 66, letterSpacing: '-0.025em', lineHeight: 1.1, color: C.ink, textShadow: '0 4px 30px rgba(0,0,0,0.7)'}}>
        {c.map((wd, i) => {
          const active = t >= wd.s - 0.04 && t < wd.e + 0.05;
          return <React.Fragment key={i}><Word t={t} at={wd.s} dur={0.16} color={active ? C.lime : undefined}>{wd.w}</Word>{' '}</React.Fragment>;
        })}
      </div>
    </AbsoluteFill>
  );
};

const Grain: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.09}}>
    <svg width="1080" height="1920">
      <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 97} />
        <feColorMatrix type="saturate" values="0" /></filter>
      <rect width="1080" height="1920" filter="url(#g)" />
    </svg>
  </AbsoluteFill>
);

export const Reel: React.FC<ReelProps> = ({draft}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const black = t >= S.hookEnd && t < S.blackEnd;
  return (
    <AbsoluteFill style={{background: C.void, overflow: 'hidden'}}>
      <Audio src={staticFile('audio/mix.wav')} />
      {!black && (
        <>
          <Hook t={t} />
          <Caret t={t} />
          <Stage t={t} frame={frame} />
          <Tagline t={t} />
          <CTA t={t} />
          <Captions t={t} />
        </>
      )}
      <Grain frame={frame} />
      <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse 75% 60% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)'}} />
      {draft && (
        <div style={{position: 'absolute', top: 64, right: 56, fontFamily: PIXEL, fontSize: 26, color: C.ink, opacity: 0.45, letterSpacing: '0.1em'}}>
          RASCUNHO
        </div>
      )}
    </AbsoluteFill>
  );
};
