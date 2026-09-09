import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderAnomaliePage(container) {
  const today = new Date().toLocaleDateString('it-IT');

  const html = `
    <div class="page-header">
      <h2>Registro Anomalie e Azioni Correttive</h2>
      <p class="date-subtitle">Data: ${today}</p>
    </div>

    <form id="anomalie-form" style="display: flex; flex-direction: column; gap: 15px; padding: 10px 0;">
      
      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Tipo di Anomalia / Categoria</label>
        <select id="tipo_anomalia" name="tipo_anomalia" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%;">
          <option value="Temperatura">Temperatura fuori limite</option>
          <option value="Attrezzatura">Guasto / Malfunzionamento Attrezzatura</option>
          <option value="Materia Prima">Materia Prima / Merce non idonea</option>
          <option value="Igiene">Igiene / Strutturale</option>
          <option value="Altro">Altro</option>
        </select>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Descrizione dell'Anomalia</label>
        <textarea id="descrizione_anomalia" name="descrizione_anomalia" rows="3" placeholder="Descrivi il problema riscontrato..." style="padding: 10px; font-size: 15px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;" required></textarea>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Azione Correttiva Intrappresa</label>
        <textarea id="azione_correttiva" name="azione_correttiva" rows="3" placeholder="Descrivi le azioni immediate o correttive effettuate..." style="padding: 10px; font-size: 15px; border-radius: 6px; border: 1px solid #ccc; width: 100%; box-sizing: border-box;" required></textarea>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-weight: bold; font-size: 15px;">Stato Anomalia</label>
        <select id="stato_anomalia" name="stato_anomalia" style="padding: 10px; font-size: 16px; border-radius: 6px; border: 1px solid #ccc; width: 100%;">
          <option value="Risolta">Risolta immediatamente</option>
          <option value="In Gestione">In gestione / In attesa di intervento tecnico</option>
        </select>
      </div>

      <button 
        type="button" 
        id="btn-save-anomalia"
        style="padding: 14px; background-color: #b91c1c; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;"
      >
        Registra Anomalia
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;
    const btn = container.querySelector('#btn-save-anomalia');
    if (btn) btn.addEventListener('click', handleSaveAnomalia);
  }

  return html;
}

async function handleSaveAnomalia() {
  const descrizione = document.getElementById('descrizione_anomalia')?.value.trim();
  const azione = document.getElementById('azione_correttiva')?.value.trim();

  if (!descrizione || !azione) {
    alert('Compila sia la descrizione che l azione correttiva.');
    return;
  }

  const btn = document.getElementById('btn-save-anomalia');
  btn.disabled = true;
  btn.innerText = 'Salvataggio in corso...';

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    await addDoc(collection(db, "anomalie"), {
      data: todayStr,
      tipo: document.getElementById('tipo_anomalia').value,
      descrizione: descrizione,
      azione_correttiva: azione,
      stato: document.getElementById('stato_anomalia').value,
      timestamp: serverTimestamp()
    });

    alert('Anomalia registrata con successo su Firebase!');
    document.getElementById('anomalie-form').reset();
    window.switchTab('oggi');
  } catch (error) {
    console.error("Errore durante il salvataggio dell anomalia:", error);
    alert('Errore nel salvataggio dell anomalia.');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Registra Anomalia';
  }
}
