// Schede HACCP create manualmente (MVP1, senza AI). Il "contenuto" è una
// mappa annidata dentro al documento — Firestore la gestisce nativamente,
// senza bisogno del campo jsonb-come-testo usato nello schema SQL originale.

import { aggiungi, aggiorna, leggiTutti, orderBy } from '../../lib/store.js';

const ETICHETTE_STATO = { bozza: 'Bozza', da_revisionare: 'Da revisionare', approvata: 'Approvata' };
const BADGE_STATO = { bozza: 'neutral', da_revisionare: 'bad', approvata: 'ok' };

export async function renderSchedeHaccp(container, profilo) {
  container.innerHTML = `
    <button class="btn btn-primary btn-block" id="nuova-scheda" style="margin-bottom:16px;">+ Nuova scheda</button>
    <div id="schede-list"><div class="empty">Caricamento…</div></div>
  `;

  container.querySelector('#nuova-scheda').addEventListener('click', () => {
    apriFormScheda(container, profilo);
  });

  await ricaricaElenco(container, profilo);
}

async function ricaricaElenco(container, profilo) {
  const listEl = container.querySelector('#schede-list');
  const schede = await leggiTutti('schede_haccp', [orderBy('creato_il', 'desc')]);
  if (!schede || schede.length === 0) {
    listEl.innerHTML = `<div class="empty">Nessuna scheda ancora creata.</div>`;
    return;
  }
  listEl.innerHTML = schede.map((s) => `
    <div class="entry-row" data-scheda="${s.id}" style="cursor:pointer;">
      <div class="top">
        <span class="name">${escapeHtml(s.nome)} <span style="color:var(--text-muted);font-weight:400;">v${s.versione}</span></span>
        <span class="badge ${BADGE_STATO[s.stato]}">${ETICHETTE_STATO[s.stato]}</span>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-scheda]').forEach((el) => {
    el.addEventListener('click', () => {
      const scheda = schede.find((s) => s.id === el.dataset.scheda);
      apriDettaglioScheda(container, profilo, scheda);
    });
  });
}

function campiForm(scheda) {
  const c = scheda?.contenuto || {};
  return `
    <label class="field-label">Nome preparazione</label>
    <input type="text" id="s-nome" value="${scheda ? escapeAttr(scheda.nome) : ''}">
    <label class="field-label">Ingredienti / prodotti</label>
    <textarea id="s-ingredienti">${escapeHtml(c.ingredienti || '')}</textarea>
    <label class="field-label">Fasi del processo</label>
    <textarea id="s-processo">${escapeHtml(c.processo || '')}</textarea>
    <label class="field-label">Pericoli identificati</label>
    <textarea id="s-pericoli">${escapeHtml(c.pericoli || '')}</textarea>
    <label class="field-label">Misure di controllo</label>
    <textarea id="s-misure">${escapeHtml(c.misure_controllo || '')}</textarea>
    <label class="field-label">CP / CCP</label>
    <textarea id="s-ccp">${escapeHtml(c.ccp || '')}</textarea>
    <label class="field-label">Parametri (temperatura, tempo, conservazione, rigenerazione...)</label>
    <textarea id="s-parametri">${escapeHtml(c.parametri || '')}</textarea>
    <label class="field-label">Note</label>
    <textarea id="s-note">${escapeHtml(c.note || '')}</textarea>
  `;
}

function leggiForm(backdrop) {
  return {
    nome: backdrop.querySelector('#s-nome').value.trim(),
    contenuto: {
      ingredienti: backdrop.querySelector('#s-ingredienti').value.trim(),
      processo: backdrop.querySelector('#s-processo').value.trim(),
      pericoli: backdrop.querySelector('#s-pericoli').value.trim(),
      misure_controllo: backdrop.querySelector('#s-misure').value.trim(),
      ccp: backdrop.querySelector('#s-ccp').value.trim(),
      parametri: backdrop.querySelector('#s-parametri').value.trim(),
      note: backdrop.querySelector('#s-note').value.trim(),
    },
  };
}

function apriFormScheda(container, profilo) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" style="max-height:85vh; overflow-y:auto;">
      <h3>Nuova scheda HACCP</h3>
      ${campiForm(null)}
      <button class="btn btn-primary btn-block" id="s-salva" style="margin-top:8px;">Salva come bozza</button>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });

  backdrop.querySelector('#s-salva').addEventListener('click', async () => {
    const { nome, contenuto } = leggiForm(backdrop);
    if (!nome) return;
    await aggiungi('schede_haccp', {
      nome, contenuto, versione: 1, stato: 'bozza', autore_id: profilo.id, creato_il: new Date(),
    });
    backdrop.remove();
    await ricaricaElenco(container, profilo);
  });
}

function apriDettaglioScheda(container, profilo, scheda) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const puoApprovare = profilo.ruolo === 'responsabile';
  backdrop.innerHTML = `
    <div class="modal" style="max-height:85vh; overflow-y:auto;">
      <h3>${escapeHtml(scheda.nome)} — v${scheda.versione}</h3>
      <p class="badge ${BADGE_STATO[scheda.stato]}" style="margin-bottom:14px;">${ETICHETTE_STATO[scheda.stato]}</p>
      ${campiForm(scheda)}
      <label class="field-label">Motivo della modifica (se cambi qualcosa)</label>
      <input type="text" id="s-motivo" placeholder="Es. cambio fornitore panna">
      <div style="display:flex; gap:8px; margin-top:8px;">
        <button class="btn btn-ghost" id="s-salva-nuova-versione" style="flex:1;">Salva nuova versione</button>
        ${puoApprovare && scheda.stato !== 'approvata' ? `<button class="btn btn-primary" id="s-approva" style="flex:1;">Approva</button>` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });

  backdrop.querySelector('#s-salva-nuova-versione').addEventListener('click', async () => {
    const { nome, contenuto } = leggiForm(backdrop);
    const motivo = backdrop.querySelector('#s-motivo').value.trim();
    await aggiungi('schede_haccp', {
      nome, contenuto,
      versione: scheda.versione + 1,
      stato: 'da_revisionare', // ogni modifica va sempre revisionata di nuovo, mai approvata in automatico
      scheda_precedente_id: scheda.id,
      motivo_modifica: motivo || null,
      autore_id: profilo.id,
      creato_il: new Date(),
    });
    backdrop.remove();
    await ricaricaElenco(container, profilo);
  });

  const bottoneApprova = backdrop.querySelector('#s-approva');
  if (bottoneApprova) {
    bottoneApprova.addEventListener('click', async () => {
      await aggiorna('schede_haccp', scheda.id, { stato: 'approvata', approvato_da: profilo.id });
      backdrop.remove();
      await ricaricaElenco(container, profilo);
    });
  }
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
