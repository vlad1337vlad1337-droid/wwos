

import React, { useState } from 'react';
import { usePlanner } from '../context';
import { Plus, Calculator, Search, Trash2, X, Edit2, ArrowUpDown, ArrowUp, ArrowDown, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { ExpenseItem, FinanceTransaction } from '../types';

const Finance: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, currentUser, finance } = usePlanner();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ExpenseItem> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ExpenseItem; direction: 'asc' | 'desc' } | null>(null);

  // Security Check (UI level only)
  if (currentUser.role !== 'OWNER') return <div className="p-10 text-center text-neutral-500">Доступ запрещен</div>;

  const uniqueCategories = ['Все', ...Array.from(new Set(expenses.map(e => e.category || 'Прочее')))];

  const handleSort = (key: keyof ExpenseItem) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const filteredExpenses = expenses
    .filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Все' || (e.category || 'Прочее') === selectedCategory;
        return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
    });

  // --- P&L CALCULATION ---
  const totalIncome = finance.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.totalCost, 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const totalCardCash = filteredExpenses.reduce((acc, curr) => acc + curr.paidCardCash, 0);
  const totalIpAccount = filteredExpenses.reduce((acc, curr) => acc + curr.paidIpAccount, 0);

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingItem?.name) return;

      const newItem: ExpenseItem = {
          id: editingItem.id || `ex-${Date.now()}`,
          name: editingItem.name,
          quantity: editingItem.quantity || 0,
          unit: editingItem.unit || 'шт',
          totalCost: editingItem.totalCost || 0,
          paidCardCash: editingItem.paidCardCash || 0,
          paidIpAccount: editingItem.paidIpAccount || 0,
          category: editingItem.category || 'Прочее'
      };

      if(editingItem.id) {
          updateExpense(editingItem.id, newItem);
      } else {
          addExpense(newItem);
      }
      closeModal();
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingItem(null);
  };

  const openNewModal = () => {
      setEditingItem({ name: '', quantity: 1, unit: 'шт', totalCost: 0, paidCardCash: 0, paidIpAccount: 0, category: 'Производство' });
      setIsModalOpen(true);
  };

  const openEditModal = (item: ExpenseItem) => {
      setEditingItem({ ...item });
      setIsModalOpen(true);
  };

  const SortHeader = ({ label, field, align = 'left' }: { label: string, field: keyof ExpenseItem, align?: string }) => (
    <div 
      onClick={() => handleSort(field)} 
      className={`cursor-pointer flex items-center gap-1 hover:text-white transition-colors select-none ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}
    >
        {label}
        {sortConfig?.key === field ? (
            sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
        ) : (
            <ArrowUpDown size={10} className="opacity-20" />
        )}
    </div>
  );

  return (
    <div className="h-full flex flex-col relative p-2 space-y-4">
      
      <h2 className="text-3xl font-bold text-white">Финансы</h2>

      {/* P&L Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-neutral-900 to-neutral-900 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp size={64} /></div>
              <p className="text-sm text-neutral-500 uppercase font-bold mb-1">Доходы (Входящие)</p>
              <p className="text-2xl font-mono font-bold text-white">{totalIncome.toLocaleString()} ₽</p>
          </div>
          
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-neutral-900 to-neutral-900 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><TrendingDown size={64} /></div>
              <p className="text-sm text-neutral-500 uppercase font-bold mb-1">Расходы (Исходящие)</p>
              <p className="text-2xl font-mono font-bold text-orange-400">{totalExpenses.toLocaleString()} ₽</p>
          </div>

          <div className={`p-6 rounded-[24px] border border-white/5 relative overflow-hidden group ${netProfit >= 0 ? 'bg-gradient-to-br from-green-900/20 to-emerald-900/20' : 'bg-gradient-to-br from-red-900/20 to-pink-900/20'}`}>
              <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}><DollarSign size={64} /></div>
              <p className="text-sm text-neutral-500 uppercase font-bold mb-1">Чистая Прибыль (Net Profit)</p>
              <div className="flex items-end gap-3">
                  <p className={`text-3xl font-mono font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {netProfit > 0 ? '+' : ''}{netProfit.toLocaleString()} ₽
                  </p>
                  <span className={`text-xs font-bold px-2 py-1 rounded bg-black/20 ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {profitMargin.toFixed(1)}%
                  </span>
              </div>
          </div>
      </div>

      {/* Header for Table */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4">
          <div className="text-sm font-bold text-neutral-400">Детализация расходов</div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="bg-white/10 rounded-full px-4 py-2.5 flex items-center gap-2 text-neutral-400 w-full md:w-auto">
                  <Filter size={16} />
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent outline-none text-sm appearance-none cursor-pointer pr-4 text-white w-full md:w-auto"
                  >
                      {uniqueCategories.map(cat => <option key={cat} value={cat} className="bg-[#1c1c1e] text-white">{cat}</option>)}
                  </select>
              </div>

              <div className="bg-white/10 rounded-full px-4 py-2.5 flex items-center gap-2 text-neutral-400 w-full md:w-64">
                    <Search size={16} />
                    <input 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-transparent outline-none text-sm w-full placeholder-neutral-500" 
                        placeholder="Поиск..." 
                    />
              </div>
              
              <button onClick={openNewModal} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-full flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-blue-900/20 transition-transform active:scale-95 w-full md:w-auto">
                <Plus size={18} /> Добавить
              </button>
          </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col overflow-hidden ios-glass rounded-[24px] border border-white/10 relative">
          <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#2c2c2e] border-b border-white/10 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      <div className="col-span-4"><SortHeader label="Наименование" field="name" /></div>
                      <div className="col-span-1 text-center"><SortHeader label="Кол-во" field="quantity" align="center" /></div>
                      <div className="col-span-1 text-center">Ед.изм</div>
                      <div className="col-span-2 text-right"><SortHeader label="Стоимость руб" field="totalCost" align="right" /></div>
                      <div className="col-span-2 text-right text-orange-300"><SortHeader label="КАРТА И НАЛ" field="paidCardCash" align="right" /></div>
                      <div className="col-span-2 text-right text-blue-300"><SortHeader label="ИП СЧЕТ" field="paidIpAccount" align="right" /></div>
                  </div>

                  {/* Table Body */}
                  <div className="overflow-y-auto flex-1 custom-scrollbar bg-[#1c1c1e]/90 max-h-[60vh]">
                      {filteredExpenses.map((item, idx) => (
                          <div 
                            key={item.id} 
                            className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors group text-sm ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}
                          >
                              <div className="col-span-4 flex flex-col justify-center">
                                  <div className="flex items-center gap-2 font-bold text-white truncate">
                                      {item.name}
                                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); openEditModal(item); }}
                                            className="p-1 text-neutral-500 hover:text-white"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteExpense(item.id); }}
                                            className="p-1 text-neutral-500 hover:text-red-500"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                      </div>
                                  </div>
                                  <span className="text-[10px] text-neutral-500 bg-white/5 self-start px-1.5 py-0.5 rounded mt-1">
                                     {item.category || 'Без категории'}
                                  </span>
                              </div>
                              <div className="col-span-1 text-center font-mono text-white">{item.quantity > 0 ? item.quantity : ''}</div>
                              <div className="col-span-1 text-center text-neutral-500">{item.unit}</div>
                              
                              {/* Стоимость */}
                              <div className="col-span-2 text-right font-mono text-white font-bold tracking-tight">
                                  {item.totalCost > 0 ? item.totalCost.toLocaleString('ru-RU', {minimumFractionDigits: 2}) : ''}
                              </div>
                              
                              {/* Карта и Нал */}
                              <div className="col-span-2 text-right font-mono text-neutral-300">
                                  {item.paidCardCash > 0 ? item.paidCardCash.toLocaleString('ru-RU', {minimumFractionDigits: 2}) : ''}
                              </div>

                              {/* ИП Счет */}
                              <div className="col-span-2 text-right font-mono text-neutral-300">
                                  {item.paidIpAccount > 0 ? item.paidIpAccount.toLocaleString('ru-RU', {minimumFractionDigits: 2}) : ''}
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Footer Totals - Sticky Bottom */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-5 bg-[#2c2c2e] border-t border-white/10 text-sm font-bold text-black">
                       <div className="col-span-6 text-right uppercase tracking-widest text-neutral-500 flex items-center justify-end pr-4">
                           ИТОГ:
                       </div>
                       <div className="col-span-2 text-right bg-orange-300 rounded-lg py-2 px-3 shadow-lg font-mono">
                           {totalExpenses.toLocaleString('ru-RU', {minimumFractionDigits: 2})}
                       </div>
                       <div className="col-span-2 text-right bg-[#e5e5ea] rounded-lg py-2 px-3 shadow-lg font-mono">
                           {totalCardCash.toLocaleString('ru-RU', {minimumFractionDigits: 0})}
                       </div>
                       <div className="col-span-2 text-right bg-[#d19a00] text-white rounded-lg py-2 px-3 shadow-lg font-mono">
                           {totalIpAccount.toLocaleString('ru-RU', {minimumFractionDigits: 0})}
                       </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#1c1c1e] w-full max-w-md rounded-[24px] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{editingItem.id ? 'Редактировать' : 'Новая запись'}</h3>
                    <button onClick={closeModal} className="text-neutral-500 hover:text-white transition-colors"><X size={24}/></button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs text-neutral-500 uppercase font-bold mb-1.5">Наименование</label>
                        <input 
                            value={editingItem.name} 
                            onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors"
                            placeholder="Например, Аренда"
                            autoFocus
                        />
                    </div>
                    
                    {/* Category */}
                    <div>
                        <label className="block text-xs text-neutral-500 uppercase font-bold mb-1.5">Категория</label>
                        <select 
                            value={editingItem.category} 
                            onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none appearance-none"
                        >
                             <option>Производство</option>
                             <option>Маркетинг</option>
                             <option>Офис</option>
                             <option>Зарплаты</option>
                             <option>Логистика</option>
                             <option>Прочее</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-neutral-500 uppercase font-bold mb-1.5">Количество</label>
                            <input 
                                type="number"
                                value={editingItem.quantity || ''} 
                                onChange={e => setEditingItem({...editingItem, quantity: Number(e.target.value)})}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none font-mono"
                            />
                        </div>
                         <div>
                            <label className="block text-xs text-neutral-500 uppercase font-bold mb-1.5">Ед. изм</label>
                            <input 
                                value={editingItem.unit} 
                                onChange={e => setEditingItem({...editingItem, unit: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 space-y-4">
                        <div>
                            <label className="block text-xs text-neutral-300 uppercase font-bold mb-1.5">Общая стоимость (Руб)</label>
                            <input 
                                type="number"
                                value={editingItem.totalCost || ''} 
                                onChange={e => setEditingItem({...editingItem, totalCost: Number(e.target.value)})}
                                className="w-full bg-neutral-800 border border-white/10 rounded-xl p-3 text-white font-mono outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-[10px] text-orange-400 uppercase font-bold">Карта и Нал</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingItem({...editingItem, paidCardCash: editingItem.totalCost || 0, paidIpAccount: 0})}
                                        className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded hover:bg-orange-500 hover:text-white transition-colors"
                                    >
                                        ВСЕ
                                    </button>
                                </div>
                                <input 
                                    type="number"
                                    value={editingItem.paidCardCash || ''} 
                                    onChange={e => setEditingItem({...editingItem, paidCardCash: Number(e.target.value)})}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white font-mono outline-none"
                                />
                            </div>
                             <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-[10px] text-blue-400 uppercase font-bold">ИП Счет</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingItem({...editingItem, paidIpAccount: editingItem.totalCost || 0, paidCardCash: 0})}
                                        className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded hover:bg-blue-500 hover:text-white transition-colors"
                                    >
                                        ВСЕ
                                    </button>
                                </div>
                                <input 
                                    type="number"
                                    value={editingItem.paidIpAccount || ''} 
                                    onChange={e => setEditingItem({...editingItem, paidIpAccount: Number(e.target.value)})}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white font-mono outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20 mt-4">
                        Сохранить
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Finance;