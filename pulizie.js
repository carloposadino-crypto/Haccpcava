export function renderPuliziePage(container) {
  const today = new Date().toLocaleDateString('it-IT');

  const mansioni = [
    { id: 'piani_lavoro', label: 'Sanificazione Piani di Lavoro e Taglieri' },
    { id: 'attrezzature', label: 'Pulizia Attrezzature (Sotto vuoto, Affettatrice, Roner)' },
    { id: 'pavimenti', label: 'Lavaggio e Sanificazione Pavimenti e Chiusure' },
    { id: 'frigo_maniglie', label: 'Igienizzazione Maniglie Frigo e Superfici Tatto' },
    { id: 'cappa_filtri', label: 'Pulizia Cappa e Filtri Aspirazione' },
    { id: 'rifiuti', label: 'Svuotamento e Disinfezione Contenitori Rifiuti' }
  ];

  const listHtml = mansioni.map(m => `
    <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px;">
      <label for="chk_${m.id}" style="font-weight: 500; cursor: pointer; flex: 1;">${m.label}</label>
      <input type="checkbox" id="chk_${m.id}" name="${m.id}" style="width: 22px; height: 22px; cursor: pointer;">
    </div>
  `).join('');

  const html = `
    <div class="page-header">
      <h2>Scheda Pulizie & Sanificazione</h2>
      <p class="date-subtitle">Data: ${today}</p>
    </div>

    <form id="pulizie-form" style="display: flex; flex-direction: column; gap: 12px; padding: 10px 0;">
      ${listHtml}

      <div class="card" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
        <label style="font-weight: bold;">Operatore / Firma</label>
        <input type="text" name="operatore" placeholder="Es. Marco N." style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
      </div>

      <button type="button" id="btn-save-pulizie" style="padding: 14px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer;">
        Conferma Pulizie Giornaliere
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;
    const btn = container.querySelector('#btn-save-pulizie');
    if (btn) btn.addEventListener('click', () => {
      alert('Registro pulizie aggiornato con successo!');
      container.querySelector('#pulizie-form').reset();
    });
  }
  return html;
}
