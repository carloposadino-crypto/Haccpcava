// Storico: consultazione e stampa di tutte le registrazioni, con filtro
// per data e per categoria — utile per un controllo, dove spesso serve
// solo "l'ultimo mese" o "solo le temperature", non tutto l'archivio.

import { leggiTutti, orderBy } from './store.js';

const TIPO_LABEL = { cottura: 'Cottura normale', cbt: 'Sottovuoto/Roner (CBT)', abbattimento: 'Abbattimento', rigenerazione: 'Rigenerazione' };

const CATEGORIE = [
  ['temperature', 'Temperature'],
  ['processi', 'Cotture/Abbattimenti/Rigenerazioni'],
  ['pulizie', 'Pulizie effettuate'],
  ['ricevimenti', 'Ricevimento merci'],
  ['non_conformita', 'Non conformità'],
  ['schede', 'Schede HACCP'],
];

let datiCompleti = null; // caricati una sola volta, i filtri lavorano sui dati già scaricati

function dataDi(record, campo) {
  const ts = record[campo];
  if (!ts) return null;
  return ts.toDate ? ts.toDate() : new Date(ts);
}

function fmt(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export async function renderStoricoPage(container) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;

  if (!datiCompleti) {
    const [temperature, processi, pulizie, ricevimenti, nonConformita, schede] = await Promise.all([
      leggiTutti('rilevazioni_temperatura', [orderBy('registrato_il', 'desc')]).catch(() => []),
      leggiTutti('registrazioni_processo', [orderBy('registrato_il', 'desc')]).catch(() => []),
      leggiTutti('registrazioni_pulizia', [orderBy('registrato_il', 'desc')]).catch(() => []),
      leggiTutti('ricevimenti', [orderBy('registrato_il', 'desc')]).catch(() => []),
      leggiTutti('non_conformita', [orderBy('aperto_il', 'desc')]).catch(() => []),
      leggiTutti('schede_haccp', [orderBy('creato_il', 'desc')]).catch(() => []),
    ]);
    datiCompleti = { temperature, processi, pulizie, ricevimenti, non_conformita: nonConformita, schede };
  }

  const oggi = new Date().toISOString().slice(0, 10);
  const trentaGiorniFa = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  container.innerHTML = `
    <div class="print-only" style="display:none;">
      <h2 style="margin-bottom:2px;">Tenuta Agricola La Cava — Storico HACCP</h2>
      <div style="font-size:12px; color:#475569; margin-bottom:14px;">Documento generato il ${new Date().toLocaleString('it-IT')}</div>
    </div>
    <div class="top-bar">
      <h2>Storico</h2>
      <button class="btn btn-secondary no-print" id="st-stampa">🖶 Stampa / esporta PDF</button>
    </div>
    <div style="font-size:12px; color:#64748b; margin-bottom:8px;" class="no-print">Per salvare un PDF invece di stampare su carta: nella finestra di stampa scegli "Salva come PDF" come destinazione.</div>

    <div class="list-card no-print">
      <div class="form-row">
        <div><label class="field-label">Da</label><input type="date" id="st-da" value="${trentaGiorniFa}"></div>
        <div><label class="field-label">A</label><input type="date" id="st-a" value="${oggi}"></div>
      </div>
      <label class="field-label">Categorie</label>
      <div class="chip-group" id="st-categorie">
        ${CATEGORIE.map(([id, nome]) => `<span class="chip selected" data-categoria="${id}">${nome}</span>`).join('')}
      </div>
      <button class="btn btn-secondary btn-block" id="st-tutto-periodo" style="margin-top:4px;">Mostra tutto l'archivio (nessun limite di data)</button>
    </div>

    <div id="st-risultati"></div>
  `;

  const categorieAttive = new Set(CATEGORIE.map(([id]) => id));
  let senzaLimiteDiData = false;

  container.querySelectorAll('#st-categorie .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const cat = chip.dataset.categoria;
      if (categorieAttive.has(cat)) { categorieAttive.delete(cat); chip.classList.remove('selected'); }
      else { categorieAttive.add(cat); chip.classList.add('selected'); }
      applicaFiltri();
    });
  });

  container.querySelector('#st-da').addEventListener('change', applicaFiltri);
  container.querySelector('#st-a').addEventListener('change', applicaFiltri);
  container.querySelector('#st-tutto-periodo').addEventListener('click', () => {
    senzaLimiteDiData = !senzaLimiteDiData;
    container.querySelector('#st-tutto-periodo').textContent = senzaLimiteDiData ? 'Torna a filtrare per data' : "Mostra tutto l'archivio (nessun limite di data)";
    applicaFiltri();
  });
  container.querySelector('#st-stampa').addEventListener('click', () => window.print());

  function applicaFiltri() {
    const da = senzaLimiteDiData ? null : new Date(container.querySelector('#st-da').value + 'T00:00:00');
    const a = senzaLimiteDiData ? null : new Date(container.querySelector('#st-a').value + 'T23:59:59');
    const nelPeriodo = (d) => !d || senzaLimiteDiData || ((!da || d >= da) && (!a || d <= a));

    const risultati = container.querySelector('#st-risultati');
    const sezione = (id, titolo, righeHtml, vuoto) => !categorieAttive.has(id) ? '' : `
      <h3 style="font-size:14px; color:#64748b; margin: 16px 0 8px;">${titolo}</h3>
      <div class="list-card">${righeHtml || `<div class="empty-state">${vuoto}</div>`}</div>
    `;

    const dataRif = (record, campoFallback) => record.data_riferimento ? new Date(record.data_riferimento + 'T12:00:00') : dataDi(record, campoFallback);
    const temperature = datiCompleti.temperature.filter((t) => nelPeriodo(dataRif(t, 'registrato_il')));
    const processi = datiCompleti.processi.filter((p) => nelPeriodo(dataRif(p, 'registrato_il')));
    const pulizie = datiCompleti.pulizie.filter((p) => nelPeriodo(dataRif(p, 'registrato_il')));
    const ricevimenti = datiCompleti.ricevimenti.filter((r) => nelPeriodo(dataRif(r, 'registrato_il')));
    const nonConformita = datiCompleti.non_conformita.filter((n) => nelPeriodo(dataDi(n, 'aperto_il')));
    const schede = datiCompleti.schede.filter((s) => nelPeriodo(dataDi(s, 'creato_il')));

    risultati.innerHTML = `
      ${sezione('temperature', `Temperature (${temperature.length})`, temperature.map((t) => `
        <div class="check-row" style="cursor:default;">
          <span class="dot ${t.esito === 'fuori_limite' ? 'warn' : 'ok'}"></span>
          <div class="rt"><div class="t">${t.valore}°C — ${t.esito === 'fuori_limite' ? 'fuori limite' : 'nella norma'}</div><div class="s">${fmt(t.registrato_il)}</div></div>
        </div>
      `).join(''), 'Nessuna registrazione nel periodo scelto.')}

      ${sezione('processi', `Cotture / Abbattimenti / Rigenerazioni (${processi.length})`, processi.map((p) => `
        <div class="check-row" style="cursor:default;">
          <div class="rt">
            <div class="t">${TIPO_LABEL[p.tipo] || p.tipo} — ${p.prodotto || ''}</div>
            <div class="s">${p.valori?.temperatura_inizio_c ?? '—'}°C → ${p.valori?.temperatura_fine_c ?? '—'}°C${p.valori?.durata_min ? ' · ' + p.valori.durata_min + ' min' : ''} · ${fmt(p.registrato_il)}</div>
          </div>
        </div>
      `).join(''), 'Nessuna registrazione nel periodo scelto.')}

      ${sezione('pulizie', `Pulizie effettuate (${pulizie.length})`, pulizie.map((p) => `
        <div class="check-row" style="cursor:default;">
          <span class="dot ok"></span>
          <div class="rt"><div class="t">Voce ${p.voce_id}</div><div class="s">${fmt(p.registrato_il)}</div></div>
        </div>
      `).join(''), 'Nessuna registrazione nel periodo scelto.')}

      ${sezione('ricevimenti', `Ricevimento merci (${ricevimenti.length})`, ricevimenti.map((r) => `
        <div class="check-row" style="cursor:default;">
          <span class="dot ${r.conformita === 'non_conforme' ? 'warn' : 'ok'}"></span>
          <div class="rt">
            <div class="t">${r.fornitore_nome}${r.numero_documento ? ' — ' + r.numero_documento : ''}</div>
            <div class="s">${(r.voci || []).map((v) => v.nome).join(', ') || '—'} · ${fmt(r.registrato_il)}</div>
          </div>
        </div>
      `).join(''), 'Nessuna registrazione nel periodo scelto.')}

      ${sezione('non_conformita', `Non conformità (${nonConformita.length})`, nonConformita.map((n) => `
        <div class="check-row" style="cursor:default;">
          <span class="dot ${n.stato === 'chiusa' ? 'ok' : 'warn'}"></span>
          <div class="rt"><div class="t">${n.problema}</div><div class="s">${fmt(n.aperto_il)} · ${n.stato}${n.azione ? ' · ' + n.azione : ''}</div></div>
        </div>
      `).join(''), 'Nessuna registrazione nel periodo scelto.')}

      ${sezione('schede', `Schede HACCP (${schede.length})`, schede.map((s) => `
        <div class="check-row" style="cursor:default;">
          <span class="dot ${s.stato === 'approvata' ? 'ok' : 'pending'}"></span>
          <div class="rt"><div class="t">${s.nome}${s.codice ? ' — ' + s.codice : ''}</div><div class="s">${s.stato} · creata il ${fmt(s.creato_il)}</div></div>
        </div>
      `).join(''), 'Nessuna scheda nel periodo scelto.')}
    `;
  }

  applicaFiltri();
}
