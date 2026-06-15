<div align="center">
  <h1>🛒 Lista de Compras — v10</h1>
  <p><strong>App web para gerenciar compras no supermercado</strong></p>
  <p>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white"/>
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white"/>
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Versão-10.0-6c5ce7?style=for-the-badge"/>
    <img src="https://img.shields.io/badge/Mobile%20First-✓-10b981?style=for-the-badge"/>
    <img src="https://img.shields.io/badge/Dark%20Mode-✓-1e293b?style=for-the-badge"/>
    <img src="https://img.shields.io/badge/Offline-LocalStorage-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white"/>
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

Abra no celular, adicione seus itens em casa e use no supermercado: toque para marcar o que já pegou, veja o total crescer em tempo real e compartilhe a lista no WhatsApp.

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---|---|
| ➕ **Adicionar itens** | Modal moderno — sem `prompt()`. Nome, quantidade, unidade, preço e categoria |
| ✅ **Marcar como pego** | Toque no item para marcar/desmarcar. Borda verde + riscado |
| 🏷️ **12 categorias** | Frutas, Carnes, Laticínios, Bebidas, Limpeza e mais |
| 🔍 **Busca em tempo real** | Encontre qualquer item enquanto digita |
| 🔽 **Filtros de status** | Todos / Pendentes / Pegos — foco no que ainda falta |
| 🗂️ **Filtros por categoria** | Chips clicáveis para navegar por seção do mercado |
| ↕️ **Ordenação** | Por adição, A–Z, categoria, preço ↑ ou ↓ |
| 💰 **Total em tempo real** | Calculado automaticamente, sempre visível no rodapé |
| 📊 **Barra de progresso** | "3 de 8 itens pegos" no topo com porcentagem |
| ↩️ **Desfazer exclusão** | Toast com botão "Desfazer" por 4,5 segundos |
| 📤 **Compartilhar** | Share nativo no celular ou copia texto para WhatsApp |
| 🌙 **Dark mode** | Alterna entre claro e escuro — salva a preferência |
| ✏️ **Editar itens** | Reabre o modal com os dados para atualizar |
| 🗑️ **Limpar pegos / tudo** | Com modal de confirmação customizado |
| 💾 **Salva automaticamente** | LocalStorage — dados persistem entre sessões |
| 📲 **Migração automática** | Importa dados da versão anterior sem perder nada |

---

## 📲 Como usar no mercado

```
1. Em casa: abra o app e toque em "+" para adicionar os itens
2. Defina quantidade, unidade (kg, un, L...) e preço estimado
3. Escolha a categoria de cada item
4. No mercado: toque no item para marcar como "pego" ✅
5. Use o filtro "Pendentes" para ver só o que ainda falta
6. Acompanhe o total no rodapé em tempo real
7. Compartilhe a lista via WhatsApp com o botão 📤
```

---

## 🎨 Interface

```
┌─────────────────────────────────────┐
│ 🛒 Lista de Compras     [📤] [🌙]  │  ← Header com dark mode e share
│ ████████░░░░░░░  3 de 8 • 37%      │  ← Barra de progresso
├─────────────────────────────────────┤
│ 🔍 Buscar item...               [✕]│  ← Busca
│ [Todos] [Pendentes] [Pegos ✓]      │  ← Filtros de status
│ [Todas] [🍎 Frutas] [🥩 Carnes].. │  ← Filtros de categoria
├─────────────────────────────────────┤
│ ↕ Ordem  │ [Limpar pegos] [Limpar] │  ← Toolbar
├─────────────────────────────────────┤
│ ⭕ MAÇÃ             🍎 Frutas  ✏️🗑│
│   2 kg • R$ 5,90/kg = R$ 11,80    │
│ ✅ ~~LEITE~~        🥛 Laticínios  │  ← Item pego
├─────────────────────────────────────┤
│ Total estimado        R$ 87,50  [+]│  ← Rodapé fixo com FAB
└─────────────────────────────────────┘
```

---

## 📱 Responsividade Mobile

- **iOS Safari**: Safe areas (notch + barra home) com `env(safe-area-inset-*)`
- **Sem zoom em inputs**: font-size mínimo 16px em todos os campos
- **Teclado virtual**: modal sobe junto com o teclado no iOS/Android
- **Touch delay**: `touch-action: manipulation` em todos os botões
- **Scroll suave**: `-webkit-overflow-scrolling: touch` na lista
- **Viewport dinâmica**: `100dvh` ajusta quando a barra do browser aparece/some
- **Touch targets**: mínimo 34px em todos os elementos interativos

---

## 🛠️ Tecnologias

- **HTML5** semântico com atributos de acessibilidade (`aria-*`)
- **CSS3** — variáveis, `dvh`, `env()`, `backdrop-filter`, animações
- **JavaScript** puro — sem dependências, state-based rendering
- **LocalStorage** para persistência offline
- **Web Share API** para compartilhamento nativo no celular
- **Inter** (Google Fonts) como tipografia

---

## 👨‍💻 Autor

<img src="https://img.shields.io/badge/-Felipe%20Soeiro%20Lopes-181717?style=flat-square&logo=github&logoColor=white"/>

![Status](https://img.shields.io/badge/Status-Ativo-10b981?style=for-the-badge)
![Versão](https://img.shields.io/badge/Versão-10.0-6c5ce7?style=for-the-badge)

---

<div align="center">
  <sub>Desenvolvido com ❤️ para facilitar suas compras no mercado</sub>
</div>
