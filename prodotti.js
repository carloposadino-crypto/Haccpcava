export function renderProdottiPage(container) {
  const html = `
    <div class="page-header">
      <h2>Anagrafica Prodotti e Schede Scheda Lotto</h2>
      <p class="date-subtitle">Tracciabilità e Conservazione</p>
    </div>

    <form id="prodotti-form" style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Nome Prodotto / Preparazione</label>
        <input type="text" name="nome_prodotto" placeholder="Es. Fondo Bruno, Nocciole Tostate..." style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Codice Lotto Assegnato</label>
        <input type="text" name="lotto" placeholder="Es. L-20260908" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Data Scadenza / TMC Interno</label>
        <input type="date" name="scadenza" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; background: #fff;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Stato Conservazione</label>
        <select name="conservazione" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; background: #fff;">
          <option value="sottovuoto_frigo">Sottovuoto Refrigerato (+2°C)</option>
          <option value="congelato">Congelato / Abbattuto (-18°C)</option>
          <option value="secco">Ambiente / Secco</option>
        </select>
      </div>

      <button type="button" id="btn-save-prodotto" style="padding: 14px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer;">
        Salva Prodotto in Anagrafica
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;
    const btn = container.querySelector('#btn-save-prodotto');
    if (btn) btn.addEventListener('click', () => {
      alert('Prodotto aggiunto alla tracciabilità!');
      container.querySelector('#prodotti-form').reset();
    });
  }
  return html;
}
