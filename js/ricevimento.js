import { renderRicezioniPage } from './ricevimento.js';
import { renderTemperaturePage } from './temperature.js';
import { renderEtichettePage } from './etichette.js';
import { renderPuliziePage } from './pulizie.js';
import { renderAbbattimentoPage } from './abbattimento.js';
import { renderRicettePage } from './ricette.js';

const container = document.getElementById('app-container');

export function navigate(page) {
  container.innerHTML = '';

  if (page === 'ricevimento') {
    renderRicezioniPage(container);
  } else if (page === 'temperature') {
    renderTemperaturePage(container);
  } else if (page === 'etichette') {
    renderEtichettePage(container);
  } else if (page === 'pulizie') {
    renderPuliziePage(container);
  } else if (page === 'abbattimento') {
    renderAbbattimentoPage(container);
  } else if (page === 'ricette') {
    renderRicettePage(container);
  } else {
    renderRicezioniPage(container);
  }

  window.scrollTo(0, 0);
}

window.navigate = navigate;

document.addEventListener('DOMContentLoaded', () => {
  navigate('ricevimento');
});