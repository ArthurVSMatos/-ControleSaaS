import './style.css';
import { apiFetch } from './api.js';

let abaAtiva = 'Clientes'; // 'Clientes' | 'Servicos' | 'Profissionais'

// Elementos da DOM
const tabClientes = document.getElementById('tabClientes');
const tabServicos = document.getElementById('tabServicos');
const tabProfissionais = document.getElementById('tabProfissionais');
const lblBtnNovo = document.getElementById('lblBtnNovo');
const btnNovo = document.getElementById('btnNovo');
const containerLista = document.getElementById('containerLista');

// Elementos do Modal
const modalCadastro = document.getElementById('modalCadastro');
const modalTitulo = document.getElementById('modalTitulo');
const camposForm = document.getElementById('camposForm');
const cadastroForm = document.getElementById('cadastroForm');
const modalError = document.getElementById('modalError');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

// Alternar Abas
function setAba(aba) {
    abaAtiva = aba;
    [tabClientes, tabServicos, tabProfissionais].forEach(btn => {
        btn.className = 'flex-1 py-2 rounded-lg text-gray-500 hover:text-gray-900 transition-all font-medium';
    });

    if (aba === 'Clientes') {
        tabClientes.className = 'flex-1 py-2 rounded-lg bg-white text-emerald-700 shadow-sm font-bold';
        lblBtnNovo.textContent = 'Novo Cliente';
    } else if (aba === 'Servicos') {
        tabServicos.className = 'flex-1 py-2 rounded-lg bg-white text-emerald-700 shadow-sm font-bold';
        lblBtnNovo.textContent = 'Novo Serviço';
    } else {
        tabProfissionais.className = 'flex-1 py-2 rounded-lg bg-white text-emerald-700 shadow-sm font-bold';
        lblBtnNovo.textContent = 'Novo Profissional';
    }

    carregarDados();
}

tabClientes.addEventListener('click', () => setAba('Clientes'));
tabServicos.addEventListener('click', () => setAba('Servicos'));
tabProfissionais.addEventListener('click', () => setAba('Profissionais'));

// Carregar Dados
async function carregarDados() {
    containerLista.innerHTML = `<div class="p-4 bg-white rounded-xl shadow-sm border border-gray-200 text-center text-xs text-gray-400">A carregar dados...</div>`;

    try {
        const res = await apiFetch(`/${abaAtiva}`);
        if (!res.ok) throw new Error();
        const lista = await res.json();
        renderLista(lista);
    } catch (err) {
        containerLista.innerHTML = `<div class="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-xs font-medium">Erro ao carregar lista de ${abaAtiva}.</div>`;
    }
}

// Renderizar Lista
function renderLista(lista) {
    if (!Array.isArray(lista) || lista.length === 0) {
        containerLista.innerHTML = `<div class="p-6 bg-white rounded-xl shadow-sm border border-gray-200 text-center text-xs text-gray-400">Nenhum registo encontrado.</div>`;
        return;
    }

    containerLista.innerHTML = lista.map(item => {
        if (abaAtiva === 'Clientes') {
            const nome = item.nomeCompleto || item.NomeCompleto || item.nome || item.Nome || 'Cliente';
            const email = item.email || item.Email || '';
            const telefone = item.telefone || item.Telefone || '';

            return `
        <div class="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-2">
          <div>
            <p class="text-sm font-bold text-gray-900">${nome}</p>
            <p class="text-xs text-gray-500">${telefone ? telefone : 'Sem telefone'} • ${email ? email : 'Sem e-mail'}</p>
          </div>
          <button onclick="window.excluirItem('${item.id}')" class="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100 font-semibold transition-all">Excluir</button>
        </div>`;
        } else if (abaAtiva === 'Servicos') {
            const valor = item.valor ?? item.Valor ?? 0;
            const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

            return `
        <div class="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-2">
          <div>
            <p class="text-sm font-bold text-gray-900">${item.nome}</p>
            <p class="text-xs text-gray-500">${item.duracaoMinutos} min • <span class="text-emerald-700 font-bold">${valorFormatado}</span></p>
          </div>
          <button onclick="window.excluirItem('${item.id}')" class="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100 font-semibold transition-all">Excluir</button>
        </div>`;
        } else {
            const nome = item.nome || item.Nome || 'Profissional';
            const telefone = item.telefone || item.Telefone || '';
            const especialidade = item.especialidade || item.Especialidade || item.areaAtuacao || '';

            const comissao = item.porcentagemComissao
                ?? item.PorcentagemComissao
                ?? item.percentualComissao
                ?? item.PercentualComissao
                ?? item.comissao
                ?? item.Comissao
                ?? 0;

            return `
        <div class="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-2">
          <div>
            <p class="text-sm font-bold text-gray-900">${nome}</p>
            <p class="text-xs text-gray-500">
              ${especialidade ? especialidade : 'Geral'} • ${telefone ? telefone : 'Sem telefone'} • <span class="text-amber-600 font-bold">${comissao}% comissão</span>
            </p>
          </div>
          <button onclick="window.excluirItem('${item.id}')" class="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-100 font-semibold transition-all">Excluir</button>
        </div>`;
        }
    }).join('');
}

