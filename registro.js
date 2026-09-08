import { addRegistro } from './store.js';
import { segnalaScrittura } from './sync-status.js';

export function initRegistro(onSuccess) {
  const form = document.getElementById('registro-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {
      tipo: formData.get('tipo'),
      note: formData.get('note'),
      timestamp: new Date().toISOString()
    };

    await addRegistro(data);
    segnalaScrittura();
    form.reset();
    if (onSuccess) onSuccess();
  });
}
