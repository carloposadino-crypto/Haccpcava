import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderAbbattimentoPage(container) {
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page-header">
      <h2>Registro Abbattimento & Anisakis</h2>
      <p class="date-subtitle">Controllo dei cicli di abbattimento termico e bonifica pesce crudo</p>
    </div>

    <form id="abbattimento-form" class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <label style="font-weight: bold; font-size: 14px;">Data Operazione</label>
      <input type="date" id="abb_data" value="${today}" required>

      <label style="font-weight: bold; font-size: 14px;">Tipo Operazione</label>
      <select id="abb_tipo">
        <option value="Standard">Abbattimento Pozzetto / Cotta (Standard)</option>
        <option value="Anisakis">Bonifica Anisakis (Pesce Crudo <= -20°C per 24h)</option>
      </select>

      <label style="font-weight: bold; font-size: 14px;">Prodotto / Materia Prima</label>
      <input type="text" id="abb_prodotto" placeholder="Es. Filetto di Spigola, Ragù preparato" required>

      <label style="font-weight: bold; font-size: 14px;">Lotto Origine / Tracciabilità</label>
      <input type="text" id="abb_lotto" placeholder="Es. LOT-2026-0911-A" required>

      <div style="display: flex; gap: 10px;">
        <div style="flex: 1;">
          <label style="font-weight: bold; font-size: 13px;">Temp. Iniziale (°C)</label>
          <input type="number" step="0.1" id="abb_temp_in" placeholder="+65.0" required>
        </div>
        <div style="flex: 1;">
          <label style="font-weight: bold; font-size: 13px;">Temp. Finale (°C)</label>
          <input type="number" step="0.1" id="abb_temp_out" placeholder="+3.0" required>
        </div>
      </div>

      <label style="font-weight: bold; font-size: 14px;">Tempo Impiegato (minuti)</label>
      <input type="number" id="abb_durata" placeholder="Es. 90" required>

      <button type="button" id="btn-save-abbattimento" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 8px;">
        Registra Abbattimento
      </button>
    </form>
  `;

  container.querySelector('#btn-save-abbattimento').addEventListener('click', async () => {
    const data = container.querySelector('#abb_data').value;
    const tipo = container.querySelector('#abb_tipo').value;
    const prodotto = container.querySelector('#abb_prodotto').value.trim();
    const lotto = container.querySelector('#abb_lotto').value.trim();
    const tempIn = container.querySelector('#abb_temp_in').value;
    const tempOut = container.querySelector('#abb_temp_out').value;
    const durata = container.querySelector('#abb_durata').value;

    if (!prodotto || !lotto || !tempIn || !tempOut || !durata) {
      alert('Compila tutti i campi richiesti.');
      return;
    }

    try {
      await addDoc(collection(db, 'abbattimenti'), {
        data,
        tipo,
        prodotto,
        lotto,
        temp_iniziale: parseFloat(tempIn),
        temp_finale: parseFloat(tempOut),
        durata_minuti: parseInt(durata, 10),
        timestamp: serverTimestamp()
      });
      alert('Abbattimento registrato con successo!');
      renderAbbattimentoPage(container);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
    }
  });
}
