import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderAnomaliePage(container) {
  const today = new Date().toISOString().split('T')[0];
  container.innerHTML = `
    <div class="page-header">
      <h2>Anomalie & Azioni Correttive</h2>
      <p class="date-subtitle">Registro guasti o non conformità</p>
    </div>
    <form id="anomalie-form" class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <label style="font-weight: bold; font-size: 14px;">Tipo Problema</label>
      <select id="anomalia_tipo">
        <option value="Guasto Apparecchiatura">Guasto Apparecchiatura</option>
        <option value="Temperatura Fuori Range">Temperatura Fuori Range</option>
        <option value="Non Conformità Merce">Non Conformità Merce</option>
        <option value="Altro">Altro</option>
      </select>

      <label style="font-weight: bold; font-size: 14px;">Descrizione Anomalia</label>
      <textarea id="anomalia_desc" placeholder="Descrivi il problema..." required></textarea>

      <label style="font-weight: bold; font-size: 14px;">Azione Correttiva Intrapresa</label>
      <textarea id="anomalia_azione" placeholder="Es. Sbrinamento forzato, chiamata tecnico..." required></textarea>

      <button type="button" id="btn-save-anomalia" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 5px;">Registra Anomalia</button>
    </form>
  `;

  container.querySelector('#btn-save-anomalia').addEventListener('click', async () => {
    const desc = container.querySelector('#anomalia_desc').value.trim();
    const azione = container.querySelector('#anomalia_azione').value.trim();
    if (!desc || !azione) {
      alert('Compila tutti i campi obbligatori.');
      return;
    }

    try {
      await addDoc(collection(db, "anomalie"), {
        data: today,
        tipo: container.querySelector('#anomalia_tipo').value,
        descrizione: desc,
        azione_correttiva: azione,
        stato: 'Risolta',
        timestamp: serverTimestamp()
      });
      alert('Anomalia registrata!');
      container.querySelector('#anomalie-form').reset();
    } catch (err) {
      console.error(err);
      alert('Errore salvataggio.');
    }
  });
}
