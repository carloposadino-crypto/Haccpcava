import { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from './firebase.js';

export function renderPuliziePage(container) {
  container.innerHTML = `
    <div style="padding: 16px; max-width: 600px; margin: 0 auto; padding-bottom: 80px;">
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">
        🧹 Scheda Sanificazione e Pulizie
      </h2>

      <form id="form-pulizie" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 24px;">
        
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #374151;">Turno / Frequenza</label>
          <select id="frequenza-pulizie" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
            <option value="GIORNALIERA_SERA">🌙 Sanificazione Giornaliera (Fine Servizio)</option>
            <option value="GIORNALIERA_PRANZO">☀️ Pulizia Intermedia (Fine Pranzo)</option>
            <option value="SETTIMANALE">📅 Sanificazione Settimanale Approfondita</option>
          </select>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 8px; color: #374151;">Checklist Piani e Attrezzature Sanitizzate</label>
          
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #4b5563;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="chk-area" value="Piani di Lavoro e Acciaio" checked> 🧼 Piani di Lavoro e Taglieri
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="chk-area" value="Affettatrice e Tritacarne" checked> 🔪 Affettatrice e Attrezzature
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="chk-area" value="Fornelli e Forno Rational" checked> 🍳 Fornelli, Piastre e Forno
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="chk-area" value="Maniglie Celle e Superfici Tatto" checked> 🚪 Maniglie Frighi e Interruttori
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="chk-area" value="Lavelli e Zone Lavaggio" checked> 🚰 Lavelli e Zona Stoviglie
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" class="chk-area" value="Pavimenti e Cestini" checked> 🧹 Pavimenti e Svuotamento Cestini
            </label>
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Prodotti Chimici Utilizzati</label>
          <input type="text" id="prodotti-usati" value="Sgrassante Multiuso Disinfettante Presidio Medico Chirurgico" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 13px;">
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Firma Operatore / Responsabile *</label>
          <input type="text" id="operatore-firma" required placeholder="Es. Carlo P." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
        </div>

        <button type="submit" style="width: 100%; background-color: #059669; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
          ✅ Conferma e Firma Sanificazione
        </button>
      </form>

      <div id="msg-conferma-pulizie" style="display: none; margin-bottom: 15px; padding: 12px; background-color: #d1fae5; color: #065f46; border-radius: 8px; text-align: center; font-weight: bold;">
        ✅ Registro pulizie salvato con successo!
      </div>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">📋 Registro Sanificazioni Eseguite</h3>
      <div id="lista-storico-pulizie" style="display: flex; flex-direction: column; gap: 10px;">
        <p style="color: #6b7280; font-size: 13px; text-align: center;">Caricamento storico...</p>
      </div>

    </div>
  `;

  const form = document.getElementById('form-pulizie');
  const frequenzaSelect = document.getElementById('frequenza-pulizie');
  const prodottiUsati = document.getElementById('prodotti-usati');
  const operatoreFirma = document.getElementById('operatore-firma');
  const msgConferma = document.getElementById('msg-conferma-pulizie');
  const listaStorico = document.getElementById('lista-storico-pulizie');

  async function caricaStoricoPulizie() {
    try {
      const q = query(collection(db, 'pulizie'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        listaStorico.innerHTML = '<p style="color: #6b7280; font-size: 13px; text-align: center;">Nessun registro sanificazione presente.</p>';
        return;
      }

      let html = '';
      querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        html += `
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
              <span>🧼 ${item.frequenza ? item.frequenza.replace('_', ' ') : 'Sanificazione'}</span>
              <span style="color: #059669;">✍️ ${item.operatore || 'N/D'}</span>
            </div>
            <div style="color: #4b5563; font-size: 12px; margin-bottom: 4px;">
              Data: <strong>${item.dataOra || ''}</strong>
            </div>
            <div style="font-size: 11px; color: #6b7280;">Aree: ${item.areeCompletate ? item.areeCompletate.join(', ') : 'Completate'}</div>
          </div>
        `;
      });

      listaStorico.innerHTML = html;
    } catch (err) {
      console.error("Errore lettura storico pulizie:", err);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const chkboxes = document.querySelectorAll('.chk-area:checked');
    const aree = Array.from(chkboxes).map(c => c.value);

    const data = {
      frequenza: frequenzaSelect.value,
      areeCompletate: aree,
      prodottiChimici: prodottiUsati.value,
      operatore: operatoreFirma.value,
      timestamp: serverTimestamp(),
      dataOra: new Date().toLocaleString('it-IT')
    };

    try {
      await addDoc(collection(db, 'pulizie'), data);
      form.reset();
      msgConferma.style.display = 'block';
      setTimeout(() => { msgConferma.style.display = 'none'; }, 3000);
      caricaStoricoPulizie();
    } catch (err) {
      alert("Errore salvataggio pulizie: " + err.message);
    }
  });

  caricaStoricoPulizie();
}s