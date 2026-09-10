// Modale "Segnala anomalia", condivisa da tutta l'app tramite il pulsante
// "!" sempre visibile nella tabbar. Si inserisce direttamente nel <body>
// così può essere aperta da qualunque schermata.

import { aggiungi } from '../lib/store.js';
import { segnalaScrittura } from '../lib/sync-status.js';

const CATEGORIE = [
  ['frigorifero', 'Frigorifero'],
  ['cottura', 'Cottura'],
  ['abbattimento', 'Abbattimento'],
  ['rigenerazione', 'Rigenerazione'],
  ['pulizie', 'Pulizie'],
  ['fornitore', 'Fornitore'],
  ['prodotto', 'Prodotto'],
  ['altro', 'Altro'],
];

export function apriModaleAnomalia(profilo, onSalvata) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>Segnala anomalia</h3>
      <label class="field-label">Categoria</label>
      <select id="an-categoria">
        ${CATEGORIE.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
      </select>
      <label class="field-label">Cosa è successo e cosa hai fatto</label>
      <textarea id="an-testo" placeholder="Es. Frigo a colonna a 7°C, prodotti spostati nel frigo 3 ante, verificare guarnizione"></textarea>
      <button class="btn btn-primary btn-block" id="an-salva">Salva segnalazione</button>
    </div>
  `;
  document.body.appendChild(backdrop);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  backdrop.querySelector('#an-salva').addEventListener('click', async () => {
    const categoria = backdrop.querySelector('#an-categoria').value;
    const testo = backdrop.querySelector('#an-testo').value.trim();
    if (!testo) return;
    await aggiungi('non_conformita', {
      categoria,
      problema: testo,
      stato: 'aperta',
      aperto_da: profilo.id,
      aperto_il: new Date(),
    });
    segnalaScrittura();
    backdrop.remove();
    if (onSalvata) onSalvata();
  });
}
