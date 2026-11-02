// Gera base-produtos.js: os produtos brasileiros do Open Food Facts e bases irmãs,
// para a busca por nome funcionar no navegador (a busca online deles não libera CORS)
// e sem internet. Baixa e filtra em fluxo, sem guardar os arquivos completos.
//
// Uso: node scripts/gerar-base.mjs
// Dados sob licença ODbL: https://world.openfoodfacts.org/data

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FONTES = [
    { tipo: 'f', url: 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz' },
    { tipo: 'b', url: 'https://static.openbeautyfacts.org/data/en.openbeautyfacts.org.products.csv.gz' },
    { tipo: 'p', url: 'https://static.openproductsfacts.org/data/en.openproductsfacts.org.products.csv.gz' },
    { tipo: 'a', url: 'https://static.openpetfoodfacts.org/data/en.openpetfoodfacts.org.products.csv.gz' },
];

// Reaproveita as mesmas regras de categoria e validação do app
const contexto = {};
vm.createContext(contexto);
vm.runInContext(
    ['catalogo.js', 'produtos.js'].map(f => fs.readFileSync(path.join(RAIZ, f), 'utf8')).join('\n')
        + ';globalThis.regras = { categoriaPelasTags, categoriaPeloNome, gtinValido };',
    contexto
);
const { categoriaPelasTags, categoriaPeloNome, gtinValido } = contexto.regras;

const limpar = (texto = '') => texto.replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();

// As fotos seguem a pasta do código: guardar só o arquivo economiza bastante espaço
function pastaDoCodigo(codigo) {
    return codigo.length === 13 ? codigo.replace(/^(\d{3})(\d{3})(\d{3})(\d{4})$/, '$1/$2/$3/$4') : codigo;
}

function arquivoDaFoto(url, codigo) {
    const marca = `/images/products/${pastaDoCodigo(codigo)}/`;
    const pos = (url || '').indexOf(marca);
    return pos === -1 ? '' : url.slice(pos + marca.length);
}

const vistos = new Set();
const linhas = [];

async function processar({ tipo, url }) {
    const resposta = await fetch(url);
    if (!resposta.ok) {
        console.log(`${tipo}: ignorada (HTTP ${resposta.status}) ${url}`);
        return;
    }

    const leitor = readline.createInterface({
        input: Readable.fromWeb(resposta.body).pipe(zlib.createGunzip()),
        crlfDelay: Infinity,
    });

    let colunas = null;
    let lidas = 0;
    let aceitas = 0;

    for await (const linha of leitor) {
        if (!colunas) {
            colunas = Object.fromEntries(linha.split('\t').map((nome, i) => [nome, i]));
            continue;
        }
        if (++lidas % 1000000 === 0) console.log(`${tipo}: ${lidas / 1000000} mi lidas, ${aceitas} aceitas`);

        const campos = linha.split('\t');
        const codigo = campos[colunas.code] || '';
        const paises = campos[colunas.countries_tags] || '';
        // 789 e 790 são os prefixos do GS1 Brasil: valem mesmo sem o país marcado
        if (!paises.includes('en:brazil') && !/^(789|790)/.test(codigo)) continue;
        if (!gtinValido(codigo) || vistos.has(codigo)) continue;

        const nome = limpar(campos[colunas.product_name]);
        if (nome.length < 3 || !/[a-zA-ZÀ-ÿ]{3}/.test(nome)) continue;

        const tags = (campos[colunas.categories_tags] || '').split(',');
        const categoria = categoriaPelasTags(tags)
            || categoriaPeloNome(nome)
            || (tipo === 'b' ? 'Higiene' : 'Outros');

        vistos.add(codigo);
        aceitas++;
        linhas.push([
            codigo,
            nome.slice(0, 80),
            limpar(campos[colunas.brands]).split(',')[0].trim().slice(0, 30),
            limpar(campos[colunas.quantity]).slice(0, 20),
            categoria,
            tipo,
            arquivoDaFoto(campos[colunas.image_small_url], codigo),
        ].join('\t'));
    }
    console.log(`${tipo}: ${lidas} lidas, ${aceitas} aceitas`);
}

for (const fonte of FONTES) {
    try {
        await processar(fonte);
    } catch (err) {
        console.log(`${fonte.tipo}: falhou (${err.message})`);
    }
}

linhas.sort();
const destino = path.join(RAIZ, 'base-produtos.js');
fs.writeFileSync(
    destino,
    `// Gerado por scripts/gerar-base.mjs. Dados: Open Food Facts e bases irmãs (ODbL).\n`
    + `window.BASE_PRODUTOS = ${JSON.stringify(linhas.join('\n'))};\n`
);

const bruto = fs.statSync(destino).size;
const comprimido = zlib.gzipSync(fs.readFileSync(destino)).length;
console.log(`TOTAL ${linhas.length} produtos | ${(bruto / 1e6).toFixed(1)} MB | gzip ${(comprimido / 1e6).toFixed(1)} MB`);
