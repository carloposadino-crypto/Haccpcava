// Schede HACCP (preparazioni). Gli ingredienti sono righe con nome e
// grammi (mai altre unità, per restare sempre confrontabili) — così
// l'app può calcolare da sola il costo della preparazione e il costo
// a porzione, leggendo i prezzi dalla pagina Listino prezzi.
// Si può anche importare una bozza da un link o da una foto/screenshot
// tramite IA: i campi si riempiono da soli, ma restano sempre
// modificabili prima di salvare.

import { leggiTutti, aggiungi, aggiorna, orderBy } from './store.js';

const STATO_LABEL = { bozza: 'Bozza', da_revisionare: 'Da revisionare', approvata: 'Approvata' };
const STATO_BADGE = { bozza: 'badge-pending', da_revisionare: 'badge-warn', approvata: 'badge-ok' };

let righeCorrenti = [];
let listinoCorrente = [];

function rigaVuota() { return { nome: '', grammi: '' }; }

// Cerca il prezzo al kg di un ingrediente nel listino: prima match
// esatto, poi un match "contiene" in entrambe le direzioni. Se non
// trova nulla, ritorna null (l'ingrediente resta fuori dal calcolo).
function trovaPrezzoKg(nomeIngrediente) {
  const cercato = nomeIngrediente.trim().toLowerCase();
  if (!cercato) return null;
  let voce = listinoCorrente.find((v) => v.nome.trim().toLowerCase() === cercato);
  if (!voce) voce = listinoCorrente.find((v) => cercato.includes(v.nome.trim().toLowerCase()) || v.nome.trim().toLowerCase().includes(cercato));
  return voce ? voce.prezzo_kg : null;
}

// Converte il testo restituito dall'importazione IA (righe tipo
// "Farina 00: 500g") in righe {nome, grammi}; le righe che non
// rispettano il formato entrano con i grammi vuoti, da completare a mano.
function parseIngredientiTesto(testo) {
  if (!testo) return [rigaVuota()];
  const righe = testo.split('\n').map((r) => r.trim()).filter(Boolean).map((riga) => {
    const m = riga.match(/^(.+?):\s*([\d.,]+)\s*g$/i);
    return m ? { nome: m[1].trim(), grammi: m[2].replace(',', '.') } : { nome: riga.replace(/^-\s*/, ''), grammi: '' };
  });
  return righe.length ? righe : [rigaVuota()];
}

