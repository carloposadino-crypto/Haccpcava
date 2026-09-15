// Piano Pulizie: elenca le voci configurate (giornaliere/settimanali/
// mensili) e permette di segnare "fatto" per oggi. Ogni tap crea una
// registrazione in registrazioni_pulizia; se è già stata fatta oggi,
// il tap successivo la annulla (toggle).

// Nota: le registrazioni_pulizia, come tutte le registrazioni HACCP, non
// si possono cancellare (vedi firestore.rules) — una volta segnata "fatta"
// una voce resta fatta per la giornata, niente pulsante "annulla".
import { leggiTutti, aggiungi, where, orderBy, oggiISO, inizioEFineGiorno } from './store.js';

const LABEL_FREQUENZA = { giornaliera: 'Ogni giorno', settimanale: 'Ogni settimana', mensile: 'Ogni mese' };

export async function renderPuliziePage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento piano pulizie…</div>`;

  const piano = await leggiTutti('piano_pulizie', [where('attivo', '==', true), orderBy('ordine', 'asc')]);
  if (piano.length === 0) {
    container.innerHTML = `
      <div class="top-bar"><h2>Pulizie</h2></div>
      <div class="empty-state">Nessuna voce nel piano pulizie. Un responsabile deve configurarlo su Firebase (collezione <code>piano_pulizie</code>).</div>`;
    return;
  }

  const { inizio, fine } = inizioEFineGiorno(oggiISO());
  const fatteOggi = await leggiTutti('registrazioni_pulizia', [where('registrato_il', '>=', inizio), where('registrato_il', '<=', fine)]);
  const mappaFatte = new Map(fatteOggi.map((f) => [f.voce_id, f]));

  const gruppi = { giornaliera: [], settimanale: [], mensile: [] };
  piano.forEach((v) => { (gruppi[v.frequenza] || gruppi.giornaliera).push(v); });

  container.innerHTML = `
    <div class="top-bar"><h2>Pulizie — ${oggiISO()}</h2></div>
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

  piano.forEach((v) => {
    if (mappaFatte.has(v.id)) return; // già fatta oggi, non toccabile
    container.querySelector(`[data-toggle="${v.id}"]`).addEventListener('click', async (e) => {
      e.currentTarget.style.opacity = '0.5';
      try {
        await aggiungi('registrazioni_pulizia', { voce_id: v.id, registrato_da: profilo.id }, 'registrato_il');
        renderPuliziePage(container, profilo);
      } catch (err) {
        console.error(err);
        alert('Errore di salvataggio.');
        e.currentTarget.style.opacity = '1';
      }
    });
  });
}
