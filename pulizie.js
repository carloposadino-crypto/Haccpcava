import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderPuliziePage(container) {
  const today = new Date().toLocaleDateString('it-IT');

  const mansioni = [
    { id: 'piani_lavoro', label: 'Piani di lavoro e tagliagole / piani inox' },
    { id: 'piani_cottura', label: 'Piani cottura, forni e cappe di aspirazione' },
    { id: 'lavelli_utensili', label: 'Lavelli, rubinetteria e stoviglie/utensili' },
    { id: 'impastatrice_pasta', label: 'Impastatrice e macchina per pasta' },
    { id: 'pavimenti_scarichi', label: 'Pavimento, griglie di scarico e pareti' },
    { id: 'frigo_maniglie', label: 'Maniglie frigo, guarnizioni e superfici esterne' },
    { id: 'smaltimento_rifiuti', label: 'Svuotamento secchi e igienizzazione contenitori rifiuti' }
  ];

  const listHtml = mansioni.map(m => `
    <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 14px;">
      <label for="check_${m.id}" style="font-size: 15px; color: #e5e7eb; cursor: pointer; flex: 1; margin-right: 10px;">
        ${m.label}
      </label>
      <input 
        type="checkbox" 
        id="check_${m.id}" 
        name="${m.id}" 
        style="width: 22px; height: 22px; cursor: pointer; accent-color: #2b5c3a;"
      >
    </div>
  `).join('');

  const html = `
    <div class="page-header">
      <h2>Registro Pulizie e Sanificazioni</h2>
      <p class="date-subtitle">Data: ${today}</p>
    </div>

    <form id="pulizie-form" style="display: flex; flex-direction: column; gap: 10px; padding: 10px 0;">
      ${listHtml}

      <div class="card" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
        <label style="font-weight: bold; font-size: 14px; color: #e5e7eb;">Note / Prodotti detergenti usati</label>
        <input 
          type="text" 
          id="note_pulizie" 
          name="note_pulizie" 
          placeholder="Es. Detergente sgrassante e disinfettante PMC" 
          style="padding: 10px; font-size: 15px; border-radius: 6px; border: 1px solid #2d2825; background: #121212; color: #fff; width: 100%; box-sizing: border-box;"
        >
      </div>

      <button 
        type="button" 
        id="btn-save-pulizie"
        style="padding: 14px; background-color: #2b5c3a; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px;"
      >
        Conferma Pulizie Giornaliere
      </button>
    </form>
  `;

  if (container) {
    container.innerHTML = html;
    const btn = container.querySelector('#btn-save-pulizie');
    if (btn) btn.addEventListener('click', handleSavePulizie);
  }

  return html;
}

async function handleSavePulizie() {
  const form = document.getElementById('pulizie-form');
  if (!form) return;

  const checkboxes = form.querySelectorAll('input[type="checkbox"]');
  const mansioniCompletate = {};
  let totalChecked = 0;

  checkboxes.forEach(cb => {
    mansioniCompletate[cb.name] = cb.checked;
    if (cb.checked) totalChecked++;
  });

  if (totalChecked === 0) {
    alert('Spunta almeno una mansione completata prima di salvare.');
    return;
  }

  const btn = document.getElementById('btn-save-pulizie');
  btn.disabled = true;
  btn.innerText = 'Salvataggio in corso...';

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    await addDoc(collection(db, "pulizie"), {
      data: todayStr,
      mansioni: mansioniCompletate,
      totale_completate: totalChecked,
      note: document.getElementById('note_pulizie')?.value || '',
      timestamp: serverTimestamp()
    });

    alert('Pulizie registrate con successo su Firebase!');
    form.reset();
    window.switchTab('oggi');
  } catch (error) {
    console.error("Errore durante il salvataggio:", error);
    alert('Errore nel salvataggio del registro pulizie.');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Conferma Pulizie Giornaliere';
  }
}
