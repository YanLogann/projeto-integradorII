import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {C, DURATION, T, mulberry32, ramp, outExpo, clamp01} from './brand';

const SP = 2.1; // passo da quadra
const N = 8; // meia-grade

type B = {x: number; z: number; w: number; d: number; h: number};

function useCity() {
  return useMemo(() => {
    const r = mulberry32(7);
    const list: B[] = [];
    for (let i = -N; i <= N; i++) {
      for (let j = -N; j <= N; j++) {
        if (i === 0 && j === 0) continue;
        const dist = Math.hypot(i, j);
        if (r() < 0.12) continue;
        const h = 0.5 + r() * r() * 3.4 * (1 - Math.min(dist / 12, 0.6));
        list.push({x: i * SP + (r() - 0.5) * 0.3, z: j * SP + (r() - 0.5) * 0.3, w: 0.9 + r() * 0.6, d: 0.9 + r() * 0.6, h});
      }
    }
    return list;
  }, []);
}

// Concorrentes: três prédios que aparecem na busca
const RIVALS: [number, number, number][] = [
  [-3 * SP, -2 * SP, 2.6],
  [3 * SP, -3 * SP, 2.2],
  [-2 * SP, 3 * SP, 2.4],
];
const HERO_H = 3.2;

function makeGlowTex(inner: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.25, inner.replace('1)', '0.45)'));
  grd.addColorStop(1, inner.replace('1)', '0)'));
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeWindowTex() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 64, 128);
  const r = mulberry32(3);
  for (let y = 6; y < 124; y += 10) {
    for (let x = 6; x < 60; x += 12) {
      g.fillStyle = r() < 0.82 ? C.ink : C.violetHi;
      g.fillRect(x, y, 7, 5);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const beamVert = `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const beamFrag = `uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ float edge=pow(abs(dot(vN,vV)),1.6); float fall=pow(1.-vUv.y,1.4)*0.85+0.15*(1.-vUv.y);
 gl_FragColor=vec4(uColor, edge*fall*uOpacity); }`;

function Beam({pos, h, r0, r1, color, opacity}: {pos: [number, number, number]; h: number; r0: number; r1: number; color: string; opacity: number}) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVert,
        fragmentShader: beamFrag,
        uniforms: {uColor: {value: new THREE.Color(color)}, uOpacity: {value: 0}},
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [color],
  );
  mat.uniforms.uOpacity.value = opacity;
  return (
    <mesh position={[pos[0], pos[1] + h / 2, pos[2]]} material={mat}>
      <cylinderGeometry args={[r1, r0, h, 48, 1, true]} />
    </mesh>
  );
}

// Trajetória fechada da câmera: o último quadro volta ao primeiro (loop limpo).
const camKeys: {f: number; p: [number, number, number]; t: [number, number, number]}[] = [
  {f: 0, p: [13, 12, 17], t: [0, 0.4, 0]},
  {f: 45, p: [7.5, 8.5, 11], t: [-1, 0.8, -1]},
  {f: 110, p: [-2, 8.5, 13], t: [-1.5, 1.2, -1]},
  {f: 200, p: [-11, 7, 3], t: [0, 1.2, 0]},
  {f: 280, p: [-3.8, 2.4, 6.2], t: [0, 2.1, 0]},
  {f: 360, p: [2.2, 3.6, 5.4], t: [0, 2.9, 0]},
  {f: 440, p: [1.6, 5.0, 3.2], t: [0, 3.3, 0]},
  {f: 500, p: [4.5, 8, 6.5], t: [0, 2.8, 0]},
  {f: 575, p: [0.4, 12.5, 1.4], t: [0, 3.35, 0]},
  {f: 640, p: [-0.75, 11.6, 1.0], t: [-1.05, 3.35, 0]},
  {f: 705, p: [-0.85, 11.1, 0.9], t: [-1.1, 3.35, 0]},
  {f: 760, p: [6, 13, 12], t: [0, 2, 0]},
];

export const FOV = 40;
export const HERO_TOP = HERO_H + 0.16;
export function camAt(frame: number) {
  const keys = camKeys;
  const n = keys.length;
  const f = ((frame % DURATION) + DURATION) % DURATION;
  let i = n - 1;
  for (let k = 0; k < n; k++) if (keys[k].f <= f) i = k;
  const a = keys[i];
  const b = keys[(i + 1) % n];
  const p0 = keys[(i - 1 + n) % n];
  const p3 = keys[(i + 2) % n];
  const fb = b.f <= a.f ? b.f + DURATION : b.f;
  const u = (f - a.f) / (fb - a.f);
  const cr = (q0: number, q1: number, q2: number, q3: number, t: number) =>
    0.5 * (2 * q1 + (-q0 + q2) * t + (2 * q0 - 5 * q1 + 4 * q2 - q3) * t * t + (-q0 + 3 * q1 - 3 * q2 + q3) * t * t * t);
  const pos = [0, 1, 2].map((k) => cr(p0.p[k], a.p[k], b.p[k], p3.p[k], u)) as [number, number, number];
  const tgt = [0, 1, 2].map((k) => cr(p0.t[k], a.t[k], b.t[k], p3.t[k], u)) as [number, number, number];
  return {pos, tgt};
}

function CameraRig() {
  const frame = useCurrentFrame();
  const {camera} = useThree();
  useLayoutEffect(() => {
    const {pos, tgt} = camAt(frame);
    // tremor curto no impacto
    const s = frame >= T.impact ? Math.exp(-(frame - T.impact) / 5) * 0.12 : 0;
    camera.position.set(pos[0] + Math.sin(frame * 2.3) * s, pos[1] + Math.cos(frame * 3.1) * s, pos[2]);
    camera.lookAt(tgt[0], tgt[1], tgt[2]);
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [frame, camera]);
  return null;
}

export const City: React.FC = () => {
  const frame = useCurrentFrame();
  const city = useCity();
  const glowLime = useMemo(() => makeGlowTex('rgba(183,255,74,1)'), []);
  const glowViolet = useMemo(() => makeGlowTex('rgba(139,108,255,1)'), []);
  const glowDeep = useMemo(() => makeGlowTex('rgba(105,56,232,1)'), []);
  const winTex = useMemo(() => makeWindowTex(), []);

  // prédios instanciados
  const inst = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    city.forEach((b, i) => {
      m.compose(new THREE.Vector3(b.x, b.h / 2, b.z), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d));
      inst.current!.setMatrixAt(i, m);
    });
    inst.current!.instanceMatrix.needsUpdate = true;
  }, [city]);

  // arestas de todos os prédios numa geometria só
  const edges = useMemo(() => {
    const box = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    const src = box.attributes.position.array as Float32Array;
    const out: number[] = [];
    city.forEach((b) => {
      for (let k = 0; k < src.length; k += 3) out.push(b.x + src[k] * b.w, b.h / 2 + src[k + 1] * b.h, b.z + src[k + 2] * b.d);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
    return g;
  }, [city]);

  // Rede: nós nas ruas + ligações aos dois vizinhos mais próximos
  const net = useMemo(() => {
    const r = mulberry32(11);
    const nodes: THREE.Vector3[] = [];
    for (let k = 0; k < 220; k++) {
      const onX = r() < 0.5;
      const lane = (Math.round((r() - 0.5) * 2 * N) + 0.5) * SP;
      const along = (r() - 0.5) * 2 * N * SP;
      nodes.push(new THREE.Vector3(onX ? along : lane, 0.02, onX ? lane : along));
    }
    const seg: number[] = [];
    const order: number[] = [];
    nodes.forEach((a, ia) => {
      const near = nodes
        .map((b, ib) => ({ib, d: a.distanceTo(b)}))
        .filter((o) => o.ib !== ia)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      near.forEach((o) => {
        const b = nodes[o.ib];
        seg.push(a.x, a.y, a.z, b.x, b.y, b.z);
        order.push(a.length(), a.length());
      });
    });
    const lines = new THREE.BufferGeometry();
    lines.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    const pts = new THREE.BufferGeometry();
    pts.setFromPoints(nodes);
    return {nodes, lines, pts, order};
  }, []);

  // Poeira (vazio)
  const dust = useMemo(() => {
    const r = mulberry32(21);
    const arr: number[] = [];
    for (let k = 0; k < 900; k++) arr.push((r() - 0.5) * 40, r() * 12, (r() - 0.5) * 40);
    return arr;
  }, []);
  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const a = dust.slice();
    for (let k = 1; k < a.length; k += 3) a[k] = (a[k] + frame * 0.004) % 12;
    g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    return g;
  }, [dust, frame]);

  // Faíscas convergindo ao centro (revelação)
  const conv = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const a: number[] = [];
    const p = ramp(frame, T.voidEnd - 10, T.revealEnd);
    net.nodes.forEach((n, k) => {
      const delay = (k % 17) / 17;
      const u = outExpo(clamp01((p - delay * 0.5) / 0.5));
      a.push(n.x * (1 - u), 0.05 + u * u * (HERO_H + 0.15), n.z * (1 - u));
    });
    g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    return g;
  }, [frame, net]);

  // ---- Estados por cena ----
  const sweepOn = frame < T.connectEnd + 20;
  const sweepAng = -frame * 0.085;
  const netOn = 0.55 + 0.45 * ramp(frame, 10, 120) - 0.45 * ramp(frame, T.declare, T.declare + 40) + 0.45 * ramp(frame, T.loopStart, DURATION - 1);
  const rivalOn = (i: number) => ramp(frame, 4 + i * 12, 12 + i * 12) * (1 - 0.75 * ramp(frame, T.voidEnd - 30, T.voidEnd));
  const convOn = ramp(frame, T.voidEnd - 10, T.voidEnd + 20) * (1 - ramp(frame, T.impact, T.impact + 4));

  // ponto lima: cresce 15% → 90% antes do impacto, oscila depois
  let dot = 0;
  if (frame >= T.voidEnd - 20 && frame < T.impact) dot = 0.15 + 0.75 * ramp(frame, T.voidEnd - 20, T.impact);
  if (frame >= T.impact) {
    const t = (frame - T.impact) / 30;
    dot = 1 + 0.28 * Math.exp(-7 * t) * Math.cos(14 * t);
  }
  const loopFade = 1 - ramp(frame, T.loopStart + 10, DURATION - 4);
  dot *= loopFade;
  const lit = ramp(frame, T.impact, T.impact + 12) * loopFade;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.32);

  // anéis de radar
  const rings: {s: number; o: number; col: string}[] = [];
  if (frame >= T.impact) {
    const e = frame - T.impact;
    [0, 4].forEach((d, i) => {
      const u = clamp01((e - d) / 40);
      rings.push({s: 0.3 + outExpo(u) * 8.7, o: (1 - u) * 0.9, col: i === 0 ? C.lime : C.violetHi});
    });
    // anéis contínuos de alcance depois do impacto
    for (let k = 0; k < 3; k++) {
      const u = (((e - 30) / 54 + k / 3) % 1 + 1) % 1;
      if (e > 30) rings.push({s: 0.5 + u * 6, o: (1 - u) * 0.55 * loopFade, col: k === 0 ? C.lime : C.violetHi});
    }
  } else if (frame > T.voidEnd) {
    const u = ((frame - T.voidEnd) / 34) % 1;
    rings.push({s: 0.3 + u * 1.6, o: (1 - u) * 0.7 * dot, col: C.lime});
  }

  return (
    <>
      <color attach="background" args={[C.void]} />
      <fog attach="fog" args={[C.void, 9, 34]} />
      <CameraRig />
      <ambientLight color={C.deep} intensity={2.2} />
      <hemisphereLight args={[C.violetHi, C.void, 0.9]} />
      <directionalLight color={C.violetHi} intensity={1.4} position={[-8, 12, 6]} />
      <pointLight color={C.violet} intensity={60 + 40 * lit} distance={22} decay={1.6} position={[0, 7, 0]} />
      <pointLight color={C.lime} intensity={14 * dot} distance={6} decay={2} position={[0, HERO_H + 0.4, 0]} />

      {/* chão */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={C.void} roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Rede */}
      <lineSegments geometry={net.lines}>
        <lineBasicMaterial color={C.violet} transparent opacity={0.5 * netOn} depthWrite={false} />
      </lineSegments>
      <points geometry={net.pts}>
        <pointsMaterial color={C.violetHi} size={0.09} transparent opacity={0.75 * netOn} depthWrite={false} />
      </points>

      {/* cidade */}
      <instancedMesh ref={inst} args={[undefined, undefined, city.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={C.deep} roughness={0.7} metalness={0.15} />
      </instancedMesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={C.violetHi} transparent opacity={0.34 + 0.12 * lit} depthWrite={false} />
      </lineSegments>

      {/* prédio central: a empresa */}
      <mesh position={[0, HERO_H / 2, 0]}>
        <boxGeometry args={[1.5, HERO_H, 1.5]} />
        {[0, 1, 2, 3, 4, 5].map((k) =>
          k === 2 || k === 3 ? (
            <meshStandardMaterial key={k} attach={`material-${k}`} color={C.deep} roughness={0.5} />
          ) : (
            <meshStandardMaterial
              key={k}
              attach={`material-${k}`}
              color={C.deep}
              roughness={0.55}
              emissive={C.ink}
              emissiveMap={winTex}
              emissiveIntensity={0.02 + 1.5 * lit * (1 - 0.6 * ramp(frame, T.declare, T.declare + 30))}
            />
          ),
        )}
      </mesh>
      <lineSegments position={[0, HERO_H / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.5, HERO_H, 1.5)]} />
        <lineBasicMaterial color={lit > 0 ? C.ink : C.muted} transparent opacity={0.35 + 0.6 * lit} />
      </lineSegments>

      {/* luz volumétrica violeta descendo sobre o centro */}
      <Beam pos={[0, 0, 0]} h={14} r0={1.6} r1={4.5} color={C.violet} opacity={0.18 + 0.35 * lit} />
      <sprite position={[0, HERO_H + 0.2, 0]} scale={[9 + 4 * lit, 9 + 4 * lit, 1]}>
        <spriteMaterial map={glowDeep} transparent opacity={0.35 + 0.4 * lit} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>

      {/* concorrentes */}
      {RIVALS.map(([x, z, h], i) => {
        const o = rivalOn(i);
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]}>
              <boxGeometry args={[1.2, h, 1.2]} />
              <meshStandardMaterial color={C.deep} emissive={C.violetHi} emissiveMap={winTex} emissiveIntensity={0.9 * o} />
            </mesh>
            <Beam pos={[0, h, 0]} h={9} r0={0.25} r1={0.5} color={C.violetHi} opacity={0.9 * o} />
            <mesh position={[0, h + 0.35, 0]} scale={o}>
              <sphereGeometry args={[0.16, 24, 16]} />
              <meshBasicMaterial color={C.violetHi} />
            </mesh>
            {[0, 1].map((k) => {
              const u = clamp01((frame - (4 + i * 12) - k * 5) / 26);
              return u > 0 && u < 1 ? (
                <mesh key={k} rotation-x={-Math.PI / 2} position={[0, h + 0.02, 0]} scale={0.3 + outExpo(u) * 3.2}>
                  <ringGeometry args={[0.88, 1, 64]} />
                  <meshBasicMaterial color={C.violetHi} transparent opacity={(1 - u) * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
                </mesh>
              ) : null;
            })}
            <sprite position={[0, h + 0.35, 0]} scale={[2.4 * o, 2.4 * o, 1]}>
              <spriteMaterial map={glowViolet} transparent opacity={0.9 * o} blending={THREE.AdditiveBlending} depthWrite={false} />
            </sprite>
          </group>
        );
      })}

      {/* varredura do radar */}
      {sweepOn && (
        <mesh rotation-x={-Math.PI / 2} rotation-z={sweepAng} position={[0, 0.04, 0]}>
          <circleGeometry args={[22, 64, 0, 0.7]} />
          <meshBasicMaterial
            color={C.violetHi}
            transparent
            opacity={0.3 * (1 - ramp(frame, T.connectEnd - 10, T.connectEnd + 20))}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {sweepOn && (
        <mesh rotation-x={-Math.PI / 2} rotation-z={sweepAng + 0.66} position={[0, 0.05, 0]}>
          <circleGeometry args={[22, 64, 0, 0.04]} />
          <meshBasicMaterial
            color={C.mist}
            transparent
            opacity={0.7 * (1 - ramp(frame, T.connectEnd - 10, T.connectEnd + 20))}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* poeira */}
      <points geometry={dustGeo}>
        <pointsMaterial color={C.mist} size={0.035} transparent opacity={0.45} depthWrite={false} />
      </points>

      {/* convergência */}
      {convOn > 0 && (
        <points geometry={conv}>
          <pointsMaterial color={C.violetHi} size={0.12} transparent opacity={convOn} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
      )}

      {/* ponto lima + halo */}
      {dot > 0.001 && (
        <group position={[0, HERO_H + 0.16, 0]}>
          <mesh scale={dot * (1 - ramp(frame, T.declare + 8, T.declare + 14))}>
            <sphereGeometry args={[0.16, 32, 24]} />
            <meshBasicMaterial color={C.lime} />
          </mesh>
          <sprite scale={[2.2 * dot * (0.9 + 0.2 * pulse), 2.2 * dot * (0.9 + 0.2 * pulse), 1]}>
            <spriteMaterial map={glowLime} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        </group>
      )}
      {rings.map((r, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[0, HERO_H + 0.02, 0]} scale={r.s}>
          <ringGeometry args={[0.92, 1, 96]} />
          <meshBasicMaterial color={r.col} transparent opacity={r.o} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
};
