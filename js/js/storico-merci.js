import { db, collection, getDocs, query, orderBy, doc, updateDoc } from './firebase.js';

export function renderStoricoMerciPage(container) {
  container.innerHTML = `
    <div style="padding: 16px; max-width: 800px; margin: 0 auto; padding-bottom: 80px;">
      <div style="display: flex; justify-content: space-between; align-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; margin: 0;">
          📋 Registro e Tracciabilità Merci
        </h2>
        <button id="btn-stampa-pdf" style="background-color: #1e40af; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
          🖨️ Esporta / Stampa Report ASL
        </button>
      </div>

      <!-- Filtri -->
      <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px; display: flex; gap: 10px;">
        <input type="text" id="filtro-fornitore" placeholder="Filtra per fornitore o DDT..." style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
        <select id="filtro-esito" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px;">
          <option value="TUTTI">Tutti gli esiti</option>
          <option value="CONFORME">✅ Conforme</option>
          <option value="CON_RISERVA">⚠️ Con Riserva</option>
          <option value="RESPINTO">❌ Respinto</option>
        </select>
      </div>

      <!-- Tabella / Lista Registro -->
      <div id="registro-merci-container" style="display: flex; flex-direction: column; gap: 12px;">
        <p style="text-align: center; color: #6b7280;">Caricamento registro in corso...</p>
      </div>
    </div>
  `;

  const containerRegistro = document.getElementById('registro-merci-container');
  const filtroFornitore = document.getElementById('filtro-fornitore');
  const filtroEsito = document.getElementById('filtro-esito');
  const btnStampa = document.getElementById('btn-stampa-pdf');

  let registriCaricati = [];

  async function caricaRegistro() {
    try {
      const q = query(collection(db, 'ricevimento_merci'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      registriCaricati = [];
      querySnapshot.forEach((docSnap) => {
        registriCaricati.push({ id: docSnap.id, ...docSnap.data() });
      });

      renderizzaLista(registriCaricati);
    } catch (err) {
      console.error("Errore caricamento registro:", err);
      containerRegistro.innerHTML = '<p style="color: #ef4444; text-align: center;">Errore durante il caricamento del registro.</p>';
    }
  }

  function renderizzaLista(lista) {
    if (lista.length === 0) {
      containerRegistro.innerHTML = '<p style="text-align: center; color: #6b7280;">Nessun registro trovato.</p>';
      return;
    }

    let html = '';
    lista.forEach((item) => {
      let badge = '🟢 Conforme';
      let borderCol = '#10b981';
      if (item.esito === 'CON_RISERVA') { badge = '🟡 Con Riserva'; borderCol = '#f59e0b'; }
      if (item.esito === 'RESPINTO') { badge = '🔴 Respinto'; borderCol = '#ef4444'; }

      html += `
        <div style="background: white; border-left: 5px solid ${borderCol}; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 15px; color: #111827;">${item.fornitore || 'Fornitore Non Indicato'}</strong>
            <span style="font-size: 12px; font-weight: bold;">${badge}</span>
          </div>

          <div style="font-size: 12px; color: #4b5563; margin-bottom: 8px; display: flex; gap: 15px;">
            <span>DDT/Bolla: <strong>${item.numeroBolla || 'N/D'}</strong></span>
            <span>Temp. Trasporto: <strong>${item.temperatura ? item.temperatura + '°C' : 'N/D'}</strong></span>
            <span>Data: <strong>${item.dataOra || 'N/D'}</strong></span>
          </div>

          <div style="background: #f9fafb; padding: 8px; border-radius: 6px; font-size: 12px; font-family: monospace; white-space: pre-wrap; color: #374151; margin-bottom: 8px;">${item.prodotti || 'Nessun dettaglio prodotti'}</div>

          <!-- Gestione Azione Correttiva per Non Conformità -->
          ${(item.esito === 'CON_RISERVA' || item.esito === 'RESPINTO') ? `
            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; padding: 8px; margin-top: 8px;">
              <strong style="font-size: 11px; color: #b45309; display: block; margin-bottom: 4px;">⚠️ Scheda Non Conformità & Azione Correttiva:</strong>
              <div style="font-size: 12px; color: #92400e;">${item.azioneCorrettiva || 'Nessuna azione correttiva registrata.'}</div>
              ${!item.azioneCorrettiva ? `
                <button onclick="aggiungiAzioneCorrettiva('${item.id}')" style="margin-top: 6px; background: #d97706; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer;">
                  + Aggiungi Azione Correttiva / Reso
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `;
    });

    containerRegistro.innerHTML = html;
  }

  // Filtraggio dinamico
  function applicaFiltri() {
    const testo = filtroFornitore.value.toLowerCase();
    const esito = filtroEsito.value;

    const filtrati = registriCaricati.filter(item => {
      const matchTesto = (item.fornitore && item.fornitore.toLowerCase().includes(testo)) ||
                         (item.numeroBolla && item.numeroBolla.toLowerCase().includes(testo)) ||
                         (item.prodotti && item.prodotti.toLowerCase().includes(testo));
      const matchEsito = esito === 'TUTTI' || item.esito === esito;
      return matchTesto && matchEsito;
    });

    renderizzaLista(filtrati);
  }

  filtroFornitore.addEventListener('input', applicaFiltri);
  filtroEsito.addEventListener('change', applicaFiltri);

  // Stampa / Esportazione Registro
  btnStampa.addEventListener('click', () => {
    window.print();
  });

  // Funzione globale per la gestione della non conformità
  window.aggiungiAzioneCorrettiva = async (docId) => {
    const azione = prompt("Inserisci l'azione correttiva applicata (es. Merce respinta al vettore / Contattato fornitore per nota d'accredito):");
    if (!azione) return;

    try {
      const docRef = doc(db, 'ricevimento_merci', docId);
      await updateDoc(docRef, { azioneCorrettiva: azione });
      alert("Azione correttiva registrata correttamente.");
      caricaRegistro();
    } catch (err) {
      alert("Errore nell'aggiornamento: " + err.message);
    }
  };

  caricaRegistro();
}