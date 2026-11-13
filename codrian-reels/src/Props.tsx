import React from 'react';
import {random} from 'remotion';
import {C, W, H, BRAND} from './theme';
import {lerp, pop} from './anim';

export const Office: React.FC<{frame: number; tint?: string; alarm?: boolean; dim?: boolean}> = ({frame, tint = C.wall, alarm = false, dim = false}) => (
  <g>
    <rect width={W} height={H} fill={tint} />
    <rect y={1180} width={W} height={H - 1180} fill={C.floor} />
    {/* janela */}
    <rect x={90} y={250} width={330} height={300} rx={20} fill="#1B2750" />
    <rect x={105} y={265} width={300} height={270} rx={12} fill={dim ? '#5F6C99' : '#7DD3FC'} />
    <path d="M105,535 L105,430 L150,430 L150,380 L210,380 L210,450 L260,450 L260,350 L320,350 L320,420 L405,420 L405,535Z" fill="#334155" />
    <circle cx={350} cy={320} r={26} fill={C.yellow} />
    {/* relógio */}
    <circle cx={760} cy={330} r={70} fill="#fff" stroke={C.ink} strokeWidth={10} />
    <path d="M760,330 L760,285" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
    <path d={`M760,330 L${760 + 35 * Math.cos(frame * 0.12)},${330 + 35 * Math.sin(frame * 0.12)}`} stroke={C.coral} strokeWidth={6} strokeLinecap="round" />
    {/* quadro */}
    <rect x={560} y={440} width={120} height={90} rx={8} fill={C.yellow} />
    <path d="M575,515 L610,470 L635,500 L650,480 L668,515Z" fill={C.navy2} />
    {/* planta */}
    <rect x={930} y={1020} width={80} height={110} rx={12} fill="#9A5B34" />
    <path d="M970,1020 Q930,930 900,960 Q940,980 970,1020 Q990,900 1030,900 Q1000,960 970,1020Z" fill="#22C55E" />
    {alarm && <AlarmOverlay frame={frame} />}
  </g>
);

export const AlarmOverlay: React.FC<{frame: number}> = ({frame}) => {
  const on = Math.floor(frame / 5) % 2 === 0;
  return <rect width={W} height={H} fill={C.coral} opacity={on ? 0.28 : 0.06} />;
};

export const Desk: React.FC<{y?: number}> = ({y = 1000}) => (
  <g>
    <rect x={-20} y={y} width={W + 40} height={40} fill="#7C4A2D" />
    <rect x={-20} y={y + 40} width={W + 40} height={H - y} fill="#5A3420" />
  </g>
);

