
import React, { useState, useRef, useEffect } from 'react';
import { usePlanner } from '../context';
import { 
  Plus, X, Trash2, Image as ImageIcon, MessageCircle, Check, 
  ArrowRight, Upload, MousePointer2, Hand, ZoomIn, ZoomOut, 
  MoreHorizontal, Download, Layers, Type, Square, Circle, PenTool,
  Move, Copy, ChevronDown, Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown,
  Maximize, Minimize, AlignLeft, AlignCenter, AlignRight, Grid, StickyNote,
  Hash, Box
} from 'lucide-react';
import { DesignProject, DesignPin, DesignLayer } from '../types';

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

// --- UNIFIED DESIGN STUDIO (Miro + Figma Hybrid) ---
const DesignStudio: React.FC<{ project: DesignProject; onClose: () => void }> = ({ project, onClose }) => {
    const { updateDesign, currentUser } = usePlanner();
    
    // --- STATE ---
    const [layers, setLayers] = useState<DesignLayer[]>(project.canvasData?.layers || []);
    const [pins, setPins] = useState<DesignPin[]>(project.canvasData?.pins || []);
    
    // History for Undo/Redo
    const [history, setHistory] = useState<DesignLayer[][]>([project.canvasData?.layers || []]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Viewport
    const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
    
    // Tools
    const [tool, setTool] = useState<'CURSOR' | 'HAND' | 'COMMENT' | 'RECT' | 'CIRCLE' | 'TEXT' | 'STICKY' | 'PEN'>('CURSOR');
    const [activePinId, setActivePinId] = useState<string | null>(null);

    // Interactions
    const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
    const [clipboard, setClipboard] = useState<DesignLayer[]>([]); 
    
    // Mouse Interactions
    const [isDragging, setIsDragging] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    // Refs
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- HISTORY MANAGER ---
    const addToHistory = (newLayers: DesignLayer[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newLayers);
        if (newHistory.length > 20) newHistory.shift(); // Limit
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setLayers(newLayers);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setLayers(history[historyIndex - 1]);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setLayers(history[historyIndex + 1]);
        }
    };

    // --- AUTO SAVE ---
    useEffect(() => {
        const timer = setTimeout(() => {
            updateDesign(project.id, {
                canvasData: { layers, pins, lastModified: new Date().toISOString() }
            });
        }, 1000);
        return () => clearTimeout(timer);
    }, [layers, pins]);

    // --- HOTKEYS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                const selected = layers.filter(l => selectedLayerIds.includes(l.id));
                if (selected.length > 0) { e.preventDefault(); setClipboard(selected); }
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                if (clipboard.length > 0) {
                    e.preventDefault();
                    const newLayers = clipboard.map(item => ({
                        ...item, id: `L-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, x: item.x + 20, y: item.y + 20
                    }));
                    const updated = [...layers, ...newLayers];
                    addToHistory(updated);
                    setSelectedLayerIds(newLayers.map(l => l.id));
                }
                return;
            }

            switch(e.key.toLowerCase()) {
                case 'v': setTool('CURSOR'); break;
                case 'h': setTool('HAND'); break;
                case 'c': if (!(e.ctrlKey || e.metaKey)) setTool('COMMENT'); break;
                case 'r': setTool('RECT'); break;
                case 'o': setTool('CIRCLE'); break;
                case 't': setTool('TEXT'); break;
                case 's': setTool('STICKY'); break;
                case 'p': setTool('PEN'); break;
                case ' ': if(!isPanning) { e.preventDefault(); setIsPanning(true); } break;
                case 'delete': 
                case 'backspace': 
                    if (selectedLayerIds.length > 0) {
                        addToHistory(layers.filter(l => !selectedLayerIds.includes(l.id)));
                        setSelectedLayerIds([]);
                    }
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') setIsPanning(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [selectedLayerIds, isPanning, layers, clipboard, history, historyIndex]);

    // --- PASTE IMAGE ---
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    if (file) {
                        const src = await toBase64(file);
                        const { x, y } = getCanvasCoords(window.innerWidth / 2, window.innerHeight / 2);
                        createLayer('IMAGE', x - 150, y - 150, { src, width: 300, height: 300 });
                    }
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [view]);

    // --- HELPERS ---
    const getCanvasCoords = (clientX: number, clientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: (clientX - rect.left - view.x) / view.zoom,
            y: (clientY - rect.top - view.y) / view.zoom
        };
    };

    const createLayer = (type: DesignLayer['type'], x: number, y: number, extra: Partial<DesignLayer> = {}) => {
        const newLayer: DesignLayer = {
            id: `L-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
            type,
            name: type.charAt(0) + type.slice(1).toLowerCase(),
            x, y,
            width: 100, height: 100,
            rotation: 0, opacity: 1,
            fill: type === 'STICKY' ? '#fff9b1' : type === 'TEXT' ? 'transparent' : '#D9D9D9',
            fontSize: 16, fontFamily: 'Inter',
            isVisible: true, isLocked: false,
            ...extra
        };
        const updated = [...layers, newLayer];
        // Only update state here, add to history on mouse up usually, but for simplicity adding here
        addToHistory(updated);
        setSelectedLayerIds([newLayer.id]);
        if (type !== 'PATH') setTool('CURSOR');
    };

    const updateSelectedLayer = (updates: Partial<DesignLayer>) => {
        const updated = layers.map(l => selectedLayerIds.includes(l.id) ? { ...l, ...updates } : l);
        setLayers(updated);
    };

    // --- MOUSE HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || tool === 'HAND' || isPanning) {
            setIsPanning(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        const coords = getCanvasCoords(e.clientX, e.clientY);

        if (tool === 'COMMENT') {
            const newPin: DesignPin = { id: `pin-${Date.now()}`, x: coords.x, y: coords.y, author: currentUser.name, comment: '', isResolved: false, timestamp: new Date().toISOString() };
            setPins([...pins, newPin]);
            setActivePinId(newPin.id);
            setTool('CURSOR');
            return;
        }

        if (tool === 'RECT') createLayer('RECT', coords.x, coords.y);
        if (tool === 'CIRCLE') createLayer('CIRCLE', coords.x, coords.y, { borderRadius: 9999 });
        if (tool === 'STICKY') createLayer('STICKY', coords.x, coords.y, { width: 200, height: 200, text: '' });
        if (tool === 'TEXT') createLayer('TEXT', coords.x, coords.y, { width: 200, height: 40, text: 'Текст' });
        
        if (tool === 'PEN') {
            setIsDrawing(true);
            createLayer('PATH', coords.x, coords.y, { width: 0, height: 0, points: [{x: coords.x, y: coords.y}], fill: 'transparent', stroke: '#fff', strokeWidth: 3 });
            return;
        }

        // Deselect if clicking empty canvas
        if (e.target === canvasRef.current) {
            setSelectedLayerIds([]);
            setActivePinId(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        const coords = getCanvasCoords(e.clientX, e.clientY);

        // Drawing
        if (isDrawing && selectedLayerIds.length > 0) {
            const id = selectedLayerIds[0];
            setLayers(prev => prev.map(l => {
                if (l.id === id && l.points) {
                    return { ...l, points: [...l.points, {x: coords.x, y: coords.y}] };
                }
                return l;
            }));
            return;
        }

        // Dragging Layers
        if (isDragging && selectedLayerIds.length > 0) {
            const dx = coords.x - dragStart.x;
            const dy = coords.y - dragStart.y;
            setLayers(prev => prev.map(l => selectedLayerIds.includes(l.id) ? { ...l, x: l.x + dx, y: l.y + dy } : l));
            setDragStart(coords);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            addToHistory(layers);
        }
        if (isDragging) {
            setIsDragging(false);
            addToHistory(layers);
        }
        setIsPanning(false);
    };

    // --- RENDER LAYER ---
    const renderLayer = (layer: DesignLayer) => {
        const isSelected = selectedLayerIds.includes(layer.id);
        const style: React.CSSProperties = {
            position: 'absolute', left: layer.x, top: layer.y, width: layer.width, height: layer.height,
            transform: `rotate(${layer.rotation}deg)`, opacity: layer.opacity, zIndex: isSelected ? 100 : 1,
            border: isSelected ? '1px solid #0a84ff' : 'none', borderRadius: layer.borderRadius
        };

        const handleDragStart = (e: React.MouseEvent) => {
            if (tool !== 'CURSOR') return;
            e.stopPropagation();
            if (!selectedLayerIds.includes(layer.id)) setSelectedLayerIds([layer.id]);
            setIsDragging(true);
            setDragStart(getCanvasCoords(e.clientX, e.clientY));
        };

        switch (layer.type) {
            case 'IMAGE': return <img src={layer.src} style={style} onMouseDown={handleDragStart} className="object-cover pointer-events-auto"/>;
            case 'RECT': return <div style={{...style, backgroundColor: layer.fill}} onMouseDown={handleDragStart} className="pointer-events-auto"/>;
            case 'CIRCLE': return <div style={{...style, backgroundColor: layer.fill, borderRadius: '50%'}} onMouseDown={handleDragStart} className="pointer-events-auto"/>;
            case 'STICKY': return (
                <div style={{...style, backgroundColor: layer.fill, padding: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.2)'}} onMouseDown={handleDragStart} className="pointer-events-auto flex items-center justify-center">
                    <textarea 
                        value={layer.text} 
                        onChange={e => updateSelectedLayer({text: e.target.value})}
                        className="w-full h-full bg-transparent resize-none outline-none text-black text-center"
                        style={{fontSize: layer.fontSize, fontFamily: layer.fontFamily}}
                    />
                </div>
            );
            case 'TEXT': return (
                <input 
                    value={layer.text} 
                    onChange={e => updateSelectedLayer({text: e.target.value})}
                    style={{...style, background: 'transparent', border: isSelected ? '1px dashed #0a84ff' : 'none', color: layer.fill || 'white', fontSize: layer.fontSize, fontFamily: layer.fontFamily}}
                    onMouseDown={handleDragStart}
                    className="pointer-events-auto outline-none"
                />
            );
            case 'PATH': return (
                <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
                    <path 
                        d={`M ${layer.points?.map(p => `${p.x} ${p.y}`).join(' L ')}`} 
                        fill="none" 
                        stroke={layer.stroke || '#fff'} 
                        strokeWidth={layer.strokeWidth || 3} 
                        strokeLinecap="round"
                    />
                </svg>
            );
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#1e1e1e] text-white flex flex-col">
            {/* TOP BAR */}
            <div className="h-14 bg-[#2c2c2e] border-b border-black flex items-center justify-between px-4 z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-xl"><X size={20}/></button>
                    <h3 className="font-bold text-sm">{project.title}</h3>
                </div>
                <div className="flex bg-black/30 p-1 rounded-xl gap-1">
                    {[{id: 'CURSOR', i: MousePointer2}, {id: 'HAND', i: Hand}, {id: 'RECT', i: Square}, {id: 'CIRCLE', i: Circle}, {id: 'PEN', i: PenTool}, {id: 'TEXT', i: Type}, {id: 'STICKY', i: StickyNote}, {id: 'COMMENT', i: MessageCircle}].map(t => (
                        <button key={t.id} onClick={() => setTool(t.id as any)} className={`p-2 rounded-lg ${tool === t.id ? 'bg-blue-500' : 'hover:bg-white/10'}`}>
                            <t.i size={18}/>
                        </button>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-white/10"><Upload size={18}/></button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                        if(e.target.files?.[0]) {
                            const src = await toBase64(e.target.files[0]);
                            const { x, y } = getCanvasCoords(window.innerWidth/2, window.innerHeight/2);
                            createLayer('IMAGE', x, y, { src, width: 300, height: 300 });
                        }
                    }}/>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={undo} className="p-2 hover:bg-white/10 rounded"><ArrowRight size={16} className="rotate-180"/></button>
                    <button onClick={redo} className="p-2 hover:bg-white/10 rounded"><ArrowRight size={16}/></button>
                    <div className="bg-black/30 px-2 py-1 rounded text-xs font-mono">{Math.round(view.zoom * 100)}%</div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT SIDEBAR: LAYERS */}
                <div className="w-56 bg-[#2c2c2e] border-r border-black flex flex-col z-20">
                    <div className="p-3 text-xs font-bold opacity-50 uppercase">Layers</div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {[...layers].reverse().map(l => (
                            <div 
                                key={l.id} 
                                onClick={() => setSelectedLayerIds([l.id])}
                                className={`px-4 py-2 text-xs flex items-center gap-2 cursor-pointer ${selectedLayerIds.includes(l.id) ? 'bg-blue-500 text-white' : 'hover:bg-white/5'}`}
                            >
                                {l.type === 'IMAGE' ? <ImageIcon size={12}/> : l.type === 'TEXT' ? <Type size={12}/> : l.type === 'STICKY' ? <StickyNote size={12}/> : <Square size={12}/>}
                                {l.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CANVAS */}
                <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden" ref={canvasRef}>
                    <div 
                        className={`absolute inset-0 ${tool === 'HAND' || isPanning ? 'cursor-grab active:cursor-grabbing' : tool === 'COMMENT' ? 'cursor-crosshair' : 'cursor-default'}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onWheel={(e) => {
                            if (e.ctrlKey) {
                                e.preventDefault();
                                setView(v => ({ ...v, zoom: Math.min(Math.max(0.1, v.zoom - e.deltaY * 0.001), 5) }));
                            } else if (!isPanning) {
                                setView(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
                            }
                        }}
                    >
                        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, backgroundImage: 'radial-gradient(#555 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                        <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
                            {layers.map(renderLayer)}
                            {pins.map((pin, idx) => (
                                <div key={pin.id} style={{ left: pin.x, top: pin.y }} className="absolute z-[200] -translate-x-1/2 -translate-y-1/2 cursor-pointer" onClick={(e) => { e.stopPropagation(); setActivePinId(pin.id); }}>
                                    <div className={`w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center font-bold text-xs ${pin.isResolved ? 'bg-green-500' : 'bg-pink-500'}`}>{idx + 1}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR: PROPERTIES */}
                <div className="w-60 bg-[#2c2c2e] border-l border-black p-4 z-20">
                    <div className="text-xs font-bold opacity-50 uppercase mb-4">Properties</div>
                    {selectedLayerIds.length === 1 ? (() => {
                        const layer = layers.find(l => l.id === selectedLayerIds[0]);
                        if (!layer) return null;
                        return (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-[10px] opacity-50">X</label><input type="number" value={Math.round(layer.x)} onChange={e => updateSelectedLayer({x: Number(e.target.value)})} className="w-full bg-black/20 rounded p-1 text-xs"/></div>
                                    <div><label className="text-[10px] opacity-50">Y</label><input type="number" value={Math.round(layer.y)} onChange={e => updateSelectedLayer({y: Number(e.target.value)})} className="w-full bg-black/20 rounded p-1 text-xs"/></div>
                                    <div><label className="text-[10px] opacity-50">W</label><input type="number" value={Math.round(layer.width)} onChange={e => updateSelectedLayer({width: Number(e.target.value)})} className="w-full bg-black/20 rounded p-1 text-xs"/></div>
                                    <div><label className="text-[10px] opacity-50">H</label><input type="number" value={Math.round(layer.height)} onChange={e => updateSelectedLayer({height: Number(e.target.value)})} className="w-full bg-black/20 rounded p-1 text-xs"/></div>
                                </div>
                                {layer.type !== 'IMAGE' && (
                                    <div>
                                        <label className="text-[10px] opacity-50 mb-1 block">Fill</label>
                                        <div className="flex gap-2">
                                            <input type="color" value={layer.fill} onChange={e => updateSelectedLayer({fill: e.target.value})} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"/>
                                            <input value={layer.fill} onChange={e => updateSelectedLayer({fill: e.target.value})} className="flex-1 bg-black/20 rounded p-1 text-xs"/>
                                        </div>
                                    </div>
                                )}
                                {(layer.type === 'TEXT' || layer.type === 'STICKY') && (
                                    <div>
                                        <label className="text-[10px] opacity-50 mb-1 block">Typography</label>
                                        <div className="flex gap-2 mb-2">
                                            <input type="number" value={layer.fontSize} onChange={e => updateSelectedLayer({fontSize: Number(e.target.value)})} className="w-12 bg-black/20 rounded p-1 text-xs"/>
                                            <select value={layer.fontFamily} onChange={e => updateSelectedLayer({fontFamily: e.target.value})} className="flex-1 bg-black/20 rounded p-1 text-xs">
                                                <option>Inter</option><option>Arial</option><option>Serif</option><option>Mono</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-white/10">
                                    <button onClick={() => { addToHistory(layers.filter(l => l.id !== layer.id)); setSelectedLayerIds([]); }} className="w-full py-2 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500 hover:text-white">Delete Layer</button>
                                </div>
                            </div>
                        )
                    })() : <div className="text-xs opacity-30">Select a layer to edit</div>}
                </div>
            </div>
            
            {/* COMMENTS PANEL */}
            {activePinId && (
                <div className="absolute top-16 right-64 w-72 bg-[#2c2c2e] rounded-xl shadow-2xl border border-white/10 p-4 z-50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-sm">Comment</span>
                        <button onClick={() => setActivePinId(null)}><X size={14}/></button>
                    </div>
                    {(() => {
                        const pin = pins.find(p => p.id === activePinId);
                        if(!pin) return null;
                        return (
                            <>
                                <textarea value={pin.comment} onChange={e => setPins(ps => ps.map(p => p.id === pin.id ? {...p, comment: e.target.value} : p))} className="w-full h-24 bg-black/20 rounded p-2 text-sm text-white mb-2" placeholder="Write a comment..." autoFocus />
                                <div className="flex gap-2">
                                    <button onClick={() => setPins(ps => ps.map(p => p.id === pin.id ? {...p, isResolved: !p.isResolved} : p))} className={`flex-1 py-1 rounded text-xs ${pin.isResolved ? 'bg-neutral-600' : 'bg-green-600'}`}>{pin.isResolved ? 'Reopen' : 'Resolve'}</button>
                                    <button onClick={() => { setPins(ps => ps.filter(p => p.id !== pin.id)); setActivePinId(null); }} className="px-3 bg-red-500/20 text-red-400 rounded"><Trash2 size={14}/></button>
                                </div>
                            </>
                        )
                    })()}
                </div>
            )}
        </div>
    );
};

export default DesignStudio;
