import React from "react";
import { spring } from "remotion";
import { facade, Piece, shapeOf } from "./City";
import { C, FPS, T } from "./theme";
import { clamp, eIn, eInOut, eOut, map, prog, suck } from "./util";

// A pequena empresa que resiste: puxada, conectada, desmontada e reconstruída em digital.

export const HERO = { x: 360, base: 1630, w: 360, h: 400, label: "PADARIA" };
const top = HERO.base - HERO.h;
export const HERO_SIGN = { x: HERO.x + HERO.w / 2, y: top + HERO.h * 0.15 };
const pieces: Piece[] = facade(HERO.x, HERO.base, HERO.w, HERO.h, HERO.label, "#241944", 1, false, 4242);
const HCX = HERO.x + HERO.w / 2;
const HCY = top + HERO.h / 2;

// profundidade de cada peça na vista explodida (2.5D)
const Z = pieces.map((_, i) => ((i * 53) % 7) / 6 - 0.5);

// Estrutura digital: projeção de um hipercubo girando (geometria impossível)
export const STRUCT = { x: 880, y: 1130, s: 86 };

const proj = (v: number[], a: number, b: number, w4: number) => {
  // rotação 4D no plano XW, depois 3D em Y e X
  let [x, y, z, w] = v;
  const cw = Math.cos(w4), sw = Math.sin(w4);
  [x, w] = [x * cw - w * sw, x * sw + w * cw];
  const k4 = 1 / (2.6 - w);
  x *= k4; y *= k4; z *= k4;
  const ca = Math.cos(a), sa = Math.sin(a);
  [x, z] = [x * ca - z * sa, x * sa + z * ca];
  const cb = Math.cos(b), sb = Math.sin(b);
  [y, z] = [y * cb - z * sb, y * sb + z * cb];
  const k3 = 1 / (3 - z);
  return [x * k3 * 3, y * k3 * 3, z];
};

const VERTS: number[][] = [];
for (let i = 0; i < 16; i++) VERTS.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
const EDGES: [number, number][] = [];
for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) {
  const d = i ^ j;
  if ((d & (d - 1)) === 0) EDGES.push([i, j]);
}

export const DigitalStructure: React.FC<{ f: number; clock: number }> = ({ f, clock }) => {
  const appear = prog(f, 200, 20, eOut);
  if (appear <= 0) return null;
  const glitch = f < 222 && f % 4 < 2 ? 6 : 0;
  const pulse = f >= T.pulse ? 1 + 0.35 * Math.exp(-(f - T.pulse) / 8) : 1;
  const P = VERTS.map((v) => proj(v, clock * 0.03, 0.5 + clock * 0.017, clock * 0.025));
  const s = STRUCT.s * appear * pulse;
  return (
    <g transform={`translate(${STRUCT.x + glitch} ${STRUCT.y})`} opacity={appear}>
      <circle r={s * 2.2} fill="url(#limeHalo)" opacity={0.5} />
      {EDGES.map(([a, b], i) => (
        <line
          key={i}
          x1={P[a][0] * s}
          y1={P[a][1] * s}
          x2={P[b][0] * s}
          y2={P[b][1] * s}
          stroke={C.lime}
          strokeWidth={i % 5 === 0 ? 2.6 : 1.4}
          opacity={0.55 + 0.45 * ((i % 3) / 2)}
        />
      ))}
      {P.map((p, i) => (
        <rect key={`v${i}`} x={p[0] * s - 3} y={p[1] * s - 3} width={6} height={6} fill={C.lime} />
      ))}
    </g>
  );
};

// Linha verde neon: da estrutura até a placa da empresa
export const linePath = `M${STRUCT.x},${STRUCT.y} C${STRUCT.x - 40},${STRUCT.y + 160} ${HERO_SIGN.x + 260},${HERO_SIGN.y - 160} ${HERO_SIGN.x + 150},${HERO_SIGN.y - 10} S ${HERO_SIGN.x + 60},${HERO_SIGN.y} ${HERO_SIGN.x},${HERO_SIGN.y}`;

export const LimeLink: React.FC<{ f: number; d: string; start: number; dur: number; width?: number; pulseAt?: number }> = ({ f, d, start, dur, width = 4, pulseAt }) => {
  const t = prog(f, start, dur, eOut);
  if (t <= 0) return null;
  const pulse = pulseAt !== undefined && f >= pulseAt ? Math.exp(-(f - pulseAt) / 9) : 0;
  const breathe = f > (pulseAt ?? 1e9) ? 0.5 + 0.5 * Math.sin((f - (pulseAt ?? 0)) * 0.35) : 0;
  const w = width * (1 + pulse * 1.6 + breathe * 0.25);
  // pacote de energia viajando pela linha após o pulso
  const travel = pulseAt !== undefined && f >= pulseAt ? ((f - pulseAt) / 22) % 1 : -1;
  return (
    <g>
      <path d={d} pathLength={1} fill="none" stroke={C.lime} strokeWidth={w * 4} strokeDasharray={`${t} 1`} opacity={0.18 + pulse * 0.3} filter="url(#soft)" strokeLinecap="round" />
      <path d={d} pathLength={1} fill="none" stroke={C.lime} strokeWidth={w} strokeDasharray={`${t} 1`} strokeLinecap="round" />
      <path d={d} pathLength={1} fill="none" stroke="#ffffff" strokeWidth={w * 0.35} strokeDasharray={`${t} 1`} opacity={0.8} strokeLinecap="round" />
      {travel >= 0 && (
        <path d={d} pathLength={1} fill="none" stroke="#ffffff" strokeWidth={w * 2.2} strokeDasharray={`0.04 1`} strokeDashoffset={-travel} strokeLinecap="round" filter="url(#soft)" />
      )}
    </g>
  );
};

