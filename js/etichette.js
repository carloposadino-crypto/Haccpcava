import { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from './firebase.js';

export function renderEtichettePage(container) {
  container.innerHTML = `
    <div style="padding: 16px; max-width: 600px; margin: 0 auto; padding-bottom: 80px;">
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">
        🏷️ Generatore Etichette Tracciabilità
      </h2>

      <form id="form-etichetta" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 24px;">
        
        <!-- Selezione da Bolla/Lotto OCR o Inserimento Manuale -->
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Pescaggio Lotto da Merci in Ingresso (OCR)</label>
          <select id="select-lotto-ocr" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 13px;">
            <option value="">-- Caricamento lotti recenti... --</option>
          </select>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Nome Prodotto / Lavorazione *</label>
          <input type="text" id="nome-prodotto" required placeholder="Es. Ragù di Vitello, Fondo Bruno, Polpo Abbattuto..." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 14px;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Lotto Interno / Origine *</label>
            <input type="text" id="lotto-interno" required placeholder="Es. L-120926" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Tipo Conservazione</label>
            <select id="tipo-conservazione" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
              <option value="3">❄️ Frigo (+3 gg)</option>
              <option value="14">🎒 Sottovuoto (+14 gg)</option>
              <option value="60">🧊 Abbattuto / Freezer (+60 gg)</option>
              <option value="custom">⚙️ Personalizzata</option>
            </select>
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 14px;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Data Lavorazione</label>
            <input type="date" id="data-lavorazione" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Data Scadenza</label>
            <input type="date" id="data-scadenza" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Note / Allergeni / Destinazione</label>
          <input type="text" id="note-etichetta" placeholder="Es. Senza glutine, per servizio venerdì..." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
        </div>

        <button type="submit" style="width: 100%; background-color: #059669; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
          🏷️ Genera e Salva Etichetta
        </button>
      </form>

      <!-- Anteprima Etichetta Pronta per Stampa -->
      <div id="anteprima-etichetta-container" style="display: none; background: #fffbe0; border: 2px dashed #d97706; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 12px; color: #b45309;">ANTEPRIMA ETICHETTA TRACCIABILITÀ</strong>
          <button id="btn-stampa-etichetta" style="background: #d97706; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; cursor: pointer;">
            🖨️ Stampa
          </button>
        </div>
        <div id="etichetta-box" style="background: white; border: 1px solid #000; padding: 12px; font-family: monospace; font-size: 13px; color: #000;">
          <!-- Inserimento dinamico anteprima -->
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">📋 Ultime Etichette Create</h3>
      <div id="lista-storico-etichette" style="display: flex; flex-direction: column; gap: 10px;">
        <p style="color: #6b7280; font-size: 13px; text-align: center;">Caricamento storico...</p>
      </div>

    </div>
  `;

  const form = document.getElementById('form-etichetta');
  const selectLottoOcr = document.getElementById('select-lotto-ocr');
  const nomeProdotto = document.getElementById('nome-prodotto');
  const lottoInterno = document.getElementById('lotto-interno');
  const tipoConservazione = document.getElementById('tipo-conservazione');
  const dataLavorazione = document.getElementById('data-lavorazione');
  const dataScadenza = document.getElementById('data-scadenza');
  const noteEtichetta = document.getElementById('note-etichetta');
  const anteprimaContainer = document.getElementById('anteprima-etichetta-container');
  const etichettaBox = document.getElementById('etichetta-box');
  const btnStampa = document.getElementById('btn-stampa-etichetta');
  const listaStorico = document.getElementById('lista-storico-etichette');

  // Imposta data lavorazione ad oggi
  const oggi = new Date().toISOString().split('T')[0];
  dataLavorazione.value = oggi;

  // Calcolo automatico data scadenza in base al tipo conservazione
  function calcolaScadenza() {
    const giorni = tipoConservazione.value;
    if (giorni === 'custom') return;

    const dataLav = new Date(dataLavorazione.value || oggi);
    dataLav.setDate(dataLav.getDate() + parseInt(giorni));
    dataScadenza.value = dataLav.toISOString().split('T')[0];
  }

  tipoConservazione.addEventListener('change', calcolaScadenza);
  dataLavorazione.addEventListener('change', calcolaScadenza);
  calcolaScadenza();

  // Caricamento Lotti dal Registro Merci (OCR)
  async function caricaLottiOCR() {
    try {
      const q = query(collection(db, 'ricevimento_merci'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        selectLottoOcr.innerHTML = '<option value="">Nessun lotto salvato in ingresso</option>';
        return;
      }

      let html = '<option value="">-- Seleziona materia prima da bolla OCR --</option>';
      querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const info = `${item.fornitore || 'Fornitore'} | DDT: ${item.numeroBolla || 'N/D'} (${item.dataOra || ''})`;
        html += `<option value="${item.numeroBolla || ''}" data-fornitore="${item.fornitore || ''}" data-prodotti="${encodeURIComponent(item.prodotti || '')}">${info}</option>`;
      });

      selectLottoOcr.innerHTML = html;
    } catch (err) {
      console.error("Errore caricamento lotti OCR:", err);
      selectLottoOcr.innerHTML = '<option value="">Errore caricamento lotti</option>';
    }
  }

  selectLottoOcr.addEventListener('change', (e) => {
    const option = selectLottoOcr.options[selectLottoOcr.selectedIndex];
    if (!option.value) return;

    const ddt = option.value;
    const fornitore = option.getAttribute('data-fornitore');
    const prodotti = decodeURIComponent(option.getAttribute('data-prodotti'));

    lottoInterno.value = `DDT-${ddt} (${fornitore})`;
    if (!nomeProdotto.value) {
      const primaRiga = prodotti.split('\n')[0];
      if (primaRiga) nomeProdotto.value = primaRiga.split(':')[0];
    }
  });

  // Caricamento Storico Etichette
  async function caricaStoricoEtichette() {
    try {
      const q = query(collection(db, 'etichette'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        listaStorico.innerHTML = '<p style="color: #6b7280; font-size: 13px; text-align: center;">Nessuna etichetta generata.</p>';
        return;
      }

      let html = '';
      querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        html += `
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
              <span>${item.nomeProdotto}</span>
              <span style="color: #2563eb;">Lotto: ${item.lotto}</span>
            </div>
            <div style="color: #4b5563; font-size: 12px;">
              Prep: <strong>${item.dataLavorazione}</strong> | Scad: <strong style="color: #dc2626;">${item.dataScadenza}</strong>
            </div>
            ${item.note ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">Note: ${item.note}</div>` : ''}
          </div>
        `;
      });

      listaStorico.innerHTML = html;
    } catch (err) {
      console.error("Errore caricamento storico etichette:", err);
    }
  }

  // Salvataggio ed Emissione Etichetta
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      nomeProdotto: nomeProdotto.value,
      lotto: lottoInterno.value,
      dataLavorazione: dataLavorazione.value,
      dataScadenza: dataScadenza.value,
      note: noteEtichetta.value,
      timestamp: serverTimestamp(),
      dataOra: new Date().toLocaleString('it-IT')
    };

    try {
      await addDoc(collection(db, 'etichette'), data);

      // Rendering anteprima etichetta
      etichettaBox.innerHTML = `
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; font-weight: bold;">
          LA CAVA DEI VINI · HACCP
        </div>
        <div><strong>PRODOTTO:</strong> ${data.nomeProdotto.toUpperCase()}</div>
        <div><strong>LOTTO ORIGINE:</strong> ${data.lotto}</div>
        <div><strong>DATA PREPARAZIONE:</strong> ${data.dataLavorazione}</div>
        <div style="font-size: 14px; margin-top: 4px;"><strong>SCADENZA:</strong> <span style="text-decoration: underline;">${data.dataScadenza}</span></div>
        ${data.note ? `<div style="font-size: 11px; margin-top: 4px;">NOTE: ${data.note}</div>` : ''}
      `;

      anteprimaContainer.style.display = 'block';
      caricaStoricoEtichette();
    } catch (err) {
      alert("Errore salvataggio etichetta: " + err.message);
    }
  });

  btnStampa.addEventListener('click', () => {
    const contenuto = etichettaBox.innerHTML;
    const finestraStampa = window.open('', '', 'height=400,width=400');
    finestraStampa.document.write('<html><head><title>Stampa Etichetta</title></head><body style="font-family: monospace; padding: 20px;">');
    finestraStampa.document.write(contenuto);
    finestraStampa.document.write('</body></html>');
    finestraStampa.document.close();
    finestraStampa.print();
  });

  caricaLottiOCR();
  caricaStoricoEtichette();
}