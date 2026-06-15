'use strict';

/* ================================================
   CONSTANTES
   ================================================ */
const CAT_EMOJI = {
    'Frutas':    '🍎', 'Verduras':  '🥦', 'Carnes':    '🥩',
    'Laticínios':'🥛', 'Padaria':   '🍞', 'Bebidas':   '🥤',
    'Limpeza':   '🧹', 'Higiene':   '🧴', 'Congelados':'🧊',
    'Grãos':     '🌾', 'Temperos':  '🧂', 'Outros':    '📦'
};

const STORAGE_KEY = 'lista-compras-v10';

/* ================================================
   ESTADO
   ================================================ */
let state = {
    itens:           [],
    filtroStatus:    'todos',
    filtroCategoria: 'todas',
    busca:           '',
    ordenacao:       'ordem',
    tema:            'light',
    editandoId:      null,
};

let deletedItem  = null;
let deletedIndex = null;
let toastTimer   = null;

// Firebase — live sharing
let codigoAtivo      = null; // código da lista compartilhada ativa
let unsubscribeLista = null; // listener do Firestore
let syncTimer        = null; // debounce para salvar no Firestore
let primeiraSync     = true; // evita toast no carregamento inicial

/* ================================================
   INICIALIZAÇÃO
   ================================================ */
function init() {
    carregarEstado();
    aplicarTema();
    bindEvents();
    renderizar();
    atualizarCategoriasFiltro();

    // Se a URL tiver ?c=CODIGO, entra na lista compartilhada automaticamente
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('c');
    if (codigo) entrarNaLista(codigo.toUpperCase());
}

/* ================================================
   PERSISTÊNCIA
   ================================================ */
function salvar() {
    // Sempre salva tema localmente; itens só localmente quando não está em modo compartilhado
    const payload = codigoAtivo
        ? { tema: state.tema }                          // modo compartilhado: só tema local
        : { itens: state.itens, tema: state.tema };    // modo local: tudo local
    const atual = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...atual, ...payload }));

    // Se estiver em modo compartilhado, sobe pro Firestore (com debounce)
    if (codigoAtivo) sincronizarFirestore();
}

function carregarEstado() {
    // Migração de versão antiga
    const antigo = localStorage.getItem('listaCompras');
    if (antigo && !localStorage.getItem(STORAGE_KEY)) {
        try {
            const itens = JSON.parse(antigo).map((item, i) => ({
                id:        gerarId(),
                nome:      (item.nome || 'Item').toUpperCase(),
                quantidade: parseFloat(item.quantidade) || 1,
                unidade:   'un',
                preco:     parseFloat(item.preco) || 0,
                categoria: 'Outros',
                pego:      !!item.pego,
                ordem:     i,
            }));
            state.itens = itens;
            salvar();
        } catch (_) {}
    }

    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
        try {
            const d = JSON.parse(salvo);
            state.itens = Array.isArray(d.itens) ? d.itens : [];
            state.tema  = d.tema || 'light';
        } catch (_) {}
    }
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ================================================
   TEMA
   ================================================ */
function aplicarTema() {
    document.documentElement.setAttribute('data-theme', state.tema);
    document.getElementById('btnTema').textContent = state.tema === 'dark' ? '☀️' : '🌙';
}

function toggleTema() {
    state.tema = state.tema === 'dark' ? 'light' : 'dark';
    aplicarTema();
    salvar();
}

/* ================================================
   FILTRAGEM E ORDENAÇÃO
   ================================================ */
