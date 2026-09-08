export function renderRicezioniPage(container) {
  const html = `
    <div class="page-header">
      <h2>Ricevimento Merci</h2>
      <p class="date-subtitle">Controllo Fornitori e Materie Prime</p>
    </div>

    <form id="ricevimento-form" style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Fornitore</label>
        <input type="text" name="fornitore" placeholder="Es. Carni Piemonte, Frutta & Co..." style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">N° Documento di Trasporto (DDT) / Fattura</label>
        <input type="text" name="ddt" placeholder="Es. DDT n° 4582" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Temp. Merce Refrigerata (°C) - Opzionale</label>
        <input type="number" step="0.1" name="temp_merce" placeholder="Es. 3.2" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Stato Imballi e Pulizia Mezzo</label>
        <select name="stato_idoneo" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; background: #fff;">
          <option value="idoneo">Conforme / Idoneo</option>
          <option value="non_conforme">Non Conforme (Imballi danneggiati / Temp errata)</option>
        </select>
      </div>

      <button type="button" id="btn-save-ricevimento" style="padding: 14px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer;">
        Registra Accettazione Merce
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;
    const btn = container.querySelector('#btn-save-ricevimento');
    if (btn) btn.addEventListener('click', () => {
      alert('Ricevimento merce registrato con successo!');
      container.querySelector('#ricevimento-form').reset();
    });
  }
  return html;
}
