// loginView.js
// Tela de login (email/senha) usando Firebase Authentication.

import { auth } from '../data/firebaseConfig.js';
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function renderLogin(container, onSuccess) {
  container.innerHTML = `
    <div class="card">
      <h2 style="margin-bottom: 16px;">Entrar no GIRO</h2>

      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="login-email" type="email">
      </div>

      <div class="form-group">
        <label class="form-label">Senha</label>
        <input class="form-input" id="login-password" type="password">
      </div>

      <div id="login-error" style="color: var(--color-danger); margin-bottom: 12px; font-size: 0.85rem;"></div>

      <button class="btn-primary" id="btn-login">Entrar</button>
    </div>
  `;

  document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (error) {
      errorEl.textContent = 'Email ou senha incorretos.';
    }
  });
}
