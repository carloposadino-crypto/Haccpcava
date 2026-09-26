import { leggiTutti, inizioEFineGiorno, oggiISO, where, orderBy } from './store.js';

const GIORNI_ALERT_SCADENZA = 3;

function dataScadenzaISO(value) {
  if (!value) return null;

  // Ricevimento merci salva la scadenza come testo, normalmente gg/mm/aaaa.
  // Accettiamo anche aaaa-mm-gg, gg-mm-aaaa e gg.mm.aaaa.
  const s = String(value).trim();
  let giorno, mese, anno;

  let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m) {
    giorno = Number(m[1]);
    mese = Number(m[2]);
    anno = Number(m[3]);
  } else {
    m = s.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
    if (!m) return null;
    anno = Number(m[1]);
    mese = Number(m[2]);
    giorno = Number(m[3]);
  }

  // Scarta date impossibili.
  const d = new Date(Date.UTC(anno, mese - 1, giorno));
  if (
    d.getUTCFullYear() !== anno ||
    d.getUTCMonth() !== mese - 1 ||
    d.getUTCDate() !== giorno
  ) return null;

  return `${anno}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`;
}

function formatDataBreve(iso) {
  const [a, m, g] = iso.split('-');
  return `${g}/${m}/${a}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
  const ricevimentiOggi = await leggiTutti('ricevimenti', [where('data_riferimento', '==', oggi)]);
  const conservazioniOggi = await leggiTutti('conservazioni', [where('data_riferimento', '==', oggi)]);

  const ricevimenti = await leggiTutti('ricevimenti');
  const oggiDate = new Date(`${oggi}T00:00:00`);
  const limiteDate = new Date(oggiDate);
  limiteDate.setDate(limiteDate.getDate() + GIORNI_ALERT_SCADENZA);
  const scadenzeAlert = [];

  ricevimenti.forEach((r) => {
    (Array.isArray(r.voci) ? r.voci : []).forEach((v) => {
      const scadenza = dataScadenzaISO(v.scadenza);
      if (!scadenza) return;
      const data = new Date(`${scadenza}T00:00:00`);
      if (Number.isNaN(data.getTime())) return;
      if (data <= limiteDate) {
        const diffGiorni = Math.round((data - oggiDate) / 86400000);
        scadenzeAlert.push({ nome: v.nome || 'Prodotto senza descrizione', lotto: v.lotto || '', scadenza, diffGiorni });
      }
    });
  });

  scadenzeAlert.sort((a, b) => a.scadenza.localeCompare(b.scadenza));

  const scaduti = scadenzeAlert.filter((p) => p.diffGiorni < 0);
  const inScadenza = scadenzeAlert.filter((p) => p.diffGiorni >= 0);

  container.innerHTML = `
    ${scadenzeAlert.length ? `
      <div class="list-card" style="border:1px solid ${scaduti.length ? '#dc2626' : '#f59e0b'}; background:${scaduti.length ? '#fef2f2' : '#fffbeb'}; margin-bottom:12px; padding:12px;">
        <div style="font-size:15px; font-weight:bold; color:${scaduti.length ? '#b91c1c' : '#92400e'}; margin-bottom:6px;">⚠️ Scadenze prodotti</div>
        <div style="font-size:12px; color:#475569; margin-bottom:10px;">${scaduti.length ? `${scaduti.length} prodotto/i già scaduto/i` : ''}${scaduti.length && inScadenza.length ? ' · ' : ''}${inScadenza.length ? `${inScadenza.length} in scadenza entro ${GIORNI_ALERT_SCADENZA} giorni` : ''}</div>
        ${scadenzeAlert.map((p) => `
          <div style="padding:8px 0; border-top:1px solid #e2e8f0;">
            <div style="font-size:13px; font-weight:600;">${escapeHtml(p.nome)}</div>
            <div style="font-size:12px; color:${p.diffGiorni < 0 ? '#b91c1c' : '#92400e'}; margin-top:2px;">
              ${p.diffGiorni < 0 ? `SCADUTO il ${formatDataBreve(p.scadenza)}` : p.diffGiorni === 0 ? `SCADENZA OGGI · ${formatDataBreve(p.scadenza)}` : `Scade il ${formatDataBreve(p.scadenza)} · tra ${p.diffGiorni} giorni`}${p.lotto ? ` · Lotto ${escapeHtml(p.lotto)}` : ''}
            </div>
          </div>
        `).join('')}
        <button type="button" class="btn btn-secondary btn-block" id="oggi-apri-ricevimento">Vai a Ricevimento merci</button>
      </div>
    ` : ''}
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
    <div class="check-row" data-vai="ricevimento">
      <span class="dot ${ricevimentiOggi.length > 0 ? 'ok' : 'pending'}"></span>
      <div class="rt"><div class="t">Ricevimento merci</div><div class="s">${ricevimentiOggi.length} consegne registrate oggi</div></div>
      <span class="chev">›</span>
    </div>
    <div class="check-row" data-vai="conservazione">
      <span class="dot ${conservazioniOggi.length > 0 ? 'ok' : 'pending'}"></span>
      <div class="rt"><div class="t">Conservazioni</div><div class="s">${conservazioniOggi.length} registrate oggi</div></div>
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

  const apriRicevimento = container.querySelector('#oggi-apri-ricevimento');
  if (apriRicevimento) apriRicevimento.addEventListener('click', () => vaiA('ricevimento'));

  container.querySelectorAll('[data-vai]').forEach((el) => {
    el.addEventListener('click', () => vaiA(el.dataset.vai));
  });
}
