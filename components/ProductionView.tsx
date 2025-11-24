

// components/ProductionView.tsx

import React, { useState } from 'react';
import { usePlanner } from '../context';
import { ProductionItem, Status, Priority, TaskTag } from '../types';
import { Factory, AlertTriangle, Plus, X, Play, CheckCircle, Truck, DollarSign, Edit2, Box } from 'lucide-react';

const ProductionView: React.FC = () => {
    const { production, addProduction, updateProductionProgress, updateProductionStage, updateProductionItem, payProduction, addTask, currentUser } = usePlanner();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ProductionItem | null>(null);

    // Form fields for new item
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(100);
    const [batchPrice, setBatchPrice] = useState(0);
    const [samplePrice, setSamplePrice] = useState(0);
    
    // Payment Modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        if (editingItem && !isPaymentModalOpen) {
            updateProductionItem(editingItem.id, { name, quantity, batchPriceRMB: batchPrice, samplePriceRMB: samplePrice });
        } else if (!editingItem) {
            addProduction({
                id: `p-${Date.now()}`,
                name,
                quantity,
                batchPriceRMB: batchPrice,
                samplePriceRMB: samplePrice,
                costPriceRMB: Math.round(batchPrice / quantity) || 0,
                batchDeadline: '30 days',
                sampleDeadline: '10 days',
                stage: 'Закупка',
                status: 'В графике',
                progress: 0,
                paymentStatus: 'Ожидает'
            });
        }
        closeModal();
    };

    const openEdit = (item: ProductionItem) => {
        setEditingItem(item);
        setName(item.name);
        setQuantity(item.quantity);
        setBatchPrice(item.batchPriceRMB);
        setSamplePrice(item.samplePriceRMB);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingItem(null);
        setName('');
        setQuantity(100);
        setBatchPrice(0);
        setSamplePrice(0);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsPaymentModalOpen(false);
        setEditingItem(null);
    };

    const handleCreateTask = (type: 'WAREHOUSE' | 'QC') => {
        if (!editingItem || !editingItem.name) return;
        
        const title = type === 'WAREHOUSE' 
          ? `Принять партию: ${editingItem.name}` 
          : `ОТК Проверка: ${editingItem.name}`;
        
        const assignee = type === 'WAREHOUSE' ? 'Степан' : currentUser.name;
        const tag = type === 'WAREHOUSE' ? TaskTag.WAREHOUSE : TaskTag.PRODUCTION;
        const taskType = type === 'WAREHOUSE' ? 'WAREHOUSE_PACK' : 'PRODUCTION_QC';
  
        addTask({
            id: `t-${Date.now()}`,
            title,
            creator: currentUser.name,
            assignee,
            tag,
            type: taskType,
            createdDate: new Date().toISOString(),
            deadline: new Date(Date.now() + 86400000).toISOString(),
            priority: Priority.HIGH,
            status: Status.NEW,
            meta: {
                itemsSent: `${editingItem.quantity} шт`,
                relatedEntityId: editingItem.id // Deep Linking ID
            }
        });
        
        // Auto update stage if moving to warehouse
        if (type === 'WAREHOUSE') {
            updateProductionStage(editingItem.id, 'Готово');
            setEditingItem(prev => prev ? ({ ...prev, stage: 'Готово', progress: 100 }) : null);
        }
        alert('Задача создана');
    };

    const handlePay = () => {
        if (editingItem && paymentAmount > 0) {
            payProduction(editingItem.id, paymentAmount, 'Account');
            closeModal();
        }
    };

    return (
        <div className="space-y-6 p-2">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-white">Производство</h2>
                <button onClick={openNew} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
                    <Plus size={16} /> Партия
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {production.map(item => (
                    <div key={item.id} className="ios-card p-6 rounded-[32px] relative group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => openEdit(item)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400">
                                <Factory size={24} />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${item.status === 'Задержка' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {item.status}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                        <p className="text-sm text-neutral-500 mb-4">{item.quantity} шт • {item.stage}</p>
                        
                        <div className="w-full bg-neutral-800 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${item.progress}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-neutral-400">
                            <span>Прогресс</span>
                            <span>{item.progress}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit/Detail Modal */}
            {isModalOpen && editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="ios-card w-full max-w-2xl p-6 md:p-8 rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">{isPaymentModalOpen ? 'Оплата партии' : 'Детали партии'}</h3>
                            <button onClick={closeModal}><X className="text-neutral-500 hover:text-white" /></button>
                        </div>

                        {isPaymentModalOpen ? (
                             <div className="space-y-6">
                                <div>
                                    <label className="block text-xs text-neutral-500 uppercase font-bold mb-2">Сумма в рублях</label>
                                    <input 
                                        type="number" 
                                        value={paymentAmount || ''} 
                                        onChange={e => setPaymentAmount(Number(e.target.value))}
                                        className="w-full bg-neutral-800 rounded-xl p-4 text-white text-2xl font-mono outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <button onClick={handlePay} className="w-full bg-green-500 py-4 rounded-xl text-white font-bold text-lg hover:bg-green-400">
                                    Подтвердить оплату
                                </button>
                                <button onClick={() => setIsPaymentModalOpen(false)} className="w-full py-4 text-neutral-500">Назад</button>
                             </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs text-neutral-500 uppercase font-bold mb-2">Название</label>
                                        <input 
                                            value={name} 
                                            onChange={e => setName(e.target.value)}
                                            className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-neutral-500 uppercase font-bold mb-2">Количество</label>
                                        <input 
                                            type="number"
                                            value={quantity || ''} 
                                            onChange={e => setQuantity(Number(e.target.value))}
                                            className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Progress Control */}
                                <div className="bg-neutral-800/50 p-6 rounded-2xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-bold text-white">Текущий этап: <span className="text-purple-400">{editingItem.stage}</span></span>
                                        <span className="text-xs text-neutral-500">{editingItem.progress}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={editingItem.progress}
                                        onChange={(e) => updateProductionProgress(editingItem.id, Number(e.target.value))}
                                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <div className="flex justify-between mt-4 flex-wrap gap-1">
                                        {['Закупка', 'Лекала', 'Раскрой', 'Пошив', 'ОТК', 'Готово'].map(s => (
                                            <button 
                                                key={s}
                                                onClick={() => updateProductionStage(editingItem.id, s as any)}
                                                className={`text-[10px] px-2 py-1 rounded transition-colors ${editingItem.stage === s ? 'bg-purple-500 text-white' : 'text-neutral-500 hover:text-white'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button onClick={() => handleCreateTask('QC')} className="p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-2xl border border-blue-500/20 flex flex-col items-center gap-2 group transition-colors">
                                        <CheckCircle className="text-blue-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold text-blue-300">Создать задачу ОТК</span>
                                    </button>
                                    <button onClick={() => handleCreateTask('WAREHOUSE')} className="p-4 bg-orange-500/10 hover:bg-orange-500/20 rounded-2xl border border-orange-500/20 flex flex-col items-center gap-2 group transition-colors">
                                        <Box className="text-orange-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold text-orange-300">Приемка на склад</span>
                                    </button>
                                </div>

                                <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Финансы (RMB)</p>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-neutral-500">Партия</span>
                                                <span className="font-mono text-white">{editingItem.batchPriceRMB.toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-neutral-500">Сэмпл</span>
                                                <span className="font-mono text-white">{editingItem.samplePriceRMB.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsPaymentModalOpen(true)}
                                        disabled={editingItem.paymentStatus === 'Оплачено'}
                                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 w-full md:w-auto justify-center ${editingItem.paymentStatus === 'Оплачено' ? 'bg-green-500/20 text-green-400 cursor-default' : 'bg-white text-black hover:bg-neutral-200'}`}
                                    >
                                        {editingItem.paymentStatus === 'Оплачено' ? <CheckCircle size={16}/> : <DollarSign size={16}/>}
                                        {editingItem.paymentStatus === 'Оплачено' ? 'Оплачено' : 'Внести оплату'}
                                    </button>
                                </div>
                                
                                <button onClick={() => handleSave({ preventDefault: () => {} } as any)} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-colors">
                                    Сохранить изменения
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
             {/* New Item Modal (Simplified reuse of above structure or distinct) */}
             {isModalOpen && !editingItem && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="ios-card w-full max-w-lg p-6 rounded-[32px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Новая партия</h3>
                            <button onClick={closeModal}><X className="text-neutral-500 hover:text-white" /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs text-neutral-500 uppercase font-bold mb-2">Название</label>
                                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" autoFocus />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-neutral-500 uppercase font-bold mb-2">Количество</label>
                                    <input type="number" value={quantity || ''} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-neutral-500 uppercase font-bold mb-2">Цена партии (RMB)</label>
                                    <input type="number" value={batchPrice || ''} onChange={e => setBatchPrice(Number(e.target.value))} className="w-full bg-neutral-800 rounded-xl p-3 text-white outline-none" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-xl mt-2">Создать</button>
                        </form>
                    </div>
                 </div>
             )}
        </div>
    );
};

export default ProductionView;