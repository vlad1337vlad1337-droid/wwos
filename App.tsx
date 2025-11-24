import React, { useState, useEffect, useRef } from 'react';
import { PlannerProvider, usePlanner } from './context';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import ProductionView from './components/ProductionView';
import Influencers from './components/Influencers';
import Warehouse from './components/Warehouse';
import Shoots from './components/Shoots';
import Design from './components/Design';
import Support from './components/Support';
import Reports from './components/Reports';
import KPI from './components/KPI';
import Finance from './components/Finance';
import Logs from './components/Logs';
import Schedule from './components/Schedule';
import { NAV_ITEMS } from './constants';
import { 
  LayoutDashboard, Calendar, CheckSquare, Factory, Users, Package, 
  Camera, Palette, MessageCircle, FileText, TrendingUp, DollarSign, 
  Activity, Settings, LogOut, Search, ArrowRight, Zap, Command, Menu 
} from 'lucide-react';

// Map icon strings from constants to components
const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Calendar, CheckSquare, Factory, Users, Package, 
  Camera, Palette, MessageCircle, FileText, TrendingUp, DollarSign, Activity
};

// --- COMMAND PALETTE COMPONENT ---
const CommandPalette = () => {
    const { activeTab, setActiveTab, production, tasks, navigateTo, currentUser, warehouse } = usePlanner();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
                setQuery('');
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Search Logic
    const filteredNav = NAV_ITEMS.filter(item => 
        item.roles.includes(currentUser.role) && 
        item.label.toLowerCase().includes(query.toLowerCase())
    ).map(item => ({ type: 'NAV' as const, label: `Перейти: ${item.label}`, id: item.id, icon: ArrowRight }));

    const filteredProduction = production
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(p => ({ type: 'PROD' as const, label: `Партия: ${p.name}`, id: p.id, sub: p.stage, icon: Factory }));

    const filteredTasks = tasks
        .filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(t => ({ type: 'TASK' as const, label: `Задача: ${t.title}`, id: t.id, sub: t.status, icon: CheckSquare }));
    
    const filteredItems = warehouse
        .filter(w => w.name.toLowerCase().includes(query.toLowerCase()) || w.sku.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(w => ({ type: 'WAREHOUSE' as const, label: `Склад: ${w.name}`, id: w.id, sub: `${w.stock} шт`, icon: Package }));

    const actions = [
        { type: 'ACTION' as const, label: 'Создать новую задачу', action: () => setActiveTab('tasks'), icon: Zap },
    ];

    const results = query ? [...filteredNav, ...filteredProduction, ...filteredTasks, ...filteredItems] : [...actions, ...filteredNav];

    const handleSelect = (index: number) => {
        const item = results[index];
        if (!item) return;

        if (item.type === 'NAV') setActiveTab(item.id);
        if (item.type === 'PROD') navigateTo('production', item.id);
        if (item.type === 'TASK') setActiveTab('tasks'); // Deep link to tasks not fully visual yet, but switches tab
        if (item.type === 'WAREHOUSE') {
            setActiveTab('warehouse');
        }
        if (item.type === 'ACTION') (item as any).action();
        
        setIsOpen(false);
    };

    useEffect(() => {
        const handleNav = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSelect(selectedIndex);
            }
        };
        window.addEventListener('keydown', handleNav);
        return () => window.removeEventListener('keydown', handleNav);
    }, [isOpen, selectedIndex, results]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-xl bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
                <div className="flex items-center border-b border-white/5 px-4 py-4">
                    <Search className="text-neutral-500 mr-3" size={20} />
                    <input 
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="bg-transparent outline-none text-white text-lg w-full placeholder-neutral-600"
                        placeholder="Поиск, команды, навигация..."
                    />
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 border border-white/5">ESC</span>
                    </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                    {results.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">Ничего не найдено</div>
                    ) : (
                        results.map((item, idx) => (
                            <div 
                                key={`${item.type}-${idx}`}
                                onClick={() => handleSelect(idx)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${idx === selectedIndex ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-white/5'}`}
                            >
                                <item.icon size={18} className={idx === selectedIndex ? 'text-white' : 'text-neutral-500'} />
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${idx === selectedIndex ? 'text-white' : 'text-neutral-200'}`}>{item.label}</p>
                                    {'sub' in item && <p className={`text-xs ${idx === selectedIndex ? 'text-blue-200' : 'text-neutral-500'}`}>{item.sub}</p>}
                                </div>
                                {idx === selectedIndex && <ArrowRight size={14} className="text-white" />}
                            </div>
                        ))
                    )}
                </div>
                <div className="px-4 py-2 bg-neutral-900 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] text-neutral-600">WASE WORM OS</span>
                    <div className="flex gap-3 text-[10px] text-neutral-600">
                        <span className="flex items-center gap-1"><span className="bg-neutral-800 px-1 rounded">↑↓</span> Выбор</span>
                        <span className="flex items-center gap-1"><span className="bg-neutral-800 px-1 rounded">↵</span> Открыть</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Sidebar = ({ onNavClick }: { onNavClick?: () => void }) => {
    const { activeTab, setActiveTab, currentUser, switchRole } = usePlanner();

    return (
        <div className="w-full md:w-64 bg-[#1c1c1e] border-r border-white/5 flex flex-col h-full transition-all duration-300 flex-shrink-0">
            {/* Logo Area - Clickable to go home */}
            <div 
                className="h-20 flex items-center justify-start px-6 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => { setActiveTab('dashboard'); onNavClick?.(); }}
            >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    <span className="text-black font-black text-xl">W</span>
                </div>
                <span className="ml-3 font-bold text-white tracking-wider">WASE WORM</span>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-1">
                {NAV_ITEMS.map(item => {
                    if (!item.roles.includes(currentUser.role)) return null;
                    const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                    const isActive = activeTab === item.id;
                    
                    return (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); onNavClick?.(); }}
                            className={`w-full flex items-center px-4 py-3 mx-2 rounded-xl transition-all duration-200 group relative ${isActive ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                            style={{width: 'calc(100% - 16px)'}}
                        >
                            <Icon size={20} className={`transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-white'}`} />
                            <span className="ml-3 text-sm font-medium">{item.label}</span>
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />}
                        </button>
                    );
                })}
            </div>

            {/* User Profile & Role Switcher (Demo) */}
            <div className="p-4 border-t border-white/5 bg-[#161618]">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {currentUser.avatar}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-white text-sm font-bold truncate">{currentUser.name}</p>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider text-[10px]">{currentUser.role}</p>
                    </div>
                </div>
                
                {/* Demo Role Switcher */}
                <div className="grid grid-cols-3 gap-1 bg-black/30 p-1 rounded-lg">
                    {['OWNER', 'MANAGER', 'WAREHOUSE'].map((r) => (
                        <button 
                            key={r}
                            onClick={() => { switchRole(r as any); onNavClick?.(); }}
                            className={`text-[8px] font-bold py-1.5 rounded md:px-0 px-1 transition-colors ${currentUser.role === r ? 'bg-neutral-700 text-white shadow' : 'text-neutral-600 hover:text-neutral-400'}`}
                            title={`Switch to ${r}`}
                        >
                            {r.slice(0,1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AppContent = () => {
    const { activeTab, notification } = usePlanner();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans selection:bg-blue-500/30">
             {/* Desktop Sidebar */}
             <div className="hidden md:block h-full">
                <Sidebar />
             </div>

             {/* Mobile Sidebar Drawer */}
             {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-64 h-full bg-[#1c1c1e] shadow-2xl border-r border-white/10" onClick={e => e.stopPropagation()}>
                         <Sidebar onNavClick={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
             )}

            <div className="flex-1 flex flex-col min-w-0 relative bg-black">
                 {/* Mobile Header */}
                 <div className="md:hidden h-16 bg-[#1c1c1e] border-b border-white/5 flex items-center justify-between px-4 shrink-0 z-30">
                     <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                         <Menu size={24} />
                     </button>
                     <span className="font-bold text-white tracking-wider">WASE WORM</span>
                     <div className="w-10" /> {/* Spacer for centering */}
                 </div>

                {/* Main Area */}
                <main className="flex-1 overflow-hidden relative">
                   <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24 md:pb-8">
                        {activeTab === 'dashboard' && <Dashboard />}
                        {activeTab === 'schedule' && <Schedule />}
                        {activeTab === 'tasks' && <TaskManager />}
                        {activeTab === 'production' && <ProductionView />}
                        {activeTab === 'bloggers' && <Influencers />}
                        {activeTab === 'warehouse' && <Warehouse />}
                        {activeTab === 'shoots' && <Shoots />}
                        {activeTab === 'design' && <Design />}
                        {activeTab === 'support' && <Support />}
                        {activeTab === 'reports' && <Reports />}
                        {activeTab === 'kpi' && <KPI />}
                        {activeTab === 'finance' && <Finance />}
                        {activeTab === 'logs' && <Logs />}
                   </div>
                </main>

                {/* Command Palette */}
                <CommandPalette />

                {/* Notification Toast */}
                {notification && (
                    <div className={`fixed bottom-6 right-6 left-6 md:left-auto z-[100] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300 ${
                        notification.type === 'success' ? 'bg-neutral-900/90 border-green-500/30 text-green-400' : 
                        notification.type === 'error' ? 'bg-neutral-900/90 border-red-500/30 text-red-400' : 
                        'bg-neutral-900/90 border-blue-500/30 text-blue-400'
                    } backdrop-blur-md`}>
                        <div className={`w-2 h-2 rounded-full ${
                            notification.type === 'success' ? 'bg-green-500' : 
                            notification.type === 'error' ? 'bg-red-500' : 
                            'bg-blue-500'
                        }`} />
                        <span className="font-medium text-sm">{notification.message}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

const App = () => {
    return (
        <PlannerProvider>
            <AppContent />
        </PlannerProvider>
    );
};

export default App;