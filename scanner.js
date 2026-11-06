'use strict';

/* ================================================
   LEITOR DE CÓDIGO DE BARRAS
   Usa o BarcodeDetector nativo quando existe (Android). Nos demais (iPhone,
   Windows) carrega um leitor WASM só na primeira vez que for preciso.
   ================================================ */
const URL_LEITOR_WASM = 'https://cdn.jsdelivr.net/npm/barcode-detector@3.2.3/dist/iife/ponyfill.js';
const FORMATOS_PRODUTO = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
// Etiquetas e códigos internos de mercado (atacarejos, gôndolas, balança) usam estes
const FORMATOS_MERCADO = ['code_128', 'code_39', 'code_93', 'itf', 'codabar'];
const FORMATOS_LEITOR  = [...FORMATOS_PRODUTO, ...FORMATOS_MERCADO];
const INTERVALO_LEITURA = 120;
const JANELA_CONFIRMACAO = 2000;
const TEMPO_DICA_LEITURA = 8000;
const CAMERA_LANTERNA_KEY = 'lista-compras-camera-lanterna';
const TAMANHO_VIDEO = { width: { ideal: 1920 }, height: { ideal: 1080 } };

let detectorPronto = null;

const leitor = {
    aberto:   false,
    stream:   null,
    timer:    null,
    sessao:   0,     // invalida leituras e câmeras de uma sessão já encerrada
    ultimo:   '',
    ultimoEm: 0,
    inicio:   0,
    falhas:   0,
    lanterna: false,
    querLanterna: false,     // continua acesa entre uma leitura e outra
    ajustandoLanterna: false,
};

function carregarScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Não foi possível carregar o leitor'));
        document.head.appendChild(script);
    });
}

function obterDetector() {
    if (!detectorPronto) {
        detectorPronto = criarDetector().catch(err => {
            detectorPronto = null; // permite tentar de novo quando a internet voltar
            throw err;
        });
    }
    return detectorPronto;
}

async function criarDetector() {
    if ('BarcodeDetector' in window) {
        try {
            const suportados = await window.BarcodeDetector.getSupportedFormats();
            // Sem os formatos de mercado no nativo, o WASM lê todos
            if (FORMATOS_LEITOR.every(f => suportados.includes(f))) {
                return new window.BarcodeDetector({ formats: FORMATOS_LEITOR });
            }
        } catch (_) {}
    }
    await carregarScript(URL_LEITOR_WASM);
    return new window.BarcodeDetectionAPI.BarcodeDetector({ formats: FORMATOS_LEITOR });
}

