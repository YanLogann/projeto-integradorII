import React from "react";
import { C, MX, MY, T } from "./theme";
import { clamp, eIn, eOut, map, prog, rng, suck } from "./util";

// ---------- modelo de fachada ----------

export type Piece = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "body" | "tile" | "sign" | "label" | "awning" | "window" | "door" | "cornice";
  fill: string;
  stroke?: string;
  sw?: number;
  label?: string;
  fs?: number;
  // ordem de desprendimento (0 = primeiro)
  order: number;
};

export type Building = {
  id: number;
  row: 0 | 1 | 2;
  x: number;
  base: number;
  w: number;
  h: number;
  label: string;
  fate: "whole" | "signs" | "vanish" | "stay";
  start: number; // frame em que a sucção pega este prédio
  pieces: Piece[];
};

const LABELS = [
  "PADARIA", "ÓTICA", "BARBEARIA", "AÇOUGUE", "FARMÁCIA", "BAZAR", "OFICINA",
  "SALÃO", "MERCADO", "PET SHOP", "GRÁFICA", "CHAVEIRO", "SAPATARIA", "ARMARINHO", "LANCHES", "PAPELARIA",
];

export const facade = (
  x: number, base: number, w: number, h: number, label: string, body: string, detail: number, tiles: boolean, seed: number
): Piece[] => {
  const r = rng(seed);
  const top = base - h;
  const P: Piece[] = [];
  P.push({ kind: "cornice", x: x - 6, y: top - 12, w: w + 12, h: 12, fill: C.deep, stroke: C.violet, sw: 2, order: 0 });
  if (tiles) {
    const cols = 3, rows = 4;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++)
        P.push({
          kind: "tile", x: x + (w / cols) * i, y: top + (h / rows) * j, w: w / cols + 0.5, h: h / rows + 0.5,
          fill: body, stroke: C.violet, sw: 1, order: 3 + j + r() * 0.8,
        });
  } else {
    P.push({ kind: "body", x, y: top, w, h, fill: body, stroke: C.violet, sw: 2, order: 6 });
  }
  if (detail > 0) {
    const sy = top + h * 0.07;
    P.push({ kind: "sign", x: x + w * 0.08, y: sy, w: w * 0.84, h: h * 0.16, fill: C.void, stroke: C.violetHi, sw: 2, order: 0.5 });
    P.push({ kind: "label", x: x + w * 0.08, y: sy, w: w * 0.84, h: h * 0.16, fill: C.mist, label, fs: Math.min(h * 0.075, (w * 0.8) / (label.length * 0.95)), order: 0.6 });
    const ay = top + h * 0.3;
    const stripes = 6;
    for (let i = 0; i < stripes; i++)
      P.push({
        kind: "awning", x: x + (w / stripes) * i, y: ay, w: w / stripes + 0.5, h: h * 0.08,
        fill: i % 2 ? C.violet : C.deep, order: 1 + r() * 0.6,
      });
    P.push({ kind: "window", x: x + w * 0.1, y: top + h * 0.48, w: w * 0.44, h: h * 0.3, fill: "url(#glass)", stroke: C.violetHi, sw: 1.5, order: 2 + r() * 0.5 });
    P.push({ kind: "door", x: x + w * 0.62, y: top + h * 0.48, w: w * 0.26, h: h * 0.52, fill: C.black, stroke: C.violet, sw: 1.5, order: 2.4 + r() * 0.5 });
  } else {
    // prédios distantes: só janelas
    for (let j = 0; j < 3; j++)
      P.push({ kind: "window", x: x + w * 0.18, y: top + h * (0.18 + j * 0.25), w: w * 0.64, h: h * 0.1, fill: C.violet, order: 1 + j * 0.3 });
  }
  return P;
};

