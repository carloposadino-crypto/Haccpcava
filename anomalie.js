import { leggiTutti, toData, inizioEFineGiorno, oggiISO, where, orderBy } from '../../lib/store.js';
import { apriModaleAnomalia } from '../../components/anomalia-modal.js';

function fmtOra(d) {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
const ETICHETTE = {
  frigorifero: 'Frigorifero', cottura: 'Cottura', abbattimento: 'Abbattimento',
  rigenerazione: 'Rigenerazione', pulizie: 'Pulizie', fornitore: 'Fornitore',
  prodotto: 'Prodotto', altro: 'Altro',
};

export async function renderAnomalie(container, profilo) {
  const { inizio, fine } = inizioEFineGiorno(oggiISO());
  const oggi = await leggiTutti('non_conformita', [
    where('aperto_il', '>=', inizio), where('aperto_il', '<=', fine), orderBy('aperto_il', 'desc'),
  ]);

  container.innerHTML = `
    <button class="btn btn-primary btn-block" id="nuova-anomalia" style="margin-bottom:16px;">Segnala una nuova anomalia</button>
    <p class="section-title">Oggi</p>
    ${oggi.length === 0 ? '<div class="empty">Nessuna anomalia segnalata oggi.</div>' : oggi.map(riga).join('')}
  `;

  container.querySelector('#nuova-anomalia').addEventListener('click', () => {
    apriModaleAnomalia(profilo, () => renderAnomalie(container, profilo));
  });
}

function riga(a) {
  return `
    <div class="entry-row">
      <div class="top"><span class="name">${ETICHETTE[a.categoria] || a.categoria}</span><span class="badge bad">${fmtOra(toData(a.aperto_il))}</span></div>
      <div class="meta">${escapeHtml(a.problema)}</div>
    </div>
  `;
}
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
