export function renderStoricoPage(container) {
  const html = `
    <div class="page-header">
      <h2>Storico e Report</h2>
      <p class="date-subtitle">Consultazione Archivio HACCP</p>
    </div>
    <div class="card" style="padding: 15px;">
      <p>Modulo Storico in fase di configurazione.</p>
    </div>
  `;
  if (container) container.innerHTML = html;
  return html;
}
