import { renderDashboardPage } from './dashboard.js';
import { renderTemperaturePage } from './temperature.js';
import { renderRegistroPage } from './registro.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAnomaliePage } from './anomalie.js';
import { renderRicezioniPage } from './ricevimento.js';
import { renderEtichettePage } from './etichette.js';
import { renderStoricoPage } from './storico.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app-container');
  const navButtons = document.querySelectorAll('.bottom-nav .nav-btn');

  // Mappa delle funzioni per ogni sezione
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

  function loadTab(tabName) {
    if (!container) return;

    // Svuota il contenitore principale
    container.innerHTML = '';

    // Aggiorna lo stato visivo dei pulsanti di navigazione
    navButtons.forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Carica ed esegue il modulo richiesto
    const renderFunction = routes[tabName];
    if (renderFunction) {
      renderFunction(container);
    } else {
      container.innerHTML = '<p style="padding: 20px; text-align: center;">Modulo in fase di caricamento...</p>';
    }
  }

  // Aggiunge l'evento click a ciascun pulsante della barra inferiore
  navButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const tab = e.currentTarget.dataset.tab;
      if (tab) {
        loadTab(tab);
      }
    });
  });

  // Caricamento iniziale sulla scheda "Oggi"
  loadTab('oggi');
});
