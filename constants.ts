
import { Task, Status, Priority, TaskTag, ProductionItem, Influencer, WarehouseItem, WarehouseLog, UserRole, ShootProject, DesignProject, SupportTicket, Report, FinanceTransaction, LogEntry, ExpenseItem, TeamMember, ScheduleEvent, EventTypeDefinition } from './types';

export const MOCK_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Утвердить образцы тканей SS24',
    creator: 'Алексей',
    assignee: 'Алексей',
    tag: TaskTag.PRODUCTION,
    type: 'PRODUCTION_QC',
    createdDate: '2023-10-20',
    deadline: '2023-10-25',
    priority: Priority.HIGH,
    status: Status.IN_PROGRESS,
    contentBlocks: [{ id: 'b1', type: 'text', content: 'Нужно проверить плотность и цвет.' }],
    checklist: [
      { id: 'c1', text: 'Проверить плотность футера', isDone: true, createdBy: 'Алексей', description: 'Должно быть 350гр.', images: [] },
      { id: 'c2', text: 'Сравнить оттенок с пантоном', isDone: false, createdBy: 'Алексей', images: [] },
      { id: 'c3', text: 'Тест на усадку', isDone: false, createdBy: 'Алексей', images: [] }
    ],
    attachments: []
  },
  {
    id: 't-2',
    title: 'Отправить сидинг-боксы @sarah',
    creator: 'Мария',
    assignee: 'Мария',
    tag: TaskTag.BLOGGERS,
    type: 'BLOGGER_SEND',
    createdDate: '2023-10-21',
    deadline: '2023-10-24',
    priority: Priority.CRITICAL,
    status: Status.NEW,
    meta: { trackingCode: '', itemsSent: 'Hoodie M' },
    contentBlocks: [],
    checklist: [
      { id: 'c1', text: 'Собрать бокс', isDone: false, createdBy: 'Мария', images: [] },
      { id: 'c2', text: 'Написать открытку', isDone: false, createdBy: 'Мария', images: [] },
      { id: 'c3', text: 'Вызвать курьера', isDone: false, createdBy: 'Мария', images: [] }
    ]
  },
  {
    id: 't-3',
    title: 'Ежемесячная ревизия склада',
    creator: 'Алексей',
    assignee: 'Степан',
    tag: TaskTag.WAREHOUSE,
    type: 'GENERAL',
    createdDate: '2023-10-15',
    deadline: '2023-10-30',
    priority: Priority.MEDIUM,
    status: Status.WAITING,
    contentBlocks: [
        { id: 'b1', type: 'h1', content: 'План ревизии' },
        { id: 'b2', type: 'table', content: { headers: ['Зона', 'Ответственный'], rows: [['А1', 'Степан'], ['Б2', 'Иван']] } }
    ],
    checklist: [],
    attachments: []
  },
  {
    id: 't-4',
    title: 'Ретушь фото лукбука',
    creator: 'Мария',
    assignee: 'Катя',
    tag: TaskTag.CONTENT,
    type: 'SHOOT_PREP',
    createdDate: '2023-10-22',
    deadline: '2023-10-26',
    priority: Priority.HIGH,
    status: Status.REVIEW,
    checklist: [],
    attachments: []
  }
];

