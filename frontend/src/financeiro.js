import './style.css';
import { apiFetch } from './api.js';

const filtroForm = document.getElementById('filtroForm');
const dataInicioInput = document.getElementById('dataInicio');
const dataFimInput = document.getElementById('dataFim');

const faturamentoBrutoEl = document.getElementById('faturamentoBruto');
const totalComissoesEl = document.getElementById('totalComissoes');
const lucroLiquidoEl = document.getElementById('lucroLiquido');
const listaComissoesEl = document.getElementById('listaComissoes');

// Definir datas do mês atual por padrão
const hoje = new Date();
const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

dataInicioInput.value = primeiroDia.toISOString().split('T')[0];
dataFimInput.value = hoje.toISOString().split('T')[0];

const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

// Carregar Dados
async function buscarRelatorio() {
  const inicio = dataInicioInput.value;
  const fim = dataFimInput.value;

  try {
    const res = await apiFetch(`/Financeiro/relatorio?dataInicio=${inicio}&dataFim=${fim}`);
    if (!res.ok) throw new Error();

    const data = await res.json();

    // Atualizar Cards
    faturamentoBrutoEl.textContent = formatarMoeda(data.faturamentoBruto);
    totalComissoesEl.textContent = formatarMoeda(data.totalComissoes);
    lucroLiquidoEl.textContent = formatarMoeda(data.lucroLiquido);

    // Listar Profissionais
    renderComissoes(data.comissoesPorProfissional);
  } catch (err) {
    listaComissoesEl.innerHTML = `
      <div class="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-xs font-medium">
        Erro ao carregar o relatório financeiro.
      </div>`;
  }
}

function renderComissoes(comissoes) {
  if (comissoes.length === 0) {
    listaComissoesEl.innerHTML = `
      <div class="p-4 bg-white rounded-xl shadow-sm border border-gray-200 text-center text-xs text-gray-500">
        Nenhum atendimento confirmado neste período.
      </div>`;
    return;
  }

  listaComissoesEl.innerHTML = comissoes.map(c => `
    <div class="p-4 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between gap-2">
      <div>
        <p class="text-sm font-bold text-gray-900">${c.nomeProfissional}</p>
        <p class="text-xs text-gray-500">${c.totalAgendamentos} atendimento(s) • ${c.recebeComissao ? `${c.porcentagemComissao}% comissão` : 'Sem comissão'}</p>
      </div>
      <div class="text-right">
        <p class="text-xs font-semibold text-gray-500">Gerado: ${formatarMoeda(c.faturamentoGerado)}</p>
        <p class="text-sm font-bold text-amber-600">Comissão: ${formatarMoeda(c.valorComissao)}</p>
      </div>
    </div>
  `).join('');
}

filtroForm.addEventListener('submit', (e) => {
  e.preventDefault();
  buscarRelatorio();
});
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
// Inicializar na abertura
buscarRelatorio();