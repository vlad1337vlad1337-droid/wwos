
import React from 'react';
import { AlertTriangle, TrendingUp, Package, Users, Zap, DollarSign, Activity, ArrowRight, Plus, Search, History, Box, Factory, Camera, Clock, Heart, Lightbulb, CheckCircle2 } from 'lucide-react';
import { usePlanner } from '../context';
import { Status } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Widget = ({ title, value, sub, icon: Icon, color = "from-neutral-800 to-neutral-900", iconColor = "text-white", alert = false, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`cursor-pointer p-5 rounded-[28px] flex flex-col justify-between h-44 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${color} border border-white/5 shadow-2xl hover:shadow-3xl`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none" />

    <div className="flex justify-between items-start z-10">
      <div className={`p-3 rounded-2xl bg-white/10 backdrop-blur-md ${iconColor} shadow-lg`}>
        <Icon size={22} />
      </div>
      {alert && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white/50 bg-black/20 rounded-full p-1">
          <ArrowRight size={14} />
      </div>
    </div>
    
    <div className="z-10 mt-4">
      <h3 className="text-4xl font-bold tracking-tighter text-white mb-1 font-sans">{value}</h3>
      <p className="text-sm font-medium text-white/70 tracking-wide">{title}</p>
      {sub && <div className="inline-block mt-2 px-2 py-0.5 rounded-md bg-black/20 backdrop-blur-sm text-[10px] text-white/60 font-mono uppercase tracking-wider border border-white/5">{sub}</div>}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { tasks, production, influencers, warehouse, expenses, logs, currentUser, setActiveTab, shoots, shift } = usePlanner();

  // --- Logic ---
  const myTasks = tasks.filter(t => t.assignee === currentUser.name && t.status === Status.IN_PROGRESS).length;
  
  const myOverdue = tasks.filter(t => 
    (t.assignee === currentUser.name || currentUser.role === 'OWNER') && 
    new Date(t.deadline) < new Date() && 
    t.status !== Status.DONE
  ).length;

  const productionDelay = production.filter(p => p.status === 'Задержка').length;
  const activeProduction = production.filter(p => p.status !== 'Критично' && p.stage !== 'Готово');
  const lowStock = warehouse.filter(w => w.stock < 10);
  
  // Critical Red Zone (Owner Only)
  const criticalIssues = productionDelay + myOverdue + influencers.filter(i => i.status === 'Просрочено').length;

  // System Health Calculation (Immunity)
  // Formula: Starts at 100, minus penalties for critical issues
  const systemImmunity = Math.max(0, 100 - (criticalIssues * 10) - (lowStock.length * 2) - (productionDelay * 5));
  const healthColor = systemImmunity > 90 ? 'text-green-400' : systemImmunity > 70 ? 'text-yellow-400' : 'text-red-400';

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.totalCost, 0);
  
  const formatMoney = (n: number) => {
    if (n > 1000000) return (n/1000000).toFixed(1) + 'M';
    if (n > 1000) return (n/1000).toFixed(0) + 'k';
    return n.toString();
  };

  const greeting = () => {
      const h = new Date().getHours();
      if(h < 12) return "Доброе утро";
      if(h < 18) return "Добрый день";
      return "Добрый вечер";
  };

  // --- AI INSIGHTS GENERATOR ---
  const generateInsights = () => {
      const insights = [];
      
      // 1. Production Logic
      if (productionDelay > 0) {
          insights.push({
              type: 'danger',
              msg: `Задержка производства: ${productionDelay} партий требуют вмешательства.`,
              action: 'production',
              label: 'Проверить'
          });
      }

      // 2. Stock Logic
      if (lowStock.length > 0) {
           insights.push({
              type: 'warning',
              msg: `Низкий сток: ${lowStock[0].name} заканчивается (${lowStock[0].stock} шт).`,
              action: 'warehouse',
              label: 'Заказать'
          });
      }

      // 3. Task Logic
      if (myTasks > 5) {
          insights.push({
              type: 'info',
              msg: `Высокая нагрузка: ${myTasks} активных задач. Делегируйте часть.`,
              action: 'tasks',
              label: 'К задачам'
          });
      }

      // 4. Idle Logic (Good state)
      if (insights.length === 0) {
          insights.push({
              type: 'success',
              msg: 'Система работает стабильно. Отличное время для планирования новых дропов.',
              action: 'shoots',
              label: 'Планирование'
          });
      }

      return insights;
  };

  const insights = generateInsights();

  // --- ROLE BASED RENDER ---

  // 1. WAREHOUSE VIEW
  if (currentUser.role === 'WAREHOUSE') {
      return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">{greeting()}, {currentUser.name}</h2>
                    <p className="text-neutral-500">Складской терминал</p>
                </div>
                {shift.isActive ? (
                    <div className="bg-green-500/20 border border-green-500/50 px-4 py-2 rounded-full text-green-400 font-bold text-sm animate-pulse flex items-center gap-2">
                        <Clock size={16} /> Смена активна
                    </div>
                ) : (
                    <div className="bg-neutral-800 px-4 py-2 rounded-full text-neutral-500 font-bold text-sm flex items-center gap-2">
                        <Clock size={16} /> Смена не начата
                    </div>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Widget 
                    title="Мои задачи" value={myTasks} sub="На сегодня" 
                    icon={Zap} color="from-blue-600/20 to-blue-900/40" iconColor="text-blue-400" 
                    onClick={() => setActiveTab('tasks')}
                 />
                 <Widget 
                    title="Сток < 10" value={lowStock.length} sub="Внимание" 
                    icon={AlertTriangle} color={lowStock.length > 0 ? "from-orange-600/20 to-orange-900/40" : "from-neutral-800 to-neutral-900"} iconColor="text-orange-400" 
                    onClick={() => setActiveTab('warehouse')}
                 />
             </div>
             
             <div className="ios-card p-6 rounded-[32px]">
                 <h3 className="text-xl font-bold text-white mb-4">Быстрые действия</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button onClick={() => setActiveTab('warehouse')} className="bg-neutral-800 p-6 rounded-2xl hover:bg-neutral-700 transition-colors text-left">
                         <Box className="text-blue-400 mb-2" />
                         <span className="text-white font-bold">Принять/Отправить</span>
                     </button>
                     <button onClick={() => setActiveTab('support')} className="bg-neutral-800 p-6 rounded-2xl hover:bg-neutral-700 transition-colors text-left">
                         <Users className="text-purple-400 mb-2" />
                         <span className="text-white font-bold">Тикеты</span>
                     </button>
                 </div>
             </div>
          </div>
      )
  }

  // 2. MANAGER VIEW (Operational)
  if (currentUser.role === 'MANAGER') {
      return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div>
                <h2 className="text-4xl font-bold text-white">{greeting()}, {currentUser.name}</h2>
                <p className="text-neutral-500 font-medium">Операционная панель</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                 <Widget 
                    title="Задачи сегодня" value={myTasks} sub={`${myOverdue} просрочено`} 
                    icon={Zap} color={myOverdue > 0 ? "from-red-900/40 to-red-900/20" : "from-blue-600/20 to-blue-900/40"} iconColor={myOverdue > 0 ? "text-red-400" : "text-blue-400"} 
                    alert={myOverdue > 0}
                    onClick={() => setActiveTab('tasks')}
                 />
                 <Widget 
                    title="Активные партии" value={activeProduction.length} sub={`${productionDelay} задержка`} 
                    icon={Factory} color="from-purple-600/20 to-purple-900/40" iconColor="text-purple-400" 
                    onClick={() => setActiveTab('production')}
                 />
                 <Widget 
                    title="Ближайшая съемка" 
                    value={shoots.filter(s => s.status === 'Планирование').length > 0 ? shoots.find(s => s.status === 'Планирование')?.date.slice(5) : '--'} 
                    sub="Готовность" 
                    icon={Camera} color="from-pink-600/20 to-pink-900/40" iconColor="text-pink-400" 
                    onClick={() => setActiveTab('shoots')}
                 />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Bloggers Deadline */}
                 <div className="ios-card p-6 rounded-[32px]">
                     <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users size={18} /> Дедлайны блогеров</h3>
                     <div className="space-y-3">
                         {influencers.slice(0, 4).map(i => (
                             <div key={i.id} className="flex justify-between items-center p-3 bg-white/5 rounded-xl cursor-pointer" onClick={() => setActiveTab('bloggers')}>
                                 <div>
                                     <p className="text-white text-sm font-medium">{i.name}</p>
                                     <p className="text-xs text-neutral-500">{i.status}</p>
                                 </div>
                                 <span className="text-xs font-mono text-neutral-400">{i.deadline}</span>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
          </div>
      );
  }

  // 3. OWNER VIEW (Full)
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h2 className="text-4xl font-bold tracking-tight text-white mb-1">{greeting()}, {currentUser.name}!</h2>
            <p className="text-neutral-400 font-medium flex items-center gap-2">
                {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                <span className="w-1 h-1 rounded-full bg-neutral-600" />
                <span className="uppercase text-xs tracking-widest text-blue-500 font-bold">Центр управления</span>
            </p>
        </div>
        
        <div className="flex items-center gap-2 bg-neutral-900/50 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
             <button onClick={() => setActiveTab('tasks')} className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20">
                <Plus size={16} /> Задача
             </button>
             <button onClick={() => setActiveTab('finance')} className="px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium transition-all flex items-center gap-2">
                <DollarSign size={16} className="text-green-400" /> Расход
             </button>
        </div>
      </div>

      {/* AI Insights Console */}
      <div className="ios-card p-6 rounded-[32px] relative overflow-hidden bg-gradient-to-r from-neutral-900 to-neutral-800 border-l-4 border-l-blue-500">
          <div className="absolute top-0 right-0 p-6 opacity-10">
              <Lightbulb size={120} className="text-white" />
          </div>
          <div className="relative z-10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-blue-400 fill-current" />
                  AI Инсайты
              </h3>
              <div className="space-y-3">
                  {insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5 hover:bg-white/5 transition-colors">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${insight.type === 'danger' ? 'bg-red-500' : insight.type === 'warning' ? 'bg-orange-500' : insight.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                          <div className="flex-1">
                              <p className="text-sm text-neutral-200 leading-snug">{insight.msg}</p>
                          </div>
                          <button 
                            onClick={() => setActiveTab(insight.action)}
                            className="text-[10px] font-bold uppercase bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white transition-colors whitespace-nowrap"
                          >
                              {insight.label}
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* System Health Widget */}
        <div className="col-span-1 md:col-span-2 p-5 rounded-[28px] bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
                 <div className="p-3 rounded-2xl bg-white/10 text-white shadow-lg">
                    <Activity size={22} />
                 </div>
                 <span className={`text-3xl font-bold ${healthColor}`}>{systemImmunity}%</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Иммунитет системы</h3>
            <div className="flex gap-4 mt-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Критические</span>
                    <span className={`font-mono font-bold ${criticalIssues > 0 ? 'text-red-400' : 'text-neutral-300'}`}>{criticalIssues}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Задержки</span>
                    <span className={`font-mono font-bold ${productionDelay > 0 ? 'text-orange-400' : 'text-neutral-300'}`}>{productionDelay}</span>
                </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Low Stock</span>
                    <span className={`font-mono font-bold ${lowStock.length > 0 ? 'text-yellow-400' : 'text-neutral-300'}`}>{lowStock.length}</span>
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                 <div className={`h-full ${healthColor.replace('text', 'bg')}`} style={{ width: `${systemImmunity}%` }} />
            </div>
        </div>

        <Widget 
            title="Расходы (Мес)" 
            value={formatMoney(totalExpenses)} 
            sub="Оборот"
            icon={DollarSign} 
            color="from-emerald-600/20 to-emerald-900/40"
            iconColor="text-emerald-400"
            onClick={() => setActiveTab('finance')}
        />

        <Widget 
            title="В производстве" 
            value={activeProduction.length} 
            sub={`${productionDelay} задержка`} 
            icon={Factory} 
            color="from-purple-600/20 to-purple-900/40" 
            iconColor="text-purple-400" 
            onClick={() => setActiveTab('production')}
        />
      </div>
    </div>
  );
};

export default Dashboard;
