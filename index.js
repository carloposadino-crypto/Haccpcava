import { db, collection, getDocs, query, where } from './firebase.js';
import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAnomaliePage } from './anomalie.js';
import { renderProdottiPage } from './prodotti.js';
import { renderRicezioniPage } from './ricevimento.js';
import { renderStoricoPage } from './storico.js';
import { renderRicettePage } from './ricette.js';

let currentTab = 'oggi';

function renderLayout() {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <div class="app-container">
      <header class="app-header">
        <div class="logo-area" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <h1 style="font-size: 20px; font-weight: 600; margin: 0;">La Cava HACCP</h1>
          <div id="status-alert-badge" style="background-color: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; cursor: pointer;">0</div>
        </div>
      </header>

      <main class="app-content" id="content-area">
      </main>

      <nav class="bottom-nav">
        <button class="nav-item ${currentTab === 'oggi' ? 'active' : ''}" data-tab="oggi">
          <span class="nav-icon">📋</span>
          <span class="nav-label">Oggi</span>
        </button>
        <button class="nav-item ${currentTab === 'temperature' ? 'active' : ''}" data-tab="temperature">
          <span class="nav-icon">🌡️</span>
          <span class="nav-label">Temperature</span>
        </button>
        <button class="nav-item ${currentTab === 'merci' ? 'active' : ''}" data-tab="merci">
          <span class="nav-icon">📦</span>
          <span class="nav-label">Merci</span>
        </button>
        <button class="nav-item ${currentTab === 'ricette' ? 'active' : ''}" data-tab="ricette">
          <span class="nav-icon">📖</span>
          <span class="nav-label">Ricette</span>
        </button>
        <button class="nav-item ${currentTab === 'storico' ? 'active' : ''}" data-tab="storico">
          <span class="nav-icon">📜</span>
          <span class="nav-label">Storico</span>
        </button>
      </nav>
    </div>
  `;

  bindEvents();
  loadTabContent();
}

function bindEvents() {
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      if (tab) {
        currentTab = tab;
        navButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        loadTabContent();
      }
    });
  });

  const badge = document.getElementById('status-alert-badge');
  if (badge) {
    badge.addEventListener('click', () => {
      currentTab = 'anomalie';
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      loadTabContent();
    });
  }
}

function loadTabContent() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;

  contentArea.innerHTML = '';

  switch (currentTab) {
    case 'oggi':
      renderRegistroPage(contentArea);
      break;
    case 'temperature':
      renderTemperaturePage(contentArea);
      break;
    case 'merci':
      renderProdottiPage(contentArea);
      break;
    case 'ricette':
      renderRicettePage(contentArea);
      break;
    case 'storico':
      renderStoricoPage(contentArea);
      break;
    case 'anomalie':
      renderAnomaliePage(contentArea);
      break;
    default:
      renderRegistroPage(contentArea);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderLayout();
});
