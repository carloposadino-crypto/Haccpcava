import { db, collection, addDoc, getDocs, doc, deleteDoc, query, orderBy, serverTimestamp } from './firebase.js';

const RICETTA_DEFAULT = {
  id: "default_vitello",
  nome: "Vitello Tonnato CBT (20 porzioni)",
  categoria: "Secondi",
  tempi: "Preparazione: 40 min | Cottura CBT: 4 ore | Abbattimento: 60 min",
  ingredienti: `Girello di Vitello: 2400g
Olio Extravergine d'Oliva: 80g
Sale Fino: 28g
Pepe Nero Macinato: 3g
Ramerino Fresco: 10g
Timo Fresco: 10g
Alloro Fresco: 4g
Vino Bianco Secco: 100g
Tonno Sott'olio Sgocciolato: 400g
Acciughe Sott'olio: 50g
Capperi Dissalati: 60g
Tuorli d'Uovo Pastorizzati: 200g
Succo di Limone: 30g
Brodo Vegetale Freddo: 120g
Olio di Semi di Girasole: 200g`,
  procedimento: `1. Mondare e rifilare il girello di vitello da pellicole e grasso.
2. Massaggiare con olio EVOO (80g), sale (28g), pepe (3g) ed erbe tritate.
3. Inserire in busta da cottura con il vino bianco (100g) e sigillare al 99%.
4. Cuocere nel Roner a 58°C per 4 ore.
5. Trasferire subito in abbattitore (+3°C al cuore entro 90 min).
6. Per la salsa: frullare tuorli pastorizzati, tonno, acciughe, capperi e limone. Emulsionare con olio di semi e regolare la densità con il brodo freddo.
7. Affettare la carne fredda all'affettatrice e nappare con la salsa.`,
  impiattamento: "Stile trattoria moderna: fette disposte a raggiera leggermente sovrapposte, nappa uniforme di salsa tonnata lucida, guarnizione con frutti di cappero a metà e filo d'olio EVOO.",
  conservazione: "Carne CBT in busta sigillata: fino a 14 giorni a 0°C/+2°C. Carne affettata: max 48 ore. Salsa tonnata fresca: max 3 giorni a +2°C/+4°C.",
  criticita: "Sigillatura sottovuoto perfetta prima del Roner. Abbattimento positivo rapido a +3°C (CCP). Attenzione alla sapidità della salsa prima di aggiungere ulteriore sale."
};

