// Ricevimento merci: una bolla/DDT porta quasi sempre più prodotti
// insieme, quindi qui si registra UNA consegna con un elenco di righe
// prodotto (aggiungibili a mano oppure riempite in automatico
// scattando/caricando una foto del documento, via /api/ocr).

import { leggiTutti, aggiungi, where, orderBy, oggiISO } from './store.js';

let righeCorrenti = [];
let dataSelezionata = oggiISO();

function rigaVuota() {
  return {
    nome: '',
    quantita: '',
    lotto: '',
    scadenza: '',
    temperatura: ''
  };
}

export async function renderRicezioniPage(container, profilo) {
  container.innerHTML = `<div class="empty-state">Caricamento…</div>`;

  const listaGiorno = (await leggiTutti('ricevimenti', [where('data_riferimento', '==', dataSelezionata)]))
    .sort((a, b) => (b.registrato_il?.seconds || 0) - (a.registrato_il?.seconds || 0));

  righeCorrenti = [rigaVuota()];
  const isOggi = dataSelezionata === oggiISO();

  container.innerHTML = `
    <div class="top-bar"><h2>Ricevimento merci</h2></div>

    <div class="list-card no-print">
      <label class="field-label">Data</label>
      <input type="date" id="rc-data" value="${dataSelezionata}" max="${oggiISO()}">
      ${!isOggi ? '<div style="font-size:12px; color:#b45309; margin-top:6px;">⚠️ Stai registrando per una data passata, non per oggi.</div>' : ''}
    </div>

    <div class="list-card" style="border:1px dashed #2b5c3a;">
      <div style="font-size:13px; font-weight:bold; color:#2b5c3a; margin-bottom:6px;">✨ Leggi la bolla con una foto</div>
      <div style="font-size:12px; color:#475569; margin-bottom:10px;">Riconosce fornitore e prodotti automaticamente. Controlli e correggi tutto prima di salvare.</div>
      <input type="file" id="rc-file-input" accept="image/*" style="display:none;">
      <button type="button" class="btn btn-secondary btn-block" id="rc-btn-foto">📷 Fotografa la bolla</button>
      <div id="rc-import-status" style="display:none; font-size:12px; color:#2b5c3a; font-weight:bold; text-align:center; margin-top:8px;"></div>
    </div>

    <div class="list-card">
      <label class="field-label">Fornitore</label>
      <input type="text" id="rc-fornitore" placeholder="Nome fornitore">

      <div class="form-row">
        <div>
          <label class="field-label">N. documento</label>
          <input type="text" id="rc-numero-doc">
        </div>

        <div>
          <label class="field-label">Temperatura arrivo (°C)</label>
          <input type="number" step="0.1" id="rc-temperatura" placeholder="Se pertinente">
        </div>
      </div>

      <label class="field-label">Prodotti in questa consegna</label>
      <div id="rc-righe"></div>

      <button type="button" class="btn btn-secondary" id="rc-add-riga" style="margin-bottom:14px;">
        + Aggiungi prodotto
      </button>

      <label class="field-label">Conformità</label>
      <select id="rc-conformita">
        <option value="conforme">Conforme</option>
        <option value="non_conforme">Non conforme</option>
      </select>

      <label class="field-label">Note</label>
      <textarea id="rc-note"></textarea>

      <button class="btn btn-primary btn-block" id="rc-salva">
        Registra ricevimento
      </button>
    </div>

    <h3 style="font-size:14px; color:#64748b; margin:16px 0 8px;">
      Registrati il ${dataSelezionata} (${listaGiorno.length})
    </h3>

    ${listaGiorno.length === 0
      ? '<div class="empty-state">Nessun ricevimento registrato in questa data.</div>'
      : `
        <div class="list-card">
          ${listaGiorno.map((r) => `
            <div class="check-row" style="cursor:default;">
              <span class="dot ${r.conformita === 'non_conforme' ? 'warn' : 'ok'}"></span>
              <div class="rt">
                <div class="t">
                  ${r.fornitore_nome}${r.numero_documento ? ' — ' + r.numero_documento : ''}
                </div>
                <div class="s">
                  ${(r.voci || []).map((v) => v.nome).join(', ') || '—'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `
    }
  `;

  container.querySelector('#rc-data').addEventListener('change', (e) => {
    dataSelezionata = e.target.value;
    renderRicezioniPage(container, profilo);
  });

  function disegnaRighe() {
    const wrap = container.querySelector('#rc-righe');

    wrap.innerHTML = righeCorrenti.map((riga, i) => `
      <div
        class="form-row"
        data-riga="${i}"
        style="align-items:flex-end; margin-bottom:10px;"
      >

        <div style="flex:1;">
          <label class="field-label">Prodotto</label>
          <input
            type="text"
            placeholder="Prodotto"
            data-campo="nome"
            value="${riga.nome}"
          >
        </div>

        <div style="flex:0 0 90px;">
          <label class="field-label">Quantità</label>
          <input
            type="text"
            placeholder="Quantità"
            data-campo="quantita"
            value="${riga.quantita}"
          >
        </div>

        <div style="flex:0 0 100px;">
          <label class="field-label">Lotto</label>
          <input
            type="text"
            placeholder="Lotto"
            data-campo="lotto"
            value="${riga.lotto}"
          >
        </div>

        <div style="flex:0 0 120px;">
          <label class="field-label">Scadenza / TMC</label>
          <input
            type="text"
            placeholder="gg/mm/aaaa"
            data-campo="scadenza"
            value="${riga.scadenza}"
          >
        </div>

        <div style="flex:0 0 110px;">
          <label class="field-label">Temp. °C</label>
          <input
            type="number"
            step="0.1"
            placeholder="°C"
            data-campo="temperatura"
            value="${riga.temperatura}"
          >
        </div>

        ${righeCorrenti.length > 1
          ? `
            <button
              type="button"
              class="btn btn-danger rc-rimuovi"
              style="flex:0 0 auto; padding:8px 10px;"
            >
              ✕
            </button>
          `
          : ''
        }

      </div>
    `).join('');

    wrap.querySelectorAll('[data-riga]').forEach((rigaEl) => {
      const i = +rigaEl.dataset.riga;

      rigaEl.querySelectorAll('[data-campo]').forEach((input) => {
        input.addEventListener('input', () => {
          righeCorrenti[i][input.dataset.campo] = input.value;
        });
      });

      const btnRimuovi = rigaEl.querySelector('.rc-rimuovi');

      if (btnRimuovi) {
        btnRimuovi.addEventListener('click', () => {
          righeCorrenti.splice(i, 1);
          disegnaRighe();
        });
      }
    });
  }

  disegnaRighe();

  container.querySelector('#rc-add-riga').addEventListener('click', () => {
    righeCorrenti.push(rigaVuota());
    disegnaRighe();
  });

  const statusBox = container.querySelector('#rc-import-status');

  const mostraStato = (msg) => {
    statusBox.style.display = 'block';
    statusBox.textContent = msg;
  };

  const nascondiStato = () => {
    statusBox.style.display = 'none';
  };

  container.querySelector('#rc-btn-foto').addEventListener('click', () => {
    container.querySelector('#rc-file-input').click();
  });

  container.querySelector('#rc-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (!file) return;

    mostraStato('📷 Lettura della bolla in corso…');

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const resp = await fetch('/api/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageBase64: reader.result
          })
        });

        const result = await resp.json();

        if (result.error) {
          alert(result.error);
          nascondiStato();
          return;
        }

        const data = result.data || {};

        if (data.fornitore) {
          container.querySelector('#rc-fornitore').value = data.fornitore;
        }

        if (data.numeroDocumento) {
          container.querySelector('#rc-numero-doc').value = data.numeroDocumento;
        }

        if (Array.isArray(data.prodotti) && data.prodotti.length) {
          righeCorrenti = data.prodotti.map((p) => ({
            nome: p.nome || '',
            quantita: p.quantita || '',
            lotto: p.lotto || '',
            scadenza: p.scadenza || p.tmc || '',
            temperatura: p.temperatura || ''
          }));

          disegnaRighe();
        }

        if (result.isDemo) {
          mostraStato(
            '⚠️ Modalità demo: attiva GEMINI_API_KEY su Vercel per la lettura reale.'
          );
        } else {
          nascondiStato();
        }

      } catch (err) {
        console.error(err);
        alert('Errore durante la lettura della foto.');
        nascondiStato();
      }
    };

    reader.readAsDataURL(file);
  });

  container.querySelector('#rc-salva').addEventListener('click', async (e) => {
    const fornitore = container
      .querySelector('#rc-fornitore')
      .value
      .trim();

    const voci = righeCorrenti
      .filter((r) => r.nome.trim())
      .map((r) => ({
        nome: r.nome.trim(),
        quantita: r.quantita,
        lotto: r.lotto,
        scadenza: r.scadenza,
        temperatura: r.temperatura
      }));

    if (!fornitore || voci.length === 0) {
      alert('Inserisci almeno il fornitore e un prodotto.');
      return;
    }

    e.currentTarget.disabled = true;

    try {
      const conformita = container
        .querySelector('#rc-conformita')
        .value;

      await aggiungi(
        'ricevimenti',
        {
          fornitore_nome: fornitore,
          numero_documento: container.querySelector('#rc-numero-doc').value,
          voci,
          temperatura: container.querySelector('#rc-temperatura').value || null,
          conformita,
          note: container.querySelector('#rc-note').value,
          data_riferimento: dataSelezionata,
          registrato_da: profilo.id,
        },
        'registrato_il'
      );

      if (conformita === 'non_conforme') {
        alert(
          'Ricevimento registrato come NON conforme. Valuta di segnalare un\'anomalia con il pulsante rosso in alto.'
        );
      }

      renderRicezioniPage(container, profilo);

    } catch (err) {
      console.error(err);
      alert('Errore durante il salvataggio.');
      e.currentTarget.disabled = false;
    }
  });
}
