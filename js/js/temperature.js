import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderTemperaturePage(container) {
  const today = new Date().toISOString().split('T')[0];
  container.innerHTML = `
    <div class="page-header">
      <h2>Registro Temperature</h2>
      <p class="date-subtitle">Controllo celle, frigo e freezer</p>
    </div>
    <form id="temp-form" class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <label style="font-weight: bold; font-size: 14px;">Frigo Banco Bar (Ottimale: +2°C / +6°C)</label>
      <input type="number" step="0.1" id="temp_bar" placeholder="Es. 4.2" required>
      
      <label style="font-weight: bold; font-size: 14px;">Cella Frigo Cucina (Ottimale: 0°C / +4°C)</label>
      <input type="number" step="0.1" id="temp_cella" placeholder="Es. 2.1" required>

      <label style="font-weight: bold; font-size: 14px;">Freezer / Congelatore (Ottimale: <= -18°C)</label>
      <input type="number" step="0.1" id="temp_freezer" placeholder="Es. -19.5" required>

      <button type="button" id="btn-save-temp" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 5px;">Salva Temperature</button>
    </form>
  `;

  container.querySelector('#btn-save-temp')?.addEventListener('click', async () => {
    const bar = container.querySelector('#temp_bar').value;
    const cella = container.querySelector('#temp_cella').value;
    const freezer = container.querySelector('#temp_freezer').value;

    if (!bar || !cella || !freezer) {
      alert('Compila tutti i campi delle temperature.');
      return;
    }

    try {
      await addDoc(collection(db, "temperature"), {
        data: today,
        letture: { "Frigo Banco Bar": bar, "Cella Frigo Cucina": cella, "Freezer": freezer },
        timestamp: serverTimestamp()
      });
      alert('Temperature salvate con successo!');
      container.querySelector('#temp-form').reset();
    } catch (err) {
      console.error(err);
      alert('Errore nel salvataggio.');
    }
  });
}
