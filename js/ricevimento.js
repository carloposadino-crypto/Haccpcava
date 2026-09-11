import { db, collection, addDoc, serverTimestamp } from './firebase.js';

export function renderRicezioniPage(container) {
  container.innerHTML = `
    <div style="padding: 16px; max-width: 600px; margin: 0 auto; padding-bottom: 80px;">
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 16px; color: #1f2937;">
        📦 Ricevimento Merci e Bolle
      </h2>

      <!-- Card Acquisizione Foto Bolla -->
      <div style="background: #f3f4f6; border: 2px dashed #9ca3af; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
        <p style="font-size: 14px; color: #4b5563; margin-bottom: 12px; font-weight: 500;">
          📸 Fotografa la bolla di consegna per la compilazione automatica
        </p>
        
        <label for="camera-input" style="background-color: #2563eb; color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold; display: inline-block; cursor: pointer;">
          📷 Scatta Foto Bolla
        </label>
        <input type="file" id="camera-input" accept="image/*" capture="environment" style="display: none;">

        <div id="ocr-spinner" style="display: none; margin-top: 15px; color: #2563eb; font-weight: 500;">
          ⏳ Lettura ed estrazione dati dalla bolla in corso...
        </div>

        <div id="image-preview-container" style="display: none; margin-top: 15px;">
          <img id="image-preview" src="" alt="Anteprima Bolla" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid #d1d5db;">
        </div>
      </div>

      <!-- Modulo Dati Merci -->
      <form id="form-ricevimento" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Fornitore</label>
          <input type="text" id="fornitore" required placeholder="Es. Valmora, Carni Piemonte..." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 14px;">
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">N° DDT / Bolla</label>
            <input type="text" id="num-bolla" placeholder="Es. 1234/A" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Temp. Trasporto (°C)</label>
            <input type="number" step="0.1" id="temp-trasporto" placeholder="Es. 3.5" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Prodotti e Lotti</label>
          <textarea id="dettaglio-prodotti" rows="4" placeholder="Lista prodotti, quantitativi e lotti..." style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;"></textarea>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #374151;">Conformità Merce</label>
          <select id="esito-conformita" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box;">
            <option value="CONFORME">✅ Conforme (Imballi integri, temp. corretta)</option>
            <option value="CON_RISERVA">⚠️ Accettato con riserva</option>
            <option value="RESPINTO">❌ Respinto</option>
          </select>
        </div>

        <button type="submit" style="width: 100%; background-color: #059669; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;">
          💾 Salva Registrazione Merce
        </button>
      </form>

      <div id="msg-conferma" style="display: none; margin-top: 15px; padding: 12px; background-color: #d1fae5; color: #065f46; border-radius: 8px; text-align: center; font-weight: bold;">
        ✅ Scheda ricevimento merce salvata correttamente!
      </div>
    </div>
  `;

  const cameraInput = document.getElementById('camera-input');
  const ocrSpinner = document.getElementById('ocr-spinner');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const form = document.getElementById('form-ricevimento');
  const msgConferma = document.getElementById('msg-conferma');

  cameraInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target.result;
      imagePreview.src = base64Image;
      imagePreviewContainer.style.display = 'block';
      ocrSpinner.style.display = 'block';

      try {
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Image })
        });

        const result = await response.json();

        if (result.success && result.data) {
          const d = result.data;
          if (d.fornitore) document.getElementById('fornitore').value = d.fornitore;
          if (d.numeroDocumento) document.getElementById('num-bolla').value = d.numeroDocumento;

          if (d.prodotti && d.prodotti.length > 0) {
            const testoProdotti = d.prodotti.map(p => `${p.nome}: ${p.quantita}g (Lotto: ${p.lotto})`).join('\n');
            document.getElementById('dettaglio-prodotti').value = testoProdotti;
          }
        }
      } catch (err) {
        console.error("Errore chiamata OCR:", err);
      } finally {
        ocrSpinner.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      fornitore: document.getElementById('fornitore').value,
      numeroBolla: document.getElementById('num-bolla').value,
      temperatura: parseFloat(document.getElementById('temp-trasporto').value) || null,
      prodotti: document.getElementById('dettaglio-prodotti').value,
      esito: document.getElementById('esito-conformita').value,
      timestamp: serverTimestamp(),
      dataOra: new Date().toLocaleString('it-IT')
    };

    try {
      await addDoc(collection(db, 'ricevimento_merci'), data);
      form.reset();
      imagePreviewContainer.style.display = 'none';
      msgConferma.style.display = 'block';
      setTimeout(() => { msgConferma.style.display = 'none'; }, 3000);
    } catch (err) {
      alert("Errore durante il salvataggio: " + err.message);
    }
  });
}