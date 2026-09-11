import { db, collection, getDocs, query, orderBy, limit } from './firebase.js';

export function renderStoricoPage(container) {
  container.innerHTML = `
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>Storico Controlli</h2>
        <p class="date-subtitle">Consultazione registri ed esportazione report</p>
      </div>
      <button id="btn-print-report" style="padding: 8px 14px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
        🖨️ Stampa PDF
      </button>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">Ultimi Rilevamenti Temperature</h3>
      <div id="table-temp-container" style="overflow-x: auto;">Caricamento...</div>
    </div>
  `;

  const printBtn = container.querySelector('#btn-print-report');
  printBtn.addEventListener('click', () => {
    window.print();
  });

  loadHistoricalData(container);
}

async function loadHistoricalData(container) {
  const tableContainer = container.querySelector('#table-temp-container');

  try {
    const q = query(collection(db, 'temperature'), orderBy('timestamp', 'desc'), limit(15));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      tableContainer.innerHTML = '<p>Nessun dato registrato nello storico.</p>';
      return;
    }

    let html = `
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
        <thead>
          <tr style="background-color: #f2f2f2; border-bottom: 2px solid #ccc;">
            <th style="padding: 8px;">Data</th>
            <th style="padding: 8px;">Banco</th>
            <th style="padding: 8px;">Colonna</th>
            <th style="padding: 8px;">Vetrina</th>
            <th style="padding: 8px;">Pozzetto 1</th>
            <th style="padding: 8px;">Pozzetto 2</th>
          </tr>
        </thead>
        <tbody>
    `;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      html += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;">${data.data || '-'}</td>
          <td style="padding: 8px;">${data.banco_frigo !== null ? data.banco_frigo + '°C' : '-'}</td>
          <td style="padding: 8px;">${data.frigo_colonna !== null ? data.frigo_colonna + '°C' : '-'}</td>
          <td style="padding: 8px;">${data.frigo_vetrina !== null ? data.frigo_vetrina + '°C' : '-'}</td>
          <td style="padding: 8px;">${data.freezer_pozzetto_1 !== null ? data.freezer_pozzetto_1 + '°C' : '-'}</td>
          <td style="padding: 8px;">${data.freezer_pozzetto_2 !== null ? data.freezer_pozzetto_2 + '°C' : '-'}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    tableContainer.innerHTML = html;
  } catch (err) {
    console.error(err);
    tableContainer.innerHTML = '<p style="color: red;">Errore nel caricamento dei dati.</p>';
  }
}