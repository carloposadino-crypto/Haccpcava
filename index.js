import { initTemperature } from './temperature.js';
import { initRegistro } from './registro.js';

function renderApp() {
  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = `
    <main style="padding: 20px; font-family: 'Manrope', sans-serif; color: #fff;">
      <h1 style="font-size: 24px; margin-bottom: 20px;">La Cava · Registro HACCP</h1>
      
      <section style="margin-bottom: 30px; background: #2A2420; padding: 15px; border-radius: 8px;">
        <h2 style="font-size: 18px; margin-bottom: 10px;">Registrazione Temperature</h2>
        <form id="temp-form" style="display: flex; flex-direction: column; gap: 10px;">
          <input type="number" step="0.1" name="valore" placeholder="Temperatura (°C)" required style="padding: 10px; border-radius: 4px; border: none;">
          <input type="text" name="note" placeholder="Note / Reparto" style="padding: 10px; border-radius: 4px; border: none;">
          <button type="submit" style="padding: 10px; background: #D4A373; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Salva Temperatura</button>
        </form>
      </section>

      <section style="background: #2A2420; padding: 15px; border-radius: 8px;">
        <h2 style="font-size: 18px; margin-bottom: 10px;">Registro Sanificazioni / Note</h2>
        <form id="registro-form" style="display: flex; flex-direction: column; gap: 10px;">
          <input type="text" name="tipo" placeholder="Tipo intervento / Sanificazione" required style="padding: 10px; border-radius: 4px; border: none;">
          <textarea name="note" placeholder="Dettagli..." style="padding: 10px; border-radius: 4px; border: none;"></textarea>
          <button type="submit" style="padding: 10px; background: #D4A373; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Salva Registro</button>
        </form>
      </section>
    </main>
  `;

  initTemperature();
  initRegistro();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