export const MOCK_PRODUCTION: ProductionItem[] = [
  { 
    id: 'p-1', 
    name: 'Zip-hoodie', 
    quantity: 300, 
    batchPriceRMB: 41100, 
    samplePriceRMB: 800, 
    costPriceRMB: 137, 
    batchDeadline: '25-30 days', 
    sampleDeadline: '10 days',
    stage: 'Пошив', 
    status: 'В графике', 
    progress: 65,
    paymentStatus: 'Оплачено',
    paymentNote: 'Zip-hoodie 41.110-1600=39.510 RMB партия'
  },
  { 
    id: 'p-2', 
    name: 'T-shirt 45% cotton 55% hemp', 
    quantity: 1000, 
    batchPriceRMB: 115000, 
    samplePriceRMB: 500, 
    costPriceRMB: 115, 
    batchDeadline: '30-32 days', 
    sampleDeadline: '12-15 days',
    stage: 'Раскрой', 
    status: 'В графике', 
    progress: 30,
    paymentStatus: 'Оплачено',
    paymentNote: 'T-shirt 45% cotton 500RMB семпл'
  },
  { 
    id: 'p-3', 
    name: 'T-shirt 85% cotton 15% hemp', 
    quantity: 1000, 
    batchPriceRMB: 95000, 
    samplePriceRMB: 500, 
    costPriceRMB: 95, 
    batchDeadline: '30-32 days', 
    sampleDeadline: '12-15 days',
    stage: 'ОТК', 
    status: 'В графике', 
    progress: 90,
    paymentStatus: 'Оплачено',
    paymentNote: 'T-shirt 85% cotton 500RMB семпл'
  },
  { 
    id: 'p-4', 
    name: 'Bomber', 
    quantity: 100, 
    batchPriceRMB: 0, 
    samplePriceRMB: 3300, 
    costPriceRMB: 0, 
    batchDeadline: '46-50 days', 
    sampleDeadline: '18-20 days',
    stage: 'Лекала', 
    status: 'Задержка', 
    progress: 15,
    paymentStatus: 'Частично',
    paymentNote: 'Bomber 3.300 семпл'
  },
  { 
    id: 'p-5', 
    name: 'Wallet white', 
    quantity: 100, 
    batchPriceRMB: 9300, 
    samplePriceRMB: 720, 
    costPriceRMB: 93, 
    batchDeadline: '20-25 days', 
    sampleDeadline: '10 days',
    stage: 'Закупка', 
    status: 'В графике', 
    progress: 5,
    paymentStatus: 'Оплачено',
    paymentNote: 'Wallet 9.300 RMB семпл'
  },
];

export const MOCK_EXPENSES: ExpenseItem[] = [
  { id: 'ex-1', name: 'партия китай', quantity: 1, unit: 'шт', totalCost: 280000, paidCardCash: 280000, paidIpAccount: 0, category: 'Производство' },
  { id: 'ex-2', name: 'аренда', quantity: 1, unit: 'шт', totalCost: 80000, paidCardCash: 0, paidIpAccount: 80000, category: 'Офис' },
  { id: 'ex-3', name: 'доставка андрюха', quantity: 1, unit: 'шт', totalCost: 1457, paidCardCash: 1457, paidIpAccount: 0, category: 'Логистика' },
  { id: 'ex-4', name: 'ткани меланж', quantity: 1, unit: 'шт', totalCost: 115251, paidCardCash: 0, paidIpAccount: 115251, category: 'Производство' },
  { id: 'ex-5', name: 'ткань черная футер', quantity: 1, unit: 'шт', totalCost: 214860, paidCardCash: 0, paidIpAccount: 214860, category: 'Производство' },
  { id: 'ex-6', name: 'шелкография', quantity: 1, unit: 'шт', totalCost: 61424, paidCardCash: 0, paidIpAccount: 61424, category: 'Производство' },
  { id: 'ex-7', name: 'дтф', quantity: 0, unit: '', totalCost: 0, paidCardCash: 0, paidIpAccount: 0, category: 'Производство' },
  { id: 'ex-8', name: 'инет склад', quantity: 1, unit: 'шт', totalCost: 500, paidCardCash: 500, paidIpAccount: 0, category: 'Логистика' },
  { id: 'ex-9', name: 'марта съемка', quantity: 1, unit: 'шт', totalCost: 17300, paidCardCash: 17300, paidIpAccount: 0, category: 'Маркетинг' },
  { id: 'ex-10', name: 'карш тим', quantity: 2, unit: 'шт', totalCost: 2900, paidCardCash: 2900, paidIpAccount: 0, category: 'Офис' },
  { id: 'ex-11', name: 'таргет вк', quantity: 1, unit: 'шт', totalCost: 10000, paidCardCash: 10000, paidIpAccount: 0, category: 'Маркетинг' },
  { id: 'ex-12', name: 'озон', quantity: 1, unit: 'шт', totalCost: 8878, paidCardCash: 8878, paidIpAccount: 0, category: 'Маркетинг' },
  { id: 'ex-13', name: 'ВИТЯ АВАНС', quantity: 1, unit: 'шт', totalCost: 20000, paidCardCash: 20000, paidIpAccount: 0, category: 'Зарплаты' },
];

