import { db, collection, getDocs, query, where } from './firebase.js';

export function renderStoricoPage(container) {
  const todayStr = new Date().toISOString().split('T')[0];

  const html = `
    <div class="page-header">
      <h2>Storico Registri & Consultazione</h2>
      <p class="date-subtitle">Seleziona la data e la categoria da consultare</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
      <div class="card" style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-weight: bold; font-size: 14px;">Data di riferimento</label>
        <input type="date" id="search-date" value="${todayStr}" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-weight: bold; font-size: 14px;">Registro</label>
        <select id="search-category" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%;">
          <option value="temperature">Temperature Apparecchiature</option>
          <option value="registro_processi">Cotture / Abbattimenti</option>
          <option value="pulizie">Pulizie e Sanificazioni</option>
          <option value="anomalie">Anomalie & Azioni Correttive</option>
          <option value="ricevimento_merci">Ricevimento Merci</option>
        </select>
      </div>

      <button 
        type="button" 
        id="btn-fetch-history"
        style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer;"
      >
        Cerca Registrazioni
      </button>
    </div>

    <div id="history-results">
      <p style="color: #aaa; text-align: center;">Seleziona una data e clicca su cerca per caricare i dati.</p>
    </div>
  `;

  if (container) {
    container.innerHTML = html;
    const btn = container.querySelector('#btn-fetch-history');
    if (btn) btn.addEventListener('click', fetchHistoryData);
  }

  return html;
}

async function fetchHistoryData() {
  const dateVal = document.getElementById('search-date')?.value;
  const categoryVal = document.getElementById('search-category')?.value;
  const resultsContainer = document.getElementById('history-results');

  if (!dateVal || !resultsContainer) return;

  resultsContainer.innerHTML = '<p style="color: #aaa; text-align: center;">Caricamento dati in corso...</p>';

  try {
    const q = query(collection(db, categoryVal), where("data", "==", dateVal));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      resultsContainer.innerHTML = '<div class="card"><p style="margin: 0; color: #aaa;">Nessuna registrazione trovata per questa data.</p></div>';
      return;
    }

    let outputHtml = '';

    querySnapshot.forEach((doc) => {
      const item = doc.data();
      
      if (categoryVal === 'temperature') {
        const lettureKeys = item.letture ? Object.keys(item.letture) : [];
        const details = lettureKeys.map(k => `<li><b>${k}:</b> ${item.letture[k]} °C</li>`).join('');
        outputHtml += `
          <div class="card" style="margin-bottom: 10px;">
            <h4 style="margin: 0 0 8px 0; color: #3b82f6;">Verifica Temperature</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">${details}</ul>
          </div>
        `;
      } else if (categoryVal === 'registro_processi') {
        outputHtml += `
          <div class="card" style="margin-bottom: 10px;">
            <h4 style="margin: 0 0 4px 0; color: #f59e0b;">${item.tipo || 'Processo'} - ${item.prodotto || ''}</h4>
            <p style="margin: 2px 0; font-size: 14px;">Quantità: ${item.quantita || 'N/D'}</p>
            <p style="margin: 2px 0; font-size: 14px;">Temp: da ${item.temp_inizio ?? 'N/D'} °C a ${item.temp_fine ?? 'N/D'} °C</p>
            <p style="margin: 2px 0; font-size: 14px;">Orario: ${item.ora_inizio || '--:--'} -> ${item.ora_fine || '--:--'}</p>
          </div>
        `;
      } else if (categoryVal === 'pulizie') {
        outputHtml += `
          <div class="card" style="margin-bottom: 10px;">
            <h4 style="margin: 0 0 4px 0; color: #10b981;">Pulizie Completate</h4>
            <p style="margin: 2px 0; font-size: 14px;">Mansioni eseguite: ${item.totale_completate || 0}</p>
            <p style="margin: 2px 0; font-size: 14px;">Note: ${item.note || 'Nessuna nota'}</p>
          </div>
        `;
      } else if (categoryVal === 'anomalie') {
        outputHtml += `
          <div class="card" style="margin-bottom: 10px; border-left: 4px solid #ef4444;">
            <h4 style="margin: 0 0 4px 0; color: #ef4444;">${item.tipo || 'Anomalia'} (${item.stato || 'Aperta'})</h4>
            <p style="margin: 2px 0; font-size: 14px;"><b>Problema:</b> ${item.descrizione || ''}</p>
            <p style="margin: 2px 0; font-size: 14px;"><b>Azione:</b> ${item.azione_correttiva || ''}</p>
          </div>
        `;
      } else if (categoryVal === 'ricevimento_merci') {
        outputHtml += `
          <div class="card" style="margin-bottom: 10px;">
            <h4 style="margin: 0 0 4px 0; color: #8b5cf6;">Fornitore: ${item.fornitore || ''}</h4>
            <p style="margin: 2px 0; font-size: 14px;">Prodotto: ${item.prodotto || ''} (DDT: ${item.num_ddt || 'N/D'})</p>
            <p style="margin: 2px 0; font-size: 14px;">Temp. merce: ${item.temperatura ?? 'N/D'} °C | Esito: <b>${item.esito || ''}</b></p>
          </div>
        `;
      }
    });

    resultsContainer.innerHTML = outputHtml;
  } catch (err) {
    console.error("Errore recupero storico:", err);
    resultsContainer.innerHTML = '<p style="color: #ef4444; text-align: center;">Errore durante il caricamento dei dati.</p>';
  }
}
