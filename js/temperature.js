import { db, collection, getDocs, addDoc, query, orderBy, limit } from './firebase.js';

export async function renderTemperaturePage(container) {
  container.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; padding: 16px;">
      <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px;">
        <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
          <span>🌡️</span> Registro Controllo Temperature
        </h2>
        <form id="temp-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 500; color: #475569; margin-bottom: 6px;">Attrezzatura / Unità Frigorifera</label>
            <select id="attrezzatura-select" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;">
              <option value="Banco Frigo">Banco Frigo (0°C / +4°C)</option>
              <option value="Armadio Frigo">Armadio Frigo (0°C / +4°C)</option>
              <option value="Frigo Magazzino">Frigo Magazzino (+2°C / +6°C)</option>
              <option value="Frigo Vetrina">Frigo Vetrina (+2°C / +8°C)</option>
              <option value="Freezer Pozzetto 1">Freezer Pozzetto 1 (-22°C / -18°C)</option>
              <option value="Freezer Pozzetto 2">Freezer Pozzetto 2 (-22°C / -18°C)</option>
            </select>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; font-size: 13px; font-weight: 500; color: #475569; margin-bottom: 6px;">Temperatura Rilevata (°C)</label>
            <input type="number" step="0.1" id="temp-input" placeholder="Es. 3.2" required style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
          </div>
          <button type="submit" style="width: 100%; background: #2563eb; color: white; padding: 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span>💾</span> Salva Rilevazione Temperatura
          </button>
        </form>
      </div>

      <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #1e293b; display: flex; align-items: center; gap: 8px;">
          <span>📋</span> Ultime Rilevazioni
        </h3>
        <div id="temp-list">Caricamento in corso...</div>
      </div>
    </div>
  `;

  const form = container.querySelector('#temp-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const attrezzatura = container.querySelector('#attrezzatura-select').value;
    const temp = parseFloat(container.querySelector('#temp-input').value);
    
    try {
      await addDoc(collection(db, 'temperature'), {
        attrezzatura: attrezzatura,
        temperatura: temp,
        data: new Date().toLocaleDateString('it-IT') + ' ' + new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date()
      });
      container.querySelector('#temp-input').value = '';
      loadTemperatureHistory(container);
    } catch (err) {
      console.error("Errore salvataggio:", err);
      alert("Errore durante il salvataggio della temperatura.");
    }
  });

  loadTemperatureHistory(container);
}

async function loadTemperatureHistory(container) {
  const listContainer = container.querySelector('#temp-list');
  if (!listContainer) return;

  try {
    const q = query(collection(db, 'temperature'), orderBy('timestamp', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      listContainer.innerHTML = '<p style="color: #64748b; font-size: 14px;">Nessuna rilevazione presente.</p>';
      return;
    }

    let html = '';
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const nomeAttrezzatura = data.attrezzatura || data.attrezzaturaNome || data.nomeFrigo || data.frigo || data.frigoNome || data.equipment || data.equipmentName || data.unita || data.unitaFrigorifera || data.nome || 'Attrezzatura';
      const valoreTemp = data.temperatura ?? data.temp ?? data.valore ?? data.gradi ?? data.grado ?? 'N/D';
      
      let dataOra = data.data || data.date || data.ora || data.created_at || data.createdAt;
      if (!dataOra && data.timestamp) {
        if (typeof data.timestamp.toDate === 'function') {
          dataOra = data.timestamp.toDate().toLocaleString('it-IT');
        } else if (typeof data.timestamp === 'string') {
          dataOra = data.timestamp;
        }
      }
      
      if (typeof dataOra === 'string' && dataOra.includes('T')) {
        try {
          const d = new Date(dataOra);
          if (!isNaN(d.getTime())) {
            dataOra = d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
          }
        } catch (e) {}
      }
      
      if (!dataOra) dataOra = 'Data non disponibile';

      html += `
        <div style="border-left: 4px solid #10b981; background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="display: block; font-size: 14px; color: #1e293b;">${nomeAttrezzatura}</strong>
            <span style="font-size: 12px; color: #64748b;">Temperatura: <strong style="color: #059669;">${valoreTemp}°C</strong> | Data: ${dataOra}</span>
          </div>
          <span style="background: #d1fae5; color: #047857; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 12px;">OK</span>
        </div>
      `;
    });
    listContainer.innerHTML = html;
  } catch (err) {
    console.error("Errore caricamento storico:", err);
    listContainer.innerHTML = '<p style="color: #ef4444; font-size: 14px;">Errore nel caricamento dei dati.</p>';
  }
}
