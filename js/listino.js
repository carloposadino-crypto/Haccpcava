// Listino prezzi fornitori: un prezzo al kg per ogni ingrediente, usato
// dalla pagina Schede HACCP per calcolare il costo a porzione. Si
// aggiorna a mano quando arriva un nuovo listino o cambia un prezzo —
// nessuna lettura automatica qui, per non rischiare di sbagliare un
// prezzo senza che nessuno se ne accorga.

import { leggiTutti, aggiungi, aggiorna, orderBy } from './store.js';

export async function renderListinoPage(container) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;
  const voci = await leggiTutti('listino_prezzi', [orderBy('nome', 'asc')]).catch(() => []);

  container.innerHTML = `
    <div class="top-bar"><h2>Listino prezzi</h2></div>
    <div style="font-size:12px; color:#64748b; margin-bottom:12px;">Prezzo al kg per ogni ingrediente. Usato per calcolare il costo a porzione nelle Schede HACCP.</div>

    <div class="list-card">
      <label class="field-label">Ingrediente</label>
      <input type="text" id="ls-nome" placeholder="Es. Vitello, Olio EVO, Farina 00...">
      <div class="form-row">
        <div><label class="field-label">Prezzo al kg (€)</label><input type="number" step="0.01" id="ls-prezzo"></div>
        <div><label class="field-label">Fornitore (facoltativo)</label><input type="text" id="ls-fornitore"></div>
      </div>
      <button class="btn btn-primary btn-block" id="ls-salva">Salva prezzo</button>
    </div>

    <input type="text" id="ls-filtro" placeholder="🔎 Cerca nel listino…" style="margin-bottom:10px;">
    <div class="list-card" id="ls-lista">
      ${voci.length === 0 ? '<div class="empty-state">Nessun prezzo ancora inserito.</div>' : voci.map((v) => `
        <div class="check-row" style="cursor:default;" data-riga="${v.id}">
          <div class="rt">
            <div class="t">${v.nome}</div>
            <div class="s">${v.fornitore ? v.fornitore + ' · ' : ''}aggiornato il ${v.aggiornato_il?.toDate ? v.aggiornato_il.toDate().toLocaleDateString('it-IT') : '—'}</div>
          </div>
          <input type="number" step="0.01" class="ls-mod-prezzo" value="${v.prezzo_kg}" style="width:80px; text-align:right;">
          <span style="margin-left:4px; color:#64748b;">€/kg</span>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelector('#ls-salva').addEventListener('click', async (e) => {
    const nome = container.querySelector('#ls-nome').value.trim();
    const prezzo = parseFloat(container.querySelector('#ls-prezzo').value);
    if (!nome || Number.isNaN(prezzo)) { alert('Inserisci nome e prezzo.'); return; }

    e.currentTarget.disabled = true;
    try {
      await aggiungi('listino_prezzi', {
        nome,
        prezzo_kg: prezzo,
        fornitore: container.querySelector('#ls-fornitore').value || null,
      }, 'aggiornato_il');
      renderListinoPage(container);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
      e.currentTarget.disabled = false;
    }
  });

  voci.forEach((v) => {
    const input = container.querySelector(`[data-riga="${v.id}"] .ls-mod-prezzo`);
    input.addEventListener('change', async () => {
      const nuovoPrezzo = parseFloat(input.value);
      if (Number.isNaN(nuovoPrezzo)) return;
      try {
        await aggiorna('listino_prezzi', v.id, { prezzo_kg: nuovoPrezzo, aggiornato_il: new Date() });
      } catch (err) {
        console.error(err);
        alert('Errore durante l\'aggiornamento del prezzo.');
      }
    });
  });

  container.querySelector('#ls-filtro').addEventListener('input', (e) => {
    const testo = e.target.value.toLowerCase();
    container.querySelectorAll('#ls-lista [data-riga]').forEach((riga) => {
      const nome = riga.querySelector('.t').textContent.toLowerCase();
      riga.style.display = nome.includes(testo) ? '' : 'none';
    });
  });
}
