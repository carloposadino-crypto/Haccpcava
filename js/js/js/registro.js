import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderRegistroPage(container) {
  const today = new Date().toISOString().split('T')[0];
  container.innerHTML = `
    <div class="page-header">
      <h2>Cotture & Abbattimenti</h2>
      <p class="date-subtitle">Registro processi termici e roner</p>
    </div>
    <form id="proc-form" class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <label style="font-weight: bold; font-size: 14px;">Tipo Processo</label>
      <select id="proc_tipo">
        <option value="Cottura">Cottura</option>
        <option value="Abbattimento">Abbattimento</option>
        <option value="Cottura Sottovuoto / Roner">Cottura Sottovuoto / Roner</option>
      </select>

      <label style="font-weight: bold; font-size: 14px;">Prodotto</label>
      <input type="text" id="proc_prodotto" placeholder="Es. Brasato, Zuppa, ecc." required>

      <label style="font-weight: bold; font-size: 14px;">Quantità</label>
      <input type="text" id="proc_quantita" placeholder="Es. 20 porzioni / 5 kg">

      <div style="display: flex; gap: 10px;">
        <div style="flex: 1;">
          <label style="font-weight: bold; font-size: 13px;">Temp Inizio (°C)</label>
          <input type="number" step="0.1" id="proc_temp_inizio" placeholder="Es. 75">
        </div>
        <div style="flex: 1;">
          <label style="font-weight: bold; font-size: 13px;">Temp Fine (°C)</label>
          <input type="number" step="0.1" id="proc_temp_fine" placeholder="Es. 3">
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        <div style="flex: 1;">
          <label style="font-weight: bold; font-size: 13px;">Ora Inizio</label>
          <input type="time" id="proc_ora_inizio">
        </div>
        <div style="flex: 1;">
          <label style="font-weight: bold; font-size: 13px;">Ora Fine</label>
          <input type="time" id="proc_ora_fine">
        </div>
      </div>

      <button type="button" id="btn-save-proc" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 5px;">Registra Processo</button>
    </form>
  `;

  container.querySelector('#btn-save-proc')?.addEventListener('click', async () => {
    const tipo = container.querySelector('#proc_tipo').value;
    const prodotto = container.querySelector('#proc_prodotto').value.trim();
    if (!prodotto) {
      alert('Inserisci il nome del prodotto.');
      return;
    }

    try {
      await addDoc(collection(db, "registro_processi"), {
        data: today,
        tipo,
        prodotto,
        quantita: container.querySelector('#proc_quantita').value,
        temp_inizio: container.querySelector('#proc_temp_inizio').value,
        temp_fine: container.querySelector('#proc_temp_fine').value,
        ora_inizio: container.querySelector('#proc_ora_inizio').value,
        ora_fine: container.querySelector('#proc_ora_fine').value,
        timestamp: serverTimestamp()
      });
      alert('Processo registrato!');
      container.querySelector('#proc-form').reset();
    } catch (err) {
      console.error(err);
      alert('Errore nel salvataggio.');
    }
  });
}
