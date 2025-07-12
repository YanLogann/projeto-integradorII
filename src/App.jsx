import React from 'react';
import './App.css';

function App() {
  return (
    <>
      <header>
        <h1>Cafeteria Aroma & Sabor</h1>
      </header>

      <main>
        <section className="description">
          <p>
            Delicie-se com nossos cafés especiais e quitutes feitos com amor e ingredientes selecionados.
          </p>
        </section>

        <section className="image-section">
          <img
            src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80"
            alt="Café com grãos"
          />
        </section>

        <section className="action-section">
          <button onClick={() => alert('Pedido realizado!')}>
            Fazer Pedido
          </button>
        </section>
      </main>

      <footer>
        <small>© 2025 Cafeteria Aroma & Sabor</small>
      </footer>
    </>
  );
}

export default App;
