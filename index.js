import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAnomaliePage } from './anomalie.js';
import { renderProdottiPage } from './prodotti.js';
import { renderRicezioniPage } from './ricevimento.js';
import { renderStoricoPage } from './storico.js';

let currentTab = 'oggi';

function renderOggiPage() {
  return `
    <div class="dashboard">
      <h2>Panoramica Giornaliera</h2>
      <p>Benvenuto nel sistema di gestione HACCP de La Cava dei Vini.</p>
      <div class="cards-grid">
        <div class="card" onclick="window.switchTab('temperature')">
          <h3>Temperature</h3>
          <p>Registra le temperature dei frigo e freezer.</p>
        </div>
        <div class="card" onclick="window.switchTab('registro')">
          <h3>Registro</h3>
          <p>Compila il registro giornaliero delle attività.</p>
        </div>
        <div class="card" onclick="window.switchTab('pulizie')">
          <h3>Pulizie</h3>
          <p>Spunta le schede di sanificazione completate.</p>
        </div>
        <div class="card" onclick="window.switchTab('anomalie')">
          <h3>Anomalie</h3>
          <p>Segnala e gestisci eventuali non conformità.</p>
        </div>
      </div>
    </div>
  `;
}

function renderContent() {
  const container = document.getElementById('main-content') || document.getElementById('root');
  if (!container) return;

  // Aggiorna classe active nei pulsanti nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick')?.includes(`'${currentTab}'`)) {
      btn.classList.add('active');
    }
  });

  // Gestione dinamica dei moduli
  switch (currentTab) {
    case 'oggi':
      container.innerHTML = renderOggiPage();
      break;
    case 'temperature':
      if (typeof renderTemperaturePage === 'function') {
        const res = renderTemperaturePage(container);
        if (typeof res === 'string') container.innerHTML = res;
      }
      break;
    case 'registro':
      if (typeof renderRegistroPage === 'function') {
        const res = renderRegistroPage(container);
        if (typeof res === 'string') container.innerHTML = res;
      }
      break;
    case 'pulizie':
      if (typeof renderPuliziePage === 'function') {
        const res = renderPuliziePage(container);
        if (typeof res === 'string') container.innerHTML = res;
      }
      break;
    case 'anomalie':
      if (typeof renderAnomaliePage === 'function') {
        const res = renderAnomaliePage(container);
        if (typeof res === 'string') container.innerHTML = res;
      }
      break;
    case 'prodotti':
      if (typeof renderProdottiPage === 'function') {
        const res = renderProdottiPage(container);
        if (typeof res === 'string') container.innerHTML = res;
      }
      break;
    case 'ricevimento':
      if (typeof renderRicezioniPage === 'function') {
        const res = renderRicezioniPage(container);
        if (typeof res === 'string') container.innerHTML = res;
      }
      break;
    case 'storico':
      if (typeof renderStoricoPage === 'function') {
        const res = renderStoricoPage(container);
        if (typeof res === 'string') container.innerHTML = res;
      }
      break;
    default:
      container.innerHTML = renderOggiPage();
  }
}

export function switchTab(tabName) {
  currentTab = tabName;
  renderContent();
}

// Esporta globalmente per gli attributi onclick
window.switchTab = switchTab;

document.addEventListener('DOMContentLoaded', () => {
  renderContent();
});
