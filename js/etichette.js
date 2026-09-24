// Etichette: genera un'etichetta stampabile (nome, lotto/data, scadenza)
// a partire da un prodotto o da una scheda HACCP già inseriti, oppure
// da una preparazione libera inserita al volo.

import { leggiTutti } from './store.js';

export async function renderEtichettePage(container) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;
  const [prodotti, schede, processi, conservazioni] = await Promise.all([
    leggiTutti('prodotti').catch(() => []),
    leggiTutti('schede_haccp').catch(() => []),
    leggiTutti('registrazioni_processo').catch(() => []),
    leggiTutti('conservazioni').catch(() => []),
  ]);
  function normalizzaData(value) {
    if (!value) return '';
    if (typeof value === 'string') {
      const m = value.match(/(\\d{4})-(\\d{2})-(\\d{2})/);
      return m ? m[0] : '';
    }
    if (value?.toDate) {
      const d = value.toDate();
      return d.toISOString().slice(0, 10);
    }
    return '';
  }

  // Collega ogni processo alla relativa registrazione di conservazione.
  // In questo modo, scegliendo il processo oppure la conservazione,
  // l'etichetta recupera gli stessi dati.
  const conservazioneByProcesso = new Map(
    conservazioni
      .filter((c) => c.processo_id)
      .map((c) => [c.processo_id, c])
  );

  const opzioni = [
    ...conservazioni.map((c) => ({
      nome: c.prodotto || 'Preparazione',
      lotto: c.lotto || '',
      dataProduzione: normalizzaData(c.data_produzione || c.data_riferimento),
      scadenza: normalizzaData(c.scadenza),
      conservazione: c.tipo_conservazione_label || c.tipo_conservazione || '',
      tipoConservazione: c.processo_tipo
        ? (c.processo_tipo + ' → ' + (c.tipo_conservazione_label || c.tipo_conservazione || ''))
        : (c.tipo_conservazione_label || c.tipo_conservazione || ''),
      fonte: 'conservazione'
    })),
    ...processi.map((p) => {
      const c = conservazioneByProcesso.get(p.id);
      return {
        nome: p.prodotto || 'Preparazione',
        lotto: c?.lotto || p.valori?.lotto_materia_prima || '',
        dataProduzione: normalizzaData(c?.data_produzione || p.data_riferimento),
        scadenza: normalizzaData(c?.scadenza),
        conservazione: c?.tipo_conservazione_label || c?.tipo_conservazione || '',
        tipoConservazione: c
          ? (c.processo_tipo ? c.processo_tipo + ' → ' + (c.tipo_conservazione_label || c.tipo_conservazione || '') : '')
          : (p.tipo || ''),
        fonte: c ? 'processo_conservato' : 'processo'
      };
    }),
    ...prodotti.map((p) => ({ nome: p.denominazione || '', lotto: '', dataProduzione: '', scadenza: '', conservazione: p.conservazione || '', tipoConservazione: '', fonte: 'prodotto' })),
    ...schede.map((s) => ({ nome: s.nome || '', lotto: '', dataProduzione: '', scadenza: '', conservazione: s.contenuto?.ccp || '', tipoConservazione: '', fonte: 'scheda' })),
  ];

  container.innerHTML = `
    <div class="top-bar"><h2>Etichette</h2></div>

    <div class="list-card no-print">
      <label class="field-label">Preparazione</label>
      <select id="et-scelta">
        <option value="">— scrivi un nome libero sotto —</option>
        ${opzioni.map((o, i) => `<option value="${i}">${o.nome}${o.fonte === 'conservazione' || o.fonte === 'processo_conservato' ? ' — conservata' : o.fonte === 'processo' ? ' — processo' : ''}</option>`).join('')}
      </select>
      <label class="field-label">Nome etichetta</label>
      <input type="text" id="et-nome" placeholder="Scrivi il nome della preparazione">
      <div class="form-row">
        <div><label class="field-label">Lotto</label><input type="text" id="et-lotto" placeholder="Lotto"></div>
        <div><label class="field-label">Data produzione</label><input type="date" id="et-data-prod"></div>
      </div>
      <div class="form-row">
        <div><label class="field-label">Scadenza</label><input type="date" id="et-scadenza"></div>
        <div><label class="field-label">Conservazione</label><input type="text" id="et-conservazione" placeholder="es. ≤ +4 °C" readonly></div>
      </div>
      <div><label class="field-label">Tipo di conservazione</label><input type="text" id="et-tipo-conservazione" placeholder="es. Abbattimento → Frigorifero 0–4 °C" readonly></div>
      <button class="btn btn-primary btn-block" id="et-genera">Genera etichetta</button>
    </div>

    <div id="printable-label-card" style="display:none; border:2px solid #1e293b; border-radius:8px; padding:16px; max-width:320px; margin:16px auto; background:#fff;">
      <div style="font-size:11px; letter-spacing:1px; color:#64748b;">TENUTA AGRICOLA LA CAVA</div>
      <div id="et-out-nome" style="font-size:18px; font-weight:bold; margin:6px 0;"></div>
      <div id="et-out-lotto" style="font-size:13px;"></div>
      <div id="et-out-prod" style="font-size:13px;"></div>
      <div id="et-out-scad" style="font-size:13px;"></div>
      <div id="et-out-conservazione" style="font-size:13px;"></div>
    </div>
    <button class="btn btn-secondary btn-block no-print" id="et-stampa" style="display:none; margin-top:8px;">Stampa</button>
  `;

  container.querySelector('#et-scelta').addEventListener('change', () => {
    const idx = container.querySelector('#et-scelta').value;
    const scelta = idx !== '' ? opzioni[+idx] : null;
    const nomeInput = container.querySelector('#et-nome');
    nomeInput.value = scelta?.nome || '';
    // Il nome resta sempre modificabile: la selezione serve solo a precompilare i dati.
    nomeInput.readOnly = false;
    container.querySelector('#et-lotto').value = scelta?.lotto || '';
    container.querySelector('#et-data-prod').value = scelta?.dataProduzione || '';
    container.querySelector('#et-scadenza').value = scelta?.scadenza || '';
    container.querySelector('#et-conservazione').value = scelta?.conservazione || '';
    container.querySelector('#et-tipo-conservazione').value = scelta?.tipoConservazione || scelta?.processo || '';
  });

  container.querySelector('#et-genera').addEventListener('click', () => {
    const sceltaIdx = container.querySelector('#et-scelta').value;
    const nomeLibero = container.querySelector('#et-nome').value.trim();
    const nome = nomeLibero;
    if (!nome) { alert('Scegli una preparazione o scrivi un nome.'); return; }

    const lotto = container.querySelector('#et-lotto').value.trim();
    const dataProd = container.querySelector('#et-data-prod').value;
    const scadenza = container.querySelector('#et-scadenza').value;
    const scelta = sceltaIdx !== '' ? opzioni[+sceltaIdx] : null;

    container.querySelector('#et-out-nome').textContent = nome;
    container.querySelector('#et-out-lotto').textContent = lotto ? `Lotto: ${lotto}` : 'Lotto: —';
    container.querySelector('#et-out-prod').textContent = dataProd ? `Prodotto il: ${dataProd}` : '';
    container.querySelector('#et-out-scad').textContent = scadenza ? `Da consumarsi entro: ${scadenza}` : '';
    container.querySelector('#et-out-conservazione').textContent = scelta?.conservazione ? `Conservazione: ${scelta.conservazione}` : '';
    const tipo = container.querySelector('#et-tipo-conservazione').value;
    if (tipo) container.querySelector('#et-out-conservazione').textContent += ` — ${tipo}`;
    container.querySelector('#printable-label-card').style.display = 'block';
    container.querySelector('#et-stampa').style.display = 'block';
  });

  container.querySelector('#et-stampa').addEventListener('click', () => window.print());
}
