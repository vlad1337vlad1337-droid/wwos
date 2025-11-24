

// components/Warehouse.tsx

import React, { useState } from 'react';
import { usePlanner } from '../context';
import { WarehouseItem, WarehouseLog, Status, Priority, TaskTag } from '../types';
import { Package, Search, ArrowUp, ArrowDown, Plus, History, RotateCcw, AlertTriangle, CheckCircle, Trash2, X } from 'lucide-react';

const Warehouse: React.FC = () => {
    const { warehouse, warehouseLogs, updateStock, addWarehouseItem, deleteWarehouseItem, addTask, currentUser } = usePlanner();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLogOpen, setIsLogOpen] = useState(false);
    
    // Add Item State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemSize, setNewItemSize] = useState('M');
    const [newItemSku, setNewItemSku] = useState('');
    const [newItemStock, setNewItemStock] = useState(0);

    const filteredItems = warehouse.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStartRevision = () => {
        addTask({
            id: `t-${Date.now()}`,
            title: `Ревизия склада: ${new Date().toLocaleDateString()}`,
            creator: currentUser.name,
            assignee: 'Степан',
            tag: TaskTag.WAREHOUSE,
            type: 'GENERAL',
            createdDate: new Date().toISOString(),
            deadline: new Date().toISOString(),
            priority: Priority.HIGH,
            status: Status.IN_PROGRESS,
            description: 'Пересчитать фактические остатки по всем позициям и сверить с системой.'
        });
        alert('Задача на ревизию создана!');
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newItemName) return;
        addWarehouseItem({
            id: `w-${Date.now()}`,
            name: newItemName,
            size: newItemSize,
            sku: newItemSku || `SKU-${Date.now()}`,
            stock: newItemStock,
            reserved: 0
        });
        setIsAddModalOpen(false);
        setNewItemName('');
        setNewItemSku('');
        setNewItemStock(0);
    };

    return (
        <div className="h-full flex flex-col p-2 space-y-4 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Склад</h2>
                    <p className="text-neutral-500 text-sm">Управление остатками</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={handleStartRevision} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 flex-1 justify-center">
                        <RotateCcw size={16} /> Ревизия
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20 flex-1 justify-center">
                        <Plus size={16} /> Товар
                    </button>
                </div>
            </div>

            {/* Search & Stats */}
            <div className="flex flex-col md:flex-row gap-4">
                 <div className="flex-1 bg-[#1c1c1e] rounded-2xl flex items-center px-4 py-3 border border-white/10">
                    <Search className="text-neutral-500 mr-3" size={20} />
                    <input 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-transparent outline-none text-white w-full placeholder-neutral-600"
                        placeholder="Поиск по названию или SKU..."
                    />
                 </div>
                 <button 
                    onClick={() => setIsLogOpen(!isLogOpen)}
                    className={`px-4 py-3 rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-colors ${isLogOpen ? 'bg-white text-black' : 'bg-[#1c1c1e] text-neutral-400 hover:text-white'}`}
                 >
                     <History size={20} /> <span className="md:hidden">История</span>
                 </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden relative">
                {/* Main List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-20">
                    {filteredItems.map(item => (
                        <div key={item.id} className="ios-card p-4 rounded-2xl flex items-center justify-between group hover:bg-white/[0.08] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400 relative shrink-0">
                                    <Package size={24} />
                                    {item.stock < 10 && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center border border-[#1c1c1e]">
                                            <span className="text-[10px] font-bold text-white">!</span>
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-white text-lg leading-tight truncate">{item.name} <span className="text-neutral-500 text-sm ml-1">({item.size})</span></h4>
                                    <p className="text-xs text-neutral-500 font-mono truncate">{item.sku}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                                <div className="text-right hidden sm:block">
                                    <div className={`text-2xl font-bold font-mono ${item.stock < 10 ? 'text-orange-400' : 'text-white'}`}>{item.stock}</div>
                                    <div className="text-[10px] text-neutral-500 uppercase">В наличии</div>
                                </div>
                                
                                <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-1 border border-white/5">
                                    <button 
                                        onClick={() => updateStock(item.id, 1, 'Отправка')}
                                        className="w-8 h-8 rounded-md hover:bg-red-500/20 hover:text-red-400 text-neutral-400 flex items-center justify-center transition-colors"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <div className="w-px h-4 bg-white/10" />
                                    <button 
                                        onClick={() => updateStock(item.id, 1, 'Приемка')}
                                        className="w-8 h-8 rounded-md hover:bg-green-500/20 hover:text-green-400 text-neutral-400 flex items-center justify-center transition-colors"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>
                                
                                {currentUser.role === 'OWNER' && (
                                    <button 
                                        onClick={() => deleteWarehouseItem(item.id)}
                                        className="w-8 h-8 rounded-full hover:bg-red-500/20 hover:text-red-500 text-neutral-600 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="text-center py-20 text-neutral-600">
                            <Package size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Товары не найдены</p>
                        </div>
                    )}
                </div>

                {/* Log Sidebar Overlay on Mobile */}
                {isLogOpen && (
                    <div className="absolute inset-0 md:relative md:w-80 bg-[#1c1c1e] border-l border-white/10 flex flex-col animate-in slide-in-from-right-10 duration-200 z-20 shadow-2xl md:shadow-none">
                        <div className="p-4 border-b border-white/10 font-bold text-neutral-400 uppercase text-xs flex justify-between items-center">
                            История операций
                            <button onClick={() => setIsLogOpen(false)} className="md:hidden p-1 bg-white/10 rounded-full"><X size={14}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {warehouseLogs.map(log => (
                                <div key={log.id} className="p-3 rounded-xl bg-white/5 text-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-bold ${log.action === 'Приемка' ? 'text-green-400' : log.action === 'Отправка' ? 'text-red-400' : 'text-blue-400'}`}>
                                            {log.action}
                                        </span>
                                        <span className="text-xs text-neutral-500">{log.date}</span>
                                    </div>
                                    <p className="text-white mb-1">{log.itemName}</p>
                                    <div className="flex justify-between items-center text-xs text-neutral-500">
                                        <span>Кол-во: <span className="text-white font-mono">{log.quantity}</span></span>
                                        <span>{log.user}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="ios-card w-full max-w-sm p-6 rounded-[32px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Новый товар</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X className="text-neutral-500 hover:text-white" /></button>
                        </div>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Название</label>
                                <input value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Размер</label>
                                    <select value={newItemSize} onChange={e => setNewItemSize(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none">
                                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">Нач. остаток</label>
                                    <input type="number" value={newItemStock || ''} onChange={e => setNewItemStock(Number(e.target.value))} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" />
                                </div>
                            </div>
                             <div>
                                <label className="text-xs text-neutral-500 font-bold uppercase ml-2 mb-1 block">SKU (Артикул)</label>
                                <input value={newItemSku} onChange={e => setNewItemSku(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" placeholder="Оставьте пустым для авто" />
                            </div>
                            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl mt-2">Создать</button>
                        </form>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default Warehouse;
