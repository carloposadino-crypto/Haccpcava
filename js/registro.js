// Registro Cotture, Abbattimenti e Rigenerazioni (registrazioni_processo).
// Si può scegliere la data (di solito oggi, ma anche un giorno passato
// dimenticato). Una registrazione già salvata non si sovrascrive mai:
// per correggerla si aggiunge una correzione collegata, e l'originale
// resta sempre visibile e consultabile.

import { leggiTutti, aggiungi, where, oggiISO } from './store.js';

const TIPI = [
  ['cottura', 'Cottura normale'],
  ['cbt', 'Cottura Sottovuoto / Roner (CBT)'],
  ['abbattimento', 'Abbattimento (positivo/negativo)'],
  ['rigenerazione', 'Rigenerazione'],
];

let dataSelezionata = oggiISO();
let correzioneApertaPer = null;

export async function renderRegistroPage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;

  const registrazioni = await leggiTutti('registrazioni_processo', [where('data_riferimento', '==', dataSelezionata)]);
  const originali = registrazioni.filter((r) => !r.correzione_di).sort((a, b) => (b.registrato_il?.seconds || 0) - (a.registrato_il?.seconds || 0));
  const correzioniPer = new Map();
  registrazioni.filter((r) => r.correzione_di).forEach((r) => {
    const lista = correzioniPer.get(r.correzione_di) || [];
    lista.push(r);
    correzioniPer.set(r.correzione_di, lista);
  });

  const isOggi = dataSelezionata === oggiISO();

  container.innerHTML = `
    <div class="top-bar"><h2>Cotture / Abbattimenti / Rigenerazioni</h2></div>

    <div class="list-card no-print">
      <label class="field-label">Data</label>
      <input type="date" id="reg-data" value="${dataSelezionata}" max="${oggiISO()}">
      ${!isOggi ? '<div style="font-size:12px; color:#b45309; margin-top:6px;">⚠️ Stai registrando per una data passata, non per oggi.</div>' : ''}
    </div>

    <div class="list-card">
      <label class="field-label">Tipo di processo</label>
      <select id="reg-tipo">${TIPI.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>

      <label class="field-label">Prodotto / preparazione</label>
      <input type="text" id="reg-prodotto" placeholder="Es. Vitello per Tonnato, Brasato...">

      <div class="form-row">
        <div><label class="field-label">Temp. inizio (°C)</label><input type="number" step="0.1" id="reg-temp-inizio"></div>
        <div><label class="field-label">Temp. fine / al cuore (°C)</label><input type="number" step="0.1" id="reg-temp-fine"></div>
      </div>
      <div class="form-row">
        <div><label class="field-label">Durata (minuti)</label><input type="number" id="reg-durata"></div>
        <div><label class="field-label">Lotto materia prima</label><input type="text" id="reg-lotto"></div>
      </div>
      <label class="field-label">Note</label>
      <textarea id="reg-note" placeholder="Eventuali note utili al controllo"></textarea>
      <button class="btn btn-primary btn-block" id="reg-salva">Registra</button>
    </div>

    <h3 style="font-size:14px; color:#64748b; margin: 16px 0 8px;">Registrate il ${dataSelezionata} (${originali.length})</h3>
    ${originali.length === 0 ? '<div class="empty-state">Nessuna registrazione in questa data.</div>' : `
      <div class="list-card">
        ${originali.map((r) => {
          const correzioni = (correzioniPer.get(r.id) || []).sort((a, b) => (b.registrato_il?.seconds || 0) - (a.registrato_il?.seconds || 0));
          const ultima = correzioni[0];
          return `
          <div class="check-row" style="cursor:default; flex-direction:column; align-items:stretch;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div class="rt">
                <div class="t">${TIPI.find(([v]) => v === r.tipo)?.[1] || r.tipo} — ${r.prodotto || ''}</div>
                <div class="s">${r.valori?.temperatura_inizio_c ?? '—'}°C → ${r.valori?.temperatura_fine_c ?? '—'}°C${r.valori?.durata_min ? ' · ' + r.valori.durata_min + ' min' : ''}</div>
              </div>
              ${!ultima ? `<button class="btn btn-secondary reg-correggi-btn" data-correggi="${r.id}" style="flex:0 0 auto;">Correggi</button>` : ''}
            </div>
            ${correzioni.map((c) => `
              <div style="font-size:12px; color:#b45309; margin-top:6px; padding-left:4px;">
                → Corretto: ${c.valori?.temperatura_inizio_c ?? '—'}°C → ${c.valori?.temperatura_fine_c ?? '—'}°C${c.valori?.durata_min ? ' · ' + c.valori.durata_min + ' min' : ''} — motivo: ${c.motivo_correzione || '—'}
              </div>
            `).join('')}
            ${correzioneApertaPer === r.id ? `
              <div class="list-card" style="border:1px solid #2b5c3a; margin-top:10px;">
                <label class="field-label">Nuovi valori corretti</label>
                <div class="form-row">
                  <div><input type="number" step="0.1" id="cr-temp-inizio" placeholder="Temp. inizio °C" value="${r.valori?.temperatura_inizio_c ?? ''}"></div>
                  <div><input type="number" step="0.1" id="cr-temp-fine" placeholder="Temp. fine °C" value="${r.valori?.temperatura_fine_c ?? ''}"></div>
                </div>
                <input type="number" id="cr-durata" placeholder="Durata (minuti)" value="${r.valori?.durata_min ?? ''}">
                <label class="field-label">Motivo della correzione (obbligatorio)</label>
                <textarea id="cr-motivo" placeholder="Es. errore di trascrizione, valore letto male..."></textarea>
                <button class="btn btn-primary btn-block" id="cr-salva" data-originale="${r.id}" data-tipo="${r.tipo}" data-prodotto="${r.prodotto || ''}">Salva correzione</button>
                <button class="btn btn-secondary btn-block" id="cr-annulla" style="margin-top:8px;">Annulla</button>
              </div>
            ` : ''}
          </div>
        `}).join('')}
      </div>
    `}
  `;

  container.querySelector('#reg-data').addEventListener('change', (e) => {
    dataSelezionata = e.target.value;
    correzioneApertaPer = null;
    renderRegistroPage(container, profilo);
  });

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
        data_riferimento: dataSelezionata,
        registrato_da: profilo.id,
      }, 'registrato_il');
      renderRegistroPage(container, profilo);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
      btn.disabled = false;
    }
  });

  container.querySelectorAll('.reg-correggi-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      correzioneApertaPer = btn.dataset.correggi;
      renderRegistroPage(container, profilo);
    });
  });

  const annullaBtn = container.querySelector('#cr-annulla');
  if (annullaBtn) annullaBtn.addEventListener('click', () => { correzioneApertaPer = null; renderRegistroPage(container, profilo); });

  const salvaCorrBtn = container.querySelector('#cr-salva');
  if (salvaCorrBtn) salvaCorrBtn.addEventListener('click', async (e) => {
    const motivo = container.querySelector('#cr-motivo').value.trim();
    if (!motivo) { alert('Il motivo della correzione è obbligatorio.'); return; }

    e.currentTarget.disabled = true;
    try {
      await aggiungi('registrazioni_processo', {
        tipo: e.currentTarget.dataset.tipo,
        prodotto: e.currentTarget.dataset.prodotto,
        valori: {
          temperatura_inizio_c: container.querySelector('#cr-temp-inizio').value || null,
          temperatura_fine_c: container.querySelector('#cr-temp-fine').value || null,
          durata_min: container.querySelector('#cr-durata').value || null,
        },
        correzione_di: e.currentTarget.dataset.originale,
        motivo_correzione: motivo,
        data_riferimento: dataSelezionata,
        registrato_da: profilo.id,
      }, 'registrato_il');
      correzioneApertaPer = null;
      renderRegistroPage(container, profilo);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio della correzione.');
      e.currentTarget.disabled = false;
    }
  });
}
