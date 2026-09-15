// Registro Cotture, Abbattimenti e Rigenerazioni (registrazioni_processo).
// Unisce in un solo form quello che nel progetto precedente erano due
// pagine separate e sovrapposte: qui il tipo di processo determina quali
// campi servono davvero (es. l'abbattimento ha sempre bisogno della
// temperatura al cuore, la cottura normale no).

import { leggiTutti, aggiungi, where, orderBy, oggiISO, inizioEFineGiorno } from './store.js';

const TIPI = [
  ['cottura', 'Cottura normale'],
  ['cbt', 'Cottura Sottovuoto / Roner (CBT)'],
  ['abbattimento', 'Abbattimento (positivo/negativo)'],
  ['rigenerazione', 'Rigenerazione'],
];

export async function renderRegistroPage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;

  const { inizio, fine } = inizioEFineGiorno(oggiISO());
  const oggiList = await leggiTutti('registrazioni_processo', [
    where('registrato_il', '>=', inizio), where('registrato_il', '<=', fine), orderBy('registrato_il', 'desc'),
  ]);

  container.innerHTML = `
    <div class="top-bar"><h2>Cotture / Abbattimenti / Rigenerazioni</h2></div>

    <div class="list-card">
      <label class="field-label">Tipo di processo</label>
      <select id="reg-tipo">${TIPI.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>

      <label class="field-label">Prodotto / preparazione</label>
      <input type="text" id="reg-prodotto" placeholder="Es. Vitello per Tonnato, Brasato...">

      <div class="form-row">
        <div>
          <label class="field-label">Temp. inizio (°C)</label>
          <input type="number" step="0.1" id="reg-temp-inizio">
        </div>
        <div>
          <label class="field-label">Temp. fine / al cuore (°C)</label>
          <input type="number" step="0.1" id="reg-temp-fine">
        </div>
      </div>
      <div class="form-row">
        <div>
          <label class="field-label">Durata (minuti)</label>
          <input type="number" id="reg-durata">
        </div>
        <div>
          <label class="field-label">Lotto materia prima</label>
          <input type="text" id="reg-lotto">
        </div>
      </div>
      <label class="field-label">Note</label>
      <textarea id="reg-note" placeholder="Eventuali note utili al controllo"></textarea>
      <button class="btn btn-primary btn-block" id="reg-salva">Registra</button>
    </div>

    <h3 style="font-size:14px; color:#64748b; margin: 16px 0 8px;">Registrate oggi (${oggiList.length})</h3>
    ${oggiList.length === 0 ? '<div class="empty-state">Nessuna registrazione oggi.</div>' : `
      <div class="list-card">
        ${oggiList.map((r) => `
          <div class="check-row" style="cursor:default;">
            <div class="rt">
              <div class="t">${TIPI.find(([v]) => v === r.tipo)?.[1] || r.tipo} — ${r.prodotto || ''}</div>
              <div class="s">${r.valori?.temperatura_inizio_c ?? '—'}°C → ${r.valori?.temperatura_fine_c ?? '—'}°C${r.valori?.durata_min ? ' · ' + r.valori.durata_min + ' min' : ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;

  container.querySelector('#reg-salva').addEventListener('click', async (e) => {
    const prodotto = container.querySelector('#reg-prodotto').value.trim();
    if (!prodotto) { alert('Inserisci il nome del prodotto/preparazione.'); return; }

    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await aggiungi('registrazioni_processo', {
        tipo: container.querySelector('#reg-tipo').value,
        prodotto,
        valori: {
          temperatura_inizio_c: container.querySelector('#reg-temp-inizio').value || null,
          temperatura_fine_c: container.querySelector('#reg-temp-fine').value || null,
          durata_min: container.querySelector('#reg-durata').value || null,
          lotto_materia_prima: container.querySelector('#reg-lotto').value || null,
          note: container.querySelector('#reg-note').value || null,
        },
        esito: null,
        registrato_da: profilo.id,
      }, 'registrato_il');
      renderRegistroPage(container, profilo);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
      btn.disabled = false;
    }
  });
}
