// Verification debug output
document.getElementById('root').innerHTML = '<div style="color:green; padding:20px; font-family:sans-serif; font-size:18px; font-weight:bold;">Caricamento modulo index.js in corso...</div>';

import { initTemperature } from './temperature.js';
import { initRegistro } from './registro.js';

document.addEventListener('DOMContentLoaded', () => {
  initTemperature();
  initRegistro();
});
