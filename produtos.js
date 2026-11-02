'use strict';

/* ================================================
   MEMÓRIA DE PRODUTOS
   Guarda neste aparelho o que já foi comprado (nome, unidade, categoria
   e último preço). Fica fora da lista compartilhada, de propósito.
   ================================================ */
const MEMORIA_KEY = 'lista-compras-memoria-v1';
const MEMORIA_MAX = 300;

function lerMemoria() {
    try {
        return JSON.parse(localStorage.getItem(MEMORIA_KEY)) || {};
    } catch (_) {
        return {};
    }
}

function chaveMemoria(produto) {
    return produto.codigo || `n:${normalizar(produto.nome)}`;
}

function lembrarProduto(item) {
    const memoria = lerMemoria();
    const chave   = chaveMemoria(item);
    const antigo  = memoria[chave] || {};

    memoria[chave] = {
        nome:      item.nome,
        unidade:   item.unidade,
        categoria: item.categoria,
        codigo:    item.codigo  || '',
        imagem:    item.imagem  || '',
        detalhe:   item.detalhe || '',
        // Item sem preço não apaga o último preço conhecido
        preco:     item.preco > 0 ? item.preco : (antigo.preco || 0),
        usadoEm:   Date.now(),
    };

    const chaves = Object.keys(memoria);
    if (chaves.length > MEMORIA_MAX) {
        chaves.sort((a, b) => memoria[a].usadoEm - memoria[b].usadoEm)
            .slice(0, chaves.length - MEMORIA_MAX)
            .forEach(c => delete memoria[c]);
    }

    try {
        localStorage.setItem(MEMORIA_KEY, JSON.stringify(memoria));
    } catch (_) {}
}

function produtoNaMemoria(codigo) {
    return lerMemoria()[codigo] || null;
}

function precoLembrado(nome) {
    const salvo = lerMemoria()[`n:${normalizar(nome)}`];
    return salvo ? salvo.preco : 0;
}

/* ================================================
   SUGESTÕES AO DIGITAR
   ================================================ */

// Quanto menor, melhor. -1 = não combina. Todas as palavras precisam aparecer,
// em qualquer ordem: "fini morango" encontra "Bala Fini Morango Aros".
function pontuarBusca(chave, q) {
    const termos = q.split(/\s+/);
    if (!termos.every(t => chave.includes(t))) return -1;

    const primeiro = termos[0];
    const pos      = chave.indexOf(primeiro);
    const seguinte = chave[pos + primeiro.length];
    // "coca" prefere "Coca-Cola" a "Cocada": palavra inteira vem antes de pedaço
    const pedaco   = seguinte && /[a-z0-9]/.test(seguinte) ? 0.25 : 0;

    if (pos === 0) return pedaco;
    const inicioDePalavra = chave.includes(` ${primeiro}`) || chave.includes(`-${primeiro}`);
    return (inicioDePalavra ? 1 : 2) + pedaco;
}