// Código interno do mercado: só letras e números, para servir de chave na memória
function codigoMercadoLimpo(texto) {
    const limpo = String(texto || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    return limpo.length >= 3 && limpo.length <= 40 ? limpo : '';
}

// UPC-E tem dígito verificador próprio, então não passa pelo cálculo de GTIN.
// Código de produto (EAN) tem preferência; senão vale o código do mercado.
function codigoDaLeitura(resultados) {
    const produto = resultados.find(r => FORMATOS_PRODUTO.includes(r.format)
        && (r.format === 'upc_e' || gtinValido(r.rawValue)));
    if (produto) return produto.rawValue;

    for (const r of resultados) {
        if (!FORMATOS_MERCADO.includes(r.format)) continue;
        const limpo = codigoMercadoLimpo(r.rawValue);
        // ITF-14 de caixa fechada é um GTIN de verdade e pode estar nas bases
        if (limpo) return gtinValido(limpo) && limpo.length === 14 && limpo[0] === '0' ? limpo.slice(1) : limpo;
    }
    return '';
}

// EAN com prefixo 2 é de uso interno da loja (balança, etiquetas): não está em base pública
function codigoInterno(codigo) {
    return !gtinValido(codigo) || (codigo.length === 13 && codigo[0] === '2');
}

/* ================================================
   CÂMERA
   ================================================ */
function mostrarStatusLeitor(msg, tipo = '') {
    const el = document.getElementById('scannerStatus');
    el.textContent = msg;
    el.dataset.tipo = tipo;
}

function pararCamera() {
    leitor.sessao++;
    clearTimeout(leitor.timer);
    if (leitor.stream) {
        const trilha = leitor.stream.getVideoTracks()[0];
        // Alguns aparelhos deixam a luz acesa se a câmera parar sem apagar antes
        if (leitor.lanterna && trilha) trilha.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        leitor.stream.getTracks().forEach(t => t.stop());
        leitor.stream = null;
    }
    document.getElementById('scannerVideo').srcObject = null;
    // Sem câmera aberta não há lanterna, mas o botão fica no lugar para a tela não pular
    const lanterna = document.getElementById('btnLanterna');
    lanterna.classList.add('indisponivel');
    lanterna.classList.remove('sem-suporte');
    leitor.lanterna = false;
    mostrarEstadoLanterna();
}

function mostrarEstadoLanterna() {
    const botao = document.getElementById('btnLanterna');
    botao.classList.toggle('ativo', leitor.lanterna);
    botao.setAttribute('aria-pressed', String(leitor.lanterna));
    const semSuporte = botao.classList.contains('sem-suporte');
    document.getElementById('iconeLanterna').setAttribute('href', semSuporte ? '#i-flash-off' : '#i-flash');
    document.getElementById('textoLanterna').textContent =
        leitor.lanterna ? 'Luz ligada' : (semSuporte ? 'Sem lanterna' : 'Lanterna');
}

function mensagemErroCamera(err) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return 'Este navegador não libera a câmera aqui. Use a foto ou digite o código.';
    }
    if (err && err.name === 'NotAllowedError') {
        return 'Câmera bloqueada. Libere o acesso nas configurações do navegador, ou use a foto.';
    }
    if (err && err.name === 'NotFoundError') {
        return 'Nenhuma câmera encontrada. Use uma foto ou digite o código.';
    }
    return 'Não foi possível abrir a câmera. Use a foto ou digite o código.';
}

async function iniciarCamera() {
    pararCamera();
    const sessao = leitor.sessao;
    const area = document.getElementById('scanner');
    area.classList.remove('sem-camera');
    leitor.ultimo = '';
    leitor.falhas = 0;
    mostrarStatusLeitor('Abrindo a câmera...');
    document.getElementById('scanner').classList.remove('buscando');

    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('sem suporte');

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: videoDesejado(),
        });

        // O usuário pode ter fechado enquanto o navegador pedia a permissão
        if (sessao !== leitor.sessao) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }

        leitor.stream = stream;
        const video = document.getElementById('scannerVideo');
        video.srcObject = stream;
        await video.play();
        configurarTrilha(stream.getVideoTracks()[0]);
    } catch (err) {
        if (sessao !== leitor.sessao) return;
        console.error('Erro na câmera:', err);
        area.classList.add('sem-camera');
        mostrarStatusLeitor(mensagemErroCamera(err), 'erro');
        return;
    }

    mostrarStatusLeitor('Preparando o leitor...');
    try {
        await obterDetector();
    } catch (err) {
        if (sessao !== leitor.sessao) return;
        console.error('Erro ao carregar leitor:', err);
        mostrarStatusLeitor('Sem internet para carregar o leitor. Digite o código abaixo.', 'erro');
        return;
    }
    if (sessao !== leitor.sessao) return;

    comecarLeitura(sessao);

    // Volta acesa ao escanear o próximo produto ou ao retornar de outro app
    if (leitor.querLanterna) aplicarLanterna(true);
}

function comecarLeitura(sessao) {
    mostrarStatusLeitor('Aponte para o código de barras');
    leitor.inicio = Date.now();
    lerQuadro(sessao);
}

// Prefere a lente em que a lanterna já funcionou neste aparelho
function videoDesejado() {
    const video = { facingMode: { ideal: 'environment' }, ...TAMANHO_VIDEO };
    try {
        const salva = localStorage.getItem(CAMERA_LANTERNA_KEY);
        if (salva) video.deviceId = { ideal: salva };
    } catch (_) {}
    return video;
}

function configurarTrilha(trilha) {
    const botao = document.getElementById('btnLanterna');
    botao.classList.remove('indisponivel', 'sem-suporte');
    mostrarEstadoLanterna();

    const capacidades = trilha && trilha.getCapabilities ? trilha.getCapabilities() : {};
    if ((capacidades.focusMode || []).includes('continuous')) {
        trilha.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
    }
}