function filtrarItens() {
    let itens = [...state.itens];

    if (state.filtroStatus === 'pendentes') itens = itens.filter(i => !i.pego);
    else if (state.filtroStatus === 'pegos') itens = itens.filter(i => i.pego);

    if (state.filtroCategoria !== 'todas') {
        itens = itens.filter(i => i.categoria === state.filtroCategoria);
    }

    if (state.busca) {
        const q = state.busca.toLowerCase();
        itens = itens.filter(i => i.nome.toLowerCase().includes(q));
    }

    switch (state.ordenacao) {
        case 'nome':       itens.sort((a, b) => a.nome.localeCompare(b.nome)); break;
        case 'categoria':  itens.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome)); break;
        case 'preco-asc':  itens.sort((a, b) => calcSubtotal(a.quantidade, a.unidade, a.preco) - calcSubtotal(b.quantidade, b.unidade, b.preco)); break;
        case 'preco-desc': itens.sort((a, b) => calcSubtotal(b.quantidade, b.unidade, b.preco) - calcSubtotal(a.quantidade, a.unidade, a.preco)); break;
        default:           itens.sort((a, b) => a.ordem - b.ordem);
    }

    return itens;
}

/* ================================================
   RENDERIZAÇÃO
   ================================================ */
function renderizar() {
    const lista     = document.getElementById('listaCompras');
    const listaVazia = document.getElementById('listaVazia');
    const itens     = filtrarItens();

    lista.innerHTML = '';

    if (itens.length === 0) {
        listaVazia.classList.remove('hidden');
    } else {
        listaVazia.classList.add('hidden');
        if (state.ordenacao === 'categoria') {
            renderizarPorCategoria(lista, itens);
        } else {
            itens.forEach(item => lista.appendChild(criarItemEl(item)));
        }
    }

    atualizarTotal();
    atualizarProgresso();
}

function renderizarPorCategoria(lista, itens) {
    const grupos = {};
    itens.forEach(item => {
        (grupos[item.categoria] = grupos[item.categoria] || []).push(item);
    });

    Object.entries(grupos)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([cat, items]) => {
            const div = document.createElement('div');
            div.className = 'cat-grupo';

            const header = document.createElement('div');
            header.className = 'cat-grupo-header';
            header.textContent = `${CAT_EMOJI[cat] || '📦'} ${cat}`;
            div.appendChild(header);

            const ul = document.createElement('ul');
            items.forEach(item => ul.appendChild(criarItemEl(item)));
            div.appendChild(ul);

            lista.appendChild(div);
        });
}

function criarItemEl(item) {
    const li = document.createElement('li');
    li.className = `item-compra${item.pego ? ' pego' : ''}`;
    li.dataset.id = item.id;

    const subtotal    = calcSubtotal(item.quantidade, item.unidade, item.preco);
    const unPreco     = unidadePrecoLabel(item.unidade);
    // Exibe quantidade na unidade certa (500g, 1,5 kg, etc.)
    const qtdDisplay  = `${fmtQty(item.quantidade)} ${item.unidade}`;
    const precoStr    = item.preco > 0 ? `R$ ${fmtNum(item.preco)}/${unPreco}` : '';
    const subtotalStr = subtotal  > 0 ? `= R$ ${fmtNum(subtotal)}`             : '';

    li.innerHTML = `
        <div class="item-body">
            <div class="item-check-area">
                <div class="item-check">${item.pego ? '✓' : ''}</div>
            </div>
            <div class="item-content">
                <div class="item-nome">${esc(item.nome)}</div>
                <div class="item-meta">
                    <span class="item-qtd">${qtdDisplay}</span>
                    <span class="item-cat">${CAT_EMOJI[item.categoria] || '📦'} ${item.categoria}</span>
                </div>
                ${precoStr ? `<div class="item-price-row">
                    <span class="item-preco">${precoStr}</span>
                    ${subtotalStr ? `<span class="item-subtotal">${subtotalStr}</span>` : ''}
                </div>` : ''}
            </div>
            <div class="item-btns">
                <button class="item-btn item-btn-editar" title="Editar item" aria-label="Editar ${esc(item.nome)}">✏️</button>
                <button class="item-btn item-btn-remover" title="Remover item" aria-label="Remover ${esc(item.nome)}">🗑️</button>
            </div>
        </div>
    `;

    li.querySelector('.item-check-area').addEventListener('click', e => {
        e.stopPropagation();
        togglePego(item.id);
    });
    li.querySelector('.item-content').addEventListener('click', e => {
        e.stopPropagation();
        togglePego(item.id);
    });
    li.querySelector('.item-btn-editar').addEventListener('click', e => {
        e.stopPropagation();
        abrirEditar(item.id);
    });
    li.querySelector('.item-btn-remover').addEventListener('click', e => {
        e.stopPropagation();
        removerItem(item.id);
    });

    return li;
}

