import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function renderStoricoPage() {
  const container = document.getElementById('tab-content');
  if (!container) return;

  container.innerHTML = `
    <section class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2>Storico Registrazioni</h2>
        <button onclick="window.print()" style="background:#2a9d8f; color:#fff; border:none; padding:8px 12px; border-radius:6px; font-weight:bold; cursor:pointer;">🖨️ Stampa / PDF</button>
      </div>
      <div id="storico-content">Caricamento storico...</div>
    </section>
  `;

  caricaStoricoCompleto();
}

async function caricaStoricoCompleto() {
  const container = document.getElementById('storico-content');
  if (!container) return;

  try {
    const qTemp = query(collection(db, "temperature"), orderBy("timestamp", "desc"));
    const snapTemp = await getDocs(qTemp);
    
    if (snapTemp.empty) {
      container.innerHTML = '<p class="empty-text">Nessun dato presente in archivio.</p>';
      return;
    }

    const dati = snapTemp.docs.map(doc => doc.data());

    container.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:13px; color:#fff; text-align:left;">
        <thead>
          <tr style="border-bottom:2px solid #d4a373; color:#d4a373;">
            <th style="padding:8px;">Data/Ora</th>
            <th style="padding:8px;">Apparecchio</th>
            <th style="padding:8px;">Temp (°C)</th>
            <th style="padding:8px;">Stato</th>
          </tr>
        </thead>
        <tbody>
          ${dati.map(d => `
            <tr style="border-bottom:1px solid #3d352e;">
              <td style="padding:8px; color:#aaa;">${new Date(d.timestamp).toLocaleString('it-IT')}</td>
              <td style="padding:8px; font-weight:bold;">${d.nome || d.attrezzaturaId}</td>
              <td style="padding:8px;">${d.valore}°C</td>
              <td style="padding:8px; color:${d.conforme ? '#2a9d8f' : '#e63946'};">${d.conforme ? 'OK' : 'FUORI RANGE'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    container.innerHTML = '<p class="error-text">Errore nel caricamento dello storico.</p>';
  }
}
