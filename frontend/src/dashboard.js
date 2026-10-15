import './style.css';
import { apiFetch } from './api.js';

// Variáveis Globais de Estado
let agendamentosList = [];
let agendamentoParaConfirmarId = null;

// Elementos da DOM
const dataAtualEl = document.getElementById('dataAtual');
const logoutBtn = document.getElementById('logoutBtn');
const listaAgendamentosEl = document.getElementById('listaAgendamentos');

// Elementos do Modal de Criar Agendamento
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

// ==========================================
// Modal de Confirmação (Criado via JS)
// ==========================================
function injetarModalConfirmacao() {
  if (document.getElementById('modalConfirmacao')) return;

  const modalHtml = `
    <div id="modalConfirmacao" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl border border-gray-100 text-center animate-in fade-in zoom-in duration-150">
        <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h3 class="text-base font-bold text-gray-900 mb-1">Confirmar Agendamento?</h3>
        <p class="text-xs text-gray-500 mb-4">Confira os detalhes do pedido abaixo:</p>

        <div id="detalhesConfirmacao" class="bg-gray-50 p-3 rounded-xl mb-5 space-y-1.5 text-xs text-left border border-gray-100">
          <!-- Preenchido via JS -->
        </div>

        <div class="flex gap-2">
          <button id="btnCancelarConfirmacao" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold rounded-xl transition-all">
            Voltar
          </button>
          <button id="btnAprovarConfirmacao" class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-100">
            Confirmar
          </button>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('btnCancelarConfirmacao').addEventListener('click', fecharModalConfirmacao);
  document.getElementById('btnAprovarConfirmacao').addEventListener('click', executarConfirmacao);
}

function fecharModalConfirmacao() {
  const modal = document.getElementById('modalConfirmacao');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  agendamentoParaConfirmarId = null;
}

// Global para ser chamada no clique do botão "Confirmar"
window.confirmarAgendamento = (id) => {
  injetarModalConfirmacao();

  const agendamento = agendamentosList.find(a => a.id === id);
  if (!agendamento) return;

  agendamentoParaConfirmarId = id;

  const dataStr = agendamento.dataHoraInicio || agendamento.dataHora;
  const hora = dataStr ? new Date(dataStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const cliente = agendamento.nomeCliente || agendamento.clienteNome || 'Cliente';
  const servico = agendamento.nomeServico || agendamento.servicoNome || 'Serviço';
  const profissional = agendamento.nomeProfissional || agendamento.profissionalNome || 'Profissional';

  const detalhesEl = document.getElementById('detalhesConfirmacao');
  detalhesEl.innerHTML = `
        <div class="flex justify-between"><span class="text-gray-400">Cliente:</span> <span class="font-bold text-gray-900">${cliente}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Horário:</span> <span class="font-bold text-gray-900">${hora}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Serviço:</span> <span class="font-semibold text-gray-800">${servico}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Profissional:</span> <span class="font-semibold text-gray-800">${profissional}</span></div>
    `;

  const modal = document.getElementById('modalConfirmacao');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
};

async function executarConfirmacao() {
  if (!agendamentoParaConfirmarId) return;

  try {
    const res = await apiFetch(`/Agendamentos/${agendamentoParaConfirmarId}/confirmar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Erro ${res.status} da API:`, errText);
      throw new Error(`Erro ${res.status}`);
    }

    fecharModalConfirmacao();
    await carregarAgendamentosHoje(); // Recarrega a lista com status atualizado
  } catch (err) {
    console.error('Falha na requisição de confirmação:', err);
    alert('Não foi possível confirmar o agendamento. Veja os detalhes no Console (F12).');
  }
}
// ==========================================
// Funções de Carregamento e Modal Novo Agendamento
// ==========================================
async function carregarClientes() {
  try {
    const res = await apiFetch('/Clientes');
    if (!res.ok) return;
    const clientes = await res.json();
    clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>' +
      clientes.map(c => `<option value="${c.id}">${c.nomeCompleto || c.nome}</option>`).join('');
  } catch (err) { console.error(err); }
}

async function carregarProfissionais() {
  try {
    const res = await apiFetch('/Profissionais');
    if (!res.ok) return;
    const profissionais = await res.json();
    profissionalSelect.innerHTML = '<option value="">Selecione um profissional</option>' +
      profissionais.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
  } catch (err) { console.error(err); }
}

async function carregarServicos() {
  try {
    const res = await apiFetch('/Servicos');
    if (!res.ok) return;
    const servicos = await res.json();
    servicoSelect.innerHTML = '<option value="">Selecione um serviço</option>' +
      servicos.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
  } catch (err) { console.error(err); }
}

const abrirModal = async () => {
  modalError.classList.add('hidden');
  modalAgendamento.classList.remove('hidden');
  modalAgendamento.classList.add('flex');

  await Promise.all([
    carregarClientes(),
    carregarProfissionais(),
    carregarServicos()
  ]);
};

const fecharModal = () => {
  modalAgendamento.classList.add('hidden');
  modalAgendamento.classList.remove('flex');
};

openModalBtn.addEventListener('click', abrirModal);
closeModalBtn.addEventListener('click', fecharModal);
cancelModalBtn.addEventListener('click', fecharModal);

// ==========================================
// Carregar Agendamentos do Dia
// ==========================================
async function carregarAgendamentosHoje() {
  try {
    const res = await apiFetch('/Agendamentos/hoje');
    if (!res.ok) throw new Error();

    agendamentosList = await res.json();
    renderAgendamentos(agendamentosList);
  } catch (err) {
    listaAgendamentosEl.innerHTML = `
      <div class="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-xs font-medium">
        Erro ao carregar agendamentos do dia.
      </div>`;
  }
}

// Renderizar Lista na Tela
function renderAgendamentos(agendamentos) {
  if (!agendamentos || agendamentos.length === 0) {
    listaAgendamentosEl.innerHTML = `
      <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
        <p class="text-sm font-semibold text-gray-700">Nenhum agendamento para hoje.</p>
        <p class="text-xs text-gray-400 mt-1">Toque no botão acima para adicionar um novo horário.</p>
      </div>`;
    return;
  }

  listaAgendamentosEl.innerHTML = agendamentos.map(a => {
    const dataStr = a.dataHoraInicio || a.dataHora;
    const hora = dataStr
      ? new Date(dataStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '--:--';

    const clienteNome = a.nomeCliente || a.clienteNome || 'Cliente não informado';
    const servicoNome = a.nomeServico || a.servicoNome || 'Serviço não informado';
    const profissionalNome = a.nomeProfissional || a.profissionalNome || 'Profissional não informado';

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
          <p class="text-sm font-semibold text-gray-800">${clienteNome}</p>
          <p class="text-xs text-gray-500">${servicoNome} • <span class="text-gray-700">${profissionalNome}</span></p>
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

// Inicialização
carregarAgendamentosHoje();