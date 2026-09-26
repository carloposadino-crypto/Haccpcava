// Schede HACCP (preparazioni). Importazione assistita da IA con verifica
// prima del salvataggio, collegamento al listino prezzi e allergeni.
import { leggiTutti, aggiungi, aggiorna, elimina, orderBy } from './store.js';

const STATO_LABEL = { bozza: 'Bozza', da_revisionare: 'Da revisionare', approvata: 'Approvata' };
const STATO_BADGE = { bozza: 'badge-pending', da_revisionare: 'badge-warn', approvata: 'badge-ok' };
const ALLERGENI = [
  'Glutine', 'Crostacei', 'Uova', 'Pesce', 'Arachidi', 'Soia', 'Latte',
  'Frutta a guscio', 'Sedano', 'Senape', 'Sesamo', 'Anidride solforosa/Solfiti',
  'Lupini', 'Molluschi',
];

let righeCorrenti = [];
let listinoCorrente = [];
let prodottiCorrenti = [];
let importazioneDaVerificare = false;
let importazioneVerificata = false;

function rigaVuota() { return { nome: '', grammi: '', conversione: '' }; }

function normalizzaNome(nome) {
  return String(nome || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(igp|dop|doc|docg|bio|italiano|italiana|fresco|fresca|freschi|fresche|professionale|premium)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trovaVoceListino(nomeIngrediente) {
  const cercato = normalizzaNome(nomeIngrediente);
  if (!cercato) return null;
  let voce = listinoCorrente.find((v) => normalizzaNome(v.nome) === cercato);
  if (voce) return voce;
  const parole = cercato.split(' ');
  if (parole.length >= 2) {
    voce = listinoCorrente.find((v) => {
      const n = normalizzaNome(v.nome);
      return n.includes(cercato) || cercato.includes(n);
    });
    if (voce) return voce;
  }
  const significative = parole.filter((p) => p.length >= 4);
  if (significative.length >= 2) {
    voce = listinoCorrente.find((v) => {
      const n = normalizzaNome(v.nome).split(' ');
      return significative.every((p) => n.includes(p));
    });
  }
  return voce || null;
}

function trovaProdotto(nomeIngrediente) {
  const cercato = normalizzaNome(nomeIngrediente);
  if (!cercato) return null;
  let p = prodottiCorrenti.find((v) => normalizzaNome(v.denominazione) === cercato);
  if (p) return p;
  const parole = cercato.split(' ');
  if (parole.length >= 2) {
    p = prodottiCorrenti.find((v) => {
      const n = normalizzaNome(v.denominazione);
      return n.includes(cercato) || cercato.includes(n);
    });
    if (p) return p;
  }
  return null;
}

function allergeniDaNome(nome) {
  const n = normalizzaNome(nome);
  const trovati = new Set();
  const regole = [
    ['Glutine', /farina|pasta|tagliatell|agnolott|raviol|pane|pangratt|cous cous|orzo|segale|avena|grano|semola/],
    ['Uova', /uovo|uova|tuorlo|albume|maionese|pasta all uovo/],
    ['Pesce', /acciug|alice|alici|tonno|salmone|pesce|colatura/],
    ['Latte', /latte|burro|panna|formaggio|parmigiano|grana|mascarpone|mozzarella|ricotta|yogurt/],
    ['Sedano', /sedano/],
    ['Senape', /senape/],
    ['Soia', /soia|salsa di soia/],
    ['Frutta a guscio', /nocciol|mandorl|noce|noci|pistac|anacard|arachid/],
    ['Sesamo', /sesamo/],
    ['Anidride solforosa/Solfiti', /vino|marsala|aceto|solfit/],
    ['Crostacei', /gamber|scamp|aragost|granch|crostace/],
    ['Molluschi', /cozze|vongol|calamar|sepp|mollusch|ostric/],
    ['Lupini', /lupin/],
    ['Arachidi', /arachid/],
  ];
  regole.forEach(([a, re]) => { if (re.test(n)) trovati.add(a); });
  return [...trovati];
}

function analizzaIngrediente(riga) {
  const voce = trovaVoceListino(riga.nome);
  const prodotto = trovaProdotto(riga.nome);
  const allergeni = new Set(allergeniDaNome(riga.nome));
  (prodotto?.allergeni || []).forEach((a) => allergeni.add(a.allergene || a));
  return {
    voce,
    prodotto,
    allergeni: [...allergeni],
    prezzoKg: voce?.prezzo_kg != null ? Number(voce.prezzo_kg) : null,
    abbinatoListino: !!voce,
  };
}

function parseNumero(value) {
  if (value == null || value === '') return NaN;
  return Number(String(value).replace(',', '.'));
}

function parseIngredientiTesto(testo) {
  if (!testo) return [rigaVuota()];
  const righe = String(testo).split('\n').map((r) => r.trim()).filter(Boolean).map((riga) => {
    const m = riga.match(/^(.+?)(?:\s*:\s*|\s+-\s*)([\d.,]+)\s*(kg|g|ml|l)?\s*$/i);
    if (!m) {
      const qb = riga.match(/^(.+?)(?:\s*:\s*|\s+-\s*)q\.?b\.?$/i);
      if (qb) return { nome: qb[1].trim(), grammi: '', conversione: 'q.b. — quantità da definire' };
      return { nome: riga.replace(/^[-•]\s*/, ''), grammi: '', conversione: 'Da verificare' };
    }
    const nome = m[1].trim();
    const numero = parseNumero(m[2]);
    const unita = (m[3] || 'g').toLowerCase();
    let grammi = numero;
    if (unita === 'kg') grammi = numero * 1000;
    if (unita === 'l') grammi = numero * 1000;
    if (unita === 'ml') grammi = numero;
    const conversione = unita !== 'g' ? `${m[2]} ${unita} → ${grammi} g` : '';
    return { nome, grammi: Number.isFinite(grammi) ? String(grammi).replace(/\.0$/, '') : '', conversione };
  });
  return righe.length ? righe : [rigaVuota()];
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}

export async function renderRicettePage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;
  const [schede, listino, prodotti] = await Promise.all([
    leggiTutti('schede_haccp', [orderBy('creato_il', 'desc')]).catch(() => []),
    leggiTutti('listino_prezzi').catch(() => []),
    leggiTutti('prodotti').catch(() => []),
  ]);
  listinoCorrente = listino;
  prodottiCorrenti = prodotti;
  righeCorrenti = [rigaVuota()];
  importazioneDaVerificare = false;
  importazioneVerificata = false;

  container.innerHTML = `
    <div class="top-bar"><h2>Schede HACCP</h2></div>
    <div class="list-card" style="border:1px dashed #2b5c3a;">
      <div style="font-size:13px; font-weight:bold; color:#2b5c3a; margin-bottom:6px;">✨ Importazione automatica</div>
      <div style="font-size:12px; color:#475569; margin-bottom:10px;">Importa una foto, un PDF o un link. L'app normalizza ingredienti e grammature, confronta il listino, individua gli allergeni e ti fa verificare tutto prima del salvataggio.</div>
      <input type="file" id="sc-file-input" accept="image/*,application/pdf" style="display:none;">
      <button type="button" class="btn btn-secondary btn-block" id="sc-btn-foto" style="margin-bottom:10px;">📷 Foto / screenshot</button>
      <button type="button" class="btn btn-secondary" id="sc-btn-pdf" style="margin-bottom:10px;">📄 PDF</button>
      <div class="form-row">
        <input type="url" id="sc-url-input" placeholder="https://sito-ricette.it/ricetta...">
        <button type="button" class="btn btn-secondary" id="sc-btn-url" style="flex:0 0 auto;">🔗 Importa</button>
      </div>
      <div id="sc-import-status" style="display:none; font-size:12px; color:#2b5c3a; font-weight:bold; text-align:center; margin-top:6px;"></div>
    </div>

    <div id="sc-verifica" class="list-card" style="display:none; border:1px solid #f59e0b; background:#fffbeb;"></div>

    <div class="list-card">
      <label class="field-label">Nome preparazione</label>
      <input type="text" id="sc-nome" placeholder="Es. Vitello Tonnato CBT">
      <div class="form-row">
        <div><label class="field-label">Codice</label><input type="text" id="sc-codice" placeholder="Es. SEC-01"></div>
        <div><label class="field-label">Numero porzioni</label><input type="number" id="sc-porzioni" value="20"></div>
        <div><label class="field-label">Prezzo vendita (€)</label><input type="number" step="0.01" id="sc-prezzo-vendita" placeholder="Es. 18.00"></div>
      </div>

      <label class="field-label">Ingredienti (sempre in grammi)</label>
      <div id="sc-righe"></div>
      <button type="button" class="btn btn-secondary" id="sc-add-riga" style="margin-bottom:6px;">+ Aggiungi ingrediente</button>
      <div id="sc-costo-box" style="background:#f0fdf4; border-radius:8px; padding:10px 12px; margin:10px 0 14px; font-size:13px; color:#166534;"></div>

      <label class="field-label">Allergeni rilevati</label>
      <div id="sc-allergeni" style="font-size:13px; color:#374151; margin-bottom:14px;">Nessuno rilevato</div>

      <label class="field-label">Processo / procedimento</label>
      <textarea id="sc-processo" placeholder="Passaggi principali, tempi e temperature"></textarea>
      <label class="field-label">Pericoli individuati</label>
      <textarea id="sc-pericoli" placeholder="Es. sviluppo microbico, contaminazione crociata"></textarea>
      <label class="field-label">Misure di controllo</label>
      <textarea id="sc-misure" placeholder="Come si tengono sotto controllo i pericoli"></textarea>
      <label class="field-label">CCP (punti critici di controllo)</label>
      <textarea id="sc-ccp" placeholder="Es. Abbattimento entro 90 min a +3°C al cuore"></textarea>
      <label class="field-label">Note</label>
      <textarea id="sc-note"></textarea>
      <button class="btn btn-primary btn-block" id="sc-salva">Salva come bozza</button>
    </div>

    <h3 style="font-size:14px; color:#64748b; margin:16px 0 8px;">Elenco (${schede.length})</h3>
    ${schede.length === 0 ? '<div class="empty-state">Nessuna scheda ancora creata.</div>' : `
      <div class="list-card">
        ${schede.map((s) => `
          <div class="check-row" data-scheda="${s.id}">
            <div class="rt"><div class="t">${escapeHtml(s.nome)}</div>
            <div class="s">${escapeHtml(s.codice || '')}${s.costo_a_porzione != null ? ` · € ${Number(s.costo_a_porzione).toFixed(2)} a porzione` : ''}${s.food_cost_percentuale != null ? ` · FC ${Number(s.food_cost_percentuale).toFixed(1)}%` : ''}</div></div>
            <span class="badge ${STATO_BADGE[s.stato] || 'badge-pending'}">${STATO_LABEL[s.stato] || s.stato}</span>
            ${(s.stato !== 'approvata' && profilo.ruolo === 'responsabile') ? '<button class="btn btn-secondary sc-approva" style="margin-left:8px;">Approva</button>' : ''}
            <span class="chev">▾</span>
          </div>
          <div class="sc-dettaglio" data-dettaglio="${s.id}" style="display:none; padding:4px 4px 16px;">
            <div style="font-size:13px; color:#374151; line-height:1.6;">
              <strong>Porzioni:</strong> ${s.porzioni || '—'}<br>
              <strong>Ingredienti:</strong><br>
              ${Array.isArray(s.contenuto?.ingredienti) && s.contenuto.ingredienti.length ? s.contenuto.ingredienti.map((i) => `&nbsp;&nbsp;• ${escapeHtml(i.nome)} — ${escapeHtml(i.grammi)} g`).join('<br>') : '&nbsp;&nbsp;(nessun ingrediente inserito)'}
              <br><br><strong>Allergeni:</strong> ${(s.contenuto?.allergeni || []).join(', ') || '—'}<br><br>
              <strong>Processo:</strong><br>${escapeHtml(s.contenuto?.processo || '—').replace(/\n/g, '<br>')}<br><br>
              <strong>Pericoli:</strong><br>${escapeHtml(s.contenuto?.pericoli || '—').replace(/\n/g, '<br>')}<br><br>
              <strong>Misure di controllo:</strong><br>${escapeHtml(s.contenuto?.misure_controllo || '—').replace(/\n/g, '<br>')}<br><br>
              <strong>CCP:</strong><br>${escapeHtml(s.contenuto?.ccp || '—').replace(/\n/g, '<br>')}<br><br>
              <strong>Note:</strong><br>${escapeHtml(s.contenuto?.note || '—').replace(/\n/g, '<br>')}
            </div>
            ${s.stato !== 'approvata' ? `<button class="btn btn-danger sc-elimina" data-elimina="${s.id}" style="margin-top:14px;">Elimina scheda</button>` : ''}
          </div>
        `).join('')}
      </div>
    `}
  `;

  container.querySelectorAll('[data-scheda]').forEach((riga) => {
    riga.addEventListener('click', (e) => {
      if (e.target.classList.contains('sc-approva') || e.target.classList.contains('sc-elimina')) return;
      const id = riga.dataset.scheda;
      const dettaglio = container.querySelector(`[data-dettaglio="${id}"]`);
      const chev = riga.querySelector('.chev');
      const aperto = dettaglio.style.display !== 'none';
      dettaglio.style.display = aperto ? 'none' : 'block';
      if (chev) chev.textContent = aperto ? '▾' : '▴';
    });
  });

  function calcolaCosto() {
    let costoTotale = 0;
    let senzaPrezzo = 0;
    righeCorrenti.forEach((r) => {
      const grammi = parseNumero(r.grammi);
      if (!r.nome.trim() || !Number.isFinite(grammi)) return;
      const info = analizzaIngrediente(r);
      if (info.prezzoKg == null) { senzaPrezzo++; return; }
      costoTotale += (grammi / 1000) * info.prezzoKg;
    });
    const porzioni = parseInt(container.querySelector('#sc-porzioni').value, 10) || 1;
    const costoPorzione = costoTotale / porzioni;
    const prezzoVendita = parseNumero(container.querySelector('#sc-prezzo-vendita')?.value) || 0;
    const foodCostPercentuale = prezzoVendita > 0 ? (costoPorzione / prezzoVendita) * 100 : null;
    const box = container.querySelector('#sc-costo-box');
    box.innerHTML = `Costo ingredienti: <strong>€ ${costoTotale.toFixed(2)}</strong> — a porzione: <strong>€ ${costoPorzione.toFixed(2)}</strong>` + (foodCostPercentuale != null ? ` — Food cost: <strong>${foodCostPercentuale.toFixed(1)}%</strong>` : '') + (senzaPrezzo > 0 ? `<br><span style="color:#b45309;">⚠️ ${senzaPrezzo} ingrediente/i senza prezzo nel listino: il costo è parziale.</span>` : '');
    return { costoTotale, costoPorzione, porzioni, prezzoVendita, foodCostPercentuale };
  }

  function aggiornaAllergeni() {
    const set = new Set();
    righeCorrenti.filter((r) => r.nome.trim()).forEach((r) => analizzaIngrediente(r).allergeni.forEach((a) => set.add(a)));
    const ordine = ALLERGENI.filter((a) => set.has(a));
    container.querySelector('#sc-allergeni').innerHTML = ordine.length
      ? ordine.map((a) => `<span style="display:inline-block;background:#fef3c7;border:1px solid #f59e0b;border-radius:999px;padding:4px 8px;margin:2px;">${escapeHtml(a)}</span>`).join('')
      : 'Nessuno rilevato';
    return ordine;
  }

  function disegnaRighe() {
    const wrap = container.querySelector('#sc-righe');
    wrap.innerHTML = righeCorrenti.map((riga, i) => {
      const info = analizzaIngrediente(riga);
      const prezzo = info.prezzoKg != null ? `€ ${info.prezzoKg.toFixed(2)}/kg` : '⚠️ prezzo non trovato';
      const match = info.voce ? `<span style="color:#166534;font-size:11px;">✓ ${escapeHtml(info.voce.nome)} · ${prezzo}</span>` : `<span style="color:#b45309;font-size:11px;">${prezzo}</span>`;
      const conversione = riga.conversione ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">↳ ${escapeHtml(riga.conversione)}</div>` : '';
      return `<div style="margin-bottom:8px;" data-riga="${i}">
        <div class="form-row">
          <input type="text" placeholder="Ingrediente" data-campo="nome" value="${escapeHtml(riga.nome)}">
          <input type="number" placeholder="g" data-campo="grammi" value="${escapeHtml(riga.grammi)}" style="flex:0 0 90px;">
          ${righeCorrenti.length > 1 ? `<button type="button" class="btn btn-danger sc-rimuovi" style="flex:0 0 auto;padding:8px 10px;">✕</button>` : ''}
        </div>${match}${conversione}
      </div>`;
    }).join('');
    wrap.querySelectorAll('[data-riga]').forEach((rigaEl) => {
      const i = +rigaEl.dataset.riga;
      rigaEl.querySelectorAll('[data-campo]').forEach((input) => input.addEventListener('input', () => {
        righeCorrenti[i][input.dataset.campo] = input.value;
        if (importazioneDaVerificare) { importazioneVerificata = false; aggiornaVerifica(); }
        calcolaCosto(); aggiornaAllergeni();
      }));
      const btn = rigaEl.querySelector('.sc-rimuovi');
      if (btn) btn.addEventListener('click', () => { righeCorrenti.splice(i, 1); disegnaRighe(); calcolaCosto(); aggiornaAllergeni(); if (importazioneDaVerificare) { importazioneVerificata = false; aggiornaVerifica(); } });
    });
  }

  function aggiornaVerifica() {
    const box = container.querySelector('#sc-verifica');
    if (!importazioneDaVerificare) { box.style.display = 'none'; return; }
    const conPrezzo = righeCorrenti.filter((r) => r.nome.trim()).map(analizzaIngrediente).filter((x) => x.voce).length;
    const tot = righeCorrenti.filter((r) => r.nome.trim()).length;
    const senzaPrezzo = tot - conPrezzo;
    const senzaGrammi = righeCorrenti.filter((r) => r.nome.trim() && !Number.isFinite(parseNumero(r.grammi))).length;
    const allergeni = aggiornaAllergeni();
    const problemi = [];
    if (senzaPrezzo) problemi.push(`${senzaPrezzo} ingrediente/i non collegati al listino`);
    if (senzaGrammi) problemi.push(`${senzaGrammi} ingrediente/i senza grammatura`);
    box.style.display = 'block';
    box.innerHTML = `<div style="font-weight:bold;color:#92400e;margin-bottom:6px;">🔎 VERIFICA IMPORTAZIONE</div>
      <div style="font-size:12px;color:#374151;line-height:1.5;">Ingredienti riconosciuti: <strong>${tot}</strong> · collegati al listino: <strong>${conPrezzo}</strong> · allergeni rilevati: <strong>${allergeni.length}</strong>.</div>
      ${problemi.length ? `<div style="margin-top:6px;color:#b45309;font-size:12px;">⚠️ ${problemi.join(' · ')}</div>` : '<div style="margin-top:6px;color:#166534;font-size:12px;">✓ Nessuna anomalia automatica rilevata.</div>'}
      <div style="margin-top:10px;font-size:12px;color:#475569;">Controlla nome, porzioni, grammature, ingredienti e procedimento. L'importazione non viene considerata verificata finché non premi il pulsante.</div>
      <button type="button" class="btn btn-primary btn-block" id="sc-conferma-verifica" style="margin-top:10px;">✓ Conferma verifica importazione</button>`;
    if (importazioneVerificata) {
      box.style.borderColor = '#16a34a'; box.style.background = '#f0fdf4';
      box.innerHTML += '<div style="margin-top:7px;color:#166534;font-weight:bold;font-size:12px;">✓ Importazione verificata. Ora puoi salvare la scheda.</div>';
      const b = box.querySelector('#sc-conferma-verifica'); if (b) b.style.display = 'none';
    }
    const btn = box.querySelector('#sc-conferma-verifica');
    if (btn) btn.addEventListener('click', () => { importazioneVerificata = true; aggiornaVerifica(); aggiornaPulsanteSalva(); });
    aggiornaPulsanteSalva();
  }

  function aggiornaPulsanteSalva() {
    const btn = container.querySelector('#sc-salva');
    btn.disabled = importazioneDaVerificare && !importazioneVerificata;
    btn.textContent = btn.disabled ? '🔒 Verifica l’importazione prima di salvare' : 'Salva come bozza';
  }

  function disegnaStato() {
    calcolaCosto(); aggiornaAllergeni(); disegnaRighe(); aggiornaVerifica(); aggiornaPulsanteSalva();
  }

  disegnaRighe(); calcolaCosto(); aggiornaAllergeni(); aggiornaPulsanteSalva();
  container.querySelector('#sc-add-riga').addEventListener('click', () => { righeCorrenti.push(rigaVuota()); disegnaRighe(); calcolaCosto(); aggiornaAllergeni(); if (importazioneDaVerificare) { importazioneVerificata = false; aggiornaVerifica(); } });
  container.querySelector('#sc-porzioni').addEventListener('input', () => { calcolaCosto(); if (importazioneDaVerificare) { importazioneVerificata = false; aggiornaVerifica(); } });
  container.querySelector('#sc-prezzo-vendita').addEventListener('input', calcolaCosto);

  const statusBox = container.querySelector('#sc-import-status');
  const mostraStato = (msg) => { statusBox.style.display = 'block'; statusBox.textContent = msg; };
  const nascondiStato = () => { statusBox.style.display = 'none'; };

  const applicaRicetta = (data) => {
    container.querySelector('#sc-nome').value = data.nome || data.titolo || '';
    if (data.porzioni) container.querySelector('#sc-porzioni').value = data.porzioni;
    if (Array.isArray(data.ingredienti)) {
      righeCorrenti = data.ingredienti.map((i) => ({ nome: i.nome || '', grammi: i.grammi ?? '', conversione: i.conversione || '' }));
    } else {
      righeCorrenti = parseIngredientiTesto(data.ingredienti || data.ingredientiText || '');
    }
    container.querySelector('#sc-processo').value = data.procedimento || data.procedimentoNumerato || '';
    container.querySelector('#sc-note').value = data.haccpNote || data.noteHaccp || data.haccp || '';
    container.querySelector('#sc-pericoli').value = data.pericoli || '';
    container.querySelector('#sc-misure').value = data.misureControllo || '';
    container.querySelector('#sc-ccp').value = data.ccp || '';
    importazioneDaVerificare = true;
    importazioneVerificata = false;
    disegnaStato();
    container.querySelector('#sc-verifica').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  container.querySelector('#sc-btn-url').addEventListener('click', async () => {
    const url = container.querySelector('#sc-url-input').value.trim();
    if (!url) { alert('Inserisci un link valido.'); return; }
    mostraStato('⚙️ Lettura della ricetta in corso…');
    try {
      const resp = await fetch('/api/parse-recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await resp.json();
      if (data.error) { alert(data.error); nascondiStato(); return; }
      applicaRicetta(data); nascondiStato();
    } catch (err) { console.error(err); alert('Errore di comunicazione durante l’importazione.'); nascondiStato(); }
  });

  container.querySelector('#sc-btn-foto').addEventListener('click', () => container.querySelector('#sc-file-input').click());
  container.querySelector('#sc-btn-pdf').addEventListener('click', () => container.querySelector('#sc-file-input').click());
  container.querySelector('#sc-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const ePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    mostraStato(ePdf ? '📄 Lettura del PDF in corso…' : '📷 Lettura dell’immagine in corso…');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resp = await fetch('/api/parse-recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file: reader.result, mimeType: file.type || (ePdf ? 'application/pdf' : 'image/jpeg') }) });
        const data = await resp.json();
        if (data.error) { alert(data.error); nascondiStato(); return; }
        applicaRicetta(data); nascondiStato();
      } catch (err) { console.error(err); alert('Errore durante la lettura del file.'); nascondiStato(); }
    };
    reader.readAsDataURL(file);
  });

  container.querySelector('#sc-salva').addEventListener('click', async (e) => {
    const nome = container.querySelector('#sc-nome').value.trim();
    if (!nome) { alert('Inserisci il nome della preparazione.'); return; }
    if (importazioneDaVerificare && !importazioneVerificata) { alert('Prima di salvare devi confermare la verifica dell’importazione.'); return; }
    const righeValide = righeCorrenti.filter((r) => r.nome.trim());
    const { costoTotale, costoPorzione, porzioni, prezzoVendita, foodCostPercentuale } = calcolaCosto();
    const allergeni = aggiornaAllergeni();
    if (righeValide.some((r) => !Number.isFinite(parseNumero(r.grammi)))) {
      if (!confirm('Una o più righe non hanno una grammatura numerica. Vuoi salvare comunque?')) return;
    }
    e.currentTarget.disabled = true;
    try {
      await aggiungi('schede_haccp', {
        nome,
        codice: container.querySelector('#sc-codice').value,
        porzioni,
        stato: 'bozza',
        contenuto: {
          ingredienti: righeValide.map((r) => ({ nome: r.nome.trim(), grammi: r.grammi, conversione: r.conversione || '' })),
          allergeni,
          processo: container.querySelector('#sc-processo').value,
          pericoli: container.querySelector('#sc-pericoli').value,
          misure_controllo: container.querySelector('#sc-misure').value,
          ccp: container.querySelector('#sc-ccp').value,
          note: container.querySelector('#sc-note').value,
        },
        costo_totale: Math.round(costoTotale * 100) / 100,
        costo_a_porzione: Math.round(costoPorzione * 100) / 100,
        prezzo_vendita: prezzoVendita > 0 ? Math.round(prezzoVendita * 100) / 100 : null,
        food_cost_percentuale: foodCostPercentuale != null ? Math.round(foodCostPercentuale * 10) / 10 : null,
        autore_id: profilo.id,
      }, 'creato_il');
      renderRicettePage(container, profilo);
    } catch (err) { console.error(err); alert('Errore durante il salvataggio.'); e.currentTarget.disabled = false; }
  });

  schede.forEach((s) => {
    const btn = container.querySelector(`[data-scheda="${s.id}"] .sc-approva`); if (!btn) return;
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); e.currentTarget.disabled = true;
      try { await aggiorna('schede_haccp', s.id, { stato: 'approvata', approvato_da: profilo.id }); renderRicettePage(container, profilo); }
      catch (err) { console.error(err); alert('Errore durante l’approvazione.'); e.currentTarget.disabled = false; }
    });
  });

  container.querySelectorAll('.sc-elimina').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Eliminare definitivamente questa scheda? Non si può annullare.')) return;
      e.currentTarget.disabled = true;
      try { await elimina('schede_haccp', btn.dataset.elimina); renderRicettePage(container, profilo); }
      catch (err) { console.error(err); alert('Errore durante l’eliminazione.'); e.currentTarget.disabled = false; }
    });
  });
}
