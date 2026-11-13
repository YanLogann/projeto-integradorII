import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, W, H, FONT, PIXEL} from './theme';
import {Burst, Logo, Net, Scream} from './Props';
import {Person} from './Person';

export const Cover: React.FC = () => (
  <AbsoluteFill style={{background: C.navy}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect width={W} height={H} fill={C.navy} />
      <Net frame={10} />
      <circle cx={540} cy={900} r={640} fill={C.violet} opacity={0.35} />
      <Burst x={540} y={900} frame={10} color={C.coral} color2={C.hi} />
      <g transform="translate(540 1010) rotate(-4)">
        <rect x={-400} y={-250} width={800} height={500} rx={36} fill="#fff" stroke={C.navy} strokeWidth={10} />
        <path d="M-400,-214 Q-400,-250 -364,-250 L364,-250 Q400,-250 400,-214 L400,-150 L-400,-150Z" fill={C.coral} />
        <text x={-350} y={-180} fontFamily={FONT} fontWeight={700} fontSize={54} fill="#fff">⚠ Erro</text>
        <text x={0} y={-30} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={58} fill={C.navy}>Cartinha não está</text>
        <text x={0} y={40} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={58} fill={C.navy}>respondendo</text>
        <rect x={-150} y={110} width={300} height={90} rx={45} fill={C.navy} />
        <text x={0} y={172} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill="#fff">Aguardar</text>
      </g>
      <Person x={170} y={1180} s={0.9} skin={C.skinB} hair="bald" hairColor="#3b2a20" shirt={C.suit} jacket tie={C.coral} mustache eyes="wide" mouth="shout" mouthOpen={0.9} brows="angry" lArm={[-190, -10]} rArm={[190, -10]} />
      <Person x={915} y={1210} s={0.85} skin={C.skinA} hair="bun" hairColor="#2a1650" shirt="#E8A33D" eyes="x" mouth="o" mouthOpen={0.8} brows="worried" lArm={[-130, 20]} rArm={[130, 20]} />
      <text x={540} y={545} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={170} letterSpacing="-6" fill={C.white} stroke={C.navy} strokeWidth={26} paintOrder="stroke" strokeLinejoin="round">O OUTLOOK</text>
      <text x={350} y={765} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={250} letterSpacing="-8" fill={C.lime} stroke={C.navy} strokeWidth={28} paintOrder="stroke" strokeLinejoin="round">CAIU</text>
      <Scream x={835} y={705} s={1.28} rot={10} />
      <rect x={250} y={1520} width={580} height={130} rx={65} fill={C.navy} stroke={C.hi} strokeOpacity={0.4} strokeWidth={3} />
      <g transform="translate(540 1585)"><Logo w={400} /></g>
    </svg>
  </AbsoluteFill>
);
