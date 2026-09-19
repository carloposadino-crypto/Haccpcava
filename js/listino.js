// Listino prezzi fornitori: un prezzo al kg per ogni ingrediente, usato
// dalla pagina Schede HACCP per calcolare il costo a porzione.
// Si può inserire a mano, oppure caricare un listino intero (PDF o
// foto): l'IA propone le righe, ma nulla viene salvato finché non le
// confermi tu una per una — un prezzo sbagliato letto male non deve
// mai finire nel listino senza controllo.

import { leggiTutti, aggiungi, aggiorna, orderBy } from './store.js';

let righeDaConfermare = [];

export async function renderListinoPage(container) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;
  const voci = await leggiTutti('listino_prezzi', [orderBy('nome', 'asc')]).catch(() => []);

  container.innerHTML = `
    <div class="top-bar"><h2>Listino prezzi</h2></div>
    <div style="font-size:12px; color:#64748b; margin-bottom:12px;">Prezzo al kg per ogni ingrediente. Usato per calcolare il costo a porzione nelle Schede HACCP.</div>

    <div class="list-card" style="border:1px dashed #2b5c3a;">
      <div style="font-size:13px; font-weight:bold; color:#2b5c3a; margin-bottom:6px;">✨ Carica un listino intero</div>
      <div style="font-size:12px; color:#475569; margin-bottom:10px;">PDF o foto del listino del fornitore. Le righe lette vengono mostrate per il tuo controllo — niente si salva finché non confermi.</div>
      <input type="file" id="ls-file-input" accept="application/pdf,image/*" style="display:none;">
      <button type="button" class="btn btn-secondary btn-block" id="ls-btn-upload">📄 Carica PDF o foto</button>
      <div id="ls-import-status" style="display:none; font-size:12px; color:#2b5c3a; font-weight:bold; text-align:center; margin-top:8px;"></div>
    </div>

    <div id="ls-revisione"></div>

    <div class="list-card">
      <label class="field-label">Ingrediente</label>
      <input type="text" id="ls-nome" placeholder="Es. Vitello, Olio EVO, Farina 00...">
      <div class="form-row">
        <div><label class="field-label">Prezzo al kg (€)</label><input type="number" step="0.01" id="ls-prezzo"></div>
        <div><label class="field-label">Fornitore (facoltativo)</label><input type="text" id="ls-fornitore"></div>
      </div>
      <button class="btn btn-primary btn-block" id="ls-salva">Salva prezzo</button>
    </div>

    <input type="text" id="ls-filtro" placeholder="🔎 Cerca nel listino…" style="margin-bottom:10px;">
    <div class="list-card" id="ls-lista">
      ${voci.length === 0 ? '<div class="empty-state">Nessun prezzo ancora inserito.</div>' : voci.map((v) => `
        <div class="check-row" style="cursor:default;" data-riga="${v.id}">
          <div class="rt">
            <div class="t">${v.nome}</div>
            <div class="s">${v.fornitore ? v.fornitore + ' · ' : ''}aggiornato il ${v.aggiornato_il?.toDate ? v.aggiornato_il.toDate().toLocaleDateString('it-IT') : '—'}</div>
          </div>
          <input type="number" step="0.01" class="ls-mod-prezzo" value="${v.prezzo_kg}" style="width:80px; text-align:right;">
          <span style="margin-left:4px; color:#64748b;">€/kg</span>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelector('#ls-salva').addEventListener('click', async (e) => {
    const nome = container.querySelector('#ls-nome').value.trim();
    const prezzo = parseFloat(container.querySelector('#ls-prezzo').value);
    if (!nome || Number.isNaN(prezzo)) { alert('Inserisci nome e prezzo.'); return; }

    e.currentTarget.disabled = true;
    try {
      await aggiungi('listino_prezzi', {
        nome,
        prezzo_kg: prezzo,
        fornitore: container.querySelector('#ls-fornitore').value || null,
      }, 'aggiornato_il');
      renderListinoPage(container);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
      e.currentTarget.disabled = false;
    }
  });

  voci.forEach((v) => {
    const input = container.querySelector(`[data-riga="${v.id}"] .ls-mod-prezzo`);
    input.addEventListener('change', async () => {
      const nuovoPrezzo = parseFloat(input.value);
      if (Number.isNaN(nuovoPrezzo)) return;
      try {
        await aggiorna('listino_prezzi', v.id, { prezzo_kg: nuovoPrezzo, aggiornato_il: new Date() });
      } catch (err) {
        console.error(err);
        alert('Errore durante l\'aggiornamento del prezzo.');
      }
    });
  });

  container.querySelector('#ls-filtro').addEventListener('input', (e) => {
    const testo = e.target.value.toLowerCase();
    container.querySelectorAll('#ls-lista [data-riga]').forEach((riga) => {
      const nome = riga.querySelector('.t').textContent.toLowerCase();
      riga.style.display = nome.includes(testo) ? '' : 'none';
    });
  });

  // --- Caricamento listino (PDF/foto) ---
  const statusBox = container.querySelector('#ls-import-status');
  const mostraStato = (msg) => { statusBox.style.display = 'block'; statusBox.textContent = msg; };
  const nascondiStato = () => { statusBox.style.display = 'none'; };

  container.querySelector('#ls-btn-upload').addEventListener('click', () => container.querySelector('#ls-file-input').click());
  container.querySelector('#ls-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    mostraStato('📄 Lettura del listino in corso…');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resp = await fetch('/api/parse-listino', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: reader.result, mimeType: file.type }),
        });
        const result = await resp.json();
        if (result.error) { alert(result.error); nascondiStato(); return; }

        const data = result.data || {};
        righeDaConfermare = (data.voci || []).map((v) => ({
          nome: v.nome || '',
          prezzo_kg: v.prezzo_kg ?? '',
          fornitore: data.fornitore || '',
          includi: true,
        }));
        nascondiStato();
        disegnaRevisione(container);
      } catch (err) {
        console.error(err);
        alert('Errore durante la lettura del file.');
        nascondiStato();
      }
    };
    reader.readAsDataURL(file);
  });
}

