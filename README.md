# Gerenciador de Tarefas com Calendário (Todo List 2.0)

Uma aplicação web moderna e responsiva para gerenciamento de tarefas pessoais, integrada a um calendário mensal interativo. Desenvolvida com HTML5, CSS3 e JavaScript puro (Vanilla JS), com foco em usabilidade e persistência de dados local.
🔗 Acesse o projeto: https://gameredija.github.io/task-calendar/

## ✨ Funcionalidades

### 📅 Gestão por Data e Horário
- **Calendário Mensal**: Visualização em grid de todo o mês, permitindo navegação fácil entre meses e anos.
- **Seleção de Data**: Clique em qualquer dia para visualizar ou adicionar tarefas específicas para aquela data.
- **Indicadores Visuais**: Dias com tarefas pendentes ou concluídas são marcados visualmente no calendário (badge com contagem).
- **Tarefas com Horário**: Possibilidade de definir horário para cada tarefa, com ordenação automática.

### 📝 Gerenciamento de Tarefas
- **CRUD Completo**: Adicionar, Listar, Editar e Remover tarefas.
- **Edição Inline**: Edite o texto e o horário da tarefa diretamente na lista, sem popups intrusivos.
- **Confirmação de Exclusão**: Mecanismo de segurança "clique duplo" ou confirmação temporária para evitar remoções acidentais.
- **Feedback Visual**: Animações sutis ao adicionar, concluir ou remover itens.

### 🔍 Filtros e Organização
- **Filtros de Status**: Visualize "Todas", "Pendentes" ou "Concluídas".
- **Resumo Diário**: Contador rápido de tarefas totais, pendentes e concluídas no topo da lista.

### 📱 Interface Responsiva
- **Design Adaptativo**: 
  - **Desktop**: Layout de duas colunas (Calendário à esquerda, Tarefas à direita).
  - **Mobile**: Layout de coluna única otimizado para telas menores.
- **Estilização Moderna**: Uso de variáveis CSS, sombras suaves, bordas arredondadas e paleta de cores consistente (Azul/Cinza).

---

## 🚀 Como Usar

1. **Navegar pelo Calendário**:
   - Use as setas `<` e `>` no topo do calendário para mudar de mês.
   - O dia atual é sempre destacado.
   - Dias com tarefas possuem um pequeno indicador numérico.

2. **Adicionar Tarefa**:
   - Selecione um dia no calendário (ou use o dia atual selecionado por padrão).
   - Preencha o campo de descrição da tarefa.
   - (Opcional) Ajuste o horário.
   - Clique em "Adicionar" ou pressione `Enter`.

3. **Gerenciar Tarefas**:
   - **Concluir**: Clique no botão "Concluir" para marcar/desmarcar. Tarefas concluídas ficam riscadas e opacas.
   - **Editar**: Clique em "Editar". Os campos de texto e horário se tornam editáveis. Salve ou cancele as alterações.
   - **Remover**: Clique em "Remover". O botão mudará para "Confirmar". Clique novamente para excluir permanentemente.

4. **Filtrar**:
   - Use o seletor no topo da lista para alternar entre ver todas as tarefas, apenas as pendentes ou apenas as concluídas.

---

## 💾 Estrutura de Dados no localStorage

Os dados são persistidos no navegador do usuário utilizando a chave `lista_tarefas`. A estrutura é um objeto JSON onde as chaves são as datas (formato ISO `YYYY-MM-DD`) e os valores são arrays de tarefas.

**Exemplo de estrutura:**

```json
{
  "2023-10-25": [
    {
      "id": "k8s7d6f5-a1b2-c3d4-e5f6-g7h8i9j0k1l2",
      "text": "Reunião de Projeto",
      "time": "14:30",
      "completed": false
    },
    {
      "id": "m9n0o1p2-q3r4-s5t6-u7v8-w9x0y1z2a3b4",
      "text": "Comprar leite",
      "time": "18:00",
      "completed": true
    }
  ],
  "2023-11-02": [
    {
      "id": "12345678-abcd-efgh-ijkl-mnopqrstuvwx",
      "text": "Pagar conta de luz",
      "time": "",
      "completed": false
    }
  ]
}
```

### Detalhes dos Campos:
- **key (Data)**: String no formato `YYYY-MM-DD`. Usada para indexar as listas de tarefas por dia.
- **id**: Identificador único da tarefa (UUID ou timestamp gerado).
- **text**: Descrição da tarefa.
- **time**: Horário da tarefa (formato `HH:MM`) ou string vazia.
- **completed**: Booleano (`true`/`false`) indicando o status da tarefa.

---

## 🛠 Tecnologias

- **HTML5**: Estrutura semântica.
- **CSS3**: Flexbox, Grid Layout, Media Queries, CSS Variables e Animações (`@keyframes`).
- **JavaScript (ES6+)**: Manipulação de DOM, Event Listeners, LocalStorage API, Arrow Functions e Módulos (Organização via Objetos).

---

## 📂 Estrutura de Arquivos

```
/
├── index.html      # Estrutura principal da página
├── style.css       # Estilos, temas e responsividade
├── script.js       # Lógica da aplicação (Estado, Renderização, Eventos)
└── Readme.md       # Documentação do projeto
```
