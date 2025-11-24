

import React, { useState } from 'react';
import { usePlanner } from '../context';
import { Plus, Calendar, MapPin, Camera, DollarSign, ChevronRight, Trash2, X, Edit2, CheckCircle, Lock } from 'lucide-react';

const Shoots: React.FC = () => {
  const { shoots, addShoot, updateShoot, updateShootStatus, deleteShoot, currentUser, approveShootBudget } = usePlanner();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState(0);
  const [photosCount, setPhotosCount] = useState(0);
  const [date, setDate] = useState('');

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!title) return;

      if (editingId) {
          updateShoot(editingId, { title, location, budget, photosCount, date });
      } else {
          addShoot({
              id: `s-${Date.now()}`,
              title,
              date: date || new Date().toISOString().split('T')[0],
              location,
              budget,
              status: 'Планирование',
              isBudgetApproved: false,
              photosCount
          });
      }
      closeModal();
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingId(null);
      setTitle('');
      setLocation('');
      setBudget(0);
      setPhotosCount(0);
      setDate('');
  };

  const openEditModal = (s: any) => {
      setEditingId(s.id);
      setTitle(s.title);
      setLocation(s.location);
      setBudget(s.budget);
      setPhotosCount(s.photosCount);
      setDate(s.date);
      setIsModalOpen(true);
  };

  const getStatusColor = (s: string) => {
      if(s === 'Планирование') return 'text-blue-400 bg-blue-500/20';
      if(s === 'Ожидает бюджета') return 'text-orange-400 bg-orange-500/20';
      if(s === 'Съемка') return 'text-pink-400 bg-pink-500/20';
      if(s === 'Ретушь') return 'text-purple-400 bg-purple-500/20';
      return 'text-green-400 bg-green-500/20';
  };

  return (
    <div className="space-y-6 p-2 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">Съемки</h2>
        <button onClick={() => { closeModal(); setIsModalOpen(true); }} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
             <Plus size={16} /> Проект
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shoots.map(shoot => (
              <div key={shoot.id} className="ios-card p-6 rounded-[32px] relative overflow-hidden group">
                  
                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button onClick={() => openEditModal(shoot)} className="p-2 bg-neutral-800/80 rounded-lg text-neutral-400 hover:text-white transition-colors backdrop-blur-sm"><Edit2 size={16} /></button>
                      <button onClick={() => deleteShoot(shoot.id)} className="p-2 bg-neutral-800/80 rounded-lg text-neutral-400 hover:text-red-500 transition-colors backdrop-blur-sm"><Trash2 size={16} /></button>
                  </div>

                  <div className="flex justify-between items-start mb-4 pr-20">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(shoot.status)}`}>
                          {shoot.status}
                      </div>
                      
                      {/* Status Switcher or Lock */}
                      {!shoot.isBudgetApproved && shoot.status === 'Планирование' ? (
                          <button 
                            onClick={() => updateShootStatus(shoot.id, 'Ожидает бюджета')}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors"
                          >
                              <ChevronRight size={16} className="text-neutral-400" />
                          </button>
                      ) : !shoot.isBudgetApproved && shoot.status === 'Ожидает бюджета' ? (
                          currentUser.role === 'OWNER' ? (
                              <button 
                                onClick={() => approveShootBudget(shoot.id)}
                                className="px-3 py-1 bg-green-500 hover:bg-green-400 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg shadow-green-500/20"
                              >
                                  <CheckCircle size={12} /> Утвердить
                              </button>
                          ) : (
                              <div className="flex items-center gap-1 text-neutral-500 text-xs bg-neutral-800 px-2 py-1 rounded-lg">
                                  <Lock size={10} /> Ждем
                              </div>
                          )
                      ) : (
                           <button 
                            onClick={() => {
                                const stages = ['Съемка', 'Ретушь', 'Готово'];
                                const next = stages[(stages.indexOf(shoot.status) + 1) % stages.length];
                                if(shoot.status !== 'Готово') updateShootStatus(shoot.id, next as any);
                            }}
                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-colors"
                          >
                              <ChevronRight size={16} className="text-neutral-400" />
                          </button>
                      )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{shoot.title}</h3>
                  
                  <div className="space-y-3 text-sm text-neutral-400">
                      <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{shoot.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span>{shoot.location}</span>
                      </div>
                      
                      {/* Budget Line */}
                      <div className="flex items-center justify-between bg-neutral-800/50 p-2 rounded-lg border border-white/5">
                          <div className="flex items-center gap-2 text-neutral-300">
                              <Camera size={14} />
                              <span>{shoot.photosCount} фото</span>
                          </div>
                          <div className={`flex items-center gap-1 font-bold ${shoot.isBudgetApproved ? 'text-green-400' : 'text-orange-400'}`}>
                              {shoot.budget.toLocaleString()} ₽
                              {!shoot.isBudgetApproved && <Lock size={10} />}
                          </div>
                      </div>
                  </div>

                  <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${getStatusColor(shoot.status).split(' ')[0].replace('text', 'bg').replace('400', '500')}`} style={{width: shoot.status === 'Готово' ? '100%' : shoot.status === 'Ретушь' ? '75%' : shoot.status === 'Съемка' ? '50%' : '10%'}}></div>
                  </div>
              </div>
          ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
             <div className="ios-card w-full max-w-sm p-6 rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">{editingId ? 'Редактировать' : 'Новая съемка'}</h3>
                    <button onClick={closeModal}><X className="text-neutral-500 hover:text-white" /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-3">
                    <div>
                        <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Название</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" placeholder="Название" autoFocus />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Дата</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none text-sm" />
                        </div>
                         <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Бюджет (₽)</label>
                            <input type="number" value={budget || ''} onChange={e => setBudget(Number(e.target.value))} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Локация</label>
                        <input value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" placeholder="Студия, Улица..." />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Кол-во фото</label>
                        <input type="number" value={photosCount || ''} onChange={e => setPhotosCount(Number(e.target.value))} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" placeholder="0" />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button type="submit" className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-400 transition-colors">{editingId ? 'Сохранить' : 'Создать'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Shoots;
