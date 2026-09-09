import { db, collection, getDocs, query, where } from './firebase.js';

export function renderStoricoPage(container) {
  const todayStr = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page-header">
      <h2>Storico Registri & Export PDF</h2>
      <p class="date-subtitle">Consulta o esporta i report ufficiali per data</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
      <div class="card" style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-weight: bold; font-size: 14px;">Data di riferimento</label>
        <input type="date" id="search-date" value="${todayStr}">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 6px;">
        <label style="font-weight: bold; font-size: 14px;">Registro</label>
        <select id="search-category">
          <option value="temperature">Temperature Apparecchiature</option>
          <option value="registro_processi">Cotture / Abbattimenti</option>
          <option value="pulizie">Pulizie e Sanificazioni</option>
          <option value="anomalie">Anomalie & Azioni Correttive</option>
          <option value="ricevimento_merci">Ricevimento Merci</option>
          <option value="tracciabilita_etichette">Tracciabilità & Sottovuoto</option>
        </select>
      </div>

      <div style="display: flex; gap: 10px;">
        <button type="button" id="btn-fetch-history" style="flex: 1; padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Cerca</button>
        <button type="button" id="btn-export-pdf" style="flex: 1; padding: 12px; background-color: #1e3a8a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">📄 Scarica PDF</button>
      </div>
    </div>

    <div id="history-results">
      <p style="color: #aaa; text-align: center;">Seleziona una data e clicca su Cerca o Scarica PDF.</p>
    </div>
  `;

  container.querySelector('#btn-fetch-history')?.addEventListener('click', fetchHistoryData);
  container.querySelector('#btn-export-pdf')?.addEventListener('click', exportToPDF);
}

async function fetchHistoryData() {
  const dateVal = document.getElementById('search-date')?.value;
  const categoryVal = document.getElementById('search-category')?.value;
  const resultsContainer = document.getElementById('history-results');

  if (!dateVal || !resultsContainer) return;
  resultsContainer.innerHTML = '<p style="color: #aaa; text-align: center;">Caricamento dati...</p>';

  try {
    const qField = categoryVal === 'tracciabilita_etichette' ? 'data_produzione' : 'data';
    const q = query(collection(db, categoryVal), where(qField, "==", dateVal));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      resultsContainer.innerHTML = '<div class="card"><p style="margin: 0; color: #aaa;">Nessuna registrazione trovata.</p></div>';
      return;
    }

    let outputHtml = '';
    querySnapshot.forEach((doc) => {
      const item = doc.data();
      outputHtml += `<div class="card" style="margin-bottom: 10px;"><pre style="white-space: pre-wrap; font-family: sans-serif; font-size: 13px;">${JSON.stringify(item, null, 2)}</pre></div>`;
    });
    resultsContainer.innerHTML = outputHtml;
  } catch (err) {
    console.error(err);
    resultsContainer.innerHTML = '<p style="color: #ef4444; text-align: center;">Errore durante il caricamento.</p>';
  }
}

async function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const dateVal = document.getElementById('search-date')?.value;
  const categoryVal = document.getElementById('search-category')?.value;

  if (!dateVal) return alert('Seleziona una data.');

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("LA CAVA DEI VINI - Registro HACCP", 14, 15);
  doc.setFontSize(11);
  doc.text(`Registro: ${categoryVal} | Data: ${dateVal}`, 14, 23);

  try {
    const qField = categoryVal === 'tracciabilita_etichette' ? 'data_produzione' : 'data';
    const q = query(collection(db, categoryVal), where(qField, "==", dateVal));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return alert("Nessun dato da esportare.");

    let rows = [];
    querySnapshot.forEach(d => rows.push([JSON.stringify(d.data())]));

    doc.autoTable({ startY: 30, head: [['Dati Registrati']], body: rows });
    doc.save(`HACCP_LaCavaDeiVini_${categoryVal}_${dateVal}.pdf`);
  } catch (err) {
    console.error(err);
    alert("Errore generazione PDF.");
  }
}
