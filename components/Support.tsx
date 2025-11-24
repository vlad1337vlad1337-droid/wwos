
import React, { useState } from 'react';
import { usePlanner } from '../context';
import { MessageCircle, Send, Plus, X, Book, FileText, ChevronRight, GraduationCap, PlayCircle } from 'lucide-react';
import { SupportTicket } from '../types';

const Support: React.FC = () => {
  const { tickets, addTicketMessage, closeTicket, addTicket, currentUser } = usePlanner();
  const [activeTab, setActiveTab] = useState<'tickets' | 'wiki'>('tickets');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [issue, setIssue] = useState('');
  const [platform, setPlatform] = useState<'Instagram' | 'Telegram' | 'WhatsApp' | 'Email'>('Instagram');

  // Warehouse role only sees assigned tickets
  const visibleTickets = currentUser.role === 'WAREHOUSE' 
    ? tickets.filter(t => t.assignee === currentUser.name)
    : tickets;

  const activeTicket = visibleTickets.find(t => t.id === selectedId);

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if(selectedId && message) {
          addTicketMessage(selectedId, message, 'support');
          setMessage('');
      }
  };

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if(!clientName || !issue) return;
      
      addTicket({
          id: `st-${Date.now()}`,
          clientName,
          issue,
          platform,
          status: 'Новое',
          assignee: currentUser.role === 'WAREHOUSE' ? currentUser.name : 'Мария', // Default assign logic
          messages: [{ sender: 'client', text: issue, time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }]
      });
      
      setIsModalOpen(false);
      setClientName('');
      setIssue('');
  };

  const wikiArticles = [
      { id: 1, title: 'Стандарты упаковки: Бомбер V2', category: 'Склад', type: 'video', duration: '5 мин' },
      { id: 2, title: 'Скрипт: Работа с возвратами', category: 'Клиенты', type: 'text', duration: '3 мин' },
      { id: 3, title: 'Оформление накладной CDEK', category: 'Логистика', type: 'text', duration: '2 мин' },
      { id: 4, title: 'Приемка тканей: Чек-лист', category: 'Производство', type: 'doc', duration: '10 мин' },
  ];

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-2">
       
       {/* Sidebar (List) */}
       <div className={`flex-1 flex flex-col ${selectedId ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                  <button onClick={() => setActiveTab('tickets')} className={`text-2xl font-bold transition-colors ${activeTab === 'tickets' ? 'text-white' : 'text-neutral-600'}`}>
                      Тикеты
                  </button>
                  <button onClick={() => setActiveTab('wiki')} className={`text-2xl font-bold transition-colors ${activeTab === 'wiki' ? 'text-white' : 'text-neutral-600'}`}>
                      Обучение
                  </button>
              </div>
              {activeTab === 'tickets' && (
                  <button onClick={() => setIsModalOpen(true)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                      <Plus size={20} />
                  </button>
              )}
          </div>
          
          <div className="ios-glass rounded-[32px] overflow-hidden flex-1 flex flex-col">
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                  {activeTab === 'tickets' ? (
                      <>
                        {visibleTickets.map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => setSelectedId(t.id)}
                                className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${selectedId === t.id ? 'bg-blue-500/10' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-white">{t.clientName}</h4>
                                    <span className="text-xs text-neutral-500">{t.platform}</span>
                                </div>
                                <p className="text-sm text-neutral-300 truncate">{t.issue}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'Решено' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {t.status}
                                    </span>
                                    <span className="text-[10px] text-neutral-500">{t.messages[t.messages.length-1]?.time}</span>
                                </div>
                            </div>
                        ))}
                        {visibleTickets.length === 0 && <div className="p-8 text-center text-neutral-500">Нет обращений</div>}
                      </>
                  ) : (
                      <div className="p-2">
                          <div className="p-4 bg-blue-500/10 rounded-2xl mb-2 border border-blue-500/20">
                              <div className="flex items-center gap-3 mb-2">
                                  <GraduationCap size={24} className="text-blue-400" />
                                  <h4 className="text-blue-400 font-bold text-sm">Ваш прогресс</h4>
                              </div>
                              <div className="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 w-1/3"></div>
                              </div>
                              <p className="text-[10px] text-neutral-400 mt-1">1 из 4 курсов пройдено</p>
                          </div>

                          {wikiArticles.map(article => (
                              <div key={article.id} className="p-4 hover:bg-white/5 rounded-2xl cursor-pointer group flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white transition-colors relative">
                                      {article.type === 'video' ? <PlayCircle size={24} /> : <FileText size={24} />}
                                      {article.id === 1 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1c1c1e]" />}
                                  </div>
                                  <div className="flex-1">
                                      <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">{article.title}</h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-neutral-400">{article.category}</span>
                                          <span className="text-[10px] text-neutral-500">{article.duration}</span>
                                      </div>
                                  </div>
                                  <ChevronRight size={16} className="text-neutral-600" />
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
       </div>

       {/* Chat View / Wiki Content */}
       <div className={`flex-[2] flex flex-col ${!selectedId && activeTab === 'tickets' ? 'hidden md:flex' : 'flex'}`}>
            {activeTab === 'tickets' ? (
                activeTicket ? (
                    <div className="ios-card rounded-[32px] h-full flex flex-col overflow-hidden relative">
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedId(null)} className="md:hidden text-neutral-400">Назад</button>
                                <div>
                                    <h3 className="font-bold text-white">{activeTicket.clientName}</h3>
                                    <p className="text-xs text-neutral-400">{activeTicket.issue}</p>
                                </div>
                            </div>
                            {activeTicket.status !== 'Решено' && (
                                <button onClick={() => closeTicket(activeTicket.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold">
                                    Решить вопрос
                                </button>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-neutral-900/30">
                            {activeTicket.messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'support' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'support' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-800 text-white rounded-bl-none'}`}>
                                        {msg.text}
                                        <p className="text-[10px] opacity-50 mt-1 text-right">{msg.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 bg-neutral-800/50 backdrop-blur-md flex gap-3">
                            <input 
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                className="flex-1 bg-neutral-900 rounded-full px-4 py-3 text-white outline-none placeholder-neutral-500"
                                placeholder="Написать ответ..."
                            />
                            <button type="submit" className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-400 transition-colors">
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                        <MessageCircle size={64} className="opacity-20 mb-4" />
                        <p>Выберите диалог</p>
                    </div>
                )
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-600 bg-neutral-900/20 rounded-[32px] border border-white/5">
                    <GraduationCap size={64} className="opacity-20 mb-4" />
                    <p className="font-bold text-neutral-500">Центр обучения WASE WORM</p>
                    <p className="text-xs mt-2 opacity-50 max-w-xs text-center">Выберите курс из списка слева, чтобы начать просмотр обучающих материалов.</p>
                </div>
            )}
       </div>

       {/* New Ticket Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
             <div className="bg-[#1c1c1e] w-full max-w-sm p-6 rounded-[32px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Новое обращение</h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-neutral-500 hover:text-white" /></button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Имя клиента</label>
                        <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-blue-500" placeholder="Иван" autoFocus />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Проблема</label>
                        <textarea value={issue} onChange={e => setIssue(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-blue-500 h-24 resize-none" placeholder="Суть вопроса..." />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Платформа</label>
                         <select value={platform} onChange={e => setPlatform(e.target.value as any)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none appearance-none">
                            <option>Instagram</option>
                            <option>Telegram</option>
                            <option>WhatsApp</option>
                            <option>Email</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-500 py-3.5 rounded-xl text-white font-bold mt-2 shadow-lg shadow-blue-900/20 hover:bg-blue-400 transition-colors">Создать</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Support;
