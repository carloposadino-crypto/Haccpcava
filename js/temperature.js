import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderTemperaturePage(container) {
  const today = new Date().toISOString().split('T')[0];
  
  container.innerHTML = `
    <div class="page-header">
      <h2>Registro Temperature</h2>
      <p class="date-subtitle">Controllo giornaliero attrezzature refrigerate</p>
    </div>
    
    <form id="temp-form" class="card" style="display: flex; flex-direction: column; gap: 14px;">
      <label style="font-weight: bold; font-size: 14px;">Data Rilevamento</label>
      <input type="date" id="temp_data" value="${today}" required>

      <div class="equipment-group">
        <label style="font-weight: bold; font-size: 14px;">Banco Frigo (Ottimale: +2°C / +6°C)</label>
        <input type="number" step="0.1" id="temp_banco" placeholder="Es. 4.0">
      </div>

      <div class="equipment-group">
        <label style="font-weight: bold; font-size: 14px;">Frigo a Colonna (Ottimale: 0°C / +4°C)</label>
        <input type="number" step="0.1" id="temp_colonna" placeholder="Es. 2.5">
      </div>

      <div class="equipment-group">
        <label style="font-weight: bold; font-size: 14px;">Frigo a Vetrina (Ottimale: +2°C / +8°C)</label>
        <input type="number" step="0.1" id="temp_vetrina" placeholder="Es. 5.0">
      </div>

      <div class="equipment-group">
        <label style="font-weight: bold; font-size: 14px;">Freezer Pozzetto 1 (Ottimale: <= -18°C)</label>
        <input type="number" step="0.1" id="temp_pozzetto1" placeholder="Es. -19.0">
      </div>

      <div class="equipment-group">
        <label style="font-weight: bold; font-size: 14px;">Freezer Pozzetto 2 (Ottimale: <= -18°C)</label>
        <input type="number" step="0.1" id="temp_pozzetto2" placeholder="Es. -20.0">
      </div>

      <button type="button" id="btn-save-temp" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px;">Salva Temperature</button>
    </form>
  `;

  container.querySelector('#btn-save-temp').addEventListener('click', async () => {
    const data = container.querySelector('#temp_data').value;
    const banco = container.querySelector('#temp_banco').value;
    const colonna = container.querySelector('#temp_colonna').value;
    const vetrina = container.querySelector('#temp_vetrina').value;
    const pozzetto1 = container.querySelector('#temp_pozzetto1').value;
    const pozzetto2 = container.querySelector('#temp_pozzetto2').value;

    try {
      await addDoc(collection(db, 'temperature'), {
        data,
        banco_frigo: banco ? parseFloat(banco) : null,
        frigo_colonna: colonna ? parseFloat(colonna) : null,
        frigo_vetrina: vetrina ? parseFloat(vetrina) : null,
        freezer_pozzetto_1: pozzetto1 ? parseFloat(pozzetto1) : null,
        freezer_pozzetto_2: pozzetto2 ? parseFloat(pozzetto2) : null,
        timestamp: serverTimestamp()
      });
      alert('Temperature registrate con successo!');
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
    }
  });
}
