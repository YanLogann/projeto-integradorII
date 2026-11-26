import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadDM } from "@remotion/google-fonts/DMSans";
import { loadFont as loadPixel } from "@remotion/google-fonts/Silkscreen";
import { buildCity, buildDebris, buildParticles, CityRow, DebrisLayer, ParticleLayer } from "./City";
import { DigitalStructure, Hero, HERO_SIGN, LimeLink, linePath } from "./Hero";
import { Mouth, SuctionCurves } from "./Mouth";
import { C, H, MX, MY, T, W } from "./theme";
import { KineticText } from "./Typo";
import { eIn, eInOut, eOut, map, prog, shake } from "./util";
import { WM_PATHS, WM_VIEWBOX } from "./wordmark";

loadDM("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });
loadPixel("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });

// ---------- câmera 2.5D ----------
const camKeys = [0, 45, 180, 222, 258, 315, 480, 660];
const camScale = [1.16, 1.05, 1.09, 1.12, 1.15, 1.06, 1.0, 0.97];
const camFocusY = [900, 880, 820, 1180, 1260, 1300, 1100, 960];
const camDrift = [60, 0, -20, -10, 0, 0, 0, 0];

const HITS: [number, number][] = [[10, 20], [45, 10], [118, 9], [T.connect, 7], [T.pulse, 16], [T.pin, 6], [484, 12]];

const camera = (f: number, depth: number) => {
  const s = map(f, camKeys, camScale);
  const oy = map(f, camKeys, camFocusY);
  const dy = map(f, camKeys, camDrift);
  let sx = 0, sy = 0;
  for (const [at, amp] of HITS) {
    const k = shake(f, at, amp);
    sx += k.x;
    sy += k.y;
  }
  const ss = 1 + (s - 1) * depth;
  return {
    tf: `translate(${540 + sx * depth} ${oy + sy * depth + dy * depth}) scale(${ss}) translate(-540 ${-oy})`,
    project: (x: number, y: number) => ({ x: 540 + sx * depth + (x - 540) * ss, y: oy + sy * depth + dy * depth + (y - oy) * ss }),
  };
};

// ---------- boca ----------
const mouthOpen = (f: number) => {
  if (f < T.s2) return 0.12 + 0.88 * eOut(Math.min(1, f / 40));
  if (f < T.connect) return 1 + Math.sin((f - T.s2) * 0.16) * 0.05;
  if (f < T.pulse) return 1 + Math.sin((T.connect - T.s2) * 0.16) * 0.05;
  if (f < T.s5) return map(f, [T.pulse, T.pulse + 20, T.s4, T.s5], [1, 0.82, 0.72, 0.42]) + Math.sin(f * 0.4) * 0.015;
  return map(f, [T.s5, T.s5 + 16], [0.42, 0]);
};
const rotClock = (f: number) => (f < T.connect ? f * 1.2 : f < T.pulse ? T.connect * 1.2 : T.connect * 1.2 + (f - T.pulse) * 0.45);

// links da rede no final da S4
const NET = [
  { d: `M${HERO_SIGN.x},${HERO_SIGN.y} C${HERO_SIGN.x - 160},${HERO_SIGN.y - 40} 220,1240 95,1395`, start: T.network },
  { d: `M${HERO_SIGN.x},${HERO_SIGN.y} C${HERO_SIGN.x + 180},${HERO_SIGN.y + 30} 860,1250 975,1370`, start: T.network + 5 },
  { d: `M95,1395 C40,1300 -20,1200 -60,1100`, start: T.network + 18 },
  { d: `M975,1370 C1040,1300 1080,1220 1140,1150`, start: T.network + 22 },
];

// janelas de fala: trilha e efeitos abaixam enquanto a voz fala
const VO_WIN: [number, number][] = [[0, 54], [62, 130], [258, 332], [392, 450], [503, 570]];
const duck = (g: number) => {
  let d = 1;
  for (const [a, b] of VO_WIN) d = Math.min(d, map(g, [a - 4, a, b, b + 6], [1, 0.16, 0.16, 1]));
  return d;
};

export const InternetComendo: React.FC<{ noVo?: boolean }> = ({ noVo = false }) => {
  const f = useCurrentFrame();
  const city = useMemo(buildCity, []);
  const debris = useMemo(buildDebris, []);
  const particles = useMemo(buildParticles, []);

  const rc = rotClock(f);
  const open = Math.max(0, mouthOpen(f));
  const suctionAmt = f < T.pulse ? map(f, [8, 45], [0, 1]) : map(f, [T.pulse, T.pulse + 24], [1, 0]);
  const warp = f < T.connect ? 26 * suctionAmt * (0.7 + 0.3 * Math.sin(f * 0.3)) : f < T.pulse ? 26 : map(f, [T.pulse, T.pulse + 20], [26, 0]);
  const endDim = map(f, [T.s5, T.s5 + 20], [1, 0.12]);
  const deadCity = map(f, [T.pulse, T.s4 + 30], [1, 0.45]) * endDim;
  const netLit = prog(f, T.network + 10, 25, eOut);

  const cMouth = camera(f, 0.55);
  const cFar = camera(f, 0.7);
  const cMid = camera(f, 0.88);
  const cNear = camera(f, 1.1);
  const cFx = camera(f, 1.0);

  // flashes
  const flash = Math.max(
    map(f, [10, 11, 16], [0, 0.55, 0]),
    map(f, [T.connect, T.connect + 1, T.connect + 6], [0, 0.25, 0]),
    map(f, [T.pulse, T.pulse + 1, T.pulse + 10], [0, 0.4, 0]),
    map(f, [T.s5 + 14, T.s5 + 15, T.s5 + 20], [0, 0.45, 0])
  );
  const flashColor = f >= T.connect && f < T.s5 ? C.lime : C.violetHi;

  // fechamento: ponto da boca vira o ponto da marca
  const wmX = 160, wmY = 760, wmW = 760, wmH = (wmW * 765) / 3693;
  const dotEnd = { x: wmX + ((3640 - 50) / 3693) * wmW, y: wmY + ((-80 + 740) / 765) * wmH };
  const mScreen = cMouth.project(MX, MY);
  const dotT = prog(f, T.s5 + 16, 22, eInOut);
  const wmReveal = prog(f, T.s5 + 22, 26, eOut);

  return (
    <AbsoluteFill style={{ backgroundColor: C.void }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="sky" cx="52%" cy="40%" r="75%">
            <stop offset="0%" stopColor={C.deep} />
            <stop offset="55%" stopColor="#170f2b" />
            <stop offset="100%" stopColor={C.black} />
          </radialGradient>
          <radialGradient id="mouthHalo">
            <stop offset="35%" stopColor={C.violet} stopOpacity={0.55} />
            <stop offset="70%" stopColor={C.violet} stopOpacity={0.12} />
            <stop offset="100%" stopColor={C.violet} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="throat">
            <stop offset="0%" stopColor={C.black} />
            <stop offset="80%" stopColor="#0b0716" />
            <stop offset="100%" stopColor={C.violet} stopOpacity={0.55} />
          </radialGradient>
          <linearGradient id="toothGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.violetHi} stopOpacity={0.9} />
            <stop offset="100%" stopColor={C.deep} stopOpacity={0.2} />
          </linearGradient>
          <radialGradient id="limeHalo">
            <stop offset="0%" stopColor={C.lime} stopOpacity={0.45} />
            <stop offset="100%" stopColor={C.lime} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.violet} stopOpacity={0.55} />
            <stop offset="100%" stopColor={C.deep} stopOpacity={0.9} />
          </linearGradient>
          <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.lime} stopOpacity={0} />
            <stop offset="100%" stopColor={C.lime} stopOpacity={0.6} />
          </linearGradient>
          <pattern id="heroGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill="rgba(16,12,28,0.85)" />
            <path d="M24 0H0V24" fill="none" stroke={C.lime} strokeOpacity={0.28} strokeWidth={1} />
          </pattern>
          <pattern id="floorGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0H0V60" fill="none" stroke={C.violet} strokeOpacity={0.35} strokeWidth={1} />
          </pattern>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="warp" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.012" numOctaves={2} seed={Math.floor(f / 2)} />
            <feDisplacementMap in="SourceGraphic" scale={warp} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        {/* céu */}
        <rect width={W} height={H} fill="url(#sky)" />
        {/* chão em perspectiva */}
        <g transform={cNear.tf} opacity={0.55 * endDim}>
          <path d={`M-400,1640 L1480,1640 L2400,2400 L-1300,2400 Z`} fill="url(#floorGrid)" />
          <rect x={-400} y={1636} width={1880} height={3} fill={C.violet} opacity={0.6} />
        </g>

        {/* boca + curvas de sucção */}
        <g transform={cMouth.tf}>
          <SuctionCurves clock={rc} amount={suctionAmt} />
          <Mouth open={open} rot={rc} glow={map(f, [0, 30, T.s4, T.s5], [0.6, 1, 1, 0.5])} f={Math.min(f, T.connect) + Math.max(0, f - T.pulse)} />
        </g>

        {/* cidade em camadas */}
        <g transform={cFar.tf} filter={warp > 0.5 ? "url(#warp)" : undefined}>
          <CityRow f={f} buildings={city} row={0} dim={deadCity * 0.8} />
        </g>
        <g transform={cMid.tf} filter={warp > 0.5 ? "url(#warp)" : undefined}>
          <CityRow f={f} buildings={city} row={1} dim={deadCity} />
        </g>
        <g transform={cMid.tf} opacity={endDim}>
          <DigitalStructure f={f} clock={rc} />
        </g>
        <g transform={cNear.tf} opacity={endDim}>
          <CityRow f={f} buildings={city} row={2} dim={map(f, [T.pulse, T.s4], [1, 0.7]) + 0.3 * netLit} connectT={netLit} />
          {NET.map((n, i) => (
            <LimeLink key={i} f={f} d={n.d} start={n.start} dur={22} width={3} pulseAt={n.start + 22} />
          ))}
          <Hero f={f} />
          <LimeLink f={f} d={linePath} start={T.lineStart} dur={T.connect - T.lineStart} pulseAt={T.pulse} />
        </g>

        {/* detritos e partículas (primeiro plano de efeito) */}
        <g transform={cFx.tf}>
          <DebrisLayer f={f} debris={debris} />
          <ParticleLayer f={f} particles={particles} />
        </g>

        {/* fechamento: ponto que viaja e vira o ponto da marca */}
        {f >= T.s5 + 14 && (
          <g>
            {wmReveal > 0 && (
              <g>
                <clipPath id="wmClip" clipPathUnits="userSpaceOnUse">
                  <rect x={wmX - 10} y={wmY - 20} width={(wmW + 20) * wmReveal} height={wmH + 40} />
                </clipPath>
                <g clipPath="url(#wmClip)">
                  <g transform={`translate(${wmX} ${wmY}) scale(${wmW / 3693}) translate(-50 740)`}>
                    {WM_PATHS.map((p, i) => (
                      <path key={i} d={p.d} fill={C.ink} />
                    ))}
                  </g>
                </g>
                {wmReveal < 1 && <rect x={wmX - 10 + (wmW + 20) * wmReveal - 3} y={wmY - 30} width={4} height={wmH + 60} fill={C.lime} />}
              </g>
            )}
            <circle
              cx={mScreen.x + (dotEnd.x - mScreen.x) * dotT}
              cy={mScreen.y + (dotEnd.y - mScreen.y) * eIn(dotT) * 0.3 + (dotEnd.y - mScreen.y) * dotT * 0.7}
              r={map(f, [T.s5 + 14, T.s5 + 18, T.s5 + 38], [4, 46, (85 / 3693) * wmW])}
              fill={C.lime}
            />
            <circle cx={dotEnd.x} cy={dotEnd.y} r={(85 / 3693) * wmW * 3.2} fill="url(#limeHalo)" opacity={dotT} />
          </g>
        )}

        {/* vinheta + grão */}
        <rect width={W} height={H} fill="url(#vig)" />
        <radialGradient id="vig" cx="50%" cy="45%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.75} />
        </radialGradient>
        <rect width={W} height={H} filter="url(#grain)" opacity={0.09} style={{ mixBlendMode: "overlay" }} />
        {flash > 0.005 && <rect width={W} height={H} fill={flashColor} opacity={flash} style={{ mixBlendMode: "screen" }} />}
      </svg>

      {/* ---------- tipografia cinética ---------- */}
      <KineticText
        f={f}
        x={64}
        y={248}
        align="left"
        out={T.s2 - 4}
        outMode="suck"
        lines={[
          { size: 150, words: [{ t: "A", at: 1 }, { t: "INTERNET", at: 10 }] },
          { size: 150, words: [{ t: "ESTÁ", at: 22 }, { t: "COM", at: 29 }] },
          { size: 230, words: [{ t: "FOME.", at: 36, color: C.violetHi }] },
        ]}
      />
      <KineticText
        f={f}
        x={1016}
        y={250}
        align="right"
        out={T.s3 - 8}
        outMode="suck"
        lines={[
          { size: 104, words: [{ t: "E", at: 63 }, { t: "ELA", at: 65 }, { t: "NÃO", at: 72 }] },
          { size: 172, words: [{ t: "ESPERA", at: 80 }] },
          { size: 104, words: [{ t: "VOCÊ", at: 89 }, { t: "ESTAR", at: 100 }] },
          { size: 126, words: [{ t: "PREPARADO.", at: 107, color: C.violetHi }] },
        ]}
      />
      <KineticText
        f={f}
        x={64}
        y={262}
        align="left"
        out={T.s4 + 30}
        outMode="fade"
        lines={[
          { size: 110, words: [{ t: "MAS", at: 258 }, { t: "QUEM", at: 265 }, { t: "SE", at: 271 }] },
          { size: 160, words: [{ t: "CONECTA,", at: 276, color: C.lime }] },
          { size: 172, words: [{ t: "RESISTE.", at: 308 }] },
        ]}
      />
      <KineticText
        f={f}
        x={1016}
        y={266}
        align="right"
        out={T.s5 - 6}
        outMode="fade"
        lines={[
          { size: 118, words: [{ t: "QUEM", at: 393 }, { t: "RESISTE", at: 398 }] },
          { size: 118, words: [{ t: "É", at: 421 }, { t: "QUEM", at: 425 }, { t: "INOVA.", at: 431, color: C.lime }] },
        ]}
      />
      <KineticText
        f={f}
        x={540}
        y={985}
        align="center"
        out={T.end + 20}
        lines={[{ size: 66, tracking: 1, words: [{ t: "SUA", at: 529 }, { t: "EMPRESA", at: 541 }, { t: "NO", at: 549 }, { t: "MAPA.", at: 553, color: C.lime }] }]}
      />
      {f >= 566 && (
        <div
          style={{
            position: "absolute",
            top: 1090,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: "Silkscreen",
            fontSize: 36,
            color: C.mist,
            opacity: prog(f, 566, 10),
            letterSpacing: 2,
          }}
        >
          @codrian_ofc &nbsp;·&nbsp; codrian.com.br
        </div>
      )}


      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("audio/sfx_drone.mp3")} volume={(i) => duck(i) * map(i, [0, 20, T.connect - 2, T.connect, T.pulse, T.pulse + 6, T.s5, 630, 660], [0, 0.5, 0.5, 0, 0, 0.45, 0.45, 0.3, 0])} />
      <Sequence from={0}>
        <Audio src={staticFile("audio/vo1.mp3")} volume={noVo ? 0 : 1} />
      </Sequence>
      <Sequence from={62}>
        <Audio src={staticFile("audio/vo2.mp3")} volume={noVo ? 0 : 1} />
      </Sequence>
      <Sequence from={9}>
        <Audio src={staticFile("audio/sfx_hit.mp3")} volume={(i) => 0.5 * duck(i + 9)} />
      </Sequence>
      <Sequence from={40} durationInFrames={T.connect - 40}>
        <Audio src={staticFile("audio/sfx_suction.mp3")} volume={(i) => duck(i + 40) * map(i, [0, 10, 130], [0, 0.6, 0.45])} />
      </Sequence>
      <Sequence from={150} durationInFrames={T.connect - 150}>
        <Audio src={staticFile("audio/sfx_suction.mp3")} volume={(i) => duck(i + 150) * map(i, [0, 10], [0, 0.5])} />
      </Sequence>
      <Sequence from={T.pulse}>
        <Audio src={staticFile("audio/sfx_pulse.mp3")} volume={0.25} />
      </Sequence>
      <Sequence from={T.pulse}>
        <Audio src={staticFile("audio/vo3.mp3")} volume={noVo ? 0 : 1} />
      </Sequence>
      <Sequence from={T.explode - 8}>
        <Audio src={staticFile("audio/sfx_rise.mp3")} volume={(i) => 0.5 * duck(i + T.explode - 8)} />
      </Sequence>
      <Sequence from={392}>
        <Audio src={staticFile("audio/vo4.mp3")} volume={noVo ? 0 : 1} />
      </Sequence>
      <Sequence from={T.pin + 6}>
        <Audio src={staticFile("audio/sfx_pulse.mp3")} volume={0.3} />
      </Sequence>
      <Sequence from={T.s5 + 4}>
        <Audio src={staticFile("audio/sfx_hit.mp3")} volume={(i) => 0.45 * duck(i + T.s5 + 4)} />
      </Sequence>
      <Sequence from={T.s5 + 20}>
        <Audio src={staticFile("audio/sfx_logo.mp3")} volume={(i) => 0.4 * duck(i + T.s5 + 20)} />
      </Sequence>
      <Sequence from={503}>
        <Audio src={staticFile("audio/vo5.mp3")} volume={noVo ? 0 : 1} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const _unused = eInOut;