export const buildCity = (): Building[] => {
  const r = rng(7);
  const B: Building[] = [];
  let id = 0;
  // fileira distante: some inteira, escalonada
  let x = -30;
  while (x < 1100) {
    const w = 80 + r() * 70;
    const h = 160 + r() * 200;
    B.push({ id: id++, row: 0, x, base: 1215, w, h, label: "", fate: "whole", start: 60 + r() * 150, pieces: [] });
    x += w + 6 + r() * 14;
  }
  // fileira do meio: placas arrancadas, uma empresa some por completo
  x = -50;
  let k = 0;
  while (x < 1100) {
    const w = 150 + r() * 70;
    const h = 250 + r() * 130;
    const fate = k === 3 ? "vanish" : "signs";
    B.push({ id: id++, row: 1, x, base: 1450, w, h, label: LABELS[k % LABELS.length], fate, start: fate === "vanish" ? 92 : 55 + r() * 120, pieces: [] });
    x += w + 10 + r() * 16;
    k++;
  }
  // primeiro plano (fora o herói): resistem e serão conectadas no fim
  B.push({ id: id++, row: 2, x: -60, base: 1800, w: 300, h: 470, label: "SALÃO", fate: "stay", start: 9999, pieces: [] });
  B.push({ id: id++, row: 2, x: 820, base: 1800, w: 320, h: 500, label: "OFICINA", fate: "stay", start: 9999, pieces: [] });

  for (const b of B) {
    const body = b.row === 0 ? "#1a1230" : b.row === 1 ? "#1d1436" : "#21173d";
    b.pieces = facade(b.x, b.base, b.w, b.h, b.label, body, b.row === 0 ? 0 : 1, b.fate === "whole" || b.fate === "vanish", b.id * 13 + 1);
  }
  return B;
};

// ---------- renderização ----------

export const shapeOf = (p: Piece, key?: string | number, override?: Partial<Piece> & { op?: number }) => {
  const q = { ...p, ...override };
  if (q.kind === "label")
    return (
      <text
        key={key}
        x={q.x + q.w / 2}
        y={q.y + q.h / 2 + (q.fs ?? 20) * 0.36}
        textAnchor="middle"
        fontFamily="Silkscreen"
        fontSize={q.fs}
        fill={q.fill}
        opacity={override?.op ?? 1}
      >
        {q.label}
      </text>
    );
  if (q.kind === "awning") {
    const d = `M${q.x},${q.y} h${q.w} l${q.w * 0.08},${q.h} h${-q.w * 1.16} Z`;
    return <path key={key} d={d} fill={q.fill} opacity={override?.op ?? 1} />;
  }
  return (
    <rect
      key={key}
      x={q.x}
      y={q.y}
      width={q.w}
      height={q.h}
      fill={q.fill}
      stroke={q.stroke}
      strokeWidth={q.sw}
      opacity={override?.op ?? 1}
    />
  );
};

const isLoose = (b: Building, p: Piece) =>
  b.fate === "whole" || b.fate === "vanish" || (b.fate === "signs" && ["sign", "label", "awning", "cornice"].includes(p.kind));

// Estado de um item na sucção: congela em T.connect, explode para fora após T.pulse
export const flight = (f: number, start: number, dur: number) => {
  const clock = Math.min(f, T.connect);
  const raw = clamp((clock - start) / dur);
  const p = eIn(raw) * 0.96 + raw * 0.04;
  const frozen = f >= T.connect && raw > 0 && raw < 1;
  const blast = frozen ? prog(f, T.pulse, 26, eOut) : 0;
  return { raw, p, frozen, blast };
};

type Ghost = { x: number; y: number; rot: number; s: number; op: number };

const piecePose = (cx: number, cy: number, p: number, spin: number, dir: number, blast: number): Ghost => {
  const q = suck(cx, cy, p, spin);
  let x = q.x, y = q.y;
  if (blast > 0) {
    const a = Math.atan2(y - MY, x - MX);
    x += Math.cos(a) * 260 * blast;
    y += Math.sin(a) * 260 * blast;
  }
  return {
    x, y,
    rot: dir * p * 540,
    s: (1 - p * 0.92) * (1 - blast * 0.5),
    op: (q.r < 30 ? q.r / 30 : 1) * (1 - blast),
  };
};

