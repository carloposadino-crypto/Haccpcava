export function renderRegistroPage(container) {
  const today = new Date().toLocaleDateString('it-IT');

  const html = `
    <div class="page-header">
      <h2>Registro Processi</h2>
      <p class="date-subtitle">Cotture, Abbattimenti e Scongelamenti - ${today}</p>
    </div>

    <form id="registro-form" style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
      
      <!-- Tipo Operazione -->
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Tipo di Operazione</label>
        <select id="tipo_operazione" name="tipo_operazione" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; background: #fff; color: #333;">
          <option value="abbattimento">Abbattimento Rapido (Positivo/Negativo)</option>
          <option value="cotture">Cottura / Rigenerazione</option>
          <option value="scongelamento">Scongelamento Controllato</option>
        </select>
      </div>

      <!-- Prodotto e Lotto -->
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Nome Prodotto / Preparazione</label>
        <input type="text" id="prodotto" name="prodotto" placeholder="Es. Ragù di Cinghiale, Filetto..." style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Lotto / Quantità (kg o n° porzioni)</label>
        <input type="text" id="lotto_qty" name="lotto_qty" placeholder="Es. Lotto 1209 / 5 kg" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
      </div>

      <!-- Temperature e Tempi -->
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Temp. Iniziale (°C) / Ora Inizio</label>
        <div style="display: flex; gap: 10px;">
          <input type="number" step="0.1" name="temp_inizio" placeholder="Temp °C" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; flex: 1;">
          <input type="time" name="ora_inizio" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; flex: 1;">
        </div>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Temp. Finale (°C) / Ora Fine</label>
        <div style="display: flex; gap: 10px;">
          <input type="number" step="0.1" name="temp_fine" placeholder="Temp °C" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; flex: 1;">
          <input type="time" name="ora_fine" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; flex: 1;">
        </div>
      </div>

      <!-- Operatore -->
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Operatore / Firma</label>
        <input type="text" id="operatore" name="operatore" placeholder="Es. Marco N." style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;">
      </div>

      <button 
        type="button" 
        id="btn-save-registro"
        style="padding: 14px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;"
      >
        Salva Registrazione
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;

    const btn = container.querySelector('#btn-save-registro');
    if (btn) {
      btn.addEventListener('click', handleSaveRegistro);
    }
  }

  return html;
}

function handleSaveRegistro() {
  const form = document.getElementById('registro-form');
  if (!form) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  if (!data.prodotto || !data.operatore) {
    alert('Inserisci almeno il nome del Prodotto e l\'Operatore.');
    return;
  }

  console.log('Registro Salvato:', data);
  alert('Operazione registrata con successo nel Registro Processi!');
  
  form.reset();
}
