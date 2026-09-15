// Anagrafica Prodotti: nome, ingredienti, conservazione e allergeni
// (i 14 allergeni previsti dalla normativa UE 1169/2011).

import { leggiTutti, aggiungi, orderBy } from './store.js';

const ALLERGENI = [
  'Glutine', 'Crostacei', 'Uova', 'Pesce', 'Arachidi', 'Soia', 'Latte',
  'Frutta a guscio', 'Sedano', 'Senape', 'Sesamo', 'Anidride solforosa/Solfiti',
  'Lupini', 'Molluschi',
];

export async function renderProdottiPage(container) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;
  const prodotti = await leggiTutti('prodotti', [orderBy('creato_il', 'desc')]).catch(() => []);

  container.innerHTML = `
    <div class="top-bar"><h2>Prodotti</h2></div>

    <div class="list-card">
      <label class="field-label">Denominazione</label>
      <input type="text" id="pr-nome" placeholder="Es. Vitello Tonnato CBT">
      <label class="field-label">Ingredienti</label>
      <textarea id="pr-ingredienti" placeholder="Elenco ingredienti"></textarea>
      <label class="field-label">Conservazione</label>
      <textarea id="pr-conservazione" placeholder="Es. +2°C/+4°C, max 14 giorni sottovuoto"></textarea>
      <label class="field-label">Allergeni presenti</label>
      <div class="chip-group" id="pr-allergeni">
        ${ALLERGENI.map((a) => `<span class="chip" data-allergene="${a}">${a}</span>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" id="pr-salva">Salva prodotto</button>
    </div>

    <h3 style="font-size:14px; color:#64748b; margin: 16px 0 8px;">Elenco (${prodotti.length})</h3>
    ${prodotti.length === 0 ? '<div class="empty-state">Nessun prodotto ancora inserito.</div>' : `
      <div class="list-card">
        ${prodotti.map((p) => `
          <div class="check-row" style="cursor:default;">
            <div class="rt">
              <div class="t">${p.denominazione}</div>
              <div class="s">${(p.allergeni || []).map((a) => a.allergene).join(', ') || 'Nessun allergene indicato'}</div>
            </div>
            <span class="badge ${p.stato_verifica === 'verificato' ? 'badge-ok' : 'badge-pending'}">${p.stato_verifica === 'verificato' ? 'verificato' : 'da verificare'}</span>
          </div>
        `).join('')}
      </div>
    `}
  `;

  const selezionati = new Set();
  container.querySelectorAll('#pr-allergeni .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const nome = chip.dataset.allergene;
      if (selezionati.has(nome)) { selezionati.delete(nome); chip.classList.remove('selected'); }
      else { selezionati.add(nome); chip.classList.add('selected'); }
    });
  });

  container.querySelector('#pr-salva').addEventListener('click', async (e) => {
    const denominazione = container.querySelector('#pr-nome').value.trim();
    if (!denominazione) { alert('Inserisci la denominazione del prodotto.'); return; }

    e.currentTarget.disabled = true;
    try {
      await aggiungi('prodotti', {
        denominazione,
        ingredienti: container.querySelector('#pr-ingredienti').value,
        conservazione: container.querySelector('#pr-conservazione').value,
        stato_verifica: 'non_verificato',
        fonte: 'manuale',
        allergeni: [...selezionati].map((allergene) => ({ allergene, tipo_presenza: 'ingrediente' })),
      }, 'creato_il');
      renderProdottiPage(container);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
      e.currentTarget.disabled = false;
    }
  });
}
