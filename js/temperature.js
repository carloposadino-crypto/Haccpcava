import { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from './firebase.js';

export function renderTemperaturePage(container) {
  container.innerHTML = `
    <div style="padding: 16px; max-width: 600px; margin: 0 auto; padding-bottom: 80px;">
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">
        🌡️ Registro Controllo Temperature
      </h2>

      <form id="form-temperatura" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 24px;">
        
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Attrezzatura / Unità Frigorifera</label>
          <select id="attrezzatura" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 14px;">
            <option value="Frigo Passante 1 (0°C / +4°C)" data-type="frigo" data-max="4" data-min="0">Frigo Passante 1 (0°C / +4°C)</option>
            <option value="Frigo Carni / Pesce (0°C / +2°C)" data-type="frigo" data-max="2" data-min="-1">Frigo Carni / Pesce (0°C / +2°C)</option>
            <option value="Cella Verdure (+2°C / +6°C)" data-type="frigo" data-max="6" data-min="0">Cella Verdure (+2°C / +6°C)</option>
            <option value="Freezer Conservazione (-18°C / -22°C)" data-type="freezer" data-max="-18" data-min="-25">Freezer Conservazione (-18°C / -22°C)</option>
            <option value="Abbattitore - Ciclo Positivo (+3°C)" data-type="abbattitore_pos" data-max="3" data-min="-2">Abbattitore Positivo (+3°C max)</option>
            <option value="Abbattitore - Ciclo Negativo (-18°C)" data-type="abbattitore_neg" data-max="-18" data-min="-40">Abbattitore Negativo (-18°C max)</option>
          </select>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Temperatura Rilevata (°C)</label>
          <input type="number" step="0.1" id="valore-temp" required placeholder="Es. 3.2" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 16px;">
        </div>

        <!-- Warning Limite Critico Superato -->
        <div id="alert-limite" style="display: none; background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
          <div style="color: #991b1b; font-weight: bold; font-size: 13px; margin-bottom: 4px;">
            ⚠️ ATTENZIONE: TEMPERATURA FUORI LIMITE CRITICO!
          </div>
          <p style="font-size: 12px; color: #7f1d1d; margin-bottom: 8px;">
            La temperatura inserita non rispetta i parametri HACCP stabiliti.
          </p>
          <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #991b1b;">Azione Correttiva Obbligatoria *</label>
          <textarea id="azione-correttiva" rows="2" placeholder="Es. Regolato termostato, spostati prodotti in cella 2 e notificato manutentore..." style="width: 100%; padding: 8px; border: 1px solid #f87171; border-radius: 6px; box-sizing: border-box; font-size: 13px;"></textarea>
        </div>

        <button type="submit" style="width: 100%; background-color: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
          💾 Salva Rilevazione Temperatura
        </button>
      </form>

      <div id="msg-conferma-temp" style="display: none; margin-bottom: 15px; padding: 12px; background-color: #d1fae5; color: #065f46; border-radius: 8px; text-align: center; font-weight: bold;">
        ✅ Rilevazione salvata con successo!
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">📋 Ultime Rilevazioni</h3>
      <div id="lista-storico-temp" style="display: flex; flex-direction: column; gap: 10px;">
        <p style="color: #6b7280; font-size: 13px; text-align: center;">Caricamento storico...</p>
      </div>

    </div>
  `;

  const form = document.getElementById('form-temperatura');
  const attrezzaturaSelect = document.getElementById('attrezzatura');
  const inputTemp = document.getElementById('valore-temp');
  const alertLimite = document.getElementById('alert-limite');
  const azioneCorrettivaInput = document.getElementById('azione-correttiva');
  const msgConferma = document.getElementById('msg-conferma-temp');
  const listaStorico = document.getElementById('lista-storico-temp');

  // Controllo in tempo reale dei limiti critici
  function verificaLimiti() {
    const option = attrezzaturaSelect.options[attrezzaturaSelect.selectedIndex];
    const max = parseFloat(option.getAttribute('data-max'));
    const val = parseFloat(inputTemp.value);

    if (!isNaN(val) && val > max) {
      alertLimite.style.display = 'block';
      azioneCorrettivaInput.required = true;
    } else {
      alertLimite.style.display = 'none';
      azioneCorrettivaInput.required = false;
      azioneCorrettivaInput.value = '';
    }
  }

  inputTemp.addEventListener('input', verificaLimiti);
  attrezzaturaSelect.addEventListener('change', verificaLimiti);

  // Caricamento storico rilevazioni
  async function caricaStoricoTemp() {
    try {
      const q = query(collection(db, 'temperature'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        listaStorico.innerHTML = '<p style="color: #6b7280; font-size: 13px; text-align: center;">Nessuna rilevazione registrata.</p>';
        return;
      }

      let html = '';
      querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const eAnomala = item.anomalia;
        const borderCol = eAnomala ? '#ef4444' : '#10b981';
        const statusBadge = eAnomala ? '🔴 ANOMALIA' : '🟢 OK';

        html += `
          <div style="background: white; border-left: 4px solid ${borderCol}; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
              <span>${item.attrezzatura}</span>
              <span>${statusBadge}</span>
            </div>
            <div style="color: #4b5563; font-size: 12px;">
              Temperatura: <strong style="font-size: 14px; color: ${eAnomala ? '#dc2626' : '#059669'};">${item.temperatura}°C</strong> | Data: ${item.dataOra}
            </div>
            ${item.azioneCorrettiva ? `
              <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 4px; padding: 6px; margin-top: 6px; font-size: 11px; color: #991b1b;">
                <strong>Azione Correttiva:</strong> ${item.azioneCorrettiva}
              </div>
            ` : ''}
          </div>
        `;
      });

      listaStorico.innerHTML = html;
    } catch (err) {
      console.error("Errore lettura storico temperature:", err);
      listaStorico.innerHTML = '<p style="color: #ef4444; font-size: 13px; text-align: center;">Errore nel caricamento del registro.</p>';
    }
  }

  // Salvataggio temperatura
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const option = attrezzaturaSelect.options[attrezzaturaSelect.selectedIndex];
    const max = parseFloat(option.getAttribute('data-max'));
    const val = parseFloat(inputTemp.value);
    const eAnomala = val > max;

    const data = {
      attrezzatura: attrezzaturaSelect.value,
      temperatura: val,
      limiteMax: max,
      anomalia: eAnomala,
      azioneCorrettiva: eAnomala ? azioneCorrettivaInput.value : null,
      timestamp: serverTimestamp(),
      dataOra: new Date().toLocaleString('it-IT')
    };

    try {
      await addDoc(collection(db, 'temperature'), data);
      form.reset();
      alertLimite.style.display = 'none';
      msgConferma.style.display = 'block';
      setTimeout(() => { msgConferma.style.display = 'none'; }, 3000);
      caricaStoricoTemp();
    } catch (err) {
      alert("Errore durante il salvataggio: " + err.message);
    }
  });

  caricaStoricoTemp();
}