import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderRicezioniPage(container) {
  const today = new Date().toLocaleDateString('it-IT');

  const html = `
    <div class="page-header">
      <h2>Ricevimento Merci & Controlli</h2>
      <p class="date-subtitle">Data: ${today}</p>
    </div>

    <form id="ricevimento-form" style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
      
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Fornitore</label>
        <input type="text" id="fornitore" name="fornitore" placeholder="Es. Distribuzione Carni SRL" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;" required>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Prodotto / Tipologia Merce</label>
        <input type="text" id="prodotto_ric" name="prodotto_ric" placeholder="Es. Petto d'Anatra / Formaggi" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;" required>
      </div>

      <div style="display: flex; gap: 10px;">
        <div class="card" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold; font-size: 14px;">N° DDT / Fattura</label>
          <input type="text" id="num_ddt" name="num_ddt" placeholder="Es. 10452" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
        </div>
        <div class="card" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold; font-size: 14px;">Temp. Misurata (°C)</label>
          <input type="number" step="0.1" id="temp_merce" name="temp_merce" placeholder="3.5" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
        </div>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Conformità Imballo e Igiene Mezzo</label>
        <select id="esito_controllo" name="esito_controllo" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%;">
          <option value="Conforme">Conforme (Integrità e temp. OK)</option>
          <option value="Con Riserva">Accettato con riserva</option>
          <option value="Non Conforme">Non Conforme (Merce respinta)</option>
        </select>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Note / Anomalia riscontrata</label>
        <input type="text" id="note_ricevimento" name="note_ricevimento" placeholder="Es. Imballo integro, scadenza regolare" style="padding: 10px; font-size: 15px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
      </div>

      <button 
        type="button" 
        id="btn-save-ricevimento"
        style="padding: 14px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;"
      >
        Registra Ricevimento
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;
    const btn = container.querySelector('#btn-save-ricevimento');
    if (btn) btn.addEventListener('click', handleSaveRicevimento);
  }

  return html;
}

async function handleSaveRicevimento() {
  const fornitore = document.getElementById('fornitore')?.value.trim();
  const prodotto = document.getElementById('prodotto_ric')?.value.trim();

  if (!fornitore || !prodotto) {
    alert('Inserisci fornitore e prodotto prima di salvare.');
    return;
  }

  const btn = document.getElementById('btn-save-ricevimento');
  btn.disabled = true;
  btn.innerText = 'Salvataggio in corso...';

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    await addDoc(collection(db, "ricevimento_merci"), {
      data: todayStr,
      fornitore: fornitore,
      prodotto: prodotto,
      num_ddt: document.getElementById('num_ddt').value,
      temperatura: parseFloat(document.getElementById('temp_merce').value) || null,
      esito: document.getElementById('esito_controllo').value,
      note: document.getElementById('note_ricevimento').value,
      timestamp: serverTimestamp()
    });

    alert('Ricevimento merce registrato su Firebase!');
    document.getElementById('ricevimento-form').reset();
    window.switchTab('oggi');
  } catch (error) {
    console.error("Errore durante il salvataggio del ricevimento:", error);
    alert('Errore nel salvataggio del ricevimento merce.');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Registra Ricevimento';
  }
}
