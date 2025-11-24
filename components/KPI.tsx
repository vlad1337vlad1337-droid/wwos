
import React from 'react';
import { usePlanner } from '../context';
import { Award, AlertCircle } from 'lucide-react';
import { Status } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const KPI: React.FC = () => {
  const { currentUser, tasks, tickets, production } = usePlanner();

  // Real Data Calculation
  const calculateKPI = (userName: string, role: string) => {
      // Tasks KPI
      const userTasks = tasks.filter(t => t.assignee === userName || (role === 'WAREHOUSE' && t.assignee === 'Степан')); // Mock mapping for warehouse
      const completedTasks = userTasks.filter(t => t.status === Status.DONE).length;
      const totalTasks = userTasks.length;
      const taskScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Custom metrics based on role
      let secondaryMetric = '';
      let secondaryLabel = 'Эффективность';
      
      if (role === 'WAREHOUSE') {
          // Warehouse metric: Tickets closed or tasks done
          const closedTickets = tickets.filter(t => t.assignee === userName && t.status === 'Решено').length;
          secondaryMetric = `${closedTickets} тикетов`;
          secondaryLabel = 'Поддержка';
      } else if (role === 'MANAGER') {
          // Manager metric: Production items in progress
          const activeProd = production.filter(p => p.status !== 'Критично').length;
          secondaryMetric = `${activeProd} партий`;
          secondaryLabel = 'Контроль';
      } else {
          // Owner
          const totalMoney = production.reduce((acc, p) => acc + p.batchPriceRMB, 0);
          secondaryMetric = `${(totalMoney/1000).toFixed(1)}k RMB`;
          secondaryLabel = 'Оборот';
      }

      // Base score calculation (simplified)
      let score = taskScore;
      if (totalTasks === 0) score = 100; // Default if no tasks assigned

      return {
          user: userName,
          role,
          score,
          secondaryMetric,
          secondaryLabel,
          tasks: `${completedTasks}/${totalTasks}`,
          color: role === 'OWNER' ? 'text-purple-400' : role === 'MANAGER' ? 'text-blue-400' : 'text-orange-400'
      };
  };

  const kpiData = [
      calculateKPI('Алексей', 'OWNER'),
      calculateKPI('Мария', 'MANAGER'),
      calculateKPI('Степан', 'WAREHOUSE'),
  ];

  const visibleKPI = currentUser.role === 'OWNER' 
    ? kpiData 
    : kpiData.filter(k => k.role === currentUser.role);

  // Mock Analytics Data for Chart
  const velocityData = [
      { day: 'Пн', tasks: 12 },
      { day: 'Вт', tasks: 18 },
      { day: 'Ср', tasks: 10 },
      { day: 'Чт', tasks: 22 },
      { day: 'Пт', tasks: 15 },
      { day: 'Сб', tasks: 8 },
      { day: 'Вс', tasks: 5 },
  ];

  return (
    <div className="p-2 space-y-6">
      <h2 className="text-3xl font-bold text-white">Эффективность (KPI)</h2>
      
      <div className="grid gap-6">
          {visibleKPI.map((k, i) => (
              <div key={i} className="ios-glass p-6 rounded-[32px] flex flex-col md:flex-row items-center gap-8">
                  {/* Score Circle */}
                  <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="60" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" />
                          <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * k.score) / 100} className={k.color} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-4xl font-bold ${k.color}`}>{k.score}</span>
                          <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Score</span>
                      </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8 w-full text-center md:text-left">
                      <div>
                          <h3 className="text-2xl font-bold text-white mb-1">{k.user}</h3>
                          <p className="text-sm text-neutral-500 uppercase font-bold tracking-wider">{k.role}</p>
                      </div>
                      <div>
                          <p className="text-sm text-neutral-500 mb-1">Задачи</p>
                          <p className="text-xl font-bold text-white">{k.tasks}</p>
                      </div>
                      {k.secondaryMetric && (
                        <div>
                            <p className="text-sm text-neutral-500 mb-1">{k.secondaryLabel}</p>
                            <p className="text-xl font-bold text-white opacity-80">{k.secondaryMetric}</p>
                        </div>
                      )}
                  </div>

                  {/* Badge */}
                  <div className="hidden md:block pr-8">
                      {k.score >= 90 ? (
                          <Award size={48} className="text-yellow-500" />
                      ) : k.score >= 70 ? (
                           <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center text-neutral-500 font-bold">OK</div>
                      ) : (
                          <AlertCircle size={48} className="text-red-500" />
                      )}
                  </div>
              </div>
          ))}
      </div>

      {/* Analytics Chart */}
      <div className="ios-card p-6 rounded-[32px] border border-white/5">
          <h3 className="text-lg font-bold text-white mb-6">Скорость команды (Задачи / День)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
                    <XAxis dataKey="day" stroke="#666" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#1c1c1e', borderRadius: '12px', border: 'none'}} 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                        {velocityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 3 ? '#3b82f6' : '#3f3f46'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="ios-card p-6 rounded-[24px] bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
                <h4 className="text-blue-400 font-bold mb-2">Бонусная цель</h4>
                <p className="text-2xl font-bold text-white mb-1">+5%</p>
                <p className="text-xs text-neutral-400">К окладу при score &gt; 90</p>
            </div>
            <div className="ios-card p-6 rounded-[24px]">
                <h4 className="text-white font-bold mb-2">Текущий стрик</h4>
                <p className="text-2xl font-bold text-white mb-1">12 дней</p>
                <p className="text-xs text-neutral-400">Без просроченных дедлайнов</p>
            </div>
      </div>
    </div>
  );
};

export default KPI;
