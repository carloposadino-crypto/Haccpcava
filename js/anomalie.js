// Elenco e gestione delle non conformità. La *segnalazione* di una nuova
// anomalia si fa dal pulsante rosso "!" sempre visibile in alto (vedi
// anomalia-modal.js) — questa pagina serve a rivedere le segnalazioni
// aperte e chiuderle con l'azione correttiva svolta.

import { leggiTutti, aggiorna, where, orderBy } from './store.js';

export async function renderAnomaliePage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;

  const aperte = await leggiTutti('non_conformita', [where('stato', '==', 'aperta'), orderBy('aperto_il', 'desc')]);
  const chiuseRecenti = (await leggiTutti('non_conformita', [where('stato', '==', 'chiusa'), orderBy('aperto_il', 'desc')])).slice(0, 10);

  container.innerHTML = `
    <div class="top-bar"><h2>Anomalie</h2></div>

    <h3 style="font-size:14px; color:#b91c1c; margin-bottom:8px;">Aperte (${aperte.length})</h3>
    ${aperte.length === 0 ? '<div class="empty-state">Nessuna anomalia aperta. 👍</div>' : aperte.map((a) => `
      <div class="list-card" data-id="${a.id}">
        <div style="padding-top:12px;">
          <span class="badge badge-warn">${a.categoria || 'altro'}</span>
          <div style="margin:8px 0; font-size:14px; color:#1e293b;">${a.problema}</div>
          <label class="field-label">Azione correttiva</label>
          <textarea class="an-azione" placeholder="Cosa è stato fatto per risolvere"></textarea>
          <button class="btn btn-primary btn-block an-chiudi" style="margin-bottom:12px;">Chiudi anomalia</button>
        </div>
      </div>
    `).join('')}

    ${chiuseRecenti.length ? `
      <h3 style="font-size:14px; color:#64748b; margin: 16px 0 8px;">Chiuse di recente</h3>
      <div class="list-card">
        ${chiuseRecenti.map((a) => `
          <div class="check-row" style="cursor:default;">
            <span class="dot ok"></span>
            <div class="rt">
              <div class="t">${a.problema}</div>
              <div class="s">${a.azione || ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;

  aperte.forEach((a) => {
    const card = container.querySelector(`[data-id="${a.id}"]`);
    card.querySelector('.an-chiudi').addEventListener('click', async (e) => {
      const azione = card.querySelector('.an-azione').value.trim();
      if (!azione) { alert('Descrivi l\'azione correttiva prima di chiudere.'); return; }
      e.currentTarget.disabled = true;
      try {
        await aggiorna('non_conformita', a.id, {
          azione,
          esito: 'risolto',
          stato: 'chiusa',
          verifica: profilo.id,
          chiuso_il: new Date(),
        });
        renderAnomaliePage(container, profilo);
      } catch (err) {
        console.error(err);
        alert('Errore durante il salvataggio.');
        e.currentTarget.disabled = false;
      }
    });
  });
}
