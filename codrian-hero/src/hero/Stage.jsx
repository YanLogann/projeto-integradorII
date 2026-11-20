import { useLayoutEffect, useRef, useState } from "react";
import Scene from "./Scene.jsx";

const SIZES = {
  portrait: { w: 1080, h: 1920 },
  landscape: { w: 1920, h: 1080 },
};

/**
 * Desenha a cena num "palco" de tamanho fixo (1080x1920 ou 1920x1080)
 * e escala para caber no container. Assim o mesmo layout serve
 * para o site e para a gravação em 9:16.
 */
export default function Stage({ progress, clock, layout: forced }) {
  const ref = useRef(null);
  const [box, setBox] = useState({ layout: forced ?? "portrait", scale: 1 });

  useLayoutEffect(() => {
    const el = ref.current;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const layout = forced ?? (width / height > 1 ? "landscape" : "portrait");
      const { w, h } = SIZES[layout];
      setBox({ layout, scale: Math.min(width / w, height / h) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [forced]);

  const { w, h } = SIZES[box.layout];

  return (
    <div className="stage-fit" ref={ref}>
      <div className="stage" style={{ width: w, height: h, transform: `scale(${box.scale})` }}>
        {/* key: remonta ao trocar de orientação (as faixas da timeline mudam) */}
        <Scene key={box.layout} progress={progress} clock={clock} layout={box.layout} />
      </div>
    </div>
  );
}
