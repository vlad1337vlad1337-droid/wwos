

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Task, ProductionItem, Influencer, Status, WarehouseItem, WarehouseLog, User, UserRole, ShootProject, DesignProject, SupportTicket, Report, FinanceTransaction, LogEntry, ExpenseItem, ShiftState, Priority, TaskTag, ScheduleEvent, TeamMember, EventTypeDefinition } from './types';
import { MOCK_TASKS, MOCK_PRODUCTION, MOCK_INFLUENCERS, MOCK_WAREHOUSE, MOCK_WAREHOUSE_LOGS, MOCK_SHOOTS, MOCK_TICKETS, MOCK_REPORTS, MOCK_FINANCE, MOCK_LOGS, MOCK_EXPENSES, MOCK_TEAM, MOCK_SCHEDULE, DEFAULT_EVENT_TYPES } from './constants';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PlannerContextType {
  currentUser: User;
  switchRole: (role: UserRole) => void;
  notification: Notification | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Deep Linking
  focusedEntityId: string | null;
  navigateTo: (tab: string, entityId?: string) => void;
  clearFocusedEntity: () => void;

  tasks: Task[];
  production: ProductionItem[];
  influencers: Influencer[];
  warehouse: WarehouseItem[];
  warehouseLogs: WarehouseLog[];
  shoots: ShootProject[];
  design: DesignProject[];
  tickets: SupportTicket[];
  reports: Report[];
  finance: FinanceTransaction[];
  expenses: ExpenseItem[];
  logs: LogEntry[];
  shift: ShiftState;
  schedule: ScheduleEvent[];
  team: TeamMember[];
  eventTypes: EventTypeDefinition[];
  
  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: Status) => void;
  deleteTask: (id: string) => void;
  
  addProduction: (item: ProductionItem) => void;
  updateProductionProgress: (id: string, progress: number) => void;
  updateProductionStage: (id: string, stage: ProductionItem['stage']) => void;
  updateProductionItem: (id: string, data: Partial<ProductionItem>) => void;
  payProduction: (id: string, rubAmount: number, method: 'Card' | 'Account') => void;
  
  addInfluencer: (influencer: Influencer) => void;
  updateInfluencer: (id: string, data: Partial<Influencer>) => void;
  updateInfluencerStatus: (id: string, status: Influencer['status']) => void;
  deleteInfluencer: (id: string) => void;

  updateStock: (itemId: string, qty: number, action: 'Отправка' | 'Приемка' | 'Возврат') => void;
  addWarehouseItem: (item: WarehouseItem) => void;
  deleteWarehouseItem: (id: string) => void;
  
  startShift: () => void;
  endShift: () => void;

  addShoot: (shoot: ShootProject) => void;
  updateShoot: (id: string, data: Partial<ShootProject>) => void;
  updateShootStatus: (id: string, status: ShootProject['status']) => void;
  approveShootBudget: (id: string) => void;
  deleteShoot: (id: string) => void;
  
  addDesign: (design: DesignProject) => void;
  updateDesign: (id: string, data: Partial<DesignProject>) => void;
  updateDesignStatus: (id: string, status: DesignProject['status']) => void;
  deleteDesign: (id: string) => void;

  addTicket: (ticket: SupportTicket) => void;
  addTicketMessage: (ticketId: string, text: string, sender: 'client' | 'support') => void;
  closeTicket: (id: string) => void;

  addReport: (report: Report) => void;
  getCompletedTasksForToday: () => Task[];
  
  addExpense: (expense: ExpenseItem) => void;
  updateExpense: (id: string, data: Partial<ExpenseItem>) => void;
  deleteExpense: (id: string) => void;

  addScheduleEvent: (event: ScheduleEvent) => void;
  updateScheduleEvent: (id: string, data: Partial<ScheduleEvent>) => void;
  deleteScheduleEvent: (id: string) => void;
  
  addTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;
  
  addEventType: (type: EventTypeDefinition) => void;
  deleteEventType: (id: string) => void;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

const USERS: Record<UserRole, User> = {
  OWNER: { name: 'Алексей', role: 'OWNER', avatar: 'AL' },
  MANAGER: { name: 'Мария', role: 'MANAGER', avatar: 'MA' },
  WAREHOUSE: { name: 'Степан', role: 'WAREHOUSE', avatar: 'ST' },
  EXTERNAL: { name: 'Внештатник', role: 'EXTERNAL', avatar: 'EX' }
};

