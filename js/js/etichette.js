import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderEtichettePage(container) {
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page-header">
      <h2>Etichettatura Lotti Interni</h2>
      <p class="date-subtitle">Generatore etichette tracciabilità semilavorati e sottovuoto</p>
    </div>

    <form id="etichetta-form" class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <label style="font-weight: bold; font-size: 14px;">Nome Preparazione</label>
      <input type="text" id="eti_nome" placeholder="Es. Sugo d'Arrosto, Vitello Tonnato SV" required>

      <label style="font-weight: bold; font-size: 14px;">Data Lavorazione</label>
      <input type="date" id="eti_data_prep" value="${today}" required>

      <label style="font-weight: bold; font-size: 14px;">Data Scadenza Prevista</label>
      <input type="date" id="eti_data_scad" required>

      <label style="font-weight: bold; font-size: 14px;">Conservazione</label>
      <select id="eti_conservazione">
        <option value="Refrigerato (+2°C/+4°C)">Refrigerato (+2°C / +4°C)</option>
        <option value="Congelato (<= -18°C)">Congelato (<= -18°C)</option>
        <option value="Sottovuoto (+2°C)">Sottovuoto (+2°C)</option>
      </select>

      <label style="font-weight: bold; font-size: 14px;">Lotto Materie Prime Origine</label>
      <input type="text" id="eti_lotto_orig" placeholder="Es. carne L-884, verdure L-12" required>

      <button type="button" id="btn-save-etichetta" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 8px;">
        Genera Etichetta & Salva
      </button>
    </form>

    <div id="etichetta-preview" class="card" style="margin-top: 15px; display: none; border: 2px dashed #2b5c3a; padding: 15px; text-align: center;">
      <h3 id="prev-titolo" style="margin: 0 0 10px 0; font-size: 18px; text-transform: uppercase;"></h3>
      <p style="margin: 4px 0;"><strong>Lotto Interno:</strong> <span id="prev-lotto"></span></p>
      <p style="margin: 4px 0;"><strong>Prep.:</strong> <span id="prev-prep"></span> | <strong>Scad.:</strong> <span id="prev-scad"></span></p>
      <p style="margin: 4px 0;"><strong>Cons.:</strong> <span id="prev-cons"></span></p>
      <p style="margin: 4px 0; font-size: 12px; color: #555;"><strong>Ingr. Origine:</strong> <span id="prev-orig"></span></p>
      <button onclick="window.print()" style="margin-top: 10px; padding: 8px 16px; background-color: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">Stampa Etichetta</button>
    </div>
  `;

  container.querySelector('#btn-save-etichetta').addEventListener('click', async () => {
    const nome = container.querySelector('#eti_nome').value.trim();
    const dataPrep = container.querySelector('#eti_data_prep').value;
    const dataScad = container.querySelector('#eti_data_scad').value;
    const conservazione = container.querySelector('#eti_conservazione').value;
    const lottoOrig = container.querySelector('#eti_lotto_orig').value.trim();

    if (!nome || !dataPrep || !dataScad || !lottoOrig) {
      alert('Compila tutti i campi dell\'etichetta.');
      return;
    }

    const lottoInterno = 'INT-' + dataPrep.replace(/-/g, '') + '-' + Math.floor(Math.random() * 100);

    try {
      await addDoc(collection(db, 'etichette'), {
        nome_preparazione: nome,
        lotto_interno: lottoInterno,
        data_lavorazione: dataPrep,
        data_scadenza: dataScad,
        conservazione,
        lotto_origine: lottoOrig,
        timestamp: serverTimestamp()
      });

      container.querySelector('#prev-titolo').innerText = nome;
      container.querySelector('#prev-lotto').innerText = lottoInterno;
      container.querySelector('#prev-prep').innerText = dataPrep;
      container.querySelector('#prev-scad').innerText = dataScad;
      container.querySelector('#prev-cons').innerText = conservazione;
      container.querySelector('#prev-orig').innerText = lottoOrig;

      container.querySelector('#etichetta-preview').style.display = 'block';
      alert('Etichetta generata e memorizzata!');
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
    }
  });
}
