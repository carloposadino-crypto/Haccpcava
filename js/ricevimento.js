import { db, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from './firebase.js';

export function renderRicezioniPage(container) {
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div style="padding: 16px; max-width: 600px; margin: 0 auto; padding-bottom: 80px;">
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">
        📦 Ricevimento Merci e Bolle
      </h2>

      <!-- Form Registrazione Merci -->
      <form id="form-ricevimento" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 24px;">
        
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Data Ricevimento *</label>
          <input type="date" id="ric-data" value="${today}" required style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Fornitore *</label>
          <input type="text" id="ric-fornitore" required placeholder="Es. Distribuzione Carni Srl" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Prodotto / Descrizione *</label>
          <input type="text" id="ric-prodotto" required placeholder="Es. Girello di Vitello" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 14px;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Lotto Fornitore *</label>
            <input type="text" id="ric-lotto" required placeholder="Es. L-8921" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Quantità (g)</label>
            <input type="number" id="ric-quantita" placeholder="Es. 5000" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 14px;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Temp. Consegna (°C)</label>
            <input type="number" step="0.1" id="ric-temp" placeholder="Es. 3.5" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Stato Trasporto</label>
            <select id="ric-conforme" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
              <option value="CONFORME">✅ Conforme</option>
              <option value="NON_CONFORME">❌ Non Conforme</option>
            </select>
          </div>
        </div>

        <div id="box-non-conforme" style="display: none; background: #fef2f2; border: 1px solid #fca5a5; padding: 12px; border-radius: 8px; margin-bottom: 14px;">
          <label style="display: block; font-size: 12px; font-weight: bold; color: #991b1b; margin-bottom: 4px;">Motivo Non Conformità & Azione Correttiva *</label>
          <input type="text" id="ric-azione" placeholder="Es. Merce respinta per temperatura troppo alta (+9°C)" style="width: 100%; padding: 8px; border: 1px solid #f87171; border-radius: 6px; box-sizing: border-box; font-size: 13px;">
        </div>

        <button type="submit" style="width: 100%; background-color: #059669; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
          💾 Registra Ingresso Merce
        </button>
      </form>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <h3 style="font-size: 16px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">📋 Ultimi Ingressi Merci</h3>
      <div id="lista-merci" style="display: flex; flex-direction: column; gap: 10px;">
        <p style="color: #6b7280; font-size: 13px; text-align: center;">Caricamento registri...</p>
      </div>
    </div>
  `;

  const form = document.getElementById('form-ricevimento');
  const selectConforme = document.getElementById('ric-conforme');
  const boxNonConforme = document.getElementById('box-non-conforme');
  const inputAzione = document.getElementById('ric-azione');
  const listaMerci = document.getElementById('lista-merci');

  selectConforme.addEventListener('change', () => {
    if (selectConforme.value === 'NON_CONFORME') {
      boxNonConforme.style.display = 'block';
      inputAzione.required = true;
    } else {
      boxNonConforme.style.display = 'none';
      inputAzione.required = false;
      inputAzione.value = '';
    }
  });

  async function caricaMerci() {
    try {
      const q = query(collection(db, 'ricevimento_merci'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        listaMerci.innerHTML = '<p style="color: #6b7280; font-size: 13px; text-align: center;">Nessun ingresso merce registrato.</p>';
        return;
      }

      let html = '';
      querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const nonConforme = item.stato === 'NON_CONFORME';
        const borderColor = nonConforme ? '#ef4444' : '#10b981';

        html += `
          <div style="background: white; border-left: 4px solid ${borderColor}; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 4px;">
              <span>${item.prodotto}</span>
              <span style="color: #6b7280;">${item.data}</span>
            </div>
            <div style="color: #4b5563; font-size: 12px;">
              Fornitore: <strong>${item.fornitore}</strong> | Lotto: <strong>${item.lotto}</strong>
            </div>
            <div style="color: #6b7280; font-size: 11px; margin-top: 2px;">
              Temp: ${item.temperatura ? item.temperatura + '°C' : 'N/D'} | Q.tà: ${item.quantita ? item.quantita + 'g' : 'N/D'}
            </div>
            ${item.azioneCorrettiva ? `
              <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 4px; padding: 6px; margin-top: 6px; font-size: 11px; color: #991b1b;">
                <strong>Azione:</strong> ${item.azioneCorrettiva}
              </div>
            ` : ''}
          </div>
        `;
      });

      listaMerci.innerHTML = html;
    } catch (err) {
      console.error("Errore caricamento merci:", err);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      data: document.getElementById('ric-data').value,
      fornitore: document.getElementById('ric-fornitore').value,
      prodotto: document.getElementById('ric-prodotto').value,
      lotto: document.getElementById('ric-lotto').value,
      quantita: parseFloat(document.getElementById('ric-quantita').value) || null,
      temperatura: parseFloat(document.getElementById('ric-temp').value) || null,
      stato: selectConforme.value,
      azioneCorrettiva: selectConforme.value === 'NON_CONFORME' ? inputAzione.value : null,
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'ricevimento_merci'), data);
      form.reset();
      boxNonConforme.style.display = 'none';
      caricaMerci();
    } catch (err) {
      alert("Errore salvataggio registrazione: " + err.message);
    }
  });

  caricaMerci();
}