// Registro Processi La Cava HACCP.
// Le registrazioni nuove possono essere create solo per la data odierna.
// Le registrazioni esistenti restano consultabili; eventuali correzioni
// vengono aggiunte come nuovi record collegati all'originale.
//
// Collegamento tracciabilità:
// Ricevimento merci → prodotto → lotto → processo.

import { leggiTutti, aggiungi, where, oggiISO } from './store.js';

const TIPI = [
  ['cottura', 'Cottura tradizionale'],
  ['cbt', 'Cottura CBT / Roner'],
  ['abbattimento', 'Abbattimento positivo / negativo'],
  ['congelamento', 'Congelamento interno'],
  ['sottovuoto', 'Sottovuoto'],
  ['rigenerazione', 'Rigenerazione'],
  ['scongelamento', 'Scongelamento controllato'],
  ['crudo_pronto', 'Preparazione cruda / pronta al consumo'],
];

let dataSelezionata = oggiISO();
let correzioneApertaPer = null;
let ricevimentiDisponibili = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function creaListaLotti(ricevimenti) {
  const lista = [];

  ricevimenti.forEach((ricevimento) => {
    (ricevimento.voci || []).forEach((voce) => {
      if (!voce.nome) return;

      lista.push({
        prodotto: voce.nome,
        lotto: voce.lotto || '',
        scadenza: voce.scadenza || '',
        temperatura: voce.temperatura ?? '',
        fornitore: ricevimento.fornitore_nome || '',
        numeroDocumento: ricevimento.numero_documento || '',
        dataRicevimento: ricevimento.data_riferimento || '',
      });
    });
  });

  return lista;
}