function sugerirProdutos(texto, limite = 8) {
    const q = normalizar(texto);
    if (q.length < 2) return [];

    const nomes     = new Set();
    const codigos   = new Set();
    const pontuados = [];

    const memoria = Object.values(lerMemoria()).sort((a, b) => b.usadoEm - a.usadoEm);
    memoria.forEach(p => {
        const chave  = normalizar(p.nome);
        const pontos = pontuarBusca(chave, q);
        if (pontos < 0 || nomes.has(chave)) return;
        nomes.add(chave);
        if (p.codigo) codigos.add(p.codigo);
        pontuados.push({ ...p, origem: 'memoria', pontos });
    });

    CATALOGO.forEach(p => {
        const pontos = pontuarBusca(p.chave, q);
        if (pontos < 0 || nomes.has(p.chave)) return;
        nomes.add(p.chave);
        pontuados.push({
            nome: p.nome, categoria: p.categoria, unidade: p.unidade,
            codigo: '', imagem: '', detalhe: '', preco: 0,
            // No mesmo nível, o que você já comprou vem antes do catálogo, e ele antes da base:
            // "ban" sugere "Banana" antes de qualquer cadastro que comece com "Ban"
            origem: 'catalogo', pontos: Math.floor(pontos) + 0.3,
        });
    });

    (baseProdutos || []).forEach(p => {
        const pontos = pontuarBusca(p.chave, q);
        if (pontos < 0 || codigos.has(p.codigo)) return;
        // Cadastro completo primeiro: com foto, marca e tamanho
        const incompleto = (p.arquivo ? 0 : 0.1) + (p.marca ? 0 : 0.05) + (p.quantidade ? 0 : 0.03);
        pontuados.push({ ...p, pontos: pontos + 0.5 + incompleto + p.nome.length / 10000 });
    });

    // A base tem o mesmo produto cadastrado mais de uma vez
    const repetidos = new Set();
    return pontuados
        .sort((a, b) => a.pontos - b.pontos)
        .filter(p => {
            if (p.origem !== 'base') return true;
            const assinatura = `${p.chave}|${normalizar(p.quantidade)}`;
            if (repetidos.has(assinatura)) return false;
            repetidos.add(assinatura);
            return true;
        })
        .slice(0, limite)
        .map(p => (p.origem === 'base' ? produtoDaLinha(p) : p));
}

/* ================================================
   BASE DE PRODUTOS BRASILEIROS
   A busca por nome do Open Food Facts não libera CORS. Por isso os produtos do
   Brasil ficam em base-produtos.js (ver scripts/gerar-base.mjs), carregado só
   quando for preciso. Por ser um script, funciona também abrindo o arquivo direto.
   ================================================ */
const BASE_POR_TIPO = {
    f: { host: 'images.openfoodfacts.org',     nome: 'Open Food Facts' },
    b: { host: 'images.openbeautyfacts.org',   nome: 'Open Beauty Facts' },
    p: { host: 'images.openproductsfacts.org', nome: 'Open Products Facts' },
    a: { host: 'images.openpetfoodfacts.org',  nome: 'Open Pet Food Facts' },
};

let baseProdutos   = null;
let basePorCodigo  = null;
let baseCarregando = null;

function carregarBaseProdutos() {
    if (!baseCarregando) {
        baseCarregando = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'base-produtos.js';
            script.onload = () => {
                prepararBase(window.BASE_PRODUTOS || '');
                delete window.BASE_PRODUTOS;
                resolve();
            };
            script.onerror = () => {
                baseCarregando = null; // permite tentar de novo quando a internet voltar
                reject(new Error('Não foi possível carregar a base de produtos'));
            };
            document.head.appendChild(script);
        });
    }
    return baseCarregando;
}

function prepararBase(texto) {
    basePorCodigo = new Map();
    baseProdutos = texto.split('\n').filter(Boolean).map(linha => {
        const [codigo, nome, marca, quantidade, categoria, tipo, arquivo] = linha.split('\t');
        const p = {
            codigo, nome, marca, quantidade, categoria, tipo, arquivo,
            origem: 'base',
            chave:  normalizar(`${nome} ${marca}`),
        };
        basePorCodigo.set(codigo, p);
        return p;
    });
}

// Monta o produto completo só para quem vai aparecer na tela
function produtoDaLinha(p) {
    const base  = BASE_POR_TIPO[p.tipo] || BASE_POR_TIPO.f;
    const pasta = p.codigo.length === 13
        ? p.codigo.replace(/^(\d{3})(\d{3})(\d{3})(\d{4})$/, '$1/$2/$3/$4')
        : p.codigo;

    return {
        codigo:    p.codigo,
        nome:      p.nome.toUpperCase(),
        detalhe:   montarDetalhe(p.nome, p.marca, p.quantidade),
        imagem:    p.arquivo ? `https://${base.host}/images/products/${pasta}/${p.arquivo}` : '',
        unidade:   'un',
        categoria: p.categoria,
        preco:     0,
        origem:    'base',
        fonte:     base.nome,
    };
}