function disegnaRevisione(container) {
  const wrap = container.querySelector('#ls-revisione');
  if (righeDaConfermare.length === 0) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = `
    <div class="list-card" style="border:1px solid #2b5c3a;">
      <div style="font-size:13px; font-weight:bold; color:#2b5c3a; margin-bottom:4px;">Controlla prima di salvare</div>
      <div style="font-size:12px; color:#475569; margin-bottom:10px;">${righeDaConfermare.length} righe lette. Togli la spunta a quelle sbagliate o che non vuoi salvare, correggi i valori se serve.</div>
      ${righeDaConfermare.map((r, i) => `
        <div class="form-row" data-revisione="${i}" style="align-items:center;">
          <input type="checkbox" ${r.includi ? 'checked' : ''} class="ls-rev-includi" style="flex:0 0 auto; width:20px;">
          <input type="text" value="${r.nome}" class="ls-rev-nome" placeholder="Ingrediente">
          <input type="number" step="0.01" value="${r.prezzo_kg}" class="ls-rev-prezzo" placeholder="€/kg" style="flex:0 0 90px;">
        </div>
      `).join('')}
      <button class="btn btn-primary btn-block" id="ls-conferma-import" style="margin-top:10px;">Salva le righe selezionate</button>
      <button class="btn btn-secondary btn-block" id="ls-annulla-import" style="margin-top:8px;">Annulla</button>
    </div>
  `;

  wrap.querySelectorAll('[data-revisione]').forEach((riga) => {
    const i = +riga.dataset.revisione;
    riga.querySelector('.ls-rev-includi').addEventListener('change', (e) => { righeDaConfermare[i].includi = e.target.checked; });
    riga.querySelector('.ls-rev-nome').addEventListener('input', (e) => { righeDaConfermare[i].nome = e.target.value; });
    riga.querySelector('.ls-rev-prezzo').addEventListener('input', (e) => { righeDaConfermare[i].prezzo_kg = e.target.value; });
  });

  wrap.querySelector('#ls-annulla-import').addEventListener('click', () => { righeDaConfermare = []; wrap.innerHTML = ''; });

  wrap.querySelector('#ls-conferma-import').addEventListener('click', async (e) => {
    const daSalvare = righeDaConfermare.filter((r) => r.includi && r.nome.trim() && r.prezzo_kg !== '' && !Number.isNaN(parseFloat(r.prezzo_kg)));
    if (daSalvare.length === 0) { alert('Seleziona almeno una riga valida.'); return; }

    e.currentTarget.disabled = true;
    try {
      for (const r of daSalvare) {
        await aggiungi('listino_prezzi', {
          nome: r.nome.trim(),
          prezzo_kg: parseFloat(r.prezzo_kg),
          fornitore: r.fornitore || null,
        }, 'aggiornato_il');
      }
      righeDaConfermare = [];
      renderListinoPage(container);
    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
      e.currentTarget.disabled = false;
    }
  });
}