/* ================================================
   PROGRESSO E TOTAL
   ================================================ */
function atualizarProgresso() {
    const total = state.itens.length;
    const pegos = state.itens.filter(i => i.pego).length;
    const pct   = total > 0 ? Math.round((pegos / total) * 100) : 0;

    document.getElementById('progressoTexto').textContent    = `${pegos} de ${total} ${total === 1 ? 'item pego' : 'itens pegos'}`;
    document.getElementById('progressoPorcentagem').textContent = `${pct}%`;
    document.getElementById('progressoBar').style.width     = `${pct}%`;
}

function atualizarTotal() {
    const total = state.itens.reduce((s, i) => s + calcSubtotal(i.quantidade, i.unidade, i.preco), 0);
    document.getElementById('totalValor').textContent = `R$ ${fmtNum(total)}`;
}

/* ================================================
   AÇÕES DOS ITENS
   ================================================ */
function togglePego(id) {
    const item = state.itens.find(i => i.id === id);
    if (!item) return;
    item.pego = !item.pego;
    salvar();
    renderizar();
}

function removerItem(id) {
    const idx = state.itens.findIndex(i => i.id === id);
    if (idx === -1) return;
    deletedItem  = { ...state.itens[idx] };
    deletedIndex = idx;
    state.itens.splice(idx, 1);
    salvar();
    renderizar();
    atualizarCategoriasFiltro();
    mostrarToast(`"${deletedItem.nome}" removido`, true);
}

function desfazerRemocao() {
    if (!deletedItem) return;
    state.itens.splice(deletedIndex, 0, deletedItem);
    deletedItem  = null;
    deletedIndex = null;
    salvar();
    renderizar();
    atualizarCategoriasFiltro();
    esconderToast();
}

/* ================================================
   MÁSCARA DE PREÇO (estilo caixa eletrônico)
   ================================================ */

// Aplica máscara de centavos: "890" → "8,90", "8900" → "89,00"
function aplicarMascaraPreco(input) {
    // Guarda posição para não deslocar cursor desnecessariamente
    let digits = input.value.replace(/\D/g, '');

    if (!digits || digits === '0'.repeat(digits.length)) {
        input.value = '';
        return;
    }

    // Remove zeros à esquerda
    digits = digits.replace(/^0+/, '') || '0';

    // Garante pelo menos 3 dígitos: "5" → "005"
    const padded = digits.padStart(3, '0');
    const intPart = padded.slice(0, -2);        // parte inteira
    const decPart = padded.slice(-2);           // centavos

    // Formatação com ponto de milhar (pt-BR)
    const intFormatado = parseInt(intPart, 10).toLocaleString('pt-BR');
    input.value = `${intFormatado},${decPart}`;
}

// Lê o campo de preço como float (ex: "8,90" → 8.9)
function getPrecoFloat() {
    const raw = document.getElementById('inputPreco').value;
    if (!raw) return 0;
    return parseFloat(raw.replace(/\./g, '').replace(',', '.')) || 0;
}

// Preenche o campo de preço com valor float já formatado (ao editar)
function setPrecoMascara(valor) {
    const input = document.getElementById('inputPreco');
    if (!valor || valor <= 0) { input.value = ''; return; }
    const cents = Math.round(valor * 100).toString();
    const padded = cents.padStart(3, '0');
    const intFormatado = parseInt(padded.slice(0, -2), 10).toLocaleString('pt-BR');
    input.value = `${intFormatado},${padded.slice(-2)}`;
}

