import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderEtichettePage(container) {
  const today = new Date().toISOString().split('T')[0];
  container.innerHTML = `
    <div class="page-header">
      <h2>Stampa Etichette & Tracciabilità</h2>
      <p class="date-subtitle">Genera etichette per sottovuoto o congelamento</p>
    </div>
    <form id="etichette-form" class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <label style="font-weight: bold; font-size: 14px;">Nome Prodotto</label>
      <input type="text" id="etichetta_prodotto" placeholder="Es. Ragù di Cinghiale, Salsa..." required>

      <label style="font-weight: bold; font-size: 14px;">Tipo Confezionamento</label>
      <select id="etichetta_tipo">
        <option value="Sottovuoto Fresco">Sottovuoto Fresco</option>
        <option value="Congelato / Abbattuto">Congelato / Abbattuto</option>
        <option value="Lotto In Lavorazione">Lotto In Lavorazione</option>
      </select>

      <label style="font-weight: bold; font-size: 14px;">Lotto di Origine / Materia Prima</label>
      <input type="text" id="etichetta_lotto" placeholder="Es. L-2026-0901">

      <label style="font-weight: bold; font-size: 14px;">Data Scadenza Consegnata</label>
      <input type="date" id="etichetta_scadenza" required>

      <button type="button" id="btn-save-etichetta" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 5px;">Salva & Prepara Etichetta</button>
    </form>
  `;

  container.querySelector('#btn-save-etichetta')?.addEventListener('click', async () => {
    const prodotto = container.querySelector('#etichetta_prodotto').value.trim();
    const scadenza = container.querySelector('#etichetta_scadenza').value;

    if (!prodotto || !scadenza) {
      alert('Compila il nome del prodotto e la data di scadenza.');
      return;
    }

    try {
      await addDoc(collection(db, "tracciabilita_etichette"), {
        data_produzione: today,
        prodotto,
        tipo: container.querySelector('#etichetta_tipo').value,
        lotto_materia_prima: container.querySelector('#etichetta_lotto').value,
        data_scadenza: scadenza,
        timestamp: serverTimestamp()
      });
      alert('Etichetta registrata con successo!');
      container.querySelector('#etichette-form').reset();
    } catch (err) {
      console.error(err);
      alert('Errore nel salvataggio.');
    }
  });
}