export const MOCK_INFLUENCERS: Influencer[] = [
  { id: 'i-1', name: 'Sarah Style', handle: '@sarah.style', status: 'Отправлено', trackingCode: 'AB123456CD', deadline: '2023-10-30', condition: 'Бартер', itemsSent: 'Hoodie M, Pants S' },
  { id: 'i-2', name: 'Mike Street', handle: '@mike.fits', status: 'Просрочено', trackingCode: 'AB987654CD', deadline: '2023-10-15', condition: 'Оплата', roi: 12 },
  { id: 'i-3', name: 'Anna V', handle: '@anna.vogue', status: 'Опубликовано', trackingCode: 'Доставлено', deadline: '2023-10-20', condition: 'Бартер', roi: 45, contentLink: 'instagram.com/p/123' },
];

export const MOCK_WAREHOUSE: WarehouseItem[] = [
  { id: 'w-1', name: 'Бомбер V2', size: 'M', sku: 'BMB-V2-BLK-M', stock: 45, reserved: 5 },
  { id: 'w-2', name: 'Бомбер V2', size: 'L', sku: 'BMB-V2-BLK-L', stock: 20, reserved: 10 },
  { id: 'w-3', name: 'Футболка Basic', size: 'S', sku: 'TSH-WHT-S', stock: 100, reserved: 0 },
  { id: 'w-4', name: 'Брюки Карго', size: 'XL', sku: 'PNT-CRG-BLK-XL', stock: 5, reserved: 2 },
];

export const MOCK_WAREHOUSE_LOGS: WarehouseLog[] = [
  { id: 'l-1', itemId: 'w-1', itemName: 'Бомбер V2', action: 'Отправка', quantity: 2, date: '10м назад', user: 'Степан' },
  { id: 'l-2', itemId: 'w-3', itemName: 'Футболка Basic', action: 'Приемка', quantity: 50, date: '1ч назад', user: 'Степан' },
];

export const MOCK_SHOOTS: ShootProject[] = [
  { id: 's-1', title: 'Streetwear Drop 1', date: '2023-11-05', location: 'Студия 12', status: 'Планирование', budget: 50000, photosCount: 30, isBudgetApproved: false },
  { id: 's-2', title: 'Lookbook Winter', date: '2023-10-15', location: 'Центр города', status: 'Ретушь', budget: 80000, photosCount: 120, isBudgetApproved: true },
];

export const MOCK_DESIGN: DesignProject[] = [
  { id: 'd-1', title: 'Худи Zip-Up', type: 'Одежда', status: 'Сэмпл', deadline: '2023-11-01' },
  { id: 'd-2', title: 'Сумка через плечо', type: 'Аксессуары', status: 'Скетч', deadline: '2023-11-15' },
];

export const MOCK_TICKETS: SupportTicket[] = [
  { 
    id: 'st-1', clientName: 'Ольга К.', issue: 'Где мой заказ?', platform: 'Instagram', status: 'Новое', assignee: 'Степан',
    messages: [{ sender: 'client', text: 'Здравствуйте, жду уже 5 дней!', time: '10:00' }]
  },
  { 
    id: 'st-2', clientName: 'Дмитрий', issue: 'Не подошел размер', platform: 'Telegram', status: 'В процессе', assignee: 'Степан',
    messages: [{ sender: 'client', text: 'Можно вернуть?', time: '09:30' }, { sender: 'support', text: 'Да, конечно. Номер заказа?', time: '09:35' }]
  },
];

export const MOCK_REPORTS: Report[] = [
  { id: 'r-1', userId: 'u-3', userName: 'Степан', date: '2023-10-24', content: 'Принял 50 футболок, отправил 12 заказов. Жалоб нет.', type: 'Ежедневный', stats: { orders: 12, issues: 0 } },
  { id: 'r-2', userId: 'u-2', userName: 'Мария', date: '2023-10-23', content: 'Согласовала 3 блогеров, запустили рекламу.', type: 'Ежедневный' },
];

export const MOCK_FINANCE: FinanceTransaction[] = [
  { id: 'f-1', title: 'Продажа #1023', amount: 12500, type: 'income', category: 'Продажи', date: '2023-10-24' },
  { id: 'f-2', title: 'Закупка ткани', amount: 45000, type: 'expense', category: 'Производство', date: '2023-10-23' },
  { id: 'f-3', title: 'Оплата блогеру', amount: 15000, type: 'expense', category: 'Маркетинг', date: '2023-10-22' },
];