export const Hero: React.FC<{ f: number }> = ({ f }) => {
  // 1) puxão da sucção (S3), congelado na conexão
  const fc = Math.min(f, T.connect);
  const pull = eIn(map(fc, [T.s3 + 5, T.connect], [0, 1]));
  const back = f >= T.pulse ? spring({ frame: f - T.pulse, fps: FPS, config: { damping: 11, stiffness: 120 } }) : 0;
  // 2) vista explodida e reconstrução (S4)
  const ex = f < T.rebuild ? prog(f, T.explode, 34, eOut) : 1 - prog(f, T.rebuild, 40, eInOut);
  const wire = prog(f, T.explode + 12, 30, eInOut);
  const jitter = f > T.s3 + 10 && f < T.connect ? Math.sin(f * 3.1) * 3 * pull : 0;

  const out: React.ReactNode[] = [];
  pieces.forEach((p, i) => {
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    const height = 1 - (p.y - top) / HERO.h;
    const k = p.kind === "sign" || p.kind === "label" ? 0.3 : p.kind === "awning" || p.kind === "cornice" ? 0.18 : 0.06 * height;
    const pp = k * pull * (1 - back);
    const s = suck(cx, cy, pp, 2.6);
    let x = s.x + jitter, y = s.y;
    let rot = pp * 90 * (i % 2 ? 1 : -1);
    let sc = 1;
    if (ex > 0) {
      const z = Z[i];
      x += (cx - HCX) * 0.55 * ex + z * 120 * ex;
      y += (cy - HCY) * 0.7 * ex - (p.kind === "body" ? 0 : 60 * ex);
      sc = 1 + z * 0.35 * ex;
      rot += z * 24 * ex;
    }
    const solid = 1 - wire;
    out.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc}) translate(${-cx} ${-cy})`}>
        {solid > 0.01 && shapeOf(p, "s", { op: solid })}
        {wire > 0.01 &&
          shapeOf(p, "w", {
            fill: p.kind === "label" ? C.lime : p.kind === "body" ? "url(#heroGrid)" : "rgba(16,12,28,0.6)",
            stroke: p.kind === "body" ? C.violetHi : C.lime,
            sw: p.kind === "body" ? 3 : 2,
            op: wire,
          })}
      </g>
    );
  });

  // varredura de transformação (scanline lime)
  const scanT = prog(f, 286, 40, eInOut);
  const scanY = top - 30 + (HERO.h + 60) * scanT;

  // moldura de navegador e pino de mapa (a empresa agora existe no digital)
  const frameT = prog(f, 395, 30, eOut);
  const pinS = f >= T.pin ? spring({ frame: f - T.pin, fps: FPS, config: { damping: 9, stiffness: 140 } }) : 0;
  const pinY = top - 70 - (1 - pinS) * 500;
  const ringT = f >= T.pin + 8 ? ((f - T.pin - 8) % 30) / 30 : -1;
  const shock = f >= T.pulse ? prog(f, T.pulse, 28, eOut) : 0;
  const fx = HERO.x - 34, fy = top - 110, fw = HERO.w + 68, fh = HERO.h + 140;

  return (
    <g>
      {/* aura lime após a conexão */}
      {f >= T.connect && <ellipse cx={HCX} cy={HCY} rx={HERO.w * 0.9} ry={HERO.h * 0.75} fill="url(#limeHalo)" opacity={map(f, [T.connect, T.pulse, T.pulse + 30, T.s5], [0.25, 0.25, 0.7, 0.45])} />}
      {out}
      {scanT > 0 && scanT < 1 && (
        <g>
          <rect x={HERO.x - 40} y={scanY - 2} width={HERO.w + 80} height={4} fill={C.lime} />
          <rect x={HERO.x - 40} y={scanY - 40} width={HERO.w + 80} height={40} fill="url(#scanGrad)" opacity={0.6} />
        </g>
      )}
      {frameT > 0 && (
        <g opacity={frameT}>
          <rect x={fx} y={fy} width={fw} height={fh} rx={22} fill="none" stroke={C.violetHi} strokeWidth={3} pathLength={1} strokeDasharray={`${frameT} 1`} />
          <line x1={fx} y1={fy + 46} x2={fx + fw * frameT} y2={fy + 46} stroke={C.violetHi} strokeWidth={2} />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={fx + 26 + i * 22} cy={fy + 23} r={6} fill={i === 2 ? C.lime : C.violetHi} opacity={frameT} />
          ))}
          <rect x={fx + 100} y={fy + 14} width={(fw - 130) * frameT} height={18} rx={9} fill={C.deep} />
        </g>
      )}
      {pinS > 0 && (
        <g transform={`translate(${HCX} ${pinY})`}>
          {ringT >= 0 && (
            <ellipse cx={0} cy={46} rx={20 + ringT * 120} ry={(20 + ringT * 120) * 0.3} fill="none" stroke={C.lime} strokeWidth={3} opacity={1 - ringT} />
          )}
          <path d="M0,46 C-10,30 -34,8 -34,-14 A34,34 0 1 1 34,-14 C34,8 10,30 0,46 Z" fill={C.lime} />
          <circle cx={0} cy={-14} r={12} fill={C.void} />
        </g>
      )}
      {shock > 0 && shock < 1 && (
        <circle cx={HERO_SIGN.x} cy={HERO_SIGN.y} r={30 + shock * 900} fill="none" stroke={C.lime} strokeWidth={10 * (1 - shock) + 1} opacity={1 - shock} />
      )}
    </g>
  );
};

export const clampUnused = clamp;
