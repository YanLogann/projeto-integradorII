import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, W, H, FONT} from './theme';
import {Burst, Scream, Wordmark} from './Props';
import {Person} from './Person';

export const Cover: React.FC = () => (
  <AbsoluteFill style={{background: C.navy}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect width={W} height={H} fill="#7F1D1D" />
      <Burst x={540} y={900} frame={10} color="#EF4444" color2="#FCA5A5" />
      {/* janela de erro */}
      <g transform="translate(540 1010) rotate(-4)">
        <rect x={-400} y={-250} width={800} height={500} rx={36} fill="#fff" stroke={C.ink} strokeWidth={10} />
        <path d="M-400,-214 Q-400,-250 -364,-250 L364,-250 Q400,-250 400,-214 L400,-150 L-400,-150Z" fill={C.coral} />
        <text x={-350} y={-180} fontFamily={FONT} fontWeight={900} fontSize={54} fill="#fff">⚠ Erro</text>
        <text x={0} y={-30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={56} fill={C.ink}>Cartinha não está</text>
        <text x={0} y={40} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={56} fill={C.ink}>respondendo</text>
        <rect x={-150} y={110} width={300} height={90} rx={45} fill={C.navy} />
        <text x={0} y={172} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#fff">Aguardar</text>
      </g>
      <Person x={170} y={1180} s={0.9} skin={C.skinB} hair="bald" hairColor="#3b2a20" shirt={C.navy2} jacket tie={C.coral} mustache eyes="wide" mouth="shout" mouthOpen={0.9} brows="angry" lArm={[-190, -10]} rArm={[190, -10]} />
      <Person x={915} y={1210} s={0.85} skin={C.skinA} hair="bun" hairColor="#5B2A86" shirt="#F59E0B" eyes="x" mouth="o" mouthOpen={0.8} brows="worried" lArm={[-130, 20]} rArm={[130, 20]} />
      <text x={540} y={560} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={160} fill="#fff" stroke={C.navy} strokeWidth={26} paintOrder="stroke" strokeLinejoin="round">O OUTLOOK</text>
      <text x={360} y={760} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={230} fill={C.yellow} stroke={C.navy} strokeWidth={28} paintOrder="stroke" strokeLinejoin="round">CAIU</text>
      <Scream x={835} y={705} s={1.28} rot={10} />
      <rect x={190} y={1510} width={700} height={140} rx={70} fill={C.navy} /><Wordmark x={470} y={1580} s={0.6} />
    </svg>
  </AbsoluteFill>
);
