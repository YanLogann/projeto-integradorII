import React from "react";
import { C, MR, MX, MY } from "./theme";

// A boca digital: uma abertura circular feita de anéis segmentados, dentes geométricos
// e um túnel de anéis que recua ao infinito. Sem nenhum traço humano.

type Props = {
  open: number; // 0 fechada, 1 totalmente aberta
  rot: number; // relógio de rotação (para congelar junto com a sucção)
  glow: number; // intensidade de luz 0..1.5
  f: number;
};

const ring = (r: number, dash: string, w: number, color: string, op: number, rotDeg: number, key: string) => (
  <circle
    key={key}
    r={r}
    fill="none"
    stroke={color}
    strokeWidth={w}
    strokeDasharray={dash}
    opacity={op}
    transform={`rotate(${rotDeg})`}
  />
);

const teeth = (n: number, rOut: number, len: number, wide: number, rotDeg: number, fill: string, op: number, key: string) => {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const a1 = a - (Math.PI / n) * wide;
    const a2 = a + (Math.PI / n) * wide;
    const ri = rOut - len;
    pts.push(
      `M${Math.cos(a1) * rOut},${Math.sin(a1) * rOut} L${Math.cos(a) * ri},${Math.sin(a) * ri} L${Math.cos(a2) * rOut},${Math.sin(a2) * rOut} Z`
    );
  }
  return <path key={key} d={pts.join(" ")} fill={fill} opacity={op} transform={`rotate(${rotDeg})`} />;
};

export const Mouth: React.FC<Props> = ({ open, rot, glow, f }) => {
  if (open <= 0.001) return null;
  const R = MR * (0.35 + 0.65 * open);
  const inner = R * 0.5 * open;
  const breath = 1 + Math.sin(f * 0.21) * 0.012 * open;

  // túnel: anéis que viajam para dentro (zoom infinito)
  const tunnel: React.ReactNode[] = [];
  const N = 9;
  for (let i = 0; i < N; i++) {
    const t = ((i / N + rot * 0.012) % 1 + 1) % 1; // 0 fora -> 1 centro
    const r = inner * Math.pow(1 - t, 1.8);
    if (r < 2) continue;
    tunnel.push(
      <polygon
        key={`t${i}`}
        points={Array.from({ length: 6 }, (_, k) => {
          const a = (k / 6) * Math.PI * 2 + t * 2.4 + rot * 0.01;
          return `${Math.cos(a) * r},${Math.sin(a) * r}`;
        }).join(" ")}
        fill="none"
        stroke={i % 3 === 0 ? C.violetHi : C.violet}
        strokeWidth={1.5 + (1 - t) * 2}
        opacity={0.15 + (1 - t) * 0.55}
      />
    );
  }

  return (
    <g transform={`translate(${MX} ${MY}) scale(${breath})`}>
      {/* halo */}
      <circle r={R * 1.9} fill="url(#mouthHalo)" opacity={0.85 * glow} />
      {/* anel externo de dados */}
      {ring(R * 1.18, "2 14", 2, C.violetHi, 0.55, rot * 0.35, "r0")}
      {ring(R * 1.1, "120 30 8 30", 3, C.violet, 0.7, -rot * 0.6, "r1")}
      {ring(R * 1.02, "1 6", 10, C.violetHi, 0.35, rot * 0.9, "r2")}
      {/* lábios geométricos: dentes em duas coroas contra-rotativas */}
      {teeth(28, R * 0.98, R * 0.22 * open, 0.62, rot * 1.1, C.deep, 1, "th0")}
      {teeth(28, R * 0.98, R * 0.22 * open, 0.62, rot * 1.1, "url(#toothGrad)", 0.9, "th0b")}
      {ring(R * 0.86, "60 12", 4, C.violetHi, 0.9, -rot * 1.4, "r3")}
      {teeth(20, R * 0.8, R * 0.2 * open, 0.5, -rot * 1.7, C.violet, 0.85, "th1")}
      {ring(R * 0.66, "4 4", 3, C.mist, 0.35, rot * 2.2, "r4")}
      {/* garganta */}
      <circle r={inner} fill={C.black} />
      <circle r={inner} fill="url(#throat)" />
      {tunnel}
      <circle r={inner} fill="none" stroke={C.violetHi} strokeWidth={3} opacity={0.9} />
      <circle r={inner + 7} fill="none" stroke={C.violet} strokeWidth={10} opacity={0.35} filter="url(#soft)" />
    </g>
  );
};

// Curvas de sucção: espirais que fluem para dentro da boca
export const SuctionCurves: React.FC<{ clock: number; amount: number }> = ({ clock, amount }) => {
  if (amount <= 0.01) return null;
  const paths: React.ReactNode[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const th0 = (i / n) * Math.PI * 2;
    const pts: string[] = [];
    for (let s = 0; s <= 40; s++) {
      const p = s / 40;
      const r = 1100 * Math.pow(1 - p, 1.35) + 20;
      const th = th0 + 3.2 * p * p + clock * 0.004;
      pts.push(`${(MX + r * Math.cos(th)).toFixed(1)},${(MY + r * Math.sin(th)).toFixed(1)}`);
    }
    paths.push(
      <polyline
        key={i}
        points={pts.join(" ")}
        fill="none"
        stroke={i % 4 === 0 ? C.violetHi : C.violet}
        strokeWidth={i % 4 === 0 ? 2.2 : 1.2}
        strokeDasharray="40 70"
        strokeDashoffset={-clock * 9}
        opacity={(i % 4 === 0 ? 0.5 : 0.28) * amount}
      />
    );
  }
  return <g>{paths}</g>;
};
