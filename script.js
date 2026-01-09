// ============================================================================
// 1. ESTADO
// ============================================================================

const state = {
  selectedDate: null,
  filterMode: 'all',
  currentMonth: new Date(),
  config: {
    storageKey: 'lista_tarefas'
  }
};

// Inicializa currentMonth no dia 1
state.currentMonth.setDate(1);

// ============================================================================
// 2. SELETORES
// ============================================================================

const dom = {
  // Formulário
  form: document.getElementById('form-tarefas'),
  inputs: {
    text: document.getElementById('input-tarefa'),
    date: document.getElementById('input-data'),
    time: document.getElementById('input-horario')
  },
  btnAdd: document.getElementById('botao-adicionar'), // Fallback no init

  // Listagem
  list: document.getElementById('lista-tarefas'),
  filter: document.getElementById('filtro-tarefas'),
  dateDisplay: document.getElementById('display-data-selecionada'),
  summary: document.getElementById('resumo-tarefas'),

  // Calendário
  calendar: {
    title: document.getElementById('titulo-calendario'),
    grid: document.getElementById('calendario-grid'),
    btnPrev: document.getElementById('btn-mes-anterior'),
    btnNext: document.getElementById('btn-mes-proximo')
  }
};

// ============================================================================
// 3. STORAGE
// ============================================================================

const storage = {
  get() {
    const raw = localStorage.getItem(state.config.storageKey);
    if (!raw) return {};
    try {
      const data = JSON.parse(raw);
      return (typeof data === 'object' && data !== null && !Array.isArray(data)) ? data : {};
    } catch (e) {
      console.error('Erro no Storage:', e);
      return {};
    }
  },

  set(data) {
    localStorage.setItem(state.config.storageKey, JSON.stringify(data));
  },

  getForDate(date) {
    const all = this.get();
    return all[date] || [];
  },

  saveForDate(date, tasks) {
    const all = this.get();
    if (tasks.length > 0) {
      all[date] = tasks;
    } else {
      delete all[date];
    }
    this.set(all);
  },

  generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  migrate() {
    const raw = localStorage.getItem(state.config.storageKey);
    if (!raw) return;
    
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        console.info('Migrando dados antigos...');
        const today = calendar.getTodayString();
        const newData = {};
        
        newData[today] = data.map(old => ({
          id: old.id || this.generateId(),
          text: old.text || old.texto || 'Tarefa sem nome',
          time: old.time || old.horario || '',
          completed: old.completed || false
        }));
        
        this.set(newData);
      }
    } catch (e) {
      console.error('Erro na migração:', e);
    }
  }
};

// ============================================================================
// 4. CALENDAR
// ============================================================================

const calendar = {
  getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  formatFriendly(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    
    const now = new Date();
    const isToday = now.getDate() === d && 
                    now.getMonth() === (m - 1) && 
                    now.getFullYear() === y;
                    
    const text = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    return isToday ? `Hoje, ${text}` : text;
  },

  changeMonth(delta) {
    state.currentMonth.setMonth(state.currentMonth.getMonth() + delta);
    render.calendar();
  },

  getDaysDetails(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      totalDays: lastDay.getDate(),
      startDayOfWeek: firstDay.getDay()
    };
  }
};

// ============================================================================
// 5. TASKS
// ============================================================================

const tasks = {
  add(text, time) {
    if (!state.selectedDate) state.selectedDate = calendar.getTodayString();
    
    const list = storage.getForDate(state.selectedDate);
    const newTask = {
      id: storage.generateId(),
      text: text.trim(),
      time: time || '',
      completed: false
    };
    
    list.push(newTask);
    storage.saveForDate(state.selectedDate, list);
    
    render.tasks(state.selectedDate, newTask.id);
    render.calendar();
  },

  update(id, newText, newTime) {
    if (!state.selectedDate) return;
    const list = storage.getForDate(state.selectedDate);
    const task = list.find(t => t.id === id);
    
    if (task) {
      task.text = newText;
      task.time = newTime;
      storage.saveForDate(state.selectedDate, list);
      render.tasks(state.selectedDate);
      render.calendar();
    }
  },

  toggle(id) {
    if (!state.selectedDate) return;
    const list = storage.getForDate(state.selectedDate);
    const task = list.find(t => t.id === id);
    
    if (task) {
      task.completed = !task.completed;
      storage.saveForDate(state.selectedDate, list);
      render.tasks(state.selectedDate);
      render.calendar();
    }
  },

  remove(id) {
    if (!state.selectedDate) return;
    let list = storage.getForDate(state.selectedDate);
    list = list.filter(t => t.id !== id);
    
    storage.saveForDate(state.selectedDate, list);
    render.tasks(state.selectedDate);
    render.calendar();
  }
};

// ============================================================================
// 6. RENDER
// ============================================================================

