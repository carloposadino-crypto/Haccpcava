export function renderRegistroPage(container) {
  const today = new Date().toLocaleDateString('it-IT');
  const html = `
    <div class="page-header">
      <h2>Registro Processi</h2>
      <p class="date-subtitle">Cotture e Abbattimenti - ${today}</p>
    </div>
    <div class="card" style="padding: 15px;">
      <p>Modulo Registro in fase di configurazione.</p>
    </div>
  `;
  if (container) container.innerHTML = html;
  return html;
}