export const MOCK_LOGS: LogEntry[] = [
  { id: 'lg-1', user: 'Мария', role: 'MANAGER', action: 'создала', target: 'Задача #45', time: '10:15', type: 'info' },
  { id: 'lg-2', user: 'Степан', role: 'WAREHOUSE', action: 'закрыл', target: 'Тикет #12', time: '11:20', type: 'success' },
  { id: 'lg-3', user: 'Алексей', role: 'OWNER', action: 'утвердил', target: 'Бюджет Съемки', time: '09:00', type: 'warning' },
];

export const MOCK_TEAM: TeamMember[] = [
    { id: 'u-1', name: 'Алексей', role: 'OWNER', avatar: 'AL' },
    { id: 'u-2', name: 'Мария', role: 'MANAGER', avatar: 'MA' },
    { id: 'u-3', name: 'Степан', role: 'WAREHOUSE', avatar: 'ST' },
    { id: 'u-4', name: 'Иван (Логист)', role: 'EXTERNAL', avatar: 'IV' },
    { id: 'u-5', name: 'Катя (Ретушь)', role: 'EXTERNAL', avatar: 'KA' },
];

export const DEFAULT_EVENT_TYPES: EventTypeDefinition[] = [
    { id: 'shift', label: 'Смена', color: 'bg-blue-600', isSystem: true },
    { id: 'meeting', label: 'Встреча', color: 'bg-purple-600', isSystem: true },
    { id: 'dayoff', label: 'Выходной', color: 'bg-neutral-700', isSystem: true },
    { id: 'remote', label: 'Удаленка', color: 'bg-orange-600', isSystem: true },
];

export const MOCK_SCHEDULE: ScheduleEvent[] = [
    { id: 'sc-1', userId: 'u-2', userName: 'Мария', role: 'MANAGER', date: new Date().toISOString().split('T')[0], startTime: '10:00', endTime: '19:00', typeId: 'shift' },
    { id: 'sc-2', userId: 'u-3', userName: 'Степан', role: 'WAREHOUSE', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '21:00', typeId: 'shift' },
    { id: 'sc-3', userId: 'u-1', userName: 'Алексей', role: 'OWNER', date: new Date().toISOString().split('T')[0], startTime: '12:00', endTime: '16:00', typeId: 'meeting', note: 'Встреча с инвестором' },
    { id: 'sc-4', userId: 'u-5', userName: 'Катя (Ретушь)', role: 'EXTERNAL', date: new Date().toISOString().split('T')[0], startTime: '14:00', endTime: '18:00', typeId: 'remote' },
];

interface NavItem {
  id: string;
  label: string;
  icon: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Главная', icon: 'LayoutDashboard', roles: ['OWNER', 'MANAGER', 'WAREHOUSE'] },
  { id: 'schedule', label: 'График', icon: 'Calendar', roles: ['OWNER', 'MANAGER', 'WAREHOUSE'] },
  { id: 'tasks', label: 'Задачи', icon: 'CheckSquare', roles: ['OWNER', 'MANAGER', 'WAREHOUSE'] },
  { id: 'production', label: 'Производство', icon: 'Factory', roles: ['OWNER', 'MANAGER'] },
  { id: 'bloggers', label: 'Блогеры', icon: 'Users', roles: ['OWNER', 'MANAGER'] },
  { id: 'warehouse', label: 'Склад', icon: 'Package', roles: ['OWNER', 'MANAGER', 'WAREHOUSE'] },
  { id: 'shoots', label: 'Съемки', icon: 'Camera', roles: ['OWNER', 'MANAGER'] },
  { id: 'design', label: 'Дизайнеры', icon: 'Palette', roles: ['OWNER', 'MANAGER'] },
  { id: 'support', label: 'Поддержка', icon: 'MessageCircle', roles: ['OWNER', 'MANAGER', 'WAREHOUSE'] },
  { id: 'reports', label: 'Отчеты', icon: 'FileText', roles: ['OWNER', 'MANAGER', 'WAREHOUSE'] },
  { id: 'kpi', label: 'KPI', icon: 'TrendingUp', roles: ['OWNER', 'MANAGER'] },
  { id: 'finance', label: 'Финансы', icon: 'DollarSign', roles: ['OWNER'] },
  { id: 'logs', label: 'Лог действий', icon: 'Activity', roles: ['OWNER'] },
];
