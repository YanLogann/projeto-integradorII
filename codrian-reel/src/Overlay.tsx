import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {C, T, DURATION, outExpo, outCubic, inOut, ramp, clamp01} from './brand';
import {LETTERS, VIEWBOX, DOT} from './logoPaths';
import {camAt, FOV, HERO_TOP} from './City';

const W = 1080;
const H = 1920;

type Cap = {from: number; to: number; lines: string[]; accent: string[]};
// Legendas queimadas (o roteiro)
export const CAPTIONS: Cap[] = [
  {from: 2, to: 86, lines: ['Alguém procurou', 'o que você vende.'], accent: ['procurou']},
  {from: 92, to: 222, lines: ['Achou três empresas', 'perto. Nenhuma', 'era a sua.'], accent: ['Nenhuma']},
  {from: 232, to: 326, lines: ['Sem site, quem', 'te procura não', 'te encontra.'], accent: ['encontra.']},
  {from: 336, to: 458, lines: ['A Codrian cria', 'o site da sua', 'empresa.'], accent: ['site']},
  {from: 476, to: 562, lines: ['Quem procura,', 'encontra você.'], accent: ['você.']},
];

const Caption: React.FC<{c: Cap; frame: number}> = ({c, frame}) => {
  if (frame < c.from || frame > c.to + 8) return null;
  let wi = 0;
  const out = ramp(frame, c.to, c.to + 8);
  return (
    <div
      style={{
        position: 'absolute',
        left: 72,
        right: 72,
        top: 1130,
        fontFamily: 'DM Sans',
        fontWeight: 700,
        fontSize: 104,
        lineHeight: 1.02,
        letterSpacing: '-0.045em',
        color: C.ink,
        opacity: 1 - out,
        filter: `blur(${out * 8}px)`,
      }}
    >
      {c.lines.map((ln, li) => (
        <div key={li} style={{whiteSpace: 'nowrap'}}>
          {ln.split(' ').map((w, k) => {
            const i = wi++;
            const p = outExpo(ramp(frame, c.from + i * 3, c.from + i * 3 + 14));
            return (
              <span
                key={k}
                style={{
                  display: 'inline-block',
                  marginRight: '0.24em',
                  opacity: p,
                  transform: `translateY(${(1 - p) * 40}px)`,
                  filter: `blur(${(1 - p) * 12}px)`,
                  color: c.accent.includes(w) ? C.violetHi : C.ink,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// projeta o ponto 3D na tela para o logo nascer exatamente dele
function projectDot(frame: number) {
  const {pos, tgt} = camAt(frame);
  const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 200);
  cam.position.set(...pos);
  cam.lookAt(...tgt);
  cam.updateMatrixWorld();
  const v = new THREE.Vector3(0, HERO_TOP, 0).project(cam);
  const dist = cam.position.distanceTo(new THREE.Vector3(0, HERO_TOP, 0));
  const pxPerUnit = H / (2 * dist * Math.tan(((FOV / 2) * Math.PI) / 180));
  return {x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, pxPerUnit};
}

const LOGO_W = 780;
const VB = VIEWBOX.split(' ').map(Number);
const S = LOGO_W / VB[2];
const LOGO_H = VB[3] * S;

const Logo: React.FC<{frame: number}> = ({frame}) => {
  const start = T.declare + 8;
  if (frame < start - 2) return null;
  // logo fixo e centralizado: nada segue a câmera, então não há corte nem vai e volta
  const dotX = (DOT.cx - VB[0]) * S;
  const dotY = (DOT.cy - VB[1]) * S;
  const left = (W - LOGO_W) / 2;
  const top = 760;
  const gone = ramp(frame, T.loopStart, T.loopStart + 18);
  const n = LETTERS.length;
  // o ponto sai do prédio (posição 3D projetada no quadro de início) e desliza até o lugar dele no logo
  const pr0 = projectDot(start);
  const r3d = 0.16 * pr0.pxPerUnit;
  const rLogo = DOT.r * S;
  const glide = inOut(ramp(frame, start, start + 18));
  const dx = pr0.x - left + (dotX - (pr0.x - left)) * glide;
  const dy = pr0.y - top + (dotY - (pr0.y - top)) * glide;
  const r = r3d + (rLogo - r3d) * outExpo(ramp(frame, start, start + 20));
  const dotGone = ramp(frame, DURATION - 40, DURATION - 22);
  const rings = frame > start + 18 && frame < T.loopStart + 10 ? [0, 1, 2] : [];
  return (
    <div style={{position: 'absolute', left, top, width: LOGO_W, height: LOGO_H}}>
      <svg width={LOGO_W} height={LOGO_H} viewBox={VIEWBOX} style={{overflow: 'visible'}}>
        {LETTERS.map((d, i) => {
          // direita para a esquerda, a partir do ponto: 85 ms entre letras, 950 ms cada
          const order = n - 1 - i;
          const s0 = start + 14 + order * 2.55;
          const p = outExpo(ramp(frame, s0, s0 + 28.5));
          const back = outExpo(ramp(frame, T.loopStart + (n - 1 - order) * 1.6, T.loopStart + (n - 1 - order) * 1.6 + 14));
          const vis = p * (1 - back);
          const em = 730;
          return (
            <path
              key={i}
              d={d}
              fill={C.ink}
              opacity={vis}
              transform={`translate(${(1 - vis) * 0.5 * em} ${(1 - vis) * 0.1 * em})`}
              style={{filter: `blur(${(1 - vis) * 14}px)`}}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: dx - r,
          top: dy - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          background: C.lime,
          boxShadow: `0 0 32px 0 rgba(183,255,74,0.45)`,
          opacity: (frame < start ? 0 : 1) * (1 - dotGone),
        }}
      />
      {rings.map((k) => {
        const u = (((frame - start - 18) / 45 + k / 3) % 1 + 1) % 1;
        const R = rLogo + u * 150;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: dotX - R,
              top: dotY - R,
              width: R * 2,
              height: R * 2,
              borderRadius: '50%',
              border: `3px solid ${k === 0 ? C.lime : C.violetHi}`,
              opacity: (1 - u) * (k === 0 ? 0.8 : 0.5) * (1 - gone),
            }}
          />
        );
      })}
      {/* assinatura em duas linhas */}
      {['Sites que colocam', 'sua empresa no mapa.'].map((ln, i) => {
        const s0 = start + 40 + i * 18;
        const p = outCubic(ramp(frame, s0, s0 + 25.5));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 6,
              top: LOGO_H + 56 + i * 66,
              fontFamily: 'DM Sans',
              fontWeight: 500,
              fontSize: 58,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: C.mist,
              whiteSpace: 'nowrap',
              opacity: p * (1 - gone),
              transform: `translateY(${(1 - p) * 0.7 * 64}px)`,
              filter: `blur(${(1 - p) * 6}px)`,
            }}
          >
            {ln}
          </div>
        );
      })}
    </div>
  );
};

const Handle: React.FC<{frame: number}> = ({frame}) => {
  const s0 = T.declare + 96;
  const p = outExpo(ramp(frame, s0, s0 + 16)) * (1 - ramp(frame, T.loopStart, T.loopStart + 14));
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 1420,
        display: 'flex',
        justifyContent: 'center',
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
      }}
    >
      <div
        style={{
          fontFamily: 'DM Sans',
          fontWeight: 700,
          fontSize: 50,
          letterSpacing: '-0.02em',
          color: C.ink,
          background: C.violet,
          borderRadius: 999,
          padding: '22px 46px',
        }}
      >
        Siga @codrian_ofc
      </div>
    </div>
  );
};

// Rótulo do ping (único uso de Silkscreen na peça)
const PingLabel: React.FC<{frame: number}> = ({frame}) => {
  const a = T.connectEnd + 30;
  const b = T.impact + 60;
  if (frame < a || frame > b + 10) return null;
  const p = outExpo(ramp(frame, a, a + 14)) * (1 - ramp(frame, b, b + 10));
  const pr = projectDot(frame);
  return (
    <div
      style={{
        position: 'absolute',
        left: pr.x,
        top: pr.y - 120,
        transform: `translate(-50%, ${(1 - p) * 20}px)`,
        opacity: p,
        fontFamily: 'Silkscreen',
        fontSize: 34,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: frame >= T.impact ? C.lime : C.mist,
        background: 'rgba(16,12,28,0.85)',
        border: `2px solid ${frame >= T.impact ? 'rgba(183,255,74,0.5)' : 'rgba(142,131,184,0.5)'}`,
        padding: '12px 18px',
        whiteSpace: 'nowrap',
      }}
    >
      Sua empresa
    </div>
  );
};

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const flash = frame >= T.impact ? Math.exp(-(frame - T.impact) / 2.2) * 0.5 : 0;
  // feixe de transição inclinado a 18° nas viradas de cena
  const beamAt = [T.hookEnd, T.connectEnd, T.voidEnd, T.declare];
  const beam = beamAt.map((b) => clamp01(1 - Math.abs(frame - b) / 9)).reduce((a, x) => Math.max(a, x), 0);
  const beamX = beamAt.map((b) => (frame - b) * 90).find((_, i) => Math.abs(frame - beamAt[i]) < 9) ?? 0;
  return (
    <AbsoluteFill>
      {/* escurece a faixa da legenda para leitura */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to bottom, rgba(16,12,28,0) 52%, rgba(16,12,28,0.72) 66%, rgba(16,12,28,0.72) 82%, rgba(16,12,28,0) 96%)',
          opacity: frame < T.declare + 4 ? 1 : 1 - ramp(frame, T.declare, T.declare + 20),
        }}
      />
      {/* acalma o fundo para a declaração */}
      <AbsoluteFill
        style={{
          background: C.void,
          opacity: 0.5 * ramp(frame, T.declare, T.declare + 24) * (1 - ramp(frame, T.loopStart, DURATION - 10)),
        }}
      />
      {beam > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -400,
            bottom: -400,
            left: 540 + beamX - 160,
            width: 320,
            transform: 'rotate(18deg)',
            background: 'linear-gradient(90deg, rgba(139,108,255,0), rgba(139,108,255,0.32), rgba(139,108,255,0))',
            filter: 'blur(30px)',
            opacity: beam,
            mixBlendMode: 'screen',
          }}
        />
      )}
      {CAPTIONS.map((c, i) => (
        <Caption key={i} c={c} frame={frame} />
      ))}
      <PingLabel frame={frame} />
      <Logo frame={frame} />
      <Handle frame={frame} />
      {/* flash do impacto */}
      <AbsoluteFill style={{background: '#e4ffb8', opacity: flash, mixBlendMode: 'screen'}} />
      {/* vinheta: 0% em 45% do raio até 78% na borda */}
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(16,12,28,0) 45%, rgba(16,12,28,0.78) 100%)'}}
      />
      {/* grão a 7% em sobreposição, semente muda por quadro */}
      <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay'}}>
        <svg width={W} height={H}>
          <filter id="g">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 60} />
          </filter>
          <rect width={W} height={H} filter="url(#g)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
