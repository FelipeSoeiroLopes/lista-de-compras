'use strict';

/* ================================================
   LEITOR DE CÓDIGO DE BARRAS
   Usa o BarcodeDetector nativo quando existe (Android). Nos demais (iPhone,
   Windows) carrega um leitor WASM só na primeira vez que for preciso.
   ================================================ */
const URL_LEITOR_WASM = 'https://cdn.jsdelivr.net/npm/barcode-detector@3.2.3/dist/iife/ponyfill.js';
const FORMATOS_LEITOR = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
const INTERVALO_LEITURA = 120;
const JANELA_CONFIRMACAO = 2000;
const TEMPO_DICA_LEITURA = 8000;

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
            if (suportados.includes('ean_13')) {
                return new window.BarcodeDetector({ formats: FORMATOS_LEITOR.filter(f => suportados.includes(f)) });
            }
        } catch (_) {}
    }
    await carregarScript(URL_LEITOR_WASM);
    return new window.BarcodeDetectionAPI.BarcodeDetector({ formats: FORMATOS_LEITOR });
}

// UPC-E tem dígito verificador próprio, então não passa pelo cálculo de GTIN
function codigoDaLeitura(resultados) {
    const valido = resultados.find(r => r.format === 'upc_e' || gtinValido(r.rawValue));
    return valido ? valido.rawValue : '';
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
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
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

    mostrarStatusLeitor('Aponte para o código de barras');
    leitor.inicio = Date.now();
    lerQuadro(sessao);
}

function configurarTrilha(trilha) {
    const capacidades = trilha && trilha.getCapabilities ? trilha.getCapabilities() : {};
    const botao = document.getElementById('btnLanterna');

    // Fica sempre à vista: se o aparelho não liberar a lanterna, o toque explica o motivo
    botao.classList.remove('indisponivel');
    botao.classList.toggle('sem-suporte', !capacidades.torch);
    mostrarEstadoLanterna();

    if ((capacidades.focusMode || []).includes('continuous')) {
        trilha.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
    }
}

async function alternarLanterna() {
    const trilha = leitor.stream && leitor.stream.getVideoTracks()[0];
    if (!trilha) return;

    const semLanterna = 'Este aparelho não libera a lanterna para o navegador. Tente em um lugar mais claro.';
    if (document.getElementById('btnLanterna').classList.contains('sem-suporte')) {
        mostrarStatusLeitor(semLanterna, 'erro');
        return;
    }

    try {
        await trilha.applyConstraints({ advanced: [{ torch: !leitor.lanterna }] });
        leitor.lanterna = !leitor.lanterna;
    } catch (_) {
        mostrarStatusLeitor(semLanterna, 'erro');
    }
    mostrarEstadoLanterna();
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
function abrirScanner() {
    leitor.aberto = true;
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
    try {
        produto = await buscarProduto(codigo);
        if (!produto) situacao = 'nao-encontrado';
    } catch (err) {
        console.error('Erro ao consultar produto:', err);
        situacao = 'sem-conexao';
    }

    // Fechou o leitor enquanto a busca rodava
    if (sessao !== leitor.sessao || !leitor.aberto) return;

    fecharScanner();
    abrirProdutoDoScanner(produto || { codigo }, situacao);
}

function enviarCodigoDigitado() {
    const input  = document.getElementById('inputCodigo');
    const codigo = input.value.replace(/\D/g, '');

    if (!gtinValido(codigo)) {
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
