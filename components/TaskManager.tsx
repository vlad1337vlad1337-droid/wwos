
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Trash2, X, User, PenTool, Image as ImageIcon, List, Eraser, CheckSquare, Calendar, Clock, ArrowRight, Paperclip, Share2, Play, AlertTriangle, Type, Layout, Grid3X3, Briefcase, Archive, Filter, ChevronRight, GripVertical, Search, Upload, Copy, History, FileText, RefreshCw } from 'lucide-react';
import { usePlanner } from '../context';
import { Status, Priority, Task, TaskTag, ChecklistItem, ContentBlock, BlockType, TableData, User as UserType } from '../types';

// --- UTILS ---
const priorityColor = {
  [Priority.LOW]: 'bg-neutral-500',
  [Priority.MEDIUM]: 'bg-blue-500',
  [Priority.HIGH]: 'bg-orange-500',
  [Priority.CRITICAL]: 'bg-red-500',
};

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

// --- DRAWING COMPONENT (Creative Studio) ---
const DrawingCanvas: React.FC<{ initialData?: string; onSave: (data: string) => void }> = ({ initialData, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#3b82f6');
    const [lineWidth, setLineWidth] = useState(3);
    const [mode, setMode] = useState<'draw' | 'erase'>('draw');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const img = new Image();
        if (initialData) {
            img.src = initialData;
            img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = '#1c1c1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.strokeStyle = mode === 'erase' ? '#1c1c1e' : color;
        ctx.lineWidth = mode === 'erase' ? 20 : lineWidth;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (canvasRef.current) {
                onSave(canvasRef.current.toDataURL());
            }
        }
    };
    
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;
        ctx.fillStyle = '#1c1c1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        onSave('');
    };

    return (
        <div className="flex flex-col h-full select-none">
            <div className="flex justify-between items-center mb-2 bg-neutral-900/50 p-2 rounded-2xl border border-white/5 flex-wrap gap-2">
                 <div className="flex gap-2 overflow-x-auto">
                     <button onClick={() => setMode('draw')} className={`p-2 rounded-xl transition-colors ${mode === 'draw' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-neutral-400 hover:bg-white/5'}`}>
                         <PenTool size={18} />
                     </button>
                     <button onClick={() => setMode('erase')} className={`p-2 rounded-xl transition-colors ${mode === 'erase' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:bg-white/5'}`}>
                         <Eraser size={18} />
                     </button>
                     <div className="w-px h-8 bg-white/10 mx-2" />
                     {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ffffff'].map(c => (
                         <button 
                            key={c}
                            onClick={() => { setColor(c); setMode('draw'); }}
                            className={`w-8 h-8 rounded-full border-2 shrink-0 transition-transform active:scale-95 ${color === c && mode === 'draw' ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                         />
                     ))}
                 </div>
                 <button onClick={clearCanvas} className="text-xs text-neutral-500 hover:text-white px-3 font-medium">Очистить</button>
            </div>
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-[#1c1c1e] shadow-inner">
                <canvas 
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
        </div>
    );
};

// --- TASK TIMER ---
const TaskTimer: React.FC<{ deadline: string }> = ({ deadline }) => {
    const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, isOverdue: boolean}>({days:0, hours:0, minutes:0, isOverdue:false});

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(deadline).getTime();
            const dist = end - now;

            if (dist < 0) {
                setTimeLeft({ days: Math.floor(Math.abs(dist) / (1000 * 60 * 60 * 24)), hours: 0, minutes: 0, isOverdue: true });
            } else {
                const days = Math.floor(dist / (1000 * 60 * 60 * 24));
                const hours = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft({ days, hours, minutes, isOverdue: false });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [deadline]);

    if (timeLeft.isOverdue) {
        return (
            <div className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg border border-red-500/20 text-xs font-bold flex items-center gap-2 animate-pulse">
                <AlertTriangle size={14} /> Просрочено на {timeLeft.days} дн
            </div>
        );
    }

    const isUrgent = timeLeft.days < 1;

    return (
        <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-bold font-mono transition-colors ${isUrgent ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-neutral-800 text-neutral-400 border-white/5'}`}>
            <Clock size={14} />
            {timeLeft.days}д {timeLeft.hours}ч {timeLeft.minutes}м
        </div>
    );
};

