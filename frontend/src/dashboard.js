import './style.css';
import { apiFetch } from './api.js';
import {
  showToast,
  setButtonLoading,
  renderSkeletonCards,
  renderEmptyState,
  initBackdropClose
} from './ui-utils.js';

// Estado
let agendamentosHojeList = [];
let agendamentoParaConfirmarId = null;

// Elementos DOM
const dataAtualEl = document.getElementById('dataAtual');
const logoutBtn = document.getElementById('logoutBtn');
const listaAgendamentosEl = document.getElementById('listaAgendamentos');

// Modal Novo Agendamento
const modalAgendamento = document.getElementById('modalAgendamento');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const agendamentoForm = document.getElementById('agendamentoForm');
const modalError = document.getElementById('modalError');

const clienteSelect = document.getElementById('clienteSelect');
const servicoSelect = document.getElementById('servicoSelect');
const profissionalSelect = document.getElementById('profissionalSelect');
const dataHoraInput = document.getElementById('dataHoraInput');

// Modal Editar Agendamento
const modalEditar = document.getElementById('modalEditar');
const closeEditarModalBtn = document.getElementById('closeEditarModalBtn');
const cancelEditarModalBtn = document.getElementById('cancelEditarModalBtn');
const editarForm = document.getElementById('editarForm');
const editAgendamentoId = document.getElementById('editAgendamentoId');
const editClienteId = document.getElementById('editClienteId');
const editServicoId = document.getElementById('editServicoId');
const editDataHoraInput = document.getElementById('editDataHoraInput');
const editProfissionalSelect = document.getElementById('editProfissionalSelect');
const editModalError = document.getElementById('editModalError');

// Helper Data local
function formatarParaInputDateTime(date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
}

// Data no topo
if (dataAtualEl) {
  dataAtualEl.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
  });
}

// Carregar Selects
async function carregarSelectsModal() {
  try {
    const [resC, resS, resP] = await Promise.all([
      apiFetch('/Clientes'),
      apiFetch('/Servicos'),
      apiFetch('/Profissionais')
    ]);

    if (resC.ok) {
      const clientes = await resC.json();
      clienteSelect.innerHTML = '<option value="">Selecione um cliente</option>' +
        clientes.map(c => `<option value="${c.id}">${c.nomeCompleto || c.nome}</option>`).join('');
    }
    if (resS.ok) {
      const servicos = await resS.json();
      servicoSelect.innerHTML = '<option value="">Selecione um serviço</option>' +
        servicos.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    }
    if (resP.ok) {
      const profs = await resP.json();
      profissionalSelect.innerHTML = '<option value="">Selecione um profissional</option>' +
        profs.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    }
  } catch (err) {
    console.error('Erro ao carregar selects:', err);
  }
}

// Abrir Modal
if (openModalBtn) {
  openModalBtn.addEventListener('click', async () => {
    modalError.classList.add('hidden');
    const agora = new Date();
    dataHoraInput.min = formatarParaInputDateTime(agora);
    dataHoraInput.value = formatarParaInputDateTime(agora);

    modalAgendamento.classList.remove('hidden');
    modalAgendamento.classList.add('flex');

    await carregarSelectsModal();
  });
}

const fecharModal = () => {
  modalAgendamento.classList.add('hidden');
  modalAgendamento.classList.remove('flex');
};

if (closeModalBtn) closeModalBtn.addEventListener('click', fecharModal);
if (cancelModalBtn) cancelModalBtn.addEventListener('click', fecharModal);

