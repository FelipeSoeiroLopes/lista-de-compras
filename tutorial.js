'use strict';

/* ================================================
   TUTORIAL GUIADO
   Abre sozinho só na primeira visita. Depois, pelo botão "?" do topo.
   ================================================ */
const TUTORIAL_KEY = 'lista-compras-tutorial-v1';

const DEMO_ITEM = `
    <div class="tour-demo" aria-hidden="true">
        <span class="tour-demo-check">✓</span>
        <span class="tour-demo-nome">Leite condensado</span>
        <span class="tour-demo-stepper"><b>−</b>2<b>+</b></span>
    </div>`;

const PASSOS_TUTORIAL = [
    {
        titulo: 'Bem-vindo à sua lista',
        texto:  'Em 30 segundos você aprende a montar a lista e a controlar quanto vai gastar.',
    },
    {
        alvo:   '#btnEscanear',
        titulo: 'Escaneie o produto',
        texto:  'Aponte a câmera para o código de barras. O nome e a foto vêm sozinhos: você só informa a quantidade e o valor.',
    },
    {
        alvo:   '#btnAdicionar',
        titulo: 'Ou digite o nome',
        texto:  'Escreva "banana" ou uma marca como "Fini" e escolha na lista. A categoria já vem pronta.',
    },
    {
        titulo: 'No mercado, é só tocar',
        texto:  'Toque no item para marcar como pego. Use − e + para mudar a quantidade.',
        extra:  DEMO_ITEM,
    },
    {
        alvo:   '#areaTotal',
        titulo: 'Acompanhe o valor',
        texto:  'Veja o total e quanto já está no carrinho. O app lembra o último preço de cada produto.',
    },
    {
        alvo:   '#btnMenu',
        titulo: 'Mais opções',
        texto:  'Aqui você compartilha a lista ao vivo, ordena os itens e troca o tema. Boas compras!',
    },
];

let passoTutorial = -1;

function tutorialAberto() {
    return passoTutorial >= 0;
}

function tutorialJaVisto() {
    try {
        return !!localStorage.getItem(TUTORIAL_KEY);
    } catch (_) {
        return false;
    }
}

function abrirTutorial() {
    document.getElementById('tour').classList.remove('hidden');
    irParaPasso(0);
}

function fecharTutorial() {
    passoTutorial = -1;
    document.getElementById('tour').classList.add('hidden');
    try {
        localStorage.setItem(TUTORIAL_KEY, '1');
    } catch (_) {}
}

function irParaPasso(n) {
    if (n < 0) return;
    if (n >= PASSOS_TUTORIAL.length) { fecharTutorial(); return; }

    passoTutorial = n;
    const passo  = PASSOS_TUTORIAL[n];
    const ultimo = n === PASSOS_TUTORIAL.length - 1;

    document.getElementById('tourContador').textContent = `${n + 1} de ${PASSOS_TUTORIAL.length}`;
    document.getElementById('tourTitulo').textContent   = passo.titulo;
    document.getElementById('tourTexto').textContent    = passo.texto;
    document.getElementById('tourExtra').innerHTML      = passo.extra || '';
    document.getElementById('btnTourProximo').textContent = ultimo ? 'Começar' : 'Próximo';
    document.getElementById('btnTourVoltar').classList.toggle('hidden', n === 0);
    document.getElementById('btnTourPular').classList.toggle('hidden', ultimo);
    document.getElementById('tourPontos').innerHTML = PASSOS_TUTORIAL
        .map((_, i) => `<span class="tour-ponto${i === n ? ' ativo' : ''}"></span>`)
        .join('');

    posicionarTutorial();
    document.getElementById('btnTourProximo').focus();
}

function posicionarTutorial() {
    if (!tutorialAberto()) return;

    const passo = PASSOS_TUTORIAL[passoTutorial];
    const spot  = document.getElementById('tourSpot');
    const card  = document.getElementById('tourCard');
    const alvo  = passo.alvo && document.querySelector(passo.alvo);

    card.style.left = card.style.right = card.style.top = card.style.bottom = '';
    card.classList.toggle('centralizado', !alvo);

    if (!alvo) {
        spot.classList.add('sem-alvo');
        spot.removeAttribute('style');
        return;
    }

    const FOLGA = 8;
    const r = alvo.getBoundingClientRect();
    spot.classList.remove('sem-alvo');
    spot.style.top    = `${r.top - FOLGA}px`;
    spot.style.left   = `${r.left - FOLGA}px`;
    spot.style.width  = `${r.width + FOLGA * 2}px`;
    spot.style.height = `${r.height + FOLGA * 2}px`;

    // O cartão fica do lado com mais espaço, sem cobrir o alvo
    const larguraTela = document.documentElement.clientWidth;
    const alturaTela  = window.innerHeight;
    const margem      = Math.max(16, (larguraTela - card.offsetWidth) / 2);

    card.style.left = `${margem}px`;
    if (r.top + r.height / 2 > alturaTela / 2) {
        card.style.bottom = `${alturaTela - r.top + FOLGA + 14}px`;
    } else {
        card.style.top = `${r.bottom + FOLGA + 14}px`;
    }
}

function bindTutorial() {
    document.getElementById('btnTourProximo').addEventListener('click', () => irParaPasso(passoTutorial + 1));
    document.getElementById('btnTourVoltar').addEventListener('click', () => irParaPasso(passoTutorial - 1));
    document.getElementById('btnTourPular').addEventListener('click', fecharTutorial);
    window.addEventListener('resize', posicionarTutorial);
}
