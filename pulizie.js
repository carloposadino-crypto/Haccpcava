import { aggiungi, leggiTutti, toData, inizioEFineGiorno, oggiISO, where, orderBy } from '../../lib/store.js';
import { segnalaScrittura } from '../../lib/sync-status.js';

function fmtOra(d) {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
const ETICHETTE_FREQUENZA = { giornaliera: 'Giornaliere', settimanale: 'Settimanali', mensile: 'Mensili' };

export async function renderPulizie(container, profilo) {
  const piano = await leggiTutti('piano_pulizie', [where('attivo', '==', true), orderBy('ordine')]);
  if (!piano || piano.length === 0) {
    container.innerHTML = `<div class="empty">Nessuna voce configurata. Aggiungile dalla console Firebase nella collezione "piano_pulizie".</div>`;
    return;
  }

  const { inizio, fine } = inizioEFineGiorno(oggiISO());
  const registrazioniOggi = await leggiTutti('registrazioni_pulizia', [
    where('registrato_il', '>=', inizio), where('registrato_il', '<=', fine),
  ]);
  const completate = {};
  registrazioniOggi.forEach((r) => { completate[r.voce_id] = r; });

  const gruppi = ['giornaliera', 'settimanale', 'mensile'].map((freq) => ({
    freq, voci: piano.filter((v) => v.frequenza === freq),
  })).filter((g) => g.voci.length > 0);

  container.innerHTML = gruppi.map((g) => `
    <p class="section-title">${ETICHETTE_FREQUENZA[g.freq]}</p>
    <div class="card">
      ${g.voci.map((v) => {
        const fatto = completate[v.id];
        return `
          <div class="check-row" data-voce="${v.id}" style="margin-bottom:8px;">
            <span class="dot ${fatto ? 'ok' : 'pending'}"></span>
            <div class="rt">
              <div class="t">${v.nome}</div>
              <div class="s">${fatto ? 'Completata alle ' + fmtOra(toData(fatto.registrato_il)) : 'Da fare'}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  container.querySelectorAll('[data-voce]').forEach((row) => {
    row.addEventListener('click', async () => {
      const voceId = row.dataset.voce;
      if (completate[voceId]) return; // già registrata oggi, nessuna azione
      await aggiungi('registrazioni_pulizia', {
        voce_id: voceId,
        registrato_da: profilo.id,
        registrato_il: new Date(),
      });
      segnalaScrittura();
      await renderPulizie(container, profilo);
    });
  });
}
