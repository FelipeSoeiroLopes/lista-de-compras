'use strict';

/* ================================================
   SERVICE WORKER
   Permite instalar o app e abrir sem internet. Com internet, sempre busca a versão
   mais nova do site: o cache só entra quando a rede falha ou demora demais.
   ================================================ */
const CACHE_APP = 'lista-pratica-app-v1';
const CACHE_CDN = 'lista-pratica-cdn-v1';
const TEMPO_LIMITE_REDE = 3000;

const ARQUIVOS_APP = [
    './',
    'index.html',
    'styles.css',
    'firebase-config.js',
    'login.js',
    'catalogo.js',
    'produtos.js',
    'base-produtos.js',
    'scanner.js',
    'tutorial.js',
    'pwa.js',
    'script.js',
    'manifest.webmanifest',
    'image/logo.png',
    'image/logo-icone.png',
    'image/favicon-32.png',
    'image/icone-192.png',
    'image/icone-512.png',
];

// Bibliotecas com a versão fixa no endereço: o conteúdo nunca muda, e o cache vale.
// Assim o leitor de código de barras também abre sem internet.
const CDN_VERSIONADA = /^https:\/\/(cdn\.jsdelivr\.net\/npm\/|www\.gstatic\.com\/firebasejs\/)/;

self.addEventListener('install', evento => {
    evento.waitUntil(
        caches.open(CACHE_APP)
            .then(cache => cache.addAll(ARQUIVOS_APP))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', evento => {
    evento.waitUntil(
        caches.keys()
            .then(nomes => Promise.all(
                nomes.filter(n => n !== CACHE_APP && n !== CACHE_CDN).map(n => caches.delete(n))
            ))
            .then(() => self.clients.claim())
    );
});

async function redePrimeiro(pedido) {
    const cache = await caches.open(CACHE_APP);
    const navegacao = pedido.mode === 'navigate';
    // Qualquer endereço do app abre a mesma página, inclusive os links ?c=...
    const guardado = () => (navegacao ? cache.match('index.html') : cache.match(pedido, { ignoreSearch: true }));

    const daRede = fetch(pedido).then(resposta => {
        if (resposta.ok) cache.put(navegacao ? 'index.html' : pedido, resposta.clone());
        return resposta;
    });

    const salvo = await guardado();
    // Sem cópia guardada, só resta esperar a rede
    if (!salvo) return daRede;

    const limite = new Promise(resolve => setTimeout(() => resolve(salvo), TEMPO_LIMITE_REDE));
    return Promise.race([daRede.catch(() => salvo), limite]);
}

async function cacheDaCdn(pedido) {
    const cache = await caches.open(CACHE_CDN);
    const salvo = await cache.match(pedido);
    if (salvo) return salvo;

    const resposta = await fetch(pedido);
    if (resposta.ok || resposta.type === 'opaque') cache.put(pedido, resposta.clone());
    return resposta;
}

self.addEventListener('fetch', evento => {
    const { request: pedido } = evento;
    if (pedido.method !== 'GET') return;

    // Banco, login e bases de produtos seguem direto: nunca passam pelo cache
    if (new URL(pedido.url).origin === self.location.origin) {
        evento.respondWith(redePrimeiro(pedido));
    } else if (CDN_VERSIONADA.test(pedido.url)) {
        evento.respondWith(cacheDaCdn(pedido));
    }
});
