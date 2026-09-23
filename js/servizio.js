// Registro Servizio La Cava HACCP.
// Collegamento finale di tracciabilità:
// Ricevimento -> Lotto -> Processo -> Conservazione -> Servizio.

import { leggiTutti, aggiungi, oggiISO } from './store.js';

let dataSelezionata = oggiISO();

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function dataBreve(value) {
  if (!value) return '—';
  const [y, m, d] = String(value).split('-');
  return y && m && d ? `${d}/${m}/${y}` : value;
}

function descrizioneConservazione(c) {
  return [
    c.prodotto || 'Preparazione',
    c.lotto ? `Lotto: ${c.lotto}` : '',
    c.apparecchiatura_nome || '',
    c.scadenza ? `Scad.: ${dataBreve(c.scadenza)}` : '',
  ].filter(Boolean).join(' — ');
}

export async function renderServizioPage(container, profilo) {
  container.innerHTML = '<div class="empty-state">Caricamento…</div>';

  let conservazioni = [];
  let servizi = [];

  try {
    [conservazioni, servizi] = await Promise.all([
      leggiTutti('conservazioni'),
      leggiTutti('servizi'),
    ]);
  } catch (err) {
    console.error('Errore caricamento Servizio:', err);
    container.innerHTML = `
      <div class="top-bar"><h2>Servizio</h2></div>
      <div class="empty-state">
        Errore durante il caricamento della sezione Servizio.<br>
        <small>Controlla che le regole Firestore siano state pubblicate e riprova.</small>
      </div>`;
    return;
  }

  const isOggi = dataSelezionata === oggiISO();

  const conservazioniDisponibili = conservazioni
    .filter((c) => {
      if (!c.prodotto) return false;
      if (!c.scadenza) return true;
      return String(c.scadenza) >= String(dataSelezionata);
    })
    .sort((a, b) => {
      const da = String(a.data_produzione || a.data_riferimento || '');
      const db = String(b.data_produzione || b.data_riferimento || '');
      if (da !== db) return db.localeCompare(da);
      return (b.registrato_il?.seconds || 0) - (a.registrato_il?.seconds || 0);
    });

  const serviziDelGiorno = servizi
    .filter((s) => s.data_riferimento === dataSelezionata)
    .sort((a, b) => (b.registrato_il?.seconds || 0) - (a.registrato_il?.seconds || 0));

  container.innerHTML = `
    <div class="top-bar"><h2>Servizio</h2></div>

    <div class="list-card no-print">
      <label class="field-label">Data del servizio</label>
      <input type="date" id="sv-data" value="${dataSelezionata}" max="${oggiISO()}">
      ${!isOggi ? '<div style="font-size:12px; color:#b45309; margin-top:6px;">⚠️ Giorno passato: consultazione soltanto. Non è possibile creare una nuova registrazione per questa data.</div>' : ''}
    </div>

    ${isOggi ? `
    <div class="list-card">
      <label class="field-label">Preparazione / conservazione utilizzata</label>
      <select id="sv-conservazione">
        <option value="">— Seleziona la conservazione —</option>
        ${conservazioniDisponibili.map((c) => `
          <option value="${escapeHtml(c.id)}">
            ${escapeHtml(descrizioneConservazione(c))}
          </option>
        `).join('')}
      </select>

      <div id="sv-info" style="display:none; margin-top:8px; padding:10px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; font-size:12px; color:#475569;"></div>

      <label class="field-label">Servizio / piatto</label>
      <input type="text" id="sv-piatto" placeholder="Es. Guancia di maiale">

      <div class="form-row">
        <div>
          <label class="field-label">Quantità utilizzata</label>
          <input type="text" id="sv-quantita" placeholder="Es. 10 porzioni / 1,5 kg">
        </div>
        <div>
          <label class="field-label">Coperti</label>
          <input type="number" id="sv-coperti" min="0" step="1" placeholder="Es. 25">
        </div>
      </div>

      <label class="field-label">Note</label>
      <textarea id="sv-note" placeholder="Es. servizio pranzo, residuo rimesso in conservazione..."></textarea>

      <button class="btn btn-primary btn-block" id="sv-salva">Registra servizio</button>
    </div>
    ` : ''}

    <h3 style="font-size:14px; color:#64748b; margin:16px 0 8px;">Servizi registrati il ${dataSelezionata} (${serviziDelGiorno.length})</h3>

    ${serviziDelGiorno.length === 0
      ? '<div class="empty-state">Nessun servizio registrato in questa data.</div>'
      : `
        <div class="list-card">
          ${serviziDelGiorno.map((s) => `
            <div class="check-row" style="cursor:default;">
              <span class="dot ok"></span>
              <div class="rt">
                <div class="t">${escapeHtml(s.piatto || s.prodotto || 'Servizio')}</div>
                <div class="s">
                  ${s.lotto ? 'Lotto: ' + escapeHtml(s.lotto) : 'Lotto non indicato'}
                  ${s.quantita ? ' · ' + escapeHtml(s.quantita) : ''}
                  ${s.coperti ? ' · Coperti: ' + escapeHtml(s.coperti) : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `
    }
  `;

  const dataInput = container.querySelector('#sv-data');
  if (dataInput) {
    dataInput.addEventListener('change', (e) => {
      dataSelezionata = e.target.value;
      renderServizioPage(container, profilo);
    });
  }

  const conservazioneSelect = container.querySelector('#sv-conservazione');
  if (conservazioneSelect) {
    conservazioneSelect.addEventListener('change', () => {
      const c = conservazioniDisponibili.find((item) => item.id === conservazioneSelect.value);
      const info = container.querySelector('#sv-info');
      if (!info) return;

      if (!c) {
        info.style.display = 'none';
        return;
      }

      const dettagli = [
        `<strong>Prodotto:</strong> ${escapeHtml(c.prodotto || '—')}`,
        c.lotto ? `<strong>Lotto:</strong> ${escapeHtml(c.lotto)}` : '<strong>Lotto:</strong> non indicato',
        c.tipo_conservazione_label ? `<strong>Conservazione:</strong> ${escapeHtml(c.tipo_conservazione_label)}` : '',
        c.apparecchiatura_nome ? `<strong>Apparecchiatura:</strong> ${escapeHtml(c.apparecchiatura_nome)}` : '',
        c.data_produzione ? `<strong>Prodotto il:</strong> ${dataBreve(c.data_produzione)}` : '',
        c.scadenza ? `<strong>Scadenza:</strong> ${dataBreve(c.scadenza)}` : '',
        c.ricevimento_collegato?.fornitore ? `<strong>Fornitore:</strong> ${escapeHtml(c.ricevimento_collegato.fornitore)}` : '',
      ].filter(Boolean);

      info.innerHTML = dettagli.join(' · ');
      info.style.display = 'block';

      const piatto = container.querySelector('#sv-piatto');
      if (piatto && !piatto.value) piatto.value = c.prodotto || '';
    });
  }

  const salvaBtn = container.querySelector('#sv-salva');

  if (salvaBtn) {
    salvaBtn.addEventListener('click', async (e) => {
      if (dataSelezionata !== oggiISO()) {
        alert('Le nuove registrazioni possono essere effettuate solo per la data odierna.');
        return;
      }

      const conservazioneId = container.querySelector('#sv-conservazione').value;
      const conservazione = conservazioniDisponibili.find((c) => c.id === conservazioneId);

      if (!conservazione) {
        alert('Seleziona la preparazione / conservazione utilizzata.');
        return;
      }

      const piatto = container.querySelector('#sv-piatto').value.trim();

      if (!piatto) {
        alert('Indica il piatto / servizio.');
        return;
      }

      e.currentTarget.disabled = true;

      try {
        await aggiungi('servizi', {
          conservazione_id: conservazione.id,
          processo_id: conservazione.processo_id || null,
          prodotto: conservazione.prodotto || '',
          lotto: conservazione.lotto || null,
          ricevimento_collegato: conservazione.ricevimento_collegato || null,
          tipo_conservazione: conservazione.tipo_conservazione || null,
          apparecchiatura_nome: conservazione.apparecchiatura_nome || null,
          piatto,
          quantita: container.querySelector('#sv-quantita').value.trim(),
          coperti: container.querySelector('#sv-coperti').value || null,
          note: container.querySelector('#sv-note').value.trim(),
          data_riferimento: oggiISO(),
          registrato_da: profilo.id,
        }, 'registrato_il');

        renderServizioPage(container, profilo);
      } catch (err) {
        console.error(err);
        alert('Errore durante il salvataggio del servizio.');
        e.currentTarget.disabled = false;
      }
    });
  }
}
