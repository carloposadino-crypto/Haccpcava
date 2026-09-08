import { addRegistro, getRegistro } from './store.js';

export const TIPOLOGIE_PROCESSO = [
  { id: 'cbt', nome: 'Cottura CBT', minTemp: 55, maxTemp: 90 },
  { id: 'abbattimento', nome: 'Abbattimento', minTemp: -40, maxTemp: 3 },
  { id: 'rigenerazione', nome: 'Rigenerazione', minTemp: 65, maxTemp: 100 }
];

export function renderRegistroPage(onSave) {
  const appContainer = document.getElementById('tab-content');
  if (!appContainer) return;

  appContainer.innerHTML = `
    <section class="card">
      <h2>Controlli → Registro Processi</h2>
      <form id="process-form" class="form-group" style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size: 13px; color: #d4a373; display: block; margin-bottom: 4px;">Tipo Processo</label>
          <select name="tipo" id="process-tipo" style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #443c36; background: #fff; color: #1a1614; font-size: 15px;">
            ${TIPOLOGIE_PROCESSO.map(p => `<option value="${p.id}">${p.nome}</option>`).join('')}
          </select>
        </div>

        <div>
          <label style="font-size: 13px; color: #d4a373; display: block; margin-bottom: 4px;">Prodotto / Lotto</label>
          <input type="text" name="prodotto" placeholder="Es. Petto d'anatra - Batch #12" required>
        </div>

        <div>
          <label style="font-size: 13px; color: #d4a373; display: block; margin-bottom: 4px;">Temperatura Raggiunta (°C)</label>
          <input type="number" step="0.1" name="valore" placeholder="°C al cuore" required>
        </div>

        <div>
          <label style="font-size: 13px; color: #d4a373; display: block; margin-bottom: 4px;">Note / Procedura collegata</label>
          <textarea name="note" placeholder="Dettagli tempi, lotto o procedura..."></textarea>
        </div>

        <button type="submit" class="btn">Salva Registrazione Processo</button>
      </form>
    </section>

    <section class="card">
      <h2>Registrazioni di Oggi</h2>
      <div id="lista-processi-oggi">Caricamento...</div>
    </section>
  `;

  const form = document.getElementById('process-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const tipoId = formData.get('tipo');
      const valore = parseFloat(formData.get('valore'));
      const tipoObj = TIPOLOGIE_PROCESSO.find(t => t.id === tipoId);

      let esito = 'Senza giudizio automatico';
      if (tipoObj && !isNaN(valore)) {
        esito = (valore >= tipoObj.minTemp && valore <= tipoObj.maxTemp) ? 'Conforme' : 'Fuori limite';
      }

      const data = {
        tipo: tipoObj ? tipoObj.nome : tipoId,
        prodotto: formData.get('prodotto'),
        valore: valore,
        esito: esito,
        note: formData.get('note'),
        timestamp: new Date().toISOString()
      };

      await addRegistro(data);
      alert(`Processo registrato: ${data.tipo} - ${esito}`);
      if (onSave) onSave();
    });
  }

  caricaProcessiOggi();
}

async function caricaProcessiOggi() {
  const container = document.getElementById('lista-processi-oggi');
  if (!container) return;

  try {
    const dati = await getRegistro();
    const oggi = new Date().toISOString().split('T')[0];
    const diOggi = dati.filter(r => r.timestamp && r.timestamp.startsWith(oggi));

    if (diOggi.length === 0) {
      container.innerHTML = '<p class="empty-text">Nessun processo registrato oggi.</p>';
      return;
    }

    container.innerHTML = diOggi.map(item => `
      <div class="log-item" style="border-bottom: 1px solid #3d352e; padding: 8px 0;">
        <span class="log-date" style="color: #d4a373; font-size: 12px;">${new Date(item.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${item.tipo}</span>
        <div style="font-size: 14px;"><b>${item.prodotto || 'Prodotto'}</b>: ${item.valore}°C (${item.esito})</div>
        ${item.note ? `<div style="font-size: 12px; color: #aaa;">${item.note}</div>` : ''}
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<p class="error-text">Errore caricamento dati</p>';
  }
}
