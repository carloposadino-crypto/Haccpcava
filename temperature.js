import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderTemperaturePage(container) {
  const today = new Date().toLocaleDateString('it-IT');

  const attrezzature = [
    { id: 'tavolo_cucina', name: 'Tavolo Refrigerato Cucina', range: '+2°C / +4°C', placeholder: '3.0' },
    { id: 'armadio_positivo', name: 'Armadio Frigo Positivo', range: '+0°C / +4°C', placeholder: '2.5' },
    { id: 'frigo_bibite', name: 'Frigo Vetrina Bibite', range: '+2°C / +6°C', placeholder: '4.0' },
    { id: 'freezer_1', name: 'Freezer Verticale 1', range: '-18°C / -22°C', placeholder: '-20.0' },
    { id: 'freezer_2', name: 'Freezer Verticale 2', range: '-18°C / -22°C', placeholder: '-19.5' },
    { id: 'abbattitore_standby', name: 'Abbattitore (Standby)', range: '-35°C / +3°C', placeholder: '2.0' }
  ];

  const cardsHtml = attrezzature.map(eq => `
    <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
      <label style="font-weight: bold; font-size: 15px;">
        ${eq.name} <span style="font-size: 12px; font-weight: normal; color: #aaa;">(${eq.range})</span>
      </label>
      <input 
        type="number" 
        step="0.1" 
        id="input_${eq.id}" 
        name="${eq.id}" 
        placeholder="Es. ${eq.placeholder}" 
        style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;"
      >
    </div>
  `).join('');

  const html = `
    <div class="page-header">
      <h2>Temperature Frigo & Freezer</h2>
      <p class="date-subtitle">Data: ${today}</p>
    </div>

    <form id="temp-form" style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
      ${cardsHtml}

      <button 
        type="button" 
        id="btn-save-temp"
        style="padding: 14px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;"
      >
        Salva Temperature
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;
    const btn = container.querySelector('#btn-save-temp');
    if (btn) btn.addEventListener('click', handleSaveTemperatures);
  }

  return html;
}

async function handleSaveTemperatures() {
  const form = document.getElementById('temp-form');
  if (!form) return;

  const formData = new FormData(form);
  const data = {};

  for (let [key, value] of formData.entries()) {
    if (value !== '') data[key] = parseFloat(value);
  }

  if (Object.keys(data).length === 0) {
    alert('Inserisci almeno una temperatura prima di salvare.');
    return;
  }

  const btn = document.getElementById('btn-save-temp');
  btn.disabled = true;
  btn.innerText = 'Salvataggio in corso...';

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    await addDoc(collection(db, "temperature"), {
      data: todayStr,
      letture: data,
      count: Object.keys(data).length,
      timestamp: serverTimestamp()
    });

    alert('Temperature registrate con successo su Firebase!');
    form.reset();
    window.switchTab('oggi');
  } catch (error) {
    console.error("Errore durante il salvataggio:", error);
    alert('Errore nel salvataggio dei dati.');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Salva Temperature';
  }
}
