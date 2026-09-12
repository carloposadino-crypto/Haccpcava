import { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from './firebase.js';

// Scheda ricetta predefinita di esempio (Vitello Tonnato CBT - 20 porzioni)
const RICETTA_DEFAULT = {
  nome: "Vitello Tonnato CBT (20 porzioni)",
  categoria: "Secondi",
  tempi: "Preparazione: 45 min | Cottura CBT: 4 ore | Abbattimento: 60 min",
  ingredienti: `Girello / Magatello di Vitello: 2400g
Olio Extravergine d'Oliva: 120g
Sale Fino: 28g
Pepe Nero Macinato: 4g
Ramerino Fresco: 10g
Timo Fresco: 10g
Tuorli d'Uovo Pastorizzati: 250g
Tonnato (Capperi Dissalati): 80g
Acciughe sott'olio: 60g
Tonno Sott'olio Sgocciolato: 480g
Succo di Limone: 40g
Brodo vegetale freddo: 150g`,
  procedimento: `1. Mondare e rifilare il girello di vitello, massaggiare con olio, sale (28g), pepe (4g) ed erbe aromatiche.
2. Confezionare il girello sottovuoto al 99% in busta per cottura CBT.
3. Immergere nel Roner preriscaldato a 58°C per 4 ore.
4. A fine cottura, trasferire immediatamente la busta sigillata nell'abbattitore di temperatura (ciclo positivo +3°C al cuore entro 90 min).
5. Per la salsa tonnata: frullare tuorli pastorizzati, tonno, acciughe, capperi e succo di limone. Emulsionare a filo con olio EVOO e regolare di densità con brodo freddo.
6. Affettare sottilmente la carne abbattuta fredda all'affettatrice e nappare con la salsa.`,
  impiattamento: "Stile trattoria moderna: disporre le fette di vitello leggermente sovrapposte a raggiera, nappare al centro con la salsa tonnata fluida, guarnire con un cappero peroncino e un germoglio o foglia di prezzemolo pulita.",
  conservazione: "Prodotto CBT in busta sigillata sotto vuoto: 14 giorni a 0°C / +2°C. Salsa tonnata fresca in contenitore ermetico: 3 giorni a +2°C / +4°C.",
  criticita: "Verificare la tenuta del sigillo sottovuoto prima del roner. Monitorare la temperatura dell'abbattitore per raggiungere +3°C al cuore entro 90 minuti. Non sovraccaricare la salsa di sale data la presenza di tonno e acciughe."
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

      <!-- Form di inserimento nuova ricetta (inizialmente nascosto) -->
      <div id="box-form-ricetta" style="display: none; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #111827;">Inserisci Nuova Scheda Ricetta</h3>
        
        <form id="form-ricetta" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Nome Ricetta *</label>
            <input type="text" id="ric-nome" required placeholder="Es. Guancia di Bovino al Barolo CBT" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
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
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Tempi (Preparazione / Cottura / Abbattimento)</label>
            <input type="text" id="ric-tempi" placeholder="Es. Prep: 30 min | Cottura: 12 ore CBT" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Ingredienti (Sintassi: Ingrediente: Peso g) *</label>
            <textarea id="ric-ingredienti" required rows="6" placeholder="Carne: 2000g&#10;Sale: 20g" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-family: monospace; font-size: 13px;"></textarea>
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Procedimento Numerato</label>
            <textarea id="ric-procedimento" rows="5" placeholder="1. Preparare la materia prima...&#10;2. Confezionare sottovuoto..." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 13px;"></textarea>
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Impiattamento (Stile Trattoria Moderna)</label>
            <input type="text" id="ric-impiattamento" placeholder="Descrizione del piatto finito..." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Conservazione (Norme HACCP)</label>
            <input type="text" id="ric-conservazione" placeholder="Es. 14 giorni in sottovuoto a 2°C" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #374151;">Criticità Tecniche</label>
            <input type="text" id="ric-criticita" placeholder="Punti critici di controllo CCP..." style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>

          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button type="submit" style="flex: 1; background-color: #059669; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer;">Salva Scheda</button>
            <button type="button" id="btn-annulla-ricetta" style="background-color: #9ca3af; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer;">Annulla</button>
          </div>
        </form>
      </div>

      <!-- Contenitore Lista Ricette -->
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

  btnNuova.addEventListener('click', () => { boxForm.style.display = 'block'; });
  btnAnnulla.addEventListener('click', () => { boxForm.style.display = 'none'; });

  async function caricaRicette() {
    try {
      const q = query(collection(db, 'ricette'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      let ricetteArr = [];
      querySnapshot.forEach((docSnap) => {
        ricetteArr.push(docSnap.data());
      });

      // Se il database è vuoto, mostra la scheda di default del Vitello Tonnato CBT
      if (ricetteArr.length === 0) {
        ricetteArr.push(RICETTA_DEFAULT);
      }

      let html = '';
      ricetteArr.forEach((ric) => {
        html += `
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <h3 style="font-size: 16px; font-weight: bold; color: #111827; margin: 0;">${ric.nome}</h3>
              <span style="background-color: #f3f4f6; color: #374151; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 12px;">${ric.categoria || 'Generale'}</span>
            </div>

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