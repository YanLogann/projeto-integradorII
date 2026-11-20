import { motion, useTransform } from "motion/react";
import { content } from "./content.js";
import { useTL, easeOut, linear } from "./timeline.js";

const { demo, tags } = content;

/**
 * Uma camada do site. Fica "colada" na tela (z = base) e, quando `explode`
 * vai a 1, sai em profundidade (translateZ) e se espalha (x/y).
 * `orbit` (fase 6–10s) abre um leque extra para dar sensação de órbita.
 */
function Layer({ explode, orbit, base, depth, fan = [0, 0], swing = [0, 0], className, children }) {
  const z = useTransform(explode, (e) => base + e * depth);
  const x = useTransform([explode, orbit], ([e, o]) => e * fan[0] + o * swing[0]);
  const y = useTransform([explode, orbit], ([e, o]) => e * fan[1] + o * swing[1]);
  return (
    <motion.div className={`layer ${className}`} style={{ z, x, y }}>
      {children}
    </motion.div>
  );
}

function Tag({ explode, children, side = "left" }) {
  const opacity = useTransform(explode, [0.55, 0.95], [0, 1]);
  const x = useTransform(explode, [0.55, 1], [side === "left" ? 30 : -30, 0]);
  return (
    <motion.span className={`tag tag--${side}`} style={{ opacity, x }}>
      <i />
      {children}
    </motion.span>
  );
}

function Photo({ kind, src }) {
  if (src) return <img className="photo" src={src} alt="" draggable={false} />;
  return <div className={`photo photo--${kind}`} aria-hidden="true" />;
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3Zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.6-5.6C5.2 9.9 10 5.2 16 5.2s10.8 4.7 10.8 10.6S22 26.4 16 26.4Zm5.9-7.9c-.3-.2-1.9-1-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.2 1.3 3.4c.2.2 2.3 3.5 5.6 4.9 2.8 1.1 3.3.9 3.9.8.6-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4Z"
      />
    </svg>
  );
}

export default function Phone({ progress, explode, orbit }) {
  // 0–2s: tela apagada -> linha de luz atravessa e "acende" o site
  const coverX = useTL(progress, [0.45, 1.55], ["0%", "104%"], linear);
  const lineOpacity = useTL(progress, [0.4, 0.55, 1.45, 1.6], [0, 1, 1, 0], linear);
  const flash = useTL(progress, [1.4, 1.6, 2.0], [0, 0.55, 0], easeOut);

  // 10–13s: notificação do WhatsApp chega
  const toastOpacity = useTL(progress, [10.7, 11.1, 14.2, 14.6], [0, 1, 1, 0], easeOut);
  const toastY = useTL(progress, [10.7, 11.3], [-70, 0], easeOut);
  const toastZ = useTL(progress, [10.7, 11.4], [320, 30], easeOut);
  const toastScale = useTL(progress, [10.7, 11.3], [0.9, 1], easeOut);
  const btnScale = useTL(progress, [10.3, 10.55, 10.9], [1, 1.07, 1], easeOut);
  const ring = useTL(progress, [10.35, 11.3], [0.9, 1.5], easeOut);
  const ringOpacity = useTL(progress, [10.35, 10.5, 11.3], [0, 0.8, 0], linear);

  return (
    <div className="phone">
      {/* espessura do aparelho: fatias empilhadas atrás */}
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="phone__slice" style={{ transform: `translateZ(${-2 - i * 2}px)` }} />
      ))}
      <div className="phone__body" />
      <div className="phone__btn phone__btn--a" />
      <div className="phone__btn phone__btn--b" />

      <div className="screen">
        <div className="screen__base" />

        <Layer className="l-bg" explode={explode} orbit={orbit} base={1} depth={30} swing={[0, 0]}>
          <div className="statusbar">
            <span>9:41</span>
            <span className="statusbar__icons">
              <b /><b /><b />
            </span>
          </div>
          <div className="bg-glow" />
        </Layer>

        <Layer className="l-nav" explode={explode} orbit={orbit} base={2} depth={260} fan={[0, -70]} swing={[-30, -30]}>
          <div className="nav">
            <span className="nav__logo"><i />{demo.name}</span>
            <span className="nav__menu"><b /><b /></span>
          </div>
        </Layer>

        <Layer className="l-hero" explode={explode} orbit={orbit} base={3} depth={150} fan={[-20, -30]} swing={[40, 0]}>
          <p className="d-eyebrow">{demo.eyebrow}</p>
          <h3 className="d-title">
            {demo.title[0]}
            <br />
            <em>{demo.title[1]}</em>
          </h3>
          <p className="d-sub">{demo.sub}</p>
          <span className="d-rating">★ {demo.rating}</span>
          <Tag explode={explode}>{tags.hero}</Tag>
        </Layer>

        <Layer className="l-card l-card--a" explode={explode} orbit={orbit} base={4} depth={300} fan={[-40, 10]} swing={[-50, 20]}>
          <div className="card">
            <Photo kind={demo.cards[0].kind} src={demo.cards[0].photo} />
            <div className="card__meta">
              <span>{demo.cards[0].label}</span>
              <b>{demo.cards[0].price}</b>
            </div>
          </div>
          <Tag explode={explode}>{tags.cards}</Tag>
        </Layer>

        <Layer className="l-card l-card--b" explode={explode} orbit={orbit} base={4} depth={430} fan={[70, 30]} swing={[70, 40]}>
          <div className="card">
            <Photo kind={demo.cards[1].kind} src={demo.cards[1].photo} />
            <div className="card__meta">
              <span>{demo.cards[1].label}</span>
              <b>{demo.cards[1].price}</b>
            </div>
          </div>
        </Layer>

        <Layer className="l-status" explode={explode} orbit={orbit} base={3} depth={200} fan={[0, 40]} swing={[-20, 30]}>
          <div className="status">
            <i /> {demo.status}
          </div>
        </Layer>

        <Layer className="l-wa" explode={explode} orbit={orbit} base={5} depth={440} fan={[40, 80]} swing={[20, 50]}>
          <motion.div className="wa" style={{ scale: btnScale }}>
            <motion.span className="wa__ring" style={{ scale: ring, opacity: ringOpacity }} />
            <WhatsAppIcon />
            {demo.button}
          </motion.div>
          <Tag explode={explode}>{tags.whatsapp}</Tag>
        </Layer>

        <motion.div
          className="layer l-toast"
          style={{ z: toastZ, y: toastY, opacity: toastOpacity, scale: toastScale }}
        >
          <div className="toast">
            <span className="toast__icon"><WhatsAppIcon /></span>
            <span className="toast__body">
              <b>{demo.toast.from}</b>
              <span>{demo.toast.text}</span>
            </span>
            <span className="toast__time">agora</span>
          </div>
        </motion.div>

        {/* vidro + tampa preta da abertura (fica sempre no plano da tela) */}
        <div className="glass">
          <motion.div className="cover" style={{ x: coverX }}>
            <motion.span className="cover__line" style={{ opacity: lineOpacity }} />
          </motion.div>
          <motion.div className="flash" style={{ opacity: flash }} />
          <div className="glare" />
          <div className="island" />
        </div>
      </div>
    </div>
  );
}