export async function renderRicettePage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;
  const [schede, listino] = await Promise.all([
    leggiTutti('schede_haccp', [orderBy('creato_il', 'desc')]).catch(() => []),
    leggiTutti('listino_prezzi').catch(() => []),
  ]);
  listinoCorrente = listino;
  righeCorrenti = [rigaVuota()];

  container.innerHTML = `
    <div class="top-bar"><h2>Schede HACCP</h2></div>

    <div class="list-card" style="border:1px dashed #2b5c3a;">
      <div style="font-size:13px; font-weight:bold; color:#2b5c3a; margin-bottom:6px;">✨ Importazione automatica</div>
      <div style="font-size:12px; color:#475569; margin-bottom:10px;">Carica una foto/screenshot della ricetta, oppure incolla un link. Poi controlli e correggi i grammi prima di salvare.</div>
      <input type="file" id="sc-file-input" accept="image/*" capture="environment" style="display:none;">
      <button type="button" class="btn btn-secondary btn-block" id="sc-btn-foto" style="margin-bottom:10px;">📷 Scegli foto / screenshot</button>
      <div class="form-row">
        <input type="url" id="sc-url-input" placeholder="https://sito-ricette.it/ricetta...">
        <button type="button" class="btn btn-secondary" id="sc-btn-url" style="flex:0 0 auto;">🔗 Importa</button>
      </div>
      <div id="sc-import-status" style="display:none; font-size:12px; color:#2b5c3a; font-weight:bold; text-align:center; margin-top:6px;"></div>
    </div>

    <div class="list-card">
      <label class="field-label">Nome preparazione</label>
      <input type="text" id="sc-nome" placeholder="Es. Vitello Tonnato CBT">
      <div class="form-row">
        <div><label class="field-label">Codice</label><input type="text" id="sc-codice" placeholder="Es. SEC-01"></div>
        <div><label class="field-label">Numero porzioni</label><input type="number" id="sc-porzioni" value="20"></div>
      </div>

      <label class="field-label">Ingredienti (sempre in grammi)</label>
      <div id="sc-righe"></div>
      <button type="button" class="btn btn-secondary" id="sc-add-riga" style="margin-bottom:6px;">+ Aggiungi ingrediente</button>
      <div id="sc-costo-box" style="background:#f0fdf4; border-radius:8px; padding:10px 12px; margin:10px 0 14px; font-size:13px; color:#166534;"></div>

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

    <h3 style="font-size:14px; color:#64748b; margin: 16px 0 8px;">Elenco (${schede.length})</h3>
    ${schede.length === 0 ? '<div class="empty-state">Nessuna scheda ancora creata.</div>' : `
      <div class="list-card">
        ${schede.map((s) => `
          <div class="check-row" style="cursor:default;" data-scheda="${s.id}">
            <div class="rt">
              <div class="t">${s.nome}</div>
              <div class="s">${s.codice || ''}${s.costo_a_porzione != null ? ` · € ${s.costo_a_porzione.toFixed(2)} a porzione` : ''}</div>
            </div>
            <span class="badge ${STATO_BADGE[s.stato] || 'badge-pending'}">${STATO_LABEL[s.stato] || s.stato}</span>
            ${(s.stato !== 'approvata' && profilo.ruolo === 'responsabile') ? '<button class="btn btn-secondary sc-approva" style="margin-left:8px;">Approva</button>' : ''}
          </div>
        `).join('')}
      </div>
    `}
  `;

  function calcolaCosto() {
    let costoTotale = 0;
    let senzaPrezzo = 0;
    righeCorrenti.forEach((r) => {
      const grammi = parseFloat(r.grammi);
      if (!r.nome.trim() || Number.isNaN(grammi)) return;
      const prezzoKg = trovaPrezzoKg(r.nome);
      if (prezzoKg == null) { senzaPrezzo++; return; }
      costoTotale += (grammi / 1000) * prezzoKg;
    });
    const porzioni = parseInt(container.querySelector('#sc-porzioni').value, 10) || 1;
    const costoPorzione = costoTotale / porzioni;
    const box = container.querySelector('#sc-costo-box');
    box.innerHTML = `Costo ingredienti: <strong>€ ${costoTotale.toFixed(2)}</strong> — a porzione: <strong>€ ${costoPorzione.toFixed(2)}</strong>`
      + (senzaPrezzo > 0 ? `<br><span style="color:#b45309;">⚠️ ${senzaPrezzo} ingrediente/i senza prezzo nel listino: il costo è parziale. Aggiungili in "Altro → Listino prezzi".</span>` : '');
    return { costoTotale, costoPorzione, porzioni };
  }

  function disegnaRighe() {
    const wrap = container.querySelector('#sc-righe');
    wrap.innerHTML = righeCorrenti.map((riga, i) => `
      <div class="form-row" data-riga="${i}">
        <input type="text" placeholder="Ingrediente" data-campo="nome" value="${riga.nome}">
        <input type="number" placeholder="g" data-campo="grammi" value="${riga.grammi}" style="flex:0 0 90px;">
        ${righeCorrenti.length > 1 ? `<button type="button" class="btn btn-danger sc-rimuovi" style="flex:0 0 auto; padding:8px 10px;">✕</button>` : ''}
      </div>
    `).join('');

    wrap.querySelectorAll('[data-riga]').forEach((rigaEl) => {
      const i = +rigaEl.dataset.riga;
      rigaEl.querySelectorAll('[data-campo]').forEach((input) => {
        input.addEventListener('input', () => { righeCorrenti[i][input.dataset.campo] = input.value; calcolaCosto(); });
      });
      const btnRimuovi = rigaEl.querySelector('.sc-rimuovi');
      if (btnRimuovi) btnRimuovi.addEventListener('click', () => { righeCorrenti.splice(i, 1); disegnaRighe(); calcolaCosto(); });
    });
  }
  disegnaRighe();
  calcolaCosto();

  container.querySelector('#sc-add-riga').addEventListener('click', () => { righeCorrenti.push(rigaVuota()); disegnaRighe(); calcolaCosto(); });
  container.querySelector('#sc-porzioni').addEventListener('input', calcolaCosto);

  const statusBox = container.querySelector('#sc-import-status');
  const mostraStato = (msg) => { statusBox.style.display = 'block'; statusBox.textContent = msg; };
  const nascondiStato = () => { statusBox.style.display = 'none'; };

  const applicaRicetta = (data) => {
    container.querySelector('#sc-nome').value = data.nome || '';
    if (data.porzioni) container.querySelector('#sc-porzioni').value = data.porzioni;
    righeCorrenti = parseIngredientiTesto(data.ingredienti || data.ingredientiText || '');
    disegnaRighe();
    container.querySelector('#sc-processo').value = data.procedimento || data.procedimentoNumerato || '';
    container.querySelector('#sc-note').value = data.haccpNote || data.noteHaccp || data.haccp || '';
    calcolaCosto();
    container.querySelector('#sc-nome').scrollIntoView({ behavior: 'smooth' });
  };

  container.querySelector('#sc-btn-url').addEventListener('click', async () => {
    const url = container.querySelector('#sc-url-input').value.trim();
    if (!url) { alert('Inserisci un link valido.'); return; }
    mostraStato('⚙️ Lettura della ricetta in corso…');
    try {
      const resp = await fetch('/api/parse-recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await resp.json();
      if (data.error) { alert(data.error); nascondiStato(); return; }
      applicaRicetta(data);
      nascondiStato();
    } catch (err) {
      console.error(err);
      alert('Errore di comunicazione durante l\'importazione.');
      nascondiStato();
    }
  });

  container.querySelector('#sc-btn-foto').addEventListener('click', () => container.querySelector('#sc-file-input').click());
  container.querySelector('#sc-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    mostraStato('📷 Lettura dell\'immagine in corso…');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resp = await fetch('/api/parse-recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: reader.result }) });
        const data = await resp.json();
        if (data.error) { alert(data.error); nascondiStato(); return; }
        applicaRicetta(data);
        nascondiStato();
      } catch (err) {
        console.error(err);
        alert('Errore durante la lettura dell\'immagine.');
        nascondiStato();
      }
    };
    reader.readAsDataURL(file);
  });

  container.querySelector('#sc-salva').addEventListener('click', async (e) => {
    const nome = container.querySelector('#sc-nome').value.trim();
    if (!nome) { alert('Inserisci il nome della preparazione.'); return; }
    const righeValide = righeCorrenti.filter((r) => r.nome.trim());
    const { costoTotale, costoPorzione, porzioni } = calcolaCosto();

    e.currentTarget.disabled = true;
    try {
      await aggiungi('schede_haccp', {
        nome,
        codice: container.querySelector('#sc-codice').value,
        porzioni,
        stato: 'bozza',
        contenuto: {
          ingredienti: righeValide,
          processo: container.querySelector('#sc-processo').value,
          pericoli: container.querySelector('#sc-pericoli').value,
          misure_controllo: container.querySelector('#sc-misure').value,
          ccp: container.querySelector('#sc-ccp').value,
          note: container.querySelector('#sc-note').value,
        },
        costo_totale: Math.round(costoTotale * 100) / 100,
        costo_a_porzione: Math.round(costoPorzione * 100) / 100,
        autore_id: profilo.id,
      }, 'creato_il');
      renderRicettePage(container, profilo);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
      e.currentTarget.disabled = false;
    }
  });

  schede.forEach((s) => {
    const btn = container.querySelector(`[data-scheda="${s.id}"] .sc-approva`);
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.currentTarget.disabled = true;
      try {
        await aggiorna('schede_haccp', s.id, { stato: 'approvata', approvato_da: profilo.id });
        renderRicettePage(container, profilo);
      } catch (err) {
        console.error(err);
        alert('Errore durante l\'approvazione.');
        e.currentTarget.disabled = false;
      }
    });
  });
}
