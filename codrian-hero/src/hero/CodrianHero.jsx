import { useEffect, useRef } from "react";
import {
  animate,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Stage from "./Stage.jsx";
import { DURATION } from "./timeline.js";

/**
 * Hero do site: a cena de 15s é "esticada" ao longo de 500vh de scroll.
 * Ao carregar, o gancho (0–2s) toca sozinho; depois o scroll assume.
 */
export default function CodrianHero({ length = "500vh" }) {
  const track = useRef(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.35 });

  // intro automática até 2s (para com o gancho inteiro na tela) (o gancho), sem precisar rolar
  const intro = useMotionValue(0);
  useEffect(() => {
    if (reduced) return;
    const controls = animate(intro, 2 / DURATION, { duration: 2, ease: "linear", delay: 0.2 });
    return () => controls.stop();
  }, [intro, reduced]);

  const progress = useTransform([smooth, intro], ([s, i]) =>
    reduced ? 4.6 / DURATION : Math.max(s, i)
  );

  const clock = useMotionValue(0);
  useAnimationFrame((t) => {
    if (!reduced) clock.set(t / 1000);
  });

  return (
    <section ref={track} className="hero-track" style={{ height: reduced ? "100svh" : length }} aria-label="Codrian — sites que vendem">
      <div className="hero-sticky">
        <Stage progress={progress} clock={clock} />
      </div>
    </section>
  );
}