/* ================================================
   REGRAS DE UNIDADE — lógica de mercado
   No supermercado:
   - g é comprado mas o preço da etiqueta é /kg → divide por 1000
   - ml é comprado mas o preço da etiqueta é /L  → divide por 1000
   ================================================ */

// Unidade de preço que aparece na etiqueta do mercado
const UNIDADE_PRECO = { 'g': 'kg', 'ml': 'L' };

// Calcula subtotal respeitando conversão g→kg e ml→L
function calcSubtotal(quantidade, unidade, preco) {
    if (!preco || preco <= 0) return 0;
    if (unidade === 'g')  return (quantidade / 1000) * preco;
    if (unidade === 'ml') return (quantidade / 1000) * preco;
    return quantidade * preco;
}

// Unidade que aparece no label do preço ("R$/kg", "R$/L", etc.)
function unidadePrecoLabel(un) {
    return UNIDADE_PRECO[un] || un;
}

// Atualiza preview do subtotal em tempo real
function atualizarPreviewSubtotal() {
    const preco   = getPrecoFloat();
    const qty     = parseFloat(document.getElementById('inputQuantidade').value) || 0;
    const un      = document.getElementById('inputUnidade').value;
    const preview = document.getElementById('subtotalPreview');

    if (preco <= 0 || qty <= 0) {
        preview.classList.add('hidden');
        return;
    }

    const unPreco   = unidadePrecoLabel(un);
    const subtotal  = calcSubtotal(qty, un, preco);

    // Linha de explicação para g e ml
    let linhaConversao = '';
    if (un === 'g')  linhaConversao = `<span>${qty}g ÷ 1000 = ${fmtQty(qty / 1000)} kg</span>`;
    if (un === 'ml') linhaConversao = `<span>${qty}ml ÷ 1000 = ${fmtQty(qty / 1000)} L</span>`;

    preview.innerHTML = `
        ${linhaConversao}
        <span>${fmtQty(qty)} ${un} × R$ ${fmtNum(preco)}/${unPreco}</span>
        <strong>= R$ ${fmtNum(subtotal)}</strong>
    `;
    preview.classList.remove('hidden');
}

/* ================================================
   UI DINÂMICA DO FORMULÁRIO
   ================================================ */
const LABEL_PRECO = {
    'kg':  'Preço por kg  (etiqueta do mercado)',
    'g':   'Preço por kg  (etiqueta do mercado)',
    'L':   'Preço por litro',
    'ml':  'Preço por litro',
    'un':  'Preço por unidade (opcional)',
    'pct': 'Preço por pacote (opcional)',
    'cx':  'Preço por caixa (opcional)',
    'dz':  'Preço por dúzia (opcional)',
};

function atualizarUIDaUnidade() {
    const un    = document.getElementById('inputUnidade').value;
    const label = document.getElementById('labelPreco');
    const dica  = document.getElementById('dicaKg');

    label.textContent = LABEL_PRECO[un] || 'Preço por unidade (opcional)';

    // Dica de peso aparece para g e kg
    dica.classList.toggle('hidden', un !== 'kg' && un !== 'g');
    atualizarPreviewSubtotal();
}

/* ================================================
   MODAL ADICIONAR / EDITAR
   ================================================ */
function abrirAdicionar() {
    state.editandoId = null;
    document.getElementById('modalTitulo').textContent       = 'Adicionar Item';
    document.getElementById('btnConfirmarModal').textContent = 'Adicionar';
    document.getElementById('inputNome').value               = '';
    document.getElementById('inputQuantidade').value         = '1';
    document.getElementById('inputUnidade').value            = 'un';
    document.getElementById('inputPreco').value              = '';
    document.getElementById('inputCategoria').value          = 'Outros';
    document.getElementById('inputNome').classList.remove('error');
    document.getElementById('subtotalPreview').classList.add('hidden');
    document.getElementById('modalBackdrop').classList.remove('hidden');
    atualizarUIDaUnidade();
    requestAnimationFrame(() => document.getElementById('inputNome').focus());
}

