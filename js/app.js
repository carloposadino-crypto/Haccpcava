// Cabina di comando unica dell'app. Gestisce login, la barra di
// navigazione in basso, il pulsante di segnalazione anomalia sempre
// visibile in alto, e lo smistamento verso ogni sezione.

import { getSession, onAuthStateChange, signOut, getProfilo } from './auth.js';
import { renderLogin } from './login.js';
import { apriModaleAnomalia } from './anomalia-modal.js';
import { onSyncStatusChange } from './sync-status.js';

import { renderOggi } from './oggi.js';
import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAltro } from './altro.js';
import { renderAnomaliePage } from './anomalie.js';
import { renderProdottiPage } from './prodotti.js';
import { renderRicezioniPage } from './ricevimento.js';
import { renderRicettePage } from './ricette.js';
import { renderListinoPage } from './listino.js';
import { renderEtichettePage } from './etichette.js';
import { renderStoricoPage } from './storico.js';

const NAV_PRINCIPALE = [
  ['oggi', '📅', 'Oggi'],
  ['temperature', '🌡️', 'Temp.'],
  ['registro', '🍳', 'Cotture'],
  ['pulizie', '🧹', 'Pulizie'],
  ['altro', '☰', 'Altro'],
];

const root = document.getElementById('app');
let profiloCorrente = null;
let tabCorrente = 'oggi';

async function avvia() {
  root.innerHTML = `<div class="empty-state">Verifica sessione…</div>`;
  const user = await getSession();
  if (!user) { mostraLogin(); return; }

  try {
    profiloCorrente = await getProfilo(user.uid);
  } catch (err) {
    console.error(err);
    root.innerHTML = `<div class="empty-state">Accesso riuscito, ma non esiste ancora un profilo per questo utente.<br>Va creato a mano nella collezione <code>profili</code> su Firebase (documento con id = ${user.uid}).</div>`;
    return;
  }

  mostraApp();
}

function mostraLogin() {
  root.innerHTML = '';
  renderLogin(root, () => avvia());
}

function mostraApp() {
  root.innerHTML = `
    <header class="app-header">
      <div class="app-header-row">
        <h1 style="font-size:18px; margin:0;">🍷 La Cava · HACCP</h1>
        <button class="btn-anomaly" id="btn-anomalia" title="Segnala anomalia">!</button>
      </div>
    </header>
    <main id="content-area" style="padding: 12px 12px 90px;"></main>
    <nav class="bottom-nav">
      ${NAV_PRINCIPALE.map(([id, icon, label]) => `
        <button class="nav-btn ${id === tabCorrente ? 'active' : ''}" data-tab="${id}">
          <span class="nav-icon">${icon}</span>${label}
        </button>
      `).join('')}
    </nav>
  `;

  root.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => vaiA(btn.dataset.tab));
  });
  root.querySelector('#btn-anomalia').addEventListener('click', () => {
    apriModaleAnomalia(profiloCorrente, () => {
      if (tabCorrente === 'oggi' || tabCorrente === 'anomalie') vaiA(tabCorrente);
    });
  });

  onSyncStatusChange((stato) => {
    const badge = root.querySelector('#btn-anomalia');
    if (!badge) return;
    badge.style.opacity = stato === 'in_sospeso' ? '0.5' : '1';
    badge.title = stato === 'in_sospeso' ? 'Offline: verrà sincronizzato appena torna la rete' : 'Segnala anomalia';
  });

  renderContenuto();
}

function vaiA(tab) {
  tabCorrente = tab;
  mostraApp();
}

function renderContenuto() {
  const container = root.querySelector('#content-area');
  if (!container) return;

  const naviga = (v) => vaiA(v);
  const esci = async () => { await signOut(); avvia(); };

  switch (tabCorrente) {
    case 'oggi': renderOggi(container, profiloCorrente, naviga); break;
    case 'temperature': renderTemperaturePage(container, profiloCorrente); break;
    case 'registro': renderRegistroPage(container, profiloCorrente); break;
    case 'pulizie': renderPuliziePage(container, profiloCorrente); break;
    case 'altro': renderAltro(container, naviga, esci); break;
    case 'anomalie': renderAnomaliePage(container, profiloCorrente); break;
    case 'prodotti': renderProdottiPage(container); break;
    case 'ricevimento': renderRicezioniPage(container, profiloCorrente); break;
    case 'schede': renderRicettePage(container, profiloCorrente); break;
    case 'listino': renderListinoPage(container); break;
    case 'etichette': renderEtichettePage(container); break;
    case 'storico': renderStoricoPage(container); break;
    default: renderOggi(container, profiloCorrente, naviga);
  }
}

onAuthStateChange((user) => {
  if (!user) mostraLogin();
});

document.addEventListener('DOMContentLoaded', avvia);
