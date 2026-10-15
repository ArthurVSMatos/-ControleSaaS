import './style.css';
import { apiFetch } from './api.js';

// Estado do Calendário
let dataAtual = new Date();
let dataSelecionada = new Date();
let agendamentosMes = [];

// Elementos DOM
const mesAnoHeader = document.getElementById('mesAnoHeader');
const mesAnoTitulo = document.getElementById('mesAnoTitulo');
const gridCalendario = document.getElementById('gridCalendario');
const btnMesAnterior = document.getElementById('btnMesAnterior');
const btnProximoMes = document.getElementById('btnProximoMes');
const dataSelecionadaTexto = document.getElementById('dataSelecionadaTexto');
const listaAgendamentosDia = document.getElementById('listaAgendamentosDia');
const logoutBtn = document.getElementById('logoutBtn');

// Modal Novo Agendamento
const openNovoModalBtn = document.getElementById('openNovoModalBtn');
const modalNovoAgendamento = document.getElementById('modalNovoAgendamento');
const closeNovoModalBtn = document.getElementById('closeNovoModalBtn');
const cancelNovoModalBtn = document.getElementById('cancelNovoModalBtn');
const novoAgendamentoForm = document.getElementById('novoAgendamentoForm');
const novoModalError = document.getElementById('novoModalError');
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
const editDataHoraInput = document.getElementById('editDataHoraInput');
const editProfissionalSelect = document.getElementById('editProfissionalSelect');
const editModalError = document.getElementById('editModalError');

// ==========================================
// Funções Auxiliares de Data e Fuso Horário
// ==========================================
function formatarParaInputDateTime(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
}

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/index.html';
});

// Navegação de Mês
btnMesAnterior.addEventListener('click', () => {
    dataAtual.setMonth(dataAtual.getMonth() - 1);
    renderizarCalendario();
});

btnProximoMes.addEventListener('click', () => {
    dataAtual.setMonth(dataAtual.getMonth() + 1);
    renderizarCalendario();
});

// Renderização do Calendário
async function renderizarCalendario() {
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();

    const mesAnoFormatado = new Date(ano, mes).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    mesAnoTitulo.textContent = mesAnoFormatado;
    mesAnoHeader.textContent = mesAnoFormatado;

    await carregarAgendamentosMes(ano, mes + 1);

    gridCalendario.innerHTML = '';

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    const hoje = new Date();

    for (let i = 0; i < primeiroDiaSemana; i++) {
        gridCalendario.innerHTML += `<div class="h-9"></div>`;
    }

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const dataDia = new Date(ano, mes, dia);
        const dataIsoStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        const isHoje = hoje.toDateString() === dataDia.toDateString();
        const isSelecionado = dataSelecionada.toDateString() === dataDia.toDateString();

        const temAgendamento = agendamentosMes.some(a => {
            const dataAg = (a.dataHoraInicio || a.dataHora || '').split('T')[0];
            return dataAg === dataIsoStr;
        });

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `h-9 w-full flex flex-col items-center justify-center rounded-xl text-xs font-semibold relative transition-all active:scale-95 ${isSelecionado
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100 font-bold'
            : isHoje
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'hover:bg-gray-100 text-gray-700'
            }`;

        btn.innerHTML = `
            <span>${dia}</span>
            ${temAgendamento ? `<span class="w-1.5 h-1.5 rounded-full ${isSelecionado ? 'bg-white' : 'bg-emerald-500'} mt-0.5"></span>` : ''}
        `;

        btn.addEventListener('click', () => {
            dataSelecionada = dataDia;
            renderizarCalendario();
            carregarAgendamentosDoDia(dataDia);
        });

        gridCalendario.appendChild(btn);
    }
}

// API: Agendamentos do Mês
async function carregarAgendamentosMes(ano, mes) {
    try {
        const res = await apiFetch(`/Agendamentos/calendario?ano=${ano}&mes=${mes}`);
        if (res.ok) {
            agendamentosMes = await res.json();
        } else {
            agendamentosMes = [];
        }
    } catch (err) {
        agendamentosMes = [];
    }
}

// API: Agendamentos do Dia
async function carregarAgendamentosDoDia(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const dataIso = `${ano}-${mes}-${dia}`;

    dataSelecionadaTexto.textContent = data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    try {
        const res = await apiFetch(`/Agendamentos/dia?data=${dataIso}`);
        if (!res.ok) throw new Error();

        const agendamentos = await res.json();
        renderizarListaDia(agendamentos);
    } catch (err) {
        listaAgendamentosDia.innerHTML = `
            <div class="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-xs font-medium">
                Erro ao carregar agendamentos deste dia.
            </div>`;
    }
}

