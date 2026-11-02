<div align="center">
  <h1>🛒 Lista de Compras — v12</h1>
  <p><strong>App web para gerenciar compras no supermercado — com compartilhamento ao vivo</strong></p>
  <p>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white"/>
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white"/>
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black"/>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Versão-12.0-6c5ce7?style=for-the-badge"/>
    <img src="https://img.shields.io/badge/Mobile%20First-✓-10b981?style=for-the-badge"/>
    <img src="https://img.shields.io/badge/Dark%20Mode-✓-1e293b?style=for-the-badge"/>
    <img src="https://img.shields.io/badge/Tempo%20Real-Firestore-FF6F00?style=for-the-badge&logo=firebase&logoColor=white"/>
  </p>
</div>

---

<p align="center">
  <a href="https://felipesoeirolopes.github.io/lista-de-compras/" target="_blank">
    <img src="https://img.shields.io/badge/Acesse%20o%20App-Clique%20Aqui-6c5ce7?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Abrir App"/>
  </a>
</p>

---

## 📱 Feito para usar no mercado

Crie a lista em casa, compartilhe um código com quem está no mercado e acompanhe em tempo real quais itens já foram pegos — tudo sem precisar de login.

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---|---|
| 📷 **Escanear código de barras** | A câmera lê o código, o nome e a foto vêm sozinhos e você só informa quantidade e valor. Também aceita foto ou o código digitado |
| 🧠 **Memória de produtos** | Lembra neste aparelho o que você já comprou, com o último preço. Funciona sem internet |
| 🔎 **Busca por nome ou marca** | Digite "fini morango" e escolha entre mais de 42 mil produtos do Brasil, com foto. Funciona sem internet |
| 🎓 **Tutorial guiado** | Abre na primeira visita e pode ser revisto no botão "?" |
| ➕ **Adicionar itens** | Modal moderno — nome, quantidade, unidade, preço e categoria |
| ✅ **Marcar como pego** | Toque no item para marcar/desmarcar. Borda verde + riscado |
| 🔗 **Compartilhamento ao vivo** | Gera código de 6 chars — qualquer pessoa com o link vê e edita em tempo real via Firestore |
| 🟢 **Badge ao vivo** | Indicador no header com animação pulse enquanto a lista está compartilhada |
| 🏷️ **13 categorias** | Frutas, Carnes, Laticínios, Bebidas, Mercearia, Limpeza e mais |
| 🔍 **Busca em tempo real** | Encontre qualquer item enquanto digita |
| 🔽 **Filtros de status** | Todos / Pendentes / Pegos — foco no que ainda falta |
| 🗂️ **Filtros por categoria** | Chips clicáveis para navegar por seção do mercado |
| ↕️ **Ordenação** | Por adição, A–Z, categoria, preço ↑ ou ↓ |
| 💰 **Total em tempo real** | Calculado automaticamente, sempre visível no rodapé |
| 💡 **Lógica de mercado** | Preço sempre por kg/L — 500g × R$11,90/kg = R$5,95 (não R$5.950) |
| 💳 **Máscara de preço** | Input estilo caixa eletrônico: digita 890 → R$ 8,90 |
| 📊 **Barra de progresso** | "3 de 8 itens pegos" no topo com porcentagem |
| ↩️ **Desfazer exclusão** | Toast com botão "Desfazer" por 4,5 segundos |
| 📤 **Compartilhar texto** | Share nativo no celular ou copia texto formatado para WhatsApp |
| 🌙 **Dark mode** | Alterna entre claro e escuro — salva a preferência |
| ✏️ **Editar itens** | Reabre o modal com os dados para atualizar |
| 🗑️ **Limpar pegos / tudo** | Com modal de confirmação customizado |
| 💾 **Salva automaticamente** | LocalStorage — dados persistem entre sessões |

---

## 🔐 Acesso e segurança

- **Admin:** entra com login e senha, validados pelo Firebase Authentication. Só ele cria e encerra listas compartilhadas.
- **Link compartilhado:** abre direto, sem login, e edita somente os itens daquela lista. O identificador tem 24 caracteres aleatórios.
- **Banco:** quem protege os dados é o `firestore.rules`. Sem publicar essas regras no Firebase, o banco não fica protegido.
- **Chave do Firebase:** fica criptografada em `firebase-config.js` (AES-256-GCM), e a senha não fica gravada no código. Isso só esconde a chave do código-fonte: ela volta a ser legível no navegador de quem entra, então não substitui as regras.

Para trocar a senha, use `scripts/gerar-cofre.mjs` e troque também no Firebase Authentication.

---

## 📷 Como funciona o leitor

