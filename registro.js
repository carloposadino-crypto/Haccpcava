// Registro processi: CBT, abbattimento, rigenerazione.
// I limiti NON sono fissi nel codice: se per il tipo scelto esiste una
// procedura approvata (collezione procedure_approvate), l'utente può
// selezionarla e l'esito viene calcolato sui suoi parametri. Se non ne
// seleziona una, la registrazione viene comunque salvata, senza giudizio
// automatico di esito.
//
// Convenzione dei campi in procedure_approvate.parametri (mappa):
//   temperatura_min_c, temperatura_max_c, tempo_min_min, tempo_max_min

import { aggiungi, leggiTutti, toData, inizioEFineGiorno, oggiISO, where, orderBy } from '../../lib/store.js';
import { segnalaScrittura } from '../../lib/sync-status.js';

const TIPI = [
  ['cbt', 'Cottura CBT'],
  ['abbattimento', 'Abbattimento'],
  ['rigenerazione', 'Rigenerazione'],
];

let tipoCorrente = 'cbt';

function fmtOra(d) {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function calcolaEsito(parametri, valori) {
  if (!parametri) return null;
  let ok = true;
  if (parametri.temperatura_min_c != null && valori.temperatura_c < parametri.temperatura_min_c) ok = false;
  if (parametri.temperatura_max_c != null && valori.temperatura_c > parametri.temperatura_max_c) ok = false;
  if (parametri.tempo_min_min != null && valori.tempo_min < parametri.tempo_min_min) ok = false;
  if (parametri.tempo_max_min != null && valori.tempo_min > parametri.tempo_max_min) ok = false;
  return ok ? 'ok' : 'fuori_limite';
}

function descrizioneParametri(p) {
  const parti = [];
  if (p.temperatura_min_c != null) parti.push(`≥${p.temperatura_min_c}°C`);
  if (p.temperatura_max_c != null) parti.push(`≤${p.temperatura_max_c}°C`);
  if (p.tempo_min_min != null) parti.push(`≥${p.tempo_min_min} min`);
  if (p.tempo_max_min != null) parti.push(`≤${p.tempo_max_min} min`);
  return parti.join(' · ') || 'nessun limite impostato';
}

export async function renderRegistro(container, profilo) {
  await disegna(container, profilo);
}

async function disegna(container, profilo) {
  const procedure = await leggiTutti('procedure_approvate', [where('tipo', '==', tipoCorrente), where('stato', '==', 'approvata')]);
  const { inizio, fine } = inizioEFineGiorno(oggiISO());
  const oggi = await leggiTutti('registrazioni_processo', [
    where('tipo', '==', tipoCorrente), where('registrato_il', '>=', inizio), where('registrato_il', '<=', fine), orderBy('registrato_il', 'desc'),
  ]);

  container.innerHTML = `
    <div class="segmented">
      ${TIPI.map(([v, l]) => `<button data-tipo="${v}" class="${v === tipoCorrente ? 'active' : ''}">${l}</button>`).join('')}
    </div>
    <div class="card">
      <label class="field-label">Procedura (facoltativa)</label>
      <select id="reg-procedura">
        <option value="">Nessuna — registra senza valutazione automatica</option>
        ${procedure.map((p) => `<option value="${p.id}">${p.nome} — ${descrizioneParametri(p.parametri || {})}</option>`).join('')}
      </select>
      <label class="field-label">Prodotto</label>
      <input type="text" id="reg-prodotto" placeholder="Es. guancia di maiale">
      <label class="field-label">Temperatura (°C)</label>
      <input type="number" id="reg-temperatura" step="0.5">
      ${tipoCorrente !== 'rigenerazione' ? `
        <label class="field-label">Tempo (minuti)</label>
        <input type="number" id="reg-tempo">
      ` : ''}
      <button class="btn btn-primary btn-block" id="reg-salva">Salva registrazione</button>
    </div>
    <p class="section-title">Oggi</p>
    ${oggi.length === 0 ? '<div class="empty">Nessuna registrazione ancora oggi.</div>' : oggi.map(riga).join('')}
  `;

  container.querySelectorAll('[data-tipo]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      tipoCorrente = btn.dataset.tipo;
      await disegna(container, profilo);
    });
  });

  container.querySelector('#reg-salva').addEventListener('click', async () => {
    const prodotto = container.querySelector('#reg-prodotto').value.trim();
    const temperatura = parseFloat(container.querySelector('#reg-temperatura').value);
    const tempoEl = container.querySelector('#reg-tempo');
    const tempo = tempoEl ? parseFloat(tempoEl.value) : undefined;
    if (!prodotto || Number.isNaN(temperatura)) return;

    const proceduraId = container.querySelector('#reg-procedura').value || null;
    const procedura = procedure.find((p) => p.id === proceduraId);
    const valori = { temperatura_c: temperatura, ...(tempo !== undefined && !Number.isNaN(tempo) ? { tempo_min: tempo } : {}) };
    const esito = procedura ? calcolaEsito(procedura.parametri || {}, valori) : null;

    await aggiungi('registrazioni_processo', {
      procedura_id: proceduraId,
      tipo: tipoCorrente,
      prodotto,
      valori,
      esito,
      registrato_da: profilo.id,
      registrato_il: new Date(),
    });
    segnalaScrittura();
    await disegna(container, profilo);
  });
}

function riga(e) {
  const badge = e.esito ? `<span class="badge ${e.esito === 'ok' ? 'ok' : 'bad'}">${e.esito === 'ok' ? 'OK' : 'Fuori limite'}</span>` : '';
  const meta = [
    `${e.valori.temperatura_c}°C`,
    e.valori.tempo_min !== undefined ? `${e.valori.tempo_min} min` : null,
  ].filter(Boolean).join(' · ');
  return `
    <div class="entry-row">
      <div class="top"><span class="name">${escapeHtml(e.prodotto)}</span>${badge}</div>
      <div class="meta">${meta} · ${fmtOra(toData(e.registrato_il))}</div>
    </div>
  `;
}
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
