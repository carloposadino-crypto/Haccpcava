export function renderAnomaliePage(container) {
  const html = `
    <div class="page-header">
      <h2>Gestione Anomalie</h2>
      <p class="date-subtitle">Non Conformità HACCP</p>
    </div>
    <div class="card" style="padding: 15px;">
      <p>Modulo Anomalie in fase di configurazione.</p>
    </div>
  `;
  if (container) container.innerHTML = html;
  return html;
}