export const CityRow: React.FC<{ f: number; buildings: Building[]; row: 0 | 1 | 2; dim: number; connectT?: number }> = ({ f, buildings, row, dim, connectT = 0 }) => {
  const still: React.ReactNode[] = [];
  const flying: React.ReactNode[] = [];
  const clock = Math.min(f, T.connect);

  for (const b of buildings) {
    if (b.row !== row) continue;
    // estiramento antes de arrancar: o prédio se inclina para a boca
    const pre = b.fate === "stay" ? 0 : map(clock, [b.start - 30, b.start + 8], [0, 1]);
    const lean = ((MX - (b.x + b.w / 2)) / 540) * 0.35 * eIn(pre);
    const stretch = 1 + 0.18 * eIn(pre) * (b.fate === "signs" ? 0.3 : 1);
    const tf = `translate(${b.x + b.w / 2} ${b.base}) matrix(1 0 ${-lean} 1 0 0) scale(1 ${stretch}) translate(${-(b.x + b.w / 2)} ${-b.base})`;
    const stay: React.ReactNode[] = [];
    b.pieces.forEach((p, i) => {
      const loose = isLoose(b, p);
      if (!loose) {
        stay.push(shapeOf(p, i));
        return;
      }
      const start = b.start + p.order * (b.fate === "vanish" ? 7 : 5);
      const dur = 38 + ((b.id * 7 + i * 3) % 14);
      const fl = flight(f, start, dur);
      if (fl.raw <= 0) {
        stay.push(shapeOf(p, i));
        return;
      }
      if (fl.raw >= 1 && !fl.frozen) return;
      // origem já com a inclinação/estiramento atuais, para não haver salto
      const px = b.x + b.w / 2;
      const ry = (p.y + p.h / 2 - b.base) * stretch;
      const cx = px + (p.x + p.w / 2 - px) - lean * ry, cy = b.base + ry;
      const ocx = p.x + p.w / 2, ocy = p.y + p.h / 2;
      const dir = (b.id + i) % 2 ? 1 : -1;
      const spin = 2.4 + ((i * 37) % 10) / 10;
      // motion blur: fantasmas ao longo da trajetória
      const ghosts = fl.frozen ? [0] : [3, 2, 1, 0];
      ghosts.forEach((g) => {
        const pose = piecePose(cx, cy, Math.max(0, fl.p - g * 0.035), spin, dir, fl.blast);
        if (pose.op <= 0.01) return;
        flying.push(
          <g
            key={`${b.id}-${i}-${g}`}
            transform={`translate(${pose.x} ${pose.y}) rotate(${pose.rot}) scale(${pose.s}) translate(${-ocx} ${-ocy})`}
            opacity={pose.op * (g === 0 ? 1 : 0.22 / g)}
          >
            {shapeOf(p, 0, fl.frozen && fl.blast > 0 ? { stroke: C.lime, sw: 2 } : undefined)}
          </g>
        );
      });
    });
    const lit = b.fate === "stay" ? connectT : 0;
    still.push(
      <g key={b.id} transform={tf}>
        {stay}
        {lit > 0 && (
          <rect x={b.x} y={b.base - b.h} width={b.w} height={b.h} fill="none" stroke={C.violetHi} strokeWidth={3} opacity={lit} filter="url(#soft)" />
        )}
      </g>
    );
  }
  return (
    <>
      <g opacity={dim}>{still}</g>
      <g>{flying}</g>
    </>
  );
};

// ---------- detritos: telefones, cartões, vigas ----------

type Debris = { kind: "phone" | "card" | "beam"; x: number; y: number; start: number; dur: number; spin: number; dir: number; s: number };

export const buildDebris = (): Debris[] => {
  const r = rng(99);
  const D: Debris[] = [];
  for (let i = 0; i < 46; i++) {
    const kind = (["phone", "card", "card", "beam"] as const)[i % 4];
    D.push({
      kind,
      x: r() * 1080,
      y: 1150 + r() * 420,
      start: 48 + r() * 185,
      dur: 30 + r() * 30,
      spin: 2 + r() * 2,
      dir: r() > 0.5 ? 1 : -1,
      s: 0.8 + r() * 0.7,
    });
  }
  return D;
};

