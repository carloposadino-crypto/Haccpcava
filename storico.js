// Storico: legge da Firestore (ultimi ~60 giorni per collezione, un numero
// ampio per una singola attività) e raggruppa i risultati per data lato
// client. Grazie alla cache persistente di Firestore, funziona anche
// offline con l'ultima copia scaricata; a differenza della versione
// precedente basata su IndexedDB locale, qui i dati sono condivisi tra
// dispositivi diversi collegati allo stesso account, non solo su questo.

import { leggiTutti, toData, orderBy, limit } from '../../lib/store.js';

function fmtDataLunga(key) {
  return new Date(`${key}T12:00:00`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtOra(d) {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
function chiaveData(d) {
  return d.toISOString().slice(0, 10);
}

const TIPI_PROCESSO = [['cbt', 'Cottura CBT'], ['abbattimento', 'Abbattimento'], ['rigenerazione', 'Rigenerazione']];
const ETICHETTE_ANOMALIA = {
  frigorifero: 'Frigorifero', cottura: 'Cottura', abbattimento: 'Abbattimento',
  rigenerazione: 'Rigenerazione', pulizie: 'Pulizie', fornitore: 'Fornitore', prodotto: 'Prodotto', altro: 'Altro',
};

let aperti = {};
let datiCache = null;

async function caricaDati() {
  if (datiCache) return datiCache;
  const LIMITE = 300;
  const [apparecchiature, piano, rilevazioni, processi, pulizie, anomalie, ricevimenti] = await Promise.all([
    leggiTutti('apparecchiature'),
    leggiTutti('piano_pulizie'),
    leggiTutti('rilevazioni_temperatura', [orderBy('registrato_il', 'desc'), limit(LIMITE)]),
    leggiTutti('registrazioni_processo', [orderBy('registrato_il', 'desc'), limit(LIMITE)]),
    leggiTutti('registrazioni_pulizia', [orderBy('registrato_il', 'desc'), limit(LIMITE)]),
    leggiTutti('non_conformita', [orderBy('aperto_il', 'desc'), limit(LIMITE)]),
    leggiTutti('ricevimenti', [orderBy('registrato_il', 'desc'), limit(LIMITE)]),
  ]);
  datiCache = { apparecchiature, piano, rilevazioni, processi, pulizie, anomalie, ricevimenti };
  return datiCache;
}

function raggruppaPerData(dati) {
  const date = new Set();
  const per = {
    rilevazioni: {}, processi: {}, pulizie: {}, anomalie: {}, ricevimenti: {},
  };
  dati.rilevazioni.forEach((r) => { const k = chiaveData(toData(r.registrato_il)); date.add(k); (per.rilevazioni[k] ??= []).push(r); });
  dati.processi.forEach((r) => { const k = chiaveData(toData(r.registrato_il)); date.add(k); (per.processi[k] ??= []).push(r); });
  dati.pulizie.forEach((r) => { const k = chiaveData(toData(r.registrato_il)); date.add(k); (per.pulizie[k] ??= []).push(r); });
  dati.anomalie.forEach((r) => { const k = chiaveData(toData(r.aperto_il)); date.add(k); (per.anomalie[k] ??= []).push(r); });
  dati.ricevimenti.forEach((r) => { const k = chiaveData(toData(r.registrato_il)); date.add(k); (per.ricevimenti[k] ??= []).push(r); });
  return { date: Array.from(date).sort().reverse(), per };
}

export async function renderStorico(container) {
  const dati = await caricaDati();
  const { date, per } = raggruppaPerData(dati);

  container.innerHTML = `
    <button class="btn btn-ghost btn-block" id="stampa-tutto" style="margin-bottom:14px;">🖨️ Stampa registro completo</button>
    <div id="storico-list">${date.length === 0 ? '<div class="empty">Ancora nessuna registrazione in archivio.</div>' : ''}</div>
    <div id="print-area"></div>
  `;

  container.querySelector('#stampa-tutto').addEventListener('click', () => stampa(container, dati, per, date));

  const listEl = container.querySelector('#storico-list');
  listEl.innerHTML = date.map((key) => `
    <div class="history-day">
      <div class="hd-head" data-toggle="${key}">
        <span class="d">${fmtDataLunga(key)}</span>
        <div style="display:flex; align-items:center; gap:10px;">
          <button data-print-day="${key}" class="btn-ghost" style="padding:5px 10px;font-size:11px;border-radius:8px;">Stampa</button>
          <span class="chev">${aperti[key] ? '▾' : '›'}</span>
        </div>
      </div>
      <div class="hd-body" data-body="${key}" style="${aperti[key] ? '' : 'display:none;'}">${aperti[key] ? corpoGiornata(dati, per, key) : ''}</div>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-toggle]').forEach((el) => {
    el.addEventListener('click', () => {
      const key = el.dataset.toggle;
      aperti[key] = !aperti[key];
      const body = listEl.querySelector(`[data-body="${key}"]`);
      body.style.display = aperti[key] ? '' : 'none';
      if (aperti[key]) body.innerHTML = corpoGiornata(dati, per, key);
      el.querySelector('.chev').textContent = aperti[key] ? '▾' : '›';
    });
  });

  listEl.querySelectorAll('[data-print-day]').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      stampa(container, dati, per, [btn.dataset.printDay]);
    });
  });
}

function corpoGiornata(dati, per, key) {
  const rilevazioni = per.rilevazioni[key] || [];
  const righeTemp = rilevazioni.map((r) => {
    const app = dati.apparecchiature.find((a) => a.id === r.apparecchiatura_id);
    return `<div class="row-line"><span class="l">${app ? app.nome : 'Apparecchiatura'}</span><span style="color:${r.esito === 'nella_norma' ? 'var(--good)' : 'var(--bad)'}">${r.valore}°C · ${fmtOra(toData(r.registrato_il))}</span></div>`;
  }).join('') || '<div class="row-line"><span class="l">Nessuna rilevazione</span></div>';

  const processi = per.processi[key] || [];
  const righeProcessi = processi.map((p) => {
    const label = (TIPI_PROCESSO.find(([t]) => t === p.tipo) || [, p.tipo])[1];
    return `<div class="row-line"><span class="l">${label} — ${p.prodotto}</span><span>${fmtOra(toData(p.registrato_il))}</span></div>`;
  }).join('') || '<div class="row-line"><span class="l">Nessuna registrazione</span></div>';

  const pulizie = per.pulizie[key] || [];
  const righePulizie = dati.piano.filter((v) => pulizie.some((p) => p.voce_id === v.id)).map((v) => {
    const p = pulizie.find((x) => x.voce_id === v.id);
    return `<div class="row-line"><span class="l">${v.nome}</span><span>${fmtOra(toData(p.registrato_il))}</span></div>`;
  }).join('') || '<div class="row-line"><span class="l">Nessuna pulizia registrata</span></div>';

  const anomalie = per.anomalie[key] || [];
  const righeAnomalie = anomalie.map((a) => `<div class="row-line"><span class="l">${ETICHETTE_ANOMALIA[a.categoria] || a.categoria}</span><span>${fmtOra(toData(a.aperto_il))}</span></div>`).join('');

  const ricevimenti = per.ricevimenti[key] || [];
  const righeRicevimenti = ricevimenti.map((r) => `<div class="row-line"><span class="l">${r.prodotto_nome || 'Prodotto'}</span><span>${fmtOra(toData(r.registrato_il))}</span></div>`).join('');

  return `
    <p class="section-title">Temperature</p>${righeTemp}
    <p class="section-title">Registro processi</p>${righeProcessi}
    <p class="section-title">Pulizie</p>${righePulizie}
    ${righeAnomalie ? `<p class="section-title">Anomalie</p>${righeAnomalie}` : ''}
    ${righeRicevimenti ? `<p class="section-title">Ricevimenti</p>${righeRicevimenti}` : ''}
  `;
}

function stampa(container, dati, per, date) {
  let html = `
    <h1 style="font-size:19px;margin-bottom:2px;">Registro HACCP — Tenuta Agricola La Cava</h1>
    <p style="font-size:11.5px;color:#555;margin-top:0;">Stampato il ${new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })} alle ${fmtOra(new Date())}</p>
  `;
  for (const key of date) {
    const rilevazioni = per.rilevazioni[key] || [];
    const tabellaTemp = rilevazioni.map((r) => {
      const app = dati.apparecchiature.find((a) => a.id === r.apparecchiatura_id);
      return `<tr><td>${app ? app.nome : ''}</td><td>${r.valore}°C</td><td>${r.esito === 'nella_norma' ? 'OK' : 'FUORI RANGE'}</td></tr>`;
    }).join('') || '<tr><td colspan="3">Nessuna rilevazione</td></tr>';

    const processi = per.processi[key] || [];
    const tabellaProcessi = processi.map((p) => {
      const label = (TIPI_PROCESSO.find(([t]) => t === p.tipo) || [, p.tipo])[1];
      return `<tr><td>${label}</td><td>${p.prodotto}</td><td>${p.valori.temperatura_c ?? ''}°C${p.valori.tempo_min !== undefined ? ' · ' + p.valori.tempo_min + ' min' : ''}</td><td>${p.esito === 'ok' ? 'OK' : p.esito === 'fuori_limite' ? 'FUORI LIMITE' : '—'}</td></tr>`;
    }).join('') || '<tr><td colspan="4">Nessuna registrazione</td></tr>';

    const pulizie = per.pulizie[key] || [];
    const tabellaPulizie = dati.piano.map((v) => {
      const p = pulizie.find((x) => x.voce_id === v.id);
      return `<tr><td>${v.nome}</td><td>${p ? 'Fatto ore ' + fmtOra(toData(p.registrato_il)) : '—'}</td></tr>`;
    }).join('');

    const anomalie = per.anomalie[key] || [];
    const tabellaAnomalie = anomalie.map((a) => `<tr><td>${ETICHETTE_ANOMALIA[a.categoria] || a.categoria}</td><td>${a.problema}</td><td>${fmtOra(toData(a.aperto_il))}</td></tr>`).join('');

    const ricevimenti = per.ricevimenti[key] || [];
    const tabellaRicevimenti = ricevimenti.map((r) => `<tr><td>${r.prodotto_nome || ''}</td><td>${r.conformita ? 'Conforme' : 'Non conforme'}</td><td>${fmtOra(toData(r.registrato_il))}</td></tr>`).join('');

    html += `
      <div style="page-break-inside:avoid;margin-top:20px;">
        <h2 style="font-size:14.5px;border-bottom:1px solid #999;padding-bottom:4px;text-transform:capitalize;">${fmtDataLunga(key)}</h2>
        <h3 style="font-size:12px;margin:8px 0 3px;">Temperature</h3>
        <table>${tabellaTemp}</table>
        <h3 style="font-size:12px;margin:8px 0 3px;">Registro processi</h3>
        <table>${tabellaProcessi}</table>
        <h3 style="font-size:12px;margin:8px 0 3px;">Pulizie</h3>
        <table>${tabellaPulizie}</table>
        ${tabellaAnomalie ? `<h3 style="font-size:12px;margin:8px 0 3px;">Anomalie</h3><table>${tabellaAnomalie}</table>` : ''}
        ${tabellaRicevimenti ? `<h3 style="font-size:12px;margin:8px 0 3px;">Ricevimenti</h3><table>${tabellaRicevimenti}</table>` : ''}
      </div>
    `;
  }
  container.querySelector('#print-area').innerHTML = html;
  window.print();
}
