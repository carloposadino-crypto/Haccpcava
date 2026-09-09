import { db, collection, getDocs, query, where } from './firebase.js';
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
        <div class="logo-area" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <h1 style="font-size: 20px; font-weight: 600; margin: 0;">La Cava · HACCP</h1>
          <div id="status-alert-badge" style="background-color: #ef4444; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px;">!</div>
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
    if (typeof res === 'string') {
      container.innerHTML = res;
    } else if (res && typeof res.then === 'function') {
      res.then(asyncRes => {
        if (typeof asyncRes === 'string') container.innerHTML = asyncRes;
      });
    }
  } catch (e) {
    console.error("Errore di rendering:", e);
  }
}

function renderPageContent() {
  const container = document.getElementById('content-area');
  if (!container) return;

  container.innerHTML = '';

  switch (currentTab) {
    case 'oggi':
      container.innerHTML = renderOggiPage();
      loadTodayDashboardData();
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
      loadTodayDashboardData();
  }
}

function renderOggiPage() {
  return `
    <div style="background-color: #1e1b18; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); margin-top: 10px;">
      <h2 style="color: #d97706; font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Stato Controlli di Oggi</h2>
      
      <div style="display: flex; flex-direction: column;">
        
        <div onclick="window.switchTab('temperature')" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #2d2825; cursor: pointer;">
          <span style="color: #e5e7eb; font-size: 15px; font-weight: 500;">Temperature Apparecchiature</span>
          <span id="dash-temp-status" style="color: #9ca3af; font-size: 14px;">Caricamento...</span>
        </div>

        <div onclick="window.switchTab('registro')" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #2d2825; cursor: pointer;">
          <span style="color: #e5e7eb; font-size: 15px; font-weight: 500;">Cotture / Abbattimenti / Rigenerazioni</span>
          <span id="dash-reg-status" style="color: #9ca3af; font-size: 14px;">0 registrate</span>
        </div>

        <div onclick="window.switchTab('pulizie')" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #2d2825; cursor: pointer;">
          <span style="color: #e5e7eb; font-size: 15px; font-weight: 500;">Pulizie Giornaliere</span>
          <span id="dash-clean-status" style="color: #9ca3af; font-size: 14px;">In corso</span>
        </div>

        <div onclick="window.switchTab('anomalie')" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; cursor: pointer;">
          <span style="color: #e5e7eb; font-size: 15px; font-weight: 500;">Anomalie Aperte</span>
          <span id="dash-anom-status" style="color: #9ca3af; font-size: 14px;">0 aperte</span>
        </div>

      </div>
    </div>
  `;
}

async function loadTodayDashboardData() {
  const tempStatusElem = document.getElementById('dash-temp-status');
  const alertBadge = document.getElementById('status-alert-badge');
  if (!tempStatusElem) return;

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "temperature"), where("data", "==", todayStr));
    const querySnapshot = await getDocs(q);

    let totalChecked = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.count) {
        totalChecked = Math.max(totalChecked, data.count);
      } else if (data.letture) {
        totalChecked = Math.max(totalChecked, Object.keys(data.letture).length);
      }
    });

    if (totalChecked >= 6) {
      tempStatusElem.innerText = '6/6 verificate';
      tempStatusElem.style.color = '#10b981';
      if (alertBadge) alertBadge.style.backgroundColor = '#10b981';
    } else {
      tempStatusElem.innerText = `${totalChecked}/6 verificate`;
      tempStatusElem.style.color = totalChecked > 0 ? '#f59e0b' : '#9ca3af';
    }
  } catch (err) {
    console.error("Errore caricamento stato dashboard:", err);
    tempStatusElem.innerText = '0/6 verificate';
  }
}

export function switchTab(tabName) {
  currentTab = tabName;
  renderLayout();
}

window.switchTab = switchTab;

document.addEventListener('DOMContentLoaded', () => {
  renderLayout();
});
