import { initTemperature } from './temperature.js';
import { initRegistro } from './registro.js';

function startApp() {
  initTemperature();
  initRegistro();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
