import { db } from './firebase.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function renderRicezioniPage() {
  const container = document.getElementById('tab-content');
  if (!container) return;

  container.innerHTML = `
    <section class="card">
      <h2>Ricevimento Merci e Forniture</h2>
      <form id="ric-form" class="form-group" style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size: 13px; color: #d4a373;">Fornitore</label>
          <input type="text" name="fornitore" placeholder="Es. Fornitore locale" required style="width:100%; padding:10px; border-radius:6px; border:1px solid #443c36; background:#2a2420; color:#fff;">
        </div>
        <div>
          <label style="font-size: 13px; color: #d4a373;">Materia Prima / Lotto</label>
          <input type="text" name="materia" placeholder="Es. Prodotto - Lotto #1" required style="width:100%; padding:10px; border-radius:6px; border:1px solid #443c36; background:#2a2420; color:#fff;">
        </div>
        <div style="display:flex; gap:10px;">
          <div style="flex:1;">
            <label style="font-size: 13px; color: #d4a373;">Temp. Mezzo (°C)</label>
            <input type="number" step="0.1" name="temp" placeholder="°C" style="width:100%; padding:10px; border-radius:6px; border:1px solid #443c36; background:#2a2420; color:#fff;">
          </div>
          <div style="flex:1;">
            <label style="font-size: 13px; color: #d4a373;">Esito Controllo</label>
            <select name="esito" style="width:100%; padding:10px; border-radius:6px; background:#fff; color:#1a1614; font-size:14px;">
              <option value="Accettato">Accettato</option>
              <option value="Accettato con Riserva">Accettato con Riserva</option>
              <option value="Respinto">Respinto</option>
            </select>
          </div>
        </div>
        <button type="submit" class="btn" style="background:#d4a373; color:#1a1614; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">Registra Ricevimento</button>
      </form>
    </section>

    <section class="card">
      <h2>Registro Arrivi</h2>
      <div id="lista-ricezioni">Caricamento...</div>
    </section>
  `;

  document.getElementById('ric-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await addDoc(collection(db, "ricezioni"), {
        fornitore: formData.get('fornitore'),
        materia: formData.get('materia'),
        temp: parseFloat(formData.get('temp')) || null,
        esito: formData.get('esito'),
        timestamp: new Date().toISOString()
      });
      alert('Ricevimento merce salvato!');
      caricaRicezioni();
      e.target.reset();
    } catch (err) {
      alert('Errore nel salvataggio del ricevimento.');
    }
  });

  caricaRicezioni();
}

async function caricaRicezioni() {
  const container = document.getElementById('lista-ricezioni');
  if (!container) return;

  try {
    const q = query(collection(db, "ricezioni"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = '<p class="empty-text">Nessuna merce registrata.</p>';
      return;
    }

    container.innerHTML = snapshot.docs.map(doc => {
      const r = doc.data();
      return `
        <div style="border-bottom: 1px solid #3d352e; padding: 8px 0;">
          <div style="display:flex; justify-content:space-between;">
            <strong style="font-size:14px; color:#fff;">${r.fornitore}</strong>
            <span style="font-size:12px; color:#2a9d8f;">${r.esito}</span>
          </div>
          <div style="font-size:12px; color:#aaa;">${r.materia} ${r.temp ? `(${r.temp}°C)` : ''}</div>
        </div>
      `;
    }).join('');
  } catch (e) {
    container.innerHTML = '<p class="error-text">Errore caricamento ricevimenti.</p>';
  }
}