/* ================================================
   LANTERNA
   Cada celular se comporta de um jeito: há os que só informam a lanterna depois de a
   câmera estar rodando, os que exigem consultar o ImageCapture antes, e os que têm
   várias lentes traseiras, com o flash em só uma. Por isso o app não decide de
   antemão: tenta de verdade, confere se acendeu e só então desiste.
   ================================================ */
const esperar = ms => new Promise(resolve => setTimeout(resolve, ms));

async function acordarCamera(trilha) {
    if (!window.ImageCapture) return;
    try {
        // Pode travar em alguns aparelhos, então não espera para sempre
        await Promise.race([new window.ImageCapture(trilha).getPhotoCapabilities(), esperar(1200)]);
    } catch (_) {}
}

function lanternaConfere(trilha, ligar) {
    const ajustes = trilha.getSettings ? trilha.getSettings() : {};
    if ('torch' in ajustes) return ajustes.torch === ligar;
    // Sem esse dado no aparelho: apagar vale, e acender só se ele declarar a lanterna
    if (!ligar) return true;
    const capacidades = trilha.getCapabilities ? trilha.getCapabilities() : {};
    return !!capacidades.torch;
}

async function definirLanterna(trilha, ligar) {
    await acordarCamera(trilha);

    // Conjuntos separados: um pedido não suportado não anula o outro. O foco vai junto
    // porque cada novo pedido substitui o anterior.
    const pedidos = [
        { advanced: [{ torch: ligar }, { focusMode: 'continuous' }] },
        { advanced: [{ torch: ligar }] },
        { torch: ligar },
    ];

    for (let rodada = 0; rodada < 4; rodada++) {
        if (rodada > 0) await esperar(300);
        for (const pedido of pedidos) {
            // A câmera pode ter sido fechada enquanto o aparelho respondia
            if (trilha.readyState === 'ended') return false;
            try {
                await trilha.applyConstraints(pedido);
            } catch (_) {
                continue;
            }
            await esperar(120);
            if (lanternaConfere(trilha, ligar)) return true;
        }
    }
    return false;
}

// O flash pode estar em outra lente: abre uma por vez, porque muitos celulares
// não aceitam duas câmeras abertas ao mesmo tempo
async function ligarEmOutraCamera() {
    if (!navigator.mediaDevices.enumerateDevices) return false;

    const atual = leitor.stream && leitor.stream.getVideoTracks()[0];
    const idAtual = atual && atual.getSettings ? atual.getSettings().deviceId : '';
    const dispositivos = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    const candidatas = dispositivos.filter(d => d.kind === 'videoinput'
        && d.deviceId
        && d.deviceId !== idAtual
        && !/front|frontal|user|selfie/i.test(d.label));

    if (candidatas.length === 0) return false;

    for (const camera of candidatas) {
        pararCamera();
        const sessao = leitor.sessao;
        let stream = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { deviceId: { exact: camera.deviceId }, ...TAMANHO_VIDEO },
            });
            if (sessao !== leitor.sessao || !leitor.aberto) {
                stream.getTracks().forEach(t => t.stop());
                return false;
            }
            const trilha = stream.getVideoTracks()[0];
            if (await definirLanterna(trilha, true)) {
                if (sessao !== leitor.sessao || !leitor.aberto) {
                    stream.getTracks().forEach(t => t.stop());
                    return false;
                }
                leitor.stream = stream;
                const video = document.getElementById('scannerVideo');
                video.srcObject = stream;
                await video.play();
                document.getElementById('btnLanterna').classList.remove('indisponivel', 'sem-suporte');
                try {
                    localStorage.setItem(CAMERA_LANTERNA_KEY, camera.deviceId);
                } catch (_) {}
                comecarLeitura(sessao);
                return true;
            }
            stream.getTracks().forEach(t => t.stop());
        } catch (err) {
            console.warn('Lente sem acesso:', err.name);
            if (stream) stream.getTracks().forEach(t => t.stop());
        }
        if (!leitor.aberto) return false;
    }

    // Nenhuma lente acendeu: volta para a câmera de leitura
    await iniciarCamera();
    return false;
}

