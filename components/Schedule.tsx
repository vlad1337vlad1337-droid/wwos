
import React, { useState, useRef } from 'react';
import { usePlanner } from '../context';
import { ChevronLeft, ChevronRight, X, User, Lock, Plus, Users, Trash2, GripVertical, Settings, Tag, Clock, Calendar, Check, MoreHorizontal, LayoutList, Grid, Maximize2, Minimize2, ChevronsRight, ChevronsLeft, ArrowDownCircle } from 'lucide-react';
import { UserRole } from '../types';

const Schedule: React.FC = () => {
    const { 
        schedule, addScheduleEvent, deleteScheduleEvent, updateScheduleEvent, 
        currentUser, team, addTeamMember, deleteTeamMember, 
        eventTypes, addEventType, deleteEventType 
    } = usePlanner();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Mobile View State: Vertical List
    const [mobileDaysLoaded, setMobileDaysLoaded] = useState(21); // 3 weeks by default
    
    // Team Expand State for Mobile Week View
    const [isTeamExpanded, setIsTeamExpanded] = useState(false);

    // Drag & Drop State
    const [dragTarget, setDragTarget] = useState<{userId: string, date: string} | null>(null);
    const dragItemRef = useRef<string | null>(null);

    // Schedule Modal State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    
    const [eventStart, setEventStart] = useState('09:00');
    const [eventEnd, setEventEnd] = useState('18:00');
    const [eventTypeId, setEventTypeId] = useState<string>('shift');
    const [eventNote, setEventNote] = useState('');

    // Team Management Modal State
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<UserRole>('EXTERNAL');

    // Event Type Manager Modal
    const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeColor, setNewTypeColor] = useState('bg-pink-600');

    // Mobile Settings Menu
    const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

    // --- PERMISSIONS ---
    const canManageTeam = currentUser.role === 'OWNER' || currentUser.role === 'MANAGER';
    
    const canEditSchedule = (targetRole: UserRole) => {
        if (currentUser.role === 'OWNER') return true;
        if (currentUser.role === 'MANAGER') return targetRole !== 'OWNER';
        return false;
    };

    // --- DATE HELPERS ---
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
        return new Date(d.setDate(diff));
    };

    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    // Mobile Dates Generation
    const mobileDates = Array.from({length: mobileDaysLoaded}).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 2 + i); // Start from 2 days ago
        return d;
    });

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const formatDayName = (d: Date) => d.toLocaleDateString('ru-RU', { weekday: 'short' });
    const formatDayNum = (d: Date) => d.toLocaleDateString('ru-RU', { day: 'numeric' });
    const formatMonthYear = (d: Date) => d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

    // Navigation
    const nextWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    const prevWeek = () => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));

    // --- DRAG AND DROP HANDLERS ---
    const handleDragStart = (e: React.DragEvent, eventId: string) => {
        e.dataTransfer.setData('eventId', eventId);
        e.dataTransfer.effectAllowed = 'move';
        dragItemRef.current = eventId;
    };

    const handleDragEnter = (e: React.DragEvent, userId: string, date: string) => {
        e.preventDefault();
        // Only update if changed to avoid flicker
        if (dragTarget?.userId !== userId || dragTarget?.date !== date) {
             setDragTarget({ userId, date });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetUserId: string, targetDate: string) => {
        e.preventDefault();
        setDragTarget(null);
        const eventId = e.dataTransfer.getData('eventId');
        const targetUser = team.find(u => u.id === targetUserId);
        
        // Permission check for drop target
        if (!targetUser || !canEditSchedule(targetUser.role)) {
            alert('У вас нет прав изменять график этого сотрудника.');
            return;
        }

        if (eventId) {
            updateScheduleEvent(eventId, {
                userId: targetUserId,
                userName: targetUser.name,
                role: targetUser.role,
                date: targetDate
            });
        }
        dragItemRef.current = null;
    };

    // --- CLICK HANDLERS ---
    const resetModalForm = () => {
        setEventStart('09:00');
        setEventEnd('18:00');
        setEventTypeId('shift');
        setEventNote('');
        setEditingEventId(null);
    };

    const handleCellClick = (userId: string, date: string) => {
        const user = team.find(u => u.id === userId);
        if (!user) return;
        if (!canEditSchedule(user.role)) return;

        resetModalForm();
        setSelectedUser(userId);
        setSelectedDate(date);
        setIsEventModalOpen(true);
    };
    
    // New handler for adding event from Mobile Date View (where User is not yet selected)
    const handleDateClick = (date: string) => {
        resetModalForm();
        setSelectedDate(date);
        setSelectedUser(''); // Force user selection
        setIsEventModalOpen(true);
    };

    const handleEventClick = (e: React.MouseEvent, event: any) => {
        e.stopPropagation(); // Stop bubbling to cell click
        const user = team.find(u => u.id === event.userId);
        if (!user) return;
        if (!canEditSchedule(user.role)) return;

        setEditingEventId(event.id);
        setSelectedUser(event.userId);
        setSelectedDate(event.date);
        
        setEventTypeId(event.typeId);
        setEventStart(event.startTime || '09:00');
        setEventEnd(event.endTime || '18:00');
        setEventNote(event.note || '');
        
        setIsEventModalOpen(true);
    };

    const handleSaveEvent = (e: React.FormEvent) => {
        e.preventDefault();
        const user = team.find(u => u.id === selectedUser);
        if (!user) {
            alert('Выберите сотрудника');
            return;
        }

        const selectedType = eventTypes.find(t => t.id === eventTypeId);
        if (!selectedType) return;

        // Validation
        if (selectedType.id !== 'dayoff' && eventStart >= eventEnd) {
            alert('Время начала должно быть раньше времени окончания');
            return;
        }

        if (editingEventId) {
            updateScheduleEvent(editingEventId, {
                userId: selectedUser,
                userName: user.name,
                role: user.role,
                typeId: eventTypeId,
                startTime: selectedType.id === 'dayoff' ? '' : eventStart,
                endTime: selectedType.id === 'dayoff' ? '' : eventEnd,
                note: eventNote
            });
        } else {
            addScheduleEvent({
                id: `sc-${Date.now()}`,
                userId: user.id,
                userName: user.name,
                role: user.role,
                date: selectedDate,
                startTime: selectedType.id === 'dayoff' ? '' : eventStart,
                endTime: selectedType.id === 'dayoff' ? '' : eventEnd,
                typeId: eventTypeId,
                note: eventNote
            });
        }
        setIsEventModalOpen(false);
    };

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newMemberName) return;
        const initials = newMemberName.slice(0, 2).toUpperCase();
        addTeamMember({
            id: `u-${Date.now()}`,
            name: newMemberName,
            role: newMemberRole,
            avatar: initials
        });
        setNewMemberName('');
    };

    const handleAddType = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newTypeName) return;
        addEventType({
            id: `custom-${Date.now()}`,
            label: newTypeName,
            color: newTypeColor,
            isSystem: false
        });
        setNewTypeName('');
    };

    // Grouping for Hierarchy
    const groupedUsers = {
        OWNER: team.filter(u => u.role === 'OWNER'),
        MANAGER: team.filter(u => u.role === 'MANAGER'),
        WAREHOUSE: team.filter(u => u.role === 'WAREHOUSE'),
        EXTERNAL: team.filter(u => u.role === 'EXTERNAL'),
    };

    const colorOptions = ['bg-pink-600', 'bg-teal-600', 'bg-indigo-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-lime-600', 'bg-fuchsia-600'];

    // Layout configuration for Week View
    const leftColWidth = isTeamExpanded ? '160px' : '48px';
    const containerClass = isTeamExpanded ? 'overflow-x-auto custom-scrollbar' : 'w-full overflow-hidden';
    const wrapperClass = isTeamExpanded ? 'min-w-[800px]' : 'w-full';

    return (
        <div className="flex flex-col p-2 space-y-4">
            
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                <div className="w-full lg:w-auto flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">График</h2>
                        <p className="text-neutral-500 text-sm font-medium hidden md:block">Планирование смен</p>
                        <p className="text-blue-400 text-sm font-bold md:hidden uppercase tracking-widest mt-1">{formatMonthYear(new Date())}</p>
                    </div>
                    {/* Mobile Settings Toggle */}
                    {canManageTeam && (
                        <button 
                            onClick={() => setIsMobileSettingsOpen(true)}
                            className="md:hidden p-2 bg-[#1c1c1e] rounded-xl text-neutral-400 hover:text-white border border-white/10"
                        >
                            <Settings size={20} />
                        </button>
                    )}
                </div>

                <div className="hidden md:flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                     {canManageTeam && (
                        <div className="flex gap-3">
                            <button onClick={() => setIsTypeManagerOpen(true)} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors flex items-center gap-2 border border-white/5 flex-1 justify-center">
                                <Tag size={16} className="text-pink-400"/> Типы
                            </button>
                            <button onClick={() => setIsTeamModalOpen(true)} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors flex items-center gap-2 border border-white/5 flex-1 justify-center">
                                <Users size={16} className="text-blue-400"/> Команда
                            </button>
                        </div>
                    )}
                    <div className="flex items-center bg-[#1c1c1e] rounded-2xl p-1 border border-white/10 shadow-lg justify-between">
                        <button onClick={prevWeek} className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"><ChevronLeft size={20} /></button>
                        <span className="px-4 font-mono text-white font-bold text-sm text-center flex-1">
                            {weekDays[0].toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                        </span>
                        <button onClick={nextWeek} className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>

            {/* --- MOBILE VERTICAL AGENDA LIST --- */}
            <div className="md:hidden flex flex-col gap-6 pb-24 pt-2">
                 {mobileDates.map((date) => {
                   const dateKey = formatDate(date);
                   const dayEvents = schedule.filter(s => s.date === dateKey);
                   const isToday = dateKey === formatDate(new Date());

                   return (
                       <div key={dateKey} className="flex gap-4">
                           {/* Date Gutter */}
                           <div className="w-14 flex-shrink-0 flex flex-col items-center pt-1">
                               <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-blue-500' : 'text-neutral-500'}`}>
                                   {formatDayName(date)}
                               </span>
                               <span className={`text-2xl font-bold leading-none mt-1 ${isToday ? 'text-blue-500' : 'text-white'}`}>
                                   {formatDayNum(date)}
                               </span>
                               {isToday && <div className="w-1 h-1 rounded-full bg-blue-500 mt-2" />}
                           </div>

                           {/* Events Timeline */}
                           <div className="flex-1 space-y-2 pt-1 border-t border-white/5 min-h-[60px]">
                               {dayEvents.length > 0 ? (
                                   dayEvents.map(event => {
                                       const user = team.find(u => u.id === event.userId);
                                       const typeDef = eventTypes.find(t => t.id === event.typeId);
                                       return (
                                           <div 
                                             key={event.id}
                                             onClick={(e) => handleEventClick(e, event)}
                                             className={`p-3 rounded-2xl ${typeDef?.color || 'bg-neutral-800'} relative group overflow-hidden shadow-lg active:scale-95 transition-transform`}
                                           >
                                               <div className="flex items-center gap-3 relative z-10">
                                                   <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold text-white/90 border border-white/10">
                                                       {user?.avatar}
                                                   </div>
                                                   <div className="flex-1 min-w-0">
                                                       <div className="flex justify-between items-center">
                                                           <div className="text-sm font-bold text-white truncate">{user?.name}</div>
                                                       </div>
                                                       <div className="text-xs text-white/80 font-mono font-medium flex flex-col gap-1 mt-1">
                                                            {typeDef?.id !== 'dayoff' ? (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock size={10} />
                                                                        <span>{event.startTime} - {event.endTime}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="w-1 h-1 bg-white/50 rounded-full"/>
                                                                        <span className="uppercase text-[9px] tracking-wider opacity-80">{typeDef?.label}</span>
                                                                    </div>
                                                                    {event.note && (
                                                                         <div className="mt-1 p-1.5 bg-black/10 rounded text-[10px] italic opacity-90 border-l-2 border-white/20">
                                                                             "{event.note}"
                                                                         </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="uppercase text-[9px] tracking-wider opacity-80 flex items-center gap-1"><Lock size={10}/> {typeDef?.label}</span>
                                                            )}
                                                       </div>
                                                   </div>
                                               </div>
                                           </div>
                                       );
                                   })
                               ) : (
                                   <div className="text-xs text-neutral-600 italic py-3 pl-2">Нет смен</div>
                               )}
                               
                               {/* Add Button for this day */}
                               <button 
                                    onClick={() => handleDateClick(dateKey)}
                                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-white/5 text-neutral-500 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-wide opacity-60 hover:opacity-100"
                               >
                                   <Plus size={14} /> Добавить
                               </button>
                           </div>
                       </div>
                   );
               })}
               
               <button 
                  onClick={() => setMobileDaysLoaded(prev => prev + 14)}
                  className="py-4 mt-4 w-full rounded-2xl bg-white/5 text-neutral-400 hover:text-white text-sm font-bold flex items-center justify-center gap-2"
               >
                   <ArrowDownCircle size={16} />
                   Загрузить еще дни...
               </button>
            </div>

            {/* --- DESKTOP WEEK GRID VIEW --- */}
            <div className={`hidden md:flex ios-glass rounded-[32px] overflow-hidden flex-col border border-white/10 shadow-2xl relative h-[75vh] md:h-[80vh]`}>
                <div className={`flex-1 flex flex-col ${containerClass}`}>
                    <div className={`flex-1 flex flex-col ${wrapperClass}`}>
                        {/* Header Row */}
                        <div 
                            className="grid bg-[#2c2c2e]/90 backdrop-blur-md border-b border-white/10 z-10 sticky top-0"
                            style={{ gridTemplateColumns: `${leftColWidth} 1fr` }}
                        >
                            <div className="p-0 text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-center bg-[#2c2c2e] sticky left-0 z-20 border-r border-white/10">
                                <button 
                                    onClick={() => setIsTeamExpanded(!isTeamExpanded)}
                                    className="w-full h-full flex items-center justify-center hover:bg-white/5 transition-colors"
                                    title={isTeamExpanded ? "Collapse" : "Expand"}
                                >
                                    {isTeamExpanded ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
                                </button>
                            </div>
                            <div className="grid grid-cols-7 divide-x divide-white/5">
                                 {weekDays.map(d => {
                                    const isToday = formatDate(d) === formatDate(new Date());
                                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                    return (
                                        <div key={d.toISOString()} className={`py-4 px-1 text-center transition-colors ${isToday ? 'bg-blue-500/10' : isWeekend ? 'bg-white/[0.02]' : ''}`}>
                                            <div className={`text-[9px] sm:text-[10px] uppercase font-bold mb-1 ${isToday ? 'text-blue-400' : isWeekend ? 'text-red-400' : 'text-neutral-500'}`}>
                                                {formatDayName(d)}
                                            </div>
                                            <div className={`text-sm sm:text-xl font-bold ${isToday ? 'text-blue-400' : isWeekend ? 'text-white/80' : 'text-white'}`}>{formatDayNum(d)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Rows */}
                        <div className="flex-1 bg-[#161618]">
                            {Object.entries(groupedUsers).map(([role, users]) => (
                                users.length > 0 && (
                                    <div key={role} className="border-b border-white/5 last:border-0 relative">
                                        {users.map(user => (
                                            <div 
                                                key={user.id} 
                                                className="grid border-b border-white/5 last:border-0 min-h-[80px] group/row"
                                                style={{ gridTemplateColumns: `${leftColWidth} 1fr` }}
                                            >
                                                
                                                {/* User Info */}
                                                <div className="p-2 flex items-center justify-center border-r border-white/10 relative bg-[#1c1c1e] group-hover/row:bg-[#222224] transition-colors sticky left-0 z-10">
                                                    <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center text-white text-xs font-bold border border-white/10 shrink-0 shadow-lg">
                                                        {user.avatar}
                                                    </div>
                                                    {isTeamExpanded && (
                                                        <div className="ml-3 min-w-0">
                                                            <div className="text-sm font-bold text-white truncate">{user.name}</div>
                                                            <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">{role}</div>
                                                        </div>
                                                    )}
                                                    {/* Lock icon only shown if expanded to avoid clutter in compact mode */}
                                                    {!canEditSchedule(user.role) && isTeamExpanded && (
                                                        <div className="absolute right-2 top-2 opacity-30 text-neutral-500">
                                                            <Lock size={12} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Days */}
                                                <div className="grid grid-cols-7 divide-x divide-white/5">
                                                    {weekDays.map(d => {
                                                        const dateStr = formatDate(d);
                                                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                                        const events = schedule.filter(s => s.userId === user.id && s.date === dateStr);
                                                        const isDragTarget = dragTarget?.userId === user.id && dragTarget?.date === dateStr;

                                                        return (
                                                            <div 
                                                                key={dateStr} 
                                                                onClick={() => handleCellClick(user.id, dateStr)}
                                                                onDragEnter={(e) => handleDragEnter(e, user.id, dateStr)}
                                                                onDragOver={handleDragOver}
                                                                onDrop={(e) => handleDrop(e, user.id, dateStr)}
                                                                className={`relative p-1 transition-all duration-200
                                                                    ${canEditSchedule(user.role) ? 'cursor-pointer' : ''} 
                                                                    ${isWeekend ? 'bg-[#252020]/30' : ''}
                                                                    ${isDragTarget ? 'bg-blue-500/20 ring-inset ring-2 ring-blue-500/50' : 'hover:bg-white/[0.03]'}
                                                                `}
                                                            >
                                                                <div className="flex flex-col gap-1 h-full min-h-[60px] justify-start">
                                                                    {events.map(ev => {
                                                                        const typeDef = eventTypes.find(t => t.id === ev.typeId) || eventTypes[0];
                                                                        const isDayOff = typeDef.id === 'dayoff';

                                                                        if (isDayOff) return (
                                                                            <div 
                                                                                key={ev.id}
                                                                                onClick={(e) => handleEventClick(e, ev)} 
                                                                                draggable={canEditSchedule(user.role)}
                                                                                onDragStart={(e) => handleDragStart(e, ev.id)}
                                                                                className="h-full w-full absolute inset-0 flex items-center justify-center z-10 group/event hover:opacity-80 transition-opacity cursor-pointer bg-white/[0.02]"
                                                                            >
                                                                                 {/* Pattern background via SVG */}
                                                                                 <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '4px 4px'}}></div>
                                                                                 
                                                                                 {/* Compact: Just an Icon or Small Marker */}
                                                                                 <div className={`w-6 h-6 rounded-full border border-white/20 flex items-center justify-center bg-[#161618] shadow-sm`}>
                                                                                    <Lock size={10} className="text-neutral-500"/>
                                                                                 </div>
                                                                            </div>
                                                                        );

                                                                        return (
                                                                            <div 
                                                                                key={ev.id}
                                                                                onClick={(e) => handleEventClick(e, ev)}
                                                                                draggable={canEditSchedule(user.role)}
                                                                                onDragStart={(e) => handleDragStart(e, ev.id)}
                                                                                className={`relative rounded-md px-1.5 py-1 text-white shadow-sm group/item cursor-pointer ${typeDef.color} transition-transform hover:scale-[1.02] hover:z-10 h-full flex flex-col justify-start overflow-hidden border border-white/10`}
                                                                            >
                                                                                 <div className="w-full flex flex-col h-full gap-0.5">
                                                                                    {/* Time Range - Full Display */}
                                                                                    <div className="flex items-center gap-1 text-[10px] font-bold leading-tight whitespace-nowrap border-b border-white/10 pb-0.5 mb-0.5">
                                                                                        <Clock size={8} className="opacity-70"/>
                                                                                        {ev.startTime} - {ev.endTime}
                                                                                    </div>
                                                                                    
                                                                                    {/* Event Type Label */}
                                                                                    <div className="text-[9px] font-bold uppercase tracking-wide opacity-90 truncate">
                                                                                        {typeDef.label}
                                                                                    </div>
                                                                                    
                                                                                    {/* Note/Comment - properly displayed */}
                                                                                    {ev.note && (
                                                                                        <div className="text-[9px] leading-tight opacity-80 italic line-clamp-2 bg-black/10 rounded px-1 py-0.5 mt-auto">
                                                                                            {ev.note}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                
                                                                {/* Add Hint on Hover */}
                                                                {events.length === 0 && canEditSchedule(user.role) && !isDragTarget && (
                                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                                                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                                                                            <Plus size={12} className="text-neutral-500" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* EVENT MODAL */}
            {isEventModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1c1c1e] w-full max-w-sm p-8 rounded-[32px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">{editingEventId ? 'Редактировать событие' : 'Добавить событие'}</h3>
                            <button onClick={() => setIsEventModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="text-neutral-500 hover:text-white" size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleSaveEvent} className="space-y-6">
                            
                            {/* User & Date Selection */}
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shrink-0">
                                        {selectedUser ? team.find(u => u.id === selectedUser)?.avatar : <User size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {/* If User not selected, show dropdown */}
                                        {selectedUser ? (
                                            <div className="text-sm font-bold text-white">{team.find(u => u.id === selectedUser)?.name}</div>
                                        ) : (
                                            <select 
                                                value={selectedUser}
                                                onChange={e => setSelectedUser(e.target.value)}
                                                className="w-full bg-neutral-800 text-white text-sm rounded-lg p-2 outline-none border border-white/10"
                                            >
                                                <option value="">Выберите сотрудника</option>
                                                {team.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                                ))}
                                            </select>
                                        )}
                                        <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5"><Calendar size={10}/> {selectedDate}</div>
                                    </div>
                                    {/* Ability to change user if creating new */}
                                    {!editingEventId && selectedUser && (
                                        <button type="button" onClick={() => setSelectedUser('')} className="text-[10px] text-blue-400 font-bold hover:underline">Изм.</button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] text-neutral-500 font-bold uppercase mb-2 block tracking-wider">Тип события</label>
                                <div className="flex flex-wrap gap-2">
                                    {eventTypes.map(t => (
                                        <button 
                                            key={t.id}
                                            type="button"
                                            onClick={() => setEventTypeId(t.id)}
                                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${eventTypeId === t.id ? `${t.color} border-white/20 text-white shadow-lg scale-105` : 'bg-neutral-800 border-white/5 text-neutral-400 hover:bg-neutral-700'}`}
                                        >
                                            {t.id === 'dayoff' && <Lock size={12} className="opacity-70"/>}
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Inputs - Hidden for DayOff */}
                            {eventTypeId !== 'dayoff' && (
                                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                    <div>
                                        <label className="text-[11px] text-neutral-500 font-bold uppercase mb-2 block tracking-wider">Начало</label>
                                        <div className="relative">
                                            <input type="time" value={eventStart} onChange={e => setEventStart(e.target.value)} className="w-full bg-black/40 rounded-xl p-3 pl-10 text-white text-sm outline-none border border-white/10 focus:border-blue-500/50 transition-colors" />
                                            <Clock size={14} className="absolute left-3 top-3.5 text-neutral-500"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-neutral-500 font-bold uppercase mb-2 block tracking-wider">Конец</label>
                                        <div className="relative">
                                            <input type="time" value={eventEnd} onChange={e => setEventEnd(e.target.value)} className="w-full bg-black/40 rounded-xl p-3 pl-10 text-white text-sm outline-none border border-white/10 focus:border-blue-500/50 transition-colors" />
                                            <Clock size={14} className="absolute left-3 top-3.5 text-neutral-500"/>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[11px] text-neutral-500 font-bold uppercase mb-2 block tracking-wider">Заметка</label>
                                <textarea 
                                    value={eventNote}
                                    onChange={e => setEventNote(e.target.value)}
                                    className="w-full bg-black/40 rounded-xl p-3 text-white text-sm outline-none border border-white/10 focus:border-blue-500/50 transition-colors resize-none h-20 placeholder-neutral-600"
                                    placeholder="Дополнительная информация..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                {editingEventId && (
                                    <button 
                                        type="button"
                                        onClick={() => { deleteScheduleEvent(editingEventId); setIsEventModalOpen(false); }}
                                        className="p-3 rounded-xl bg-red-500/10 text-red-400 font-bold hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button type="submit" className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-400 transition-colors">
                                    {editingEventId ? 'Сохранить изменения' : 'Создать событие'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
            
            {/* ... Other modals (Team, Type) ... */}
             {/* TEAM MODAL */}
             {isTeamModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1c1c1e] w-full max-w-md p-6 rounded-[32px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Управление командой</h3>
                            <button onClick={() => setIsTeamModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="text-neutral-500 hover:text-white" size={20}/></button>
                        </div>
                        
                        <div className="space-y-6">
                            <form onSubmit={handleAddMember} className="flex gap-2">
                                <input 
                                    value={newMemberName}
                                    onChange={e => setNewMemberName(e.target.value)}
                                    placeholder="Имя сотрудника"
                                    className="flex-1 bg-neutral-800 rounded-xl px-4 py-3 text-white text-sm outline-none border border-white/10"
                                />
                                <select 
                                    value={newMemberRole}
                                    onChange={e => setNewMemberRole(e.target.value as UserRole)}
                                    className="bg-neutral-800 rounded-xl px-2 py-3 text-white text-xs outline-none border border-white/10"
                                >
                                    <option value="EXTERNAL">Внештат</option>
                                    <option value="WAREHOUSE">Склад</option>
                                    <option value="MANAGER">Менеджер</option>
                                </select>
                                <button type="submit" className="p-3 bg-blue-500 rounded-xl text-white hover:bg-blue-400">
                                    <Plus size={20} />
                                </button>
                            </form>

                            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                                {team.filter(u => u.role !== 'OWNER').map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-bold text-white">
                                                {member.avatar}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{member.name}</div>
                                                <div className="text-[10px] text-neutral-500 uppercase">{member.role}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteTeamMember(member.id)} className="p-2 text-neutral-500 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

             {/* TYPE MANAGER MODAL */}
             {isTypeManagerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1c1c1e] w-full max-w-sm p-6 rounded-[32px] shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Типы событий</h3>
                            <button onClick={() => setIsTypeManagerOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="text-neutral-500 hover:text-white" size={20}/></button>
                        </div>

                        <div className="space-y-6">
                            <form onSubmit={handleAddType} className="space-y-3">
                                <input 
                                    value={newTypeName}
                                    onChange={e => setNewTypeName(e.target.value)}
                                    placeholder="Название типа (напр. Больничный)"
                                    className="w-full bg-neutral-800 rounded-xl px-4 py-3 text-white text-sm outline-none border border-white/10"
                                />
                                <div className="grid grid-cols-8 gap-2">
                                    {colorOptions.map(c => (
                                        <button 
                                            key={c}
                                            type="button"
                                            onClick={() => setNewTypeColor(c)}
                                            className={`w-8 h-8 rounded-full ${c} ${newTypeColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                                        />
                                    ))}
                                </div>
                                <button type="submit" className="w-full py-3 bg-pink-600 rounded-xl text-white font-bold hover:bg-pink-500">Добавить</button>
                            </form>
                            
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {eventTypes.filter(t => !t.isSystem).map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${t.color}`} />
                                            <span className="text-sm text-white font-medium">{t.label}</span>
                                        </div>
                                        <button onClick={() => deleteEventType(t.id)} className="p-1.5 text-neutral-500 hover:text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {eventTypes.filter(t => !t.isSystem).length === 0 && (
                                    <p className="text-center text-xs text-neutral-600 italic">Нет пользовательских типов</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {/* MOBILE SETTINGS MENU */}
             {isMobileSettingsOpen && (
                 <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end">
                     <div className="bg-[#1c1c1e] rounded-t-[32px] p-6 border-t border-white/10 animate-in slide-in-from-bottom-full duration-300">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Настройки</h3>
                            <button onClick={() => setIsMobileSettingsOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="text-neutral-500 hover:text-white" size={20}/></button>
                        </div>
                        <div className="space-y-3">
                             <button onClick={() => { setIsMobileSettingsOpen(false); setIsTypeManagerOpen(true); }} className="w-full py-4 rounded-2xl bg-neutral-800 text-white font-bold flex items-center justify-center gap-2">
                                 <Tag size={18} className="text-pink-400"/> Управление типами
                             </button>
                             <button onClick={() => { setIsMobileSettingsOpen(false); setIsTeamModalOpen(true); }} className="w-full py-4 rounded-2xl bg-neutral-800 text-white font-bold flex items-center justify-center gap-2">
                                 <Users size={18} className="text-blue-400"/> Управление командой
                             </button>
                        </div>
                     </div>
                 </div>
             )}

        </div>
    );
};

export default Schedule;
