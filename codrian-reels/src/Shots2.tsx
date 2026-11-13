import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {C, W, H, FONT, PIXEL, FPS} from './theme';
import {jitter, lerp, pop} from './anim';
import {Person} from './Person';
import {AlarmOverlay, MailApp, Phone, Ping} from './Props';

const Svg: React.FC<{children: React.ReactNode; push?: number}> = ({children, push = 0.0009}) => {
  const f = useCurrentFrame();
  const z = 1 + f * push;
  return (
    <AbsoluteFill style={{background: C.navy}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <clipPath id="av">
            <circle r={200} />
          </clipPath>
        </defs>
        <g transform={`translate(540 960) scale(${z}) translate(-540 -960) translate(${Math.sin(f * 0.07) * 3} ${Math.cos(f * 0.05) * 3})`}>{children}</g>
      </svg>
    </AbsoluteFill>
  );
};

type Who = 'rodrigo' | 'yan';
export const Avatar: React.FC<{who: Who; x: number; y: number; r?: number; mood?: 'panic' | 'shout' | 'calm' | 'astonished' | 'confused' | 'deadpan'; frame: number; talk?: boolean; glow?: boolean; dim?: boolean}> = ({who, x, y, r = 200, mood = 'calm', frame, talk, glow, dim}) => {
  const k = r / 200;
  const open = talk ? 0.3 + 0.7 * Math.abs(Math.sin(frame * 0.85)) : 0;
  const base =
    who === 'rodrigo'
      ? {skin: C.skinB, hair: 'bald' as const, hairColor: '#3b2a20', shirt: C.suit, jacket: true, tie: C.coral, mustache: true}
      : {skin: C.skinA, hair: 'short' as const, hairColor: '#7C3F12', shirt: C.violet, hood: true, glasses: true};
  const face: any =
    mood === 'panic' ? {eyes: 'wide', mouth: talk ? 'o' : 'worry', brows: 'worried', sweat: true}
    : mood === 'shout' ? {eyes: 'wide', mouth: 'shout', brows: 'angry'}
    : mood === 'astonished' ? {eyes: 'wide', mouth: talk ? 'o' : 'o', brows: 'up'}
    : mood === 'confused' ? {eyes: 'wide', mouth: talk ? 'talk' : 'worry', brows: 'worried', look: [8, -4]}
    : mood === 'deadpan' ? {eyes: 'calm', mouth: talk ? 'talk' : 'smile', brows: 'calm'}
    : {eyes: 'calm', mouth: talk ? 'talk' : 'smile', brows: 'calm'};
  return (
    <g transform={`translate(${x} ${y}) scale(${dim ? 0.94 : 1})`} opacity={dim ? 0.55 : 1}>
      {glow && <circle r={r + 26} fill="none" stroke={C.hi} strokeWidth={6} opacity={0.5 + 0.4 * Math.sin(frame * 0.4)} />}
      <circle r={r} fill={who === 'yan' ? '#2b1d52' : '#33216a'} />
      <g transform={`scale(${k})`} clipPath="url(#av)">
        <g transform="translate(0 40) scale(1.25)">
          <Person x={0} y={0} s={1} {...base} {...face} mouthOpen={open} sy={1 + (talk ? Math.sin(frame * 0.8) * 0.012 : 0)} />
        </g>
      </g>
      <circle r={r} fill="none" stroke={C.hi} strokeOpacity={0.5} strokeWidth={5} />
    </g>
  );
};

// ---- S1: gancho (0–2.6s) ----
export const S1: React.FC = () => (
  <Svg>
    <Frame1 />
  </Svg>
);
const Frame1: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <g>
      <rect width={W} height={H} fill={C.navy} />
      <g transform={`translate(540 830) scale(${lerp(f, 0, 78, 0.88, 0.96)}) translate(-540 -680)`}>
        <MailApp frame={f} />
      </g>
      {f > 44 && <AlarmOverlay frame={f} />}
    </g>
  );
};