export const Monitor: React.FC<{x: number; y: number; w?: number; h?: number; frame: number; rot?: number; bsod?: boolean}> = ({x, y, w = 420, h = 320, frame, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={26} fill="#1F2937" />
    <rect x={-w / 2 + 18} y={-h / 2 + 18} width={w - 36} height={h - 36} rx={14} fill="#F8FAFC" />
    <Spinner x={0} y={0} r={Math.min(w, h) * 0.17} frame={frame} />
    <rect x={-60} y={h / 2} width={120} height={50} fill="#374151" />
    <rect x={-120} y={h / 2 + 40} width={240} height={22} rx={10} fill="#4B5563" />
  </g>
);

export const Spinner: React.FC<{x: number; y: number; r: number; frame: number; color?: string}> = ({x, y, r, frame, color = C.navy}) => (
  <g transform={`translate(${x} ${y}) rotate(${frame * 14})`}>
    <circle r={r} fill="none" stroke="#CBD5E1" strokeWidth={r * 0.25} />
    <path d={`M0,${-r} A${r},${r} 0 0 1 ${r},0`} fill="none" stroke={color} strokeWidth={r * 0.25} strokeLinecap="round" />
  </g>
);

const ROWS = ['Orçamento urgente!!', 'RE: RE: Reunião', 'Fatura vencendo', 'URGENTE (de novo)', 'Pedido #4821'];

export const MailApp: React.FC<{frame: number}> = ({frame}) => {
  const dlg = pop(frame, 42);
  const cx = lerp(frame, 50, 72, 760, 540);
  const cy = lerp(frame, 50, 72, 1020, 820);
  const click = frame >= 72 && frame < 80;
  return (
    <g transform="translate(40 170)">
      <rect width={1000} height={1020} rx={36} fill="#fff" />
      <path d="M0,36 Q0,0 36,0 L964,0 Q1000,0 1000,36 L1000,110 L0,110Z" fill={C.navy2} />
      <circle cx={50} cy={55} r={12} fill={C.coral} />
      <circle cx={88} cy={55} r={12} fill={C.yellow} />
      <circle cx={126} cy={55} r={12} fill={C.green} />
      <text x={190} y={72} fontFamily="Inter, Arial" fontWeight={900} fontSize={44} fill="#fff">
        Cartinha
      </text>
      <rect x={640} y={30} width={300} height={50} rx={25} fill="#2C3A6B" />
      <text x={670} y={65} fontFamily="Inter, Arial" fontWeight={700} fontSize={26} fill="#94A3B8">
        Buscar…
      </text>
      <rect x={0} y={110} width={250} height={910} fill="#EEF2FF" />
      {['Entrada', 'Enviados', 'Rascunhos', 'Lixeira'].map((t, i) => (
        <text key={t} x={30} y={185 + i * 70} fontFamily="Inter, Arial" fontWeight={i === 0 ? 900 : 700} fontSize={32} fill={i === 0 ? C.navy : '#64748B'}>
          {t}
        </text>
      ))}
      <rect x={160} y={150} width={70} height={40} rx={20} fill={C.coral} transform={`translate(${Math.sin(frame * 1.7) * 2} 0)`} />
      <text x={195} y={180} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={26} fill="#fff">
        999+
      </text>
      {ROWS.map((t, i) => (
        <g key={t} transform={`translate(270 ${135 + i * 150})`}>
          <circle cx={50} cy={52} r={34} fill={['#F59E0B', '#06B6D4', '#EF4444', '#8B5CF6', '#10B981'][i]} />
          <text x={110} y={52} fontFamily="Inter, Arial" fontWeight={900} fontSize={36} fill={C.ink}>
            {t}
          </text>
          <rect x={110} y={72} width={360 - i * 20} height={16} rx={8} fill="#E2E8F0" />
          <rect x={0} y={128} width={730} height={3} fill="#E2E8F0" />
        </g>
      ))}
      {/* véu de carregamento */}
      <rect x={250} y={110} width={750} height={910} fill="#fff" opacity={0.78} />
      <Spinner x={625} y={500} r={80} frame={frame} />
      <text x={625} y={660} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={44} fill={C.navy}>
        Carregando…
      </text>
      {frame >= 42 && (
        <g transform={`translate(500 560) scale(${dlg}) translate(-500 -300)`}>
          <rect x={150} y={150} width={700} height={400} rx={30} fill="#fff" stroke={C.ink} strokeWidth={8} />
          <path d="M150,180 Q150,150 180,150 L820,150 Q850,150 850,180 L850,240 L150,240Z" fill={C.coral} />
          <text x={200} y={215} fontFamily="Inter, Arial" fontWeight={900} fontSize={48} fill="#fff">
            ⚠ Erro
          </text>
          <text x={500} y={330} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={40} fill={C.ink}>
            Cartinha não está
          </text>
          <text x={500} y={385} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={40} fill={C.ink}>
            respondendo
          </text>
          <rect x={360} y={440} width={280} height={70} rx={35} fill={click ? C.yellow : C.navy} />
          <text x={500} y={490} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={36} fill={click ? C.navy : '#fff'}>
            Aguardar
          </text>
        </g>
      )}
      {frame >= 50 && (
        <g transform={`translate(${cx - 40} ${cy - 240})`}>
          <path d="M0,0 L0,70 L20,54 L34,86 L48,80 L34,50 L58,50Z" fill="#fff" stroke={C.ink} strokeWidth={4} />
          {click && <circle cx={0} cy={0} r={30} fill="none" stroke={C.yellow} strokeWidth={6} />}
        </g>
      )}
    </g>
  );
};

export const Paper: React.FC<{frame: number; i: number; area?: [number, number, number, number]}> = ({frame, i, area = [0, 0, W, 1100]}) => {
  const sp = 0.05 + random('ps' + i) * 0.06;
  const ph = random('pp' + i) * 6.28;
  const px = area[0] + ((random('px' + i) * area[2] + frame * (5 + random('pv' + i) * 8)) % (area[2] + 200)) - 100;
  const py = area[1] + random('py' + i) * area[3] * 0.8 + Math.sin(frame * sp + ph) * 120;
  const rot = frame * (4 + random('pr' + i) * 8) * (i % 2 ? 1 : -1);
  return (
    <g transform={`translate(${px} ${py}) rotate(${rot})`}>
      <rect x={-34} y={-44} width={68} height={88} rx={6} fill="#fff" stroke="#CBD5E1" strokeWidth={3} />
      <path d="M-20,-24 L20,-24 M-20,-8 L20,-8 M-20,8 L8,8" stroke="#94A3B8" strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

export const Mug: React.FC<{x: number; y: number; rot?: number; s?: number}> = ({x, y, rot = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M45,-25 q48,5 40,40 q-8,30 -45,25" fill="none" stroke="#fff" strokeWidth={16} strokeLinecap="round" />
    <path d="M-50,-45 L50,-45 L40,45 Q0,62 -40,45Z" fill="#fff" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <ellipse cx={0} cy={-45} rx={50} ry={12} fill="#6B3E26" />
    <text x={0} y={25} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={30} fill={C.coral}>
      ♥
    </text>
  </g>
);

export const Steam: React.FC<{x: number; y: number; frame: number}> = ({x, y, frame}) => (
  <g transform={`translate(${x} ${y})`} stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.85}>
    {[-22, 0, 22].map((dx, i) => {
      const ph = ((frame * 0.04 + i * 0.33) % 1);
      return <path key={i} d={`M${dx},${-ph * 40} q-14,-26 0,-52 q14,-26 0,-52`} opacity={1 - ph} transform={`translate(0 ${-ph * 60})`} />;
    })}
  </g>
);

export const Burst: React.FC<{x: number; y: number; frame: number; color: string; color2?: string; n?: number; r?: number}> = ({x, y, frame, color, color2, n = 18, r = 1800}) => (
  <g transform={`translate(${x} ${y}) rotate(${frame * 0.8})`}>
    {Array.from({length: n}).map((_, i) => {
      const a = (i / n) * 360;
      return <path key={i} d={`M0,0 L${r},${-r * 0.09} L${r},${r * 0.09}Z`} fill={i % 2 ? color : color2 ?? color} opacity={i % 2 ? 0.35 : 0.18} transform={`rotate(${a})`} />;
    })}
  </g>
);

export const Wordmark: React.FC<{x: number; y: number; s?: number; dark?: boolean}> = ({x, y, s = 1, dark = false}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-300} y={-80} width={160} height={160} rx={42} fill={C.yellow} />
    <text x={-220} y={22} textAnchor="middle" fontFamily="Inter, Arial" fontWeight={900} fontSize={70} fill={C.navy}>
      {BRAND.glyph}
    </text>
    <text x={-110} y={42} fontFamily="Inter, Arial" fontWeight={900} fontSize={150} fill={dark ? C.navy : '#fff'} letterSpacing={-4}>
      {BRAND.name}
    </text>
  </g>
);

export const Scream: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <circle r={100} fill={C.yellow} stroke={C.ink} strokeWidth={8} />
    <path d="M-62,-48 Q-40,-62 -22,-48" stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" />
    <path d="M62,-48 Q40,-62 22,-48" stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" />
    <circle cx={-38} cy={-15} r={22} fill="#fff" stroke={C.ink} strokeWidth={5} />
    <circle cx={38} cy={-15} r={22} fill="#fff" stroke={C.ink} strokeWidth={5} />
    <circle cx={-38} cy={-12} r={8} fill={C.ink} />
    <circle cx={38} cy={-12} r={8} fill={C.ink} />
    <ellipse cx={0} cy={50} rx={26} ry={34} fill="#3A0D14" />
    <path d="M-100,-10 Q-110,10 -96,30 M100,-10 Q110,10 96,30" stroke={C.cyan} strokeWidth={10} fill="none" strokeLinecap="round" />
    <path d="M-92,-70 q-26,-10 -22,-40 M92,-70 q26,-10 22,-40" stroke="#fff" strokeWidth={0} />
  </g>
);

export const Phone: React.FC<{x: number; y: number; w?: number; h?: number; s?: number; rot?: number; children?: React.ReactNode}> = ({x, y, w = 540, h = 1000, s = 1, rot = 0, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-w / 2 - 22} y={-h / 2 - 22} width={w + 44} height={h + 44} rx={84} fill="#0F172A" stroke="#475569" strokeWidth={6} />
    <clipPath id="scr">
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={64} />
    </clipPath>
    <g clipPath="url(#scr)">{children}</g>
    <rect x={-70} y={-h / 2 + 12} width={140} height={30} rx={15} fill="#0F172A" />
  </g>
);

export const Bubble: React.FC<{x: number; y: number; w: number; h: number; fill?: string; tail?: 'l' | 'r' | 'b'; children?: React.ReactNode}> = ({x, y, w, h, fill = '#fff', tail = 'b', children}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={fill} stroke={C.ink} strokeWidth={6} />
    {tail === 'b' && <path d={`M-30,${h / 2 - 4} L-10,${h / 2 + 46} L30,${h / 2 - 4}Z`} fill={fill} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />}
    {tail === 'b' && <rect x={-26} y={h / 2 - 12} width={52} height={14} fill={fill} />}
    {children}
  </g>
);

export const Spark: React.FC<{x: number; y: number; frame: number; start: number; color?: string}> = ({x, y, frame, start, color = C.yellow}) => {
  const t = frame - start;
  if (t < 0 || t > 14) return null;
  const p = t / 14;
  return (
    <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth={10} strokeLinecap="round" opacity={1 - p}>
      {Array.from({length: 8}).map((_, i) => (
        <path key={i} d="M60,0 L110,0" transform={`rotate(${i * 45}) translate(${p * 50} 0)`} />
      ))}
    </g>
  );
};
