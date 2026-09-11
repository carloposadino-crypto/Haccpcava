import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderPuliziePage(container) {
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="page-header">
      <h2>Registro Pulizie & Sanificazione</h2>
      <p class="date-subtitle">Checklist piano di sanificazione HACCP</p>
    </div>

    <form id="pulizie-form" class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <label style="font-weight: bold; font-size: 14px;">Data</label>
      <input type="date" id="pul_data" value="${today}" required>

      <label style="font-weight: bold; font-size: 14px;">Mansioni Eseguite</label>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label><input type="checkbox" class="chk-task" value="Piani di lavoro e taglioverdure"> Piani di lavoro e taglioverdure</label>
        <label><input type="checkbox" class="chk-task" value="Fornelli, piastre e forno Rational"> Fornelli, piastre e forno Rational</label>
        <label><input type="checkbox" class="chk-task" value="Lavaggio pavimenti e scarichi cucina"> Lavaggio pavimenti e scarichi cucina</label>
        <label><input type="checkbox" class="chk-task" value="Sanificazione affettatrice e impastatrice"> Sanificazione affettatrice e impastatrice</label>
        <label><input type="checkbox" class="chk-task" value="Maniglie e guarnizioni frigo"> Maniglie e guarnizioni frigo</label>
        <label><input type="checkbox" class="chk-task" value="Filtri cappa e cappa d'aspirazione"> Filtri cappa e cappa d'aspirazione</label>
      </div>

      <label style="font-weight: bold; font-size: 14px; margin-top: 10px;">Operatore / Firma</label>
      <input type="text" id="pul_operatore" placeholder="Nome dell'operatore responsabile" required>

      <button type="button" id="btn-save-pulizie" style="padding: 12px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 8px;">
        Registra Pulizie
      </button>
    </form>
  `;

  container.querySelector('#btn-save-pulizie').addEventListener('click', async () => {
    const data = container.querySelector('#pul_data').value;
    const operatore = container.querySelector('#pul_operatore').value.trim();

    const taskElements = container.querySelectorAll('.chk-task:checked');
    const mansioni = Array.from(taskElements).map(el => el.value);

    if (mansioni.length === 0 || !operatore) {
      alert('Seleziona almeno una mansione e specifica l\'operatore.');
      return;
    }

    try {
      await addDoc(collection(db, 'pulizie'), {
        data,
        mansioni,
        operatore,
        timestamp: serverTimestamp()
      });
      alert('Registro pulizie salvato con successo!');
      renderPuliziePage(container);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
    }
  });
}