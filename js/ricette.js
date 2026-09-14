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
Succo di Limone: 30g`,
  procedimento: `1. Mondare e rifilare il girello di vitello.
2. Condire la carne con sale, pepe, erbe aromatiche e olio EVO.
3. Confezionare sotto vuoto al 99% con il vino bianco.
4. Cuocere in bagno maria termostatato (roner) a 58°C per 4 ore.
5. A fine cottura, abbattere immediatamente a +3°C al cuore.
6. Per la salsa tonnata: frullare tonno, acciughe, capperi, tuorli pastorizzati e succo di limone montando a filo con olio EVO.
7. Tagliare la carne finemente all'affettatrice e servire nappando con la salsa tonnata.`
};

export function renderRicettePage(container) {
  container.innerHTML = `
    <div style="max-width: 900px; margin: 0 auto; padding: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin: 0;">📖 Schede Ricette (Base 20 porzioni)</h2>
        <button id="btn-nuova-ricetta" style="background: #059669; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: bold; cursor: pointer;">+ Nuova Ricetta</button>
      </div>

      <!-- BOX IMPORTAZIONE AUTOMATICA -->
      <div style="background: #f0fdf4; border: 1px dashed #059669; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: bold; color: #065f46; margin-bottom: 6px;">✨ Importazione Automatica con IA</div>
        <div style="font-size: 12px; color: #047857; margin-bottom: 10px;">Carica uno screenshot oppure incolla il link della ricetta:</div>

        <input type="file" id="ric-file-input" accept="image/*" style="display: none;">
        <button id="btn-upload-foto" type="button" style="width: 100%; background: #10b981; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; margin-bottom: 10px; cursor: pointer;">📷 Scegli Screenshot / Scatta Foto</button>

        <div style="text-align: center; font-size: 11px; color: #059669; margin: 6px 0; font-weight: bold;">OPPUR INCOLLA UN LINK</div>

        <div style="display: flex; gap: 6px;">
          <input type="url" id="ric-url-input" placeholder="https://sito-ricette.it/ricetta..." style="flex: 1; padding: 8px; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 12px;">
          <button id="btn-import-url" type="button" style="background: #047857; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">🔗 Importa</button>
        </div>

        <div id="status-ai" style="display: none; font-size: 12px; color: #065f46; font-weight: bold; margin-top: 10px; text-align: center;">⚙️ Elaborazione con IA in corso...</div>
      </div>

      <!-- FORM SCHEDA RICETTA -->
      <div id="box-form-ricetta" style="display: none; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
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
              <option value="Secondi" selected>Secondi</option>
              <option value="Contorni">Contorni</option>
              <option value="Dolci">Dolci</option>
              <option value="Basi / Salse">Basi / Salse</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Tempi</label>
            <input type="text" id="ric-tempi" placeholder="Prep: 30 min | Cottura: 12 ore CBT" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Ingredienti (Sintassi: Ingrediente: Peso g) *</label>
            <textarea id="ric-ingredienti" required rows="6" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-family: monospace; font-size: 12px;" placeholder="Girello di Vitello: 2400g&#10;Olio EVO: 80g"></textarea>
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Procedimento Numerato</label>
            <textarea id="ric-procedimento" rows="6" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 12px;" placeholder="1. Mondare la carne...&#10;2. Condire e confezionare sottovuoto..."></textarea>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
            <button type="button" id="btn-annulla-ricetta" style="background: #9ca3af; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">Annulla</button>
            <button type="submit" style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">Salva Ricetta</button>
          </div>
        </form>
      </div>

      <!-- ELENCO RICETTE SALVATE -->
      <div id="lista-ricette" style="display: flex; flex-direction: column; gap: 12px;"></div>
    </div>
  `;

  // EVENTI FRONTEND
  const btnNuova = document.getElementById('btn-nuova-ricetta');
  const boxForm = document.getElementById('box-form-ricetta');
  const btnAnnulla = document.getElementById('btn-annulla-ricetta');
  const formRicetta = document.getElementById('form-ricetta');

  const btnImportUrl = document.getElementById('btn-import-url');
  const ricUrlInput = document.getElementById('ric-url-input');
  const btnUploadFoto = document.getElementById('btn-upload-foto');
  const fileInput = document.getElementById('ric-file-input');
  const statusAi = document.getElementById('status-ai');

  btnNuova.addEventListener('click', () => {
    formRicetta.reset();
    boxForm.style.display = 'block';
  });

  btnAnnulla.addEventListener('click', () => {
    boxForm.style.display = 'none';
  });

  // IMPORTAZIONE DA LINK
  btnImportUrl.addEventListener('click', async () => {
    const url = ricUrlInput.value.trim();
    if (!url) {
      alert("Inserisci un link valido!");
      return;
    }

    statusAi.style.display = 'block';
    statusAi.innerText = '⚙️ Elaborazione con IA in corso...';

    try {
      const response = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert("Errore importazione: " + (data.error || "Impossibile leggere la ricetta"));
        statusAi.style.display = 'none';
        return;
      }

      document.getElementById('ric-nome').value = data.nome || '';
      document.getElementById('ric-categoria').value = data.categoria || 'Secondi';
      document.getElementById('ric-tempi').value = data.tempi || '';
      document.getElementById('ric-ingredienti').value = data.ingredienti || '';
      document.getElementById('ric-procedimento').value = data.procedimento || '';

      boxForm.style.display = 'block';
      boxForm.scrollIntoView({ behavior: 'smooth' });
      statusAi.style.display = 'none';

    } catch (err) {
      console.error(err);
      alert("Errore durante la comunicazione con l'IA.");
      statusAi.style.display = 'none';
    }
  });

  // IMPORTAZIONE DA FOTO
  btnUploadFoto.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusAi.style.display = 'block';
    statusAi.innerText = '📷 Lettura immagine con IA in corso...';

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await fetch('/api/parse-recipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          alert("Errore scansione: " + (data.error || "Impossibile analizzare l'immagine"));
          statusAi.style.display = 'none';
          return;
        }

        document.getElementById('ric-nome').value = data.nome || '';
        document.getElementById('ric-categoria').value = data.categoria || 'Secondi';
        document.getElementById('ric-tempi').value = data.tempi || '';
        document.getElementById('ric-ingredienti').value = data.ingredienti || '';
        document.getElementById('ric-procedimento').value = data.procedimento || '';

        boxForm.style.display = 'block';
        boxForm.scrollIntoView({ behavior: 'smooth' });
        statusAi.style.display = 'none';

      } catch (err) {
        console.error(err);
        alert("Errore scansione immagine.");
        statusAi.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  });

  // SALVATAGGIO
  formRicetta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuovaRicetta = {
      nome: document.getElementById('ric-nome').value,
      categoria: document.getElementById('ric-categoria').value,
      tempi: document.getElementById('ric-tempi').value,
      ingredienti: document.getElementById('ric-ingredienti').value,
      procedimento: document.getElementById('ric-procedimento').value,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'ricette'), nuovaRicetta);
      boxForm.style.display = 'none';
      formRicetta.reset();
      caricaRicette();
    } catch (err) {
      console.error("Errore salvataggio:", err);
      alert("Errore durante il salvataggio della ricetta.");
    }
  });

  caricaRicette();
}