async function aplicarLanterna(ligar) {
    const botao = document.getElementById('btnLanterna');
    if (leitor.ajustandoLanterna) return;

    const trilha = leitor.stream && leitor.stream.getVideoTracks()[0];
    if (!trilha) return;

    leitor.ajustandoLanterna = true;
    const sessao = leitor.sessao;
    const textoAntes = document.getElementById('scannerStatus').textContent;
    if (ligar) mostrarStatusLeitor('Ligando a lanterna...');

    try {
        let certo = await definirLanterna(trilha, ligar);
        // Fechou ou trocou de câmera no meio: este pedido não vale mais
        if (sessao !== leitor.sessao) return;
        if (!certo && ligar) {
            mostrarStatusLeitor('Procurando a lente com flash...');
            certo = await ligarEmOutraCamera();
        }
        if (!leitor.aberto) return;

        leitor.lanterna = ligar && certo;
        leitor.querLanterna = leitor.lanterna;

        if (ligar && !certo) {
            botao.classList.add('sem-suporte');
            mostrarStatusLeitor('Este aparelho não libera a lanterna para o navegador. Tente em um lugar mais claro.', 'erro');
        } else if (ligar) {
            mostrarStatusLeitor(textoAntes === 'Ligando a lanterna...' ? 'Aponte para o código de barras' : textoAntes);
        }
        mostrarEstadoLanterna();
    } finally {
        leitor.ajustandoLanterna = false;
    }
}

function alternarLanterna() {
    if (!leitor.stream) return;
    if (document.getElementById('btnLanterna').classList.contains('sem-suporte')) {
        mostrarStatusLeitor('Este aparelho não libera a lanterna para o navegador. Tente em um lugar mais claro.', 'erro');
        return;
    }
    aplicarLanterna(!leitor.lanterna);
}

async function lerQuadro(sessao) {
    if (sessao !== leitor.sessao) return;

    const video = document.getElementById('scannerVideo');
    if (video.readyState >= 2) {
        try {
            const detector  = await obterDetector();
            const resultado = await detector.detect(video);
            if (sessao !== leitor.sessao) return;

            leitor.falhas = 0;
            const codigo = codigoDaLeitura(resultado);
            const agora  = Date.now();
            if (codigo) {
                // Confirma com outra leitura igual para evitar dígito trocado por imagem
                // tremida. Não precisa ser no quadro seguinte: na mão, muitos saem borrados.
                if (codigo === leitor.ultimo && agora - leitor.ultimoEm < JANELA_CONFIRMACAO) {
                    sinalizarLeitura();
                    processarCodigo(codigo);
                    return;
                }
                leitor.ultimo   = codigo;
                leitor.ultimoEm = agora;
            }
            if (agora - leitor.inicio > TEMPO_DICA_LEITURA && leitor.falhas === 0) {
                mostrarStatusLeitor('Não conseguiu? Afaste um pouco, evite reflexo ou digite os números.');
            }
        } catch (err) {
            if (sessao !== leitor.sessao) return;
            leitor.falhas++;
            if (leitor.falhas === 10) {
                console.error('Erro na leitura:', err);
                mostrarStatusLeitor('O leitor falhou. Digite o código abaixo.', 'erro');
            }
        }
    }

    leitor.timer = setTimeout(() => lerQuadro(sessao), INTERVALO_LEITURA);
}

function sinalizarLeitura() {
    if (navigator.vibrate) navigator.vibrate(60);
    try {
        const Contexto = window.AudioContext || window.webkitAudioContext;
        const audio = new Contexto();
        const osc   = audio.createOscillator();
        const vol   = audio.createGain();
        osc.frequency.value = 1320;
        vol.gain.value = 0.06;
        osc.connect(vol).connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + 0.09);
        osc.onended = () => audio.close();
    } catch (_) {}
}

/* ================================================
   ABRIR / FECHAR
   ================================================ */
function abrirScanner({ manterLanterna = false } = {}) {
    leitor.aberto = true;
    if (!manterLanterna) leitor.querLanterna = false;
    document.getElementById('scanner').classList.remove('hidden');
    document.getElementById('scanner').classList.remove('buscando');
    document.getElementById('inputCodigo').value = '';
    iniciarCamera();
}

