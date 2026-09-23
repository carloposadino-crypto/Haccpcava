import { leggiTutti, inizioEFineGiorno, oggiISO, where, orderBy } from './store.js';

function isAbbattitore(a) {
  const nome = String(a.nome || '').toLowerCase();
  const tipo = String(a.tipo || '').toLowerCase();
  return tipo === 'abbattitore' || nome.includes('abbattitore');
}

export async function renderOggi(container, profilo, vaiA) {
  const { inizio, fine } = inizioEFineGiorno(oggiISO());
  const oggi = oggiISO();

  // L'abbattitore non è un'apparecchiatura soggetta al controllo giornaliero:
  // viene controllato nel Registro Processi quando viene utilizzato.
  const tutteApparecchiature = await leggiTutti('attrezzature');
  const apparecchiature = tutteApparecchiature.filter((a) => !isAbbattitore(a));
  const rilevazioni = await leggiTutti('rilevazioni_temperatura', [where('data_riferimento', '==', oggi)]);
  const rilevazioniConservazione = rilevazioni.filter((r) => apparecchiature.some((a) => a.id === r.apparecchiatura_id));
  const apparecchiatureRilevate = new Set(rilevazioniConservazione.map((r) => r.apparecchiatura_id));
  const fuoriRange = rilevazioniConservazione.some((r) => r.esito === 'fuori_limite');

  const processiOggi = (await leggiTutti('registrazioni_processo', [
    where('data_riferimento', '==', oggi),
  ])).length;

  const piano = await leggiTutti('piano_pulizie', [where('attivo', '==', true)]);
  const pianoGiornaliero = piano.filter((v) => v.frequenza === 'giornaliera');
  const pulizieOggi = await leggiTutti('registrazioni_pulizia', [where('data_riferimento', '==', oggi)]);
  const voceIdCompletate = new Set(pulizieOggi.map((p) => p.voce_id));
  const pulizieDoneCount = pianoGiornaliero.filter((v) => voceIdCompletate.has(v.id)).length;

  const anomalie = await leggiTutti('non_conformita', [where('aperto_il', '>=', inizio), where('aperto_il', '<=', fine)]);

  container.innerHTML = `
    <div class="check-row" data-vai="temperature">
      <span class="dot ${apparecchiatureRilevate.size === 0 ? 'pending' : fuoriRange ? 'warn' : apparecchiatureRilevate.size === apparecchiature.length ? 'ok' : 'pending'}"></span>
      <div class="rt">
        <div class="t">Temperature frigoriferi</div>
        <div class="s">${apparecchiatureRilevate.size}/${apparecchiature.length} registrate${fuoriRange ? ' — una fuori range' : ''}</div>
      </div>
      <span class="chev">›</span>
    </div>
    <div class="check-row" data-vai="registro">
      <span class="dot ${processiOggi > 0 ? 'ok' : 'pending'}"></span>
      <div class="rt">
        <div class="t">Cotture / abbattimenti / rigenerazioni</div>
        <div class="s">${processiOggi > 0 ? processiOggi + ' registrazioni oggi' : 'Nessuna registrazione'}</div>
      </div>
      <span class="chev">›</span>
    </div>
    <div class="check-row" data-vai="pulizie">
      <span class="dot ${pulizieDoneCount === 0 ? 'pending' : pulizieDoneCount === pianoGiornaliero.length ? 'ok' : 'pending'}"></span>
      <div class="rt">
        <div class="t">Pulizie giornaliere</div>
        <div class="s">${pulizieDoneCount}/${pianoGiornaliero.length} completate</div>
      </div>
      <span class="chev">›</span>
    </div>
    <div class="check-row" data-vai="anomalie">
      <span class="dot ${anomalie.length === 0 ? 'ok' : 'warn'}"></span>
      <div class="rt">
        <div class="t">Anomalie</div>
        <div class="s">${anomalie.length === 0 ? 'Nessuna oggi' : anomalie.length + ' segnalate oggi'}</div>
      </div>
      <span class="chev">›</span>
    </div>
  `;

  container.querySelectorAll('[data-vai]').forEach((el) => {
    el.addEventListener('click', () => vaiA(el.dataset.vai));
  });
}
