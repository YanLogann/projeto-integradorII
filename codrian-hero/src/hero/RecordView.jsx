import { useEffect, useRef } from "react";
import { useAnimationFrame, useMotionValue } from "motion/react";
import Stage from "./Stage.jsx";
import { DURATION } from "./timeline.js";

const HOLD = 1.2; // segura o último quadro antes de reiniciar o loop

/**
 * Modo gravação (9:16). Abra /?record numa janela 1080x1920 (ou no DevTools
 * com dispositivo customizado) e grave a tela. Clique/espaço reinicia.
 * Com /?record&frames a cena fica parada e é controlada por window.__seek(seg),
 * usado pelo script de exportação quadro a quadro.
 */
export default function RecordView({ frames }) {
  const progress = useMotionValue(0);
  const clock = useMotionValue(0);
  const start = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add("is-record");
    window.__seek = (sec) => {
      progress.set(Math.min(sec, DURATION) / DURATION);
      clock.set(sec);
    };
    window.__ready = true;
    const restart = (e) => {
      if (e.type === "keydown" && e.code !== "Space") return;
      start.current = null;
    };
    window.addEventListener("click", restart);
    window.addEventListener("keydown", restart);
    return () => {
      window.removeEventListener("click", restart);
      window.removeEventListener("keydown", restart);
    };
  }, [progress, clock]);

  useAnimationFrame((t) => {
    if (frames) return;
    if (start.current == null) start.current = t;
    const sec = (t - start.current) / 1000;
    if (sec > DURATION + HOLD) start.current = t;
    progress.set(Math.min(sec, DURATION) / DURATION);
    clock.set(sec);
  });

  return (
    <div className="record">
      <Stage progress={progress} clock={clock} layout="portrait" />
    </div>
  );
}
