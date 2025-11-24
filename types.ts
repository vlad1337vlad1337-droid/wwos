

export enum Priority {
  LOW = 'Низкий',
  MEDIUM = 'Средний',
  HIGH = 'Высокий',
  CRITICAL = 'Критический'
}

export enum Status {
  NEW = 'Новое',
  IN_PROGRESS = 'В работе',
  WAITING = 'Жду ответа',
  REVIEW = 'На проверке',
  DONE = 'Выполнено'
}

export enum TaskTag {
  MARKETING = 'Маркетинг',
  PRODUCTION = 'Производство',
  BLOGGERS = 'Блогеры',
  CONTENT = 'Контент',
  WAREHOUSE = 'Склад',
  SUPPORT = 'Поддержка',
  DESIGN = 'Дизайн',
  SHOOTS = 'Съемки',
  PERSONAL = 'Личное'
}

export type TaskType = 'GENERAL' | 'BLOGGER_SEND' | 'SHOOT_PREP' | 'DESIGN_TASK' | 'PRODUCTION_QC' | 'WAREHOUSE_PACK';

export type UserRole = 'OWNER' | 'MANAGER' | 'WAREHOUSE' | 'EXTERNAL';

export interface User {
  name: string;
  role: UserRole;
  avatar: string;
}

export interface TeamMember {
    id: string;
    name: string;
    role: UserRole;
    avatar: string;
}

export interface EventTypeDefinition {
    id: string;
    label: string;
    color: string; // Tailwind class like 'bg-blue-600'
    isSystem?: boolean; 
}

export interface ScheduleEvent {
    id: string;
    userId: string; // ID of the team member
    userName: string;
    role: UserRole; 
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    typeId: string; // Links to EventTypeDefinition
    note?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isDone: boolean;
  createdBy: string;
  description?: string;
  images?: string[];
}

export type BlockType = 'text' | 'h1' | 'h2' | 'table';

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string | TableData; 
}

export interface Task {
  id: string;
  title: string;
  creator: string;
  assignee: string;
  tag: TaskTag;
  type: TaskType; 
  createdDate: string;
  deadline: string;
  priority: Priority;
  status: Status;
  
  description?: string;
  contentBlocks?: ContentBlock[];

  completedAt?: string;
  rating?: number;
  
  sketch?: string; 
  attachments?: string[]; 
  checklist?: ChecklistItem[];

  meta?: {
    trackingCode?: string;
    itemsSent?: string;
    link?: string;
    relatedEntityId?: string;
  };
}

export interface ProductionItem {
  id: string;
  name: string;
  quantity: number;
  batchPriceRMB: number;
  samplePriceRMB: number;
  costPriceRMB: number;
  batchDeadline: string;
  sampleDeadline: string;
  stage: 'Закупка' | 'Лекала' | 'Раскрой' | 'Пошив' | 'ОТК' | 'Готово';
  status: 'В графике' | 'Задержка' | 'Критично';
  progress: number;
  paymentStatus: 'Оплачено' | 'Ожидает' | 'Частично';
  paymentNote?: string;
  techPackUrl?: string; 
}

export interface ExpenseItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  totalCost: number;
  paidCardCash: number;
  paidIpAccount: number;
  category?: string;
}

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  status: 'Переговоры' | 'Отправлено' | 'Опубликовано' | 'Просрочено';
  condition: 'Бартер' | 'Оплата';
  deadline: string;
  trackingCode?: string;
  itemsSent?: string;
  contentLink?: string;
  roi?: number;
  agreementText?: string; 
}

export interface WarehouseItem {
  id: string;
  name: string;
  size: string;
  sku: string;
  stock: number;
  reserved: number;
}

export interface WarehouseLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'Отправка' | 'Приемка' | 'Возврат';
  quantity: number;
  date: string;
  user: string;
}

export interface ShootProject {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'Планирование' | 'Ожидает бюджета' | 'Съемка' | 'Ретушь' | 'Готово';
  budget: number;
  photosCount: number;
  isBudgetApproved: boolean;
}

export interface DesignLayer {
  id: string;
  name: string;
  type: 'IMAGE' | 'TEXT' | 'RECT' | 'CIRCLE' | 'PATH' | 'STICKY' | 'CONNECTOR' | 'FRAME';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity?: number;
  
  // Grouping
  groupId?: string;

  // Content
  src?: string; // Image
  text?: string; // Text & Sticky
  points?: {x: number, y: number}[]; // Path (Pen tool)
  
  // Style
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  
  // Typography
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  
  // State
  isLocked?: boolean;
  isVisible?: boolean;
  blur?: number;
}

export interface DesignPin {
    id: string;
    x: number;
    y: number;
    author: string;
    comment: string;
    isResolved: boolean;
    timestamp: string;
}

export interface DesignProject {
  id: string;
  title: string;
  type: 'Одежда' | 'Аксессуары' | 'Принт';
  status: 'Скетч' | 'Сэмпл' | 'Утверждено';
  deadline: string;
  relatedProductionId?: string;
  
  // Studio Data
  canvasData?: {
      layers: DesignLayer[];
      pins: DesignPin[];
      lastModified: string;
  };
}

export interface TicketMessage {
  sender: 'client' | 'support';
  text: string;
  time: string;
}

export interface SupportTicket {
  id: string;
  clientName: string;
  issue: string;
  platform: 'Instagram' | 'Telegram' | 'WhatsApp' | 'Email';
  status: 'Новое' | 'В процессе' | 'Решено';
  assignee: string;
  messages: TicketMessage[];
}

export interface ReportMetric {
    id: string;
    label: string;
    value: number;
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  date: string;
  content: string;
  type: string;
  
  workingHours?: {
      start: string;
      end: string;
  };
  
  metrics?: ReportMetric[];
  
  images?: string[]; 
  stats?: {
    orders: number;
    issues: number;
  };
  autoGeneratedTasks?: string[];
}

export interface FinanceTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

export interface LogEntry {
  id: string;
  user: string;
  role: string;
  action: string;
  target: string;
  time: string;
  type: 'info' | 'warning' | 'success';
}

export interface ShiftState {
  isActive: boolean;
  startTime: string | null;
  tasksDone: number;
}
