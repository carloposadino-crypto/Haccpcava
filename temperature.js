import { addTemperatura } from './store.js';
import { segnalaScrittura } from './sync-status.js';

export function initTemperature() {
  const form = document.getElementById('temp-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {
      valore: formData.get('valore'),
      note: formData.get('note'),
      timestamp: new Date().toISOString()
    };

    await addTemperatura(data);
    segnalaScrittura();
    form.reset();
  });
}
