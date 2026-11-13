import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, W, H, BRAND, FONT, PIXEL} from './theme';
import {jitter, lerp, mouthFlap, pop} from './anim';
import {Person} from './Person';
import {AlarmOverlay, Bubble, Burst, Desk, Mug, Monitor, Office, Paper, Phone, Spark, Spinner, Steam, MailApp, Logo, Net, Ping} from './Props';

const Stage: React.FC<{zoom?: number; cx?: number; cy?: number; shake?: number; seed?: string; children: (f: number) => React.ReactNode}> = ({zoom = 1, cx = W / 2, cy = 700, shake = 0, seed = 'k', children}) => {
  const f = useCurrentFrame();
  const j = shake ? jitter(f, shake, seed) : {x: 0, y: 0};
  return (
    <AbsoluteFill style={{background: C.navy}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform={`translate(${cx} ${cy}) scale(${zoom}) translate(${-cx + j.x} ${-cy + j.y})`}>{children(f)}</g>
      </svg>
    </AbsoluteFill>
  );
};

const boss = (f: number, extra: Partial<React.ComponentProps<typeof Person>> = {}) => ({
  skin: C.skinB, hair: 'bald' as const, hairColor: '#3b2a20', shirt: C.suit, jacket: true, tie: C.coral, mustache: true, ...extra,
});
const ana = (extra: Partial<React.ComponentProps<typeof Person>> = {}) => ({
  skin: C.skinA, hair: 'bun' as const, hairColor: '#2a1650', shirt: '#E8A33D', ...extra,
});
const beto = (extra: Partial<React.ComponentProps<typeof Person>> = {}) => ({
  skin: C.skinC, hair: 'spiky' as const, hairColor: '#111827', shirt: '#4B6FD6', glasses: false, ...extra,
});
const cara = (extra: Partial<React.ComponentProps<typeof Person>> = {}) => ({
  skin: C.skinA, hair: 'short' as const, hairColor: '#7C3F12', shirt: C.violet, hood: true, glasses: true, ...extra,
});

// 1) Tela travada (0–1.6s)
export const ShotScreen: React.FC = () => (
  <Stage zoom={1} cy={680} shake={0}>
    {(f) => (
      <g>
        <rect width={W} height={H} fill={C.navy} />
        <g transform={`translate(540 680) scale(${lerp(f, 0, 48, 0.94, 1.02)}) translate(-540 -680)`}>
          <MailApp frame={f} />
        </g>
        {f > 44 && <AlarmOverlay frame={f} />}
      </g>
    )}
  </Stage>
);

// 2) Escritório em pânico (1.6–3.0s)
export const ShotOffice: React.FC = () => (
  <Stage zoom={lerp(0, 0, 1, 1, 1)} shake={7} seed="o">
    {(f) => {
      const bob = (ph: number) => Math.sin(f * 0.9 + ph);
      return (
        <g>
          <Office frame={f} alarm />
          <Desk y={1010} />
          <Person x={180} y={620} s={0.62} {...boss(f, {eyes: 'wide', mouth: 'shout', mouthOpen: mouthFlap(f), brows: 'angry', lArm: [-210, -20 + bob(0) * 40], rArm: [210, -20 - bob(0) * 40]})} />
          <Person x={420} y={680} s={0.62} {...ana({eyes: 'x', mouth: 'o', mouthOpen: mouthFlap(f), brows: 'worried', lArm: [-140, -80], rArm: [140, -80], sy: 1 + bob(1) * 0.04, sx: 1 - bob(1) * 0.04})} />
          <Person x={660} y={640} s={0.62} {...beto({eyes: 'wide', mouth: 'o', mouthOpen: mouthFlap(f + 3), brows: 'worried', lArm: [-200, -10 + bob(2) * 50], rArm: [200, -10 - bob(2) * 50]})} />
          <Person x={900} y={690} s={0.62} {...cara({eyes: 'wide', mouth: 'worry', brows: 'worried', hood: false, shirt: '#D8CCFF', hair: 'long', hairColor: '#111827', glasses: false, lArm: [-120, 20], rArm: [120, 20]})} />
          {Array.from({length: 14}).map((_, i) => (
            <Paper key={i} frame={f + 40} i={i} />
          ))}
        </g>
      );
    }}
  </Stage>
);

// 3) Chefe grita (3.0–5.5s)
export const ShotBoss: React.FC = () => (
  <Stage zoom={1} cx={540} cy={640} shake={9} seed="b">
    {(f) => {
      const z = lerp(f, 0, 70, 1, 1.28);
      const open = mouthFlap(f * 1.0);
      return (
        <g transform={`translate(540 640) scale(${z}) translate(-540 -640)`}>
          <rect width={W} height={H} fill="#240d24" />
          <Burst x={540} y={640} frame={f} color={C.coral} color2={C.hi} />
          <AlarmOverlay frame={f} />
          <Person x={540} y={640} s={2.25} {...boss(f, {eyes: 'wide', mouth: 'shout', mouthOpen: open, brows: 'angry', sx: 1 - open * 0.03, sy: 1 + open * 0.05, look: [0, 2]})} />
          {/* marca de raiva e vapor */}
          <g transform={`translate(${790 + Math.sin(f) * 4} 360) scale(${1 + Math.abs(Math.sin(f * 0.6)) * 0.25})`} stroke={C.coral} strokeWidth={14} strokeLinecap="round" fill="none">
            <path d="M-30,-10 Q0,-40 30,-10 M-30,10 Q0,40 30,10" />
            <path d="M-12,-34 Q-40,0 -12,34 M12,-34 Q40,0 12,34" />
          </g>
          <Spark x={300} y={400} frame={f} start={3} color="#fff" />
        </g>
      );
    }}
  </Stage>
);

// 4) Colega abraça o monitor (5.5–7.5s)
export const ShotHug: React.FC = () => (
  <Stage zoom={1} shake={4} seed="h">
    {(f) => {
      const sob = Math.sin(f * 0.7);
      return (
        <g>
          <Office frame={f} alarm tint={C.wall} />
          <Burst x={540} y={650} frame={f} color={C.hi} />
          <Person
            x={540}
            y={600}
            s={1.9}
            {...ana({
              eyes: 'closed',
              mouth: 'worry',
              brows: 'worried',
              tears: f,
              sx: 1 + sob * 0.025,
              sy: 1 - sob * 0.03,
              mid: (
                <g transform="translate(0 330)">
                  <Monitor x={0} y={0} w={400} h={300} frame={f} />
                </g>
              ),
              lArm: [-185, 340],
              rArm: [185, 340],
            })}
          />
          {Array.from({length: 6}).map((_, i) => (
            <Paper key={i} frame={f + 100} i={i + 20} area={[0, 0, W, 900]} />
          ))}
        </g>
      );
    }}
  </Stage>
);

// 5) Colega na espera (7.5–9.0s)
export const ShotHold: React.FC = () => (
  <Stage zoom={1} shake={2} seed="p">
    {(f) => {
      const droop = lerp(f, 0, 45, 0, 1);
      return (
        <g>
          <Office frame={f} alarm tint="#241a45" />
          <Person
            x={470}
            y={640}
            s={1.9}
            {...beto({
              eyes: 'dot',
              mouth: 'flat',
              brows: 'flat',
              rot: lerp(f, 0, 45, -2, 5),
              sy: 1 - droop * 0.05,
              look: [0, 8],
              rArm: [190, -50],
              lArm: [-120, 330],
              front: (
                <g transform={`translate(205 -70) rotate(-15)`}>
                  <rect x={-34} y={-130} width={68} height={260} rx={34} fill={C.ink} />
                  <rect x={-18} y={-100} width={36} height={160} rx={14} fill="#334155" />
                  <circle cx={0} cy={95} r={10} fill={C.green} />
                </g>
              ),
            })}
          />
          {/* notas musicais */}
          {[0, 1, 2].map((i) => {
            const ph = ((f * 0.03 + i / 3) % 1);
            return (
              <text key={i} x={760 + Math.sin(ph * 9 + i) * 40} y={620 - ph * 360} fontFamily={FONT} fontWeight={700} fontSize={90} fill={C.yellow} opacity={1 - ph}>
                {i % 2 ? '♪' : '♫'}
              </text>
            );
          })}
          <Bubble x={330} y={250} w={560} h={160} fill="#fff" tail="b">
            <text x={0} y={-12} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={44} fill={C.ink}>
              Em espera
            </text>
            <rect x={-220} y={22} width={440} height={26} rx={13} fill="#E2E8F0" />
            <rect x={-220} y={22} width={440 * lerp(f, 0, 45, 0.02, 0.07)} height={26} rx={13} fill={C.coral} />
          </Bubble>
        </g>
      );
    }}
  </Stage>
);

// 6) Entra o cara do site (9.0–12.0s)
export const ShotEnter: React.FC = () => (
  <Stage zoom={1} shake={0}>
    {(f) => {
      const t = lerp(f, 0, 50, 0, 1);
      const x = 1250 - t * (1250 - 600);
      const walking = f < 50;
      const bob = walking ? Math.abs(Math.sin(f * 0.55)) * 24 : 0;
      const sq = walking ? Math.sin(f * 0.55) * 0.04 : Math.sin(f * 0.12) * 0.01;
      const bj = jitter(f, 6, 'bg');
      return (
        <g>
          <g transform={`translate(${bj.x} ${bj.y})`}>
            <Office frame={f} alarm dim />
            <Desk y={1010} />
            {[150, 400, 820].map((px, i) => (
              <Person key={i} x={px} y={700} s={0.5} {...[boss(f, {eyes: 'wide', mouth: 'shout', mouthOpen: mouthFlap(f), brows: 'angry', lArm: [-200, -30], rArm: [200, -30]}), ana({eyes: 'x', mouth: 'o', mouthOpen: mouthFlap(f), brows: 'worried', lArm: [-130, 20], rArm: [130, 20]}), beto({eyes: 'dot', mouth: 'flat', brows: 'flat', rArm: [190, -40]})][i]} />
            ))}
            {Array.from({length: 8}).map((_, i) => (
              <Paper key={i} frame={f + 60} i={i + 40} area={[0, 0, W, 900]} />
            ))}
          </g>
          {/* cara do site – em primeiro plano, sem tremer */}
          <Person
            x={x}
            y={760 - bob}
            s={1.15}
            {...cara({
              eyes: 'calm',
              mouth: 'smile',
              brows: 'calm',
              sy: 1 - sq,
              sx: 1 + sq,
              rot: walking ? Math.sin(f * 0.55) * 2 : 0,
              rArm: [175, 175],
              lArm: [-150, 330],
              front: (
                <g>
                  <Mug x={185} y={140} rot={walking ? Math.sin(f * 0.55) * 5 : 0} s={0.85} />
                  <Steam x={185} y={90} frame={f} />
                </g>
              ),
            })}
          />
          {f < 4 && <rect width={W} height={H} fill="#fff" opacity={1 - f / 4} />}
        </g>
      );
    }}
  </Stage>
);

// 7) "Calma." (12.0–15.0s)
export const ShotCalm: React.FC = () => (
  <Stage zoom={1} cy={650}>
    {(f) => {
      const sip = f < 28 ? Math.sin((f / 28) * Math.PI) : 0;
      const talking = f >= 28 && f < 85;
      const open = mouthFlap(f, talking);
      const z = lerp(f, 0, 90, 1, 1.1);
      return (
        <g transform={`translate(540 650) scale(${z}) translate(-540 -650)`}>
          <rect width={W} height={H} fill={C.navy} />
          <Burst x={540} y={620} frame={f * 0.4} color={C.hi} color2={C.violet} n={14} />
          <circle cx={540} cy={620} r={460} fill={C.violet} opacity={0.4} />
          <Person
            x={540}
            y={620}
            s={2.1}
            {...cara({
              eyes: sip > 0.5 ? 'closed' : 'calm',
              mouth: talking ? 'talk' : sip > 0.5 ? 'flat' : 'smile',
              mouthOpen: open * 0.5,
              brows: 'calm',
              sy: 1 + Math.sin(f * 0.1) * 0.01,
              rArm: [lerp(sip, 0, 1, 125, 70), lerp(sip, 0, 1, 250, 120)],
              lArm: [-150, 330],
              front: (
                <g>
                  <Mug x={lerp(sip, 0, 1, 135, 90)} y={lerp(sip, 0, 1, 230, 100)} rot={lerp(sip, 0, 1, 0, -22)} s={0.8} />
                  {sip < 0.3 && <Steam x={135} y={170} frame={f} />}
                </g>
              ),
            })}
          />
        </g>
      );
    }}
  </Stage>
);

// 8) Prova: celular com site e botão (15.0–18.5s)
export const ShotPhone: React.FC = () => (
  <Stage zoom={1} cy={600}>
    {(f) => {
      const tap = 52;
      const showChat = f >= tap + 8;
      const vib = f >= 82 && f < 92 ? jitter(f, 5, 'v') : {x: 0, y: 0};
      const pressed = f >= tap && f < tap + 6;
      const fx = lerp(f, 30, tap, 760, 590);
      const fy = lerp(f, 30, tap, 1180, 880);
      const msg = pop(f, 74);
      return (
        <g>
          <rect width={W} height={H} fill={C.navy} />
          <Burst x={540} y={600} frame={f * 0.5} color={C.hi} color2={C.violet} n={16} />
          <Phone x={540 + vib.x} y={640 + vib.y} w={520} h={920} s={1}>
            {!showChat ? (
              <g>
                <rect x={-260} y={-460} width={520} height={920} fill="#FFF7ED" />
                <rect x={-260} y={-460} width={520} height={110} fill="#6F4E37" />
                <text x={0} y={-385} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill="#fff">
                  ☕ Café Boa Hora
                </text>
                <circle cx={0} cy={-170} r={120} fill="#F59E0B" />
                <path d="M-60,-210 L60,-210 L45,-110 Q0,-90 -45,-110Z" fill="#fff" />
                <ellipse cx={0} cy={-210} rx={60} ry={12} fill="#6B3E26" />
                <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.ink}>
                  O melhor café
                </text>
                <text x={0} y={46} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill={C.ink}>
                  da cidade
                </text>
                <g transform={`translate(0 ${190}) scale(${pressed ? 0.94 : 1 + Math.sin(f * 0.25) * 0.02})`}>
                  <rect x={-215} y={-48} width={430} height={96} rx={48} fill={C.green} stroke={C.ink} strokeWidth={5} />
                  <circle cx={-150} cy={0} r={26} fill="#fff" />
                  <path d="M-160,-10 q10,24 28,22" stroke={C.green} strokeWidth={8} fill="none" strokeLinecap="round" />
                  <text x={40} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={31} fill="#fff">
                    Falar no WhatsApp
                  </text>
                </g>
              </g>
            ) : (
              <g>
                <rect x={-260} y={-460} width={520} height={920} fill="#ECE5DD" />
                <rect x={-260} y={-460} width={520} height={110} fill="#128C7E" />
                <circle cx={-195} cy={-405} r={32} fill="#F59E0B" />
                <text x={-145} y={-392} fontFamily={FONT} fontWeight={700} fontSize={34} fill="#fff">
                  Café Boa Hora
                </text>
                <g transform={`translate(70 -200) scale(${msg})`}>
                  <rect x={-210} y={-60} width={400} height={120} rx={28} fill="#DCF8C6" stroke={C.ink} strokeWidth={4} />
                  <text x={-10} y={-8} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={34} fill={C.ink}>
                    Oi, quero um
                  </text>
                  <text x={-10} y={34} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={34} fill={C.ink}>
                    orçamento!
                  </text>
                </g>
                {f < 74 && (
                  <g transform="translate(60 -200)">
                    {[0, 1, 2].map((i) => (
                      <circle key={i} cx={-30 + i * 30} cy={Math.sin(f * 0.5 + i) * 8} r={10} fill="#64748B" />
                    ))}
                  </g>
                )}
              </g>
            )}
          </Phone>
          {/* dedo */}
          {f >= 30 && f < tap + 14 && (
            <g transform={`translate(${fx} ${fy})`}>
              <rect x={-34} y={0} width={68} height={420} rx={34} fill={C.skinA} />
              <circle cx={0} cy={0} r={34} fill={C.skinA} />
            </g>
          )}
          <Spark x={590} y={880} frame={f} start={tap} color={C.lime} />
          {f >= 74 && f < 84 && <circle cx={540} cy={640} r={lerp(f, 74, 84, 300, 700)} fill="none" stroke={C.green} strokeWidth={14} opacity={lerp(f, 74, 84, 0.9, 0)} />}
        </g>
      );
    }}
  </Stage>
);

