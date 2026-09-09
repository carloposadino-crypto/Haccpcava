import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderPuliziePage(container) {
  const today = new Date().toISOString().split('T')[0];
  container.innerHTML = `
    <div class="page-header">
      <h2>Pulizie & Sanificazioni</h2>
      <p class="date-subtitle">Checklist giornaliera locali e attrezzature</p>
    </div>
    <form id="pulizie-form" class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <label><input type="checkbox" class="pulizia-item" value="Piani di lavoro e taglieri"> Piani di lavoro e taglieri</label>
      <label><input type="checkbox" class="pulizia-item" value="Affettatrice e attrezzature"> Affettatrice e attrezzature</label>
      <label><input type="checkbox" class="pulizia-item" value="Lavelli e rubinetteria"> Lavelli e rubinetteria</label>
      <label><input type="checkbox" class="pulizia-item" value="Pavimenti e scarichi cucina"> Pavimenti e scarichi cucina</label>
      <label><input type="checkbox" class="pulizia-item" value="Interno frigoriferi"> Interno frigoriferi</label>
      
      <label style="font-weight: bold; font-size: 14px; margin-top: 5px;">Note / Anomalie Pulizia</label>
      <textarea id="pulizie_note" placeholder="Eventuali note..."></textarea>

      <button type="button" id="btn-save-pulizie" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 5px;">Registra Pulizie</button>
    </form>
  `;

  container.querySelector('#btn-save-pulizie').addEventListener('click', async () => {
    const checkboxes = container.querySelectorAll('.pulizia-item:checked');
    const note = container.querySelector('#pulizie_note').value;

    try {
      await addDoc(collection(db, "pulizie"), {
        data: today,
        totale_completate: checkboxes.length,
        note,
        timestamp: serverTimestamp()
      });
      alert('Pulizie registrate con successo!');
      container.querySelector('#pulizie-form').reset();
    } catch (err) {
      console.error(err);
      alert('Errore salvataggio pulizie.');
    }
  });
}