const render = {
  tasks(date, highlightId = null) {
    const targetDate = date || state.selectedDate;
    
    if (dom.dateDisplay) {
      dom.dateDisplay.textContent = calendar.formatFriendly(targetDate);
    }

    dom.list.innerHTML = '';
    const allTasks = storage.getForDate(targetDate);
    this.summary(allTasks);

    // Filtragem
    let filtered = allTasks;
    if (state.filterMode === 'pending') filtered = allTasks.filter(t => !t.completed);
    if (state.filterMode === 'completed') filtered = allTasks.filter(t => t.completed);

    // Estado vazio
    if (!filtered.length) {
      this.emptyState(allTasks.length);
      return;
    }

    // Ordenação (com horário primeiro)
    const sorted = filtered.slice().sort((a, b) => {
      const ta = a.time || '';
      const tb = b.time || '';
      if (ta === '' && tb !== '') return 1;
      if (ta !== '' && tb === '') return -1;
      return ta.localeCompare(tb);
    });

    // Renderização
    sorted.forEach(task => {
      const el = this.createElement(task);
      if (highlightId && task.id === highlightId) {
        el.classList.add('just-added');
        setTimeout(() => el.classList.remove('just-added'), 800);
      }
      dom.list.appendChild(el);
    });
  },

  createElement(task) {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('tarefa-concluida');

    // Informações
    const info = document.createElement('div');
    info.classList.add('info-tarefa');
    
    if (task.time) {
      const timeSpan = document.createElement('span');
      timeSpan.className = 'info-data-horario';
      timeSpan.textContent = `${task.time} — `;
      timeSpan.style.marginRight = '0.3rem';
      timeSpan.style.color = '#6b7280';
      info.appendChild(timeSpan);
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'texto-tarefa';
    textSpan.textContent = task.text;
    info.appendChild(textSpan);

    // Ações
    const actions = document.createElement('div');
    actions.className = 'acoes-tarefa';

    // Botão Concluir
    const btnToggle = document.createElement('button');
    btnToggle.type = 'button';
    btnToggle.className = 'botao-concluir';
    btnToggle.textContent = task.completed ? 'Reabrir' : 'Concluir';
    btnToggle.title = btnToggle.textContent;
    btnToggle.onclick = (e) => {
      e.stopPropagation();
      tasks.toggle(task.id);
    };

    // Botão Editar
    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.textContent = 'Editar';
    btnEdit.className = 'botao-editar';
    
    if (task.completed) {
      btnEdit.disabled = true;
    } else {
      btnEdit.onclick = (e) => {
        e.stopPropagation();
        this.activateEditMode(li, task);
      };
    }

    // Botão Remover (com confirmação inline)
    const btnRemove = document.createElement('button');
    btnRemove.type = 'button';
    btnRemove.textContent = 'Remover';
    btnRemove.className = 'botao-remover';
    
    let confirmTimeout;
    
    btnRemove.onclick = (e) => {
      e.stopPropagation();
      
      if (btnRemove.dataset.confirming === 'true') {
        clearTimeout(confirmTimeout);
        tasks.remove(task.id);
      } else {
        btnRemove.dataset.confirming = 'true';
        btnRemove.textContent = 'Confirmar';
        btnRemove.classList.add('botao-confirmar');
        
        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.textContent = 'Cancelar';
        btnCancel.className = 'botao-cancelar-remocao';
        
        actions.insertBefore(btnCancel, btnRemove);
        
        const reset = () => {
          btnRemove.dataset.confirming = 'false';
          btnRemove.textContent = 'Remover';
          btnRemove.classList.remove('botao-confirmar');
          if (btnCancel.parentNode) btnCancel.remove();
        };

        btnCancel.onclick = (ev) => {
          ev.stopPropagation();
          clearTimeout(confirmTimeout);
          reset();
        };
        
        confirmTimeout = setTimeout(reset, 2000);
      }
    };

    actions.append(btnToggle, btnEdit, btnRemove);
    li.append(info, actions);
    return li;
  },

  activateEditMode(li, task) {
    li.innerHTML = '';
    li.classList.add('modo-edicao-ativo');

    const container = document.createElement('div');
    container.className = 'modo-edicao';

    const inputTime = document.createElement('input');
    inputTime.type = 'time';
    inputTime.value = task.time;
    inputTime.ariaLabel = 'Editar horário';

    const inputText = document.createElement('input');
    inputText.type = 'text';
    inputText.value = task.text;
    inputText.ariaLabel = 'Editar descrição';

    const actions = document.createElement('div');
    actions.className = 'acoes-edicao';

    const btnSave = document.createElement('button');
    btnSave.textContent = 'Salvar';
    btnSave.className = 'botao-salvar';
    btnSave.onclick = (e) => {
      e.stopPropagation();
      const newText = inputText.value.trim();
      if (!newText) {
        alert('O texto é obrigatório.');
        inputText.focus();
        return;
      }
      tasks.update(task.id, newText, inputTime.value);
    };

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancelar';
    btnCancel.className = 'botao-cancelar';
    btnCancel.onclick = (e) => {
      e.stopPropagation();
      this.tasks(state.selectedDate);
    };

    inputText.onkeypress = (e) => {
      if (e.key === 'Enter') btnSave.click();
    };

    actions.append(btnSave, btnCancel);
    container.append(inputTime, inputText, actions);
    li.appendChild(container);
    setTimeout(() => inputText.focus(), 50);
  },

  summary(tasks) {
    if (!dom.summary) return;
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    
    dom.summary.innerHTML = `
      <span class="badge-resumo">Total: ${total}</span>
      <span class="badge-resumo pendente">Pend: ${total - completed}</span>
      <span class="badge-resumo concluida">Conc: ${completed}</span>
    `;
  },

  emptyState(total) {
    const li = document.createElement('li');
    let msg = 'Nenhuma tarefa para este dia';
    if (state.filterMode === 'pending') msg = 'Nenhuma tarefa pendente';
    if (state.filterMode === 'completed') msg = 'Nenhuma tarefa concluída';
    if (total === 0) msg = 'Nenhuma tarefa para este dia';
    
    li.textContent = msg;
    li.className = 'mensagem-vazia';
    li.style.cssText = 'border: none; background: transparent;';
    dom.list.appendChild(li);
  },

  calendar() {
    if (!dom.calendar.grid) return;
    
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    const allData = storage.get();

    dom.calendar.title.textContent = state.currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    dom.calendar.grid.innerHTML = '';

    const { startDayOfWeek, totalDays } = calendar.getDaysDetails(year, month);

    // Dias vazios
    for (let i = 0; i < startDayOfWeek; i++) {
      const div = document.createElement('div');
      div.className = 'calendario-dia dia-vazio';
      dom.calendar.grid.appendChild(div);
    }

    // Dias preenchidos
    const today = new Date();
    for (let d = 1; d <= totalDays; d++) {
      const div = document.createElement('div');
      div.className = 'calendario-dia day';
      div.textContent = d;

      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      if (isToday) div.classList.add('dia-atual', 'today');

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (dateStr === state.selectedDate) div.classList.add('dia-selecionado', 'selected');

      const dayTasks = allData[dateStr];
      if (dayTasks && dayTasks.length > 0) {
        div.classList.add('has-tasks');
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = dayTasks.length > 9 ? '9+' : dayTasks.length;
        div.appendChild(badge);
      }

      div.onclick = () => events.selectDate(dateStr);
      dom.calendar.grid.appendChild(div);
    }
  },

  error(msg, field) {
    const el = document.createElement('div');
    el.className = 'mensagem-erro';
    el.textContent = msg;
    el.setAttribute('role', 'alert');
    dom.form.parentNode.insertBefore(el, dom.form);
    setTimeout(() => el.remove(), 3000);

    if (field) {
      field.focus();
      const btn = dom.btnAdd || dom.form.querySelector('button[type="submit"]');
      if (btn) {
        btn.classList.add('botao-erro');
        setTimeout(() => btn.classList.remove('botao-erro'), 1500);
      }
    }
  }
};

// ============================================================================
// 7. EVENTS
// ============================================================================

const events = {
  init() {
    if (!dom.form || !dom.list) return;

    // Inicialização de Estado
    storage.migrate();
    state.selectedDate = calendar.getTodayString();
    
    // Configura UI Inicial
    dom.inputs.date.value = state.selectedDate;
    if (!dom.btnAdd) dom.btnAdd = document.getElementById('botao-adicionar');

    // Render Inicial
    render.tasks(state.selectedDate);
    render.calendar();

    // Bind Eventos
    this.bind();
  },

  bind() {
    dom.form.addEventListener('submit', this.handleSubmit);
    dom.inputs.date.addEventListener('change', (e) => this.selectDate(e.target.value));
    
    if (dom.filter) {
      dom.filter.addEventListener('change', (e) => {
        state.filterMode = e.target.value;
        render.tasks();
      });
    }

    if (dom.calendar.btnPrev) {
      dom.calendar.btnPrev.addEventListener('click', () => calendar.changeMonth(-1));
      dom.calendar.btnNext.addEventListener('click', () => calendar.changeMonth(1));
    }
  },

  handleSubmit(e) {
    e.preventDefault();
    const text = dom.inputs.text.value;
    const date = dom.inputs.date.value;
    const time = dom.inputs.time.value;

    if (!text.trim()) return render.error('A descrição é obrigatória.', dom.inputs.text);
    if (!date) return render.error('Selecione uma data.', dom.inputs.date);
    if (!time) return render.error('Selecione um horário.', dom.inputs.time);

    state.selectedDate = date;
    tasks.add(text, time);

    dom.inputs.text.value = '';
    dom.inputs.time.value = '';
    dom.inputs.text.focus();
  },

  selectDate(dateStr) {
    state.selectedDate = dateStr;
    dom.inputs.date.value = dateStr;
    
    // Sincroniza mês do calendário se necessário
    const [y, m] = dateStr.split('-').map(Number);
    if (state.currentMonth.getMonth() !== m - 1 || state.currentMonth.getFullYear() !== y) {
      state.currentMonth = new Date(y, m - 1, 1);
      render.calendar();
    } else {
      // Apenas re-renderiza para atualizar seleção visual
      render.calendar();
    }
    
    render.tasks(dateStr);
  }
};

// Start
document.addEventListener('DOMContentLoaded', () => events.init());
