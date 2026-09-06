export function renderAltro(container, vaiA, onLogout) {
  const voci = [
    ['prodotti', 'Prodotti', 'Anagrafica e allergeni'],
    ['ricevimento', 'Ricevimento merci', 'Fornitore, prodotto, lotto'],
    ['schede-haccp', 'Schede HACCP', 'Preparazioni, versioni, approvazione'],
    ['storico', 'Storico', 'Consultazione e stampa'],
  ];
  container.innerHTML = `
    ${voci.map(([id, nome, desc]) => `
      <div class="check-row" data-vai="${id}">
        <div class="rt">
          <div class="t">${nome}</div>
          <div class="s">${desc}</div>
        </div>
        <span class="chev">›</span>
      </div>
    `).join('')}
    <div class="check-row" id="altro-logout" style="margin-top:20px;">
      <div class="rt"><div class="t">Esci</div></div>
    </div>
  `;
  container.querySelectorAll('[data-vai]').forEach((el) => {
    el.addEventListener('click', () => vaiA(el.dataset.vai));
  });
  container.querySelector('#altro-logout').addEventListener('click', onLogout);
}
