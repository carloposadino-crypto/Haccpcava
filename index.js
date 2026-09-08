import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAnomaliePage, apriModalAnomalia } from './anomalie.js';
import { renderProdottiPage } from './prodotti.js';
import { renderRicezioniPage } from './ricevimento.js';
import { renderStoricoPage } from './storico.js';
import { getTemperature, getRegistro } from './store.js';
import { db } from './firebase.js';
import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentTab = 'oggi';

function renderLayout(contentHtml) {
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

      <main class="main-content">
        ${contentHtml}
      </main>
    </div>
  `;
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
  let html = '';

  switch (tabName) {
    case 'oggi':
      html = renderOggiPage();
      break;
    case 'temperature':
      html = renderTemperaturePage();
      break;
    case 'registro':
      html = renderRegistroPage();
      break;
    case 'pulizie':
      html = renderPuliziePage();
      break;
    case 'anomalie':
      html = renderAnomaliePage();
      break;
    case 'prodotti':
      html = renderProdottiPage();
      break;
    case 'ricevimento':
      html = renderRicezioniPage();
      break;
    case 'storico':
      html = renderStoricoPage();
      break;
    default:
      html = renderOggiPage();
  }

  renderLayout(html);
}

// ESPOSIZIONE GLOBALE PER RISOLVERE L'ERRORE DI SWITCHTAB
window.switchTab = switchTab;

// Inizializzazione dell'applicazione
document.addEventListener('DOMContentLoaded', () => {
  switchTab('oggi');
});
