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
        ? '<p style="color:#aaa; font-size:14px;">Nessuna temperatura registrata.</p>'
        : temps.map(t => `
            <div style="border-bottom:1px solid #444; padding:8px 0; font-size:14px;">
              <span style="color:#D4A373; font-size:12px; display:block;">${formatData(t.timestamp)}</span>
              <b>${t.valore}°C</b> - ${t.note || 'Nessuna nota'}
            </div>
          `).join('');
    } catch (e) {
      listTemp.innerHTML = `<p style="color:#ff6b6b; font-size:13px;">Errore caricamento dati</p>`;
    }
  }

  if (listReg) {
    try {
      const regs = await getRegistro();
      regs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      listReg.innerHTML = regs.length === 0 
        ? '<p style="color:#aaa; font-size:14px;">Nessuna nota registrata.</p>'
        : regs.map(r => `
            <div style="border-bottom:1px solid #444; padding:8px 0; font-size:14px;">
              <span style="color:#D4A373; font-size:12px; display:block;">${formatData(r.timestamp)}</span>
              <b>${r.tipo}</b>: ${r.note || ''}
            </div>
          `).join('');
    } catch (e) {
      listReg.innerHTML = `<p style="color:#ff6b6b; font-size:13px;">Errore caricamento dati</p>`;
    }
  }
}

function renderApp() {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <main style="padding: 20px; font-family: 'Manrope', sans-serif; color: #fff; max-width: 600px; margin: 0 auto;">
      <h1 style="font-size: 24px; margin-bottom: 20px;">La Cava · Registro HACCP</h1>
      
      <section style="margin-bottom: 25px; background: #2A2420; padding: 15px; border-radius: 8px;">
        <h2 style="font-size: 18px; margin-bottom: 10px;">Registrazione Temperature</h2>
        <form id="temp-form" style="display: flex; flex-direction: column; gap: 10px;">
          <input type="number" step="0.1" name="valore" placeholder="Temperatura (°C)" required style="padding: 10px; border-radius: 4px; border: none;">
          <input type="text" name="note" placeholder="Note / Reparto" style="padding: 10px; border-radius: 4px; border: none;">
          <button type="submit" style="padding: 10px; background: #D4A373; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Salva Temperatura</button>
        </form>
        <div style="margin-top: 15px;">
          <h3 style="font-size: 14px; color: #D4A373; margin-bottom: 8px;">Ultime Rilevazioni</h3>
          <div id="lista-temperature">Caricamento...</div>
        </div>
      </section>

      <section style="background: #2A2420; padding: 15px; border-radius: 8px;">
        <h2 style="font-size: 18px; margin-bottom: 10px;">Registro Sanificazioni / Note</h2>
        <form id="registro-form" style="display: flex; flex-direction: column; gap: 10px;">
          <input type="text" name="tipo" placeholder="Tipo intervento / Sanificazione" required style="padding: 10px; border-radius: 4px; border: none;">
          <textarea name="note" placeholder="Dettagli..." style="padding: 10px; border-radius: 4px; border: none;"></textarea>
          <button type="submit" style="padding: 10px; background: #D4A373; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Salva Registro</button>
        </form>
        <div style="margin-top: 15px;">
          <h3 style="font-size: 14px; color: #D4A373; margin-bottom: 8px;">Ultime Note</h3>
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
