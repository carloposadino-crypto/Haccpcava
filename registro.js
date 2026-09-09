import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderRegistroPage(container) {
  const today = new Date().toLocaleDateString('it-IT');

  const html = `
    <div class="page-header">
      <h2>Registro Processi Termici</h2>
      <p class="date-subtitle">Data: ${today}</p>
    </div>

    <form id="registro-form" style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
      
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Tipo Operazione</label>
        <select id="tipo_operazione" name="tipo_operazione" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%;">
          <option value="Abbattimento">Abbattimento</option>
          <option value="Cotture">Cottura</option>
          <option value="Rigenerazione">Rigenerazione</option>
        </select>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Prodotto / Preparazione</label>
        <input type="text" id="prodotto" name="prodotto" placeholder="Es. Vitello Tonnato / Arrosto" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;" required>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Quantità / Porzioni</label>
        <input type="text" id="quantita" name="quantita" placeholder="Es. 20 porzioni / 3 kg" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
      </div>

      <div style="display: flex; gap: 10px;">
        <div class="card" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold; font-size: 14px;">Temp. Iniziale (°C)</label>
          <input type="number" step="0.1" id="temp_inizio" name="temp_inizio" placeholder="75.0" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
        </div>
        <div class="card" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold; font-size: 14px;">Temp. Finale (°C)</label>
          <input type="number" step="0.1" id="temp_fine" name="temp_fine" placeholder="3.0" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
        </div>
      </div>

      <div style="display: flex; gap: 10px;">
        <div class="card" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold; font-size: 14px;">Ora Inizio</label>
          <input type="time" id="ora_inizio" name="ora_inizio" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
        </div>
        <div class="card" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold; font-size: 14px;">Ora Fine</label>
          <input type="time" id="ora_fine" name="ora_fine" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
        </div>
      </div>

      <button 
        type="button" 
        id="btn-save-registro"
        style="padding: 14px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;"
      >
        Registra Operazione
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;
    const btn = container.querySelector('#btn-save-registro');
    if (btn) btn.addEventListener('click', handleSaveRegistro);
  }

  return html;
}

async function handleSaveRegistro() {
  const prodotto = document.getElementById('prodotto')?.value.trim();
  if (!prodotto) {
    alert('Inserisci il nome del prodotto prima di salvare.');
    return;
  }

  const btn = document.getElementById('btn-save-registro');
  btn.disabled = true;
  btn.innerText = 'Salvataggio...';

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    await addDoc(collection(db, "registro_processi"), {
      data: todayStr,
      tipo: document.getElementById('tipo_operazione').value,
      prodotto: prodotto,
      quantita: document.getElementById('quantita').value,
      temp_inizio: parseFloat(document.getElementById('temp_inizio').value) || null,
      temp_fine: parseFloat(document.getElementById('temp_fine').value) || null,
      ora_inizio: document.getElementById('ora_inizio').value,
      ora_fine: document.getElementById('ora_fine').value,
      timestamp: serverTimestamp()
    });

    alert('Operazione registrata su Firebase!');
    document.getElementById('registro-form').reset();
    window.switchTab('oggi');
  } catch (error) {
    console.error("Errore durante il salvataggio:", error);
    alert('Errore nel salvataggio dell operazione.');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Registra Operazione';
  }
}