export function renderRicettePage(container) {
  container.innerHTML = `
    <div style="padding: 16px; max-width: 600px; margin: 0 auto; padding-bottom: 80px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="font-size: 20px; font-weight: bold; color: #1f2937;">
          📖 Schede Ricette (Base 20 porzioni)
        </h2>
        <button id="btn-nuova-ricetta" style="background-color: #059669; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer;">
          + Nuova Ricetta
        </button>
      </div>

      <!-- Importazione Automatica tramite AI / Screenshot / URL -->
      <div style="background: #f0fdf4; border: 1px dashed #059669; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: bold; color: #065f46; margin-bottom: 6px;">✨ Importazione Automatica con IA</div>
        <div style="font-size: 12px; color: #047857; margin-bottom: 10px;">Carica uno screenshot oppure incolla il link della ricetta per autocompilare la scheda tecnica:</div>
        
        <!-- Opzione 1: File Screenshot -->
        <input type="file" id="ric-file-input" accept="image/*" style="display: none;">
        <button id="btn-upload-foto" type="button" style="width: 100%; background: #10b981; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; margin-bottom: 10px;">
          📷 Scegli Screenshot / Scatta Foto
        </button>

        <!-- Divider -->
        <div style="text-align: center; font-size: 11px; color: #059669; margin: 6px 0; font-weight: bold;">OPPURE INCOLLA UN LINK</div>

        <!-- Opzione 2: Input URL -->
        <div style="display: flex; gap: 6px;">
          <input type="url" id="ric-url-input" placeholder="https://sito-ricette.it/ricetta..." style="flex: 1; padding: 8px; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 12px; box-sizing: border-box;">
          <button id="btn-importa-url" type="button" style="background: #047857; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer;">
            🔗 Importa
          </button>
        </div>

        <div id="status-ai" style="display: none; font-size: 12px; color: #065f46; font-weight: bold; margin-top: 10px; text-align: center;">⚙️ Analisi ed elaborazione ricetta in corso...</div>
      </div>

      <!-- Form Inserimento Ricetta -->
      <div id="box-form-ricetta" style="display: none; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #111827;">Scheda Ricetta</h3>
        
        <form id="form-ricetta" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Nome Ricetta *</label>
            <input type="text" id="ric-nome" required style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Categoria</label>
            <select id="ric-categoria" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
              <option value="Antipasti">Antipasti</option>
              <option value="Primi">Primi</option>
              <option value="Secondi">Secondi</option>
              <option value="Dolci">Dolci</option>
              <option value="Preparazioni Base / Semilavorati">Preparazioni Base / Semilavorati</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Tempi</label>
            <input type="text" id="ric-tempi" placeholder="Prep: 30 min | Cottura: 12 ore CBT" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Ingredienti (Sintassi: Ingrediente: Peso g) *</label>
            <textarea id="ric-ingredienti" required rows="6" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-family: monospace; font-size: 13px;"></textarea>
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Procedimento Numerato</label>
            <textarea id="ric-procedimento" rows="5" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 13px;"></textarea>
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Impiattamento (Stile Trattoria Moderna)</label>
            <input type="text" id="ric-impiattamento" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Conservazione (HACCP)</label>
            <input type="text" id="ric-conservazione" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Criticità Tecniche</label>
            <input type="text" id="ric-criticita" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>

          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button type="submit" style="flex: 1; background-color: #059669; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer;">Salva Scheda</button>
            <button type="button" id="btn-annulla-ricetta" style="background-color: #9ca3af; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer;">Annulla</button>
          </div>
        </form>
      </div>

      <!-- Lista Ricette -->
      <div id="lista-ricette" style="display: flex; flex-direction: column; gap: 16px;">
        <p style="color: #6b7280; font-size: 13px; text-align: center;">Caricamento ricettario...</p>
      </div>
    </div>
  `;

  const btnNuova = document.getElementById('btn-nuova-ricetta');
  const btnAnnulla = document.getElementById('btn-annulla-ricetta');
  const boxForm = document.getElementById('box-form-ricetta');
  const form = document.getElementById('form-ricetta');
  const listaRicette = document.getElementById('lista-ricette');
  const fileInput = document.getElementById('ric-file-input');
  const btnUpload = document.getElementById('btn-upload-foto');
  const urlInput = document.getElementById('ric-url-input');
  const btnImportaUrl = document.getElementById('btn-importa-url');
  const statusAi = document.getElementById('status-ai');

  btnNuova.addEventListener('click', () => { boxForm.style.display = 'block'; });
  btnAnnulla.addEventListener('click', () => { boxForm.style.display = 'none'; });
  btnUpload.addEventListener('click', () => fileInput.click());

  // Gestione Importazione da Foto / Screenshot
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusAi.style.display = 'block';
    statusAi.innerText = '⚙️ Lettura immagine in corso...';

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result.split(',')[1];
      await inviaAIApi({ imageBase64: base64Image });
    };
    reader.readAsDataURL(file);
  });

  // Gestione Importazione da Link URL
  btnImportaUrl.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
      alert("Inserisci un link URL valido.");
      return;
    }

    statusAi.style.display = 'block';
    statusAi.innerText = '⚙️ Lettura pagina web e conversione con IA...';
    await inviaAIApi({ recipeUrl: url });
  });

  async function inviaAIApi(payload) {
    try {
      const response = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        document.getElementById('ric-nome').value = data.ricetta.nome || '';
        document.getElementById('ric-categoria').value = data.ricetta.categoria || 'Secondi';
        document.getElementById('ric-tempi').value = data.ricetta.tempi || '';
        document.getElementById('ric-ingredienti').value = data.ricetta.ingredienti || '';
        document.getElementById('ric-procedimento').value = data.ricetta.procedimento || '';
        document.getElementById('ric-impiattamento').value = data.ricetta.impiattamento || '';
        document.getElementById('ric-conservazione').value = data.ricetta.conservazione || '';
        document.getElementById('ric-criticita').value = data.ricetta.criticita || '';

        boxForm.style.display = 'block';
        statusAi.style.display = 'none';
      } else {
        alert('Errore nell’elaborazione: ' + (data.error || 'Risposta invalida dall’IA'));
        statusAi.style.display = 'none';
      }
    } catch (err) {
      alert('Errore di connessione API: ' + err.message);
      statusAi.style.display = 'none';
    }
  }

  async function caricaRicette() {
    try {
      const q = query(collection(db, 'ricette'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      let ricetteArr = [];
      querySnapshot.forEach((docSnap) => {
        ricetteArr.push({ id: docSnap.id, ...docSnap.data() });
      });

      if (ricetteArr.length === 0) {
        ricetteArr.push(RICETTA_DEFAULT);
      }

      let html = '';
      ricetteArr.forEach((ric) => {
        html += `
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <h3 style="font-size: 16px; font-weight: bold; color: #111827; margin: 0; padding-right: 30px;">${ric.nome}</h3>
              <span style="background-color: #f3f4f6; color: #374151; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 12px;">${ric.categoria || 'Generale'}</span>
            </div>

            ${ric.id !== 'default_vitello' ? `
              <button class="btn-elimina-ricetta" data-id="${ric.id}" style="position: absolute; top: 12px; right: 12px; background: #fee2e2; color: #dc2626; border: none; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer;">
                🗑️ Elimina
              </button>
            ` : ''}

            <div style="font-size: 12px; color: #0284c7; font-weight: bold; margin-bottom: 12px;">
              ⏱️ ${ric.tempi || 'N/D'}
            </div>

            <div style="margin-bottom: 12px; background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #f3f4f6;">
              <div style="font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 6px;">📋 INGREDIENTI (20 porzioni)</div>
              <pre style="font-family: inherit; font-size: 12px; color: #4b5563; margin: 0; white-space: pre-wrap;">${ric.ingredienti}</pre>
            </div>

            <div style="margin-bottom: 12px;">
              <div style="font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 4px;">👨‍🍳 PROCEDIMENTO</div>
              <p style="font-size: 12px; color: #4b5563; margin: 0; line-height: 1.5; white-space: pre-wrap;">${ric.procedimento}</p>
            </div>

            ${ric.impiattamento ? `
              <div style="margin-bottom: 10px; font-size: 12px; color: #374151;">
                <strong>🍽️ IMPIATTAMENTO:</strong> ${ric.impiattamento}
              </div>
            ` : ''}

            ${ric.conservazione ? `
              <div style="margin-bottom: 10px; font-size: 12px; color: #059669;">
                <strong>🧊 CONSERVAZIONE HACCP:</strong> ${ric.conservazione}
              </div>
            ` : ''}

            ${ric.criticita ? `
              <div style="background: #fffbe3; border: 1px solid #fde68a; padding: 8px; border-radius: 6px; font-size: 11px; color: #92400e;">
                <strong>⚠️ CRITICITÀ TECNICHE:</strong> ${ric.criticita}
              </div>
            ` : ''}
          </div>
        `;
      });

      listaRicette.innerHTML = html;

      document.querySelectorAll('.btn-elimina-ricetta').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const docId = e.target.getAttribute('data-id');
          if (confirm("Sei sicuro di voler eliminare questa scheda ricetta?")) {
            try {
              await deleteDoc(doc(db, 'ricette', docId));
              caricaRicette();
            } catch (err) {
              alert("Errore durante l'eliminazione: " + err.message);
            }
          }
        });
      });

    } catch (err) {
      console.error("Errore caricamento ricette:", err);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      nome: document.getElementById('ric-nome').value,
      categoria: document.getElementById('ric-categoria').value,
      tempi: document.getElementById('ric-tempi').value,
      ingredienti: document.getElementById('ric-ingredienti').value,
      procedimento: document.getElementById('ric-procedimento').value,
      impiattamento: document.getElementById('ric-impiattamento').value,
      conservazione: document.getElementById('ric-conservazione').value,
      criticita: document.getElementById('ric-criticita').value,
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'ricette'), data);
      form.reset();
      boxForm.style.display = 'none';
      caricaRicette();
    } catch (err) {
      alert("Errore salvataggio scheda ricetta: " + err.message);
    }
  });

  caricaRicette();
}