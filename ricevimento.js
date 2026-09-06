// Ricevimento merci: fornitore → prodotto → ricevimento → lotto.
// Semplificazione: se il prodotto digitato non è ancora in anagrafica e si
// è offline, il ricevimento viene comunque registrato (prodotto_id vuoto,
// nome annotato in "note") — meglio salvarlo così che perderlo. Va
// ricollegato al prodotto verificato in un secondo momento, quando si è
// online, dalla sezione Prodotti.
// Nota: la ricerca per nome è un confronto esatto (Firestore non ha un
// equivalente diretto di "ilike"); un prodotto scritto in modo leggermente
// diverso genera una nuova voce invece di essere trovato.

import { aggiungi, leggiTutti, toData, inizioEFineGiorno, oggiISO, where, limit } from '../../lib/store.js';
import { segnalaScrittura } from '../../lib/sync-status.js';

function fmtOra(d) {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

async function trovaOCreaProdotto(nome) {
  if (!navigator.onLine || !nome) return null;
  const trovati = await leggiTutti('prodotti', [where('denominazione', '==', nome), limit(1)]);
  if (trovati.length > 0) return trovati[0].id;
  return aggiungi('prodotti', { denominazione: nome, fonte: 'manuale', stato_verifica: 'non_verificato', creato_il: new Date() });
}

export async function renderRicevimento(container, profilo) {
  const { inizio, fine } = inizioEFineGiorno(oggiISO());
  const oggi = await leggiTutti('ricevimenti', [where('registrato_il', '>=', inizio), where('registrato_il', '<=', fine)]);

  container.innerHTML = `
    <div class="card">
      <label class="field-label">Fornitore</label>
      <input type="text" id="ric-fornitore" placeholder="Nome fornitore">
      <label class="field-label">Prodotto</label>
      <input type="text" id="ric-prodotto" placeholder="Denominazione prodotto">
      <label class="field-label">Lotto (se presente)</label>
      <input type="text" id="ric-lotto">
      <label class="field-label">Scadenza / TMC (se pertinente)</label>
      <input type="date" id="ric-scadenza">
      <label class="field-label">Temperatura alla consegna (se pertinente)</label>
      <input type="number" id="ric-temperatura" step="0.5">
      <label class="field-label">Conformità</label>
      <select id="ric-conformita">
        <option value="true">Conforme</option>
        <option value="false">Non conforme</option>
      </select>
      <label class="field-label">Note</label>
      <textarea id="ric-note" placeholder="Facoltative"></textarea>
      <button class="btn btn-primary btn-block" id="ric-salva">Registra ricevimento</button>
    </div>
    <p class="section-title">Oggi</p>
    ${oggi.length === 0 ? '<div class="empty">Nessun ricevimento registrato oggi.</div>' : oggi.map(riga).join('')}
  `;

  container.querySelector('#ric-salva').addEventListener('click', async () => {
    const fornitoreNome = container.querySelector('#ric-fornitore').value.trim();
    const prodottoNome = container.querySelector('#ric-prodotto').value.trim();
    if (!prodottoNome) return;

    const prodottoId = await trovaOCreaProdotto(prodottoNome);
    const temperaturaVal = container.querySelector('#ric-temperatura').value;
    const noteBase = container.querySelector('#ric-note').value.trim();
    const note = prodottoId ? noteBase : [`Prodotto non collegato: ${prodottoNome}`, noteBase].filter(Boolean).join(' — ');

    await aggiungi('ricevimenti', {
      fornitore_id: null,
      fornitore_nome: fornitoreNome || null,
      prodotto_id: prodottoId,
      prodotto_nome: prodottoNome,
      data: oggiISO(),
      lotto: container.querySelector('#ric-lotto').value.trim() || null,
      scadenza: container.querySelector('#ric-scadenza').value || null,
      temperatura: temperaturaVal ? parseFloat(temperaturaVal) : null,
      conformita: container.querySelector('#ric-conformita').value === 'true',
      note: note || null,
      registrato_da: profilo.id,
      registrato_il: new Date(),
    });
    segnalaScrittura();
    await renderRicevimento(container, profilo);
  });
}

function riga(r) {
  return `
    <div class="entry-row">
      <div class="top">
        <span class="name">${escapeHtml(r.prodotto_nome || 'Prodotto')}</span>
        <span class="badge ${r.conformita ? 'ok' : 'bad'}">${r.conformita ? 'Conforme' : 'Non conforme'}</span>
      </div>
      <div class="meta">${escapeHtml(r.fornitore_nome || '')}${r.lotto ? ' · lotto ' + escapeHtml(r.lotto) : ''} · ${fmtOra(toData(r.registrato_il))}</div>
    </div>
  `;
}
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
