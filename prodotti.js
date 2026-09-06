// Prodotti: inserimento manuale in questa fase (OCR etichetta e barcode
// sono previsti dall'architettura ma non ancora implementati). Gli
// allergeni sono un campo array dentro al documento prodotto (non una
// collezione separata) — è il modo idiomatico di modellare dati "posseduti"
// da un solo documento in Firestore, ed è più semplice della tabella di
// giunzione usata nello schema SQL originale.

import { aggiungi, leggiTutti, where, orderBy, limit } from '../../lib/store.js';

const ALLERGENI = [
  'Glutine', 'Crostacei', 'Uova', 'Pesce', 'Arachidi', 'Soia', 'Latte',
  'Frutta a guscio', 'Sedano', 'Senape', 'Semi di sesamo',
  'Anidride solforosa e solfiti', 'Lupini', 'Molluschi',
];
const TIPI_PRESENZA = [
  ['ingrediente', 'Ingrediente'],
  ['derivato', 'Derivato'],
  ['traccia', 'Traccia dichiarata'],
  ['contaminazione_crociata', 'Contaminazione crociata'],
];

export async function renderProdotti(container) {
  container.innerHTML = `
    <button class="btn btn-primary btn-block" id="nuovo-prodotto" style="margin-bottom:16px;">+ Nuovo prodotto</button>
    <div id="prod-list"><div class="empty">Caricamento…</div></div>
  `;

  container.querySelector('#nuovo-prodotto').addEventListener('click', () => {
    apriFormProdotto(container);
  });

  await ricaricaElenco(container);
}

async function ricaricaElenco(container) {
  const listEl = container.querySelector('#prod-list');
  const prodotti = await leggiTutti('prodotti', [orderBy('creato_il', 'desc'), limit(50)]);
  if (!prodotti || prodotti.length === 0) {
    listEl.innerHTML = `<div class="empty">Nessun prodotto ancora inserito.</div>`;
    return;
  }
  listEl.innerHTML = prodotti.map((p) => `
    <div class="entry-row">
      <div class="top">
        <span class="name">${escapeHtml(p.denominazione)}</span>
        <span class="badge ${p.stato_verifica === 'verificato' ? 'ok' : 'neutral'}">${p.stato_verifica === 'verificato' ? 'Verificato' : 'Non verificato'}</span>
      </div>
      <div class="meta">${escapeHtml(p.conservazione || '')}</div>
    </div>
  `).join('');
}

function apriFormProdotto(container) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" style="max-height:85vh; overflow-y:auto;">
      <h3>Nuovo prodotto</h3>
      <label class="field-label">Denominazione</label>
      <input type="text" id="p-nome">
      <label class="field-label">Ingredienti</label>
      <textarea id="p-ingredienti" placeholder="Come riportati in etichetta"></textarea>
      <label class="field-label">Conservazione</label>
      <input type="text" id="p-conservazione" placeholder="Es. 0–4°C">
      <p class="section-title">Allergeni presenti</p>
      ${ALLERGENI.map((a) => `
        <div class="check-row" style="cursor:default;">
          <input type="checkbox" class="all-check" data-allergene="${a}" style="width:20px;height:20px;">
          <div class="rt">
            <div class="t">${a}</div>
            <select class="all-tipo" data-allergene="${a}" style="margin:6px 0 0;">
              ${TIPI_PRESENZA.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
            </select>
          </div>
        </div>
      `).join('')}
      <button class="btn btn-primary btn-block" id="p-salva" style="margin-top:8px;">Salva prodotto</button>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });

  backdrop.querySelector('#p-salva').addEventListener('click', async () => {
    const denominazione = backdrop.querySelector('#p-nome').value.trim();
    if (!denominazione) return;

    const allergeni = [...backdrop.querySelectorAll('.all-check:checked')].map((chk) => {
      const nome = chk.dataset.allergene;
      const tipoSel = backdrop.querySelector(`.all-tipo[data-allergene="${nome}"]`);
      return { allergene: nome, tipo_presenza: tipoSel.value };
    });

    await aggiungi('prodotti', {
      denominazione,
      ingredienti: backdrop.querySelector('#p-ingredienti').value.trim() || null,
      conservazione: backdrop.querySelector('#p-conservazione').value.trim() || null,
      allergeni,
      fonte: 'manuale',
      stato_verifica: 'verificato', // inserimento manuale diretto: l'utente ha già verificato quello che scrive
      creato_il: new Date(),
    });

    backdrop.remove();
    await ricaricaElenco(container);
  });
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
