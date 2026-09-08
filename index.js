let currentTab = 'oggi';

function renderLayout(contentHtml) {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="app-container">
      <header class="app-header">
        <h1>La Cava · HACCP</h1>
        <button class="btn-anomaly" onclick="alert('Apertura rapida segnalazione anomalia')" title="Segnala Anomalia">!</button>
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

function renderOggi() {
  return `
    <section class="card">
      <h2>Stato Controlli di Oggi</h2>
      
      <div class="dashboard-row" onclick="switchTab('temperature')">
        <span class="dashboard-title">Temperature Apparecchiature</span>
        <span class="dashboard-status" id="dash-temp-status">Da verificare</span>
      </div>

      <div class="dashboard-row" onclick="switchTab('registro')">
        <span class="dashboard-title">Cotture / Abbattimenti / Rigenerazioni</span>
        <span class="dashboard-status" id="dash-reg-status">0 registrate</span>
      </div>

      <div class="dashboard-row" onclick="switchTab('pulizie')">
        <span class="dashboard-title">Pulizie Giornaliere</span>
        <span class="dashboard-status" id="dash-pulizie-status">In corso</span>
      </div>

      <div class="dashboard-row" onclick="switchTab('anomalie')">
        <span class="dashboard-title">Anomalie Aperte</span>
        <span class="dashboard-status" id="dash-anomalie-status" style="color: #4ea8de;">Nessuna</span>
      </div>
    </section>
  `;
}

function switchTab(tab) {
  currentTab = tab;
  let html = '';
  
  switch(tab) {
    case 'oggi':
      html = renderOggi();
      break;
    case 'temperature':
      html = `<section class="card"><h2>Controlli → Temperature</h2><p style="color:#aaa;">Modulo 6 apparecchiature in arrivo...</p></section>`;
      break;
    case 'registro':
      html = `<section class="card"><h2>Controlli → Registro Processi</h2><p style="color:#aaa;">Modulo CBT / Abbattimento / Rigenerazione in arrivo...</p></section>`;
      break;
    case 'pulizie':
      html = `<section class="card"><h2>Pulizie</h2><p style="color:#aaa;">Checklist giornaliera / settimanale in arrivo...</p></section>`;
      break;
    case 'altro':
      html = `<section class="card"><h2>Altro</h2><p style="color:#aaa;">Prodotti, Ricevimento merci, Schede e Storico in arrivo...</p></section>`;
      break;
    default:
      html = renderOggi();
  }

  renderLayout(html);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => switchTab('oggi'));
} else {
  switchTab('oggi');
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
