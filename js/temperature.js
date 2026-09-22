// Registro Temperature La Cava HACCP.
// Le apparecchiature di conservazione (frigoriferi/freezer) vengono
// controllate una volta al giorno.
// L'abbattitore non viene richiesto nel controllo giornaliero: il suo
// controllo è legato ai singoli processi di abbattimento/congelamento.
//
// Le registrazioni di un giorno passato sono consultabili ma non possono
// essere create ex novo: in questo modo l'app non consente registrazioni
// retroattive. Le correzioni di una registrazione già esistente restano
// possibili e sono sempre collegate all'originale con motivazione.

import { leggiTutti, aggiungi, where, oggiISO } from './store.js';
import { segnalaScrittura } from './sync-status.js';

let dataSelezionata = oggiISO();

function isAbbattitore(a) {
  const nome = String(a.nome || '').toLowerCase();
  const tipo = String(a.tipo || '').toLowerCase();
  return tipo === 'abbattitore' || nome.includes('abbattitore');
}

function isOggi(data) {
  return data === oggiISO();
}

async function creaAnomaliaTemperatura(profilo, apparecchiatura, valore, rilevazioneId) {
  await aggiungi('non_conformita', {
    categoria: 'frigorifero',
    problema: `${apparecchiatura.nome}: temperatura ${valore}°C fuori limite (${apparecchiatura.temp_min}°C / ${apparecchiatura.temp_max}°C).`,
    stato: 'aperta',
    aperto_da: profilo.id,
    origine_tabella: 'rilevazioni_temperatura',
    origine_id: rilevazioneId,
    azione: 'Verificare nuovamente l\'apparecchiatura, individuare i prodotti potenzialmente coinvolti e adottare l\'azione correttiva prevista dalla procedura.',
  }, 'aperto_il');
  segnalaScrittura();
}