// --- CHECKLIST COMPONENT ---
const Checklist: React.FC<{ items: ChecklistItem[]; onChange: (items: ChecklistItem[]) => void; currentUser: UserType }> = ({ items, onChange, currentUser }) => {
    const [newItem, setNewItem] = useState('');
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachingToId, setAttachingToId] = useState<string | null>(null);

    const toggle = (id: string) => {
        onChange(items.map(i => i.id === id ? { ...i, isDone: !i.isDone } : i));
    };

    const add = () => {
        if (!newItem.trim()) return;
        onChange([...items, { id: `c-${Date.now()}`, text: newItem, isDone: false, createdBy: currentUser.name, description: '', images: [] }]);
        setNewItem('');
    };

    const remove = (id: string, createdBy: string) => {
        if (createdBy !== currentUser.name && currentUser.role !== 'OWNER') {
            alert('Вы не можете удалить этот пункт, так как его добавил другой сотрудник.');
            return;
        }
        onChange(items.filter(i => i.id !== id));
    };

    const updateDescription = (id: string, desc: string) => {
        onChange(items.map(i => i.id === id ? { ...i, description: desc } : i));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && attachingToId) {
            const file = e.target.files[0];
            const base64 = await toBase64(file);
            onChange(items.map(i => {
                if (i.id === attachingToId) {
                    return { ...i, images: [...(i.images || []), base64] };
                }
                return i;
            }));
        }
        setAttachingToId(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const triggerFileUpload = (id: string) => {
        setAttachingToId(id);
        fileInputRef.current?.click();
    };

    const removeImage = (itemId: string, imgIndex: number) => {
         onChange(items.map(i => {
            if (i.id === itemId && i.images) {
                const newImages = [...i.images];
                newImages.splice(imgIndex, 1);
                return { ...i, images: newImages };
            }
            return i;
        }));
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (!draggingId || draggingId === id) return;
        
        const dragIndex = items.findIndex(i => i.id === draggingId);
        const hoverIndex = items.findIndex(i => i.id === id);
        
        const newItems = [...items];
        const [movedItem] = newItems.splice(dragIndex, 1);
        newItems.splice(hoverIndex, 0, movedItem);
        
        onChange(newItems);
    };

    const handleDragEnd = () => {
        setDraggingId(null);
    };

    return (
        <div className="space-y-3">
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

            <div className="flex gap-2 bg-neutral-900/50 p-1 rounded-xl border border-white/5">
                <input 
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    placeholder="Добавить шаг..."
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder-neutral-600 min-w-0"
                    onKeyDown={e => e.key === 'Enter' && add()}
                />
                <button onClick={add} className="bg-white/10 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors flex-shrink-0">
                    <Plus size={16} />
                </button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {items.map(item => {
                    const canDelete = item.createdBy === currentUser.name || currentUser.role === 'OWNER';
                    return (
                        <div 
                            key={item.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDragEnd={handleDragEnd}
                            className={`group bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/5 ${draggingId === item.id ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="cursor-move text-neutral-600 hover:text-white mt-1 flex-shrink-0"><GripVertical size={14} /></div>
                                <div 
                                    className={`mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${item.isDone ? 'bg-green-500 border-green-500 scale-110' : 'border-neutral-500'}`}
                                    onClick={() => toggle(item.id)}
                                >
                                    {item.isDone && <Check size={12} className="text-black stroke-[3]" />}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="cursor-pointer truncate" onClick={() => toggle(item.id)}>
                                            <span className={`block text-sm font-medium ${item.isDone ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>{item.text}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                             <button 
                                                onClick={() => setEditingDescriptionId(editingDescriptionId === item.id ? null : item.id)} 
                                                className="p-1 text-neutral-500 hover:text-blue-400"
                                                title="Добавить описание"
                                            >
                                                <List size={12} />
                                            </button>
                                            <button 
                                                onClick={() => triggerFileUpload(item.id)}
                                                className="p-1 text-neutral-500 hover:text-purple-400"
                                                title="Прикрепить фото"
                                            >
                                                <Paperclip size={12} />
                                            </button>
                                            {canDelete && (
                                                <button onClick={() => remove(item.id, item.createdBy)} className="p-1 text-neutral-500 hover:text-red-500">
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <span className="text-[9px] text-neutral-600 flex items-center gap-1 mt-0.5"><User size={8}/> {item.createdBy || 'Система'}</span>

                                    {(item.description || editingDescriptionId === item.id) && (
                                        <div className="mt-2">
                                            {editingDescriptionId === item.id ? (
                                                <textarea 
                                                    value={item.description || ''}
                                                    onChange={(e) => updateDescription(item.id, e.target.value)}
                                                    className="w-full bg-black/40 text-xs text-neutral-300 p-2 rounded-lg outline-none resize-none border border-white/5 focus:border-blue-500/30"
                                                    rows={2}
                                                    placeholder="Добавить заметку..."
                                                    autoFocus
                                                    onBlur={() => setEditingDescriptionId(null)}
                                                />
                                            ) : (
                                                <div 
                                                    onClick={() => setEditingDescriptionId(item.id)}
                                                    className="text-[11px] text-neutral-400 bg-black/20 p-2 rounded-lg cursor-text hover:text-neutral-300 break-words"
                                                >
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {item.images && item.images.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {item.images.map((img, idx) => (
                                                <div key={idx} className="relative group/img w-12 h-12 rounded-lg overflow-hidden border border-white/10">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <button 
                                                        onClick={() => removeImage(item.id, idx)}
                                                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- RICH BLOCK EDITOR ---
const BlockEditor: React.FC<{ blocks: ContentBlock[], onChange: (blocks: ContentBlock[]) => void, readOnly?: boolean }> = ({ blocks, onChange, readOnly }) => {
    
    const addBlock = (type: BlockType) => {
        if (readOnly) return;
        const newBlock: ContentBlock = {
            id: `b-${Date.now()}`,
            type,
            content: type === 'table' ? { headers: ['Колонка 1', 'Колонка 2'], rows: [['', '']] } : ''
        };
        onChange([...blocks, newBlock]);
    };

    const updateBlock = (id: string, content: string | TableData) => {
        if (readOnly) return;
        onChange(blocks.map(b => b.id === id ? { ...b, content } : b));
    };

    const removeBlock = (id: string) => {
        if (readOnly) return;
        onChange(blocks.filter(b => b.id !== id));
    };

    const updateTable = (blockId: string, rowIndex: number, colIndex: number, value: string) => {
        if (readOnly) return;
        const block = blocks.find(b => b.id === blockId);
        if (block && typeof block.content !== 'string') {
            const newRows = [...block.content.rows];
            newRows[rowIndex][colIndex] = value;
            updateBlock(blockId, { ...block.content, rows: newRows });
        }
    };

    const addTableRow = (blockId: string) => {
        if (readOnly) return;
        const block = blocks.find(b => b.id === blockId);
        if (block && typeof block.content !== 'string') {
            const newRow = new Array(block.content.headers.length).fill('');
            updateBlock(blockId, { ...block.content, rows: [...block.content.rows, newRow] });
        }
    };
    
    const addTableCol = (blockId: string) => {
        if (readOnly) return;
        const block = blocks.find(b => b.id === blockId);
        if (block && typeof block.content !== 'string') {
            const newHeaders = [...block.content.headers, `Col ${block.content.headers.length + 1}`];
            const newRows = block.content.rows.map(row => [...row, '']);
            updateBlock(blockId, { headers: newHeaders, rows: newRows });
        }
    };

    return (
        <div className="space-y-4">
            {blocks.map(block => (
                <div key={block.id} className="group relative">
                    {!readOnly && (
                        <button 
                            onClick={() => removeBlock(block.id)}
                            className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 p-1 text-neutral-600 hover:text-red-500"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    
                    {block.type === 'h1' && (
                        <input 
                            value={block.content as string}
                            onChange={e => updateBlock(block.id, e.target.value)}
                            className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder-neutral-700 whitespace-pre-wrap break-words"
                            placeholder="Заголовок..."
                            readOnly={readOnly}
                        />
                    )}
                    {block.type === 'text' && (
                         <textarea 
                            value={block.content as string}
                            onChange={e => updateBlock(block.id, e.target.value)}
                            className="w-full bg-transparent text-neutral-300 outline-none resize-none min-h-[40px] leading-relaxed whitespace-pre-wrap break-words"
                            placeholder="Напишите что-нибудь..."
                            readOnly={readOnly}
                            rows={(block.content as string).split('\n').length || 1}
                        />
                    )}
                    {block.type === 'table' && (
                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-neutral-900/30 max-w-full">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-neutral-500 uppercase bg-white/5">
                                    <tr>
                                        {(block.content as TableData).headers.map((h, i) => (
                                            <th key={i} className="px-4 py-2 border-r border-white/5 last:border-0 font-medium min-w-[100px]">
                                                {readOnly ? h : (
                                                    <input 
                                                        value={h} 
                                                        onChange={(e) => {
                                                            const newH = [...(block.content as TableData).headers];
                                                            newH[i] = e.target.value;
                                                            updateBlock(block.id, { ...(block.content as TableData), headers: newH });
                                                        }} 
                                                        className="bg-transparent outline-none w-full"
                                                    />
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(block.content as TableData).rows.map((row, rIdx) => (
                                        <tr key={rIdx} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                                            {row.map((cell, cIdx) => (
                                                <td key={cIdx} className="px-4 py-2 border-r border-white/5 last:border-0 min-w-[100px]">
                                                    <input 
                                                        value={cell}
                                                        onChange={e => updateTable(block.id, rIdx, cIdx, e.target.value)}
                                                        className="bg-transparent outline-none w-full text-neutral-300"
                                                        readOnly={readOnly}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!readOnly && (
                                <div className="flex gap-2 p-2 border-t border-white/5 bg-neutral-900/50 sticky left-0">
                                    <button onClick={() => addTableRow(block.id)} className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 text-neutral-300">+ Строка</button>
                                    <button onClick={() => addTableCol(block.id)} className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 text-neutral-300">+ Столбец</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {!readOnly && (
                <div className="flex gap-2 py-4 border-t border-white/5 mt-6 opacity-50 hover:opacity-100 transition-opacity">
                    <button onClick={() => addBlock('text')} className="flex items-center gap-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                        <Type size={14} /> Текст
                    </button>
                    <button onClick={() => addBlock('h1')} className="flex items-center gap-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                        <Layout size={14} /> Заголовок
                    </button>
                     <button onClick={() => addBlock('table')} className="flex items-center gap-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                        <Grid3X3 size={14} /> Таблица
                    </button>
                </div>
            )}
        </div>
    );
};

// --- HISTORY COLUMN CARD ---
const HistoryTaskCard: React.FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="bg-[#1c1c1e] p-3 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer transition-all group relative flex flex-col gap-2"
        >
            {/* Priority Dot */}
            <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${priorityColor[task.priority]}`} />
            
            <div>
                <div className="text-[10px] text-neutral-500 font-mono mb-1">#{task.id.slice(-4).toUpperCase()}</div>
                <h4 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">{task.title}</h4>
            </div>

            {/* Description Snippet */}
            {task.description && (
                <p className="text-[11px] text-neutral-500 line-clamp-2 bg-black/20 p-1.5 rounded">
                    {task.description}
                </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] text-neutral-600 font-mono flex items-center gap-1">
                    <Calendar size={10}/> {new Date(task.completedAt || task.deadline).toLocaleDateString('ru-RU', {day: 'numeric', month: 'numeric'})}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-neutral-800 text-neutral-400 uppercase font-bold border border-white/5">
                    {task.tag}
                </span>
            </div>
        </div>
    );
};

// --- MAIN TASK MANAGER ---
const TaskManager: React.FC = () => {
  const { tasks, addTask, updateTask, updateTaskStatus, deleteTask, currentUser, team } = usePlanner();
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'DELEGATED' | 'HISTORY'>('PERSONAL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [studioTab, setStudioTab] = useState<'info' | 'canvas' | 'moodboard'>('info');
  const moodboardPasteRef = useRef<HTMLDivElement>(null);
  const [mobileModalTab, setMobileModalTab] = useState<'DETAILS' | 'STUDIO'>('DETAILS');
  
  // Archive Search & Filters
  const [archiveSearch, setArchiveSearch] = useState('');
  // Date Range Filter for History - Default to last 30 days to ensure data visibility
  const [historyStart, setHistoryStart] = useState(new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0]); 
  const [historyEnd, setHistoryEnd] = useState(new Date().toISOString().split('T')[0]);
  const [isDateFilterActive, setIsDateFilterActive] = useState(true);

  // New Task Form State
  const [formState, setFormState] = useState<Partial<Task>>({
      title: '',
      assignee: currentUser.name,
      priority: Priority.MEDIUM,
      tag: TaskTag.PRODUCTION,
      status: Status.NEW,
      deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      contentBlocks: [{ id: 'b1', type: 'text', content: '' }]
  });

  // --- MOODBOARD LOGIC ---
  const handleMoodboardPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
              const file = items[i].getAsFile();
              if (file) {
                  const base64 = await toBase64(file);
                  handleAttachment(base64);
              }
          }
      }
  };

  useEffect(() => {
      const el = moodboardPasteRef.current;
      if (studioTab === 'moodboard' && el) {
           el.addEventListener('paste', handleMoodboardPaste as any);
           return () => el.removeEventListener('paste', handleMoodboardPaste as any);
      }
  }, [studioTab, formState.attachments]);

  const handleMoodboardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const base64 = await toBase64(e.target.files[0]);
          handleAttachment(base64);
      }
  };

  const resetForm = () => {
      setFormState({
          title: '',
          assignee: currentUser.name,
          priority: Priority.MEDIUM,
          tag: TaskTag.PRODUCTION,
          status: Status.NEW,
          deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          sketch: '',
          description: '',
          checklist: [],
          attachments: [],
          contentBlocks: [{ id: 'b1', type: 'text', content: '' }]
      });
      setEditingTask(null);
      setStudioTab('info');
      setMobileModalTab('DETAILS');
  };

  const openNewTask = () => {
      resetForm();
      setIsModalOpen(true);
  };

  const openTask = (task: Task) => {
      setEditingTask(task);
      setFormState({ ...task, deadline: task.deadline.split('T')[0], contentBlocks: task.contentBlocks || (task.description ? [{id: 'legacy', type: 'text', content: task.description}] : []) });
      setStudioTab('info');
      setMobileModalTab('DETAILS');
      setIsModalOpen(true);
  };

  const saveTask = () => {
      if (!formState.title) return;
      
      const payload = {
          ...formState,
          deadline: formState.deadline || new Date().toISOString(),
      };

      if (editingTask) {
          updateTask(editingTask.id, payload);
      } else {
          addTask({
              id: `t-${Date.now()}`,
              createdDate: new Date().toISOString(),
              creator: currentUser.name,
              type: 'GENERAL',
              ...(payload as Task)
          });
      }
      setIsModalOpen(false);
  };

  const isChecklistComplete = () => {
      if (!formState.checklist || formState.checklist.length === 0) return true;
      return formState.checklist.every(item => item.isDone);
  };

  const handleStartTask = () => {
      if(editingTask) {
          updateTaskStatus(editingTask.id, Status.IN_PROGRESS);
          setEditingTask({...editingTask, status: Status.IN_PROGRESS});
          setFormState(prev => ({...prev, status: Status.IN_PROGRESS}));
      }
  };

  const handleSubmitForReview = () => {
      if(!isChecklistComplete()) {
          alert('Вы не можете отправить задачу на проверку, пока не выполнены все пункты чек-листа!');
          return;
      }

      if(editingTask) {
          updateTaskStatus(editingTask.id, Status.REVIEW);
          setEditingTask({...editingTask, status: Status.REVIEW});
          setFormState(prev => ({...prev, status: Status.REVIEW}));
      }
  };

  const handleApprove = () => {
      if(editingTask) {
          updateTaskStatus(editingTask.id, Status.DONE);
          setEditingTask({...editingTask, status: Status.DONE});
          setFormState(prev => ({...prev, status: Status.DONE}));
          setIsModalOpen(false);
      }
  };

  const handleReject = () => {
      if(editingTask) {
          updateTaskStatus(editingTask.id, Status.IN_PROGRESS);
          setEditingTask({...editingTask, status: Status.IN_PROGRESS});
          setFormState(prev => ({...prev, status: Status.IN_PROGRESS}));
          alert('Задача возвращена в работу');
      }
  };

  const handleAttachment = (url: string) => {
      const current = formState.attachments || [];
      setFormState(prev => ({ ...prev, attachments: [...current, url] }));
  };

  const isReviewer = editingTask && (editingTask.creator === currentUser.name || currentUser.role === 'OWNER');
  const isAssignee = editingTask && editingTask.assignee === currentUser.name;
  const canDelete = editingTask && (editingTask.creator === currentUser.name || currentUser.role === 'OWNER');

  // --- FILTERING & GROUPING FOR HISTORY ---
  const getHistoryColumns = () => {
      const completedTasks = tasks.filter(t => {
          const isDone = t.status === Status.DONE;
          const matchesSearch = t.title.toLowerCase().includes(archiveSearch.toLowerCase());
          
          // Date Range Logic (Only if filter is active)
          const taskDate = t.completedAt ? t.completedAt.split('T')[0] : t.deadline.split('T')[0];
          const inRange = !isDateFilterActive || (taskDate >= historyStart && taskDate <= historyEnd);

          return isDone && matchesSearch && inRange;
      });

      // Group by Assignee - Initialize with all team members to show empty columns too
      const grouped: Record<string, Task[]> = {};
      // Ensure we have columns for known users even if empty
      const knownUsers = Array.from(new Set([...team.map(u => u.name), ...completedTasks.map(t => t.assignee)]));
      
      knownUsers.forEach(user => {
          grouped[user] = [];
      });

      completedTasks.forEach(t => {
          if (!grouped[t.assignee]) grouped[t.assignee] = [];
          grouped[t.assignee].push(t);
      });

      // Sort tasks in groups by completion date (newest first)
      Object.keys(grouped).forEach(user => {
          grouped[user].sort((a, b) => new Date(b.completedAt || b.deadline).getTime() - new Date(a.completedAt || a.deadline).getTime());
      });

      return grouped;
  };

  const historyGrouped = getHistoryColumns();

  return (
    <div className="h-full flex flex-col relative p-2">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="text-left w-full md:w-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">Задачи</h2>
              <p className="text-neutral-500 font-medium text-sm md:text-base">Ваш центр управления делами</p>
          </div>

          <div className="flex p-1 bg-[#1c1c1e] rounded-xl border border-white/5 w-full md:w-auto overflow-hidden shadow-2xl">
               <button 
                  onClick={() => setActiveTab('PERSONAL')}
                  className={`flex-1 md:flex-none px-3 py-2 md:px-6 md:py-3 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'PERSONAL' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
               >
                   <User size={14} className="md:w-4 md:h-4" /> Мои
               </button>
               <button 
                  onClick={() => setActiveTab('DELEGATED')}
                  className={`flex-1 md:flex-none px-3 py-2 md:px-6 md:py-3 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'DELEGATED' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
               >
                   <Briefcase size={14} className="md:w-4 md:h-4" /> Делегировано
               </button>
               <button 
                  onClick={() => setActiveTab('HISTORY')}
                  className={`flex-1 md:flex-none px-3 py-2 md:px-6 md:py-3 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
               >
                   <History size={14} className="md:w-4 md:h-4" /> История
               </button>
          </div>
      </div>

      {/* HISTORY CONTROLS */}
      {activeTab === 'HISTORY' && (
          <div className="mb-6 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="relative flex-1">
                  <Search className="absolute left-4 top-3.5 text-neutral-500" size={18} />
                  <input 
                      value={archiveSearch}
                      onChange={e => setArchiveSearch(e.target.value)}
                      placeholder="Поиск по истории..."
                      className="w-full bg-[#1c1c1e] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-white/20 transition-colors"
                  />
              </div>
              <div className={`flex items-center gap-2 bg-[#1c1c1e] border rounded-xl p-1 transition-colors ${isDateFilterActive ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10'}`}>
                   <button 
                        onClick={() => setIsDateFilterActive(!isDateFilterActive)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${isDateFilterActive ? 'bg-blue-500 text-white' : 'text-neutral-500 hover:text-white'}`}
                   >
                       {isDateFilterActive ? 'Период' : 'Все время'}
                   </button>
                   {isDateFilterActive && (
                       <>
                           <input 
                              type="date"
                              value={historyStart}
                              onChange={e => setHistoryStart(e.target.value)}
                              className="bg-transparent text-white text-xs font-bold outline-none py-2 px-2 border-r border-white/10"
                          />
                          <ArrowRight size={12} className="text-neutral-600"/>
                          <input 
                              type="date"
                              value={historyEnd}
                              onChange={e => setHistoryEnd(e.target.value)}
                              className="bg-transparent text-white text-xs font-bold outline-none py-2 px-2"
                          />
                       </>
                   )}
                   {isDateFilterActive && (
                       <button 
                            onClick={() => setIsDateFilterActive(false)} 
                            className="p-2 hover:bg-white/10 rounded-lg text-neutral-500 hover:text-white"
                            title="Сбросить фильтр"
                        >
                           <RefreshCw size={14} />
                       </button>
                   )}
              </div>
          </div>
      )}

      {/* TASK CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
          
          {activeTab === 'HISTORY' ? (
              // COLUMN BASED HISTORY VIEW
              <div className="h-full overflow-x-auto custom-scrollbar">
                   <div className="flex gap-6 h-full pb-4 min-w-max">
                       {Object.entries(historyGrouped).map(([user, tasks]) => (
                           <div key={user} className="w-80 flex flex-col bg-[#161618] rounded-2xl border border-white/5 h-full">
                               <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1c1c1e] rounded-t-2xl sticky top-0 z-10">
                                   <div className="flex items-center gap-2">
                                       <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                                           {user.slice(0,1)}
                                       </div>
                                       <h3 className="font-bold text-white text-sm">{user}</h3>
                                   </div>
                                   <span className="text-xs font-mono text-neutral-500 bg-black/20 px-2 py-1 rounded">{tasks.length}</span>
                               </div>
                               <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                   {tasks.length > 0 ? (
                                       tasks.map(task => (
                                           <HistoryTaskCard key={task.id} task={task} onClick={() => openTask(task)} />
                                       ))
                                   ) : (
                                       <div className="text-center py-10 text-neutral-700 text-xs font-medium">
                                           Нет задач
                                       </div>
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>
              </div>
          ) : (
              // ACTIVE TASKS GRID
              <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
                  {/* Filter Logic for Active Tabs */}
                  {tasks.filter(t => {
                      if (activeTab === 'PERSONAL') return t.assignee === currentUser.name && t.status !== Status.DONE;
                      if (activeTab === 'DELEGATED') {
                          const isCreator = t.creator === currentUser.name || currentUser.role === 'OWNER';
                          const isNotMe = t.assignee !== currentUser.name;
                          return isCreator && isNotMe && t.status !== Status.DONE;
                      }
                      return false;
                  }).map(task => (
                      <React.Fragment key={task.id}>
                          <div 
                                onClick={() => openTask(task)}
                                className="group relative bg-[#1c1c1e] rounded-[32px] overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col h-[320px]"
                            >
                                {/* Cover Area */}
                                <div className="h-[180px] w-full bg-neutral-800 relative overflow-hidden">
                                    {task.sketch || (task.attachments && task.attachments.length > 0) ? (
                                        <img src={task.sketch || task.attachments![0]} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                                            <PenTool className="text-neutral-700 opacity-20" size={48} />
                                        </div>
                                    )}
                                    
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-lg ${
                                            task.status === Status.DONE ? 'bg-green-500/80 text-white' : 
                                            task.status === Status.IN_PROGRESS ? 'bg-blue-500/80 text-white' : 
                                            task.status === Status.REVIEW ? 'bg-purple-500/80 text-white' :
                                            'bg-black/40 text-neutral-300'
                                        }`}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-5 flex-1 flex flex-col justify-between bg-[#1c1c1e]">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
                                                {task.title}
                                            </h3>
                                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${priorityColor[task.priority]}`} />
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                                            <span className="flex items-center gap-1"><User size={12}/> {task.assignee.split(' ')[0]}</span>
                                            <span>•</span>
                                            <span>{new Date(task.deadline).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                      </React.Fragment>
                  ))}
                  
                  {/* New Project Button */}
                  <button 
                    onClick={openNewTask}
                    className="hidden md:flex group h-[320px] rounded-[32px] border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex-col items-center justify-center gap-4 cursor-pointer"
                  >
                      <div className="w-16 h-16 rounded-full bg-neutral-800 group-hover:bg-blue-500 group-hover:scale-110 transition-all flex items-center justify-center text-white shadow-lg">
                          <Plus size={32} />
                      </div>
                      <span className="text-neutral-500 font-bold text-lg group-hover:text-blue-400">Новый проект</span>
                  </button>
              </div>
          )}
      </div>

      {/* --- TASK DETAIL MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl md:p-4 animate-in fade-in duration-300">
            <div className="w-full h-full md:max-w-6xl md:h-[90vh] bg-[#101010] md:rounded-[40px] shadow-2xl border border-white/10 flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Mobile Modal Header & Tabs */}
                <div className="md:hidden flex flex-col bg-[#161618] border-b border-white/5 shrink-0">
                    <div className="flex justify-between items-center p-4 pb-2">
                         <h3 className="text-xl font-bold text-white">{editingTask ? 'Редактирование' : 'Новая задача'}</h3>
                         <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                            <X size={18} />
                         </button>
                    </div>
                    <div className="flex px-4 pb-4 gap-2">
                        <button 
                            onClick={() => setMobileModalTab('DETAILS')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mobileModalTab === 'DETAILS' ? 'bg-blue-600 text-white' : 'bg-white/5 text-neutral-400'}`}
                        >
                            Основное
                        </button>
                        <button 
                            onClick={() => setMobileModalTab('STUDIO')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mobileModalTab === 'STUDIO' ? 'bg-blue-600 text-white' : 'bg-white/5 text-neutral-400'}`}
                        >
                            Контент
                        </button>
                    </div>
                </div>

                {/* LEFT: META & CONTROLS */}
                <div className={`w-full md:w-[360px] h-auto md:h-full bg-[#161618] border-b md:border-b-0 md:border-r border-white/5 flex-col p-6 overflow-y-auto custom-scrollbar shrink-0 ${mobileModalTab === 'DETAILS' ? 'flex' : 'hidden md:flex'}`}>
                    
                    {/* Mobile Close Button (Hidden here now as it's in header) */}
                    <div className="hidden md:flex justify-end mb-4 md:hidden">
                         <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Header Input */}
                    <input 
                        value={formState.title}
                        onChange={e => setFormState({ ...formState, title: e.target.value })}
                        placeholder="Название проекта..."
                        className="bg-transparent text-2xl font-bold text-white placeholder-neutral-600 outline-none mb-4 w-full leading-tight"
                        autoFocus={!editingTask}
                        readOnly={!!editingTask && formState.status === Status.DONE}
                    />
                    
                    {/* Task Timer (Visual Countdown) */}
                    {editingTask && formState.deadline && formState.status !== Status.DONE && (
                        <div className="mb-6">
                            <TaskTimer deadline={formState.deadline} />
                        </div>
                    )}

                    {/* CHECKLIST SECTION */}
                    <div className="mb-6 border-b border-white/5 pb-6">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-2">
                                <CheckSquare size={14} /> Чек-лист
                            </label>
                             {formState.assignee && (
                                <div className="flex items-center gap-1 text-[9px] text-neutral-600 bg-white/5 px-2 py-1 rounded">
                                    <User size={8}/> {formState.assignee.slice(0,1)}.
                                </div>
                            )}
                        </div>
                        <Checklist 
                            items={formState.checklist || []}
                            onChange={items => setFormState({ ...formState, checklist: items })}
                            currentUser={currentUser}
                        />
                    </div>

                    {/* STATUS ACTION AREA */}
                    {editingTask ? (
                        <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-neutral-500 uppercase">Текущий статус</span>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                    formState.status === Status.NEW ? 'bg-blue-500/20 text-blue-400' :
                                    formState.status === Status.IN_PROGRESS ? 'bg-orange-500/20 text-orange-400' :
                                    formState.status === Status.REVIEW ? 'bg-purple-500/20 text-purple-400' :
                                    'bg-green-500/20 text-green-400'
                                }`}>
                                    {formState.status}
                                </span>
                            </div>

                            <div className="space-y-2">
                                {formState.status === Status.NEW && isAssignee && (
                                    <button onClick={handleStartTask} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 animate-pulse">
                                        <Play size={16} fill="currentColor"/> Приступить
                                    </button>
                                )}

                                {formState.status === Status.IN_PROGRESS && isAssignee && (
                                    <button onClick={handleSubmitForReview} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2">
                                        <ArrowRight size={16} /> Отправить на проверку
                                    </button>
                                )}

                                {formState.status === Status.REVIEW && (
                                    isReviewer ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={handleReject} className="py-3 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold transition-all border border-red-500/30">
                                                Вернуть
                                            </button>
                                            <button onClick={handleApprove} className="py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold shadow-lg shadow-green-900/20 transition-all">
                                                Принять
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center p-3 bg-neutral-800 rounded-xl">
                                            <Clock size={24} className="mx-auto text-purple-400 mb-2" />
                                            <p className="text-xs text-neutral-400">Ожидает проверки постановщиком</p>
                                        </div>
                                    )
                                )}

                                {formState.status === Status.DONE && (
                                    <div className="text-center p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                        <Check size={24} className="mx-auto text-green-400 mb-2" />
                                        <p className="text-xs text-green-400 font-bold">Проект завершен</p>
                                        {canDelete && (
                                            <button onClick={handleReject} className="mt-2 text-[10px] text-neutral-500 hover:text-white underline">
                                                Вернуть в работу
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <p className="text-xs text-blue-300 text-center">Создайте задачу, чтобы начать работу</p>
                        </div>
                    )}

                    {/* Properties Grid */}
                    <div className="space-y-4 mb-6">
                        <div className="bg-white/5 p-4 rounded-2xl space-y-4 border border-white/5">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-1.5">
                                    <User size={12} /> Ответственный
                                </label>
                                <select 
                                    value={formState.assignee}
                                    onChange={e => setFormState({ ...formState, assignee: e.target.value })}
                                    className="w-full bg-[#1c1c1e] rounded-lg p-2 text-sm text-white outline-none border border-white/5"
                                    disabled={!!editingTask && !canDelete} 
                                >
                                    {team.map(u => (
                                        <option key={u.id} value={u.name}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-1.5">
                                        <Calendar size={12} /> Дедлайн
                                    </label>
                                    <input 
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]} 
                                        value={formState.deadline}
                                        onChange={e => setFormState({ ...formState, deadline: e.target.value })}
                                        className="w-full bg-[#1c1c1e] rounded-lg p-2 text-xs text-white outline-none border border-white/5"
                                        readOnly={formState.status === Status.DONE}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-neutral-400 mb-1.5">
                                        <Clock size={12} /> Приоритет
                                    </label>
                                    <select 
                                        value={formState.priority}
                                        onChange={e => setFormState({ ...formState, priority: e.target.value as Priority })}
                                        className="w-full bg-[#1c1c1e] rounded-lg p-2 text-xs text-white outline-none border border-white/5"
                                        disabled={formState.status === Status.DONE}
                                    >
                                        {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-3">
                        {formState.status !== Status.DONE && (
                            <button 
                                onClick={saveTask}
                                className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                Сохранить изменения
                            </button>
                        )}
                        {editingTask && canDelete && (
                             <button 
                                onClick={() => { deleteTask(editingTask.id); setIsModalOpen(false); }}
                                className="w-full py-3 bg-transparent hover:bg-red-500/20 hover:text-red-400 text-neutral-500 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} /> Удалить проект
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT: WORKSPACE */}
                <div className={`flex-1 flex flex-col bg-[#0c0c0e] relative h-full md:h-auto border-l border-white/5 ${mobileModalTab === 'STUDIO' ? 'flex' : 'hidden md:flex'}`}>
                    
                    {/* Toolbar */}
                    <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#161618]">
                        <div className="flex bg-[#1c1c1e] p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                            <button 
                                onClick={() => setStudioTab('info')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${studioTab === 'info' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <List size={14}/> Описание
                            </button>
                            <button 
                                onClick={() => setStudioTab('canvas')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${studioTab === 'canvas' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <PenTool size={14}/> Скетч
                            </button>
                            <button 
                                onClick={() => setStudioTab('moodboard')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${studioTab === 'moodboard' ? 'bg-neutral-700 text-white shadow' : 'text-neutral-400 hover:text-white'}`}
                            >
                                <ImageIcon size={14}/> Мудборд
                            </button>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="hidden md:flex w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 items-center justify-center text-neutral-400 hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden relative">
                        
                        {/* Info Tab (Block Editor) */}
                        {studioTab === 'info' && (
                            <div className="h-full p-4 md:p-8 flex flex-col overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <BlockEditor 
                                    blocks={formState.contentBlocks || []}
                                    onChange={(newBlocks) => setFormState({ ...formState, contentBlocks: newBlocks })}
                                    readOnly={editingTask && (formState.status === Status.REVIEW || formState.status === Status.DONE) && !isReviewer} 
                                />
                            </div>
                        )}

                        {/* Canvas Tab */}
                        {studioTab === 'canvas' && (
                            <div className="h-full p-4 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 bg-neutral-900/50">
                                <DrawingCanvas 
                                    initialData={formState.sketch} 
                                    onSave={(data) => setFormState({ ...formState, sketch: data })} 
                                />
                            </div>
                        )}

                        {/* Moodboard Tab */}
                        {studioTab === 'moodboard' && (
                            <div 
                                ref={moodboardPasteRef}
                                className="h-full p-4 md:p-6 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300 focus:outline-none"
                                tabIndex={0} // Make div focusable for paste events
                            >
                                <div className="flex flex-col gap-4 mb-6">
                                    {/* Link & Upload Controls */}
                                    <div className="flex flex-col md:flex-row gap-2">
                                        <div className="flex-1 bg-neutral-900 rounded-xl flex items-center px-4 border border-white/5 focus-within:border-blue-500 transition-colors">
                                            <Paperclip size={16} className="text-neutral-500 mr-2" />
                                            <input 
                                                placeholder="Вставьте ссылку на изображение..."
                                                className="bg-transparent w-full py-3 text-sm text-white outline-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleAttachment(e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                        <label className="cursor-pointer px-6 py-3 md:py-0 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-sm transition-colors border border-white/5 flex items-center justify-center gap-2">
                                            <Upload size={16} />
                                            Загрузить
                                            <input type="file" className="hidden" accept="image/*" onChange={handleMoodboardUpload} />
                                        </label>
                                    </div>
                                    
                                    {/* Instructions */}
                                    <div className="flex items-center gap-2 text-xs text-neutral-500 px-2">
                                        <Copy size={12} />
                                        <span>Подсказка: Вы можете вставить изображение из буфера обмена (Ctrl+V) прямо сюда</span>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-neutral-900/30 rounded-3xl p-4 border-2 border-dashed border-white/5">
                                    {(formState.attachments?.length || 0) === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                                            <ImageIcon size={64} className="mb-4 opacity-20"/>
                                            <p className="font-medium">Нет изображений</p>
                                            <p className="text-xs">Нажмите Ctrl+V чтобы вставить</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            {formState.attachments!.map((url, i) => (
                                                <div key={i} className="group relative aspect-square bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => window.open(url, '_blank')}
                                                            className="p-2 bg-white/20 rounded-full hover:bg-blue-500 text-white backdrop-blur-md transition-colors"
                                                        >
                                                            <Share2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setFormState({ ...formState, attachments: formState.attachments!.filter((_, idx) => idx !== i) })}
                                                            className="p-2 bg-white/20 rounded-full hover:bg-red-500 text-white backdrop-blur-md transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
