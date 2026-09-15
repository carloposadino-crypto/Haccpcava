// Storico: consultazione delle registrazioni degli ultimi giorni, con
// stampa dell'elenco per eventuali controlli. Fase 1: mostra le
// registrazioni di temperatura e le non conformità (le categorie più
// richieste in un controllo); le altre collezioni si possono aggiungere
// allo stesso modo quando servirà.

import { leggiTutti, orderBy } from './store.js';

export async function renderStoricoPage(container) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;

  const [temperature, nonConformita] = await Promise.all([
    leggiTutti('rilevazioni_temperatura', [orderBy('registrato_il', 'desc')]).catch(() => []),
    leggiTutti('non_conformita', [orderBy('aperto_il', 'desc')]).catch(() => []),
  ]);

  const fmt = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  container.innerHTML = `
    <div class="top-bar">
      <h2>Storico</h2>
      <button class="btn btn-secondary no-print" id="st-stampa">Stampa</button>
    </div>

    <h3 style="font-size:14px; color:#64748b; margin-bottom:8px;">Ultime temperature (${temperature.length})</h3>
    <div class="list-card">
      ${temperature.slice(0, 30).map((t) => `
        <div class="check-row" style="cursor:default;">
          <span class="dot ${t.esito === 'fuori_limite' ? 'warn' : 'ok'}"></span>
          <div class="rt"><div class="t">${t.valore}°C</div><div class="s">${fmt(t.registrato_il)}</div></div>
        </div>
      `).join('') || '<div class="empty-state">Nessuna registrazione.</div>'}
    </div>

    <h3 style="font-size:14px; color:#64748b; margin: 16px 0 8px;">Non conformità (${nonConformita.length})</h3>
    <div class="list-card">
      ${nonConformita.slice(0, 30).map((n) => `
        <div class="check-row" style="cursor:default;">
          <span class="dot ${n.stato === 'chiusa' ? 'ok' : 'warn'}"></span>
          <div class="rt"><div class="t">${n.problema}</div><div class="s">${fmt(n.aperto_il)} · ${n.stato}</div></div>
        </div>
      `).join('') || '<div class="empty-state">Nessuna registrazione.</div>'}
    </div>
  `;

  container.querySelector('#st-stampa').addEventListener('click', () => window.print());
}