async function caricaRicette() {
  const container = document.getElementById('lista-ricette');
  if (!container) return;

  try {
    const q = query(collection(db, 'ricette'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    let html = '';

    if (snapshot.empty) {
      // Mostra ricetta di default se il database è vuoto
      html = generaHtmlRicetta(RICETTA_DEFAULT, true);
    } else {
      snapshot.forEach(docSnap => {
        html += generaHtmlRicetta({ id: docSnap.id, ...docSnap.data() }, false);
      });
    }

    container.innerHTML = html;

    // Gestione eliminazione
    document.querySelectorAll('.btn-elimina-ricetta').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm("Sei sicuro di voler eliminare questa ricetta?")) {
          await deleteDoc(doc(db, 'ricette', id));
          caricaRicette();
        }
      });
    });

  } catch (err) {
    console.error("Errore caricamento ricette:", err);
    container.innerHTML = generaHtmlRicetta(RICETTA_DEFAULT, true);
  }
}

function generaHtmlRicetta(r, isDefault) {
  return `
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <div>
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 12px;">${r.categoria || 'Generica'}</span>
          <h3 style="font-size: 16px; font-weight: bold; color: #111827; margin: 4px 0 2px 0;">${r.nome}</h3>
          <div style="font-size: 11px; color: #6b7280;">${r.tempi || ''}</div>
        </div>
        ${!isDefault ? `<button class="btn-elimina-ricetta" data-id="${r.id}" style="background: #fee2e2; color: #991b1b; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Elimina</button>` : ''}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; font-size: 12px;">
        <div style="background: #f9fafb; padding: 10px; border-radius: 8px;">
          <strong style="display: block; margin-bottom: 6px; color: #374151;">Ingredienti (20 porzioni):</strong>
          <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; color: #4b5563;">${r.ingredienti || ''}</pre>
        </div>
        <div style="background: #f9fafb; padding: 10px; border-radius: 8px;">
          <strong style="display: block; margin-bottom: 6px; color: #374151;">Procedimento:</strong>
          <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; color: #4b5563;">${r.procedimento || ''}</pre>
        </div>
      </div>
    </div>
  `;
}
