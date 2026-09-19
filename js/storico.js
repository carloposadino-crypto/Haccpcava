// Storico: consultazione e stampa di tutte le registrazioni, utile per
// un controllo. Il pulsante "Stampa" usa la stampa del browser: si può
// anche scegliere "Salva come PDF" invece di una stampante fisica, per
// avere un file da esportare/allegare.

import { leggiTutti, orderBy } from './store.js';

const TIPO_LABEL = { cottura: 'Cottura normale', cbt: 'Sottovuoto/Roner (CBT)', abbattimento: 'Abbattimento', rigenerazione: 'Rigenerazione' };

export async function renderStoricoPage(container) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;

  const [temperature, processi, pulizie, ricevimenti, nonConformita, schede] = await Promise.all([
    leggiTutti('rilevazioni_temperatura', [orderBy('registrato_il', 'desc')]).catch(() => []),
    leggiTutti('registrazioni_processo', [orderBy('registrato_il', 'desc')]).catch(() => []),
    leggiTutti('registrazioni_pulizia', [orderBy('registrato_il', 'desc')]).catch(() => []),
    leggiTutti('ricevimenti', [orderBy('registrato_il', 'desc')]).catch(() => []),
    leggiTutti('non_conformita', [orderBy('aperto_il', 'desc')]).catch(() => []),
    leggiTutti('schede_haccp', [orderBy('creato_il', 'desc')]).catch(() => []),
  ]);

  const fmt = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const sezione = (titolo, righeHtml, vuoto) => `
    <h3 style="font-size:14px; color:#64748b; margin: 16px 0 8px;">${titolo}</h3>
    <div class="list-card">${righeHtml || `<div class="empty-state">${vuoto}</div>`}</div>
  `;

  container.innerHTML = `
    <div class="top-bar">
      <h2>Storico</h2>
      <button class="btn btn-secondary no-print" id="st-stampa">🖶 Stampa / esporta PDF</button>
    </div>
    <div style="font-size:12px; color:#64748b; margin-bottom:8px;" class="no-print">Per salvare un PDF invece di stampare su carta: nella finestra di stampa scegli "Salva come PDF" come destinazione.</div>

    ${sezione(`Temperature (${temperature.length})`, temperature.map((t) => `
      <div class="check-row" style="cursor:default;">
        <span class="dot ${t.esito === 'fuori_limite' ? 'warn' : 'ok'}"></span>
        <div class="rt"><div class="t">${t.valore}°C — ${t.esito === 'fuori_limite' ? 'fuori limite' : 'nella norma'}</div><div class="s">${fmt(t.registrato_il)}</div></div>
      </div>
    `).join(''), 'Nessuna registrazione.')}

    ${sezione(`Cotture / Abbattimenti / Rigenerazioni (${processi.length})`, processi.map((p) => `
      <div class="check-row" style="cursor:default;">
        <div class="rt">
          <div class="t">${TIPO_LABEL[p.tipo] || p.tipo} — ${p.prodotto || ''}</div>
          <div class="s">${p.valori?.temperatura_inizio_c ?? '—'}°C → ${p.valori?.temperatura_fine_c ?? '—'}°C${p.valori?.durata_min ? ' · ' + p.valori.durata_min + ' min' : ''} · ${fmt(p.registrato_il)}</div>
        </div>
      </div>
    `).join(''), 'Nessuna registrazione.')}

    ${sezione(`Pulizie effettuate (${pulizie.length})`, pulizie.map((p) => `
      <div class="check-row" style="cursor:default;">
        <span class="dot ok"></span>
        <div class="rt"><div class="t">Voce ${p.voce_id}</div><div class="s">${fmt(p.registrato_il)}</div></div>
      </div>
    `).join(''), 'Nessuna registrazione.')}

    ${sezione(`Ricevimento merci (${ricevimenti.length})`, ricevimenti.map((r) => `
      <div class="check-row" style="cursor:default;">
        <span class="dot ${r.conformita === 'non_conforme' ? 'warn' : 'ok'}"></span>
        <div class="rt">
          <div class="t">${r.fornitore_nome}${r.numero_documento ? ' — ' + r.numero_documento : ''}</div>
          <div class="s">${(r.voci || []).map((v) => v.nome).join(', ') || '—'} · ${fmt(r.registrato_il)}</div>
        </div>
      </div>
    `).join(''), 'Nessuna registrazione.')}

    ${sezione(`Non conformità (${nonConformita.length})`, nonConformita.map((n) => `
      <div class="check-row" style="cursor:default;">
        <span class="dot ${n.stato === 'chiusa' ? 'ok' : 'warn'}"></span>
        <div class="rt"><div class="t">${n.problema}</div><div class="s">${fmt(n.aperto_il)} · ${n.stato}${n.azione ? ' · ' + n.azione : ''}</div></div>
      </div>
    `).join(''), 'Nessuna registrazione.')}

    ${sezione(`Schede HACCP (${schede.length})`, schede.map((s) => `
      <div class="check-row" style="cursor:default;">
        <span class="dot ${s.stato === 'approvata' ? 'ok' : 'pending'}"></span>
        <div class="rt"><div class="t">${s.nome}${s.codice ? ' — ' + s.codice : ''}</div><div class="s">${s.stato} · creata il ${fmt(s.creato_il)}</div></div>
      </div>
    `).join(''), 'Nessuna scheda creata.')}
  `;

  container.querySelector('#st-stampa').addEventListener('click', () => window.print());
}