export async function renderRegistroPage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;

  const registrazioni = await leggiTutti(
    'registrazioni_processo',
    [where('data_riferimento', '==', dataSelezionata)]
  );

  const originali = registrazioni
    .filter((r) => !r.correzione_di)
    .sort(
      (a, b) =>
        (b.registrato_il?.seconds || 0) -
        (a.registrato_il?.seconds || 0)
    );

  const correzioniPer = new Map();

  registrazioni
    .filter((r) => r.correzione_di)
    .forEach((r) => {
      const lista = correzioniPer.get(r.correzione_di) || [];
      lista.push(r);
      correzioniPer.set(r.correzione_di, lista);
    });

  const isOggi = dataSelezionata === oggiISO();

  // Carica i ricevimenti disponibili per collegare
  // prodotto e lotto al processo.
  if (isOggi) {
    try {
      const ricevimenti = await leggiTutti('ricevimenti');
      ricevimentiDisponibili = creaListaLotti(ricevimenti);
    } catch (err) {
      console.error('Errore caricamento ricevimenti:', err);
      ricevimentiDisponibili = [];
    }
  } else {
    ricevimentiDisponibili = [];
  }

  container.innerHTML = `
    <div class="top-bar">
      <h2>Cotture / Abbattimenti / Rigenerazioni</h2>
    </div>

    <div class="list-card no-print">
      <label class="field-label">Data</label>
      <input
        type="date"
        id="reg-data"
        value="${dataSelezionata}"
        max="${oggiISO()}"
      >
      ${
        !isOggi
          ? '<div style="font-size:12px; color:#b45309; margin-top:6px;">⚠️ Giorno passato: consultazione soltanto. Non è possibile creare una nuova registrazione per questa data.</div>'
          : ''
      }
    </div>

    ${
      isOggi
        ? `
    <div class="list-card">

      <label class="field-label">Tipo di processo</label>

      <select id="reg-tipo">
        ${TIPI.map(
          ([v, l]) => `<option value="${v}">${l}</option>`
        ).join('')}
      </select>

      <label class="field-label">
        Prodotto / preparazione
      </label>

      <select id="reg-prodotto-select">
        <option value="">— Seleziona prodotto ricevuto oppure inserisci manualmente —</option>

        ${
          ricevimentiDisponibili.length > 0
            ? ricevimentiDisponibili
                .map(
                  (r, i) => `
            <option value="${i}">
              ${escapeHtml(r.prodotto)}
              ${
                r.lotto
                  ? ' — Lotto: ' + escapeHtml(r.lotto)
                  : ' — Lotto non indicato'
              }
              ${
                r.fornitore
                  ? ' — ' + escapeHtml(r.fornitore)
                  : ''
              }
            </option>
          `
                )
                .join('')
            : ''
        }

        <option value="manuale">
          ✎ Inserimento manuale
        </option>
      </select>

      <div
        id="reg-ricevimento-info"
        style="
          display:none;
          margin-top:8px;
          padding:10px;
          background:#f8fafc;
          border:1px solid #cbd5e1;
          border-radius:8px;
          font-size:12px;
          color:#475569;
        "
      ></div>

      <div id="reg-prodotto-manuale" style="display:none; margin-top:8px;">
        <input
          type="text"
          id="reg-prodotto"
          placeholder="Es. Vitello per tonnato, punta di petto..."
        >
      </div>

      <div class="form-row">
        <div>
          <label class="field-label">Temp. inizio (°C)</label>
          <input
            type="number"
            step="0.1"
            id="reg-temp-inizio"
          >
        </div>

        <div>
          <label class="field-label">Temp. fine / al cuore (°C)</label>
          <input
            type="number"
            step="0.1"
            id="reg-temp-fine"
          >
        </div>
      </div>

      <div class="form-row">
        <div>
          <label class="field-label">Durata (minuti)</label>
          <input
            type="number"
            id="reg-durata"
          >
        </div>

        <div>
          <label class="field-label">Lotto materia prima</label>
          <input
            type="text"
            id="reg-lotto"
            placeholder="Compilato dal ricevimento"
          >
        </div>
      </div>

      <label class="field-label">
        Note / procedura collegata
      </label>

      <textarea
        id="reg-note"
        placeholder="Parametri o note utili al controllo"
      ></textarea>

      <button
        class="btn btn-primary btn-block"
        id="reg-salva"
      >
        Registra
      </button>

    </div>
    `
        : ''
    }

    <h3
      style="
        font-size:14px;
        color:#64748b;
        margin:16px 0 8px;
      "
    >
      Registrate il ${dataSelezionata} (${originali.length})
    </h3>

    ${
      originali.length === 0
        ? '<div class="empty-state">Nessuna registrazione in questa data.</div>'
        : `
      <div class="list-card">

        ${originali
          .map((r) => {
            const correzioni = (
              correzioniPer.get(r.id) || []
            ).sort(
              (a, b) =>
                (b.registrato_il?.seconds || 0) -
                (a.registrato_il?.seconds || 0)
            );

            const ultima = correzioni[0];

            return `
              <div
                class="check-row"
                style="
                  cursor:default;
                  flex-direction:column;
                  align-items:stretch;
                "
              >

                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                  "
                >

                  <div class="rt">

                    <div class="t">
                      ${
                        TIPI.find(([v]) => v === r.tipo)?.[1] ||
                        r.tipo
                      }
                      — ${escapeHtml(r.prodotto || '')}
                    </div>

                    <div class="s">
                      ${
                        r.valori?.temperatura_inizio_c ?? '—'
                      }°C
                      →
                      ${
                        r.valori?.temperatura_fine_c ?? '—'
                      }°C

                      ${
                        r.valori?.durata_min
                          ? ' · ' +
                            r.valori.durata_min +
                            ' min'
                          : ''
                      }

                      ${
                        r.valori?.lotto_materia_prima
                          ? ' · Lotto: ' +
                            escapeHtml(
                              r.valori.lotto_materia_prima
                            )
                          : ''
                      }
                    </div>

                  </div>

                  ${
                    !ultima
                      ? `
                    <button
                      class="btn btn-secondary reg-correggi-btn"
                      data-correggi="${r.id}"
                      style="flex:0 0 auto;"
                    >
                      Correggi
                    </button>
                  `
                      : ''
                  }

                </div>

                ${correzioni
                  .map(
                    (c) => `
                    <div
                      style="
                        font-size:12px;
                        color:#b45309;
                        margin-top:6px;
                        padding-left:4px;
                      "
                    >
                      → Corretto:
                      ${
                        c.valori?.temperatura_inizio_c ??
                        '—'
                      }°C
                      →
                      ${
                        c.valori?.temperatura_fine_c ??
                        '—'
                      }°C

                      ${
                        c.valori?.durata_min
                          ? ' · ' +
                            c.valori.durata_min +
                            ' min'
                          : ''
                      }

                      — motivo:
                      ${escapeHtml(
                        c.motivo_correzione || '—'
                      )}
                    </div>
                  `
                  )
                  .join('')}

                ${
                  correzioneApertaPer === r.id
                    ? `
                  <div
                    class="list-card"
                    style="
                      border:1px solid #2b5c3a;
                      margin-top:10px;
                    "
                  >

                    <label class="field-label">
                      Nuovi valori corretti
                    </label>

                    <div class="form-row">

                      <div>
                        <input
                          type="number"
                          step="0.1"
                          id="cr-temp-inizio"
                          placeholder="Temp. inizio °C"
                          value="${
                            r.valori
                              ?.temperatura_inizio_c ?? ''
                          }"
                        >
                      </div>

                      <div>
                        <input
                          type="number"
                          step="0.1"
                          id="cr-temp-fine"
                          placeholder="Temp. fine °C"
                          value="${
                            r.valori
                              ?.temperatura_fine_c ?? ''
                          }"
                        >
                      </div>

                    </div>

                    <input
                      type="number"
                      id="cr-durata"
                      placeholder="Durata (minuti)"
                      value="${
                        r.valori?.durata_min ?? ''
                      }"
                    >

                    <label class="field-label">
                      Motivo della correzione (obbligatorio)
                    </label>

                    <textarea
                      id="cr-motivo"
                      placeholder="Es. errore di trascrizione, valore letto male..."
                    ></textarea>

                    <button
                      class="btn btn-primary btn-block"
                      id="cr-salva"
                      data-originale="${r.id}"
                      data-tipo="${r.tipo}"
                      data-prodotto="${escapeHtml(
                        r.prodotto || ''
                      )}"
                    >
                      Salva correzione
                    </button>

                    <button
                      class="btn btn-secondary btn-block"
                      id="cr-annulla"
                      style="margin-top:8px;"
                    >
                      Annulla
                    </button>

                  </div>
                `
                    : ''
                }

              </div>
            `;
          })
          .join('')}

      </div>
    `
    }
  `;

  container
    .querySelector('#reg-data')
    .addEventListener('change', (e) => {
      dataSelezionata = e.target.value;
      correzioneApertaPer = null;
      renderRegistroPage(container, profilo);
    });

  // ------------------------------------------------------------
  // Selezione prodotto ricevuto
  // ------------------------------------------------------------

  const prodottoSelect = container.querySelector(
    '#reg-prodotto-select'
  );

  if (prodottoSelect) {
    prodottoSelect.addEventListener('change', (e) => {
      const valore = e.target.value;

      const infoBox = container.querySelector(
        '#reg-ricevimento-info'
      );

      const manualeBox = container.querySelector(
        '#reg-prodotto-manuale'
      );

      const lottoInput = container.querySelector(
        '#reg-lotto'
      );

      if (valore === 'manuale') {
        manualeBox.style.display = 'block';

        infoBox.style.display = 'none';

        lottoInput.value = '';

        return;
      }

      if (valore === '') {
        manualeBox.style.display = 'none';

        infoBox.style.display = 'none';

        lottoInput.value = '';

        return;
      }

      const indice = Number(valore);
      const ricevimento =
        ricevimentiDisponibili[indice];

      if (!ricevimento) return;

      manualeBox.style.display = 'none';

      lottoInput.value =
        ricevimento.lotto || '';

      const dettagli = [];

      if (ricevimento.lotto) {
        dettagli.push(
          `<strong>Lotto:</strong> ${escapeHtml(
            ricevimento.lotto
          )}`
        );
      } else {
        dettagli.push(
          '<strong>Lotto:</strong> non indicato'
        );
      }

      if (ricevimento.scadenza) {
        dettagli.push(
          `<strong>Scadenza / TMC:</strong> ${escapeHtml(
            ricevimento.scadenza
          )}`
        );
      }

      if (
        ricevimento.temperatura !== '' &&
        ricevimento.temperatura !== null &&
        ricevimento.temperatura !== undefined
      ) {
        dettagli.push(
          `<strong>Temp. ricevimento:</strong> ${escapeHtml(
            ricevimento.temperatura
          )} °C`
        );
      }

      if (ricevimento.fornitore) {
        dettagli.push(
          `<strong>Fornitore:</strong> ${escapeHtml(
            ricevimento.fornitore
          )}`
        );
      }

      if (ricevimento.numeroDocumento) {
        dettagli.push(
          `<strong>Documento:</strong> ${escapeHtml(
            ricevimento.numeroDocumento
          )}`
        );
      }

      if (ricevimento.dataRicevimento) {
        dettagli.push(
          `<strong>Data ricevimento:</strong> ${escapeHtml(
            ricevimento.dataRicevimento
          )}`
        );
      }

      infoBox.innerHTML = dettagli.join(' · ');
      infoBox.style.display = 'block';
    });
  }

  // ------------------------------------------------------------
  // Salvataggio nuova registrazione
  // ------------------------------------------------------------

  const salvaBtn = container.querySelector(
    '#reg-salva'
  );

  if (salvaBtn) {
    salvaBtn.addEventListener(
      'click',
      async (e) => {
        // Difesa lato client: una registrazione nuova
        // può essere creata solo oggi.
        if (dataSelezionata !== oggiISO()) {
          alert(
            'Le nuove registrazioni possono essere effettuate solo per la data odierna.'
          );
          return;
        }

        const select = container.querySelector(
          '#reg-prodotto-select'
        );

        const valoreProdotto =
          select?.value || '';

        let prodotto = '';
        let lotto = '';
        let ricevimentoCollegato = null;

        if (valoreProdotto === 'manuale') {
          prodotto = container
            .querySelector('#reg-prodotto')
            .value
            .trim();

          lotto = container
            .querySelector('#reg-lotto')
            .value
            .trim();

        } else if (valoreProdotto !== '') {
          const indice = Number(
            valoreProdotto
          );

          ricevimentoCollegato =
            ricevimentiDisponibili[indice];

          if (ricevimentoCollegato) {
            prodotto =
              ricevimentoCollegato.prodotto;

            lotto =
              ricevimentoCollegato.lotto || '';
          }
        }

        if (!prodotto) {
          alert(
            'Seleziona un prodotto ricevuto oppure scegli "Inserimento manuale".'
          );
          return;
        }

        const btn = e.currentTarget;

        btn.disabled = true;

        try {
          await aggiungi(
            'registrazioni_processo',
            {
              tipo: container.querySelector(
                '#reg-tipo'
              ).value,

              prodotto,

              valori: {
                temperatura_inizio_c:
                  container.querySelector(
                    '#reg-temp-inizio'
                  ).value || null,

                temperatura_fine_c:
                  container.querySelector(
                    '#reg-temp-fine'
                  ).value || null,

                durata_min:
                  container.querySelector(
                    '#reg-durata'
                  ).value || null,

                lotto_materia_prima:
                  lotto || null,

                note:
                  container.querySelector(
                    '#reg-note'
                  ).value || null,

                ricevimento_collegato:
                  ricevimentoCollegato
                    ? {
                        fornitore:
                          ricevimentoCollegato.fornitore ||
                          null,

                        numero_documento:
                          ricevimentoCollegato.numeroDocumento ||
                          null,

                        data_ricevimento:
                          ricevimentoCollegato.dataRicevimento ||
                          null,

                        scadenza_tmc:
                          ricevimentoCollegato.scadenza ||
                          null,

                        temperatura_ricevimento:
                          ricevimentoCollegato.temperatura !==
                            ''
                            ? ricevimentoCollegato.temperatura
                            : null,
                      }
                    : null,
              },

              esito: null,

              data_riferimento:
                oggiISO(),

              registrato_da:
                profilo.id,
            },
            'registrato_il'
          );

          renderRegistroPage(
            container,
            profilo
          );

        } catch (err) {
          console.error(err);

          alert(
            'Errore durante il salvataggio.'
          );

          btn.disabled = false;
        }
      }
    );
  }

  // ------------------------------------------------------------
  // Correzioni
  // ------------------------------------------------------------

  container
    .querySelectorAll('.reg-correggi-btn')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        correzioneApertaPer =
          btn.dataset.correggi;

        renderRegistroPage(
          container,
          profilo
        );
      });
    });

  const annullaBtn =
    container.querySelector(
      '#cr-annulla'
    );

  if (annullaBtn) {
    annullaBtn.addEventListener(
      'click',
      () => {
        correzioneApertaPer = null;

        renderRegistroPage(
          container,
          profilo
        );
      }
    );
  }

  const salvaCorrBtn =
    container.querySelector(
      '#cr-salva'
    );

  if (salvaCorrBtn) {
    salvaCorrBtn.addEventListener(
      'click',
      async (e) => {
        const motivo =
          container
            .querySelector('#cr-motivo')
            .value
            .trim();

        if (!motivo) {
          alert(
            'Il motivo della correzione è obbligatorio.'
          );
          return;
        }

        e.currentTarget.disabled = true;

        try {
          await aggiungi(
            'registrazioni_processo',
            {
              tipo:
                e.currentTarget.dataset
                  .tipo,

              prodotto:
                e.currentTarget.dataset
                  .prodotto,

              valori: {
                temperatura_inizio_c:
                  container.querySelector(
                    '#cr-temp-inizio'
                  ).value || null,

                temperatura_fine_c:
                  container.querySelector(
                    '#cr-temp-fine'
                  ).value || null,

                durata_min:
                  container.querySelector(
                    '#cr-durata'
                  ).value || null,
              },

              correzione_di:
                e.currentTarget.dataset
                  .originale,

              motivo_correzione:
                motivo,

              data_riferimento:
                dataSelezionata,

              registrato_da:
                profilo.id,
            },
            'registrato_il'
          );

          correzioneApertaPer = null;

          renderRegistroPage(
            container,
            profilo
          );

        } catch (err) {
          console.error(err);

          alert(
            'Errore durante il salvataggio della correzione.'
          );

          e.currentTarget.disabled = false;
        }
      }
    );
  }
}
