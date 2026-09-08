export function renderRicezioniPage(container) {
  const html = `
    <div class="page-header">
      <h2>Ricevimento Merci</h2>
      <p class="date-subtitle">Controllo Fornitori</p>
    </div>
    <div class="card" style="padding: 15px;">
      <p>Modulo Ricevimento Merci in fase di configurazione.</p>
    </div>
  `;
  if (container) container.innerHTML = html;
  return html;
}
