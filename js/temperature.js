// Registro Temperature: legge le apparecchiature attive (frigo/freezer)
// e permette di registrare la lettura per una data scelta (di solito
// oggi, ma si può anche recuperare un giorno dimenticato). Un valore
// già salvato non si sovrascrive mai: se serve correggerlo, si aggiunge
// una correzione collegata, e l'originale resta sempre visibile.

import { leggiTutti, aggiungi, where, oggiISO } from './store.js';

let dataSelezionata = oggiISO();

export async function renderTemperaturePage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento apparecchiature…</div>`;

  const apparecchiature = (await leggiTutti('attrezzature')).sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  if (apparecchiature.length === 0) {
    container.innerHTML = `
      <div class="top-bar"><h2>Temperature</h2></div>
      <div class="empty-state">
        Nessuna apparecchiatura configurata.<br>
        Un responsabile deve prima aggiungere i frigoriferi/freezer nella collezione
        <code>attrezzature</code> su Firebase.
      </div>`;
    return;
  }

  const registrazioni = await leggiTutti('rilevazioni_temperatura', [where('data_riferimento', '==', dataSelezionata)]);

  // Per ogni apparecchiatura: l'originale (senza correzione_di) e, se
  // presente, l'ultima correzione collegata a quell'originale.
  const originali = new Map(); // apparecchiatura_id -> record originale più recente
  registrazioni.filter((r) => !r.correzione_di).forEach((r) => {
    const esistente = originali.get(r.apparecchiatura_id);
    if (!esistente || (r.registrato_il?.seconds || 0) > (esistente.registrato_il?.seconds || 0)) originali.set(r.apparecchiatura_id, r);
  });
  const correzioni = new Map(); // id originale -> ultima correzione
  registrazioni.filter((r) => r.correzione_di).forEach((r) => {
    const esistente = correzioni.get(r.correzione_di);
    if (!esistente || (r.registrato_il?.seconds || 0) > (esistente.registrato_il?.seconds || 0)) correzioni.set(r.correzione_di, r);
  });

  const isOggi = dataSelezionata === oggiISO();

  container.innerHTML = `
    <div class="top-bar"><h2>Temperature</h2></div>
    <div class="list-card no-print">
      <label class="field-label">Data</label>
      <input type="date" id="tp-data" value="${dataSelezionata}" max="${oggiISO()}">
      ${!isOggi ? '<div style="font-size:12px; color:#b45309; margin-top:6px;">⚠️ Stai registrando per una data passata, non per oggi.</div>' : ''}
    </div>
    ${apparecchiature.map((a) => {
      const orig = originali.get(a.id);
      const corr = orig ? correzioni.get(orig.id) : null;
      const attuale = corr || orig;
      return `
        <div class="list-card">
          <div class="check-row" style="cursor:default;">
            <span class="dot ${!attuale ? 'pending' : attuale.esito === 'fuori_limite' ? 'warn' : 'ok'}"></span>
            <div class="rt">
              <div class="t">${a.nome}</div>
              <div class="s">Range: ${a.temp_min}°C / ${a.temp_max}°C ${attuale ? `— registrata: ${attuale.valore}°C` : '— non ancora registrata'}</div>
              ${corr ? `<div class="s" style="color:#b45309;">Valore originale: ${orig.valore}°C — corretto il ${fmtBreve(corr.registrato_il)} (motivo: ${corr.motivo_correzione || '—'})</div>` : ''}
            </div>
          </div>
          <div class="form-row" style="padding-bottom:8px;">
            <div><input type="number" step="0.1" placeholder="°C" data-input-temp="${a.id}"></div>
            <button class="btn btn-primary" data-salva="${a.id}" style="flex:0 0 auto;">${orig ? 'Registra di nuovo' : 'Salva'}</button>
          </div>
          ${orig && !corr ? `<button class="btn btn-secondary" data-correggi="${orig.id}" data-apparecchiatura="${a.id}" style="margin:0 12px 12px;">Correggi il valore registrato</button>` : ''}
        </div>`;
    }).join('')}
  `;

  container.querySelector('#tp-data').addEventListener('change', (e) => {
    dataSelezionata = e.target.value;
    renderTemperaturePage(container, profilo);
  });

  apparecchiature.forEach((a) => {
    const btn = container.querySelector(`[data-salva="${a.id}"]`);
    btn.addEventListener('click', async () => {
      const input = container.querySelector(`[data-input-temp="${a.id}"]`);
      const valore = parseFloat(input.value);
      if (Number.isNaN(valore)) { alert('Inserisci un valore di temperatura.'); return; }

      const esito = (valore < a.temp_min || valore > a.temp_max) ? 'fuori_limite' : 'nella_norma';
      btn.disabled = true;
      try {
        await aggiungi('rilevazioni_temperatura', {
          apparecchiatura_id: a.id,
          valore,
          esito,
          data_riferimento: dataSelezionata,
          registrato_da: profilo.id,
        }, 'registrato_il');
        if (esito === 'fuori_limite') {
          alert(`Attenzione: ${a.nome} è fuori range (${valore}°C). Registrazione salvata — valuta di segnalare un'anomalia con il pulsante rosso in alto.`);
        }
        renderTemperaturePage(container, profilo);
      } catch (err) {
        console.error(err);
        alert('Errore durante il salvataggio.');
        btn.disabled = false;
      }
    });
  });

  container.querySelectorAll('[data-correggi]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const nuovoValore = prompt('Nuovo valore corretto (°C):');
      if (nuovoValore === null || nuovoValore.trim() === '') return;
      const valore = parseFloat(nuovoValore);
      if (Number.isNaN(valore)) { alert('Valore non valido.'); return; }
      const motivo = prompt('Motivo della correzione (obbligatorio):');
      if (!motivo || !motivo.trim()) { alert('Il motivo è obbligatorio per una correzione.'); return; }

      const a = apparecchiature.find((x) => x.id === btn.dataset.apparecchiatura);
      const esito = (valore < a.temp_min || valore > a.temp_max) ? 'fuori_limite' : 'nella_norma';
      btn.disabled = true;
      try {
        await aggiungi('rilevazioni_temperatura', {
          apparecchiatura_id: a.id,
          valore,
          esito,
          data_riferimento: dataSelezionata,
          correzione_di: btn.dataset.correggi,
          motivo_correzione: motivo.trim(),
          registrato_da: profilo.id,
        }, 'registrato_il');
        renderTemperaturePage(container, profilo);
      } catch (err) {
        console.error(err);
        alert('Errore durante il salvataggio della correzione.');
        btn.disabled = false;
      }
    });
  });
}

function fmtBreve(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('it-IT');
}
