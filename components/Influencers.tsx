

import React, { useState } from 'react';
import { usePlanner } from '../context';
import { Instagram, Plus, X, Trash2, Edit2, Truck, Link as LinkIcon, FileText, Package, Box, ArrowRight } from 'lucide-react';

const Influencers: React.FC = () => {
  const { influencers, addInfluencer, updateInfluencer, updateInfluencerStatus, deleteInfluencer, warehouse, updateStock } = usePlanner();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Sending Items Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState<string>('');
  const [sendQuantity, setSendQuantity] = useState(1);
  
  // Expanded State for Edit
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [roi, setRoi] = useState<number>(0);
  const [condition, setCondition] = useState<'Бартер' | 'Оплата'>('Бартер');
  const [trackingCode, setTrackingCode] = useState('');
  const [itemsSent, setItemsSent] = useState('');
  const [contentLink, setContentLink] = useState('');
  const [agreementText, setAgreementText] = useState('');

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if(!name) return;

      const data = { name, handle, roi, condition, trackingCode, itemsSent, contentLink, agreementText };

      if (editingId) {
          updateInfluencer(editingId, data);
      } else {
          addInfluencer({
              id: `i-${Date.now()}`,
              status: 'Переговоры',
              deadline: '---',
              ...data
          });
      }
      closeModal();
  };

  const handleSendItems = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedInfluencerId && selectedWarehouseItem) {
          const item = warehouse.find(w => w.id === selectedWarehouseItem);
          if (item) {
              // 1. Deduct from stock
              updateStock(selectedWarehouseItem, sendQuantity, 'Отправка');
              
              // 2. Update Influencer record
              const influencer = influencers.find(i => i.id === selectedInfluencerId);
              const newItemString = `${item.name} (${item.size}) x${sendQuantity}`;
              const currentItems = influencer?.itemsSent ? `${influencer.itemsSent}, ${newItemString}` : newItemString;
              
              updateInfluencer(selectedInfluencerId, { 
                  itemsSent: currentItems,
                  status: 'Отправлено'
              });
              
              setIsSendModalOpen(false);
              setSelectedWarehouseItem('');
              setSendQuantity(1);
          }
      }
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingId(null);
      setName(''); setHandle(''); setRoi(0); setTrackingCode(''); setItemsSent(''); setContentLink(''); setAgreementText('');
  };

  const openEditModal = (inf: any) => {
      setEditingId(inf.id);
      setName(inf.name); setHandle(inf.handle); setRoi(inf.roi || 0); setCondition(inf.condition);
      setTrackingCode(inf.trackingCode || '');
      setItemsSent(inf.itemsSent || '');
      setContentLink(inf.contentLink || '');
      setAgreementText(inf.agreementText || '');
      setIsModalOpen(true);
  };

  const openSendModal = (id: string) => {
      setSelectedInfluencerId(id);
      setIsSendModalOpen(true);
  };

  return (
    <div className="space-y-6 p-2 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold text-white">Блогеры</h2>
        <button onClick={() => setIsModalOpen(true)} className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg hover:bg-blue-400 transition-colors">
            <Plus size={20} />
        </button>
      </div>

      <div className="ios-glass rounded-[24px] overflow-hidden flex-1">
        <div className="overflow-y-auto h-full custom-scrollbar">
            {influencers.map((inf, idx) => (
              <div key={inf.id} className={`p-6 hover:bg-white/5 transition-colors cursor-default group ${idx !== influencers.length - 1 ? 'border-b border-white/5' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                            {inf.name[0]}
                        </div>
                        <div>
                            <h4 className="text-white font-semibold flex items-center gap-2 text-lg">
                                {inf.name}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold uppercase ${inf.condition === 'Оплата' ? 'border-yellow-500 text-yellow-500' : 'border-blue-500 text-blue-500'}`}>
                                    {inf.condition}
                                </span>
                            </h4>
                            <p className="text-sm text-neutral-500 flex items-center gap-1 hover:text-white transition-colors cursor-pointer"><Instagram size={12} /> {inf.handle}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                         <button 
                            onClick={() => {
                                const s = ['Переговоры', 'Отправлено', 'Опубликовано', 'Просрочено'];
                                updateInfluencerStatus(inf.id, s[(s.indexOf(inf.status) + 1) % s.length] as any);
                            }}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors flex-1 md:w-32 text-center
                            ${inf.status === 'Опубликовано' ? 'bg-green-500/20 text-green-400' : 
                            inf.status === 'Просрочено' ? 'bg-red-500/20 text-red-400' : 
                            'bg-white/10 text-white'}`}
                        >
                            {inf.status}
                        </button>
                        <button onClick={() => openEditModal(inf)} className="p-2 bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"><Edit2 size={16}/></button>
                    </div>
                </div>

                {/* Deep Details Block */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-900/30 rounded-xl p-4">
                    <div className="space-y-2">
                        <p className="text-[10px] text-neutral-500 uppercase font-bold flex items-center gap-1"><Truck size={10}/> Логистика</p>
                        <p className="text-xs text-neutral-300">{inf.trackingCode || 'Трек не указан'}</p>
                        <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                            <p className="text-[10px] text-neutral-400 truncate max-w-[100px]">{inf.itemsSent || 'Пусто'}</p>
                            <button onClick={() => openSendModal(inf.id)} className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500 hover:text-white transition-colors flex items-center gap-1">
                                <Box size={10} /> Отправить
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                         <p className="text-[10px] text-neutral-500 uppercase font-bold flex items-center gap-1"><LinkIcon size={10}/> Контент</p>
                         {inf.contentLink ? <a href="#" className="text-sm text-blue-400 hover:underline truncate block">Ссылка на пост</a> : <span className="text-sm text-neutral-500">Нет ссылки</span>}
                         <p className="text-xs text-neutral-500">Дедлайн: {inf.deadline}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-neutral-500 uppercase font-bold flex items-center gap-1"><FileText size={10}/> Условия</p>
                        <p className="text-xs text-neutral-400 line-clamp-2">{inf.agreementText || 'Нет описания'}</p>
                    </div>
                </div>

              </div>
            ))}
        </div>
      </div>

      {/* Main Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
             <div className="ios-card w-full max-w-lg p-6 rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">{editingId ? 'Редактировать' : 'Добавить контакт'}</h3>
                    <button onClick={closeModal}><X className="text-neutral-500 hover:text-white" /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Имя</label>
                            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" placeholder="Имя" autoFocus />
                        </div>
                         <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Аккаунт</label>
                            <input value={handle} onChange={e => setHandle(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" placeholder="@username" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Условия</label>
                            <select value={condition} onChange={e => setCondition(e.target.value as any)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none appearance-none">
                                <option>Бартер</option>
                                <option>Оплата</option>
                            </select>
                        </div>
                         <div>
                             <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">ROI (Заказы)</label>
                             <input type="number" value={roi || ''} onChange={e => setRoi(Number(e.target.value))} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" placeholder="0" />
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 space-y-3">
                        <h4 className="text-xs font-bold text-blue-400 uppercase">Детали отправки</h4>
                        <input value={trackingCode} onChange={e => setTrackingCode(e.target.value)} className="w-full bg-neutral-900 rounded-xl p-3 text-white outline-none text-sm" placeholder="Трек-номер" />
                        <input value={itemsSent} onChange={e => setItemsSent(e.target.value)} className="w-full bg-neutral-900 rounded-xl p-3 text-white outline-none text-sm" placeholder="Список вещей (Худи М, Футболка L)" />
                    </div>

                     <div className="border-t border-white/10 pt-4 space-y-3">
                        <h4 className="text-xs font-bold text-purple-400 uppercase">Договоренности</h4>
                        <textarea value={agreementText} onChange={e => setAgreementText(e.target.value)} className="w-full h-20 bg-neutral-900 rounded-xl p-3 text-white outline-none text-sm resize-none" placeholder="Текст условий или ссылка на скриншот..." />
                        <input value={contentLink} onChange={e => setContentLink(e.target.value)} className="w-full bg-neutral-900 rounded-xl p-3 text-white outline-none text-sm" placeholder="Ссылка на пост/сторис" />
                    </div>

                    <button type="submit" className="w-full bg-blue-500 py-3 rounded-xl text-white font-bold mt-2 hover:bg-blue-400 transition-colors shadow-lg shadow-blue-900/20">Сохранить</button>
                </form>
            </div>
        </div>
      )}

      {/* Send Items Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#1c1c1e] w-full max-w-sm p-6 rounded-[32px] shadow-2xl border border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Box size={18} className="text-blue-400"/> Отправка со склада</h3>
                    <button onClick={() => setIsSendModalOpen(false)}><X className="text-neutral-500 hover:text-white" /></button>
                </div>
                
                <form onSubmit={handleSendItems} className="space-y-4">
                    <div>
                        <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Выберите товар</label>
                        <select 
                            value={selectedWarehouseItem} 
                            onChange={e => setSelectedWarehouseItem(e.target.value)}
                            className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none appearance-none text-sm"
                        >
                            <option value="">-- Выбрать вещь --</option>
                            {warehouse.filter(w => w.stock > 0).map(w => (
                                <option key={w.id} value={w.id}>{w.name} [{w.size}] - (ост. {w.stock})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                         <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Количество</label>
                         <input 
                            type="number" 
                            min="1" 
                            value={sendQuantity || ''} 
                            onChange={e => setSendQuantity(Number(e.target.value))} 
                            className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none font-mono" 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={!selectedWarehouseItem}
                        className="w-full bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 py-3 rounded-xl text-white font-bold mt-2 hover:bg-blue-400 transition-colors flex items-center justify-center gap-2"
                    >
                        Списать и отправить <ArrowRight size={16} />
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Influencers;
