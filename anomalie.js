import { db } from './firebase.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export function apriModalAnomalia(onSave) {
  const modal = document.createElement('div');
  modal.id = 'anomaly-modal';
  modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000; padding:16px;';
  
  modal.innerHTML = `
    <div class="card" style="width:100%; max-width:500px; margin:0; background:#2a2420;">
      <h2 style="color:#e63946;">Segnala Anomalia Non Conformità</h2>
      <form id="anomaly-form" class="form-group" style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
        <div>
          <label style="font-size: 13px; color: #d4a373;">Categoria</label>
          <select name="categoria" style="width:100%; padding:10px; border-radius:6px; background:#fff; color:#1a1614; font-size:15px;">
            <option value="Temperatura Fuori Range">Temperatura Fuori Range</option>
            <option value="Prodotto Scaduto / Non Conforme">Prodotto Scaduto / Non Conforme</option>
            <option value="Guasto Attrezzatura">Guasto Attrezzatura</option>
            <option value="Igiene / Infestanti">Igiene / Infestanti</option>
            <option value="Altro">Altro</option>
          </select>
        </div>
        <div>
          <label style="font-size: 13px; color: #d4a373;">Descrizione dell'Anomalia e Azione Correttiva</label>
          <textarea name="descrizione" required placeholder="Descrivi il problema riscontrato..." style="width:100%; padding:10px; border-radius:6px; min-height:80px;"></textarea>
        </div>
        <div style="display:flex; gap:10px; margin-top:8px;">
          <button type="button" onclick="document.getElementById('anomaly-modal').remove()" style="flex:1; padding:12px; background:#443c36; color:#fff; border:none; border-radius:6px; cursor:pointer;">Annulla</button>
          <button type="submit" style="flex:1; padding:12px; background:#e63946; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Invia Segnalazione</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('anomaly-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await addDoc(collection(db, "anomalie"), {
        categoria: formData.get('categoria'),
        descrizione: formData.get('descrizione'),
        stato: 'Aperta',
        timestamp: new Date().toISOString()
      });
      alert('Anomalia registrata con successo.');
      modal.remove();
      if (onSave) onSave();
    } catch (err) {
      alert('Errore nel salvataggio dell\'anomalia.');
    }
  });
}

export async function renderAnomaliePage() {
  const appContainer = document.getElementById('tab-content');
  if (!appContainer) return;

  appContainer.innerHTML = `
    <section class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2>Registro Anomalie Aperte</h2>
        <button onclick="window.triggerModalAnomalia()" style="background:#e63946; color:#fff; border:none; padding:8px 12px; border-radius:6px; font-weight:bold; cursor:pointer;">+ Nuova</button>
      </div>
      <div id="lista-anomalie">Caricamento...</div>
    </section>
  `;

  window.triggerModalAnomalia = () => apriModalAnomalia(() => renderAnomaliePage());

  try {
    const q = query(collection(db, "anomalie"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const container = document.getElementById('lista-anomalie');
    
    if (snapshot.empty) {
      container.innerHTML = '<p class="empty-text">Nessuna anomalia segnalata.</p>';
      return;
    }

    container.innerHTML = snapshot.docs.map(doc => {
      const data = doc.data();
      return `
        <div class="log-item" style="border-bottom: 1px solid #3d352e; padding: 10px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color: #e63946; font-weight:bold; font-size:13px;">${data.categoria}</span>
            <span style="font-size:11px; color:#aaa;">${new Date(data.timestamp).toLocaleDateString('it-IT')}</span>
          </div>
          <div style="font-size:14px; margin-top:4px;">${data.descrizione}</div>
        </div>
      `;
    }).join('');
  } catch (e) {
    document.getElementById('lista-anomalie').innerHTML = '<p class="error-text">Errore caricamento anomalie.</p>';
  }
}
