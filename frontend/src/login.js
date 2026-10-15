import './style.css';
import { apiFetch } from './api.js';

const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.classList.add('hidden');

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
        const response = await apiFetch('/Auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha }), // <-- Enviar email e senha
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.accessToken);
            window.location.href = '/dashboard.html';
        } else {
            errorMessage.textContent = 'Credenciais inválidas. Tente novamente.';
            errorMessage.classList.remove('hidden');
        }
    } catch (error) {
        errorMessage.textContent = 'Erro de conexão com a API.';
        errorMessage.classList.remove('hidden');
    }
});