function abrirEditar(id) {
    const item = state.itens.find(i => i.id === id);
    if (!item) return;
    state.editandoId = id;
    document.getElementById('modalTitulo').textContent       = 'Editar Item';
    document.getElementById('btnConfirmarModal').textContent = 'Salvar';
    document.getElementById('inputNome').value               = item.nome;
    document.getElementById('inputQuantidade').value         = item.quantidade;
    document.getElementById('inputUnidade').value            = item.unidade;
    document.getElementById('inputCategoria').value          = item.categoria;
    setPrecoMascara(item.preco);
    document.getElementById('inputNome').classList.remove('error');
    document.getElementById('modalBackdrop').classList.remove('hidden');
    atualizarUIDaUnidade();
    requestAnimationFrame(() => document.getElementById('inputNome').focus());
}

function fecharModal() {
    document.getElementById('modalBackdrop').classList.add('hidden');
    state.editandoId = null;
}

function confirmarModal() {
    const nomeInput = document.getElementById('inputNome');
    const nome = nomeInput.value.trim().toUpperCase();

    if (!nome) {
        nomeInput.classList.add('error');
        nomeInput.focus();
        setTimeout(() => nomeInput.classList.remove('error'), 1800);
        return;
    }

    const quantidade = parseFloat(document.getElementById('inputQuantidade').value) || 1;
    const unidade    = document.getElementById('inputUnidade').value;
    const preco      = getPrecoFloat();
    const categoria  = document.getElementById('inputCategoria').value;

    if (state.editandoId) {
        const item = state.itens.find(i => i.id === state.editandoId);
        if (item) Object.assign(item, { nome, quantidade, unidade, preco, categoria });
        mostrarToast(`"${nome}" atualizado ✓`);
    } else {
        state.itens.push({ id: gerarId(), nome, quantidade, unidade, preco, categoria, pego: false, ordem: Date.now() });
        mostrarToast(`"${nome}" adicionado ✓`);
    }

    salvar();
    fecharModal();
    renderizar();
    atualizarCategoriasFiltro();
}

/* ================================================
   FILTRO DE CATEGORIAS (chips dinâmicos)
   ================================================ */
