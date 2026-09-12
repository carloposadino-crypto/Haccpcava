import { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from './firebase.js';

export function renderAbbattimentoPage(container) {
  container.innerHTML = `
    <div style="padding: 16px; max-width: 600px; margin: 0 auto; padding-bottom: 80px;">
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">
        🧊 Registro Abbattimento & CBT
      </h2>

      <form id="form-abbattimento" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 24px;">
        
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Tipo di Processo *</label>
          <select id="tipo-processo" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 14px;">
            <option value="ABBATTIMENTO_POSITIVO">❄️ Abbattimento Positivo (+60°C -> +3°C al cuore | max 90 min)</option>
            <option value="ABBATTIMENTO_NEGATIVO">🧊 Surgelazione / Negativo (+60°C -> -18°C al cuore | max 240 min)</option>
            <option value="ANISAKIS">🐟 Bonifica Anisakis Crudi (-20°C per 24h / -35°C per 15h)</option>
            <option value="CBT_RONER">🌡️ Cottura Bassa Temperatura (CBT / Roner)</option>
          </select>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Prodotto / Preparazione *</label>
          <input type="text" id="prodotto-cbt" required placeholder="Es. Vitello per Tonnato, Guancia di Bovino, Polpo..." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Lotto Materia Prima / Origine</label>
          <input type="text" id="lotto-materia-prima" placeholder="Es. L-2026-0912 o DDT Fornitore" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 14px;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Temp. Inizio (°C)</label>
            <input type="number" step="0.1" id="temp-inizio" placeholder="Es. 65" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Temp. Fine / Cuore (°C) *</label>
            <input type="number" step="0.1" id="temp-fine" required placeholder="Es. 2.8" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 14px;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Durata Ciclo (Minuti)</label>
            <input type="number" id="durata-minuti" placeholder="Es. 75" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Operatore *</label>
            <input type="text" id="operatore-abb" required placeholder="Es. Carlo P." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
        </div>

        <div id="alert-abbattimento" style="display: none; background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; margin-bottom: 14px;">
          <div style="color: #991b1b; font-weight: bold; font-size: 13px; margin-bottom: 4px;">
            ⚠️ ANOMALIA: TEMPO DI ABBATTIMENTO FUORI LIMITE!
          </div>
          <p style="font-size: 12px; color: #7f1d1d; margin-bottom: 8px;">
            Il ciclo ha superato il limite di tempo HACCP previsto per la sicurezza.
          </p>
          <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #991b1b;">Azione Correttiva *</label>
          <input type="text" id="azione-correttiva-abb" placeholder="Es. Prodotto rigenerato e destinato a consumo immediato..." style="width: 100%; padding: 8px; border: 1px solid #f87171; border-radius: 6px; box-sizing: border-box; font-size: 13px;">
        </div>

        <button type="submit" style="width: 100%; background-color: #0284c7; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
          💾 Salva Ciclo Abbattimento / CBT
        </button>
      </form>

      <div id="msg-conferma-abb" style="display: none; margin-bottom: 15px; padding: 12px; background-color: #d1fae5; color: #065f46; border-radius: 8px; text-align: center; font-weight: bold;">
        ✅ Ciclo registrato con successo!
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">📋 Storico Cicli Abbattimento & CBT</h3>
      <div id="lista-storico-abbattimento" style="display: flex; flex-direction: column; gap: 10px;">
        <p style="color: #6b7280; font-size: 13px; text-align: center;">Caricamento storico...</p>
      </div>

    </div>
  `;

  const form = document.getElementById('form-abbattimento');
  const tipoProcesso = document.getElementById('tipo-processo');
  const inputTempFine = document.getElementById('temp-fine');
  const inputDurata = document.getElementById('durata-minuti');
  const alertAbb = document.getElementById('alert-abbattimento');
  const azioneCorrettivaAbb = document.getElementById('azione-correttiva-abb');
  const msgConferma = document.getElementById('msg-conferma-abb');
  const listaStorico = document.getElementById('lista-storico-abbattimento');

  function verificaTempiLimiti() {
    const tipo = tipoProcesso.value;
    const durata = parseInt(inputDurata.value) || 0;
    const tempFine = parseFloat(inputTempFine.value);

    let fuoriLimite = false;

    if (tipo === 'ABBATTIMENTO_POSITIVO' && (durata > 90 || tempFine > 3)) {
      fuoriLimite = true;
    } else if (tipo === 'ABBATTIMENTO_NEGATIVO' && (durata > 240 || tempFine > -18)) {
      fuoriLimite = true;
    }

    if (fuoriLimite) {
      alertAbb.style.display = 'block';
      azioneCorrettivaAbb.required = true;
    } else {
      alertAbb.style.display = 'none';
      azioneCorrettivaAbb.required = false;
      azioneCorrettivaAbb.value = '';
    }
  }

  inputDurata.addEventListener('input', verificaTempiLimiti);
  inputTempFine.addEventListener('input', verificaTempiLimiti);
  tipoProcesso.addEventListener('change', verificaTempiLimiti);

  async function caricaStoricoAbbattimento() {
    try {
      const q = query(collection(db, 'abbattimenti'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        listaStorico.innerHTML = '<p style="color: #6b7280; font-size: 13px; text-align: center;">Nessun ciclo registrato.</p>';
        return;
      }

      let html = '';
      querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const eAnomalia = item.anomalia;
        const borderCol = eAnomalia ? '#ef4444' : '#0284c7';

        html += `
          <div style="background: white; border-left: 4px solid ${borderCol}; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
              <span>${item.prodotto}</span>
              <span style="color: #0284c7;">${item.tipo ? item.tipo.replace('_', ' ') : 'Abbattimento'}</span>
            </div>
            <div style="color: #4b5563; font-size: 12px;">
              Temp. Cuore: <strong>${item.tempFine}°C</strong> | Durata: <strong>${item.durataMinuti || 'N/D'} min</strong>
            </div>
            <div style="color: #6b7280; font-size: 11px; margin-top: 2px;">
              Lotto: ${item.lottoMP || 'N/D'} | Operatore: ${item.operatore} | ${item.dataOra}
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
      console.error("Errore lettura storico abbattimenti:", err);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo = tipoProcesso.value;
    const durata = parseInt(inputDurata.value) || 0;
    const tempFine = parseFloat(inputTempFine.value);
    
    let fuoriLimite = false;
    if (tipo === 'ABBATTIMENTO_POSITIVO' && (durata > 90 || tempFine > 3)) fuoriLimite = true;
    if (tipo === 'ABBATTIMENTO_NEGATIVO' && (durata > 240 || tempFine > -18)) fuoriLimite = true;

    const data = {
      tipo: tipo,
      prodotto: document.getElementById('prodotto-cbt').value,
      lottoMP: document.getElementById('lotto-materia-prima').value,
      tempInizio: parseFloat(document.getElementById('temp-inizio').value) || null,
      tempFine: tempFine,
      durataMinuti: durata,
      operatore: document.getElementById('operatore-abb').value,
      anomalia: fuoriLimite,
      azioneCorrettiva: fuoriLimite ? azioneCorrettivaAbb.value : null,
      timestamp: serverTimestamp(),
      dataOra: new Date().toLocaleString('it-IT')
    };

    try {
      await addDoc(collection(db, 'abbattimenti'), data);
      form.reset();
      alertAbb.style.display = 'none';
      msgConferma.style.display = 'block';
      setTimeout(() => { msgConferma.style.display = 'none'; }, 3000);
      caricaStoricoAbbattimento();
    } catch (err) {
      alert("Errore salvataggio ciclo: " + err.message);
    }
  });

  caricaStoricoAbbattimento();
}