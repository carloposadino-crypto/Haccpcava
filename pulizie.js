export function renderPuliziePage(container) {
  const today = new Date().toLocaleDateString('it-IT');
  const html = `
    <div class="page-header">
      <h2>Scheda Pulizie</h2>
      <p class="date-subtitle">Sanificazione - ${today}</p>
    </div>
    <div class="card" style="padding: 15px;">
      <p>Modulo Pulizie in fase di configurazione.</p>
    </div>
  `;
  if (container) container.innerHTML = html;
  return html;
}