function atualizarCategoriasFiltro() {
    const container = document.getElementById('categoriasFiltro');
    const usadas    = [...new Set(state.itens.map(i => i.categoria))].sort();

    container.innerHTML = '';

    const criarChip = (label, valor) => {
        const btn = document.createElement('button');
        btn.className = 'categoria-chip' + (state.filtroCategoria === valor ? ' active' : '');
        btn.dataset.cat = valor;
        btn.textContent = label;
        btn.addEventListener('click', () => {
            state.filtroCategoria = valor;
            document.querySelectorAll('.categoria-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderizar();
        });
        return btn;
    };

    container.appendChild(criarChip('Todas', 'todas'));
    usadas.forEach(cat => container.appendChild(criarChip(`${CAT_EMOJI[cat] || '📦'} ${cat}`, cat)));
}

/* ================================================
   COMPARTILHAR
   ================================================ */
function compartilharLista() {
    if (state.itens.length === 0) {
        mostrarToast('A lista está vazia!');
        return;
    }

    const total  = state.itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const linhas = filtrarItens().map(i => {
        const status = i.pego ? '✅' : '❌';
        const preco  = i.preco > 0 ? ` — R$ ${fmtNum(i.preco * i.quantidade)}` : '';
        return `${status} ${i.nome} (${i.quantidade} ${i.unidade})${preco}`;
    });

    const texto = `🛒 *Lista de Compras*\n\n${linhas.join('\n')}\n\n*Total: R$ ${fmtNum(total)}*`;

    if (navigator.share) {
        navigator.share({ title: 'Lista de Compras', text: texto }).catch(() => {});
    } else {
        navigator.clipboard.writeText(texto)
            .then(() => mostrarToast('Lista copiada! Cole no WhatsApp 📋'))
            .catch(()  => mostrarToast('Não foi possível copiar.'));
    }
}

/* ================================================
   LIMPAR
   ================================================ */
function limparPegos() {
    const count = state.itens.filter(i => i.pego).length;
    if (count === 0) { mostrarToast('Nenhum item marcado como pego'); return; }
    confirmarAcao(
        `Remover ${count} item(s) já pego(s)?`,
        () => {
            state.itens = state.itens.filter(i => !i.pego);
            salvar();
            renderizar();
            atualizarCategoriasFiltro();
            mostrarToast(`${count} item(s) removido(s)`);
        }
    );
}

function limparTudo() {
    if (state.itens.length === 0) { mostrarToast('A lista já está vazia'); return; }
    confirmarAcao(
        `Remover todos os ${state.itens.length} itens da lista?`,
        () => {
            state.itens = [];
            salvar();
            renderizar();
            atualizarCategoriasFiltro();
            mostrarToast('Lista limpa!');
        }
    );
}

/* ================================================
   MODAL DE CONFIRMAÇÃO CUSTOMIZADO
   ================================================ */
let confirmCallback = null;

function confirmarAcao(msg, callback) {
    confirmCallback = callback;
    document.getElementById('confirmMsg').textContent = msg;
    document.getElementById('confirmBackdrop').classList.remove('hidden');
}

function fecharConfirm() {
    document.getElementById('confirmBackdrop').classList.add('hidden');
    confirmCallback = null;
}

/* ================================================
   TOAST
   ================================================ */
function mostrarToast(msg, comUndo = false) {
    clearTimeout(toastTimer);
    const toast  = document.getElementById('toast');
    const msgEl  = document.getElementById('toastMsg');
    const undoEl = document.getElementById('toastUndo');
    msgEl.textContent = msg;
    undoEl.classList.toggle('hidden', !comUndo);
    toast.classList.remove('hidden');
    toastTimer = setTimeout(esconderToast, comUndo ? 4500 : 2500);
}

function esconderToast() {
    document.getElementById('toast').classList.add('hidden');
}

/* ================================================
   UTILITÁRIOS
   ================================================ */
function fmtNum(n) {
    return n.toFixed(2).replace('.', ',');
}

// Formata quantidade sem zeros à direita: 1.0 → "1", 1.5 → "1,5", 500 → "500"
function fmtQty(n) {
    const s = parseFloat(n.toFixed(3)).toString().replace('.', ',');
    return s;
}

function esc(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}

/* ================================================
   FIREBASE — COMPARTILHAMENTO AO VIVO
   ================================================ */

function gerarCodigo() {
    // Chars sem ambiguidade (sem 0/O, 1/I/L)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

// Cria uma lista no Firestore e entra nela
async function criarListaCompartilhada() {
    const codigo = gerarCodigo();
    mostrarToast('Criando lista compartilhada...');
    try {
        await db.collection('listas').doc(codigo).set({
            itens:    state.itens,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        });
        entrarNaLista(codigo);
        abrirLiveShareModal(codigo);
    } catch (err) {
        console.error('Erro ao criar lista:', err);
        mostrarToast('Erro ao criar lista. Tente novamente.');
    }
}

// Conecta a uma lista existente e escuta mudanças em tempo real
function entrarNaLista(codigo) {
    if (unsubscribeLista) unsubscribeLista(); // cancela listener anterior
    codigoAtivo  = codigo;
    primeiraSync = true;

    // Atualiza URL sem recarregar a página
    const url = new URL(window.location.href);
    url.searchParams.set('c', codigo);
    window.history.replaceState({}, '', url.toString());

    // Mostra badge ao vivo no header
    document.getElementById('liveCode').textContent = codigo;
    document.getElementById('btnLiveBadge').classList.remove('hidden');

    // Escuta mudanças no Firestore em tempo real
    unsubscribeLista = db.collection('listas').doc(codigo).onSnapshot(snapshot => {
        if (!snapshot.exists) {
            mostrarToast('Lista não encontrada.');
            pararCompartilhamento();
            return;
        }

        // Ignora escritas nossas próprias (evita loop)
        if (snapshot.metadata.hasPendingWrites) return;

        const data = snapshot.data();
        state.itens = Array.isArray(data.itens) ? data.itens : [];

        renderizar();
        atualizarCategoriasFiltro();

        if (!primeiraSync) mostrarToast('🔄 Lista atualizada por outro dispositivo');
        primeiraSync = false;
    }, err => {
        console.error('Erro no listener:', err);
        mostrarToast('Erro de conexão com a lista.');
    });
}

// Sobe os itens atuais pro Firestore (debounce 600ms para não spam)
function sincronizarFirestore() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
        if (!codigoAtivo) return;
        try {
            await db.collection('listas').doc(codigoAtivo).update({
                itens: state.itens,
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } catch (err) {
            console.error('Erro ao sincronizar:', err);
        }
    }, 600);
}

// Para o compartilhamento, deleta do Firestore e volta ao modo local
async function pararCompartilhamento() {
    const codigoParaDeletar = codigoAtivo;

    if (unsubscribeLista) { unsubscribeLista(); unsubscribeLista = null; }
    codigoAtivo = null;

    document.getElementById('btnLiveBadge').classList.add('hidden');

    // Remove ?c= da URL
    const url = new URL(window.location.href);
    url.searchParams.delete('c');
    window.history.replaceState({}, '', url.toString());

    // Restaura itens do localStorage pessoal
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
        try { state.itens = JSON.parse(salvo).itens || []; } catch (_) {}
    }
    renderizar();
    atualizarCategoriasFiltro();

    // Deleta a lista do Firestore
    if (codigoParaDeletar) {
        try {
            await db.collection('listas').doc(codigoParaDeletar).delete();
        } catch (err) {
            console.error('Erro ao deletar lista do Firestore:', err);
        }
    }

    mostrarToast('Compartilhamento encerrado');
}

