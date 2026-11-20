import CodrianHero from "./hero/CodrianHero.jsx";
import RecordView from "./hero/RecordView.jsx";

// /            -> hero ligada ao scroll (site)
// /?record     -> 1080x1920, toca os 15s em loop (gravar a tela)
// /?record&frames -> modo quadro a quadro usado por scripts/record.mjs
const params = new URLSearchParams(window.location.search);

export default function App() {
  if (params.has("record")) {
    return <RecordView frames={params.has("frames")} />;
  }

  return (
    <main>
      <CodrianHero />
      <section className="after-hero">
        <p>Seu conteúdo continua aqui.</p>
      </section>
    </main>
  );
}
