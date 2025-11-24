// components/Logs.tsx

import React, { useState } from 'react';
import { usePlanner } from '../context';
import { Search, Filter, AlertTriangle, CheckCircle, Info, Activity } from 'lucide-react';

const Logs: React.FC = () => {
  const { logs } = usePlanner();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState('ALL');
  const [onlyErrors, setOnlyErrors] = useState(false);

  const filteredLogs = logs.filter(log => {
      const matchesSearch = log.target.toLowerCase().includes(searchTerm.toLowerCase()) || log.action.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'ALL' || log.role === selectedRole;
      const matchesUser = selectedUser === 'ALL' || log.user === selectedUser;
      const matchesError = !onlyErrors || (log.type === 'warning');
      return matchesSearch && matchesRole && matchesUser && matchesError;
  });

  const getIcon = (type: string) => {
      switch(type) {
          case 'success': return <CheckCircle size={16} className="text-green-400" />;
          case 'warning': return <AlertTriangle size={16} className="text-orange-400" />;
          default: return <Info size={16} className="text-blue-400" />;
      }
  };

  return (
    <div className="h-full flex flex-col p-2 space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-white">Лог действий</h2>
            <div className="flex items-center gap-2">
                <div className="bg-[#1c1c1e] rounded-xl flex items-center px-3 py-2 border border-white/10">
                    <Search className="text-neutral-500 mr-2" size={16} />
                    <input 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-transparent outline-none text-white text-sm w-48 placeholder-neutral-600"
                        placeholder="Поиск..."
                    />
                </div>
                <button 
                    onClick={() => setOnlyErrors(!onlyErrors)}
                    className={`p-2 rounded-xl border border-white/10 transition-colors ${onlyErrors ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-[#1c1c1e] text-neutral-400'}`}
                >
                    <AlertTriangle size={20} />
                </button>
            </div>
        </div>

        {/* Filters Row */}
        <div className="flex gap-2 overflow-x-auto pb-2">
            <select 
                value={selectedRole} 
                onChange={e => setSelectedRole(e.target.value)}
                className="bg-[#1c1c1e] text-neutral-300 text-xs font-bold uppercase px-3 py-2 rounded-lg outline-none border border-white/10"
            >
                <option value="ALL">Все роли</option>
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="WAREHOUSE">Warehouse</option>
            </select>
             <select 
                value={selectedUser} 
                onChange={e => setSelectedUser(e.target.value)}
                className="bg-[#1c1c1e] text-neutral-300 text-xs font-bold uppercase px-3 py-2 rounded-lg outline-none border border-white/10"
            >
                <option value="ALL">Все пользователи</option>
                <option value="Алексей">Алексей</option>
                <option value="Мария">Мария</option>
                <option value="Степан">Степан</option>
            </select>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar ios-glass rounded-[24px] border border-white/5">
            {filteredLogs.map((log, index) => (
                <div key={log.id} className={`flex items-center gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
                    <div className="w-16 text-xs text-neutral-500 font-mono">{log.time}</div>
                    <div className="w-8 flex justify-center">{getIcon(log.type)}</div>
                    <div className="w-24">
                        <span className="text-sm font-bold text-white block">{log.user}</span>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">{log.role}</span>
                    </div>
                    <div className="flex-1 text-sm text-neutral-300">
                        <span className="text-neutral-500">{log.action}</span> <span className="text-white font-medium">{log.target}</span>
                    </div>
                </div>
            ))}
            {filteredLogs.length === 0 && (
                <div className="text-center py-20 text-neutral-600">
                    <Activity size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Записей не найдено</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Logs;