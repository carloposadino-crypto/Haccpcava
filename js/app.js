import { renderDashboardPage } from './dashboard.js';
import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAbbattimentoPage } from './abbattimento.js';
import { renderEtichettePage } from './etichette.js';
import { renderRicezioniPage } from './ricevimento.js';
import { renderStoricoPage } from './storico.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');

  const routes = {
    oggi: renderDashboardPage,
    temperature: renderTemperaturePage,
    abbattimento: renderAbbattimentoPage,
    etichette: renderEtichettePage,
    ricevimento: renderRicezioniPage,
    pulizie: renderPuliziePage,
    storico: renderStoricoPage
  };

  function renderLayout() {
    if (!container) return;
    container.innerHTML = `
      <div class="app-container">
        <header class="app-header">
          <div class="logo-area" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <h1 style="font-size: 20px; font-weight: 600; margin: 0;">La Cava · HACCP</h1>
            <div id="status-alert-badge" style="background-color: #2b5c3a; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">OK</div>
          </div>
        </header>

        <main class="app-content" id="content-area"></main>

        <nav class="bottom-nav" style="display: flex; overflow-x: auto; background: #fff; border-top: 1px solid #ccc; position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;">
          <button class="nav-item active" data-tab="oggi">📊 Oggi</button>
          <button class="nav-item" data-tab="temperature">🌡️ Temp</button>
          <button class="nav-item" data-tab="abbattimento">❄️ Abbatti</button>
          <button class="nav-item" data-tab="etichette">🏷️ Etichette</button>
          <button class="nav-item" data-tab="ricevimento">📦 Merci</button>
          <button class="nav-item" data-tab="pulizie">🧹 Pulizie</button>
          <button class="nav-item" data-tab="storico">📜 Report</button>
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
        btn.style.fontWeight = 'bold';
      } else {
        btn.classList.remove('active');
        btn.style.fontWeight = 'normal';
      }
    });

    if (routes[tabName]) {
      routes[tabName](contentArea);
    }
  }

  renderLayout();
});