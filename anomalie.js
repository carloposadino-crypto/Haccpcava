export function renderAnomaliePage(container) {
  const html = `
    <div class="page-header">
      <h2>Gestione Anomalie</h2>
      <p class="date-subtitle">Segnalazione Non Conformità HACCP</p>
    </div>

    <form id="anomalie-form" style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Tipo di Anomalia</label>
        <select name="tipo_anomalia" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; background: #fff;">
          <option value="temperatura">Temperatura Fuori Limite (Frigo/Freezer)</option>
          <option value="materia_prima">Materia Prima Deteriorata / Scaduta</option>
          <option value="attrezzatura">Guasto Attrezzatura</option>

          <option value="altro">Altro</option>
        </select>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Descrizione del Problema</label>
        <textarea name="descrizione" rows="3" placeholder="Dettaglia l'anomalia riscontrata..." style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; font-family: inherit;"></textarea>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Azione Correttiva Intrappresa</label>
        <textarea name="azione_correttiva" rows="3" placeholder="Es. Prodotto eliminato, tecnico contattato, merce spostata..." style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; font-family: inherit;"></textarea>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Segnalato da</label>
        <input type="text" name="operatore" placeholder="Nome operatore" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
      </div>

      <button type="button" id="btn-save-anomalia" style="padding: 14px; background-color: #c93b2b; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer;">
        Registra Anomalia
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;
    const btn = container.querySelector('#btn-save-anomalia');
    if (btn) btn.addEventListener('click', () => {
      alert('Anomalia registrata correttamente.');
      container.querySelector('#anomalie-form').reset();
    });
  }
  return html;
}
