import { initTemperature } from './temperature.js';
import { initRegistro } from './registro.js';
import { getTemperature, getRegistro } from './store.js';

function formatData(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function caricaDati() {
  const listTemp = document.getElementById('lista-temperature');
  const listReg = document.getElementById('lista-registro');

  if (listTemp) {
    try {
      const temps = await getTemperature();
      temps.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      listTemp.innerHTML = temps.length === 0 
        ? '<p class="empty-text">Nessuna temperatura registrata.</p>'
        : temps.map(t => `
            <div class="log-item">
              <span class="log-date">${formatData(t.timestamp)}</span>
              <div class="log-content"><b>${t.valore}°C</b> - ${t.note || 'Nessuna nota'}</div>
            </div>
          `).join('');
    } catch (e) {
      listTemp.innerHTML = `<p class="error-text">Errore caricamento dati</p>`;
    }
  }

  if (listReg) {
    try {
      const regs = await getRegistro();
      regs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      listReg.innerHTML = regs.length === 0 
        ? '<p class="empty-text">Nessuna nota registrata.</p>'
        : regs.map(r => `
            <div class="log-item">
              <span class="log-date">${formatData(r.timestamp)}</span>
              <div class="log-content"><b>${r.tipo}</b>: ${r.note || ''}</div>
            </div>
          `).join('');
    } catch (e) {
      listReg.innerHTML = `<p class="error-text">Errore caricamento dati</p>`;
    }
  }
}

function renderApp() {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <main class="app-container">
      <header class="app-header">
        <h1>La Cava · Registro HACCP</h1>
      </header>
      
      <section class="card">
        <h2>Registrazione Temperature</h2>
        <form id="temp-form" class="form-group">
          <input type="number" step="0.1" name="valore" placeholder="Temperatura (°C)" required>
          <input type="text" name="note" placeholder="Note / Reparto">
          <button type="submit" class="btn">Salva Temperatura</button>
        </form>
        <div class="history-section">
          <h3>Ultime Rilevazioni</h3>
          <div id="lista-temperature">Caricamento...</div>
        </div>
      </section>

      <section class="card">
        <h2>Registro Sanificazioni / Note</h2>
        <form id="registro-form" class="form-group">
          <input type="text" name="tipo" placeholder="Tipo intervento / Sanificazione" required>
          <textarea name="note" placeholder="Dettagli..."></textarea>
          <button type="submit" class="btn">Salva Registro</button>
        </form>
        <div class="history-section">
          <h3>Ultime Note</h3>
          <div id="lista-registro">Caricamento...</div>
        </div>
      </section>
    </main>
  `;

  initTemperature(caricaDati);
  initRegistro(caricaDati);
  caricaDati();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed: ', err));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
