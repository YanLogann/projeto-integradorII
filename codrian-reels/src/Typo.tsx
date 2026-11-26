import React from "react";
import { C } from "./theme";
import { clamp, eOut, map, prog } from "./util";

// Tipografia cinética: palavras batem com escala, borrão e separação cromática.

export type Word = { t: string; at: number; color?: string };
export type Line = { words: Word[]; size: number; tracking?: number };

type Props = {
  f: number;
  lines: Line[];
  x: number;
  y: number;
  align: "left" | "right" | "center";
  out: number; // frame de saída
  outMode?: "suck" | "cut" | "fade";
  lineGap?: number;
};

const slam = (f: number, at: number) => {
  const t = prog(f, at, 9, eOut);
  const s = 1 + (1 - t) * 0.9;
  const blur = (1 - t) * 14;
  const op = clamp((f - at + 1) / 3);
  const split = Math.max(0, 1 - (f - at) / 10) * 14;
  return { s, blur, op, split };
};

export const KineticText: React.FC<Props> = ({ f, lines, x, y, align, out, outMode = "cut", lineGap = 0.92 }) => {
  if (f >= out + 14) return null;
  const o = f >= out ? prog(f, out, 12) : 0;
  let yy = y;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        transformOrigin: `${x}px ${y + 150}px`,
        transform: outMode === "suck" && o > 0 ? `translate(${(560 - x) * o * o}px, ${(760 - y - 150) * o * o}px) rotate(${o * o * 50}deg) scale(${1 - o * 0.85})` : undefined,
      }}
    >
      {lines.map((ln, li) => {
        const top = yy;
        yy += ln.size * lineGap;
        return (
          <div
            key={li}
            style={{
              position: "absolute",
              top,
              left: align === "left" ? x : align === "center" ? 0 : undefined,
              right: align === "right" ? 1080 - x : align === "center" ? 0 : undefined,
              textAlign: align,
              fontFamily: "DM Sans",
              fontWeight: 700,
              fontSize: ln.size,
              lineHeight: 1,
              letterSpacing: ln.tracking ?? -0.045 * ln.size,
              whiteSpace: "nowrap",
            }}
          >
            {ln.words.map((w, wi) => {
              if (f < w.at)
                return (
                  <span key={wi} style={{ display: "inline-block", opacity: 0, marginRight: wi < ln.words.length - 1 ? ln.size * 0.22 : 0 }}>
                    {w.t}
                  </span>
                );
              const a = slam(f, w.at);
              const exitY = 0;
              const exitS = 1;
              const exitOp = outMode === "fade" || outMode === "suck" ? 1 - o : o > 0 ? 0 : 1;
              const color = w.color ?? C.ink;
              return (
                <span
                  key={wi}
                  style={{
                    display: "inline-block",
                    transform: `translateY(${exitY}px) scale(${a.s * exitS})`,
                    transformOrigin: align === "right" ? "right bottom" : "left bottom",
                    filter: a.blur > 0.3 ? `blur(${a.blur}px)` : undefined,
                    opacity: a.op * exitOp,
                    color,
                    textShadow:
                      a.split > 0.3
                        ? `${a.split}px 0 0 ${C.violet}, ${-a.split}px 0 0 ${C.lime}`
                        : `0 0 40px rgba(16,12,28,0.9)`,
                    marginRight: wi < ln.words.length - 1 ? ln.size * 0.22 : 0,
                  }}
                >
                  {w.t}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// Legenda queimada (para falas que não aparecem como texto cinético)
export const Caption: React.FC<{ f: number; text: string; from: number; to: number; y: number }> = ({ f, text, from, to, y }) => {
  const op = map(f, [from, from + 4, to - 4, to], [0, 1, 1, 0]);
  if (op <= 0) return null;
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", opacity: op }}>
      <span
        style={{
          fontFamily: "DM Sans",
          fontWeight: 500,
          fontSize: 40,
          color: C.ink,
          background: "rgba(16,12,28,0.78)",
          padding: "10px 22px",
          borderRadius: 10,
          border: `1px solid rgba(139,108,255,0.38)`,
        }}
      >
        {text}
      </span>
    </div>
  );
};
