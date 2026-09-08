export function renderTemperaturePage(container) {
  const today = new Date().toLocaleDateString('it-IT');
  
  const html = `
    <div class="page-header">
      <h2>Temperature Frigo & Freezer</h2>
      <p class="date-subtitle">Data: ${today}</p>
    </div>

    <form id="temp-form" style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Frigo Cava 1 (+2°C / +4°C)</label>
        <input type="number" step="0.1" placeholder="Es. 3.5" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Frigo Cava 2 (+2°C / +4°C)</label>
        <input type="number" step="0.1" placeholder="Es. 3.0" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold;">Freezer (-18°C / -22°C)</label>
        <input type="number" step="0.1" placeholder="Es. -20.0" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc;">
      </div>

      <button type="button" onclick="alert('Temperatura registrata!')" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;">
        Salva Temperature
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;
  }
  return html;
}
