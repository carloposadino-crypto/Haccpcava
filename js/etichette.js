// Etichette: genera un'etichetta stampabile (nome, lotto/data, scadenza)
// a partire da un prodotto o da una scheda HACCP già inseriti, oppure
// da una preparazione libera inserita al volo.

import { leggiTutti, oggiISO } from './store.js';

export async function renderEtichettePage(container) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;
  const [prodotti, schede, processi, conservazioni] = await Promise.all([
    leggiTutti('prodotti').catch(() => []),
    leggiTutti('schede_haccp').catch(() => []),
    leggiTutti('registrazioni_processo').catch(() => []),
    leggiTutti('conservazioni').catch(() => []),
  ]);
  const opzioni = [
    ...prodotti.map((p) => ({ nome: p.denominazione, conservazione: p.conservazione })),
    ...schede.map((s) => ({ nome: s.nome, conservazione: s.contenuto?.ccp || '' })),
    ...processi.map((p) => ({ nome: p.prodotto, lotto: p.valori?.lotto_materia_prima || '', dataProduzione: p.data_riferimento || '', processo: p.tipo })),
    ...conservazioni.map((c) => ({ nome: c.prodotto, lotto: c.lotto || '', dataProduzione: c.data_produzione || c.data_riferimento || '', scadenza: c.scadenza || '', conservazione: c.tipo_conservazione_label || c.tipo_conservazione, processo: c.processo_tipo || '' })),
  ];

  container.innerHTML = `
    <div class="top-bar"><h2>Etichette</h2></div>

    <div class="list-card no-print">
      <label class="field-label">Preparazione</label>
      <select id="et-scelta">
        <option value="">— scrivi un nome libero sotto —</option>
        ${opzioni.map((o, i) => `<option value="${i}">${o.nome}</option>`).join('')}
      </select>
      <label class="field-label">Nome (se non scelto sopra)</label>
      <input type="text" id="et-nome" placeholder="Nome preparazione">
      <div class="form-row">
        <div><label class="field-label">Lotto / data prod.</label><input type="text" id="et-lotto" value="${oggiISO()}"></div>
        <div><label class="field-label">Scadenza</label><input type="date" id="et-scadenza"></div>
      </div>
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

  container.querySelector('#et-genera').addEventListener('click', () => {
    const sceltaIdx = container.querySelector('#et-scelta').value;
    const nomeLibero = container.querySelector('#et-nome').value.trim();
    const nome = sceltaIdx !== '' ? opzioni[+sceltaIdx].nome : nomeLibero;
    if (!nome) { alert('Scegli una preparazione o scrivi un nome.'); return; }

    const lotto = container.querySelector('#et-lotto').value;
    const scadenza = container.querySelector('#et-scadenza').value;
    const scelta = sceltaIdx !== '' ? opzioni[+sceltaIdx] : null;

    container.querySelector('#et-out-nome').textContent = nome;
    container.querySelector('#et-out-lotto').textContent = lotto ? `Lotto: ${lotto}` : 'Lotto: —';
    container.querySelector('#et-out-prod').textContent = scelta?.dataProduzione ? `Prodotto il: ${scelta.dataProduzione}` : '';
    container.querySelector('#et-out-scad').textContent = scadenza ? `Da consumarsi entro: ${scadenza}` : (scelta?.scadenza ? `Da consumarsi entro: ${scelta.scadenza}` : '');
    container.querySelector('#et-out-conservazione').textContent = scelta?.conservazione ? `Conservazione: ${scelta.conservazione}` : '';
    container.querySelector('#printable-label-card').style.display = 'block';
    container.querySelector('#et-stampa').style.display = 'block';
  });

  container.querySelector('#et-stampa').addEventListener('click', () => window.print());
}