function fecharScanner() {
    leitor.aberto = false;
    pararCamera();
    document.getElementById('scanner').classList.add('hidden');
}

/* ================================================
   DO CÓDIGO AO PRODUTO
   ================================================ */
async function processarCodigo(codigo) {
    pararCamera();
    const sessao = leitor.sessao;
    document.getElementById('scanner').classList.add('buscando');
    mostrarStatusLeitor(`Procurando ${codigo}...`);

    const naLista = state.itens.find(i => i.codigo === codigo);
    if (naLista) {
        fecharScanner();
        abrirRepetidoDoScanner(naLista.id);
        return;
    }

    const lembrado = produtoNaMemoria(codigo);
    if (lembrado) {
        fecharScanner();
        abrirProdutoDoScanner({ ...lembrado, fonte: '' }, 'lembrado');
        return;
    }

    let produto = null;
    let situacao = 'encontrado';
    if (codigoInterno(codigo)) {
        situacao = 'codigo-mercado';
    } else {
        try {
            produto = await buscarProduto(codigo);
            if (!produto) situacao = 'nao-encontrado';
        } catch (err) {
            console.error('Erro ao consultar produto:', err);
            situacao = 'sem-conexao';
        }
    }

    // Fechou o leitor enquanto a busca rodava
    if (sessao !== leitor.sessao || !leitor.aberto) return;

    fecharScanner();
    abrirProdutoDoScanner(produto || { codigo }, situacao);
}

function enviarCodigoDigitado() {
    const input  = document.getElementById('inputCodigo');
    const codigo = codigoMercadoLimpo(input.value);
    // Com tamanho de EAN, os números precisam fechar; outros tamanhos são do mercado
    const pareceEan = /^(\d{8}|\d{12,14})$/.test(codigo);

    if (!codigo || (pareceEan && !gtinValido(codigo))) {
        mostrarStatusLeitor('Código inválido. Confira os números embaixo das barras.', 'erro');
        input.focus();
        return;
    }
    input.blur();
    processarCodigo(codigo);
}

async function lerFotoEscolhida(arquivo) {
    if (!arquivo) return;
    pararCamera();
    const sessao = leitor.sessao;
    const area = document.getElementById('scanner');
    // "buscando" impede a câmera de religar ao voltar do seletor de arquivos
    area.classList.add('buscando');
    mostrarStatusLeitor('Lendo a foto...');

    try {
        const detector  = await obterDetector();
        const imagem    = await createImageBitmap(arquivo);
        const resultado = await detector.detect(imagem);
        imagem.close();
        if (sessao !== leitor.sessao) return;

        const codigo = codigoDaLeitura(resultado);
        if (codigo) {
            sinalizarLeitura();
            processarCodigo(codigo);
            return;
        }
        area.classList.remove('buscando');
        area.classList.add('sem-camera');
        mostrarStatusLeitor('Não achei um código na foto. Tente mais de perto, ou digite os números.', 'erro');
    } catch (err) {
        console.error('Erro ao ler foto:', err);
        if (sessao !== leitor.sessao) return;
        area.classList.remove('buscando');
        area.classList.add('sem-camera');
        mostrarStatusLeitor('Não foi possível ler a foto. Digite o código abaixo.', 'erro');
    }
}

function bindScanner() {
    document.getElementById('btnFecharScanner').addEventListener('click', fecharScanner);
    document.getElementById('btnLanterna').addEventListener('click', alternarLanterna);
    document.getElementById('btnEnviarCodigo').addEventListener('click', enviarCodigoDigitado);
    document.getElementById('inputCodigo').addEventListener('keydown', e => {
        if (e.key === 'Enter') enviarCodigoDigitado();
    });

    const inputFoto = document.getElementById('inputFoto');
    document.getElementById('btnFoto').addEventListener('click', () => inputFoto.click());
    inputFoto.addEventListener('change', () => {
        lerFotoEscolhida(inputFoto.files[0]);
        inputFoto.value = '';
    });

    // Celular derruba a câmera ao trocar de app: libera ao sair e reabre ao voltar
    document.addEventListener('visibilitychange', () => {
        if (!leitor.aberto || document.getElementById('scanner').classList.contains('buscando')) return;
        if (document.hidden) pararCamera();
        else iniciarCamera();
    });
}
