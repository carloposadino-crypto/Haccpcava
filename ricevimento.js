import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderRicezioniPage(container) {
  const today = new Date().toISOString().split('T')[0];
  container.innerHTML = `
    <div class="page-header">
      <h2>Ricevimento Merci</h2>
      <p class="date-subtitle">Controllo forniture e DDT in ingresso</p>
    </div>
    <form id="ricezione-form" class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <label style="font-weight: bold; font-size: 14px;">Nome Fornitore</label>
      <input type="text" id="ric_fornitore" placeholder="Es. Fornitore Carni Srl" required>

      <label style="font-weight: bold; font-size: 14px;">Prodotto / Tipologia</label>
      <input type="text" id="ric_prodotto" placeholder="Es. Tagli di carne fresca" required>

      <label style="font-weight: bold; font-size: 14px;">Numero DDT</label>
      <input type="text" id="ric_ddt" placeholder="Es. 1245/A">

      <label style="font-weight: bold; font-size: 14px;">Temperatura alla consegna (°C)</label>
      <input type="number" step="0.1" id="ric_temp" placeholder="Es. 3.5">

      <label style="font-weight: bold; font-size: 14px;">Esito Controllo</label>
      <select id="ric_esito">
        <option value="Conforme">Conforme</option>
        <option value="Non Conforme (Respinto)">Non Conforme (Respinto)</option>
      </select>

      <button type="button" id="btn-save-ric" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 5px;">Registra Ricevimento</button>
    </form>
  `;

  container.querySelector('#btn-save-ric').addEventListener('click', async () => {
    const fornitore = container.querySelector('#ric_fornitore').value.trim();
    const prodotto = container.querySelector('#ric_prodotto').value.trim();
    if (!fornitore || !prodotto) {
      alert('Inserisci fornitore e prodotto.');
      return;
    }

    try {
      await addDoc(collection(db, "ricevimento_merci"), {
        data: today,
        fornitore,
        prodotto,
        num_ddt: container.querySelector('#ric_ddt').value,
        temperatura: container.querySelector('#ric_temp').value,
        esito: container.querySelector('#ric_esito').value,
        timestamp: serverTimestamp()
      });
      alert('Ricevimento merci registrato!');
      container.querySelector('#ricezione-form').reset();
    } catch (err) {
      console.error(err);
      alert('Errore salvataggio.');
    }
  });
}