export async function renderTemperaturePage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento apparecchiature…</div>`;

  const tutte = await leggiTutti('attrezzature');
  // L'abbattitore è gestito nel Registro Processi e non genera un
  // controllo giornaliero quando non è utilizzato.
  const apparecchiature = tutte
    .filter((a) => !isAbbattitore(a))
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

  const abbattitori = tutte.filter(isAbbattitore);

  if (apparecchiature.length === 0) {
    container.innerHTML = `
      <div class="top-bar"><h2>Temperature</h2></div>
      <div class="empty-state">
        Nessuna apparecchiatura di conservazione configurata.<br>
        Un responsabile deve prima aggiungere frigoriferi/freezer nella collezione
        <code>attrezzature</code> su Firebase.
      </div>`;
    return;
  }

  const registrazioni = await leggiTutti('rilevazioni_temperatura', [where('data_riferimento', '==', dataSelezionata)]);

  // Per ogni apparecchiatura: l'originale e, se presente, l'ultima correzione.
  const originali = new Map();
  registrazioni.filter((r) => !r.correzione_di).forEach((r) => {
    const esistente = originali.get(r.apparecchiatura_id);
    if (!esistente || (r.registrato_il?.seconds || 0) > (esistente.registrato_il?.seconds || 0)) {
      originali.set(r.apparecchiatura_id, r);
    }
  });

  const correzioni = new Map();
  registrazioni.filter((r) => r.correzione_di).forEach((r) => {
    const esistente = correzioni.get(r.correzione_di);
    if (!esistente || (r.registrato_il?.seconds || 0) > (esistente.registrato_il?.seconds || 0)) {
      correzioni.set(r.correzione_di, r);
    }
  });

  const giornoCorrente = isOggi(dataSelezionata);

  container.innerHTML = `
    <div class="top-bar"><h2>Temperature</h2></div>
    <div class="list-card no-print">
      <label class="field-label">Data</label>
      <input type="date" id="tp-data" value="${dataSelezionata}" max="${oggiISO()}">
      ${!giornoCorrente ? '<div style="font-size:12px; color:#b45309; margin-top:6px;">⚠️ Giorno passato: consultazione soltanto. Non è possibile creare una nuova registrazione per questa data.</div>' : ''}
    </div>
    ${abbattitori.length ? `
      <div class="list-card" style="background:#f8fafc;">
        <div class="t" style="font-weight:600;">Abbattitore</div>
        <div class="s">Il controllo dell'abbattitore viene registrato nel Registro Processi quando viene utilizzato. Non è richiesto un controllo giornaliero quando è spento.</div>
      </div>` : ''}
    ${apparecchiature.map((a) => {
      const orig = originali.get(a.id);
      const corr = orig ? correzioni.get(orig.id) : null;
      const attuale = corr || orig;
      const puoRegistrare = giornoCorrente && !orig;
      return `
        <div class="list-card">
          <div class="check-row" style="cursor:default;">
            <span class="dot ${!attuale ? 'pending' : attuale.esito === 'fuori_limite' ? 'warn' : 'ok'}"></span>
            <div class="rt">
              <div class="t">${a.nome}</div>
              <div class="s">Limiti operativi: ${a.temp_min}°C / ${a.temp_max}°C ${attuale ? `— registrata: ${attuale.valore}°C` : '— non ancora registrata'}</div>
              ${corr ? `<div class="s" style="color:#b45309;">Valore originale: ${orig.valore}°C — corretto il ${fmtBreve(corr.registrato_il)} (motivo: ${corr.motivo_correzione || '—'})</div>` : ''}
            </div>
          </div>
          ${puoRegistrare ? `
            <div class="form-row" style="padding-bottom:8px;">
              <div><input type="number" step="0.1" placeholder="°C" data-input-temp="${a.id}"></div>
              <button class="btn btn-primary" data-salva="${a.id}" style="flex:0 0 auto;">Salva</button>
            </div>` : ''}
          ${orig && (!corr || giornoCorrente || !giornoCorrente) ? `
            <button class="btn btn-secondary" data-correggi="${orig.id}" data-apparecchiatura="${a.id}" style="margin:0 12px 12px;">Correggi il valore registrato</button>` : ''}
          ${giornoCorrente && orig && !corr ? `<div class="s" style="padding:0 12px 12px;">Controllo già registrato oggi. Per una modifica utilizzare “Correggi il valore registrato”.</div>` : ''}
        </div>`;
    }).join('')}
  `;

  container.querySelector('#tp-data').addEventListener('change', (e) => {
    dataSelezionata = e.target.value;
    renderTemperaturePage(container, profilo);
  });

  apparecchiature.forEach((a) => {
    const btn = container.querySelector(`[data-salva="${a.id}"]`);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const input = container.querySelector(`[data-input-temp="${a.id}"]`);
      const valore = parseFloat(input.value);
      if (Number.isNaN(valore)) {
        alert('Inserisci un valore di temperatura.');
        return;
      }

      const esito = (valore < a.temp_min || valore > a.temp_max) ? 'fuori_limite' : 'nella_norma';
      btn.disabled = true;
      try {
        const ref = await aggiungi('rilevazioni_temperatura', {
          apparecchiatura_id: a.id,
          valore,
          esito,
          data_riferimento: dataSelezionata,
          registrato_da: profilo.id,
        }, 'registrato_il');

        segnalaScrittura();

        if (esito === 'fuori_limite') {
          try {
            await creaAnomaliaTemperatura(profilo, a, valore, ref.id);
            alert(`Attenzione: ${a.nome} è fuori limite (${valore}°C). È stata aperta automaticamente una non conformità.`);
          } catch (anomaliaErr) {
            console.error(anomaliaErr);
            alert(`Attenzione: ${a.nome} è fuori limite (${valore}°C). La temperatura è stata salvata, ma non è stato possibile aprire automaticamente la non conformità.`);
          }
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
      if (Number.isNaN(valore)) {
        alert('Valore non valido.');
        return;
      }

      const motivo = prompt('Motivo della correzione (obbligatorio):');
      if (!motivo || !motivo.trim()) {
        alert('Il motivo è obbligatorio per una correzione.');
        return;
      }

      const a = apparecchiature.find((x) => x.id === btn.dataset.apparecchiatura);
      const esito = (valore < a.temp_min || valore > a.temp_max) ? 'fuori_limite' : 'nella_norma';
      btn.disabled = true;
      try {
        const ref = await aggiungi('rilevazioni_temperatura', {
          apparecchiatura_id: a.id,
          valore,
          esito,
          data_riferimento: dataSelezionata,
          correzione_di: btn.dataset.correggi,
          motivo_correzione: motivo.trim(),
          registrato_da: profilo.id,
        }, 'registrato_il');

        segnalaScrittura();

        if (esito === 'fuori_limite') {
          try {
            await creaAnomaliaTemperatura(profilo, a, valore, ref.id);
            alert('Correzione salvata e non conformità aperta automaticamente perché il valore corretto è fuori limite.');
          } catch (anomaliaErr) {
            console.error(anomaliaErr);
            alert('Correzione salvata, ma non è stato possibile aprire automaticamente la non conformità.');
          }
        }

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
