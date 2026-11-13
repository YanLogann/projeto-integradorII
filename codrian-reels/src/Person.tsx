import React from 'react';
import {C} from './theme';

export type PersonProps = {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  skin: string;
  hair?: 'bald' | 'short' | 'spiky' | 'bun' | 'long';
  hairColor?: string;
  shirt: string;
  tie?: string;
  jacket?: boolean;
  eyes?: 'wide' | 'calm' | 'closed' | 'dot' | 'x' | 'happy';
  mouth?: 'shout' | 'smile' | 'flat' | 'o' | 'grin' | 'worry' | 'talk';
  mouthOpen?: number;
  brows?: 'angry' | 'worried' | 'calm' | 'up' | 'flat';
  glasses?: boolean;
  mustache?: boolean;
  hood?: boolean;
  look?: [number, number];
  lArm?: [number, number];
  rArm?: [number, number];
  mid?: React.ReactNode; // desenhado depois do corpo, antes dos braços
  front?: React.ReactNode; // desenhado por cima de tudo
  sweat?: boolean;
  tears?: number; // frame para animar lágrimas (0 = sem)
  blush?: boolean;
};

const DARK = '#2B1220';

const Arm: React.FC<{side: 1 | -1; t: [number, number]; color: string; skin: string}> = ({side, t, color, skin}) => {
  const sh: [number, number] = [side * 135, 215];
  const c: [number, number] = [(sh[0] + t[0]) / 2 + side * 70, (sh[1] + t[1]) / 2 + 60];
  return (
    <g>
      <path d={`M${sh[0]},${sh[1]} Q${c[0]},${c[1]} ${t[0]},${t[1]}`} stroke={color} strokeWidth={74} strokeLinecap="round" fill="none" />
      <circle cx={t[0]} cy={t[1]} r={42} fill={skin} />
    </g>
  );
};

