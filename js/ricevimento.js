import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderRicezioniPage(container) {
  const today = new Date().toISOString().split('T')[0];
  container.innerHTML = `
    <div class="page-header">
      2>Ricevimento Merci</h2>
      <p class="date-subtitle">Registro controlli all'ingresso</p>
    </div>
    <form id="ricezione-form" class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <label style="font-weight: bold; font-size: 14px;">Data Ricevimento</label>
      <input type="date" id="ric_data" value="${today}" required>

      <label style="font-weight: bold; font-size: 14px;">Fornitore</label>
      <input type="text" id="ric_fornitore" placeholder="Nome fornitore..." required>

      <label style="font-weight: bold; font-size: 14px;">Prodotto / Materia Prima</label>
      <input type="text" id="ric_prodotto" placeholder="Es. Mozzarella, Carne, ecc." required>

      <label style="font-weight: bold; font-size: 14px;">Lotto</label>
      <input type="text" id="ric_lotto" placeholder="Codice lotto" required>

      <label style="font-weight: bold; font-size: 14px;">Temperatura (°C)</label>
      <input type="number" step="0.1" id="ric_temp" placeholder="Es. 4.0 (se refrigerato)">

      <label style="font-weight: bold; font-size: 14px;">Conforme</label>
      <select id="ric_conforme">
        <option value="SI">SÌ - Conforme</option>
        <option value="NO">NO - Respinto / Anomalia</option>
      </select>

      <button type="button" id="btn-save-ricezione" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 8px;">Salva Ricevimento</button>
    </form>
  `;

  container.querySelector('#btn-save-ricezione').addEventListener('click', async () => {
    const data = container.querySelector('#ric_data').value;
    const fornitore = container.querySelector('#ric_fornitore').value.trim();
    const prodotto = container.querySelector('#ric_prodotto').value.trim();
    const lotto = container.querySelector('#ric_lotto').value.trim();
    const temp = container.querySelector('#ric_temp').value;
    const conforme = container.querySelector('#ric_conforme').value;

    if (!fornitore || !prodotto || !lotto) {
      alert('Compila Fornitore, Prodotto e Lotto.');
      return;
    }

    try {
      await addDoc(collection(db, 'ricevimenti'), {
        data,
        fornitore,
        prodotto,
        lotto,
        temperatura: temp ? parseFloat(temp) : null,
        conforme,
        timestamp: serverTimestamp()
      });
      alert('Ricevimento merce salvato con successo!');
      renderRicezioniPage(container);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
    }
  });
}
