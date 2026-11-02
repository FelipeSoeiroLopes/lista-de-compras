'use strict';

/* ================================================
   CONSTANTES
   ================================================ */
const CAT_EMOJI = {
    'Frutas':    '🍎', 'Verduras':  '🥦', 'Carnes':    '🥩',
    'Laticínios':'🥛', 'Padaria':   '🍞', 'Bebidas':   '🥤',
    'Limpeza':   '🧹', 'Higiene':   '🧴', 'Congelados':'🧊',
    'Grãos':     '🌾', 'Temperos':  '🧂', 'Mercearia': '🥫',
    'Outros':    '📦'
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
    produtoAtual:    null,  // dados do código de barras do item no formulário
    categoriaManual: false, // o usuário escolheu a categoria: não trocar sozinho
    fluxoScanner:    false, // o formulário veio do leitor
    produtoFixo:     false, // nome ajustado à mão não desfaz o produto escolhido
};

let deletedItem  = null;
let deletedIndex = null;
let toastTimer   = null;
let novoItemId   = null; // só o item recém-adicionado anima ao entrar

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
    // O convidado vê só a lista do link, nunca a lista pessoal guardada neste aparelho
    if (modoConvidado) state.itens = [];
    aplicarTema();
    bindEvents();
    bindScanner();
    bindTutorial();
    renderizar();
    atualizarCategoriasFiltro();

    // Se a URL tiver ?c=CODIGO, entra na lista compartilhada automaticamente
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('c');
    if (codigo) entrarNaLista(codigo.toUpperCase());

    if (!tutorialJaVisto()) abrirTutorial();
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
    document.getElementById('iconeTema').setAttribute('href', state.tema === 'dark' ? '#i-sun' : '#i-moon');
    document.getElementById('textoTema').textContent = state.tema === 'dark' ? 'Tema claro' : 'Tema escuro';
    document.getElementById('metaTema').setAttribute('content', state.tema === 'dark' ? '#0a2a66' : '#0a46b8');
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
        // O que ainda falta pegar fica em cima
        default:           itens.sort((a, b) => a.pego - b.pego || a.ordem - b.ordem);
    }

    return itens;
}

/* ================================================
   RENDERIZAÇÃO
   ================================================ */
