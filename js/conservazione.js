// Registro Conservazione La Cava HACCP.
// Collegamento di tracciabilità:
// Ricevimento -> Lotto -> Processo -> Conservazione.
//
// Le nuove registrazioni possono essere create solo per oggi.
// Le registrazioni già presenti restano consultabili.

import { leggiTutti, aggiungi, where, oggiISO } from './store.js';

let dataSelezionata = oggiISO();

const TIPI_CONSERVAZIONE = [
  ['frigo', 'Frigorifero 0–4 °C'],
  ['freezer', 'Freezer ≤ −18 °C'],
  ['sottovuoto_frigo', 'Sottovuoto in frigorifero'],
  ['sottovuoto_freezer', 'Sottovuoto in freezer'],
  ['altro', 'Altro'],
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function tipoProcessoLabel(tipo) {
  const map = {
    cottura: 'Cottura tradizionale',
    cbt: 'Cottura CBT / Roner',
    abbattimento: 'Abbattimento',
    congelamento: 'Congelamento interno',
    sottovuoto: 'Sottovuoto',
    rigenerazione: 'Rigenerazione',
    scongelamento: 'Scongelamento controllato',
    crudo_pronto: 'Preparazione cruda / pronta al consumo',
  };
  return map[tipo] || tipo || 'Processo';
}

function dataBreve(value) {
  if (!value) return '—';
  const [y, m, d] = String(value).split('-');
  return y && m && d ? `${d}/${m}/${y}` : value;
}

export async function renderConservazionePage(container, profilo) {
  container.innerHTML = '<div class="empty-state">Caricamento…</div>';

  let processi = [];
  let apparecchiature = [];
  let conservazioni = [];

  try {
    [processi, apparecchiature] = await Promise.all([
      leggiTutti('registrazioni_processo'),
      leggiTutti('attrezzature'),
    ]);
    conservazioni = await leggiTutti('conservazioni', [where('data_riferimento', '==', dataSelezionata)]);
  } catch (err) {
    console.error('Errore caricamento Conservazione:', err);
    container.innerHTML = `
      <div class="top-bar"><h2>Conservazione</h2></div>
      <div class="empty-state">
        Errore durante il caricamento della sezione Conservazione.<br>
        <small>Controlla che le regole Firestore siano state pubblicate e riprova.</small>
      </div>`;
    return;
  }

  const processiDisponibili = processi
    .filter((p) => !p.correzione_di)
    .sort((a, b) => (b.registrato_il?.seconds || 0) - (a.registrato_il?.seconds || 0));

  const isOggi = dataSelezionata === oggiISO();

  container.innerHTML = `
    <div class="top-bar"><h2>Conservazione</h2></div>

    <div class="list-card no-print">
      <label class="field-label">Data</label>
      <input type="date" id="cv-data" value="${dataSelezionata}" max="${oggiISO()}">
      ${!isOggi ? '<div style="font-size:12px; color:#b45309; margin-top:6px;">⚠️ Giorno passato: consultazione soltanto. Non è possibile creare una nuova registrazione per questa data.</div>' : ''}
    </div>

    ${isOggi ? `
    <div class="list-card">
      <label class="field-label">Processo di origine</label>
      <select id="cv-processo">
        <option value="">— Seleziona il processo registrato —</option>
        ${processiDisponibili.map((p) => `
          <option value="${escapeHtml(p.id)}">
            ${escapeHtml(tipoProcessoLabel(p.tipo))} — ${escapeHtml(p.prodotto || 'Preparazione')}
            ${p.valori?.lotto_materia_prima ? ' — Lotto: ' + escapeHtml(p.valori.lotto_materia_prima) : ''}
            — ${dataBreve(p.data_riferimento)}
          </option>
        `).join('')}
      </select>

      <div id="cv-processo-info" style="display:none; margin-top:8px; padding:10px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; font-size:12px; color:#475569;"></div>

      <label class="field-label">Tipo di conservazione</label>
      <select id="cv-tipo">
        ${TIPI_CONSERVAZIONE.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
      </select>

      <label class="field-label">Apparecchiatura</label>
      <select id="cv-apparecchiatura">
        <option value="">— Seleziona frigorifero / freezer —</option>
        ${apparecchiature
          .filter((a) => !String(a.tipo || '').toLowerCase().includes('abbatt'))
          .sort((a, b) => (a.nome || '').localeCompare(b.nome || ''))
          .map((a) => `
            <option value="${escapeHtml(a.id)}">${escapeHtml(a.nome)}${a.tipo ? ' — ' + escapeHtml(a.tipo) : ''}</option>
          `).join('')}
      </select>

      <div class="form-row">
        <div>
          <label class="field-label">Quantità</label>
          <input type="text" id="cv-quantita" placeholder="Es. 2 kg / 20 porzioni">
        </div>
        <div>
          <label class="field-label">Contenitore / confezione</label>
          <input type="text" id="cv-contenitore" placeholder="Vaschetta GN, sottovuoto...">
        </div>
      </div>

      <div class="form-row">
        <div>
          <label class="field-label">Data produzione / conservazione</label>
          <input type="date" id="cv-data-produzione" value="${oggiISO()}">
        </div>
        <div>
          <label class="field-label">Scadenza / TMC</label>
          <input type="date" id="cv-scadenza">
        </div>
      </div>

      <label class="field-label">Note</label>
      <textarea id="cv-note" placeholder="Informazioni utili sulla conservazione"></textarea>

      <button class="btn btn-primary btn-block" id="cv-salva">Registra conservazione</button>
    </div>
    ` : ''}

    <h3 style="font-size:14px; color:#64748b; margin:16px 0 8px;">Registrate il ${dataSelezionata} (${conservazioni.length})</h3>

    ${conservazioni.length === 0
      ? '<div class="empty-state">Nessuna conservazione registrata in questa data.</div>'
      : `
        <div class="list-card">
          ${conservazioni
            .sort((a, b) => (b.registrato_il?.seconds || 0) - (a.registrato_il?.seconds || 0))
            .map((c) => `
              <div class="check-row" style="cursor:default;">
                <span class="dot ok"></span>
                <div class="rt">
                  <div class="t">${escapeHtml(c.prodotto || 'Preparazione')}${c.lotto ? ' — Lotto: ' + escapeHtml(c.lotto) : ''}</div>
                  <div class="s">${escapeHtml(c.tipo_conservazione_label || c.tipo_conservazione || 'Conservazione')}${c.apparecchiatura_nome ? ' · ' + escapeHtml(c.apparecchiatura_nome) : ''}${c.quantita ? ' · ' + escapeHtml(c.quantita) : ''}${c.scadenza ? ' · Scadenza: ' + dataBreve(c.scadenza) : ''}</div>
                </div>
              </div>
            `).join('')}
        </div>
      `
    }

  `;

  const dataInput = container.querySelector('#cv-data');
  if (dataInput) {
    dataInput.addEventListener('change', (e) => {
      dataSelezionata = e.target.value;
      renderConservazionePage(container, profilo);
    });
  }

  const processoSelect = container.querySelector('#cv-processo');

  if (processoSelect) {
    processoSelect.addEventListener('change', () => {
      const processo = processiDisponibili.find((p) => p.id === processoSelect.value);
      const info = container.querySelector('#cv-processo-info');
      if (!info) return;

      if (!processo) {
        info.style.display = 'none';
        return;
      }

      const dettagli = [
        `<strong>Processo:</strong> ${escapeHtml(tipoProcessoLabel(processo.tipo))}`,
        `<strong>Prodotto:</strong> ${escapeHtml(processo.prodotto || '—')}`,
      ];

      if (processo.valori?.lotto_materia_prima) {
        dettagli.push(`<strong>Lotto materia prima:</strong> ${escapeHtml(processo.valori.lotto_materia_prima)}`);
      }

      if (processo.valori?.temperatura_fine_c !== null && processo.valori?.temperatura_fine_c !== undefined && processo.valori?.temperatura_fine_c !== '') {
        dettagli.push(`<strong>Temp. fine/al cuore:</strong> ${escapeHtml(processo.valori.temperatura_fine_c)} °C`);
      }

      if (processo.ricevimento_collegato?.fornitore) {
        dettagli.push(`<strong>Fornitore:</strong> ${escapeHtml(processo.ricevimento_collegato.fornitore)}`);
      }

      info.innerHTML = dettagli.join(' · ');
      info.style.display = 'block';
    });
  }

  const salvaBtn = container.querySelector('#cv-salva');

  if (salvaBtn) {
    salvaBtn.addEventListener('click', async () => {
      if (dataSelezionata !== oggiISO()) {
        alert('Le nuove registrazioni possono essere effettuate solo per la data odierna.');
        return;
      }

      const processoId = container.querySelector('#cv-processo').value;
      const processo = processiDisponibili.find((p) => p.id === processoId);

      if (!processo) {
        alert('Seleziona il processo di origine.');
        return;
      }

      const tipo = container.querySelector('#cv-tipo').value;
      const apparecchiaturaId = container.querySelector('#cv-apparecchiatura').value;
      const apparecchiatura = apparecchiature.find((a) => a.id === apparecchiaturaId);

      if (!apparecchiaturaId || !apparecchiatura) {
        alert('Seleziona l’apparecchiatura di conservazione.');
        return;
      }

      const btn = container.querySelector('#cv-salva');
      btn.disabled = true;

      try {
        await aggiungi('conservazioni', {
          processo_id: processo.id,
          processo_tipo: processo.tipo,
          processo_data: processo.data_riferimento || null,
          prodotto: processo.prodotto || '',
          lotto: processo.valori?.lotto_materia_prima || null,
          ricevimento_collegato: processo.ricevimento_collegato || null,
          tipo_conservazione: tipo,
          tipo_conservazione_label: TIPI_CONSERVAZIONE.find(([v]) => v === tipo)?.[1] || tipo,
          apparecchiatura_id: apparecchiatura.id,
          apparecchiatura_nome: apparecchiatura.nome || '',
          quantita: container.querySelector('#cv-quantita').value.trim(),
          contenitore: container.querySelector('#cv-contenitore').value.trim(),
          data_produzione: container.querySelector('#cv-data-produzione').value || null,
          scadenza: container.querySelector('#cv-scadenza').value || null,
          note: container.querySelector('#cv-note').value.trim(),
          data_riferimento: oggiISO(),
          registrato_da: profilo.id,
        }, 'registrato_il');

        renderConservazionePage(container, profilo);
      } catch (err) {
        console.error(err);
        alert('Errore durante il salvataggio della conservazione.');
        btn.disabled = false;
      }
    });
  }
}
