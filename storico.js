export function renderStoricoPage(container) {
  const html = `
    <div class="page-header">
      <h2>Storico Registrazioni</h2>
      <p class="date-subtitle">Archivio e Audit HACCP</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px; padding: 10px 0;">
      <div class="card" style="padding: 15px;">
        <h3 style="margin-bottom: 5px; font-size: 16px;">Oggi - Temperature Frighi</h3>
        <p style="font-size: 13px; color: #888;">7 macchine verificate • Stato: Conforme</p>
      </div>

      <div class="card" style="padding: 15px;">
        <h3 style="margin-bottom: 5px; font-size: 16px;">Ieri - Registro Sanificazione</h3>
        <p style="font-size: 13px; color: #888;">Tutte le postazioni completate</p>
      </div>

      <div class="card" style="padding: 15px;">
        <h3 style="margin-bottom: 5px; font-size: 16px;">Ieri - Ricevimento Merci</h3>
        <p style="font-size: 13px; color: #888;">Fornitore Carni • DDT 1024 • Idoneo</p>
      </div>
    </div>
  `;

  if (container) {
    container.innerHTML = html;
  }
  return html;
}
