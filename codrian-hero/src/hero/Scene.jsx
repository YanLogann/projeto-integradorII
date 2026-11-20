import { motion, useTransform } from "motion/react";
import Phone from "./Phone.jsx";
import { content } from "./content.js";
import { useTL, useReveal, easeOut, linear } from "./timeline.js";

function Lines({ lines, accentLast = true }) {
  return lines.map((line, i) => (
    <span key={i} className={`line${accentLast && i === lines.length - 1 ? " line--accent" : ""}`}>
      {line}
    </span>
  ));
}

function Word({ progress, at, children, accent }) {
  const { opacity, y } = useReveal(progress, at, 9.9, { dist: 70, fade: 0.4 });
  return (
    <motion.span className={`word${accent ? " word--accent" : ""}`} style={{ opacity, y }}>
      {children}
    </motion.span>
  );
}

/**
 * A cena inteira (15s). Recebe:
 *  - progress: MotionValue 0..1 (scroll, autoplay ou quadro a quadro)
 *  - clock:    MotionValue em segundos (só para a flutuação contínua)
 *  - layout:   "portrait" (9:16 / Reels / mobile) | "landscape" (desktop)
 * Só anima transform e opacity.
 */
export default function Scene({ progress: p, clock, layout }) {
  const portrait = layout === "portrait";

  // ---- câmera -------------------------------------------------------------
  // no desktop o celular fica um pouco menor (palco 1920x1080)
  const k = portrait ? 1 : 0.84;
  const camScale = useTL(
    p,
    [0, 2, 3.2, 6, 10, 12, 12.6, 14.3],
    (portrait ? [0.74, 1.06, 0.98, 0.8, 0.82, 1, 1, 0.6] : [0.74, 1.06, 0.98, 0.84, 0.86, 1, 1, 0.86]).map((v) => v * k)
  );
  // durante a explosão a câmera recua um pouco (abre espaço p/ legendas e tags)
  const camX = useTL(p, [2, 5, 6, 9.4, 11.6], portrait ? [0, 70, 70, -40, 0] : [0, 40, 40, -40, 0]);
  const camY = useTL(p, [2, 5, 9.4, 11.6, 12.6, 14.3], [0, 60, 60, 0, 0, portrait ? 300 : 0]);
  const pushZ = useTL(p, [0, 2], [-520, 0], easeOut);

  // ---- rotação do aparelho ------------------------------------------------
  const rotY = useTL(p, [0, 2, 5, 6, 9.6, 11.6, 13, 15], [-16, -4, -38, -36, 26, 0, 0, -14]);
  const rotX = useTL(p, [0, 2, 5, 9.6, 11.6, 13, 15], [12, 6, 20, 14, 0, 0, 8]);

  // flutuação contínua (não depende do scroll)
  const bobY = useTransform(clock, (t) => Math.sin(t * 1.25) * 14);
  const bobRZ = useTransform(clock, (t) => Math.sin(t * 0.8) * 1.2);
  const bobRY = useTransform(clock, (t) => Math.sin(t * 0.6) * 2.5);
  const rigRY = useTransform([rotY, bobRY], ([a, b]) => a + b);

  // ---- camadas ------------------------------------------------------------
  const explode = useTL(p, [2, 5, 9.4, 11.6], [0, 1, 1, 0]);
  const orbit = useTL(p, [5.4, 9.4, 11.6], [0, 1, 0]);

  // ---- luz que corta a cena (0–2s) ---------------------------------------
  // sincronizada com a linha que corre dentro da tela do celular
  const beamX = useTL(p, [0.25, 0.45, 1.55, 1.75], [-900, -250, 250, 900], linear);
  const beamOpacity = useTL(p, [0.3, 0.5, 1.4, 1.6], [0, 1, 1, 0], linear);

  // ---- ambiente -----------------------------------------------------------
  const glowScale = useTL(p, [0, 2, 6, 10, 13, 15], [0.6, 1, 1.25, 1.1, 1, 0.9]);
  const glowOpacity = useTL(p, [0, 2, 13, 15], [0.35, 0.9, 0.9, 0.6]);
  const greenOpacity = useTL(p, [10.3, 11.2, 13.2, 14.2], [0, 0.85, 0.85, 0]);
  const floorY = useTransform(clock, (t) => (t * 26) % 90);
  const shadowScale = useTransform(explode, [0, 1], [1, 1.4]);
  const shadowOpacity = useTransform(explode, [0, 1], [0.7, 0.35]);

  // ---- textos -------------------------------------------------------------
  const hook = useReveal(p, 0.15, 2.9, { fade: 0.4 });
  const layers = useReveal(p, 3.0, 6.1);
  const whats = useReveal(p, 10.4, 13.1);
  const end = useReveal(p, 13.2, null, { dist: 50, fade: 0.55 });
  const endSub = useReveal(p, 13.5, null, { dist: 30, fade: 0.5 });
  const endCta = useReveal(p, 13.9, null, { dist: 30, fade: 0.5 });
  const shineX = useTL(p, [13.7, 14.7], ["-120%", "120%"], easeOut);
  const scrollHint = useTL(p, [0, 1.2], [1, 0], linear);

  return (
    <div className={`scene scene--${layout}`}>
      <div className="ambient">
        <motion.div className="ambient__glow" style={{ scale: glowScale, opacity: glowOpacity }} />
        <motion.div className="ambient__green" style={{ opacity: greenOpacity }} />
        <div className="floor-wrap">
          <motion.div className="floor" style={{ y: floorY }} />
        </div>
      </div>

      <motion.div className="camera" style={{ scale: camScale, x: camX, y: camY }}>
        <motion.div className="shadow" style={{ scale: shadowScale, opacity: shadowOpacity }} />
        <motion.div
          className="rig"
          style={{ z: pushZ, y: bobY, rotateX: rotX, rotateY: rigRY, rotateZ: bobRZ }}
        >
          <Phone progress={p} explode={explode} orbit={orbit} />
        </motion.div>
      </motion.div>

      <div className="beam-wrap" aria-hidden="true">
        <motion.div className="beam" style={{ x: beamX, opacity: beamOpacity }} />
      </div>

      <div className="captions">
        <motion.div className="caption caption--hook" style={hook}>
          <span className="eyebrow">
            <i /> {content.hook.eyebrow}
          </span>
          <h2>
            <Lines lines={content.hook.title} />
          </h2>
        </motion.div>

        <motion.h2 className="caption" style={layers}>
          <Lines lines={content.layers.title} />
        </motion.h2>

        <h2 className="caption caption--words">
          {content.words.map((w, i) => (
            <Word key={w} progress={p} at={6.3 + i * 0.85} accent={i === content.words.length - 1}>
              {w}
            </Word>
          ))}
        </h2>

        <motion.h2 className="caption" style={whats}>
          <Lines lines={content.whatsapp.title} />
        </motion.h2>

        <div className="caption caption--end">
          <motion.div className="wordmark" style={end}>
            <span className="wordmark__dot" />
            {content.brand}
            <span className="wordmark__shine-clip" aria-hidden="true">
              <motion.span className="wordmark__shine" style={{ x: shineX }} />
            </span>
          </motion.div>
          <motion.p className="end__tagline" style={endSub}>
            {content.tagline}
          </motion.p>
          <motion.span className="end__cta" style={endCta}>
            {content.cta} <span aria-hidden="true">→</span>
          </motion.span>
        </div>
      </div>

      <motion.div className="scroll-hint" style={{ opacity: scrollHint }} data-hint>
        <span /> role para ver
      </motion.div>
    </div>
  );
}
