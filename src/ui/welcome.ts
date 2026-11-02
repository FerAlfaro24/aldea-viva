export function renderWelcome(hasVillage: boolean): string {
  return `
    <main class="welcome" aria-labelledby="game-title">
      <header class="masthead">
        <span class="wordmark">AV<span aria-hidden="true">.</span></span>
        <span class="development-status">Prototipo 0.1 · En desarrollo</span>
      </header>

      <section class="introduction" aria-labelledby="game-title">
        <p class="eyebrow">Gestión · Supervivencia · Historias</p>
        <h1 id="game-title" tabindex="-1">Aldea <em>Viva</em></h1>
        <p class="tagline">Cada decisión deja huella.</p>
        <p class="description">
          Una comunidad medieval. El paso de las estaciones.
          Y las historias de quienes llaman hogar a tu aldea.
        </p>

        <div class="launch-actions"><button type="button" class="primary-button" data-action="navigate" data-route="slots">Explorar mi aldea <span aria-hidden="true">→</span></button>
          ${hasVillage ? '<button type="button" class="text-button" data-action="navigate" data-route="village">Volver a mi aldea</button>' : ''}
        </div><p class="welcome-notice">Tres aldeas con guardado automático en este navegador. El tiempo solo avanza cuando tú lo decides.</p>

        <details class="about">
          <summary>Acerca del juego <span class="details-indicator" aria-hidden="true">+</span></summary>
          <p>
            En Aldea Viva guiarás a una comunidad: asignarás trabajos,
            decidirás prioridades y afrontarás las consecuencias de tus decisiones.
            Este prototipo permite conocer a los primeros habitantes y avanzar el calendario.
            Los trabajos y la economía llegarán en próximas versiones.
          </p>
        </details>
      </section>

      <footer class="welcome-footer">
        <span>Una aldea. Muchas historias.</span>
        <span class="edition">Primeros habitantes</span>
      </footer>
    </main>
  `;
}