function produtoDaBase(codigo) {
    const linha = basePorCodigo && basePorCodigo.get(codigo);
    return linha ? produtoDaLinha(linha) : null;
}

/* ================================================
   CATEGORIA AUTOMÁTICA
   ================================================ */

// Em português o substantivo principal vem primeiro: em "Biscoito sabor limão"
// vale "biscoito". Por isso ganha o termo mais cedo no nome, depois o mais longo.
function categoriaPeloNome(nome) {
    // Sem o "s" final, "Balas" também encontra "Bala"
    const palavras = texto => ` ${normalizar(texto).replace(/[^a-z0-9]+/g, ' ').replace(/s\b/g, '').trim()} `;
    const alvo = palavras(nome);
    let melhor = null;

    CATALOGO.forEach(p => {
        const termo = palavras(p.chave);
        const pos   = alvo.indexOf(termo);
        if (pos === -1) return;
        if (!melhor || pos < melhor.pos || (pos === melhor.pos && termo.length > melhor.tam)) {
            melhor = { pos, tam: termo.length, categoria: p.categoria };
        }
    });

    return melhor ? melhor.categoria : null;
}

// Tags genéricas como "plant-based-foods-and-beverages" aparecem em quase todo
// alimento vegetal: a ordem e os padrões abaixo evitam cair nelas.
const CATEGORIA_POR_TAG = [
    [/^(dairies|cheeses|milks|yogurts|condensed-milks|butters|creams|fermented-milk-products)/, 'Laticínios'],
    [/^(beverages|bebida|bebidas|waters|sodas|juices|wines|beers|alcoholic-beverages|fruit-juices)/, 'Bebidas'],
    [/^(frozen|ice-creams|surgeles)/, 'Congelados'],
    [/^(meats|poultries|fishes|seafood|sausages|prepared-meats|eggs)/, 'Carnes'],
    [/^(breads|bakery)/, 'Padaria'],
    [/^(fruits|fresh-fruits|apples|bananas|citrus)/, 'Frutas'],
    [/^(vegetables|fresh-vegetables)/, 'Verduras'],
    [/^(rices|legumes|cereals-and-potatoes|cereal-grains|flours|beans|seeds)/, 'Grãos'],
    [/^(condiments|sauces|spices|salts|vinegars|dressings)/, 'Temperos'],
    [/^(snacks|biscuits|chocolates|sweeteners|sugars|pastas|coffees|teas|vegetable-oils|fats|breakfasts|canned-foods|confectioneries)/, 'Mercearia'],
    [/^(cleaning|detergents|household)/, 'Limpeza'],
    [/^(hygiene|cosmetics|personal-care|deodorants|shampoos|toothpastes|soaps)/, 'Higiene'],
];

function categoriaPelasTags(tags) {
    const slugs = (tags || []).map(t => normalizar(t).replace(/^[a-z]{2}:/, ''));
    for (const [padrao, categoria] of CATEGORIA_POR_TAG) {
        if (slugs.some(s => padrao.test(s))) return categoria;
    }
    return null;
}

/* ================================================
   OPEN FOOD FACTS — CONSULTA POR CÓDIGO DE BARRAS
   Sem chave de API e com CORS liberado, então funciona direto do navegador.
   As bases irmãs (higiene, produtos gerais e pet) têm a mesma API.
   ================================================ */
const BASES_PRODUTO = {
    food:    { host: 'world.openfoodfacts.org',     nome: 'Open Food Facts' },
    beauty:  { host: 'world.openbeautyfacts.org',   nome: 'Open Beauty Facts' },
    product: { host: 'world.openproductsfacts.org', nome: 'Open Products Facts' },
    petfood: { host: 'world.openpetfoodfacts.org',  nome: 'Open Pet Food Facts' },
};

const ESPERAS_NOVA_TENTATIVA = [800, 2000];
const CAMPOS_PRODUTO = 'product_name,product_name_pt,generic_name_pt,brands,quantity,categories_tags,image_front_small_url';