export const Person: React.FC<PersonProps> = (p) => {
  const {x, y, s = 1, rot = 0, sx = 1, sy = 1, skin, shirt, eyes = 'dot', mouth = 'flat', mouthOpen = 0, brows = 'calm'} = p;
  const look = p.look ?? [0, 0];
  const hc = p.hairColor ?? '#2B1B14';
  const hairBack =
    p.hair === 'bun' ? (
      <circle cx={0} cy={-150} r={55} fill={hc} />
    ) : p.hair === 'long' ? (
      <rect x={-128} y={-110} width={256} height={330} rx={90} fill={hc} />
    ) : null;
  const hairFront =
    p.hair === 'short' || p.hair === 'bun' || p.hair === 'long' ? (
      <path d="M-114,-20 Q-125,-138 0,-140 Q125,-138 114,-20 Q70,-85 0,-78 Q-70,-85 -114,-20Z" fill={hc} />
    ) : p.hair === 'spiky' ? (
      <path d="M-112,-25 L-100,-120 L-62,-95 L-40,-165 L-5,-110 L35,-170 L58,-100 L100,-130 L112,-25 Q60,-85 0,-80 Q-60,-85 -112,-25Z" fill={hc} />
    ) : p.hair === 'bald' ? (
      <path d="M-70,-112 Q-30,-135 0,-130" stroke={hc} strokeWidth={8} fill="none" strokeLinecap="round" />
    ) : null;

  const eyeNode = (ex: number, flip: 1 | -1) => {
    const [lx, ly] = look;
    switch (eyes) {
      case 'wide':
        return (
          <g>
            <circle cx={ex} cy={-15} r={33} fill="#fff" stroke={DARK} strokeWidth={5} />
            <circle cx={ex + lx} cy={-15 + ly} r={11} fill={DARK} />
          </g>
        );
      case 'calm':
        return (
          <g>
            <circle cx={ex} cy={-12} r={28} fill="#fff" />
            <circle cx={ex + lx} cy={-8 + ly} r={11} fill={DARK} />
            <path d={`M${ex - 32},-14 L${ex + 32},-14 L${ex + 32},-45 L${ex - 32},-45Z`} fill={skin} />
            <path d={`M${ex - 32},-14 L${ex + 32},-14`} stroke={DARK} strokeWidth={7} strokeLinecap="round" />
          </g>
        );
      case 'closed':
        return <path d={`M${ex - 28},-10 Q${ex},-32 ${ex + 28},-10`} stroke={DARK} strokeWidth={8} fill="none" strokeLinecap="round" />;
      case 'happy':
        return <path d={`M${ex - 26},-5 Q${ex},-38 ${ex + 26},-5`} stroke={DARK} strokeWidth={9} fill="none" strokeLinecap="round" />;
      case 'x':
        return (
          <g stroke={DARK} strokeWidth={8} strokeLinecap="round">
            <path d={`M${ex - 20},-35 L${ex + 20},5`} />
            <path d={`M${ex + 20},-35 L${ex - 20},5`} />
          </g>
        );
      default:
        return <circle cx={ex + lx} cy={-12 + ly} r={13} fill={DARK} />;
    }
  };

  const browY = brows === 'up' ? -78 : -62;
  const browNode = (side: 1 | -1) => {
    const cx = side * 45;
    const inner = cx - side * 36; // lado interno
    const outer = cx + side * 36;
    let yi = browY,
      yo = browY;
    if (brows === 'angry') {
      yi = browY + 14;
      yo = browY - 8;
    } else if (brows === 'worried') {
      yi = browY - 12;
      yo = browY + 6;
    } else if (brows === 'up') {
      yi = browY - 4;
      yo = browY - 4;
    }
    return <path d={`M${inner},${yi} L${outer},${yo}`} stroke={hc === '#ffffff' ? '#444' : DARK} strokeWidth={brows === 'angry' ? 15 : 10} strokeLinecap="round" />;
  };

  const mo = p.mouthOpen ?? 0;
  const mouthNode = (() => {
    switch (mouth) {
      case 'shout':
        return (
          <g>
            <ellipse cx={0} cy={68} rx={58} ry={22 + 42 * mo} fill="#3A0D14" />
            <ellipse cx={0} cy={68 + 14 + 20 * mo} rx={34} ry={12 + 10 * mo} fill={C.coral} />
            <rect x={-40} y={68 - 20 - 42 * mo} width={80} height={14} rx={5} fill="#fff" />
          </g>
        );
      case 'talk':
        return <ellipse cx={0} cy={68} rx={30} ry={8 + 28 * mo} fill="#3A0D14" />;
      case 'o':
        return <ellipse cx={0} cy={70} rx={20 + 6 * mo} ry={24 + 14 * mo} fill="#3A0D14" />;
      case 'smile':
        return <path d="M-42,55 Q0,98 42,55" stroke={DARK} strokeWidth={10} fill="none" strokeLinecap="round" />;
      case 'grin':
        return (
          <g>
            <path d="M-55,48 Q0,118 55,48Z" fill="#3A0D14" />
            <path d="M-45,50 Q0,62 45,50 L40,62 Q0,70 -40,62Z" fill="#fff" />
          </g>
        );
      case 'worry':
        return <path d="M-42,82 Q-21,56 0,72 Q21,88 42,62" stroke={DARK} strokeWidth={10} fill="none" strokeLinecap="round" />;
      default:
        return <path d="M-34,72 L34,72" stroke={DARK} strokeWidth={10} strokeLinecap="round" />;
    }
  })();
  void mouthOpen;

  const skinShade = skin;
  const t = p.tears ?? 0;

  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(0 520) scale(${sx} ${sy}) translate(0 -520)`}>
      {hairBack}
      {p.hood && <ellipse cx={0} cy={175} rx={200} ry={95} fill="#0E8F7E" />}
      {/* torso */}
      <path d="M-165,640 L-165,235 Q-165,155 -90,150 L90,150 Q165,155 165,235 L165,640Z" fill={p.jacket ? C.navy2 : shirt} stroke={C.ink} strokeWidth={0} />
      <rect x={-36} y={90} width={72} height={90} fill={skinShade} />
      {p.jacket ? (
        <g>
          <path d="M-52,150 L0,320 L52,150Z" fill="#fff" />
          {p.tie && <path d="M-16,175 L16,175 L26,300 L0,350 L-26,300Z" fill={p.tie} />}
          <path d="M-52,150 L-20,160 L0,200 L-60,175Z" fill="#fff" />
        </g>
      ) : (
        <path d="M-52,150 Q0,230 52,150Z" fill={skinShade} />
      )}
      {p.hood && (
        <g>
          <path d="M-30,215 L-36,320 M30,215 L36,320" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
          <text x={0} y={440} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={78} fill={C.yellow}>
            {'</>'}
          </text>
        </g>
      )}
      {/* cabeça */}
      <rect x={-110} y={-122} width={220} height={236} rx={92} fill={skinShade} />
      <circle cx={-112} cy={-5} r={24} fill={skinShade} />
      <circle cx={112} cy={-5} r={24} fill={skinShade} />
      {hairFront}
      {p.blush && (
        <g fill={C.coral} opacity={0.45}>
          <ellipse cx={-70} cy={35} rx={26} ry={14} />
          <ellipse cx={70} cy={35} rx={26} ry={14} />
        </g>
      )}
      {eyeNode(-45, 1)}
      {eyeNode(45, -1)}
      {browNode(-1)}
      {browNode(1)}
      {p.glasses && (
        <g stroke={C.ink} strokeWidth={8} fill="none">
          <rect x={-86} y={-48} width={80} height={66} rx={24} />
          <rect x={6} y={-48} width={80} height={66} rx={24} />
          <path d="M-6,-20 L6,-20" />
        </g>
      )}
      {p.mustache && <path d="M-60,50 Q-30,28 0,48 Q30,28 60,50 Q30,66 0,56 Q-30,66 -60,50Z" fill={hc} />}
      {mouthNode}
      {p.sweat && (
        <path d="M95,-95 Q80,-60 95,-48 Q112,-60 95,-95Z" fill={C.cyan} stroke="#fff" strokeWidth={3} />
      )}
      {t > 0 && (
        <g fill={C.cyan}>
          {[0, 1].map((i) => {
            const ph = ((t * 0.08 + i * 0.5) % 1);
            const sgn = i === 0 ? -1 : 1;
            return <ellipse key={i} cx={sgn * (60 + ph * 70)} cy={-5 + ph * 80} rx={11} ry={17} opacity={1 - ph * 0.6} />;
          })}
        </g>
      )}
      {p.mid}
      {p.lArm && <Arm side={-1} t={p.lArm} color={p.jacket ? C.navy2 : p.hood ? '#0E8F7E' : shirt} skin={skinShade} />}
      {p.rArm && <Arm side={1} t={p.rArm} color={p.jacket ? C.navy2 : p.hood ? '#0E8F7E' : shirt} skin={skinShade} />}
      {p.front}
    </g>
  );
};