- **Produtos:** consulta o [Open Food Facts](https://world.openfoodfacts.org) e as bases irmãs (higiene, produtos gerais e pet). Não precisa de chave de API. Os dados são colaborativos e têm licença ODbL.
- **Busca por nome:** a busca online da base não libera o acesso pelo navegador, então os produtos do Brasil ficam em `base-produtos.js`, carregado só quando for preciso. Para atualizar, rode `node scripts/gerar-base.mjs`.
- **Produto sem cadastro:** você digita o nome ou escolhe um produto da lista, e o app lembra daquele código neste aparelho.
- **Preços:** a base não informa preço de mercado, então o valor é digitado por você e fica guardado como último preço.
- **Câmera:** exige HTTPS (o GitHub Pages já usa) ou `localhost`. O leitor usa o `BarcodeDetector` nativo quando existe e, nos outros navegadores, carrega um leitor WASM (`barcode-detector`) só quando for preciso.

---

## 🔗 Como usar o compartilhamento ao vivo

```
1. Entre como admin e toque em ⋮ no header → "Lista ao vivo"
2. O app gera um link único e salva a lista no Firestore
3. Copie o link ou envie pelo WhatsApp para quem vai ao mercado
4. A outra pessoa abre o link, sem login, e já vê a lista completa
5. Qualquer mudança (marcar pego, adicionar item) aparece
   instantaneamente para todos com o link
6. O indicador "Ao vivo" fica no header enquanto a lista está ativa
7. Para encerrar, o admin clica no indicador → "Parar compartilhamento"
   (a lista é deletada do servidor automaticamente)
```

---

## 📲 Como usar no mercado

```
1. Toque em "Escanear" e aponte para o código de barras, ou em "+" para digitar o nome
2. Defina quantidade, unidade (kg, un, L...) e valor
3. Para kg/g: o preço é sempre por kg (etiqueta do mercado)
   Ex: 500g de carne a R$25,90/kg → digita 500 em "g" e 25,90 no preço
4. Compartilhe ao vivo ou por texto pelo menu ⋮
5. No mercado: toque no item para marcar como "pego" ✅
6. Use o filtro "Faltam" para ver só o que ainda falta
7. Acompanhe o total no rodapé em tempo real
```

---

## 🎨 Interface

```
┌──────────────────────────────────────────┐
│ Lista de Compras      [● Ao vivo] [?] [⋮] │
│ ████████░░░░░░░  3 de 8 itens pegos  37% │
├──────────────────────────────────────────┤
│ 🔍 Buscar na lista...                    │
│ [Todos] [Faltam] [Pegos]                 │
│ [Todas] [🍎 Frutas] [🥩 Carnes]...       │
├──────────────────────────────────────────┤
│ ○ 🍎 Maçã                      R$ 13,35  │
│      Frutas · R$ 8,90/kg                 │
│      [− 1,5 kg +]                ✏️  🗑️   │
│ ✓ 🥛 ~~Leite~~                  R$ 5,49  │
├──────────────────────────────────────────┤
│ Total estimado                           │
│ R$ 87,50            [▌▌ Escanear]  [+]   │
└──────────────────────────────────────────┘
```

---

## 📱 Responsividade Mobile

- **iOS Safari**: Safe areas (notch + barra home) com `env(safe-area-inset-*)`
- **Footer sempre visível**: `height: 100%` herdado (não `100vh`) evita que o footer suma
- **Sem zoom em inputs**: font-size mínimo 16px em todos os campos
- **Touch delay**: `touch-action: manipulation` em todos os botões
- **Telas pequenas**: media query `≤390px` compacta paddings automaticamente
- **min-height: 0** no scroll container — fix essencial para flex no mobile

---

## 🛠️ Tecnologias

- **HTML5** semântico com atributos de acessibilidade (`aria-*`)
- **CSS3** — variáveis, `env()`, `backdrop-filter`, animações, `@keyframes`
- **JavaScript** puro — sem frameworks, state-based rendering
- **Firebase Firestore** — banco em tempo real para compartilhamento ao vivo
- **LocalStorage** para persistência offline da lista pessoal
- **Web Share API** para compartilhamento nativo no celular
- **Open Food Facts API** e bases irmãs para consulta por código de barras
- **BarcodeDetector API** e `barcode-detector` (WASM) para a leitura pela câmera
- **Bricolage Grotesque** e **Figtree** (Google Fonts) como tipografia

---

## 👨‍💻 Autor

<img src="https://img.shields.io/badge/-Felipe%20Soeiro%20Lopes-181717?style=flat-square&logo=github&logoColor=white"/>

![Status](https://img.shields.io/badge/Status-Ativo-10b981?style=for-the-badge)
![Versão](https://img.shields.io/badge/Versão-12.0-6c5ce7?style=for-the-badge)

---

<div align="center">
  <sub>Desenvolvido com ❤️ para facilitar suas compras no mercado</sub>
</div>
