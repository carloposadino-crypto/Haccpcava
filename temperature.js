// Registro Temperature: legge le apparecchiature attive (frigo/freezer)
// configurate dal responsabile, e permette di registrare la lettura di
// oggi per ciascuna, segnalando subito se è fuori dal range previsto.

import { leggiTutti, aggiungi, where, orderBy, oggiISO, inizioEFineGiorno } from './store.js';

export async function renderTemperaturePage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento apparecchiature…</div>`;

  const apparecchiature = await leggiTutti('attrezzature', [where('attivo', '==', true), orderBy('ordine', 'asc')]);

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

  const { inizio, fine } = inizioEFineGiorno(oggiISO());
  const rilevazioniOggi = await leggiTutti('rilevazioni_temperatura', [
    where('registrato_il', '>=', inizio), where('registrato_il', '<=', fine),
  ]);
  const ultimaPerApparecchiatura = new Map();
  rilevazioniOggi.forEach((r) => ultimaPerApparecchiatura.set(r.apparecchiatura_id, r));

  container.innerHTML = `
    <div class="top-bar"><h2>Temperature — ${oggiISO()}</h2></div>
    ${apparecchiature.map((a) => {
      const letta = ultimaPerApparecchiatura.get(a.id);
      return `
        <div class="list-card">
          <div class="check-row" style="cursor:default;">
            <span class="dot ${!letta ? 'pending' : letta.esito === 'fuori_limite' ? 'warn' : 'ok'}"></span>
            <div class="rt">
              <div class="t">${a.nome}</div>
              <div class="s">Range: ${a.temp_min}°C / ${a.temp_max}°C ${letta ? `— ultima: ${letta.valore}°C` : '— non ancora registrata'}</div>
            </div>
          </div>
          <div class="form-row" style="padding-bottom:12px;">
            <div>
              <input type="number" step="0.1" placeholder="°C" data-input-temp="${a.id}">
            </div>
            <button class="btn btn-primary" data-salva="${a.id}" style="flex:0 0 auto;">Salva</button>
          </div>
        </div>`;
    }).join('')}
  `;

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
}
