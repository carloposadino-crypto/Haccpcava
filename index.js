import { renderTemperaturePage } from './temperature.js';
import { getTemperature } from './store.js';

let currentTab = 'oggi';

function renderLayout(contentHtml) {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="app-container">
      <header class="app-header">
        <h1>La Cava · HACCP</h1>
        <button class="btn-anomaly" onclick="alert('Segnalazione anomalia')" title="Segnala Anomalia">!</button>
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
        <span class="dashboard-status">0 registrate</span>
      </div>

      <div class="dashboard-row" onclick="switchTab('pulizie')">
        <span class="dashboard-title">Pulizie Giornaliere</span>
        <span class="dashboard-status">In corso</span>
      </div>

      <div class="dashboard-row" onclick="switchTab('anomalie')">
        <span class="dashboard-title">Anomalie Aperte</span>
        <span class="dashboard-status" style="color: #2a9d8f;">Nessuna</span>
      </div>
    </section>
  `;
  renderLayout(html);

  // Aggiorna stato temperature in dashboard
  try {
    const temps = await getTemperature();
    const oggi = new Date().toISOString().split('T')[0];
    const rilevazioniOggi = temps.filter(t => t.timestamp && t.timestamp.startsWith(oggi));
    const statusEl = document.getElementById('dash-temp-status');
    if (statusEl) {
      statusEl.textContent = `${rilevazioniOggi.length}/6 verificate`;
      if (rilevazioniOggi.length === 6) statusEl.style.color = '#2a9d8f';
    }
  } catch (e) {
    const statusEl = document.getElementById('dash-temp-status');
    if (statusEl) statusEl.textContent = 'Da verificare';
  }
}

function switchTab(tab) {
  currentTab = tab;
  
  if (tab === 'oggi') {
    renderOggi();
  } else if (tab === 'temperature') {
    renderLayout('<div id="tab-content"></div>');
    renderTemperaturePage(() => switchTab('oggi'));
  } else if (tab === 'registro') {
    renderLayout(`<section class="card"><h2>Controlli → Registro Processi</h2><p style="color:#aaa;">Modulo CBT / Abbattimento / Rigenerazione in arrivo...</p></section>`);
  } else if (tab === 'pulizie') {
    renderLayout(`<section class="card"><h2>Pulizie</h2><p style="color:#aaa;">Checklist giornaliera / settimanale in arrivo...</p></section>`);
  } else if (tab === 'altro') {
    renderLayout(`<section class="card"><h2>Altro</h2><p style="color:#aaa;">Prodotti, Ricevimento merci, Schede e Storico in arrivo...</p></section>`);
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
