import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAnomaliePage } from './anomalie.js';
import { renderProdottiPage } from './prodotti.js';
import { renderRicezioniPage } from './ricevimento.js';
import { renderStoricoPage } from './storico.js';

let currentTab = 'oggi';

function executeRender(renderFn, container) {
  if (typeof renderFn !== 'function') return;
  const result = renderFn(container);
  // Se la funzione restituisce una stringa HTML invece di modificare il container, la inseriamo noi
  if (typeof result === 'string') {
    container.innerHTML = result;
  }
}

function renderLayout() {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="layout">
      <header class="header">
        <h1>La Cava dei Vini - HACCP</h1>
        <p class="subtitle">Registro Digitale Autocontrollo</p>
      </header>
      
      <nav class="nav-bar">
        <button class="nav-btn ${currentTab === 'oggi' ? 'active' : ''}" onclick="window.switchTab('oggi')">Oggi</button>
        <button class="nav-btn ${currentTab === 'temperature' ? 'active' : ''}" onclick="window.switchTab('temperature')">Temperature</button>
        <button class="nav-btn ${currentTab === 'registro' ? 'active' : ''}" onclick="window.switchTab('registro')">Registro</button>
        <button class="nav-btn ${currentTab === 'pulizie' ? 'active' : ''}" onclick="window.switchTab('pulizie')">Pulizie</button>
        <button class="nav-btn ${currentTab === 'anomalie' ? 'active' : ''}" onclick="window.switchTab('anomalie')">Anomalie</button>
        <button class="nav-btn ${currentTab === 'prodotti' ? 'active' : ''}" onclick="window.switchTab('prodotti')">Prodotti</button>
        <button class="nav-btn ${currentTab === 'ricevimento' ? 'active' : ''}" onclick="window.switchTab('ricevimento')">Ricevimento</button>
        <button class="nav-btn ${currentTab === 'storico' ? 'active' : ''}" onclick="window.switchTab('storico')">Storico</button>
      </nav>

      <main class="main-content" id="main-container">
      </main>
    </div>
  `;

  const container = document.getElementById('main-container');
  if (!container) return;

  switch (currentTab) {
    case 'oggi':
      container.innerHTML = renderOggiPage();
      break;
    case 'temperature':
      executeRender(renderTemperaturePage, container);
      break;
    case 'registro':
      executeRender(renderRegistroPage, container);
      break;
    case 'pulizie':
      executeRender(renderPuliziePage, container);
      break;
    case 'anomalie':
      executeRender(renderAnomaliePage, container);
      break;
    case 'prodotti':
      executeRender(renderProdottiPage, container);
      break;
    case 'ricevimento':
      executeRender(renderRicezioniPage, container);
      break;
    case 'storico':
      executeRender(renderStoricoPage, container);
      break;
    default:
      container.innerHTML = renderOggiPage();
  }
}

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

export function switchTab(tabName) {
  currentTab = tabName;
  renderLayout();
}

window.switchTab = switchTab;

document.addEventListener('DOMContentLoaded', () => {
  switchTab('oggi');
});
