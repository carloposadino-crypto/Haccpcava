import { aggiungi, leggiTutti, toData, inizioEFineGiorno, oggiISO, where, orderBy } from './store.js';
import { segnalaScrittura } from './sync-status.js';

function calcolaEsito(apparecchiatura, valore) {
  if (apparecchiatura.tipo === 'freezer') {
    return valore <= apparecchiatura.limite_massimo ? 'nella_norma' : 'fuori_limite';
  }
  const min = apparecchiatura.limite_minimo ?? -Infinity;
  const max = apparecchiatura.limite_massimo ?? Infinity;
  return valore >= min && valore <= max ? 'nella_norma' : 'fuori_limite';
}

function fmtRange(a) {
  return a.tipo === 'freezer'
    ? `Target: ≤ ${a.limite_massimo}°C`
    : `Target: ${a.limite_minimo}–${a.limite_massimo}°C`;
}
function fmtOra(d) {
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export async function renderTemperature(container, profilo) {
  container.innerHTML = `<div class="empty">Caricamento…</div>`;

  const apparecchiature = await leggiTutti('apparecchiature', [where('attivo', '==', true), orderBy('ordine')]);
  if (!apparecchiature || apparecchiature.length === 0) {
    container.innerHTML = `<div class="empty">Nessuna apparecchiatura configurata. Aggiungile dalla console Firebase nella collezione "apparecchiature".</div>`;
    return;
  }

  const { inizio, fine } = inizioEFineGiorno(oggiISO());
  const rilevazioniOggi = await leggiTutti('rilevazioni_temperatura', [
    where('registrato_il', '>=', inizio), where('registrato_il', '<=', fine), orderBy('registrato_il'),
  ]);

  const ultimaPerApparecchiatura = {};
  rilevazioniOggi.forEach((r) => { ultimaPerApparecchiatura[r.apparecchiatura_id] = r; });

  container.innerHTML = apparecchiature.map((a) => {
    const ultima = ultimaPerApparecchiatura[a.id];
    const valoreIniziale = ultima ? ultima.valore : (a.temperatura_target ?? (a.tipo === 'freezer' ? -18 : 3));
    const esito = ultima ? ultima.esito : null;
    return `
      <div class="card fridge-card" data-id="${a.id}">
        <div class="top">
          <div>
            <div class="name">${a.nome}</div>
            <div class="range">${fmtRange(a)}</div>
          </div>
          ${esito ? `<span class="badge ${esito === 'nella_norma' ? 'ok' : 'bad'}">${esito === 'nella_norma' ? 'Nella norma' : 'Fuori range'}</span>` : `<span class="badge neutral">Da rilevare</span>`}
        </div>
        <div class="stepper">
          <button data-step="-">−</button>
          <input type="number" step="0.5" inputmode="decimal" class="valore-input" value="${valoreIniziale}">
          <button data-step="+">+</button>
          <button class="btn btn-primary salva-btn" style="flex:0 0 auto;padding:12px 16px;">Salva</button>
        </div>
        ${ultima ? `<div class="reading">Ultima rilevazione: ${ultima.valore}°C alle ${fmtOra(toData(ultima.registrato_il))}</div>` : ''}
      </div>
    `;
  }).join('');

  container.querySelectorAll('.card').forEach((card) => {
    const id = card.dataset.id;
    const apparecchiatura = apparecchiature.find((a) => a.id === id);
    const input = card.querySelector('.valore-input');

    card.querySelectorAll('[data-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = btn.dataset.step === '+' ? 0.5 : -0.5;
        input.value = Math.round((parseFloat(input.value || 0) + delta) * 10) / 10;
      });
    });

    card.querySelector('.salva-btn').addEventListener('click', async () => {
      const valore = parseFloat(input.value);
      if (Number.isNaN(valore)) return;
      const esito = calcolaEsito(apparecchiatura, valore);
      await aggiungi('rilevazioni_temperatura', {
        apparecchiatura_id: apparecchiatura.id,
        valore,
        esito,
        registrato_da: profilo.id,
        registrato_il: new Date(),
      });
      segnalaScrittura();
      await renderTemperature(container, profilo);
    });
  });
}