function renderizar() {
    const lista     = document.getElementById('listaCompras');
    const listaVazia = document.getElementById('listaVazia');
    const area      = document.getElementById('areaLista');
    const rolagem   = area.scrollTop;
    const itens     = filtrarItens();

    lista.innerHTML = '';

    const semItens = state.itens.length === 0;
    listaVazia.classList.toggle('hidden', !semItens);
    document.getElementById('controles').classList.toggle('hidden', semItens);
    document.getElementById('semResultado').classList.toggle('hidden', semItens || itens.length > 0);

    if (itens.length > 0) {
        if (state.ordenacao === 'categoria') {
            renderizarPorCategoria(lista, itens);
        } else {
            itens.forEach(item => lista.appendChild(criarItemEl(item)));
        }
    }

    // Recriar a lista não pode jogar a pessoa de volta ao topo
    area.scrollTop = rolagem;
    novoItemId = null;

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

function icone(nome) {
    return `<svg class="ico"><use href="#i-${nome}"/></svg>`;
}

function criarItemEl(item) {
    const li = document.createElement('li');
    li.className = `item-compra${item.pego ? ' pego' : ''}${item.id === novoItemId ? ' novo' : ''}`;
    li.dataset.id = item.id;

    const subtotal = calcSubtotal(item.quantidade, item.unidade, item.preco);
    const unPreco  = unidadePrecoLabel(item.unidade);
    const imagem   = imagemSegura(item.imagem);
    const emoji    = CAT_EMOJI[item.categoria] || '📦';
    const nome     = esc(item.nome);

    const meta = [item.detalhe, item.categoria].filter(Boolean).map(esc).join(' · ');
    const preco = item.preco > 0
        ? `R$ ${fmtNum(item.preco)}/${esc(unPreco)}`
        : '<button class="item-sem-preco">Adicionar preço</button>';

    li.innerHTML = `
        <div class="item-body">
            <div class="item-check-area">
                <div class="item-check">${item.pego ? '✓' : ''}</div>
            </div>
            <div class="item-thumb">${imagem
                ? `<img src="${esc(imagem)}" alt="" referrerpolicy="no-referrer">`
                : emoji}</div>
            <div class="item-content">
                <div class="item-topo">
                    <div class="item-nome">${nome}</div>
                    ${subtotal > 0 ? `<div class="item-subtotal">R$ ${fmtNum(subtotal)}</div>` : ''}
                </div>
                <div class="item-meta">${meta}</div>
                <div class="item-meta">${preco}</div>
                <div class="item-acoes">
                    <div class="item-stepper">
                        <button class="stepper-btn item-menos" aria-label="Diminuir ${nome}" ${item.quantidade <= passoQuantidade(item.unidade) ? 'disabled' : ''}>${icone('minus')}</button>
                        <span class="stepper-valor">${fmtQty(item.quantidade)} ${esc(item.unidade)}</span>
                        <button class="stepper-btn item-mais" aria-label="Aumentar ${nome}">${icone('plus')}</button>
                    </div>
                    <button class="item-btn item-btn-editar" title="Editar item" aria-label="Editar ${nome}">${icone('edit')}</button>
                    <button class="item-btn item-btn-remover" title="Remover item" aria-label="Remover ${nome}">${icone('trash')}</button>
                </div>
            </div>
        </div>
    `;

    const foto = li.querySelector('.item-thumb img');
    if (foto) foto.addEventListener('error', () => { foto.parentElement.textContent = emoji; });

    const aoTocar = (seletor, acao) => {
        const el = li.querySelector(seletor);
        if (!el) return;
        el.addEventListener('click', e => {
            e.stopPropagation();
            acao();
        });
    };

    aoTocar('.item-check-area',  () => togglePego(item.id));
    aoTocar('.item-thumb',       () => togglePego(item.id));
    aoTocar('.item-content',     () => togglePego(item.id));
    aoTocar('.item-acoes',       () => {}); // tocar entre os botões não marca o item
    aoTocar('.item-menos',       () => alterarQuantidade(item.id, -1));
    aoTocar('.item-mais',        () => alterarQuantidade(item.id, 1));
    aoTocar('.item-sem-preco',   () => abrirEditar(item.id, 'inputPreco'));
    aoTocar('.item-btn-editar',  () => abrirEditar(item.id));
    aoTocar('.item-btn-remover', () => removerItem(item.id));

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
    const total = totalDosItens(state.itens);
    const noCarrinho = totalDosItens(state.itens.filter(i => i.pego));
    const semPreco = state.itens.filter(i => !(i.preco > 0)).length;

    const detalhes = [];
    if (noCarrinho > 0) detalhes.push(`R$ ${fmtNum(noCarrinho)} no carrinho`);
    if (semPreco > 0)   detalhes.push(semPreco === 1 ? '1 sem preço' : `${semPreco} sem preço`);

    document.getElementById('totalValor').textContent   = `R$ ${fmtNum(total)}`;
    document.getElementById('totalDetalhe').textContent = detalhes.join(' · ');
}

function totalDosItens(itens) {
    return itens.reduce((s, i) => s + calcSubtotal(i.quantidade, i.unidade, i.preco), 0);
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

function alterarQuantidade(id, direcao) {
    const item = state.itens.find(i => i.id === id);
    if (!item) return;
    const passo = passoQuantidade(item.unidade);
    const nova  = arredondarQtd(item.quantidade + direcao * passo);
    if (nova < passo) return;
    item.quantidade = nova;
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

// Quanto cada toque em − ou + muda, conforme a unidade
function passoQuantidade(unidade) {
    if (unidade === 'kg' || unidade === 'L') return 0.1;
    if (unidade === 'g'  || unidade === 'ml') return 50;
    return 1;
}

// Evita 1.3000000000000003 ao somar passos de 0.1
function arredondarQtd(n) {
    return Math.round(n * 1000) / 1000;
}

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
function prepararFormulario({ titulo, botao }) {
    document.getElementById('modalTitulo').textContent       = titulo;
    document.getElementById('btnConfirmarModal').textContent = botao;
    document.getElementById('btnAdicionarEscanear').textContent = `${botao} e escanear outro`;
    document.getElementById('btnAdicionarEscanear').classList.toggle('hidden', !state.fluxoScanner);
    document.getElementById('btnCancelarModal').textContent  = state.fluxoScanner ? 'Fechar' : 'Cancelar';
    document.getElementById('inputNome').classList.remove('error');
    document.getElementById('dicaPreco').classList.add('hidden');
    state.produtoFixo = false;
    esconderSugestoes();
    mostrarProdutoInfo(null);
    carregarBaseProdutos().then(atualizarSugestoes).catch(() => {});
    document.getElementById('modalBackdrop').classList.remove('hidden');
}

function preencherCampos({ nome = '', quantidade = 1, unidade = 'un', preco = 0, categoria = 'Outros' }) {
    document.getElementById('inputNome').value       = nome;
    document.getElementById('inputQuantidade').value = quantidade;
    document.getElementById('inputUnidade').value    = unidade;
    document.getElementById('inputCategoria').value  = categoria;
    setPrecoMascara(preco);
    atualizarUIDaUnidade();
}

function abrirAdicionar() {
    state.editandoId      = null;
    state.produtoAtual    = null;
    state.categoriaManual = false;
    state.fluxoScanner    = false;
    prepararFormulario({ titulo: 'Adicionar Item', botao: 'Adicionar' });
    preencherCampos({});
    requestAnimationFrame(() => document.getElementById('inputNome').focus());
}

function abrirEditar(id, campoFoco = 'inputNome') {
    const item = state.itens.find(i => i.id === id);
    if (!item) return;
    state.editandoId      = id;
    state.produtoAtual    = dadosDoProduto(item);
    state.categoriaManual = true;
    state.fluxoScanner    = false;
    prepararFormulario({ titulo: 'Editar Item', botao: 'Salvar' });
    preencherCampos(item);
    requestAnimationFrame(() => document.getElementById(campoFoco).focus());
}

function dadosDoProduto(p) {
    return { codigo: p.codigo || '', imagem: p.imagem || '', detalhe: p.detalhe || '' };
}

// Com o nome vindo da leitura, o cartão mostra foto e nome e o campo de texto
// sai do caminho: o que falta preencher é só quantidade e valor.
function mostrarProdutoInfo(info) {
    const caixa     = document.getElementById('produtoInfo');
    const campoNome = document.getElementById('campoNome');
    const temNome   = !!(info && info.nome);

    caixa.classList.toggle('hidden', !info);
    campoNome.classList.toggle('hidden', temNome);
    document.getElementById('btnCorrigirNome').classList.toggle('hidden', !temNome);
    if (!info) return;

    const foto   = document.getElementById('produtoFoto');
    const imagem = imagemSegura(info.imagem);
    foto.classList.toggle('hidden', !imagem);
    if (imagem) foto.src = imagem; else foto.removeAttribute('src');

    caixa.dataset.tipo = info.tipo || '';
    document.getElementById('produtoNome').textContent    = info.nome || '';
    document.getElementById('produtoDetalhe').textContent = info.detalhe || '';
    document.getElementById('produtoAviso').textContent   = info.aviso;
}

function corrigirNome() {
    document.getElementById('campoNome').classList.remove('hidden');
    document.getElementById('btnCorrigirNome').classList.add('hidden');
    document.getElementById('produtoNome').textContent = '';
    state.produtoFixo = true;
    document.getElementById('inputNome').focus();
}

/* ================================================
   FORMULÁRIO A PARTIR DO LEITOR
   ================================================ */
const AVISOS_LEITURA = {
    'encontrado':     p => `Dados: ${p.fonte}`,
    'lembrado':       () => 'Você já comprou este produto',
    'nao-encontrado': p => `Código ${p.codigo} ainda sem cadastro. Digite o nome: da próxima vez o app lembra.`,
    'sem-conexao':    p => `Sem resposta da base de produtos. Digite o nome do código ${p.codigo}.`,
};

function abrirProdutoDoScanner(produto, situacao) {
    state.editandoId      = null;
    state.produtoAtual    = dadosDoProduto(produto);
    state.fluxoScanner    = true;
    const temNome = !!produto.nome;
    // Sem nome, a categoria ainda pode ser deduzida do que for digitado
    state.categoriaManual = temNome;

    prepararFormulario({ titulo: temNome ? 'Quanto e por quanto?' : 'Adicionar Item', botao: 'Adicionar' });
    preencherCampos(produto);
    mostrarProdutoInfo({
        nome:    produto.nome,
        aviso:   AVISOS_LEITURA[situacao](produto),
        detalhe: produto.detalhe,
        imagem:  produto.imagem,
        tipo:    temNome ? '' : 'aviso',
    });
    document.getElementById('dicaPreco').classList.toggle('hidden', !(produto.preco > 0));

    // Vai direto para o que falta: o nome, se não veio, ou o valor
    const campoFoco = !temNome ? 'inputNome' : (produto.preco > 0 ? '' : 'inputPreco');
    if (campoFoco) requestAnimationFrame(() => document.getElementById(campoFoco).focus());
}

// Escaneou o que já está na lista: mostra a quantidade + 1 para confirmar
function abrirRepetidoDoScanner(id) {
    const item = state.itens.find(i => i.id === id);
    if (!item) return;
    state.editandoId      = id;
    state.produtoAtual    = dadosDoProduto(item);
    state.categoriaManual = true;
    state.fluxoScanner    = true;
    prepararFormulario({ titulo: 'Já está na lista', botao: 'Salvar' });
    preencherCampos({ ...item, quantidade: arredondarQtd(item.quantidade + passoQuantidade(item.unidade)) });
    mostrarProdutoInfo({
        nome:    item.nome,
        aviso:   `Você tinha ${fmtQty(item.quantidade)} ${item.unidade}. Somamos mais um.`,
        detalhe: item.detalhe,
        imagem:  item.imagem,
    });
}

function escanearPeloFormulario() {
    fecharModal();
    abrirScanner();
}

/* ================================================
   SUGESTÕES AO DIGITAR
   ================================================ */
function esconderSugestoes() {
    document.getElementById('sugestoes').classList.add('hidden');
    document.getElementById('inputNome').setAttribute('aria-expanded', 'false');
}

function atualizarSugestoes() {
    const input = document.getElementById('inputNome');
    const lista = document.getElementById('sugestoes');

    // A base termina de carregar depois: não abrir lista com o formulário já fechado ou sem foco
    if (document.activeElement !== input) return;

    const sugestoes = sugerirProdutos(input.value);

    lista.innerHTML = '';
    lista.classList.toggle('hidden', sugestoes.length === 0);
    input.setAttribute('aria-expanded', String(sugestoes.length > 0));

    sugestoes.forEach(p => {
        const partes = [p.detalhe || p.categoria];
        const foto = imagemSegura(p.imagem);
        if (p.preco > 0) partes.push(`último: R$ ${fmtNum(p.preco)}/${unidadePrecoLabel(p.unidade)}`);

        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.innerHTML = `
            <button type="button" class="sugestao">
                <span class="sugestao-emoji">${foto
                    ? `<img src="${esc(foto)}" alt="" referrerpolicy="no-referrer">`
                    : (CAT_EMOJI[p.categoria] || '📦')}</span>
                <span class="sugestao-textos">
                    <span class="sugestao-nome">${esc(p.nome)}</span>
                    <span class="sugestao-meta">${esc(partes.join(' · '))}</span>
                </span>
            </button>
        `;
        const img = li.querySelector('img');
        if (img) img.addEventListener('error', () => { img.parentElement.textContent = CAT_EMOJI[p.categoria] || '📦'; });
        li.querySelector('button').addEventListener('click', () => escolherSugestao(p));
        lista.appendChild(li);
    });
}

function escolherSugestao(p) {
    // Veio de um código sem cadastro: guarda o código lido, assim na próxima
    // leitura esse produto já é reconhecido
    const codigoLido = state.fluxoScanner && state.produtoAtual ? state.produtoAtual.codigo : '';

    state.produtoAtual    = dadosDoProduto(p);
    if (codigoLido) state.produtoAtual.codigo = codigoLido;
    state.categoriaManual = true;
    state.produtoFixo     = true;
    const nome = document.getElementById('inputNome');
    nome.value = p.nome.toUpperCase();
    document.getElementById('inputUnidade').value   = p.unidade;
    document.getElementById('inputCategoria').value = p.categoria;
    setPrecoMascara(p.preco);
    document.getElementById('dicaPreco').classList.toggle('hidden', !(p.preco > 0));
    atualizarUIDaUnidade();
    esconderSugestoes();

    // Produto de verdade ganha o cartão com foto, igual ao da leitura
    if (p.codigo) {
        mostrarProdutoInfo({
            nome:    p.nome,
            detalhe: p.detalhe,
            imagem:  p.imagem,
            aviso:   p.fonte ? `Dados: ${p.fonte}` : 'Você já comprou este produto',
        });
    }

    // Vai direto para o que falta
    if (p.preco > 0) nome.blur();
    else document.getElementById('inputPreco').focus();
}

function aoDigitarNome() {
    const nome = document.getElementById('inputNome').value;

    // Mudou o nome de uma sugestão escolhida: aquele código não vale mais
    if (!state.fluxoScanner && !state.editandoId && !state.produtoFixo) {
        state.produtoAtual    = null;
        state.categoriaManual = false;
    }

    if (!state.categoriaManual && !state.produtoFixo) {
        document.getElementById('inputCategoria').value = categoriaPeloNome(nome) || 'Outros';
    }

    const preco = precoLembrado(nome);
    if (preco > 0 && !getPrecoFloat()) {
        setPrecoMascara(preco);
        document.getElementById('dicaPreco').classList.remove('hidden');
        atualizarPreviewSubtotal();
    }

    atualizarSugestoes();
}

function mudarQuantidadeForm(direcao) {
    const input = document.getElementById('inputQuantidade');
    const passo = passoQuantidade(document.getElementById('inputUnidade').value);
    const atual = parseFloat(input.value) || 0;
    const nova  = arredondarQtd(atual + direcao * passo);
    if (nova < passo) return;
    input.value = nova;
    atualizarPreviewSubtotal();
}

function fecharModal() {
    document.getElementById('modalBackdrop').classList.add('hidden');
    state.editandoId   = null;
    state.fluxoScanner = false;
    esconderSugestoes();
}

function confirmarModal({ continuarEscaneando = false } = {}) {
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
    // Sempre strings: o Firestore recusa campos undefined
    const produto    = dadosDoProduto(state.produtoAtual || {});
    const dados      = { nome, quantidade, unidade, preco, categoria, ...produto };

    if (state.editandoId) {
        const item = state.itens.find(i => i.id === state.editandoId);
        if (item) Object.assign(item, dados);
        mostrarToast(`"${nome}" atualizado ✓`);
    } else {
        const id = gerarId();
        state.itens.push({ id, ...dados, pego: false, ordem: Date.now() });
        novoItemId = id;
        mostrarToast(`"${nome}" adicionado ✓`);
    }

    lembrarProduto(dados);
    salvar();
    fecharModal();
    renderizar();
    atualizarCategoriasFiltro();

    if (continuarEscaneando) abrirScanner();
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

function limparFiltros() {
    state.filtroStatus    = 'todos';
    state.filtroCategoria = 'todas';
    state.busca           = '';
    document.getElementById('buscaInput').value = '';
    document.getElementById('btnLimparBusca').classList.add('hidden');
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.toggle('active', b.dataset.filtro === 'todos'));
    atualizarCategoriasFiltro();
    renderizar();
}

/* ================================================
   MENU DE OPÇÕES
   ================================================ */
function abrirMenu() {
    document.getElementById('menuBackdrop').classList.remove('hidden');
}

function fecharMenu() {
    document.getElementById('menuBackdrop').classList.add('hidden');
}

/* ================================================
   COMPARTILHAR
   ================================================ */
function compartilharLista() {
    if (state.itens.length === 0) {
        mostrarToast('A lista está vazia!');
        return;
    }

    const total  = totalDosItens(state.itens);
    const linhas = filtrarItens().map(i => {
        const status = i.pego ? '✅' : '❌';
        const preco  = i.preco > 0 ? ` — R$ ${fmtNum(calcSubtotal(i.quantidade, i.unidade, i.preco))}` : '';
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
    // Também vale dentro de atributos (aria-label, src)
    return d.innerHTML.replace(/"/g, '&quot;');
}

/* ================================================
   FIREBASE — COMPARTILHAMENTO AO VIVO
   ================================================ */

// 24 caracteres aleatórios (120 bits): as regras do banco deixam abrir uma lista
// pelo identificador, então ele precisa ser impossível de adivinhar
function gerarCodigo() {
    // Chars sem ambiguidade (sem 0/O, 1/I/L). São 32: o resto da divisão não cria viés
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789_';
    return [...crypto.getRandomValues(new Uint8Array(24))].map(n => chars[n % chars.length]).join('');
}

// Cria uma lista no Firestore e entra nela
async function criarListaCompartilhada() {
    const codigo = gerarCodigo();
    mostrarToast('Criando lista compartilhada...');
    if (!(await adminAutenticado)) {
        mostrarToast('Sem acesso ao banco. Confira a internet, saia e entre de novo.');
        return;
    }
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
    document.getElementById('liveCode').textContent = 'Ao vivo';
    document.getElementById('btnLiveBadge').classList.remove('hidden');

    // Escuta mudanças no Firestore em tempo real
    unsubscribeLista = db.collection('listas').doc(codigo).onSnapshot(snapshot => {
        // Ignora escritas nossas próprias (evita loop). Precisa vir antes de tudo: uma
        // exclusão ainda sem resposta do servidor parece uma lista que deixou de existir.
        if (snapshot.metadata.hasPendingWrites) return;

        // Sem internet, o cache local diz que o documento não existe. Só o servidor pode
        // afirmar que a lista acabou: tratar isso como fim apagaria a lista por falta de sinal.
        if (!snapshot.exists && snapshot.metadata.fromCache) return;

        if (!snapshot.exists) {
            if (modoConvidado) {
                encerrarConvidado('Esta lista foi encerrada ou o link não é mais válido.');
                return;
            }
            mostrarToast('Lista não encontrada.');
            pararCompartilhamento();
            return;
        }

        const data = snapshot.data();
        state.itens = Array.isArray(data.itens) ? data.itens : [];

        renderizar();
        atualizarCategoriasFiltro();

        if (!primeiraSync) mostrarToast('🔄 Lista atualizada por outro dispositivo');
        primeiraSync = false;
    }, err => {
        console.error('Erro no listener:', err);
        if (modoConvidado && err.code === 'permission-denied') {
            encerrarConvidado('Esta lista foi encerrada ou o link não é mais válido.');
            return;
        }
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
    if (modoConvidado) return; // só o admin encerra uma lista

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
    document.getElementById('liveLinkBox').textContent = getLiveLink();
    document.getElementById('liveShareBackdrop').classList.remove('hidden');
}

function fecharLiveShareModal() {
    document.getElementById('liveShareBackdrop').classList.add('hidden');
}

function getLiveLink() {
    return `${window.location.origin}${window.location.pathname}?c=${codigoAtivo}#k=${chaveConvidado}`;
}

/* ================================================
   EVENTOS
   ================================================ */
function bindEvents() {
    // FAB / modal
    document.getElementById('btnAdicionar').addEventListener('click', abrirAdicionar);
    document.getElementById('btnConfirmarModal').addEventListener('click', () => confirmarModal());
    document.getElementById('btnAdicionarEscanear').addEventListener('click', () => confirmarModal({ continuarEscaneando: true }));
    document.getElementById('btnEscanear').addEventListener('click', abrirScanner);
    document.getElementById('btnModalEscanear').addEventListener('click', escanearPeloFormulario);
    document.getElementById('btnCorrigirNome').addEventListener('click', corrigirNome);
    document.getElementById('btnQtdMenos').addEventListener('click', () => mudarQuantidadeForm(-1));
    document.getElementById('btnQtdMais').addEventListener('click', () => mudarQuantidadeForm(1));
    document.getElementById('inputNome').addEventListener('input', aoDigitarNome);
    document.getElementById('inputCategoria').addEventListener('change', () => { state.categoriaManual = true; });

    // Tela de lista vazia
    document.getElementById('btnVaziaEscanear').addEventListener('click', abrirScanner);
    document.getElementById('btnVaziaDigitar').addEventListener('click', abrirAdicionar);
    document.getElementById('btnVaziaTutorial').addEventListener('click', abrirTutorial);
    document.getElementById('btnLimparFiltros').addEventListener('click', limparFiltros);

    // Ajuda e menu
    document.getElementById('btnAjuda').addEventListener('click', abrirTutorial);
    document.getElementById('btnSair').addEventListener('click', () => {
        confirmarAcao('Sair deste aparelho? Sua lista continua salva aqui.', sair);
    });
    document.getElementById('btnMenu').addEventListener('click', abrirMenu);
    document.getElementById('btnFecharMenu').addEventListener('click', fecharMenu);
    document.getElementById('menuBackdrop').addEventListener('click', e => {
        if (e.target === document.getElementById('menuBackdrop')) fecharMenu();
    });
    // Cada ação do menu fecha o menu; o seletor de ordenação tem evento próprio
    document.querySelectorAll('button.menu-item').forEach(btn => btn.addEventListener('click', fecharMenu));
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
        if (e.key === 'Enter') {
            esconderSugestoes();
            document.getElementById('inputQuantidade').focus();
        }
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
        fecharMenu();
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
        if (tutorialAberto())                                                          { fecharTutorial();       return; }
        if (leitor.aberto)                                                             { fecharScanner();        return; }
        if (!document.getElementById('menuBackdrop').classList.contains('hidden'))     { fecharMenu();           return; }
        if (!document.getElementById('modalBackdrop').classList.contains('hidden'))    { fecharModal();          return; }
        if (!document.getElementById('confirmBackdrop').classList.contains('hidden'))  { fecharConfirm();        return; }
        if (!document.getElementById('liveShareBackdrop').classList.contains('hidden')){ fecharLiveShareModal(); return; }
    });
}

/* ================================================
   START
   ================================================ */
exigirLogin(init);