// Initial Design Data (Empty for new structure)
const INITIAL_DESIGN: DesignProject[] = [
  { 
      id: 'd-1', 
      title: 'Худи Zip-Up', 
      type: 'Одежда', 
      status: 'Сэмпл', 
      deadline: '2023-11-01',
      canvasData: { layers: [], pins: [], lastModified: new Date().toISOString() }
  }
];

// Helper for localStorage
const usePersistedState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(error);
    }
  }, [key, state]);

  return [state, setState];
};

export const PlannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(USERS.OWNER);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [focusedEntityId, setFocusedEntityId] = useState<string | null>(null);

  // Persisted States
  const [tasks, setTasks] = usePersistedState<Task[]>('tasks', MOCK_TASKS);
  const [production, setProduction] = usePersistedState<ProductionItem[]>('production', MOCK_PRODUCTION);
  const [influencers, setInfluencers] = usePersistedState<Influencer[]>('influencers', MOCK_INFLUENCERS);
  const [warehouse, setWarehouse] = usePersistedState<WarehouseItem[]>('warehouse', MOCK_WAREHOUSE);
  const [warehouseLogs, setWarehouseLogs] = usePersistedState<WarehouseLog[]>('warehouseLogs', MOCK_WAREHOUSE_LOGS);
  const [shoots, setShoots] = usePersistedState<ShootProject[]>('shoots', MOCK_SHOOTS);
  const [design, setDesign] = usePersistedState<DesignProject[]>('design', INITIAL_DESIGN);
  const [tickets, setTickets] = usePersistedState<SupportTicket[]>('tickets', MOCK_TICKETS);
  const [reports, setReports] = usePersistedState<Report[]>('reports', MOCK_REPORTS);
  const [finance, setFinance] = usePersistedState<FinanceTransaction[]>('finance', MOCK_FINANCE);
  const [expenses, setExpenses] = usePersistedState<ExpenseItem[]>('expenses', MOCK_EXPENSES);
  const [logs, setLogs] = usePersistedState<LogEntry[]>('logs', MOCK_LOGS);
  const [shift, setShift] = usePersistedState<ShiftState>('shift', { isActive: false, startTime: null, tasksDone: 0 });
  const [schedule, setSchedule] = usePersistedState<ScheduleEvent[]>('schedule', MOCK_SCHEDULE);
  const [team, setTeam] = usePersistedState<TeamMember[]>('team', MOCK_TEAM);
  const [eventTypes, setEventTypes] = usePersistedState<EventTypeDefinition[]>('eventTypes', DEFAULT_EVENT_TYPES);

  // Ref to prevent rapid-fire automated task creation (Autonomous Reflex)
  const autoTaskCreatedRef = useRef<Set<string>>(new Set());

  const switchRole = (role: UserRole) => {
    setCurrentUser(USERS[role]);
    showNotification(`Роль переключена: ${role}`, 'info');
    setActiveTab('dashboard');
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ id: Date.now(), message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const navigateTo = (tab: string, entityId?: string) => {
    setActiveTab(tab);
    if (entityId) {
        setFocusedEntityId(entityId);
    }
  };

  const clearFocusedEntity = () => setFocusedEntityId(null);

  // Helper to log actions
  const logAction = (action: string, target: string, type: 'info' | 'warning' | 'success' = 'info') => {
      const newLog: LogEntry = {
          id: `lg-${Date.now()}`,
          user: currentUser.name,
          role: currentUser.role,
          action,
          target,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          type
      };
      setLogs(prev => [newLog, ...prev]);
  };

  // --- Tasks Logic ---
  const addTask = (task: Task) => {
    // Automatically attach creator if not set (system tasks usually set it manually)
    const newTask = { ...task, creator: task.creator || currentUser.name };
    setTasks(prev => [newTask, ...prev]);
    logAction('создал', `Задачу: ${task.title}`);
    showNotification('Задача создана');
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    logAction('обновил', `Задачу`, 'info');
    showNotification('Задача обновлена');
  };

  const updateTaskStatus = (id: string, status: Status) => {
    const task = tasks.find(t => t.id === id);
    
    setTasks(prev => prev.map(t => {
        if (t.id === id) {
            const isCompleting = status === Status.DONE;
            return {
                ...t,
                status,
                completedAt: isCompleting ? new Date().toISOString() : t.completedAt
            };
        }
        return t;
    }));
    
    // LOGGING LOGIC
    if (task) {
        if (status === Status.DONE) {
            logAction('выполнил', `Задачу: ${task.title}`, 'success');
        } else if (status === Status.REVIEW) {
            logAction('отправил на проверку', `Задачу: ${task.title}`, 'info');
        }
    }

    if (status === Status.DONE && shift.isActive && currentUser.role === 'WAREHOUSE') {
        setShift(prev => ({ ...prev, tasksDone: prev.tasksDone + 1 }));
    }

    // --- AUTONOMOUS SYSTEM REACTIONS ---
    // When a task is done, check if it should trigger a system update
    if (status === Status.DONE && task && task.meta?.relatedEntityId) {
        // 1. Production QC Task -> Moves production stage to 'ОТК'
        if (task.type === 'PRODUCTION_QC') {
            const prodItem = production.find(p => p.id === task.meta!.relatedEntityId);
            if (prodItem) {
                updateProductionStage(prodItem.id, 'ОТК');
                showNotification('Система: Партия переведена в ОТК', 'info');
                logAction('система', `Изменила этап ${prodItem.name} -> ОТК`, 'success');
            }
        }
        // 2. Warehouse Pack Task -> Marks production as 'Готово' if linked
        if (task.type === 'WAREHOUSE_PACK') {
             const prodItem = production.find(p => p.id === task.meta!.relatedEntityId);
             if (prodItem && prodItem.stage !== 'Готово') {
                 updateProductionStage(prodItem.id, 'Готово');
                 showNotification('Система: Партия готова к продаже', 'success');
                 logAction('система', `Завершила производство ${prodItem.name}`, 'success');
             }
        }
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showNotification('Задача удалена', 'info');
  };

  // --- Shift Logic ---
  const startShift = () => {
      setShift({ isActive: true, startTime: new Date().toISOString(), tasksDone: 0 });
      logAction('начал', 'Смену', 'success');
      showNotification('Смена началась, хорошей работы!');
  };

  const endShift = () => {
      setShift(prev => ({ ...prev, isActive: false, startTime: null }));
      logAction('закончил', 'Смену', 'info');
      showNotification('Смена закончена');
  };

  // --- Production Logic ---
  const addProduction = (item: ProductionItem) => {
    setProduction(prev => [item, ...prev]);
    logAction('запустил', `Партию: ${item.name}`);
    showNotification('Партия добавлена');
  };

  const updateProductionProgress = (id: string, progress: number) => {
    setProduction(prev => prev.map(p => p.id === id ? { ...p, progress: Math.min(100, Math.max(0, progress)) } : p));
  };

  const updateProductionStage = (id: string, stage: ProductionItem['stage']) => {
    setProduction(prev => prev.map(p => p.id === id ? { ...p, stage } : p));
    // We don't log here to avoid double logging with updateTaskStatus
  };

  const updateProductionItem = (id: string, data: Partial<ProductionItem>) => {
      setProduction(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      showNotification('Производство обновлено');
  };

  const payProduction = (id: string, rubAmount: number, method: 'Card' | 'Account') => {
      const item = production.find(p => p.id === id);
      if(!item) return;

      updateProductionItem(id, { paymentStatus: 'Оплачено' });

      addExpense({
          id: `ex-${Date.now()}`,
          name: `Производство: ${item.name}`,
          quantity: 1,
          unit: 'партия',
          totalCost: rubAmount,
          paidCardCash: method === 'Card' ? rubAmount : 0,
          paidIpAccount: method === 'Account' ? rubAmount : 0,
          category: 'Производство'
      });

      logAction('оплатил', `Партия ${item.name} (${rubAmount.toLocaleString()}₽)`, 'success');
      showNotification(`Оплачено: ${rubAmount.toLocaleString()}₽`, 'success');
  };

  // --- Influencer Logic ---
  const addInfluencer = (influencer: Influencer) => {
    setInfluencers(prev => [influencer, ...prev]);
    showNotification('Блогер добавлен');
  };

  const updateInfluencer = (id: string, data: Partial<Influencer>) => {
    // Smart Logic: If tracking code added, set status to sent
    let newData = { ...data };
    if (data.trackingCode && data.trackingCode.length > 3) {
        newData.status = 'Отправлено';
    }
    
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, ...newData } : i));
    showNotification('Блогер обновлен');
  };

  const updateInfluencerStatus = (id: string, status: Influencer['status']) => {
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const deleteInfluencer = (id: string) => {
      setInfluencers(prev => prev.filter(i => i.id !== id));
      showNotification('Блогер удален', 'info');
  };

  // --- Warehouse Logic ---
  const updateStock = (itemId: string, qty: number, action: 'Отправка' | 'Приемка' | 'Возврат') => {
    let itemName = "Товар";
    let newStockLevel = 0;

    setWarehouse(prev => prev.map(item => {
      if (item.id === itemId) {
        itemName = item.name;
        let newStock = item.stock;
        if (action === 'Приемка' || action === 'Возврат') newStock += qty;
        if (action === 'Отправка') newStock -= qty;
        newStockLevel = Math.max(0, newStock);
        return { ...item, stock: newStockLevel };
      }
      return item;
    }));

    const newLog: WarehouseLog = {
      id: `l-${Date.now()}`,
      itemId,
      itemName,
      action,
      quantity: qty,
      date: 'Только что',
      user: currentUser.name
    };
    setWarehouseLogs(prev => [newLog, ...prev]);
    logAction(action, `${qty} шт ${itemName}`, action === 'Отправка' ? 'success' : 'info');
    showNotification(`${action}: ${qty} шт`);

    if (shift.isActive && action === 'Отправка') {
        setShift(prev => ({ ...prev, tasksDone: prev.tasksDone + 1 }));
    }

    // --- AUTONOMOUS REFLEX: CRITICAL STOCK ---
    // If stock drops below 10 and we haven't already created a task recently for this item
    if (newStockLevel < 10 && !autoTaskCreatedRef.current.has(itemId)) {
        // Prevent duplicate tasks for the same item if one is already active
        const isAlreadyTasked = tasks.some(t => t.meta?.relatedEntityId === itemId && t.status !== Status.DONE);
        
        if (!isAlreadyTasked) {
            addTask({
                id: `t-auto-${Date.now()}`,
                title: `Критический остаток: ${itemName} (${newStockLevel} шт)`,
                creator: 'SYSTEM',
                assignee: 'Мария', // Auto-assign to Manager
                tag: TaskTag.PRODUCTION,
                type: 'GENERAL',
                createdDate: new Date().toISOString(),
                deadline: new Date(Date.now() + 172800000).toISOString(), // 2 days
                priority: Priority.CRITICAL,
                status: Status.NEW,
                description: 'Автоматическая задача: Остаток на складе достиг критического минимума. Необходимо заказать новую партию.',
                meta: { relatedEntityId: itemId }
            });
            logAction('система', `Обнаружила дефицит: ${itemName}`, 'warning');
            
            // Debounce for this session
            autoTaskCreatedRef.current.add(itemId);
            setTimeout(() => autoTaskCreatedRef.current.delete(itemId), 300000); 
        }
    }
  };

  const addWarehouseItem = (item: WarehouseItem) => {
      setWarehouse(prev => [item, ...prev]);
      logAction('добавил', `Товар: ${item.name}`);
      showNotification('Товар создан');
  };

  const deleteWarehouseItem = (id: string) => {
      setWarehouse(prev => prev.filter(w => w.id !== id));
      showNotification('Товар удален', 'info');
  };

  // --- Shoots Logic ---
  const addShoot = (shoot: ShootProject) => {
      setShoots(prev => [shoot, ...prev]);
      logAction('запланировал', `Съемку: ${shoot.title}`);
      showNotification('Съемка создана');
  };
  const updateShoot = (id: string, data: Partial<ShootProject>) => {
    setShoots(prev => prev.map(s => s.id === id ? {...s, ...data} : s));
    showNotification('Съемка обновлена');
  };
  const updateShootStatus = (id: string, status: ShootProject['status']) => {
      setShoots(prev => prev.map(s => s.id === id ? {...s, status} : s));
  };
  const approveShootBudget = (id: string) => {
      if (currentUser.role !== 'OWNER') {
          showNotification('Только владелец может утверждать бюджет', 'error');
          return;
      }
      setShoots(prev => prev.map(s => s.id === id ? {...s, isBudgetApproved: true, status: 'Съемка'} : s));
      logAction('утвердил', 'Бюджет съемки', 'success');
      showNotification('Бюджет утвержден');
  };
  const deleteShoot = (id: string) => {
      setShoots(prev => prev.filter(s => s.id !== id));
      showNotification('Съемка удалена', 'info');
  };

  // --- Design Logic ---
  const addDesign = (item: DesignProject) => {
      setDesign(prev => [item, ...prev]);
      logAction('начал', `Дизайн: ${item.title}`);
      showNotification('Проект создан');
  };
  const updateDesign = (id: string, data: Partial<DesignProject>) => {
    setDesign(prev => prev.map(d => d.id === id ? {...d, ...data} : d));
    showNotification('Проект обновлен');
  };
  const updateDesignStatus = (id: string, status: DesignProject['status']) => {
      setDesign(prev => prev.map(d => d.id === id ? {...d, status} : d));
  };
  const deleteDesign = (id: string) => {
      setDesign(prev => prev.filter(d => d.id !== id));
      showNotification('Проект удален', 'info');
  };

  // --- Support Logic ---
  const addTicket = (ticket: SupportTicket) => {
    setTickets(prev => [ticket, ...prev]);
    logAction('создал', `Тикет: ${ticket.clientName}`);
    showNotification('Тикет создан');
  };
  const addTicketMessage = (ticketId: string, text: string, sender: 'client' | 'support') => {
      setTickets(prev => prev.map(t => {
          if(t.id === ticketId) {
              return {
                  ...t,
                  messages: [...t.messages, { sender, text, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }],
                  status: sender === 'support' ? 'Решено' : 'В процессе'
              }
          }
          return t;
      }));
  };
  const closeTicket = (id: string) => {
       setTickets(prev => prev.map(t => t.id === id ? {...t, status: 'Решено'} : t));
       showNotification('Тикет закрыт');
  };

  // --- Reports Logic ---
  const getCompletedTasksForToday = (): Task[] => {
      const now = new Date();
      // Reset time to 00:00:00 local to compare just the date part effectively
      now.setHours(0,0,0,0);
      const startOfDay = now.getTime();
      const endOfDay = startOfDay + 86400000;

      return tasks.filter(t => {
          if (t.status !== Status.DONE || !t.completedAt) return false;
          const taskDate = new Date(t.completedAt);
          const taskTime = taskDate.getTime();
          // Check if completion time falls within the current local day
          return taskTime >= startOfDay && taskTime < endOfDay && t.assignee === currentUser.name;
      });
  };

  const addReport = (report: Report) => {
      setReports(prev => [report, ...prev]);
      logAction('сдал', `Отчет за ${report.date}`, 'success');
      showNotification('Отчет отправлен');
  };

  // --- Expense Logic ---
  const addExpense = (expense: ExpenseItem) => {
      setExpenses(prev => [...prev, expense]);
      showNotification('Расход добавлен');
  };

  const updateExpense = (id: string, data: Partial<ExpenseItem>) => {
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
      showNotification('Расход обновлен');
  };

  const deleteExpense = (id: string) => {
      setExpenses(prev => prev.filter(e => e.id !== id));
      showNotification('Расход удален', 'info');
  };

  // --- Schedule Logic ---
  const addScheduleEvent = (event: ScheduleEvent) => {
    setSchedule(prev => [...prev, event]);
    showNotification('Событие добавлено');
  };
  
  const updateScheduleEvent = (id: string, data: Partial<ScheduleEvent>) => {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    showNotification('График обновлен');
  };

  const deleteScheduleEvent = (id: string) => {
      setSchedule(prev => prev.filter(s => s.id !== id));
      showNotification('Событие удалено', 'info');
  };
  
  // --- Team Logic ---
  const addTeamMember = (member: TeamMember) => {
      setTeam(prev => [...prev, member]);
      showNotification('Сотрудник добавлен');
  };

  const deleteTeamMember = (id: string) => {
      setTeam(prev => prev.filter(m => m.id !== id));
      showNotification('Сотрудник удален', 'info');
  };
  
  const addEventType = (type: EventTypeDefinition) => {
      setEventTypes(prev => [...prev, type]);
  };
  
  const deleteEventType = (id: string) => {
      setEventTypes(prev => prev.filter(t => t.id !== id));
  };

  return (
    <PlannerContext.Provider value={{
      currentUser, switchRole, notification, activeTab, setActiveTab,
      focusedEntityId, navigateTo, clearFocusedEntity,
      tasks, production, influencers, warehouse, warehouseLogs, shoots, design, tickets, reports, finance, expenses, logs, shift, schedule, team, eventTypes,
      addTask, updateTask, updateTaskStatus, deleteTask,
      addProduction, updateProductionProgress, updateProductionStage, updateProductionItem, payProduction,
      addInfluencer, updateInfluencer, updateInfluencerStatus, deleteInfluencer,
      updateStock, addWarehouseItem, deleteWarehouseItem,
      startShift, endShift,
      addShoot, updateShoot, updateShootStatus, approveShootBudget, deleteShoot,
      addDesign, updateDesign, updateDesignStatus, deleteDesign,
      addTicket, addTicketMessage, closeTicket,
      addReport, getCompletedTasksForToday,
      addExpense, updateExpense, deleteExpense,
      addScheduleEvent, updateScheduleEvent, deleteScheduleEvent,
      addTeamMember, deleteTeamMember,
      addEventType, deleteEventType
    }}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};