async function consultarBase(tipo, codigo) {
    const url = `https://${BASES_PRODUTO[tipo].host}/api/v2/product/${codigo}.json?lc=pt&fields=${CAMPOS_PRODUTO}`;
    const controle = new AbortController();
    const limite   = setTimeout(() => controle.abort(), 9000);

    try {
        let resposta = await fetch(url, { signal: controle.signal });
        // 429 (muitas consultas seguidas) e 503 (pico de acesso) costumam passar logo
        for (const espera of ESPERAS_NOVA_TENTATIVA) {
            if (resposta.status !== 429 && resposta.status !== 503) break;
            await new Promise(ok => setTimeout(ok, espera));
            resposta = await fetch(url, { signal: controle.signal });
        }
        // 404 é uma resposta válida: o corpo traz "product not found"
        if (!resposta.ok && resposta.status !== 404) throw new Error(`HTTP ${resposta.status}`);
        return await resposta.json();
    } finally {
        clearTimeout(limite);
    }
}

function montarDetalhe(nome, marca, quantidade) {
    const temMarca = marca && normalizar(nome).includes(normalizar(marca));
    return [temMarca ? '' : marca, quantidade].filter(Boolean).join(' · ');
}

function montarProduto(tipo, codigo, p) {
    const marca = (p.brands || '').split(',')[0].trim();
    // Há cadastros só com a marca: melhor mostrar "Fini" do que dizer que não existe
    const nome  = (p.product_name_pt || p.product_name || p.generic_name_pt || marca).trim();
    if (!nome) return null;

    const detalhe = montarDetalhe(nome, marca, (p.quantity || '').trim());

    const categoria = categoriaPelasTags(p.categories_tags)
        || categoriaPeloNome(nome)
        || (tipo === 'beauty' ? 'Higiene' : 'Outros');

    return {
        codigo,
        nome:   nome.toUpperCase().slice(0, 80),
        detalhe,
        imagem: p.image_front_small_url || '',
        // A API informa o tamanho da embalagem ("395 g"), não quanto comprar.
        // Por isso entra como 1 unidade, e o preço é o da embalagem.
        unidade: 'un',
        categoria,
        fonte: BASES_PRODUTO[tipo].nome,
    };
}

// Retorna o produto, null (não cadastrado) ou lança erro (rede/serviço fora do ar)
async function buscarProdutoOnline(codigo) {
    let tipo = 'food';
    let dados = await consultarBase(tipo, codigo);

    // Ex.: "product found with a different product type: beauty"
    const outraBase = /different product type: (\w+)/.exec(dados.status_verbose || '');
    if (outraBase && BASES_PRODUTO[outraBase[1]]) {
        tipo  = outraBase[1];
        dados = await consultarBase(tipo, codigo);
    }

    return dados.status === 1 && dados.product ? montarProduto(tipo, codigo, dados.product) : null;
}

// Online primeiro, por ter os cadastros mais novos. Se falhar, usa a base embutida.
async function buscarProduto(codigo) {
    let produto = null;
    let erro = null;
    try {
        produto = await buscarProdutoOnline(codigo);
    } catch (err) {
        erro = err;
    }
    if (produto) return produto;

    await carregarBaseProdutos().catch(() => {});
    const local = produtoDaBase(codigo);
    if (local) return local;

    if (erro) throw erro;
    return null;
}

/* ================================================
   VALIDAÇÃO DE CÓDIGO DE BARRAS (GTIN-8/12/13/14)
   ================================================ */
function gtinValido(codigo) {
    if (!/^(\d{8}|\d{12,14})$/.test(codigo)) return false;
    const digitos = [...codigo].map(Number);
    const verificador = digitos.pop();
    const soma = digitos.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
    return (10 - (soma % 10)) % 10 === verificador;
}

// Só aceita imagens das bases usadas: listas compartilhadas vêm de outros aparelhos
function imagemSegura(url) {
    return /^https:\/\/images\.open(food|beauty|products|petfood)facts\.org\//.test(url || '') ? url : '';
}
