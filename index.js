import { renderTemperature } from './temperature.js';
import { renderRegistro } from './registro.js';

let sottoTab = 'temperature';

export async function renderControlli(container, profilo) {
  container.innerHTML = `
    <div class="segmented" id="controlli-subnav">
      <button data-sub="temperature" class="${sottoTab === 'temperature' ? 'active' : ''}">Temperature</button>
      <button data-sub="registro" class="${sottoTab === 'registro' ? 'active' : ''}">Registro</button>
    </div>
    <div id="controlli-content"></div>
  `;

  container.querySelectorAll('[data-sub]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      sottoTab = btn.dataset.sub;
      await renderControlli(container, profilo);
    });
  });

  const content = container.querySelector('#controlli-content');
  if (sottoTab === 'temperature') {
    await renderTemperature(content, profilo);
  } else {
    await renderRegistro(content, profilo);
  }
}
