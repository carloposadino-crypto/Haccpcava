import { addTemperatura, getTemperature } from './store.js';

// Configurazioni apparecchiature con range dinamici
export const APPARECCHIATURE = [
  { id: '3ante', nome: 'Frigo 3 Ante', min: 0, max: 4 },
  { id: 'colonna', nome: 'Frigo Colonna', min: 0, max: 4 },
  { id: 'domestico', nome: 'Frigo Domestico', min: 2, max: 6 },
  { id: 'acqua', nome: 'Acqua Saletta', min: 4, max: 8 },
  { id: 'freezer1', nome: 'Freezer 1', min: -25, max: -18 },
  { id: 'freezer2', nome: 'Freezer 2', min: -25, max: -18 }
];

export function renderTemperaturePage(onSave) {
  const appContainer = document.getElementById('tab-content');
  if (!appContainer) return;

  appContainer.innerHTML = `
    <section class="card">
      <h2>Controlli → Temperature Apparecchiature</h2>
      <div id="equipments-list" style="display: flex; flex-direction: column; gap: 16px;">
        ${APPARECCHIATURE.map(eq => `
          <div class="equip-card" style="background: #1a1614; padding: 12px; border-radius: 8px; border: 1px solid #3d352e;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <strong style="font-size: 15px;">${eq.nome}</strong>
              <span id="badge-${eq.id}" class="badge" style="font-size: 11px; padding: 3px 8px; border-radius: 4px; background: #3d352e; color: #aaa;">
                Range: ${eq.min}° / ${eq.max}°C
              </span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="btn-step" onclick="window.stepTemp('${eq.id}', -0.5)" style="background: #3d352e; color: #fff; border: none; width: 40px; height: 40px; border-radius: 6px; font-weight: bold; font-size: 18px; cursor: pointer;">-</button>
              <input type="number" step="0.1" id="input-${eq.id}" value="${((eq.min + eq.max) / 2).toFixed(1)}" 
                oninput="window.checkRange('${eq.id}')"
                style="flex: 1; text-align: center; padding: 8px; font-weight: bold; font-size: 16px; border-radius: 6px; border: 1px solid #443c36; background: #2a2420; color: #fff;">
              <button class="btn-step" onclick="window.stepTemp('${eq.id}', 0.5)" style="background: #3d352e; color: #fff; border: none; width: 40px; height: 40px; border-radius: 6px; font-weight: bold; font-size: 18px; cursor: pointer;">+</button>
              <button onclick="window.saveTemp('${eq.id}')" style="background: #d4a373; color: #1a1614; border: none; padding: 0 12px; height: 40px; border-radius: 6px; font-weight: bold; cursor: pointer;">Salva</button>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  // Funzioni helper globali per interazione diretta
  window.stepTemp = (id, delta) => {
    const input = document.getElementById(`input-${id}`);
    if (input) {
      let val = parseFloat(input.value) || 0;
      input.value = (val + delta).toFixed(1);
      window.checkRange(id);
    }
  };

  window.checkRange = (id) => {
    const eq = APPARECCHIATURE.find(e => e.id === id);
    const input = document.getElementById(`input-${id}`);
    const badge = document.getElementById(`badge-${id}`);
    if (!eq || !input || !badge) return;

    const val = parseFloat(input.value);
    if (isNaN(val)) {
      badge.textContent = `Range: ${eq.min}° / ${eq.max}°C`;
      badge.style.background = '#3d352e';
      badge.style.color = '#aaa';
    } else if (val >= eq.min && val <= eq.max) {
      badge.textContent = 'Nella norma';
      badge.style.background = '#2a9d8f';
      badge.style.color = '#fff';
    } else {
      badge.textContent = 'Fuori range';
      badge.style.background = '#e63946';
      badge.style.color = '#fff';
    }
  };

  window.saveTemp = async (id) => {
    const eq = APPARECCHIATURE.find(e => e.id === id);
    const input = document.getElementById(`input-${id}`);
    if (!eq || !input) return;

    const val = parseFloat(input.value);
    const esito = (val >= eq.min && val <= eq.max) ? 'Nella norma' : 'Fuori range';

    const record = {
      apparecchiaturaId: eq.id,
      apparecchiaturaNome: eq.nome,
      valore: val,
      esito: esito,
      timestamp: new Date().toISOString()
    };

    await addTemperatura(record);
    alert(`Temperatura salvata per ${eq.nome}: ${val}°C (${esito})`);
    if (onSave) onSave();
  };

  // Esegui controllo iniziale sui valori di default
  APPARECCHIATURE.forEach(eq => window.checkRange(eq.id));
}
