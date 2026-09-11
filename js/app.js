import { renderDashboardPage } from './dashboard.js';
import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAnomaliePage } from './anomalie.js';
import { renderRicezioniPage } from './ricevimento.js';
import { renderEtichettePage } from './etichette.js';
import { renderStoricoPage } from './storico.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');

  const routes = {
    oggi: renderDashboardPage,
    temperature: renderTemperaturePage,
    registro: renderRegistroPage,
    pulizie: renderPuliziePage,
    anomalie: renderAnomaliePage,
    ricevimento: renderRicezioniPage,
    etichette: renderEtichettePage,
    storico: renderStoricoPage
  };

  function renderLayout() {
    if (!container) return;
    container.innerHTML = `
      <div class="app-container">
        <header class="app-header">
          <div class="logo-area" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <h1 style="font-size: 20px; font-weight: 600; margin: 0;">La Cava · HACCP</h1>
            <div id="status-alert-badge" style="background-color: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">!</div>
          </div>
        </header>

        <main class="app-content" id="content-area"></main>

        <nav class="bottom-nav">
          <button class="nav-item active" data-tab="oggi">
            <span class="nav-icon">📊</span>
            <span class="nav-label">Oggi</span>
          </button>
          <button class="nav-item" data-tab="temperature">
            <span class="nav-icon">🌡️</span>
            <span class="nav-label">Temperature</span>
          </button>
          <button class="nav-item" data-tab="registro">
            <span class="nav-icon">📋</span>
            <span class="nav-label">Registro</span>
          </button>
          <button class="nav-item" data-tab="pulizie">
            <span class="nav-icon">🧹</span>
            <span class="nav-label">Pulizie</span>
          </button>
        </nav>
      </div>
    `;

    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        loadTab(tab);
      });
    });

    loadTab('oggi');
  }

  function loadTab(tabName) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    contentArea.innerHTML = '';

    document.querySelectorAll('.nav-item').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (routes[tabName]) {
      routes[tabName](contentArea);
    }
  }

  renderLayout();
});
