
import './style.css'; // <-- Adicione esta linha no topo
import { apiFetch } from './api.js';

// Elementos da DOM ...


// Elementos da DOM
const dataAtualEl = document.getElementById('dataAtual');
const logoutBtn = document.getElementById('logoutBtn');
const listaAgendamentosEl = document.getElementById('listaAgendamentos');

// Elementos do Modal
const modalAgendamento = document.getElementById('modalAgendamento');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const agendamentoForm = document.getElementById('agendamentoForm');
const modalError = document.getElementById('modalError');

// Campos do Formulário
const clienteSelect = document.getElementById('clienteSelect');
const servicoSelect = document.getElementById('servicoSelect');
const profissionalSelect = document.getElementById('profissionalSelect');
const dataHoraInput = document.getElementById('dataHoraInput');

// Formatador de Data no Topo
dataAtualEl.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
});

// Ação de Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
});

// Funções de Controle do Modal
const abrirModal = () => {
    modalError.classList.add('hidden');
    modalAgendamento.classList.remove('hidden');
    modalAgendamento.classList.add('flex');
};

const fecharModal = () => {
    modalAgendamento.classList.add('hidden');
    modalAgendamento.classList.remove('flex');
};

openModalBtn.addEventListener('click', abrirModal);
closeModalBtn.addEventListener('click', fecharModal);
cancelModalBtn.addEventListener('click', fecharModal);

// Carregar Agendamentos do Dia
async function carregarAgendamentosHoje() {
    try {
        const res = await apiFetch('/Agendamentos/hoje');
        if (!res.ok) throw new Error();

        const agendamentos = await res.json();
        renderAgendamentos(agendamentos);
    } catch (err) {
        listaAgendamentosEl.innerHTML = `
      <div class="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-xs font-medium">
        Erro ao carregar agendamentos do dia.
      </div>`;
    }
}

// Renderizar Lista na Tela
function renderAgendamentos(agendamentos) {
    if (agendamentos.length === 0) {
        listaAgendamentosEl.innerHTML = `
      <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
        <p class="text-sm font-semibold text-gray-700">Nenhum agendamento para hoje.</p>
        <p class="text-xs text-gray-400 mt-1">Toque no botão acima para adicionar um novo horário.</p>
      </div>`;
        return;
    }

    listaAgendamentosEl.innerHTML = agendamentos.map(a => {
        const hora = new Date(a.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const isConfirmado = a.status === 'Confirmado';

        return `
      <div class="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${isConfirmado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${a.status}
            </span>
            <span class="text-sm font-bold text-gray-900">${hora}</span>
          </div>
          <p class="text-sm font-semibold text-gray-800">${a.clienteNome}</p>
          <p class="text-xs text-gray-500">${a.servicoNome} • <span class="text-gray-700">${a.profissionalNome}</span></p>
        </div>

        ${!isConfirmado ? `
          <button onclick="window.confirmarAgendamento('${a.id}')" class="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition-all shrink-0">
            Confirmar
          </button>
        ` : ''}
      </div>
    `;
    }).join('');
}