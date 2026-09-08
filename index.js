import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAnomaliePage, apriModalAnomalia } from './anomalie.js';
import { renderProdottiPage } from './prodotti.js';
import { renderRicezioniPage } from './ricevimento.js';
import { renderStoricoPage } from './storico.js';
import { getTemperature, getRegistro } from './store.js';

let currentTab = 'oggi';

function renderLayout() {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="app-container">
      <header class="app-header">
        <div class="logo-area">
          <h1>La Cava dei Vini</h1>
          <span class="badge">HACCP</span>
        </div>
      </header>

      <main class="app-content" id="content-area">
      </main>

      <nav class="bottom-nav">
        <button class="nav-item ${currentTab === 'oggi' ? 'active' : ''}" onclick="window.switchTab('oggi')">
          <span class="nav-icon">📅</span>
          <span class="nav-label">Oggi</span>
        </button>
        <button class="nav-item ${currentTab === 'temperature' ? 'active' : ''}" onclick="window.switchTab('temperature')">
          <span class="nav-icon">🌡️</span>
          <span class="nav-label">Temperature</span>
        </button>
        <button class="nav-item ${currentTab === 'registro' ? 'active' : ''}" onclick="window.switchTab('registro')">
          <span class="nav-icon">📋</span>
          <span class="nav-label">Registro</span>
        </button>
        <button class="nav-item ${currentTab === 'pulizie' ? 'active' : ''}" onclick="window.switchTab('pulizie')">
          <span class="nav-icon">🧹</span>
          <span class="nav-label">Pulizie</span>
        </button>
        <button class="nav-item ${currentTab === 'anomalie' ? 'active' : ''}" onclick="window.switchTab('anomalie')">
          <span class="nav-icon">⚠️</span>
          <span class="nav-label">Anomalie</span>
        </button>
        <button class="nav-item ${currentTab === 'prodotti' ? 'active' : ''}" onclick="window.switchTab('prodotti')">
          <span class="nav-icon">📦</span>
          <span class="nav-label">Prodotti</span>
        </button>
        <button class="nav-item ${currentTab === 'ricevimento' ? 'active' : ''}" onclick="window.switchTab('ricevimento')">
          <span class="nav-icon">🚚</span>
          <span class="nav-label">Ricevimento</span>
        </button>
        <button class="nav-item ${currentTab === 'storico' ? 'active' : ''}" onclick="window.switchTab('storico')">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Storico</span>
        </button>
      </nav>
    </div>
  `;

  renderPageContent();
}

function renderPageContent() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;

  contentArea.innerHTML = '';

  switch (currentTab) {
    case 'oggi':
      renderOggiPage(contentArea);
      break;
    case 'temperature':
      renderTemperaturePage(contentArea);
      break;
    case 'registro':
      renderRegistroPage(contentArea);
      break;
    case 'pulizie':
      renderPuliziePage(contentArea);
      break;
    case 'anomalie':
      renderAnomaliePage(contentArea);
      break;
    case 'prodotti':
      renderProdottiPage(contentArea);
      break;
    case 'ricevimento':
      renderRicezioniPage(contentArea);
      break;
    case 'storico':
      renderStoricoPage(contentArea);
      break;
    default:
      renderOggiPage(contentArea);
  }
}

function renderOggiPage(container) {
  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  container.innerHTML = `
    <div class="page-header">
      <h2>Oggi</h2>
      <p class="date-subtitle">${today}</p>
    </div>
    <div class="dashboard-cards">
      <div class="card" onclick="window.switchTab('temperature')">
        <div class="card-icon">🌡️</div>
        <div class="card-info">
          <h3>Temperature</h3>
          <p>Registra frigo e freezer</p>
        </div>
      </div>
      <div class="card" onclick="window.switchTab('registro')">
        <div class="card-icon">📋</div>
        <div class="card-info">
          <h3>Registro Processi</h3>
          <p>Cotture e abbattimenti</p>
        </div>
      </div>
      <div class="card" onclick="window.switchTab('pulizie')">
        <div class="card-icon">🧹</div>
        <div class="card-info">
          <h3>Pulizie</h3>
          <p>Sanificazione giornaliera</p>
        </div>
      </div>
      <div class="card" onclick="window.switchTab('anomalie')">
        <div class="card-icon">⚠️</div>
        <div class="card-info">
          <h3>Anomalie</h3>
          <p>Gestione non conformità</p>
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
  renderLayout();
});
