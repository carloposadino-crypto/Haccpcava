import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAnomaliePage } from './anomalie.js';
import { renderProdottiPage } from './prodotti.js';
import { renderRicezioniPage } from './ricevimento.js';
import { renderStoricoPage } from './storico.js';

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

function executeModuleRender(renderFn, container) {
  if (typeof renderFn !== 'function') return;
  try {
    const res = renderFn(container);
    
    // Se la funzione restituisce una stringa HTML
    if (typeof res === 'string') {
      container.innerHTML = res;
    } 
    // Se la funzione è asincrona (Promise)
    else if (res && typeof res.then === 'function') {
      res.then(asyncRes => {
        if (typeof asyncRes === 'string') {
          container.innerHTML = asyncRes;
        }
      }).catch(err => {
        console.error("Errore nel modulo:", err);
        container.innerHTML = `<div style="padding:20px; color:#ff6b6b; text-align:center;">Errore nel caricamento dei dati.</div>`;
      });
    }
  } catch (e) {
    console.error("Errore di rendering:", e);
    container.innerHTML = `<div style="padding:20px; color:#ff6b6b; text-align:center;">Errore durante l'esecuzione del modulo.</div>`;
  }
}

function renderPageContent() {
  const container = document.getElementById('content-area');
  if (!container) return;

  container.innerHTML = '';

  switch (currentTab) {
    case 'oggi':
      container.innerHTML = renderOggiPage();
      break;
    case 'temperature':
      executeModuleRender(renderTemperaturePage, container);
      break;
    case 'registro':
      executeModuleRender(renderRegistroPage, container);
      break;
    case 'pulizie':
      executeModuleRender(renderPuliziePage, container);
      break;
    case 'anomalie':
      executeModuleRender(renderAnomaliePage, container);
      break;
    case 'prodotti':
      executeModuleRender(renderProdottiPage, container);
      break;
    case 'ricevimento':
      executeModuleRender(renderRicezioniPage, container);
      break;
    case 'storico':
      executeModuleRender(renderStoricoPage, container);
      break;
    default:
      container.innerHTML = renderOggiPage();
  }
}

function renderOggiPage() {
  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `
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
