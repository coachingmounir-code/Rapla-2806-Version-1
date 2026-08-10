export interface SeminarTodo {
  id: string;
  seminarTitle: string;
  seminarDate: string;
  text: string;
  category: 'check' | 'prepare' | 'communicate' | 'materials';
  status: 'pending' | 'completed';
  reminderTime: string | null; // "YYYY-MM-DDTHH:MM" format
  notified: boolean;
}

export class TodoManager {
  todos = $state<SeminarTodo[]>([]);
  activeReminder = $state<SeminarTodo | null>(null);

  constructor() {
    this.load();
  }

  load() {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('seminar_todos');
      if (data) {
        try {
          this.todos = JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse seminar todos', e);
        }
      }
    }
  }

  save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seminar_todos', JSON.stringify(this.todos));
    }
  }

  addTodo(
    seminarTitle: string,
    seminarDate: string,
    text: string,
    category: SeminarTodo['category'],
    reminderTime: string | null
  ) {
    const newTodo: SeminarTodo = {
      id: 'todo-' + Math.random().toString(36).substr(2, 9),
      seminarTitle,
      seminarDate,
      text,
      category,
      status: 'pending',
      reminderTime,
      notified: false
    };
    this.todos.push(newTodo);
    this.save();
  }

  toggleTodo(id: string) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.status = todo.status === 'completed' ? 'pending' : 'completed';
      if (todo.status === 'pending') {
        todo.notified = false;
      }
      this.save();
    }
  }

  deleteTodo(id: string) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.save();
  }

  snoozeTodo(id: string) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 15);
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      todo.reminderTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      todo.notified = false;
      if (this.activeReminder?.id === id) {
        this.activeReminder = null;
      }
      this.save();
    }
  }

  dismissReminder(id: string) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.notified = true;
      if (this.activeReminder?.id === id) {
        this.activeReminder = null;
      }
      this.save();
    }
  }

  checkReminders() {
    if (this.activeReminder) return;
    
    const now = new Date();
    for (const todo of this.todos) {
      if (todo.status === 'pending' && !todo.notified && todo.reminderTime) {
        const remDate = new Date(todo.reminderTime);
        if (remDate <= now) {
          this.activeReminder = todo;
          break;
        }
      }
    }
  }
}

export const todoManager = new TodoManager();