// Renderizar Lista do Dia
function renderizarListaDia(agendamentos) {
    if (!agendamentos || agendamentos.length === 0) {
        listaAgendamentosDia.innerHTML = `
            <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-200 text-center">
                <p class="text-xs font-semibold text-gray-600">Nenhum agendamento para esta data.</p>
            </div>`;
        return;
    }

    listaAgendamentosDia.innerHTML = agendamentos.map(a => {
        const dataStr = a.dataHoraInicio || a.dataHora;
        const hora = dataStr
            ? new Date(dataStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : '--:--';

        const clienteNome = a.nomeCliente || a.clienteNome || 'Cliente';
        const servicoNome = a.nomeServico || a.servicoNome || 'Serviço';
        const profissionalNome = a.nomeProfissional || a.profissionalNome || 'Profissional';
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

                <div class="flex items-center gap-1.5 shrink-0">
                    <button onclick="window.abrirModalEditar('${a.id}', '${dataStr}', '${a.profissionalId}')" class="h-8 px-2.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold rounded-lg transition-all">
                        Alterar
                    </button>
                    <button onclick="window.excluirAgendamento('${a.id}')" class="h-8 px-2.5 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 text-xs font-bold rounded-lg border border-red-100 transition-all">
                        Excluir
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// Modal NOVO AGENDAMENTO
// ==========================================
async function carregarSelectsNovo() {
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
        console.error('Erro ao carregar opções:', err);
    }
}

openNovoModalBtn.addEventListener('click', async () => {
    novoModalError.classList.add('hidden');

    // Define o horário inicial com a data selecionada e hora local
    const dataHoraPreenchida = new Date(dataSelecionada);
    const agora = new Date();

    if (dataSelecionada.toDateString() === agora.toDateString()) {
        dataHoraPreenchida.setHours(agora.getHours(), agora.getMinutes());
    } else {
        dataHoraPreenchida.setHours(9, 0);
    }

    dataHoraInput.value = formatarParaInputDateTime(dataHoraPreenchida);

    modalNovoAgendamento.classList.remove('hidden');
    modalNovoAgendamento.classList.add('flex');

    await carregarSelectsNovo();
});

const fecharNovoModal = () => {
    modalNovoAgendamento.classList.add('hidden');
    modalNovoAgendamento.classList.remove('flex');
};

closeNovoModalBtn.addEventListener('click', fecharNovoModal);
cancelNovoModalBtn.addEventListener('click', fecharNovoModal);

novoAgendamentoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    novoModalError.classList.add('hidden');

    // Converte a data selecionada local para ISO UTC
    const dataIsoUtc = new Date(dataHoraInput.value).toISOString();

    const payload = {
        clienteId: clienteSelect.value,
        profissionalId: profissionalSelect.value,
        servicoId: servicoSelect.value,
        dataHora: dataIsoUtc
    };

    try {
        const res = await apiFetch('/Agendamentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Erro ao criar agendamento');
        }

        fecharNovoModal();
        novoAgendamentoForm.reset();

        await carregarAgendamentosDoDia(dataSelecionada);
        await renderizarCalendario();
    } catch (err) {
        novoModalError.textContent = err.message || 'Falha ao salvar agendamento.';
        novoModalError.classList.remove('hidden');
    }
});

// ==========================================
// Modal EDITAR AGENDAMENTO
// ==========================================
window.abrirModalEditar = async (id, dataAtual, profissionalId) => {
    editAgendamentoId.value = id;
    editModalError.classList.add('hidden');

    if (dataAtual) {
        const d = new Date(dataAtual);
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

closeEditarModalBtn.addEventListener('click', fecharModalEditar);
cancelEditarModalBtn.addEventListener('click', fecharModalEditar);

editarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    editModalError.classList.add('hidden');

    const id = editAgendamentoId.value;
    const payload = {
        dataHora: new Date(editDataHoraInput.value).toISOString(),
        profissionalId: editProfissionalSelect.value
    };

    try {
        const res = await apiFetch(`/Agendamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error();

        fecharModalEditar();
        await carregarAgendamentosDoDia(dataSelecionada);
        await renderizarCalendario();
    } catch (err) {
        editModalError.textContent = 'Erro ao atualizar agendamento.';
        editModalError.classList.remove('hidden');
    }
});

// Excluir Agendamento
window.excluirAgendamento = async (id) => {
    if (!confirm('Deseja realmente excluir este agendamento?')) return;

    try {
        const res = await apiFetch(`/Agendamentos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();

        await carregarAgendamentosDoDia(dataSelecionada);
        await renderizarCalendario();
    } catch (err) {
        alert('Não foi possível excluir o agendamento.');
    }
};

function atualizarNavAtiva() {
    const pathAtual = window.location.pathname;

    document.querySelectorAll('nav a').forEach(link => {
        const href = link.getAttribute('href');
        const span = link.querySelector('span');

        if (pathAtual.includes(href)) {
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

// Executa ao carregar a página
document.addEventListener('DOMContentLoaded', atualizarNavAtiva);
// Inicialização
renderizarCalendario();
carregarAgendamentosDoDia(dataSelecionada);