import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderEtichettePage(container) {
  const today = new Date().toLocaleDateString('it-IT');

  const html = `
    <div class="page-header">
      <h2>Tracciabilità & Etichettatura Scadenze</h2>
      <p class="date-subtitle">Data: ${today}</p>
    </div>

    <form id="etichetta-form" style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
      
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Nome Prodotto / Preparazione</label>
        <input type="text" id="prod_nome" name="prod_nome" placeholder="Es. Ragù di Cinghiale, Fondo Bruno, Faraona Sottovuoto" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;" required>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Lotto Fornitore / Origine Materia Prima</label>
        <input type="text" id="prod_lotto" name="prod_lotto" placeholder="Es. Lotto M-2026-0901 o DDT n. 10452" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Tecnica di Conservazione</label>
        <select id="prod_tecnica" name="prod_tecnica" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%;">
          <option value="Frigo (+2°C / +4°C)" data-giorni="3">Refrigerazione Classica (+2°C / +4°C) - [3 gg]</option>
          <option value="Sottovuoto Frigo" data-giorni="10">Sottovuoto Refrigerato - [10 gg]</option>
          <option value="Abbattuto Freezer (-18°C)" data-giorni="90">Abbattuto e Congelato (-18°C) - [90 gg]</option>
          <option value="Cottura Roner / Sottovuoto" data-giorni="14">Cottura BT / Roner Sottovuoto - [14 gg]</option>
        </select>
      </div>

      <div style="display: flex; gap: 10px;">
        <div class="card" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold; font-size: 14px;">Giorni Conservazione</label>
          <input type="number" id="prod_durata_giorni" name="prod_durata_giorni" value="3" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;" required>
        </div>
        <div class="card" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold; font-size: 14px;">Quantità / Porzioni</label>
          <input type="text" id="prod_quantita" name="prod_quantita" placeholder="Es. 20 porzioni / 5 kg" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
        </div>
      </div>

      <button 
        type="button" 
        id="btn-save-etichetta"
        style="padding: 14px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;"
      >
        Registra & Genera Etichetta
      </button>
    </form>

    <div id="preview-etichetta-container" style="margin-top: 20px;"></div>
  `;

  if (container) {
    container.innerHTML = html;
    
    const btnSave = container.querySelector('#btn-save-etichetta');
    if (btnSave) btnSave.addEventListener('click', handleSaveEtichetta);

    const selectTecnica = container.querySelector('#prod_tecnica');
    const inputGiorni = container.querySelector('#prod_durata_giorni');

    if (selectTecnica && inputGiorni) {
      selectTecnica.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const defaultDays = selectedOption.getAttribute('data-giorni');
        if (defaultDays) {
          inputGiorni.value = defaultDays;
        }
      });
    }
  }

  return html;
}

async function handleSaveEtichetta() {
  const nome = document.getElementById('prod_nome')?.value.trim();
  const giorni = parseInt(document.getElementById('prod_durata_giorni')?.value, 10) || 0;

  if (!nome) {
    alert('Inserisci il nome del prodotto o della preparazione.');
    return;
  }

  const btn = document.getElementById('btn-save-etichetta');
  btn.disabled = true;
  btn.innerText = 'Salvataggio in corso...';

  const oggi = new Date();
  const dataProduzioneStr = oggi.toISOString().split('T')[0];
  
  const dataScadenza = new Date();
  dataScadenza.setDate(oggi.getDate() + giorni);
  const dataScadenzaStr = dataScadenza.toISOString().split('T')[0];

  const lottoInterno = `L-${oggi.getFullYear()}${(oggi.getMonth()+1).toString().padStart(2, '0')}${oggi.getDate().toString().padStart(2, '0')}`;

  const lottoFornitore = document.getElementById('prod_lotto')?.value.trim() || 'N/D';
  const tecnica = document.getElementById('prod_tecnica')?.value;
  const quantita = document.getElementById('prod_quantita')?.value.trim() || 'N/D';

  try {
    await addDoc(collection(db, "tracciabilita_etichette"), {
      data_produzione: dataProduzioneStr,
      data_scadenza: dataScadenzaStr,
      lotto_interno: lottoInterno,
      lotto_fornitore: lottoFornitore,
      prodotto: nome,
      tecnica: tecnica,
      quantita: quantita,
      timestamp: serverTimestamp()
    });

    const previewContainer = document.getElementById('preview-etichetta-container');
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div id="printable-label-card" class="card" style="border: 2px dashed #2b5c3a; background-color: #f8fafc; padding: 15px; font-family: monospace;">
          <h3 style="margin: 0 0 5px 0; text-align: center; font-size: 18px;">LA CAVA DEI VINI</h3>
          <p style="margin: 0 0 10px 0; text-align: center; font-size: 11px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">ETICHETTA TRACCIABILITÀ INTERNA</p>
          <p style="margin: 3px 0; font-size: 15px;"><b>PRODOTTO:</b> ${nome.toUpperCase()}</p>
          <p style="margin: 3px 0; font-size: 13px;"><b>LOTTO INT.:</b> ${lottoInterno}</p>
          <p style="margin: 3px 0; font-size: 13px;"><b>LOTTO FORN.:</b> ${lottoFornitore}</p>
          <p style="margin: 3px 0; font-size: 13px;"><b>CONSERVAZIONE:</b> ${tecnica}</p>
          <p style="margin: 3px 0; font-size: 13px;"><b>QUANTITÀ:</b> ${quantita}</p>
          <p style="margin: 3px 0; font-size: 13px;"><b>DATA PREP.:</b> ${dataProduzioneStr}</p>
          <p style="margin: 6px 0 0 0; font-size: 16px; color: #b91c1c; font-weight: bold; border-top: 1px solid #ccc; padding-top: 5px;"><b>SCADENZA:</b> ${dataScadenzaStr}</p>
        </div>

        <button 
          type="button" 
          id="btn-print-etichetta"
          style="width: 100%; padding: 12px; background-color: #1e3a8a; color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: bold; cursor: pointer; margin-top: 10px;"
        >
          🖨️ Stampa Etichetta
        </button>
      `;

      document.getElementById('btn-print-etichetta')?.addEventListener('click', () => {
        window.print();
      });
    }

    alert('Tracciabilità registrata con successo!');
    document.getElementById('etichetta-form').reset();
  } catch (error) {
    console.error("Errore durante il salvataggio dell etichetta:", error);
    alert('Errore nel salvataggio della tracciabilità.');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Registra & Genera Etichetta';
  }
}
