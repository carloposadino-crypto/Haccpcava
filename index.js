import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAnomaliePage, apriModalAnomalia } from './anomalie.js';
import { renderProdottiPage } from './prodotti.js';
import { renderRicezioniPage } from './ricevimento.js';
import { getTemperature, getRegistro } from './store.js';
import { db } from './firebase.js';
import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentTab = 'oggi';

function renderLayout(contentHtml) {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="app-container">
      <header class="app-header">
        <h1>La Cava · HACCP</h1>
        <button class="btn-anomaly" id="global-anomaly-btn" title="Segnala Anomalia">!</button>
      </header>
      
      <main id="tab-content">
        ${contentHtml}
      </main>
    </div>

    <nav class="bottom-nav">
      <button class="nav-item ${currentTab === 'oggi' ? 'active' : ''}" data-tab="oggi">Oggi</button>
      <button class="nav-item ${currentTab === 'temperature' ? 'active' : ''}" data-tab="temperature">Temp</button>
      <button class="nav-item ${currentTab === 'registro' ? 'active' : ''}" data-tab="registro">Registro</button>
      <button class="nav-item ${currentTab === 'pulizie' ? 'active' : ''}" data-tab="pulizie">Pulizie</button>
      <button class="nav-item ${currentTab === 'altro' ? 'active' : ''}" data-tab="altro">Altro</button>
    </nav>
  `;

  document.getElementById('global-anomaly-btn').addEventListener('click', () => {
    apriModalAnomalia(() => switchTab(currentTab));
  });

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentTab = e.currentTarget.getAttribute('data-tab');
      switchTab(currentTab);
    });
  });
}

async function renderOggi() {
  const html = `
    <section class="card">
      <h2>Stato Controlli di Oggi</h2>
      
      <div class="dashboard-row" onclick="switchTab('temperature')">
        <span class="dashboard-title">Temperature Apparecchiature</span>
        <span class="dashboard-status" id="dash-temp-status">Caricamento...</span>
      </div>

      <div class="dashboard-row" onclick="switchTab('registro')">
        <span class="dashboard-title">Cotture / Abbattimenti / Rigenerazioni</span>
        <span class="dashboard-status" id="dash-reg-status">Caricamento...</span>
      </div>

      <div class="dashboard-row" onclick="switchTab('pulizie')">
        <span class="dashboard-title">Pulizie Giornaliere</span>
        <span class="dashboard-status" id="dash-pulizie-status">Caricamento...</span>
      </div>

      <div class="dashboard-row" onclick="switchTab('anomalie')">
        <span class="dashboard-title">Anomalie Aperte</span>
        <span class="dashboard-status" id="dash-anomalie-status">Caricamento...</span>
      </div>
    </section>
  `;
  renderLayout(html);

  const oggi = new Date().toISOString().split('T')[0];

  try {
    const temps = await getTemperature();
    const rilevazioniOggi = temps.filter(t => t.timestamp && t.timestamp.startsWith(oggi));
    const statusTemp = document.getElementById('dash-temp-status');
    if (statusTemp) {
      statusTemp.textContent = `${rilevazioniOggi.length}/6 verificate`;
      if (rilevazioniOggi.length === 6) statusTemp.style.color = '#2a9d8f';
    }
  } catch (e) {
    const statusTemp = document.getElementById('dash-temp-status');
    if (statusTemp) statusTemp.textContent = 'Da verificare';
  }

  try {
    const processi = await getRegistro();
    const processiOggi = processi.filter(p => p.timestamp && p.timestamp.startsWith(oggi));
    const statusReg = document.getElementById('dash-reg-status');
    if (statusReg) {
      statusReg.textContent = `${processiOggi.length} registrate`;
      if (processiOggi.length > 0) statusReg.style.color = '#2a9d8f';
    }
  } catch (e) {
    const statusReg = document.getElementById('dash-reg-status');
    if (statusReg) statusReg.textContent = '0 registrate';
  }

  try {
    const pulizieSnap = await getDocs(query(collection(db, "pulizie")));
    const pulizieOggi = pulizieSnap.docs.map(d => d.data()).filter(p => p.timestamp && p.timestamp.startsWith(oggi));
    const statusPulizio = document.getElementById('dash-pulizie-status');
    if (statusPulizio) {
      statusPulizio.textContent = `${pulizieOggi.length} completate`;
      if (pulizieOggi.length >= 3) statusPulizio.style.color = '#2a9d8f';
    }
  } catch (e) {
    const statusPulizio = document.getElementById('dash-pulizie-status');
    if (statusPulizio) statusPulizio.textContent = 'In corso';
  }

  try {
    const anomalieSnap = await getDocs(query(collection(db, "anomalie")));
    const aperte = anomalieSnap.docs.map(d => d.data()).filter(a => a.stato === 'Aperta');
    const statusAno = document.getElementById('dash-anomalie-status');
    if (statusAno) {
      statusAno.textContent = aperte.length === 0 ? 'Nessuna' : `${aperte.length} aperte`;
      statusAno.style.color = aperte.length === 0 ? '#2a9d8f' : '#e63946';
    }
  } catch (e) {
    const statusAno = document.getElementById('dash-anomalie-status');
    if (statusAno) statusAno.textContent = '0 aperte';
  }
}

function renderAltroMenu() {
  renderLayout(`
    <section class="card">
      <h2>Funzioni Aggiuntive</h2>
      <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
        <button id="btn-sub-prodotti" style="padding:14px; background:#2a2420; color:#fff; border:1px solid #3d352e; border-radius:6px; font-size:15px; text-align:left; cursor:pointer;">
          📦 Anagrafica Prodotti e Allergeni
        </button>
        <button id="btn-sub-ricezioni" style="padding:14px; background:#2a2420; color:#fff; border:1px solid #3d352e; border-radius:6px; font-size:15px; text-align:left; cursor:pointer;">
          🚚 Ricevimento Merci e Forniture
        </button>
        <button id="btn-sub-anomalie" style="padding:14px; background:#2a2420; color:#fff; border:1px solid #3d352e; border-radius:6px; font-size:15px; text-align:left; cursor:pointer;">
          ⚠️ Registro Anomalie Aperte
        </button>
      </div>
    </section>
  `);

  document.getElementById('btn-sub-prodotti').addEventListener('click', () => {
    renderLayout('<div id="tab-content"></div>');
    renderProdottiPage();
  });
  document.getElementById('btn-sub-ricezioni').addEventListener('click', () => {
    renderLayout('<div id="tab-content"></div>');
    renderRicezioniPage();
  });
  document.getElementById('btn-sub-anomalie').addEventListener('click', () => {
    switchTab('anomalie');
  });
}

function switchTab(tab) {
  currentTab = tab;
  
  if (tab === 'oggi') {
    renderOggi();
  } else if (tab === 'temperature') {
    renderLayout('<div id="tab-content"></div>');
    renderTemperaturePage(() => switchTab('oggi'));
  } else if (tab === 'registro') {
    renderLayout('<div id="tab-content"></div>');
    renderRegistroPage(() => switchTab('oggi'));
  } else if (tab === 'pulizie') {
    renderLayout('<div id="tab-content"></div>');
    renderPuliziePage(() => switchTab('oggi'));
  } else if (tab === 'anomalie') {
    renderLayout('<div id="tab-content"></div>');
    renderAnomaliePage();
  } else if (tab === 'altro') {
    renderAltroMenu();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => switchTab('oggi'));
} else {
  switchTab('oggi');
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
