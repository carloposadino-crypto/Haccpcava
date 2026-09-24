// Ricevimento merci La Cava HACCP.
// Ogni DDT viene salvato come un unico documento con tutte le righe prodotto.
// I documenti salvati possono essere riaperti e consultati.

import { leggiTutti, aggiungi, where, oggiISO } from './store.js';

let righeCorrenti = [];
let dataSelezionata = oggiISO();
let ricevimentoAperto = null;

function rigaVuota() {
  return { nome: '', quantita: '', lotto: '', scadenza: '', temperatura: '', prezzo_unitario: '', unita_prezzo: '', totale_riga: '' };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatData(value) {
  if (!value) return '—';
  const parts = String(value).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function dettaglioRicevimento(r) {
  const prodotti = Array.isArray(r.voci) ? r.voci : [];
  return `
    <div class="list-card" style="border:1px solid #2b5c3a; margin-top:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
        <div style="font-size:15px; font-weight:bold; color:#2b5c3a;">Dettaglio ricevimento</div>
        <button type="button" class="btn btn-secondary" id="rc-chiudi-dettaglio">Chiudi</button>
      </div>
      <div style="font-size:13px; line-height:1.6; margin-bottom:14px;">
        <div><strong>Fornitore:</strong> ${escapeHtml(r.fornitore_nome) || '—'}</div>
        <div><strong>N. documento:</strong> ${escapeHtml(r.numero_documento) || '—'}</div>
        <div><strong>Data registrazione:</strong> ${formatData(r.data_riferimento)}</div>
        <div><strong>Temperatura arrivo:</strong> ${r.temperatura !== null && r.temperatura !== undefined && r.temperatura !== '' ? escapeHtml(r.temperatura) + ' °C' : '—'}</div>
        <div><strong>Conformità:</strong> ${r.conformita === 'non_conforme' ? 'NON CONFORME' : 'Conforme'}</div>
        <div><strong>Note:</strong> ${escapeHtml(r.note) || '—'}</div>
      </div>
      <div style="font-weight:bold; margin-bottom:8px;">Prodotti della consegna</div>
      ${prodotti.length ? `
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead><tr>
              <th style="text-align:left; padding:7px; border-bottom:1px solid #cbd5e1;">Prodotto</th>
              <th style="text-align:left; padding:7px; border-bottom:1px solid #cbd5e1;">Quantità</th>
              <th style="text-align:left; padding:7px; border-bottom:1px solid #cbd5e1;">Lotto</th>
              <th style="text-align:left; padding:7px; border-bottom:1px solid #cbd5e1;">Scadenza / TMC</th>
              <th style="text-align:left; padding:7px; border-bottom:1px solid #cbd5e1;">Temp.</th><th style="text-align:left; padding:7px; border-bottom:1px solid #cbd5e1;">Prezzo unit.</th><th style="text-align:left; padding:7px; border-bottom:1px solid #cbd5e1;">Totale</th>
            </tr></thead>
            <tbody>
              ${prodotti.map((v) => `<tr>
                <td style="padding:8px 7px; border-bottom:1px solid #e2e8f0; vertical-align:top; white-space:pre-wrap; overflow-wrap:anywhere;">${escapeHtml(v.nome) || '—'}</td>
                <td style="padding:8px 7px; border-bottom:1px solid #e2e8f0; vertical-align:top;">${escapeHtml(v.quantita) || '—'}</td>
                <td style="padding:8px 7px; border-bottom:1px solid #e2e8f0; vertical-align:top;">${escapeHtml(v.lotto) || '—'}</td>
                <td style="padding:8px 7px; border-bottom:1px solid #e2e8f0; vertical-align:top;">${escapeHtml(v.scadenza) || '—'}</td>
                <td style="padding:8px 7px; border-bottom:1px solid #e2e8f0; vertical-align:top;">${v.temperatura !== null && v.temperatura !== undefined && v.temperatura !== '' ? escapeHtml(v.temperatura) + ' °C' : '—'}</td><td style="padding:8px 7px; border-bottom:1px solid #e2e8f0; vertical-align:top;">${v.prezzo_unitario !== null && v.prezzo_unitario !== undefined && v.prezzo_unitario !== '' ? '€ ' + escapeHtml(v.prezzo_unitario) + (v.unita_prezzo ? ' / ' + escapeHtml(v.unita_prezzo) : '') : '—'}</td><td style="padding:8px 7px; border-bottom:1px solid #e2e8f0; vertical-align:top;">${v.totale_riga !== null && v.totale_riga !== undefined && v.totale_riga !== '' ? '€ ' + escapeHtml(v.totale_riga) : '—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : '<div style="color:#64748b;">Nessun prodotto registrato.</div>'}
    </div>`;
}

export async function renderRicezioniPage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;

  const listaGiorno = (await leggiTutti('ricevimenti', [where('data_riferimento', '==', dataSelezionata)]))
    .sort((a, b) => (b.registrato_il?.seconds || 0) - (a.registrato_il?.seconds || 0));

  righeCorrenti = [rigaVuota()];
  // NON azzerare ricevimentoAperto qui: il pulsante "Apri" esegue un nuovo render.
  // Lo azzeriamo solo quando si cambia data, si chiude il dettaglio o si salva un nuovo DDT.
  const isOggi = dataSelezionata === oggiISO();

  container.innerHTML = `
    <div class="top-bar"><h2>Ricevimento merci</h2></div>
    <div class="list-card no-print">
      <label class="field-label">Data</label>
      <input type="date" id="rc-data" value="${dataSelezionata}" max="${oggiISO()}">
      ${!isOggi ? '<div style="font-size:12px; color:#b45309; margin-top:6px;">⚠️ Stai consultando una data passata.</div>' : ''}
    </div>
    ${isOggi ? `
    <div class="list-card" style="border:1px dashed #2b5c3a;">
      <div style="font-size:13px; font-weight:bold; color:#2b5c3a; margin-bottom:6px;">✨ Leggi la bolla con una foto</div>
      <div style="font-size:12px; color:#475569; margin-bottom:10px;">Riconosce fornitore e prodotti automaticamente. Controlla e correggi tutto prima di salvare.</div>
      <input type="file" id="rc-file-input" accept="image/*" style="display:none;">
      <button type="button" class="btn btn-secondary btn-block" id="rc-btn-foto">📷 Fotografa la bolla</button>
      <div id="rc-import-status" style="display:none; font-size:12px; color:#2b5c3a; font-weight:bold; text-align:center; margin-top:8px;"></div>
    </div>
    <div class="list-card">
      <label class="field-label">Fornitore</label>
      <input type="text" id="rc-fornitore" placeholder="Nome fornitore">
      <div class="form-row">
        <div><label class="field-label">N. documento</label><input type="text" id="rc-numero-doc"></div>
        <div><label class="field-label">Temperatura arrivo (°C)</label><input type="number" step="0.1" id="rc-temperatura" placeholder="Se pertinente"></div>
      </div>
      <label class="field-label">Prodotti in questa consegna</label>
      <div id="rc-righe"></div>
      <button type="button" class="btn btn-secondary" id="rc-add-riga" style="margin-bottom:14px;">+ Aggiungi prodotto</button>
      <label class="field-label">Conformità</label>
      <select id="rc-conformita"><option value="conforme">Conforme</option><option value="non_conforme">Non conforme</option></select>
      <label class="field-label">Note</label>
      <textarea id="rc-note"></textarea>
      <button class="btn btn-primary btn-block" id="rc-salva">Registra ricevimento</button>
    </div>` : ''}
    <h3 style="font-size:14px; color:#64748b; margin:16px 0 8px;">Ricevimenti del ${dataSelezionata} (${listaGiorno.length})</h3>
    ${listaGiorno.length === 0 ? '<div class="empty-state">Nessun ricevimento registrato in questa data.</div>' : `
      <div class="list-card">
        ${listaGiorno.map((r) => `
          <div class="check-row" style="cursor:default; align-items:flex-start; margin-bottom:8px;">
            <span class="dot ${r.conformita === 'non_conforme' ? 'warn' : 'ok'}"></span>
            <div class="rt" style="min-width:0; flex:1;">
              <div class="t">${escapeHtml(r.fornitore_nome)}${r.numero_documento ? ' — ' + escapeHtml(r.numero_documento) : ''}</div>
              <div class="s" style="white-space:normal; overflow-wrap:anywhere;">${(r.voci || []).map((v) => escapeHtml(v.nome)).join(', ') || '—'}</div>
            </div>
            <button type="button" class="btn btn-secondary rc-apri" data-id="${escapeHtml(r.id)}" style="flex:0 0 auto; white-space:nowrap;">${ricevimentoAperto === r.id ? 'Chiudi' : 'Apri'}</button>
          </div>
          ${ricevimentoAperto === r.id ? dettaglioRicevimento(r) : ''}
        `).join('')}
      </div>`}
  `;

  const dataInput = container.querySelector('#rc-data');
  if (dataInput) dataInput.addEventListener('change', (e) => {
    dataSelezionata = e.target.value;
    ricevimentoAperto = null;
    renderRicezioniPage(container, profilo);
  });

  container.querySelectorAll('.rc-apri').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      ricevimentoAperto = ricevimentoAperto === id ? null : id;
      renderRicezioniPage(container, profilo);
    });
  });

  function disegnaRighe() {
    const wrap = container.querySelector('#rc-righe');
    if (!wrap) return;
    wrap.innerHTML = righeCorrenti.map((riga, i) => `
      <div data-riga="${i}" style="display:grid; grid-template-columns:minmax(260px,1fr) 90px 110px 110px 80px 100px 100px auto; gap:10px; align-items:end; margin-bottom:14px; padding:12px; border:1px solid #e2e8f0; border-radius:10px; background:#f8fafc;">
        <div style="min-width:0;"><label class="field-label">Descrizione completa prodotto</label><textarea rows="2" placeholder="Descrizione completa del prodotto come da DDT" data-campo="nome" style="width:100%; min-height:58px; resize:vertical; box-sizing:border-box; white-space:pre-wrap; overflow-wrap:anywhere;">${escapeHtml(riga.nome)}</textarea></div>
        <div><label class="field-label">Quantità</label><input type="text" placeholder="Quantità" data-campo="quantita" value="${escapeHtml(riga.quantita)}"></div>
        <div><label class="field-label">Lotto</label><input type="text" placeholder="Lotto" data-campo="lotto" value="${escapeHtml(riga.lotto)}"></div>
        <div><label class="field-label">Scadenza / TMC</label><input type="text" placeholder="gg/mm/aaaa" data-campo="scadenza" value="${escapeHtml(riga.scadenza)}"></div>
        <div><label class="field-label">Temp. °C</label><input type="number" step="0.1" placeholder="°C" data-campo="temperatura" value="${escapeHtml(riga.temperatura)}"></div><div><label class="field-label">Prezzo unit. €</label><input type="number" step="0.01" placeholder="€" data-campo="prezzo_unitario" value="${escapeHtml(riga.prezzo_unitario)}"></div><div><label class="field-label">Totale riga €</label><input type="number" step="0.01" placeholder="€" data-campo="totale_riga" value="${escapeHtml(riga.totale_riga)}"></div>
        ${righeCorrenti.length > 1 ? '<button type="button" class="btn btn-danger rc-rimuovi" style="padding:8px 10px;">✕</button>' : ''}
      </div>`).join('');
    wrap.querySelectorAll('[data-riga]').forEach((rigaEl) => {
      const i = +rigaEl.dataset.riga;
      rigaEl.querySelectorAll('[data-campo]').forEach((input) => input.addEventListener('input', () => { righeCorrenti[i][input.dataset.campo] = input.value; }));
      const btn = rigaEl.querySelector('.rc-rimuovi');
      if (btn) btn.addEventListener('click', () => { righeCorrenti.splice(i, 1); disegnaRighe(); });
    });
  }

  disegnaRighe();
  const addRiga = container.querySelector('#rc-add-riga');
  if (addRiga) addRiga.addEventListener('click', () => { righeCorrenti.push(rigaVuota()); disegnaRighe(); });

  const statusBox = container.querySelector('#rc-import-status');
  const mostraStato = (msg) => { if (statusBox) { statusBox.style.display = 'block'; statusBox.textContent = msg; } };
  const nascondiStato = () => { if (statusBox) statusBox.style.display = 'none'; };
  const fotoBtn = container.querySelector('#rc-btn-foto');
  const fileInput = container.querySelector('#rc-file-input');
  if (fotoBtn && fileInput) {
    fotoBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      mostraStato('📷 Lettura della bolla in corso…');
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const resp = await fetch('/api/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageBase64: reader.result }) });
          const result = await resp.json();
          if (result.error) { alert(result.error); nascondiStato(); return; }
          const data = result.data || {};
          if (data.fornitore) container.querySelector('#rc-fornitore').value = data.fornitore;
          if (data.numeroDocumento) container.querySelector('#rc-numero-doc').value = data.numeroDocumento;
          if (Array.isArray(data.prodotti) && data.prodotti.length) {
            righeCorrenti = data.prodotti.map((p) => ({ nome: p.nome || p.descrizione || '', quantita: p.quantita || '', lotto: p.lotto || '', scadenza: p.scadenza || p.tmc || '', temperatura: p.temperatura || '', prezzo_unitario: p.prezzo_unitario ?? '', unita_prezzo: p.unita_prezzo || '', totale_riga: p.totale_riga ?? '' }));
            disegnaRighe();
          }
          mostraStato(result.isDemo ? '⚠️ Modalità demo: attiva GEMINI_API_KEY su Vercel per la lettura reale.' : '✓ Documento letto. Controlla le descrizioni complete prima di registrare il ricevimento.');
        } catch (err) { console.error(err); alert('Errore durante la lettura della foto.'); nascondiStato(); }
      };
      reader.readAsDataURL(file);
    });
  }

  const salva = container.querySelector('#rc-salva');
  if (salva) salva.addEventListener('click', async (e) => {
    const fornitore = container.querySelector('#rc-fornitore').value.trim();
    const voci = righeCorrenti.filter((r) => r.nome.trim()).map((r) => ({ nome: r.nome.trim(), quantita: r.quantita, lotto: r.lotto, scadenza: r.scadenza, temperatura: r.temperatura, prezzo_unitario: r.prezzo_unitario === '' ? null : Number(r.prezzo_unitario), unita_prezzo: r.unita_prezzo || null, totale_riga: r.totale_riga === '' ? null : Number(r.totale_riga) }));
    if (!fornitore || voci.length === 0) { alert('Inserisci almeno il fornitore e un prodotto.'); return; }
    e.currentTarget.disabled = true;
    try {
      const conformita = container.querySelector('#rc-conformita').value;
      await aggiungi('ricevimenti', {
        fornitore_nome: fornitore,
        numero_documento: container.querySelector('#rc-numero-doc').value,
        voci,
        temperatura: container.querySelector('#rc-temperatura').value || null,
        conformita,
        note: container.querySelector('#rc-note').value,
        data_riferimento: dataSelezionata,
        registrato_da: profilo.id,
      }, 'registrato_il');
      ricevimentoAperto = null;
      if (conformita === 'non_conforme') alert('Ricevimento registrato come NON conforme. Valuta di segnalare un\'anomalia.');
      renderRicezioniPage(container, profilo);
    } catch (err) { console.error(err); alert('Errore durante il salvataggio.'); e.currentTarget.disabled = false; }
  });
}