// ---- S2: avalanche de erros (2.6–6.0s) ----
const TITLES = ['Cartinha não está respondendo', 'Tentando reconectar…', 'Cartinha não está respondendo', 'Aguarde…', 'Erro 503', 'Cartinha não está respondendo'];
const ErrWin: React.FC<{x: number; y: number; t: number; title: string; rot: number}> = ({x, y, t, title, rot}) => {
  const s = pop(t, 0, 11, 260);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * 0.62})`}>
      <rect x={-300} y={-150} width={600} height={300} rx={26} fill="#fff" stroke={C.navy} strokeWidth={8} />
      <path d="M-300,-124 Q-300,-150 -274,-150 L274,-150 Q300,-150 300,-124 L300,-82 L-300,-82Z" fill={C.coral} />
      <text x={-262} y={-98} fontFamily={FONT} fontWeight={700} fontSize={36} fill="#fff">⚠ Erro</text>
      <text x={0} y={-6} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={38} fill={C.navy}>{title}</text>
      <rect x={-110} y={50} width={220} height={64} rx={32} fill={C.navy} />
      <text x={0} y={94} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={32} fill="#fff">Aguardar</text>
    </g>
  );
};
export const S2: React.FC = () => (
  <Svg push={0.0012}>
    <Frame2 />
  </Svg>
);
const Frame2: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.min(16, Math.floor(f / 5) + 1);
  const j = jitter(f, 5, 's2');
  return (
    <g transform={`translate(${j.x} ${j.y})`}>
      <rect width={W} height={H} fill={C.navy} />
      <g opacity={0.5} transform="translate(540 830) scale(0.9) translate(-540 -680)">
        <MailApp frame={80} />
      </g>
      <AlarmOverlay frame={f} />
      {Array.from({length: n}).map((_, i) => (
        <ErrWin key={i} t={f - i * 5} x={150 + random('ex' + i) * 780} y={440 + random('ey' + i) * 700} rot={(random('er' + i) - 0.5) * 12} title={TITLES[i % TITLES.length]} />
      ))}
      <text x={540} y={1330} textAnchor="middle" fontFamily={PIXEL} fontSize={34} letterSpacing="3" fill={C.coral}>
        {`JANELAS DE ERRO: ${n}`}
      </text>
    </g>
  );
};

// ---- S3: calma (6.0–10.9s) ----
export const S3: React.FC = () => (
  <Svg>
    <Frame3 />
  </Svg>
);
const Frame3: React.FC = () => {
  const f = useCurrentFrame();
  const talk = f > 6 && f < 140;
  return (
    <g>
      <rect width={W} height={H} fill={C.navy} />
      <circle cx={540} cy={800} r={560} fill={C.violet} opacity={0.3} />
      <Ping x={540} y={800} r={330} frame={f} />
      <Avatar who="yan" x={540} y={800} r={215} mood="deadpan" frame={f} talk={talk} />
      <g transform="translate(790 960)">
        <path d="M45,-25 q48,5 40,40 q-8,30 -45,25" fill="none" stroke="#fff" strokeWidth={16} strokeLinecap="round" />
        <path d="M-50,-45 L50,-45 L40,45 Q0,62 -40,45Z" fill="#fff" stroke={C.navy} strokeWidth={5} strokeLinejoin="round" />
        <ellipse cx={0} cy={-45} rx={50} ry={12} fill="#6B3E26" />
        {[-20, 0, 20].map((dx, i) => {
          const ph = (f * 0.03 + i * 0.33) % 1;
          return <path key={i} d={`M${dx},${-55 - ph * 30} q-12,-22 0,-44`} stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" opacity={1 - ph} />;
        })}
      </g>
    </g>
  );
};

// ---- S4: celular com mensagens (10.9–16.0s) ----
const MSGS = [
  {n: 'Marina', m: 'Oi, quero um orçamento!', c: '#E8A33D', t: 0.6},
  {n: 'Seu Carlos', m: 'Vocês fazem para amanhã?', c: '#4B6FD6', t: 1.6},
  {n: 'Paula', m: 'Vi o site de vocês. Tem horário?', c: '#C084FC', t: 2.6},
];
export const S4: React.FC = () => (
  <Svg>
    <Frame4 />
  </Svg>
);
const Frame4: React.FC = () => {
  const f = useCurrentFrame();
  const shown = MSGS.filter((m) => f >= m.t * FPS).length;
  const vib = MSGS.some((m) => f >= m.t * FPS && f < m.t * FPS + 8) ? jitter(f, 5, 'vb') : {x: 0, y: 0};
  return (
    <g>
      <rect width={W} height={H} fill={C.navy} />
      <circle cx={540} cy={830} r={560} fill={C.violet} opacity={0.28} />
      <Phone x={540 + vib.x} y={820 + vib.y} w={520} h={900} s={1}>
        <rect x={-260} y={-450} width={520} height={900} fill="#0f1418" />
        <rect x={-260} y={-450} width={520} height={130} fill="#128C7E" />
        <text x={-225} y={-355} fontFamily={FONT} fontWeight={700} fontSize={40} fill="#fff">Conversas</text>
        <g transform="translate(150 -362)">
          <rect x={-70} y={-30} width={140} height={52} rx={26} fill={shown ? C.lime : '#0b6e63'} />
          <text x={0} y={7} textAnchor="middle" fontFamily={PIXEL} fontSize={22} fill={shown ? C.navy : '#9ad'}>{shown} NOVAS</text>
        </g>
        {MSGS.map((m, j) => {
          const t0 = m.t * FPS;
          if (f < t0) return null;
          const appear = pop(f, t0, 12, 220);
          // posição: mais novo no topo
          const later = MSGS.filter((o, k) => k > j && f >= o.t * FPS).reduce((a, o) => a + pop(f, o.t * FPS, 14, 160), 0);
          const y = -300 + later * 128;
          return (
            <g key={j} transform={`translate(0 ${y + (1 - Math.min(1, appear)) * -60})`} opacity={Math.min(1, appear)}>
              <rect x={-260} y={0} width={520} height={120} fill="#111b21" />
              <circle cx={-195} cy={60} r={40} fill={m.c} />
              <text x={-195} y={73} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={38} fill={C.navy}>{m.n[0]}</text>
              <text x={-135} y={50} fontFamily={FONT} fontWeight={700} fontSize={32} fill="#fff">{m.n}</text>
              <text x={-135} y={92} fontFamily={FONT} fontWeight={500} fontSize={27} fill="#9aa7b0">{m.m}</text>
              <circle cx={215} cy={72} r={20} fill="#25D366" />
              <text x={215} y={81} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={24} fill={C.navy}>1</text>
              <text x={228} y={40} textAnchor="end" fontFamily={FONT} fontWeight={500} fontSize={22} fill="#25D366">agora</text>
              <rect x={-260} y={118} width={520} height={2} fill="#1f2c34" />
            </g>
          );
        })}
      </Phone>
      {MSGS.map((m, j) => {
        const l = f - m.t * FPS;
        if (l < 0 || l > 16) return null;
        const p = l / 16;
        return <circle key={j} cx={540} cy={560 + j * 0} r={140 + p * 700} fill="none" stroke={C.hi} strokeWidth={10 * (1 - p) + 1} opacity={0.8 * (1 - p)} />;
      })}
    </g>
  );
};

// ---- S5: os dois no telefone (16.0–19.8s) ----
export const S5: React.FC = () => (
  <Svg>
    <Frame5 />
  </Svg>
);
const Frame5: React.FC = () => {
  const f = useCurrentFrame();
  const rTalk = f >= 8 && f < 38; // 16.3–17.3
  const yTalk = f >= 72 && f < 96; // 18.4–19.2
  const rAct = f < 60;
  return (
    <g>
      <rect width={W} height={H} fill={C.navy} />
      <circle cx={540} cy={800} r={560} fill={C.violet} opacity={0.22} />
      <Avatar who="rodrigo" x={290} y={800} r={205} mood="confused" frame={f} talk={rTalk} glow={rTalk} dim={!rTalk && f > 40} />
      <Avatar who="yan" x={790} y={800} r={205} mood="deadpan" frame={f} talk={yTalk} glow={yTalk} dim={!yTalk && f < 70} />
      {f >= 40 && f < 72 && (
        <text x={540} y={1060} textAnchor="middle" fontFamily={PIXEL} fontSize={30} letterSpacing="3" fill={C.muted} opacity={0.5 + 0.5 * Math.sin(f * 0.4)}>
          ...
        </text>
      )}
      {void rAct}
    </g>
  );
};

// ---- barra de ligação (persistente 0–19.8s) ----
const SPEAK: Record<string, [number, number][]> = {
  rodrigo: [[0.5, 2.07], [2.73, 5.05], [13.36, 15.6], [16.38, 17.2]],
  yan: [[6.2, 10.95], [18.5, 19.2]],
};
export const CallBar: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const act = (w: string) => SPEAK[w].some(([a, b]) => t >= a && t <= b);
  const mm = Math.floor(t);
  const bars = (x: number, on: boolean) =>
    [0, 1, 2, 3, 4].map((i) => {
      const h = on ? 12 + Math.abs(Math.sin(f * 0.6 + i * 1.3)) * 36 : 8;
      return <rect key={i} x={x + i * 14} y={-h / 2} width={8} height={h} rx={4} fill={on ? C.lime : C.muted} opacity={on ? 1 : 0.5} />;
    });
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform="translate(540 300)">
          <rect x={-440} y={-62} width={880} height={124} rx={62} fill="rgba(16,12,28,.82)" stroke={C.hi} strokeOpacity={0.45} strokeWidth={3} />
          <circle cx={-370} cy={0} r={40} fill="#33216a" stroke={act('rodrigo') ? C.lime : C.hi} strokeWidth={4} />
          <text x={-370} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.white}>R</text>
          <text x={-310} y={10} fontFamily={FONT} fontWeight={700} fontSize={30} fill={C.white}>Rodrigo</text>
          {bars(-170, act('rodrigo'))}
          <text x={0} y={9} textAnchor="middle" fontFamily={PIXEL} fontSize={22} letterSpacing="2" fill={C.muted}>{`00:${String(mm).padStart(2, '0')}`}</text>
          {bars(100, act('yan'))}
          <text x={170} y={10} fontFamily={FONT} fontWeight={700} fontSize={30} fill={C.white}>Yan</text>
          <circle cx={370} cy={0} r={40} fill="#2b1d52" stroke={act('yan') ? C.lime : C.hi} strokeWidth={4} />
          <text x={370} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.white}>Y</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
void interpolate;
