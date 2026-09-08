export function renderProdottiPage(container) {
  const html = `
    <div class="page-header">
      <h2>Anagrafica Prodotti</h2>
      <p class="date-subtitle">Tracciabilità e Materie Prime</p>
    </div>
    <div class="card" style="padding: 15px;">
      <p>Modulo Prodotti in fase di configurazione.</p>
    </div>
  `;
  if (container) container.innerHTML = html;
  return html;
}
