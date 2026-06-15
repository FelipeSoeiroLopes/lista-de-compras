<div align="center">
  <h1>🛒 Lista de Compras — v11</h1>
  <p><strong>App web para gerenciar compras no supermercado — com compartilhamento ao vivo</strong></p>
  <p>
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white"/>
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white"/>
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black"/>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Versão-11.0-6c5ce7?style=for-the-badge"/>
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
| ➕ **Adicionar itens** | Modal moderno — nome, quantidade, unidade, preço e categoria |
| ✅ **Marcar como pego** | Toque no item para marcar/desmarcar. Borda verde + riscado |
| 🔗 **Compartilhamento ao vivo** | Gera código de 6 chars — qualquer pessoa com o link vê e edita em tempo real via Firestore |
| 🟢 **Badge ao vivo** | Indicador no header com animação pulse enquanto a lista está compartilhada |
| 🏷️ **12 categorias** | Frutas, Carnes, Laticínios, Bebidas, Limpeza e mais |
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

## 🔗 Como usar o compartilhamento ao vivo

```
1. Toque em 🔗 no header
2. O app gera um código único (ex: H4C7BQ) e salva no Firestore
3. Copie o link ou envie pelo WhatsApp para quem vai ao mercado
4. A outra pessoa abre o link e já vê a lista completa
5. Qualquer mudança (marcar pego, adicionar item) aparece
   instantaneamente para todos com o link
6. Badge 🟢 H4C7BQ fica no header enquanto a lista está ativa
7. Para encerrar: clique no badge → "Parar compartilhamento"
   (a lista é deletada do servidor automaticamente)
```

---

## 📲 Como usar no mercado

```
1. Em casa: abra o app e toque em "+" para adicionar os itens
2. Defina quantidade, unidade (kg, un, L...) e preço estimado
3. Para kg/g: o preço é sempre por kg (etiqueta do mercado)
   Ex: 500g de carne a R$25,90/kg → digita 500 em "g" e 25,90 no preço
4. Compartilhe ao vivo com 🔗 ou por texto com 📤
5. No mercado: toque no item para marcar como "pego" ✅
6. Use o filtro "Pendentes" para ver só o que ainda falta
7. Acompanhe o total no rodapé em tempo real
```

---

## 🎨 Interface

```
┌──────────────────────────────────────────┐
│ 🛒 Lista de Compras  [🟢 H4C7BQ][🔗][📤][🌙]│
│ ████████░░░░░░░  3 de 8 itens • 37%     │
├──────────────────────────────────────────┤
│ 🔍 Buscar item...                    [✕]│
│ [Todos] [Pendentes] [Pegos ✓]           │
│ [Todas] [🍎 Frutas] [🥩 Carnes]...     │
├──────────────────────────────────────────┤
│ ↕ Ordem  │ [Limpar pegos] [Limpar tudo] │
├──────────────────────────────────────────┤
│ ⭕ MAÇÃ         🍎 Frutas    ✏️ 🗑️    │
│   1,5 kg • R$ 8,90/kg = R$ 13,35       │
│ ✅ ~~LEITE~~    🥛 Laticínios           │
├──────────────────────────────────────────┤
│ Total estimado            R$ 87,50  [+] │
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
- **Inter** (Google Fonts) como tipografia

---

## 👨‍💻 Autor

<img src="https://img.shields.io/badge/-Felipe%20Soeiro%20Lopes-181717?style=flat-square&logo=github&logoColor=white"/>

![Status](https://img.shields.io/badge/Status-Ativo-10b981?style=for-the-badge)
![Versão](https://img.shields.io/badge/Versão-11.0-6c5ce7?style=for-the-badge)

---

<div align="center">
  <sub>Desenvolvido com ❤️ para facilitar suas compras no mercado</sub>
</div>
