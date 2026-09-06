import { leggiTutti, inizioEFineGiorno, oggiISO, where, orderBy } from '../../lib/store.js';

export async function renderOggi(container, profilo, vaiA) {
  const { inizio, fine } = inizioEFineGiorno(oggiISO());

  const apparecchiature = await leggiTutti('apparecchiature', [where('attivo', '==', true)]);
  const rilevazioni = await leggiTutti('rilevazioni_temperatura', [where('registrato_il', '>=', inizio), where('registrato_il', '<=', fine)]);
  const apparecchiatureRilevate = new Set(rilevazioni.map((r) => r.apparecchiatura_id));
  const fuoriRange = rilevazioni.some((r) => r.esito === 'fuori_limite');

  let processiOggi = 0;
  for (const tipo of ['cbt', 'abbattimento', 'rigenerazione']) {
    const r = await leggiTutti('registrazioni_processo', [where('tipo', '==', tipo), where('registrato_il', '>=', inizio), where('registrato_il', '<=', fine)]);
    processiOggi += r.length;
  }

  const piano = await leggiTutti('piano_pulizie', [where('attivo', '==', true)]);
  const pianoGiornaliero = piano.filter((v) => v.frequenza === 'giornaliera');
  const pulizieOggi = await leggiTutti('registrazioni_pulizia', [where('registrato_il', '>=', inizio), where('registrato_il', '<=', fine)]);
  const voceIdCompletate = new Set(pulizieOggi.map((p) => p.voce_id));
  const pulizieDoneCount = pianoGiornaliero.filter((v) => voceIdCompletate.has(v.id)).length;

  const anomalie = await leggiTutti('non_conformita', [where('aperto_il', '>=', inizio), where('aperto_il', '<=', fine)]);

  container.innerHTML = `
    <div class="check-row" data-vai="controlli">
      <span class="dot ${apparecchiatureRilevate.size === 0 ? 'pending' : fuoriRange ? 'warn' : apparecchiatureRilevate.size === apparecchiature.length ? 'ok' : 'pending'}"></span>
      <div class="rt">
        <div class="t">Temperature frigoriferi</div>
        <div class="s">${apparecchiatureRilevate.size}/${apparecchiature.length} registrate${fuoriRange ? ' — una fuori range' : ''}</div>
      </div>
      <span class="chev">›</span>
    </div>
    <div class="check-row" data-vai="controlli">
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
