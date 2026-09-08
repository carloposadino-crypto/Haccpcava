import { db } from './firebase.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export const ALLERGENI_UE = [
  'Glutine', 'Crostacei', 'Uova', 'Pesce', 'Arachidi', 'Soia', 'Latte',
  'Frutta a guscio', 'Sedano', 'Senape', 'Semi di sesamo', 'Anidride solforosa/Solfiti', 'Lupini', 'Molluschi'
];

export function renderProdottiPage() {
  const container = document.getElementById('tab-content');
  if (!container) return;

  container.innerHTML = `
    <section class="card">
      <h2>Anagrafica Prodotti e Allergeni (UE 1169/2011)</h2>
      <form id="prod-form" class="form-group" style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size: 13px; color: #d4a373;">Nome Prodotto / Inrediente</label>
          <input type="text" name="nome" placeholder="Es. Farina Tipo 00, Salsa Nocciole" required style="width:100%; padding:10px; border-radius:6px; border:1px solid #443c36; background:#2a2420; color:#fff;">
        </div>

        <div>
          <label style="font-size: 13px; color: #d4a373; display:block; margin-bottom:6px;">Allergeni Presenti</label>
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:6px; max-height:150px; overflow-y:auto; background:#1a1614; padding:8px; border-radius:6px; border:1px solid #3d352e;">
            ${ALLERGENI_UE.map(a => `
              <label style="font-size:12px; color:#aaa; display:flex; align-items:center; gap:4px;">
                <input type="checkbox" name="allergeni" value="${a}"> ${a}
              </label>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="btn" style="background:#d4a373; color:#1a1614; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">Salva Prodotto</button>
      </form>
    </section>

    <section class="card">
      <h2>Elenco Prodotti Registrati</h2>
      <div id="lista-prodotti">Caricamento...</div>
    </section>
  `;

  document.getElementById('prod-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const allergeni = formData.getAll('allergeni');

    try {
      await addDoc(collection(db, "prodotti"), {
        nome: formData.get('nome'),
        allergeni: allergeni,
        timestamp: new Date().toISOString()
      });
      alert('Prodotto salvato!');
      caricaProdotti();
      e.target.reset();
    } catch (err) {
      alert('Errore nel salvataggio prodotto.');
    }
  });

  caricaProdotti();
}

async function caricaProdotti() {
  const container = document.getElementById('lista-prodotti');
  if (!container) return;

  try {
    const q = query(collection(db, "prodotti"), orderBy("nome", "asc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = '<p class="empty-text">Nessun prodotto censito.</p>';
      return;
    }

    container.innerHTML = snapshot.docs.map(doc => {
      const p = doc.data();
      const allStr = p.allergeni && p.allergeni.length > 0 ? p.allergeni.join(', ') : 'Nessun allergene indicato';
      return `
        <div style="border-bottom: 1px solid #3d352e; padding: 8px 0;">
          <strong style="font-size:14px; color:#fff;">${p.nome}</strong>
          <div style="font-size:12px; color:#d4a373; margin-top:2px;">Allergeni: ${allStr}</div>
        </div>
      `;
    }).join('');
  } catch (e) {
    container.innerHTML = '<p class="error-text">Errore caricamento prodotti.</p>';
  }
}
