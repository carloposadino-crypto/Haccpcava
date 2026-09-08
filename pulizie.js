import { db } from './firebase.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const MANSIONI_DEFAULT = [
  { id: 'piano_lavoro', nome: 'Sanificazione Piani di Lavoro', freq: 'giornaliera' },
  { id: 'pavimenti', nome: 'Lavaggio Pavimenti Cava e Cucina', freq: 'giornaliera' },
  { id: 'affettatrice', nome: 'Pulizia e Disinfezione Affettatrice', freq: 'giornaliera' },
  { id: 'filtri_cappa', nome: 'Pulizia Filtri Cappa', freq: 'settimanale' },
  { id: 'frigo_profondo', nome: 'Sanificazione Profonda Evaporatori Frigo', freq: 'mensile' }
];

export function renderPuliziePage(onSave) {
  const appContainer = document.getElementById('tab-content');
  if (!appContainer) return;

  appContainer.innerHTML = `
    <section class="card">
      <h2>Pulizie e Sanificazioni Programmate</h2>
      <div id="pulizie-list" style="display: flex; flex-direction: column; gap: 10px;">
        ${MANSIONI_DEFAULT.map(m => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #1a1614; border-radius: 6px; border: 1px solid #3d352e;">
            <div>
              <div style="font-size: 14px; font-weight: bold;">${m.nome}</div>
              <div style="font-size: 11px; color: #d4a373; text-transform: uppercase;">${m.freq}</div>
            </div>
            <button onclick="window.completaPulizia('${m.id}', '${m.nome}')" style="background: #2a9d8f; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">
              Completato
            </button>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="card">
      <h2>Registro Esecuzioni Oggi</h2>
      <div id="lista-pulizie-oggi">Caricamento...</div>
    </section>
  `;

  window.completaPulizia = async (id, nome) => {
    try {
      await addDoc(collection(db, "pulizie"), {
        mansioneId: id,
        nome: nome,
        esito: "Completato",
        timestamp: new Date().toISOString()
      });
      alert(`Completata: ${nome}`);
      caricaPulizieOggi();
      if (onSave) onSave();
    } catch (e) {
      alert("Errore nel salvataggio della pulizia.");
    }
  };

  caricaPulizieOggi();
}

async function caricaPulizieOggi() {
  const container = document.getElementById('lista-pulizie-oggi');
  if (!container) return;

  try {
    const q = query(collection(db, "pulizie"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const oggi = new Date().toISOString().split('T')[0];
    const diOggi = snapshot.docs
      .map(doc => doc.data())
      .filter(p => p.timestamp && p.timestamp.startsWith(oggi));

    if (diOggi.length === 0) {
      container.innerHTML = '<p class="empty-text">Nessuna pulizia registrata oggi.</p>';
      return;
    }

    container.innerHTML = diOggi.map(item => `
      <div class="log-item" style="border-bottom: 1px solid #3d352e; padding: 8px 0;">
        <span class="log-date" style="color: #2a9d8f; font-size: 12px;">
          ${new Date(item.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - OK
        </span>
        <div style="font-size: 14px; font-weight: bold;">${item.nome}</div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<p class="error-text">Errore nel caricamento del registro pulizie.</p>';
  }
}
