'use strict';

/* ================================================
   LOGIN E ACESSO POR LINK
   - Admin: login e senha abrem o cofre de firebase-config.js e, em seguida, autenticam
     no Firebase Authentication. É essa autenticação que as regras do banco conferem.
   - Convidado: o link compartilhado traz, depois do #, a chave do cofre de convidado.
     O que vem depois do # não é enviado a nenhum servidor.
   ================================================ */
const SESSAO_KEY = 'lista-compras-sessao-v1';
const AVISO_KEY  = 'lista-compras-aviso';
const DOMINIO_ADMIN = 'listapratica.app';

let modoConvidado  = false;
let chaveConvidado = '';
let adminAutenticado = Promise.resolve(false);

function base64ParaBytes(texto) {
    return Uint8Array.from(atob(texto), c => c.charCodeAt(0));
}

function base64UrlParaBytes(texto) {
    return base64ParaBytes(texto.replace(/-/g, '+').replace(/_/g, '/'));
}

async function decifrar(chave, cofre) {
    const aberto = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ParaBytes(cofre.iv) },
        chave,
        base64ParaBytes(cofre.dados)
    );
    return JSON.parse(new TextDecoder().decode(aberto));
}

// Precisa ser igual à derivação em scripts/gerar-cofre.mjs
async function derivarChave(usuario, senha) {
    const material = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(`${usuario.trim().toLowerCase()}\n${senha}`),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt: base64ParaBytes(COFRE_FIREBASE.salt),
            iterations: COFRE_FIREBASE.iteracoes,
        },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
    );
}

// Retorna a sessão, ou lança erro se o login ou a senha estiverem errados
async function abrirCofreAdmin(usuario, senha) {
    return decifrar(await derivarChave(usuario, senha), COFRE_FIREBASE);
}

async function abrirCofreConvidado(chaveTexto) {
    const chave = await crypto.subtle.importKey('raw', base64UrlParaBytes(chaveTexto), 'AES-GCM', false, ['decrypt']);
    return decifrar(chave, COFRE_CONVIDADO);
}

function lerSessao() {
    try {
        return JSON.parse(localStorage.getItem(SESSAO_KEY));
    } catch (_) {
        return null;
    }
}

function chaveDoLink() {
    const temLista = new URLSearchParams(window.location.search).has('c');
    return temLista ? new URLSearchParams(window.location.hash.slice(1)).get('k') : null;
}

function autenticarAdmin(usuario, senha) {
    try {
        const email = `${usuario.trim().toLowerCase()}@${DOMINIO_ADMIN}`;
        return firebase.auth().signInWithEmailAndPassword(email, senha)
            .then(() => true)
            .catch(err => {
                console.warn('Sem autenticação no Firebase:', err.code);
                return false;
            });
    } catch (_) {
        return Promise.resolve(false);
    }
}

// Ao recarregar, o próprio Firebase restaura o admin que já tinha entrado
function restaurarAdmin() {
    try {
        return new Promise(resolve => {
            const parar = firebase.auth().onAuthStateChanged(usuario => {
                parar();
                resolve(!!usuario);
            });
        });
    } catch (_) {
        return Promise.resolve(false);
    }
}

async function exigirLogin(aoEntrar) {
    const entrar = () => {
        document.documentElement.classList.add('logado');
        aoEntrar();
    };

    const sessao = lerSessao();
    // Sessão de uma versão anterior não tem este formato: pede o login de novo
    if (sessao && sessao.config) {
        chaveConvidado = sessao.chaveConvidado;
        conectarFirebase(sessao.config);
        adminAutenticado = restaurarAdmin();
        entrar();
        return;
    }

    const chaveLink = chaveDoLink();
    if (chaveLink && window.crypto && crypto.subtle) {
        try {
            const config = await abrirCofreConvidado(chaveLink);
            modoConvidado  = true;
            chaveConvidado = chaveLink;
            document.documentElement.classList.add('convidado');
            conectarFirebase(config);
            entrar();
            return;
        } catch (_) {
            console.warn('Link compartilhado inválido');
        }
    }

    mostrarLogin(entrar);
}

function mostrarLogin(entrar) {
    document.documentElement.classList.remove('logado');
    const form  = document.getElementById('loginForm');
    const erro  = document.getElementById('loginErro');
    const botao = document.getElementById('btnEntrar');
    const senha = document.getElementById('loginSenha');

    const aviso = sessionStorage.getItem(AVISO_KEY);
    if (aviso) {
        sessionStorage.removeItem(AVISO_KEY);
        erro.textContent = aviso;
        erro.classList.remove('hidden');
    }

    if (!window.crypto || !crypto.subtle) {
        erro.textContent = 'Este navegador não permite o login aqui. Abra o site pelo endereço com https.';
        erro.classList.remove('hidden');
        botao.disabled = true;
        return;
    }

    document.getElementById('btnVerSenha').addEventListener('click', e => {
        const mostrar = senha.type === 'password';
        senha.type = mostrar ? 'text' : 'password';
        e.currentTarget.textContent = mostrar ? 'Ocultar' : 'Mostrar';
        e.currentTarget.setAttribute('aria-pressed', String(mostrar));
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        erro.classList.add('hidden');
        botao.disabled = true;
        botao.textContent = 'Entrando...';

        try {
            const usuario = document.getElementById('loginUsuario').value;
            const sessao  = await abrirCofreAdmin(usuario, senha.value);
            chaveConvidado = sessao.chaveConvidado;
            conectarFirebase(sessao.config);
            adminAutenticado = autenticarAdmin(usuario, senha.value);
            senha.value = '';
            try {
                localStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
            } catch (_) {}
            entrar();
        } catch (_) {
            erro.textContent = 'Login ou senha incorretos.';
            erro.classList.remove('hidden');
            senha.select();
        } finally {
            botao.disabled = false;
            botao.textContent = 'Entrar';
        }
    });

    requestAnimationFrame(() => document.getElementById('loginUsuario').focus());
}

// A lista do link acabou ou não abre: o convidado não tem mais o que ver aqui
function encerrarConvidado(aviso) {
    sessionStorage.setItem(AVISO_KEY, aviso);
    const url = new URL(window.location.href);
    url.searchParams.delete('c');
    url.hash = '';
    window.location.replace(url.toString());
}

async function sair() {
    try {
        localStorage.removeItem(SESSAO_KEY);
        await firebase.auth().signOut();
    } catch (_) {}
    window.location.reload();
}
