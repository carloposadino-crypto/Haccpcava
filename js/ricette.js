// Aggiungere o sostituire questa funzione in js/ricette.js dopo l'iniezione dell'HTML
const btnImportUrl = document.getElementById('btn-import-url');
const ricUrlInput = document.getElementById('ric-url-input');
const statusAi = document.getElementById('status-ai');
const boxForm = document.getElementById('box-form-ricetta');

if (btnImportUrl) {
  btnImportUrl.addEventListener('click', async () => {
    const url = ricUrlInput ? ricUrlInput.value.trim() : '';
    if (!url) {
      alert("Inserisci un link valido prima di cliccare Importa!");
      return;
    }

    if (statusAi) {
      statusAi.style.display = 'block';
      statusAi.innerText = '⚙️ Elaborazione con IA in corso...';
    }

    try {
      const response = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert("Errore importazione: " + (data.error || "Impossibile leggere la ricetta"));
        if (statusAi) statusAi.style.display = 'none';
        return;
      }

      // Popola i campi del form
      if (document.getElementById('ric-nome')) document.getElementById('ric-nome').value = data.nome || '';
      if (document.getElementById('ric-categoria')) document.getElementById('ric-categoria').value = data.categoria || 'Secondi';
      if (document.getElementById('ric-tempi')) document.getElementById('ric-tempi').value = data.tempi || '';
      if (document.getElementById('ric-ingredienti')) document.getElementById('ric-ingredienti').value = data.ingredienti || '';
      if (document.getElementById('ric-procedimento')) document.getElementById('ric-procedimento').value = data.procedimento || '';

      // Mostra la scheda ricetta nascosta
      if (boxForm) {
        boxForm.style.display = 'block';
        boxForm.scrollIntoView({ behavior: 'smooth' });
      }

      if (statusAi) statusAi.style.display = 'none';

    } catch (err) {
      console.error("Errore importazione ricetta:", err);
      alert("Si è verificato un errore durante la comunicazione con l'IA.");
      if (statusAi) statusAi.style.display = 'none';
    }
  });
}
