export function renderWelcome(hasVillage: boolean): string {
  return `
    <main class="welcome" aria-labelledby="game-title">
      <header class="masthead">
        <span class="wordmark">AV<span aria-hidden="true">.</span></span>
        <span class="development-status">Candidata 1.0 · Una aldea, muchas historias</span>
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
          ${hasVillage ? '<button type="button" class="text-button" data-action="navigate" data-route="village">Volver a mi aldea</button>' : ''}<button type="button" class="text-button" data-action="navigate" data-route="help">Cómo jugar</button>
        </div><p class="welcome-notice">Tres aldeas con guardado automático en este navegador. El tiempo solo avanza cuando tú lo decides.</p>

        <details class="about">
          <summary>Acerca del juego <span class="details-indicator" aria-hidden="true">+</span></summary>
          <p>
            En Aldea Viva guiarás a una comunidad: asignarás trabajos,
            decidirás prioridades y afrontarás las consecuencias de tus decisiones.
            Cultiva, construye y prepara el invierno. Afronta amenazas y oportunidades,
            descubre aptitudes y conserva la memoria de quienes viven en tu aldea.
          </p>
        </details>
      </section>

      <footer class="welcome-footer">
        <span>Una aldea. Muchas historias.</span>
        <span class="edition">Gestión y supervivencia</span>
      </footer>
    </main>
  `;
}
