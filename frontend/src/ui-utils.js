// =================================================================
// 1. SISTEMA DE TOASTS (Notificações Flutuantes)
// =================================================================
export function showToast(mensagem, tipo = 'sucesso') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-xs px-4 pointer-events-none';
        document.body.appendChild(container);
    }

    const isSucesso = tipo === 'sucesso';
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-lg border text-xs font-semibold transform transition-all duration-300 translate-y-[-10px] opacity-0 ${
        isSucesso 
            ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-900/20' 
            : 'bg-red-900 text-white border-red-700 shadow-red-900/20'
    }`;

    toast.innerHTML = `
        <div class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isSucesso ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}">
            ${isSucesso 
                ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`
                : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>`
            }
        </div>
        <span class="flex-1">${mensagem}</span>
    `;

    container.appendChild(toast);

    // Animação de Entrada
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-[-10px]', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Remover após 3.5 segundos
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-[-10px]', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// =================================================================
// 2. MODAL DE CONFIRMAÇÃO CUSTOMIZADO (Substitui confirm())
// =================================================================
export function showConfirmModal({ titulo, mensagem, textoConfirmar = 'Confirmar', corBotao = 'red' }) {
    return new Promise((resolve) => {
        let modal = document.getElementById('modal-confirm-custom');
        if (!modal) {
            const modalHtml = `
            <div id="modal-confirm-custom" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
                <div class="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-gray-100 text-center space-y-3">
                    <div id="confirm-icon-wrapper" class="w-12 h-12 rounded-full flex items-center justify-center mx-auto"></div>
                    <h3 id="confirm-titulo" class="text-base font-bold text-gray-900"></h3>
                    <p id="confirm-mensagem" class="text-xs text-gray-500 leading-relaxed"></p>
                    <div class="flex gap-2 pt-2">
                        <button id="btn-cancelar-confirm" type="button" class="flex-1 h-10 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-xs font-bold rounded-xl transition-all">
                            Cancelar
                        </button>
                        <button id="btn-executar-confirm" type="button" class="flex-1 h-10 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95">
                        </button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            modal = document.getElementById('modal-confirm-custom');
        }

        const iconWrapper = document.getElementById('confirm-icon-wrapper');
        const tituloEl = document.getElementById('confirm-titulo');
        const mensagemEl = document.getElementById('confirm-mensagem');
        const btnCancelar = document.getElementById('btn-cancelar-confirm');
        const btnExecutar = document.getElementById('btn-executar-confirm');

        tituloEl.textContent = titulo;
        mensagemEl.textContent = mensagem;
        btnExecutar.textContent = textoConfirmar;

        if (corBotao === 'red') {
            iconWrapper.className = 'w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto';
            iconWrapper.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
            btnExecutar.className = 'flex-1 h-10 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-100 active:scale-95';
        } else {
            iconWrapper.className = 'w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto';
            iconWrapper.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
            btnExecutar.className = 'flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-100 active:scale-95';
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const fechar = (resultado) => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            btnCancelar.onclick = null;
            btnExecutar.onclick = null;
            resolve(resultado);
        };

        btnCancelar.onclick = () => fechar(false);
        btnExecutar.onclick = () => fechar(true);
    });
}

// =================================================================
// 3. ESTADOS DE LOADING NOS BOTÕES
// =================================================================
export function setButtonLoading(button, isLoading, textoLoading = 'Salvando...') {
    if (!button) return;

    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.classList.add('opacity-75', 'cursor-not-allowed');
        button.innerHTML = `
            <div class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>${textoLoading}</span>
            </div>
        `;
    } else {
        button.disabled = false;
        button.classList.remove('opacity-75', 'cursor-not-allowed');
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
}

// =================================================================
// 4. SKELETON LOADERS (Substitui "Carregando...")
// =================================================================
export function renderSkeletonCards(container, quantidade = 3) {
    if (!container) return;
    
    let html = '';
    for (let i = 0; i < quantidade; i++) {
        html += `
            <div class="p-4 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse flex items-center justify-between gap-3">
                <div class="space-y-2 flex-1">
                    <div class="h-3.5 bg-gray-200 rounded w-1/4"></div>
                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
                <div class="h-8 w-20 bg-gray-200 rounded-lg shrink-0"></div>
            </div>
        `;
    }
    container.innerHTML = html;
}

// =================================================================
// 5. EMPTY STATES (Visuais para quando não há dados)
// =================================================================
export function renderEmptyState(container, titulo = 'Nenhum item encontrado', subtitulo = 'Sua lista está vazia no momento.') {
    if (!container) return;

    container.innerHTML = `
        <div class="p-8 bg-white rounded-2xl shadow-sm border border-gray-200 text-center space-y-3">
            <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
            </div>
            <div class="space-y-1">
                <p class="text-sm font-bold text-gray-800">${titulo}</p>
                <p class="text-xs text-gray-400 max-w-xs mx-auto">${subtitulo}</p>
            </div>
        </div>
    `;
}

// =================================================================
// 6. FECHAR MODAIS AO CLICAR NO BACKDROP (Fora do Modal)
// =================================================================
export function initBackdropClose() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('fixed') && e.target.classList.contains('bg-black/60')) {
            e.target.classList.add('hidden');
            e.target.classList.remove('flex');
        }
    });
}