// Excluir Registo
window.excluirItem = async (id) => {
    if (!confirm('Deseja realmente remover este registo?')) return;

    try {
        const res = await apiFetch(`/${abaAtiva}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await carregarDados();
        } else {
            alert('Não foi possível excluir o registo.');
        }
    } catch (err) {
        alert('Erro de comunicação com o servidor.');
    }
};

// Abrir Modal de Cadastro
btnNovo.addEventListener('click', () => {
    modalError.classList.add('hidden');
    modalTitulo.textContent = `Cadastrar em ${abaAtiva}`;

    if (abaAtiva === 'Clientes') {
        camposForm.innerHTML = `
      <div><label class="block text-xs font-semibold text-gray-600 mb-1">Nome Completo</label><input type="text" id="cliNome" required class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
      <div><label class="block text-xs font-semibold text-gray-600 mb-1">Telefone (apenas números)</label><input type="tel" id="cliTelefone" placeholder="(11) 99999-9999" class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
      <div><label class="block text-xs font-semibold text-gray-600 mb-1">E-mail</label><input type="email" id="cliEmail" class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
    `;

        const telInput = document.getElementById('cliTelefone');
        telInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^\d\s()+-]/g, '');
        });

    } else if (abaAtiva === 'Servicos') {
        camposForm.innerHTML = `
      <div><label class="block text-xs font-semibold text-gray-600 mb-1">Nome do Serviço</label><input type="text" id="srvNome" required class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
      <div><label class="block text-xs font-semibold text-gray-600 mb-1">Valor (R$)</label><input type="text" inputmode="decimal" id="srvValor" required placeholder="0,00" class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
      <div><label class="block text-xs font-semibold text-gray-600 mb-1">Duração (Minutos)</label><input type="number" id="srvDuracao" required value="30" class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
    `;
    } else {
        camposForm.innerHTML = `
      <div><label class="block text-xs font-semibold text-gray-600 mb-1">Nome do Profissional</label><input type="text" id="profNome" required class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
      <div><label class="block text-xs font-semibold text-gray-600 mb-1">Telefone (apenas números)</label><input type="tel" id="profTelefone" required placeholder="(11) 99999-9999" class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
      <div><label class="block text-xs font-semibold text-gray-600 mb-1">Especialidade</label><input type="text" id="profEspecialidade" placeholder="Ex: Tosador, Cabeleireiro..." class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
      <div><label class="block text-xs font-semibold text-gray-600 mb-1">Comissão (%)</label><input type="number" id="profComissao" required value="10" min="0" max="100" class="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
    `;

        const telInput = document.getElementById('profTelefone');
        telInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^\d\s()+-]/g, '');
        });
    }

    modalCadastro.classList.remove('hidden');
    modalCadastro.classList.add('flex');
});

// Fechar Modal
const fecharModal = () => {
    modalCadastro.classList.add('hidden');
    modalCadastro.classList.remove('flex');
};
closeModalBtn.addEventListener('click', fecharModal);
cancelModalBtn.addEventListener('click', fecharModal);

// Salvar Registo
cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalError.classList.add('hidden');

    let payload = {};
    if (abaAtiva === 'Clientes') {
        payload = {
            nomeCompleto: document.getElementById('cliNome').value.trim(),
            telefone: document.getElementById('cliTelefone').value.trim(),
            email: document.getElementById('cliEmail').value.trim()
        };
    } else if (abaAtiva === 'Servicos') {
        const valorRaw = document.getElementById('srvValor').value.replace(',', '.').trim();
        const duracaoRaw = document.getElementById('srvDuracao').value;

        payload = {
            nome: document.getElementById('srvNome').value.trim(),
            valor: isNaN(parseFloat(valorRaw)) ? 0 : parseFloat(valorRaw),
            duracaoMinutos: isNaN(parseInt(duracaoRaw, 10)) ? 30 : parseInt(duracaoRaw, 10)
        };
    } else {
        const comissaoRaw = document.getElementById('profComissao').value;
        const comissaoInt = isNaN(parseInt(comissaoRaw, 10)) ? 0 : parseInt(comissaoRaw, 10);

        payload = {
            nome: document.getElementById('profNome').value.trim(),
            telefone: document.getElementById('profTelefone').value.trim(),
            especialidade: document.getElementById('profEspecialidade').value.trim(),
            porcentagemComissao: comissaoInt,
            percentualComissao: comissaoInt,
            comissao: comissaoInt
        };
    }

    try {
        const res = await apiFetch(`/${abaAtiva}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            fecharModal();
            cadastroForm.reset();
            await carregarDados();
        } else {
            const data = await res.json();
            let mensagemErro = 'Erro ao guardar dados.';

            if (data.errors) {
                mensagemErro = Object.entries(data.errors)
                    .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
                    .join(' | ');
            } else if (data.message) {
                mensagemErro = data.message;
            } else if (data.title) {
                mensagemErro = data.title;
            }

            modalError.textContent = mensagemErro;
            modalError.classList.remove('hidden');
        }
    } catch (err) {
        modalError.textContent = 'Erro de comunicação com a API.';
        modalError.classList.remove('hidden');
    }
});

// Init
carregarDados();