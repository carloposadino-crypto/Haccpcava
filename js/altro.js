// Menu "Altro": raccoglie le sezioni usate meno spesso durante il
// servizio, per lasciare la barra in basso libera per Oggi, Temperature,
// Registro e Pulizie.

export function renderAltro(container, vaiA, onLogout) {
  const voci = [
    ['anomalie', 'Anomalie', 'Elenco e chiusura segnalazioni'],
    ['prodotti', 'Prodotti', 'Anagrafica e allergeni'],
    ['ricevimento', 'Ricevimento merci', 'Fornitore, prodotto, lotto'],
    ['schede', 'Schede HACCP', 'Preparazioni, versioni, approvazione'],
    ['listino', 'Listino prezzi', 'Prezzi fornitori per il food cost'],
    ['etichette', 'Etichette', 'Genera e stampa etichette'],
    ['storico', 'Storico', 'Consultazione e stampa'],
  ];
  container.innerHTML = `
    <div class="top-bar"><h2>Altro</h2></div>
    <div class="list-card">
      ${voci.map(([id, nome, desc]) => `
        <div class="check-row" data-vai="${id}">
          <div class="rt">
            <div class="t">${nome}</div>
            <div class="s">${desc}</div>
          </div>
          <span class="chev">›</span>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-secondary btn-block" id="altro-logout" style="margin-top:16px;">Esci</button>
  `;
  container.querySelectorAll('[data-vai]').forEach((el) => {
    el.addEventListener('click', () => vaiA(el.dataset.vai));
  });
  container.querySelector('#altro-logout').addEventListener('click', onLogout);
}
