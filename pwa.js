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

if ('serviceWorker' in navigator && window.isSecureContext && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker indisponível:', err));
    });
}
