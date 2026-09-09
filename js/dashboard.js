export function renderDashboardPage(container) {
  container.innerHTML = `
    <div class="page-header">
      <h2>Dashboard Odierna</h2>
      <p class="date-subtitle">Panoramica delle attività HACCP di oggi</p>
    </div>
    <div class="card">
      <h3 style="margin-bottom: 8px; font-size: 16px;">Benvenuto a La Cava dei Vini</h3>
      <p style="font-size: 14px; color: #64748b; line-height: 1.5;">Usa la barra di navigazione in basso per inserire le temperature, registrare cotture, pulizie, anomalie, ricevimento merci o generare etichette e stampare i report PDF nello Storico.</p>
    </div>
  `;
}