const debrisShape = (k: Debris["kind"], frozenLit: boolean) => {
  const st = frozenLit ? C.lime : C.violetHi;
  if (k === "phone")
    return (
      <g>
        <path d="M-34,-10 q0,-16 16,-16 h36 q16,0 16,16 v6 h-16 v-6 h-36 v6 h-16 Z" fill={C.deep} stroke={st} strokeWidth={2} />
        <rect x={-24} y={-2} width={48} height={30} rx={6} fill={C.void} stroke={st} strokeWidth={2} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={-14 + i * 10} y={6} width={6} height={6} fill={st} />
        ))}
      </g>
    );
  if (k === "card")
    return (
      <g>
        <rect x={-38} y={-22} width={76} height={44} fill={C.ink} />
        <rect x={-30} y={-12} width={30} height={5} fill={C.violet} />
        <rect x={-30} y={2} width={52} height={3} fill={C.muted} />
        <rect x={-30} y={10} width={40} height={3} fill={C.muted} />
      </g>
    );
  return <rect x={-70} y={-5} width={140} height={10} fill={C.deep} stroke={st} strokeWidth={2} />;
};

export const DebrisLayer: React.FC<{ f: number; debris: Debris[] }> = ({ f, debris }) => {
  const out: React.ReactNode[] = [];
  debris.forEach((d, i) => {
    const fl = flight(f, d.start, d.dur);
    if (fl.raw <= 0 || (fl.raw >= 1 && !fl.frozen)) return;
    const ghosts = fl.frozen ? [0] : [3, 2, 1, 0];
    ghosts.forEach((g) => {
      const pose = piecePose(d.x, d.y, Math.max(0, fl.p - g * 0.04), d.spin, d.dir, fl.blast);
      const appear = clamp(fl.raw * 8);
      if (pose.op <= 0.01) return;
      out.push(
        <g key={`${i}-${g}`} transform={`translate(${pose.x} ${pose.y}) rotate(${pose.rot + d.dir * 30}) scale(${pose.s * d.s})`} opacity={pose.op * appear * (g === 0 ? 1 : 0.2 / g)}>
          {debrisShape(d.kind, fl.blast > 0)}
        </g>
      );
    });
  });
  return <g>{out}</g>;
};

// ---------- partículas procedurais (rastros) ----------

type Particle = { x: number; y: number; start: number; dur: number; spin: number; w: number; c: string };

export const buildParticles = (): Particle[] => {
  const r = rng(2024);
  const P: Particle[] = [];
  for (let i = 0; i < 300; i++) {
    const edge = r();
    // nascem na cidade e nas bordas do quadro
    const x = edge < 0.7 ? r() * 1080 : r() < 0.5 ? -40 : 1120;
    const y = edge < 0.7 ? 1050 + r() * 700 : 300 + r() * 1300;
    P.push({
      x, y,
      start: 18 + r() * 222,
      dur: 22 + r() * 34,
      spin: 2.2 + r() * 2.4,
      w: 1 + r() * 3,
      c: r() < 0.12 ? C.ink : r() < 0.6 ? C.violetHi : C.violet,
    });
  }
  return P;
};

export const ParticleLayer: React.FC<{ f: number; particles: Particle[] }> = ({ f, particles }) => {
  const out: React.ReactNode[] = [];
  particles.forEach((pt, i) => {
    const fl = flight(f, pt.start, pt.dur);
    if (fl.raw <= 0 || (fl.raw >= 1 && !fl.frozen)) return;
    const a = piecePose(pt.x, pt.y, fl.p, pt.spin, 1, fl.blast);
    const b = piecePose(pt.x, pt.y, Math.max(0, fl.p - (fl.frozen ? 0.004 : 0.07)), pt.spin, 1, fl.blast);
    const op = a.op * clamp(fl.raw * 6);
    if (op <= 0.01) return;
    out.push(
      <line
        key={i}
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={fl.blast > 0 ? C.lime : pt.c}
        strokeWidth={pt.w * (fl.frozen ? 1.6 : 1)}
        strokeLinecap="round"
        opacity={op}
      />
    );
  });
  return <g>{out}</g>;
};
