// Gera firebase-config.js com a configuração do Firebase criptografada em dois cofres:
// - admin: abre com login e senha (a chave é derivada deles com PBKDF2, nada fica gravado)
// - convidado: abre com uma chave aleatória que viaja no fim dos links compartilhados
//
// Uso, também para trocar a senha:
//   LOGIN_USUARIO=... LOGIN_SENHA=... node scripts/gerar-cofre.mjs caminho/config.json
// O config.json tem os campos do Firebase e NÃO deve ser colocado no repositório.
// Gerar de novo troca a chave de convidado, e os links antigos deixam de abrir sem login.
// A senha do Firebase Authentication é separada: troque também no console do Firebase.

import fs from 'node:fs';
import path from 'node:path';
import { webcrypto as crypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ITERACOES = 600000;

const { LOGIN_USUARIO: usuario, LOGIN_SENHA: senha } = process.env;
const arquivo = process.argv[2];
if (!usuario || !senha || !arquivo) {
    console.error('Uso: LOGIN_USUARIO=... LOGIN_SENHA=... node scripts/gerar-cofre.mjs config.json');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const base64 = dados => Buffer.from(dados).toString('base64');
const texto  = objeto => new TextEncoder().encode(JSON.stringify(objeto));
const aleatorio = tamanho => crypto.getRandomValues(new Uint8Array(tamanho));

async function cifrar(chave, conteudo) {
    const iv = aleatorio(12);
    const dados = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, chave, texto(conteudo));
    return { iv: base64(iv), dados: base64(new Uint8Array(dados)) };
}

const chaveConvidado = aleatorio(32);
const chaveDoLink = await crypto.subtle.importKey('raw', chaveConvidado, 'AES-GCM', false, ['encrypt']);
const cofreConvidado = await cifrar(chaveDoLink, config);

// Precisa ser igual a derivarChave() em login.js
const salt = aleatorio(16);
const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${usuario.trim().toLowerCase()}\n${senha}`),
    'PBKDF2',
    false,
    ['deriveKey']
);
const chaveAdmin = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERACOES },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
);
const cofreAdmin = await cifrar(chaveAdmin, {
    config,
    chaveConvidado: Buffer.from(chaveConvidado).toString('base64url'),
});

const conteudo = { iteracoes: ITERACOES, salt: base64(salt), ...cofreAdmin };

fs.writeFileSync(path.join(RAIZ, 'firebase-config.js'), `// Gerado por scripts/gerar-cofre.mjs. A configuração do Firebase fica criptografada
// (AES-256-GCM). O cofre do admin abre com login e senha; o do convidado, com a chave do link.
const COFRE_FIREBASE = ${JSON.stringify(conteudo, null, 4)};

const COFRE_CONVIDADO = ${JSON.stringify(cofreConvidado, null, 4)};

// var (não const/let) para ficar acessível globalmente nos outros scripts
var db = null;

function conectarFirebase(config) {
    try {
        firebase.initializeApp(config);
        db = firebase.firestore();
    } catch (err) {
        // Sem internet o SDK não carrega: a lista local continua funcionando
        console.error('Firebase indisponível:', err);
    }
}
`);
console.log('firebase-config.js gerado');
