// Piano Pulizie: elenca le voci configurate (giornaliere/settimanali/
// mensili) e permette di segnarle "fatte" per una data scelta (di
// solito oggi, ma anche un giorno passato dimenticato).
//
// Nota: le registrazioni_pulizia, come tutte le registrazioni HACCP, non
// si possono cancellare (vedi firestore.rules) — una volta segnata "fatta"
// una voce resta fatta per quella data, niente pulsante "annulla".
import { leggiTutti, aggiungi, where, orderBy, oggiISO } from './store.js';

const LABEL_FREQUENZA = { giornaliera: 'Ogni giorno', settimanale: 'Ogni settimana', mensile: 'Ogni mese' };

let dataSelezionata = oggiISO();

export async function renderPuliziePage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento piano pulizie…</div>`;

  const piano = await leggiTutti('piano_pulizie', [where('attivo', '==', true), orderBy('ordine', 'asc')]);
  if (piano.length === 0) {
    container.innerHTML = `
      <div class="top-bar"><h2>Pulizie</h2></div>
      <div class="empty-state">Nessuna voce nel piano pulizie. Un responsabile deve configurarlo su Firebase (collezione <code>piano_pulizie</code>).</div>`;
    return;
  }

  const fatte = await leggiTutti('registrazioni_pulizia', [where('data_riferimento', '==', dataSelezionata)]);
  const mappaFatte = new Map(fatte.map((f) => [f.voce_id, f]));

  const gruppi = { giornaliera: [], settimanale: [], mensile: [] };
  piano.forEach((v) => { (gruppi[v.frequenza] || gruppi.giornaliera).push(v); });

  const isOggi = dataSelezionata === oggiISO();

  container.innerHTML = `
    <div class="top-bar"><h2>Pulizie</h2></div>
    <div class="list-card no-print">
      <label class="field-label">Data</label>
      <input type="date" id="pl-data" value="${dataSelezionata}" max="${oggiISO()}">
      ${!isOggi ? '<div style="font-size:12px; color:#b45309; margin-top:6px;">⚠️ Stai registrando per una data passata, non per oggi.</div>' : ''}
    </div>
    ${Object.entries(gruppi).filter(([, voci]) => voci.length).map(([freq, voci]) => `
      <div class="list-card">
        <div style="padding:10px 0 4px; font-size:12px; font-weight:bold; color:#64748b; text-transform:uppercase;">${LABEL_FREQUENZA[freq]}</div>
        ${voci.map((v) => {
          const fatta = mappaFatte.get(v.id);
          return `
            <div class="check-row" data-toggle="${v.id}" style="${fatta ? 'cursor:default;' : ''}">
              <span class="dot ${fatta ? 'ok' : 'pending'}"></span>
              <div class="rt"><div class="t">${v.nome}</div></div>
              <span class="chev">${fatta ? '✓' : ''}</span>
            </div>`;
        }).join('')}
      </div>
    `).join('')}
  `;

  container.querySelector('#pl-data').addEventListener('change', (e) => {
    dataSelezionata = e.target.value;
    renderPuliziePage(container, profilo);
  });

  piano.forEach((v) => {
    if (mappaFatte.has(v.id)) return; // già fatta in quella data, non toccabile
    container.querySelector(`[data-toggle="${v.id}"]`).addEventListener('click', async (e) => {
      e.currentTarget.style.opacity = '0.5';
      try {
        await aggiungi('registrazioni_pulizia', { voce_id: v.id, data_riferimento: dataSelezionata, registrato_da: profilo.id }, 'registrato_il');
        renderPuliziePage(container, profilo);
      } catch (err) {
        console.error(err);
        alert('Errore di salvataggio.');
        e.currentTarget.style.opacity = '1';
      }
    });
  });
}