// Salvar Novo Agendamento
if (agendamentoForm) {
  agendamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalError.classList.add('hidden');

    const dataEscolhida = new Date(dataHoraInput.value);
    const agora = new Date();

    if (dataEscolhida < agora) {
      modalError.textContent = 'Não é possível realizar agendamentos em datas ou horários passados.';
      modalError.classList.remove('hidden');
      return;
    }

    const submitBtn = agendamentoForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Salvando...');

    const payload = {
      clienteId: clienteSelect.value,
      profissionalId: profissionalSelect.value,
      servicoId: servicoSelect.value,
      dataHora: dataEscolhida.toISOString()
    };

    try {
      const res = await apiFetch('/Agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.title || 'Erro ao criar agendamento');
      }

      fecharModal();
      agendamentoForm.reset();

      showToast('Agendamento criado com sucesso!', 'sucesso');
      await carregarAgendamentosHoje();
    } catch (err) {
      modalError.textContent = err.message || 'Falha ao salvar agendamento.';
      modalError.classList.remove('hidden');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ==========================================
// Editar Agendamento
// ==========================================
window.abrirModalEditar = async (id, dataAtual, profissionalId, clienteId, servicoId) => {
  editAgendamentoId.value = id;
  if (editClienteId) editClienteId.value = clienteId || '';
  if (editServicoId) editServicoId.value = servicoId || '';

  editModalError.classList.add('hidden');

  if (dataAtual) {
    const d = new Date(dataAtual);
    editDataHoraInput.min = formatarParaInputDateTime(new Date());
    editDataHoraInput.value = formatarParaInputDateTime(d);
  }

  try {
    const res = await apiFetch('/Profissionais');
    if (res.ok) {
      const profissionais = await res.json();
      editProfissionalSelect.innerHTML = profissionais.map(p =>
        `<option value="${p.id}" ${p.id === profissionalId ? 'selected' : ''}>${p.nome}</option>`
      ).join('');
    }
  } catch (_) { }

  modalEditar.classList.remove('hidden');
  modalEditar.classList.add('flex');
};

const fecharModalEditar = () => {
  modalEditar.classList.add('hidden');
  modalEditar.classList.remove('flex');
};

if (closeEditarModalBtn) closeEditarModalBtn.addEventListener('click', fecharModalEditar);
if (cancelEditarModalBtn) cancelEditarModalBtn.addEventListener('click', fecharModalEditar);

if (editarForm) {
  editarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    editModalError.classList.add('hidden');

    const submitBtn = editarForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Salvando...');

    const id = editAgendamentoId.value;
    const dataEscolhida = new Date(editDataHoraInput.value);

    // Constrói payload preservando os campos da API
    const payload = {
      id: id,
      profissionalId: editProfissionalSelect.value,
      dataHora: dataEscolhida.toISOString()
    };

    if (editClienteId && editClienteId.value) {
      payload.clienteId = editClienteId.value;
    }
    if (editServicoId && editServicoId.value) {
      payload.servicoId = editServicoId.value;
    }

    try {
      const res = await apiFetch(`/Agendamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const mensagemErro = errData.message || errData.title || (typeof errData === 'string' ? errData : 'Erro ao atualizar agendamento.');
        throw new Error(mensagemErro);
      }

      fecharModalEditar();
      showToast('Agendamento alterado com sucesso!', 'sucesso');
      await carregarAgendamentosHoje();
    } catch (err) {
      editModalError.textContent = err.message || 'Erro ao atualizar agendamento.';
      editModalError.classList.remove('hidden');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ==========================================
// Modal Popup de Confirmação com Detalhes
// ==========================================
function injetarModalConfirmacao() {
  if (document.getElementById('modalConfirmacao')) return;

  const modalHtml = `
    <div id="modalConfirmacao" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 items-center justify-center p-4">
      <div class="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in duration-150">
        <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h3 class="text-base font-bold text-gray-900 mb-1">Confirmar Atendimento?</h3>
        <p class="text-xs text-gray-500 mb-3">Confira os detalhes do pedido abaixo:</p>

        <div id="detalhesConfirmacao" class="bg-gray-50 p-3 rounded-xl mb-4 space-y-1.5 text-xs text-left border border-gray-100">
        </div>

        <div class="flex gap-2">
          <button id="btnCancelarConfirmacao" type="button" class="flex-1 h-10 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold rounded-xl transition-all">
            Voltar
          </button>
          <button id="btnAprovarConfirmacao" type="button" class="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-100">
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

window.confirmarAgendamento = (id) => {
  injetarModalConfirmacao();

  const agendamento = agendamentosHojeList.find(a => a.id === id);
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
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) throw new Error();

    fecharModalConfirmacao();
    showToast('Atendimento confirmado e registrado no financeiro!', 'sucesso');
    await carregarAgendamentosHoje();
  } catch (err) {
    showToast('Não foi possível confirmar o agendamento.', 'erro');
  }
}

// Carregar Agendamentos de Hoje
async function carregarAgendamentosHoje() {
  renderSkeletonCards(listaAgendamentosEl, 3);

  try {
    const res = await apiFetch('/Agendamentos/hoje');
    if (!res.ok) throw new Error();

    agendamentosHojeList = await res.json();
    renderAgendamentos(agendamentosHojeList);
  } catch (err) {
    listaAgendamentosEl.innerHTML = `
            <div class="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-xs font-medium">
                Erro ao carregar agendamentos do dia.
            </div>`;
  }
}

function renderAgendamentos(agendamentos) {
  if (!agendamentos || agendamentos.length === 0) {
    renderEmptyState(
      listaAgendamentosEl,
      'Sem agendamentos para hoje',
      'Aproveite a folga ou toque no botão acima para incluir um novo horário.'
    );
    return;
  }

  listaAgendamentosEl.innerHTML = agendamentos.map(a => {
    const dataStr = a.dataHoraInicio || a.dataHora;
    const hora = dataStr
      ? new Date(dataStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '--:--';

    const clienteNome = a.nomeCliente || a.clienteNome || 'Cliente';
    const servicoNome = a.nomeServico || a.servicoNome || 'Serviço';
    const profissionalNome = a.nomeProfissional || a.profissionalNome || 'Profissional';

    const clienteId = a.clienteId || a.idCliente || '';
    const servicoId = a.servicoId || a.idServico || '';
    const profissionalId = a.profissionalId || a.idProfissional || '';

    const isConfirmado = a.status === 'Confirmado';

    return `
            <div class="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-3 transition-all hover:border-gray-300">
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

                <div class="flex items-center gap-1.5 shrink-0">
                    <button onclick="window.abrirModalEditar('${a.id}', '${dataStr}', '${profissionalId}', '${clienteId}', '${servicoId}')" class="h-8 px-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold rounded-lg transition-all">
                        Alterar
                    </button>
                    ${!isConfirmado ? `
                        <button onclick="window.confirmarAgendamento('${a.id}')" class="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition-all">
                            Confirmar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
  }).join('');
}

function atualizarNavAtiva() {
  const pathAtual = window.location.pathname;

  document.querySelectorAll('nav a').forEach(link => {
    const href = link.getAttribute('href');
    const span = link.querySelector('span');

    const isDashboard = (pathAtual === '/' || pathAtual.includes('dashboard.html')) && (href.includes('dashboard.html') || href === '/');
    const isOutraPagina = !isDashboard && href !== '/' && !href.includes('dashboard.html') && pathAtual.includes(href);

    if (isDashboard || isOutraPagina) {
      link.classList.remove('text-gray-400');
      link.classList.add('text-emerald-600');
      if (span) {
        span.classList.remove('font-medium');
        span.classList.add('font-bold');
      }
    } else {
      link.classList.remove('text-emerald-600');
      link.classList.add('text-gray-400');
      if (span) {
        span.classList.remove('font-bold');
        span.classList.add('font-medium');
      }
    }
  });
}

// Inicialização
initBackdropClose();
atualizarNavAtiva();
carregarAgendamentosHoje();