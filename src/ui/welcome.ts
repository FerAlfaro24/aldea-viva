export function renderWelcome(container: HTMLElement): void {
  container.innerHTML = `
    <main class="welcome" aria-labelledby="game-title">
      <header class="masthead">
        <span class="wordmark">AV<span aria-hidden="true">.</span></span>
        <span class="development-status">En desarrollo</span>
      </header>

      <section class="introduction" aria-labelledby="game-title">
        <p class="eyebrow">Gestión · Supervivencia · Historias</p>
        <h1 id="game-title">Aldea <em>Viva</em></h1>
        <p class="tagline">Cada decisión deja huella.</p>
        <p class="description">
          Una comunidad medieval. El paso de las estaciones.
          Y las historias de quienes llaman hogar a tu aldea.
        </p>

        <details class="about">
          <summary>Acerca del juego <span class="details-indicator" aria-hidden="true">+</span></summary>
          <p>
            En Aldea Viva guiarás a una comunidad: asignarás trabajos,
            decidirás prioridades y afrontarás las consecuencias de tus decisiones.
            La primera versión está en preparación; todavía no hay partidas disponibles.
          </p>
        </details>
      </section>

      <footer class="welcome-footer">
        <span>Una aldea. Muchas historias.</span>
        <span class="edition">Primeros cimientos</span>
      </footer>
    </main>
  `;
}