// 9) Chefe em silêncio (18.5–19.8s)
export const ShotSilence: React.FC = () => (
  <Stage zoom={1} cy={650}>
    {(f) => {
      const z = lerp(f, 0, 39, 1, 1.16);
      return (
        <g transform={`translate(540 650) scale(${z}) translate(-540 -650)`}>
          <rect width={W} height={H} fill="#17122a" />
          <circle cx={540} cy={640} r={420} fill="#2a2342" />
          <Person x={540} y={640} s={2.15} {...boss(f, {eyes: 'dot', mouth: 'flat', brows: 'flat', sweat: true, look: [f > 20 ? 14 : 0, 0], sy: 1 - lerp(f, 0, 39, 0, 0.03)})} />
          {[0, 1, 2].map((i) => (
            <text key={i} x={120 + i * 300} y={300 + Math.sin(f * 0.2 + i) * 6} fontFamily={FONT} fontWeight={700} fontSize={52} fill={C.muted} opacity={0.8}>
              {i === 1 ? '…' : '·  ·  ·'}
            </text>
          ))}
        </g>
      );
    }}
  </Stage>
);

// 10) Colega: "…e o e-mail?" (19.8–20.8s)
export const ShotEmail: React.FC = () => (
  <Stage zoom={1} cy={650}>
    {(f) => {
      const z = lerp(f, 0, 30, 1, 1.08);
      return (
        <g transform={`translate(540 650) scale(${z}) translate(-540 -650)`}>
          <rect width={W} height={H} fill={C.navy2} />
          <circle cx={540} cy={640} r={420} fill="#3a2a73" />
          <Person
            x={540}
            y={640}
            s={2.1}
            {...ana({eyes: 'wide', mouth: 'talk', mouthOpen: mouthFlap(f, f < 22) * 0.6, brows: 'up', look: [0, -4], rArm: [95, 255], sy: 1 + pop(f, 0) * 0.02})}
          />
        </g>
      );
    }}
  </Stage>
);

