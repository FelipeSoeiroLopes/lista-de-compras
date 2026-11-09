'use strict';

/* ================================================
   INSTALAÇÃO DO APP
   O navegador avisa quando o app pode ser instalado, e só então o botão aparece.
   ================================================ */
let pedidoInstalacao = null;

function atualizarBotaoInstalar() {
    document.getElementById('grupoInstalar').classList.toggle('hidden', !pedidoInstalacao);
    document.getElementById('btnInstalar').classList.toggle('hidden', !pedidoInstalacao);
}

window.addEventListener('beforeinstallprompt', evento => {
    // Mostra a instalação pelo botão do menu, em vez do aviso automático do navegador
    evento.preventDefault();
    pedidoInstalacao = evento;
    atualizarBotaoInstalar();
});

window.addEventListener('appinstalled', () => {
    pedidoInstalacao = null;
    atualizarBotaoInstalar();
});

document.getElementById('btnInstalar').addEventListener('click', async () => {
    if (!pedidoInstalacao) return;
    const pedido = pedidoInstalacao;
    // O navegador só permite usar cada pedido uma vez
    pedidoInstalacao = null;
    atualizarBotaoInstalar();
    await pedido.prompt();
});

/* ================================================
   ATUALIZAÇÃO AUTOMÁTICA
   A cada publicação, o GitHub Pages muda a etiqueta (ETag) dos arquivos. O app
   confere essa etiqueta ao abrir, ao voltar para a tela e de tempos em tempos; se
   mudou, recarrega sozinho com a versão nova, no navegador e no app instalado.
   Nunca recarrega no meio de uma ação: espera fechar o leitor, os pop-ups e o teclado.
   ================================================ */
const INTERVALO_VERIFICAR_VERSAO = 5 * 60 * 1000;
const ESPERA_RECARREGAR_OCUPADO  = 20 * 1000;
let versaoCarregada = null;
let atualizacaoPendente = false;
let recarregando = false;

async function versaoNoServidor() {
    // HEAD não passa pelo cache do service worker; o número na URL fura o cache da CDN
    const resposta = await fetch(`index.html?versao=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    if (!resposta.ok) return null;
    return resposta.headers.get('etag') || resposta.headers.get('last-modified');
}

function appOcupado() {
    if (typeof leitor !== 'undefined' && leitor.aberto) return true;
    if (document.querySelector('.modal-backdrop:not(.hidden)')) return true;
    // Campo com foco só conta se tiver algo digitado: vazio, não se perde nada
    const foco = document.activeElement;
    return !!foco && /^(INPUT|TEXTAREA)$/.test(foco.tagName) && foco.value.trim() !== '';
}

function recarregarApp() {
    if (recarregando) return;
    recarregando = true;
    window.location.reload();
}

function aplicarAtualizacao() {
    atualizacaoPendente = true;
    if (document.hidden) {
        recarregarApp();   // ninguém olhando: atualiza já
        return;
    }
    if (appOcupado()) {
        setTimeout(aplicarAtualizacao, ESPERA_RECARREGAR_OCUPADO);
        return;
    }
    if (typeof mostrarToast === 'function') mostrarToast('Nova versão do app, atualizando...');
    setTimeout(() => {
        if (appOcupado()) setTimeout(aplicarAtualizacao, ESPERA_RECARREGAR_OCUPADO);
        else recarregarApp();
    }, 1500);
}

async function verificarAtualizacao(registro) {
    if (atualizacaoPendente || !navigator.onLine) return;
    if (registro) registro.update().catch(() => {});
    try {
        const versao = await versaoNoServidor();
        if (!versao) return;
        if (!versaoCarregada) versaoCarregada = versao;
        else if (versao !== versaoCarregada) aplicarAtualizacao();
    } catch (_) {}
}

if ('serviceWorker' in navigator && window.isSecureContext && window.location.protocol !== 'file:') {
    // Já havia um service worker: quando o novo assumir, a página antiga recarrega
    const tinhaControle = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (tinhaControle) aplicarAtualizacao();
    });

    window.addEventListener('load', async () => {
        let registro = null;
        try {
            registro = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
        } catch (err) {
            console.warn('Service worker indisponível:', err);
        }
        verificarAtualizacao(registro);
        setInterval(() => verificarAtualizacao(registro), INTERVALO_VERIFICAR_VERSAO);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) verificarAtualizacao(registro);
        });
        window.addEventListener('online', () => verificarAtualizacao(registro));
    });
}
