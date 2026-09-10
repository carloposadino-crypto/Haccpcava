import { signInWithPassword } from '../../lib/auth.js';

export function renderLogin(container, onSuccess) {
  container.innerHTML = `
    <div class="login-wrap">
      <p class="brand">TENUTA AGRICOLA LA CAVA</p>
      <h1>Registro HACCP</h1>
      <label class="field-label">Email</label>
      <input type="email" id="login-email" autocomplete="username" inputmode="email">
      <label class="field-label">Password</label>
      <input type="password" id="login-password" autocomplete="current-password">
      <button class="btn btn-primary btn-block" id="login-submit">Accedi</button>
      <p id="login-error" class="login-error"></p>
    </div>
  `;

  container.querySelector('#login-submit').addEventListener('click', async () => {
    const email = container.querySelector('#login-email').value.trim();
    const password = container.querySelector('#login-password').value;
    const errorEl = container.querySelector('#login-error');
    errorEl.textContent = '';
    try {
      await signInWithPassword(email, password);
      onSuccess();
    } catch (e) {
      errorEl.textContent = 'Accesso non riuscito. Controlla email e password.';
    }
  });
}