// 11) Cara do site: "Que e-mail?" (20.8–21.8s)
export const ShotWhat: React.FC = () => (
  <Stage zoom={1} cy={650}>
    {(f) => {
      const z = lerp(f, 0, 30, 1.0, 1.1);
      return (
        <g transform={`translate(540 650) scale(${z}) translate(-540 -650)`}>
          <rect width={W} height={H} fill={C.navy} />
          <circle cx={540} cy={620} r={440} fill={C.violet} opacity={0.45} />
          <Person
            x={540}
            y={620}
            s={2.1}
            {...cara({
              eyes: f > 14 ? 'happy' : 'calm',
              mouth: f < 14 ? 'talk' : 'grin',
              mouthOpen: mouthFlap(f, f < 14) * 0.5,
              brows: 'up',
              blush: true,
              rot: Math.sin(f * 0.2) * 1.5,
              rArm: [125, 250],
              lArm: [-150, 330],
              front: (
                <g>
                  <Mug x={135} y={225} s={0.8} />
                  <Steam x={135} y={165} frame={f} />
                </g>
              ),
            })}
          />
          <Spark x={800} y={360} frame={f} start={16} color={C.lime} />
        </g>
      );
    }}
  </Stage>
);

// 12) Fechamento (21.8–26.0s) — identidade oficial: void + rede + ping + logo
export const ShotClose: React.FC = () => (
  <Stage zoom={1}>
    {(f) => {
      const logo = pop(f, 8, 12, 120);
      const cta = pop(f, 78, 10, 200);
      const sig = pop(f, 22, 14, 120);
      const rings = [0, 1, 2].map((i) => ((f * 0.012 + i / 3) % 1));
      return (
        <g>
          <rect width={W} height={H} fill={C.navy} />
          <Net frame={f} />
          <circle cx={540} cy={420} r={520} fill={C.violet} opacity={0.28} />
          <Ping x={540} y={420} r={170} frame={f} />
          <g transform={`translate(540 640) scale(${0.5 + 0.5 * logo})`} opacity={Math.min(1, logo)}>
            <Logo w={640} />
          </g>
          <text x={540} y={770} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={40} fill={C.mist} opacity={Math.min(1, sig)}>
            Sites que colocam sua empresa no mapa.
          </text>
          <text x={540} y={830} textAnchor="middle" fontFamily={PIXEL} fontSize={26} letterSpacing="2" fill={C.muted} opacity={Math.min(1, sig)}>
            SÃO GABRIEL DO OESTE · CAMPO GRANDE · MS
          </text>
          <g transform={`translate(540 1440) scale(${cta})`}>
            <rect x={-420} y={-70} width={840} height={140} rx={70} fill={C.lime} />
            <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={58} fill={C.navy} letterSpacing="-1.5">
              Chama no direct: {BRAND.handle}
            </text>
          </g>
          {void rings}
        </g>
      );
    }}
  </Stage>
);