// Abre o modal mostrando código + link
function abrirLiveShareModal(codigo) {
    const link = `${window.location.origin}${window.location.pathname}?c=${codigo}`;
    document.getElementById('liveCodeDisplay').textContent = codigo;
    document.getElementById('liveLinkBox').textContent     = link;
    document.getElementById('liveShareBackdrop').classList.remove('hidden');
}

function fecharLiveShareModal() {
    document.getElementById('liveShareBackdrop').classList.add('hidden');
}

function getLiveLink() {
    return `${window.location.origin}${window.location.pathname}?c=${codigoAtivo}`;
}

/* ================================================
   EVENTOS
   ================================================ */
function bindEvents() {
    // FAB / modal
    document.getElementById('btnAdicionar').addEventListener('click', abrirAdicionar);
    document.getElementById('btnConfirmarModal').addEventListener('click', confirmarModal);
    document.getElementById('btnCancelarModal').addEventListener('click', fecharModal);
    document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
    document.getElementById('modalBackdrop').addEventListener('click', e => {
        if (e.target === document.getElementById('modalBackdrop')) fecharModal();
    });

    // Atualiza label e dica ao mudar unidade, e recalcula preview
    document.getElementById('inputUnidade').addEventListener('change', atualizarUIDaUnidade);

    // Quantidade muda → atualiza preview
    document.getElementById('inputQuantidade').addEventListener('input', atualizarPreviewSubtotal);

    // Máscara de centavos no campo de preço
    const inputPreco = document.getElementById('inputPreco');

    inputPreco.addEventListener('input', () => {
        aplicarMascaraPreco(inputPreco);
        atualizarPreviewSubtotal();
    });

    // Bloqueia tudo que não é dígito (exceto teclas de controle)
    inputPreco.addEventListener('keydown', e => {
        const permitidas = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'];
        if (!permitidas.includes(e.key) && !/^\d$/.test(e.key)) {
            e.preventDefault();
        }
        if (e.key === 'Enter') confirmarModal();
    });

    // Teclas no modal
    document.getElementById('inputNome').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('inputQuantidade').focus();
    });

    // Tema
    document.getElementById('btnTema').addEventListener('click', toggleTema);

    // Compartilhar texto (WhatsApp)
    document.getElementById('btnCompartilhar').addEventListener('click', compartilharLista);

    // Compartilhar ao vivo (Firebase)
    document.getElementById('btnLiveShare').addEventListener('click', () => {
        if (codigoAtivo) {
            abrirLiveShareModal(codigoAtivo); // já está em modo ao vivo: reabre o modal
        } else {
            criarListaCompartilhada();
        }
    });

    // Badge ao vivo no header → reabre modal
    document.getElementById('btnLiveBadge').addEventListener('click', () => {
        if (codigoAtivo) abrirLiveShareModal(codigoAtivo);
    });

    // Modal ao vivo
    document.getElementById('btnFecharLiveShare').addEventListener('click', fecharLiveShareModal);
    document.getElementById('liveShareBackdrop').addEventListener('click', e => {
        if (e.target === document.getElementById('liveShareBackdrop')) fecharLiveShareModal();
    });

    document.getElementById('btnCopiarLive').addEventListener('click', () => {
        navigator.clipboard.writeText(getLiveLink())
            .then(() => mostrarToast('Link copiado! 📋'))
            .catch(() => mostrarToast('Não foi possível copiar.'));
    });

    document.getElementById('btnWppLive').addEventListener('click', () => {
        const texto = `Oi! Acessa essa lista de compras ao vivo: ${getLiveLink()}`;
        if (navigator.share) {
            navigator.share({ title: 'Lista de Compras', text: texto }).catch(() => {});
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
        }
    });

    document.getElementById('btnPararLive').addEventListener('click', () => {
        // Fecha o modal ao vivo ANTES de abrir o confirm — senão o modal fica preso
        fecharLiveShareModal();
        confirmarAcao('Parar o compartilhamento e remover a lista do servidor?', pararCompartilhamento);
    });

    // Filtros de status
    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.filtroStatus = btn.dataset.filtro;
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderizar();
        });
    });

    // Ordenação
    document.getElementById('ordenacao').addEventListener('change', e => {
        state.ordenacao = e.target.value;
        renderizar();
    });

    // Busca
    const buscaInput   = document.getElementById('buscaInput');
    const btnLimparBusca = document.getElementById('btnLimparBusca');

    buscaInput.addEventListener('input', () => {
        state.busca = buscaInput.value;
        btnLimparBusca.classList.toggle('hidden', !state.busca);
        renderizar();
    });

    btnLimparBusca.addEventListener('click', () => {
        buscaInput.value = '';
        state.busca = '';
        btnLimparBusca.classList.add('hidden');
        buscaInput.focus();
        renderizar();
    });

    // Limpar listas
    document.getElementById('btnLimparPegos').addEventListener('click', limparPegos);
    document.getElementById('btnLimparTudo').addEventListener('click', limparTudo);

    // Undo toast
    document.getElementById('toastUndo').addEventListener('click', desfazerRemocao);

    // Modal de confirmação
    document.getElementById('btnConfirmOk').addEventListener('click', () => {
        if (confirmCallback) confirmCallback();
        fecharConfirm();
    });
    document.getElementById('btnConfirmCancelar').addEventListener('click', fecharConfirm);
    document.getElementById('confirmBackdrop').addEventListener('click', e => {
        if (e.target === document.getElementById('confirmBackdrop')) fecharConfirm();
    });

    // Escape fecha modais abertos
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        if (!document.getElementById('modalBackdrop').classList.contains('hidden'))    { fecharModal();          return; }
        if (!document.getElementById('confirmBackdrop').classList.contains('hidden'))  { fecharConfirm();        return; }
        if (!document.getElementById('liveShareBackdrop').classList.contains('hidden')){ fecharLiveShareModal(); return; }
    });
}

/* ================================================
   START
   ================================================ */
init();
