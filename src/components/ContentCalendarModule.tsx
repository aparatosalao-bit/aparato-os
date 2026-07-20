/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { ContentItem, ContentStatus, CRMClient } from '../types';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Instagram, 
  Linkedin, 
  Facebook, 
  Youtube, 
  Globe, 
  Sparkles, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Clock, 
  FileText, 
  Sliders, 
  Filter, 
  ExternalLink,
  Video,
  Image as ImageIcon,
  Users,
  Grid,
  TrendingUp,
  Layout,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Status styling mapping helper
const STATUS_META = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  em_producao: { label: 'Em Produção', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  aguardando_aprovacao: { label: 'Aguardando Aprovação', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  aprovado: { label: 'Aprovado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  agendado: { label: 'Agendado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  publicado: { label: 'Publicado', color: 'bg-teal-500/10 text-teal-300 border-teal-500/20' },
};

// Platform options
const PLATFORM_META: { [key: string]: { label: string, icon: any, color: string } } = {
  Instagram: { label: 'Instagram', icon: Instagram, color: 'text-rose-400 bg-rose-500/10' },
  LinkedIn: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-400 bg-blue-500/10' },
  Facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-500 bg-blue-600/10' },
  YouTube: { label: 'YouTube', icon: Youtube, color: 'text-red-400 bg-red-500/10' },
  Outro: { label: 'Outro', icon: Globe, color: 'text-teal-400 bg-teal-500/10' }
};

export const ContentCalendarModule: React.FC = () => {
  const { currentUser } = useAuth();
  
  // States
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  // Date states for navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 6, 19)); // Start around seed July 2026

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [status, setStatus] = useState<ContentStatus>('rascunho');
  const [formClientId, setFormClientId] = useState('');

  // Feedbacks
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Confirmation states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Drag states
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Load Initial Data
  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };
    window.addEventListener('storage-update', handleSync);
    return () => {
      window.removeEventListener('storage-update', handleSync);
    };
  }, []);

  const loadData = () => {
    const items = StorageService.getContentItems();
    setContentItems(items);
    const clientsList = StorageService.getClients();
    setClients(clientsList);

    // If client is logged in, force filter to their own workspace
    if (currentUser?.role === 'client') {
      setSelectedClientId(currentUser.id);
    }
  };

  // Toast Feedbacks
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedItemId;
    if (!id) return;

    const items = [...contentItems];
    const index = items.findIndex(item => item.id === id);
    if (index >= 0) {
      // Permission check: only admin can modify dates or update items
      if (currentUser?.role !== 'admin') {
        showError('Apenas administradores podem reagendar posts.');
        return;
      }

      const updated = { ...items[index], publicationDate: targetDate };
      StorageService.saveContentItem(updated);
      showSuccess(`Post reagendado com sucesso para ${new Date(targetDate).toLocaleDateString('pt-BR')}!`);
      loadData();
    }
    setDraggedItemId(null);
  };

  // Open Form for Create
  const handleOpenCreate = (dateStr?: string) => {
    if (currentUser?.role !== 'admin') {
      showError('Apenas administradores podem agendar novos posts.');
      return;
    }
    setSelectedItem(null);
    setTitle('');
    setDescription('');
    setPlatform('Instagram');
    setCaption('');
    setMediaUrl('');
    setMediaType('image');
    setResponsiblePerson('');
    setPublicationDate(dateStr || new Date().toISOString().split('T')[0]);
    setStatus('rascunho');
    setFormClientId(clients[0]?.id || '');
    setIsModalOpen(true);
  };

  // Open Details / Edit Form
  const handleOpenDetails = (item: ContentItem) => {
    setSelectedItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setPlatform(item.platform);
    setCaption(item.caption);
    setMediaUrl(item.mediaUrl || '');
    setMediaType(item.mediaType || 'image');
    setResponsiblePerson(item.responsiblePerson);
    setPublicationDate(item.publicationDate);
    setStatus(item.status);
    setFormClientId(item.clientId);
    setIsDetailOpen(true);
  };

  // Submit Save
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !publicationDate || !responsiblePerson) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const clientRef = clients.find(c => c.id === formClientId);
    if (!clientRef) {
      showError('Cliente inválido selecionado.');
      return;
    }

    const updatedItem: ContentItem = {
      id: selectedItem?.id || `post-${Date.now()}`,
      title,
      description,
      platform,
      caption,
      mediaUrl: mediaUrl || undefined,
      mediaType,
      responsiblePerson,
      publicationDate,
      status,
      clientId: formClientId,
      clientName: clientRef.companyName,
      createdAt: selectedItem?.createdAt || new Date().toISOString()
    };

    StorageService.saveContentItem(updatedItem);
    showSuccess(selectedItem ? 'Publicação atualizada!' : 'Nova publicação agendada!');
    setIsModalOpen(false);
    setIsDetailOpen(false);
    loadData();
  };

  // Delete Action
  const handleDeleteItem = (id: string) => {
    if (currentUser?.role !== 'admin') {
      showError('Você não possui permissão para excluir publicações.');
      return;
    }
    setDeleteConfirmId(id);
  };

  const confirmDeleteContentItem = () => {
    if (deleteConfirmId) {
      StorageService.deleteContentItem(deleteConfirmId);
      showSuccess('Publicação removida com sucesso.');
      setIsDetailOpen(false);
      loadData();
      setDeleteConfirmId(null);
    }
  };

  // Quick Approved Trigger (e.g. for client approvals)
  const handleQuickApprove = (item: ContentItem) => {
    const updated = { ...item, status: 'aprovado' as const };
    StorageService.saveContentItem(updated);
    showSuccess('Publicação aprovada com sucesso! Pronto para agendamento.');
    loadData();
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem(updated);
    }
  };

  // Scoped lists depending on filters
  const filteredItems = contentItems.filter(item => {
    const matchesClient = selectedClientId === 'todos' || item.clientId === selectedClientId;
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    return matchesClient && matchesStatus;
  });

  const itemToDelete = contentItems.find(item => item.id === deleteConfirmId);

  // Month navigation helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevDate = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
    }
  };

  const handleNextDate = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
    }
  };

  const getMonthName = (monthIdx: number) => {
    const names = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return names[monthIdx];
  };

  // Generate Month View Calendar Cells
  const renderMonthCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const cells = [];
    
    // Previous Month padding cells
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({ day: dayNum, current: false, dateStr });
    }
    
    // Current Month cells
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, current: true, dateStr });
    }
    
    // Next Month padding cells to complete perfect 6-week grid
    const totalCells = 42;
    const nextMonthPadding = totalCells - cells.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    for (let i = 1; i <= nextMonthPadding; i++) {
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, current: false, dateStr });
    }
    
    return cells;
  };

  // Generate Week View Days
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    // Shift date to Sunday of active week
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      weekDays.push({
        name: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i],
        day: day.getDate(),
        dateStr,
        fullDate: day
      });
    }
    return weekDays;
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedbacks */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 p-4 bg-emerald-500 text-white rounded-xl shadow-2xl border border-emerald-400 font-bold text-xs flex items-center gap-2"
          >
            <CheckCircle size={16} />
            <span>{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 p-4 bg-rose-500 text-white rounded-xl shadow-2xl border border-rose-400 font-bold text-xs flex items-center gap-2"
          >
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar and view switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">
            Calendário Editorial de Conteúdo
          </h1>
          <p className="text-slate-500 dark:text-teal-400 text-xs">
            Planejamento visual de publicações, mídias e controle de aprovação por cliente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Modes switcher */}
          <div className="bg-slate-100 dark:bg-slate-850 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  viewMode === mode 
                    ? 'bg-[#114455] text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {mode === 'month' ? 'Mensal' : mode === 'week' ? 'Semanal' : 'Diário'}
              </button>
            ))}
          </div>

          {/* Quick Schedule Trigger */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => handleOpenCreate()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#ffd700] text-[#114455] hover:bg-[#ffed4a] transition-all shadow-md cursor-pointer"
            >
              <Plus size={15} />
              <span>Agendar Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4">
        
        {/* Client Selection (Admins only) */}
        {currentUser?.role === 'admin' ? (
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Users size={14} className="text-[#ffd700]" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white font-medium focus:outline-none"
            >
              <option value="todos">Todos os Clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-teal-400">
            <Users size={14} />
            <span>Workspace: {clients.find(c => c.id === currentUser?.id)?.companyName || 'Cliente Autenticado'}</span>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-1 min-w-[150px]">
          <Sliders size={14} className="text-[#ffd700]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white font-medium focus:outline-none"
          >
            <option value="todos">Todos os Status</option>
            <option value="rascunho">Rascunho</option>
            <option value="em_producao">Em Produção</option>
            <option value="aguardando_aprovacao">Aguardando Aprovação</option>
            <option value="aprovado">Aprovado</option>
            <option value="agendado">Agendado</option>
            <option value="publicado">Publicado</option>
          </select>
        </div>

        {/* Legend block */}
        <div className="hidden xl:flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Legenda:</span>
          {Object.entries(STATUS_META).map(([statusKey, meta]) => (
            <span key={statusKey} className={`px-2 py-0.5 rounded text-[9px] font-bold border ${meta.color}`}>
              {meta.label}
            </span>
          ))}
        </div>
      </div>

      {/* Main Calendar Navigation Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDate}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          
          <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">
            {viewMode === 'month' && `${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`}
            {viewMode === 'week' && `Semana de ${getWeekDays()[0].day} a ${getWeekDays()[6].day} de ${getMonthName(getWeekDays()[0].fullDate.getMonth())}`}
            {viewMode === 'day' && `${currentDate.getDate()} de ${getMonthName(currentDate.getMonth())} de ${currentDate.getFullYear()}`}
          </h2>

          <button
            onClick={handleNextDate}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          onClick={() => setCurrentDate(new Date(2026, 6, 19))}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold cursor-pointer"
        >
          Hoje (Jul 2026)
        </button>
      </div>

      {/* 1. MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Weekday titles */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60 py-3 text-center">
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((day) => (
              <span key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {day}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
            {renderMonthCells().map(({ day, current, dateStr }, cellIdx) => {
              const cellPosts = filteredItems.filter(item => item.publicationDate === dateStr);
              
              return (
                <div
                  key={`${cellIdx}-${dateStr}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  className={`min-h-[120px] p-2 flex flex-col justify-between transition-all relative group ${
                    current 
                      ? 'bg-white dark:bg-slate-900' 
                      : 'bg-slate-50/50 dark:bg-slate-950/20 text-slate-400'
                  }`}
                >
                  {/* Day Number and Quick Action */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold font-mono ${
                      current ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600'
                    }`}>
                      {day}
                    </span>

                    {/* Quick plus trigger on hover */}
                    {currentUser?.role === 'admin' && current && (
                      <button
                        onClick={() => handleOpenCreate(dateStr)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-brand-accent transition-all cursor-pointer"
                        title="Agendar neste dia"
                      >
                        <Plus size={10} />
                      </button>
                    )}
                  </div>

                  {/* Day Content cards */}
                  <div className="mt-1 flex-1 space-y-1 overflow-y-auto max-h-[90px] pr-0.5 scrollbar-thin">
                    {cellPosts.map((post) => {
                      const platMeta = PLATFORM_META[post.platform] || PLATFORM_META.Outro;
                      const Icon = platMeta.icon;
                      
                      return (
                        <div
                          key={post.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, post.id)}
                          onClick={() => handleOpenDetails(post)}
                          className={`p-1.5 rounded-lg border text-[10px] text-left transition-all cursor-grab active:cursor-grabbing hover:shadow-sm hover:scale-[1.01] ${
                            STATUS_META[post.status]?.color || STATUS_META.rascunho.color
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="font-bold truncate max-w-[70px]">{post.title}</span>
                            <Icon size={10} className="shrink-0" />
                          </div>
                          <p className="text-[8px] opacity-75 truncate">{post.clientName}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Week Grid Columns */}
          <div className="grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-800">
            {getWeekDays().map((dayObj) => {
              const dayPosts = filteredItems.filter(item => item.publicationDate === dayObj.dateStr);
              
              return (
                <div
                  key={dayObj.dateStr}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dayObj.dateStr)}
                  className="min-h-[400px] p-4 flex flex-col justify-start space-y-4"
                >
                  {/* Day column header */}
                  <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-widest">{dayObj.name}</span>
                    <span className="text-lg font-extrabold font-mono text-slate-800 dark:text-white">{dayObj.day}</span>
                    
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => handleOpenCreate(dayObj.dateStr)}
                        className="mt-1 mx-auto flex items-center gap-1 text-[9px] font-bold text-[#ffd700] hover:underline cursor-pointer"
                      >
                        <Plus size={8} />
                        <span>Agendar</span>
                      </button>
                    )}
                  </div>

                  {/* Column posts list */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[350px] pr-0.5">
                    {dayPosts.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-4">Sem posts</p>
                    ) : (
                      dayPosts.map((post) => {
                        const platMeta = PLATFORM_META[post.platform] || PLATFORM_META.Outro;
                        const Icon = platMeta.icon;
                        
                        return (
                          <div
                            key={post.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, post.id)}
                            onClick={() => handleOpenDetails(post)}
                            className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.02] space-y-1.5 ${
                              STATUS_META[post.status]?.color || STATUS_META.rascunho.color
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold truncate">{post.title}</span>
                              <Icon size={12} className="shrink-0" />
                            </div>

                            <p className="text-[10px] opacity-80 line-clamp-2 leading-relaxed">
                              {post.description || post.caption}
                            </p>

                            <div className="pt-1 flex items-center justify-between text-[9px] opacity-75 border-t border-slate-100/10">
                              <span className="truncate max-w-[65px] font-semibold">{post.clientName}</span>
                              <span className="capitalize">{STATUS_META[post.status]?.label}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DAILY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-4 border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Feed de Postagens para Este Dia
            </h3>
            
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => handleOpenCreate(currentDate.toISOString().split('T')[0])}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#114455] text-white text-xs font-bold hover:bg-[#114455]/80 transition-all cursor-pointer"
              >
                <Plus size={12} />
                <span>Adicionar Post</span>
              </button>
            )}
          </div>

          {/* Daily Posts Stack */}
          {filteredItems.filter(item => item.publicationDate === currentDate.toISOString().split('T')[0]).length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs text-slate-400 italic">Nenhum post agendado ou produzido para esta data específica.</p>
              <p className="text-[10px] text-slate-400">Arraste publicações ou clique em "Adicionar Post" para planejar conteúdo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {filteredItems
                .filter(item => item.publicationDate === currentDate.toISOString().split('T')[0])
                .map((post) => {
                  const platMeta = PLATFORM_META[post.platform] || PLATFORM_META.Outro;
                  const Icon = platMeta.icon;
                  const statusMeta = STATUS_META[post.status];
                  
                  return (
                    <div
                      key={post.id}
                      onClick={() => handleOpenDetails(post)}
                      className="bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-all cursor-pointer p-4 space-y-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white pt-1">
                            {post.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 block">{post.clientName}</span>
                        </div>

                        <div className={`p-2 rounded-xl ${platMeta.color}`}>
                          <Icon size={16} />
                        </div>
                      </div>

                      {post.mediaUrl && (
                        <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-200 dark:bg-slate-800 border border-slate-150 dark:border-slate-800">
                          <img 
                            src={post.mediaUrl} 
                            alt={post.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute right-2 bottom-2 bg-black/60 backdrop-blur-md p-1 rounded-md text-[9px] text-white flex items-center gap-1">
                            {post.mediaType === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                            <span className="capitalize">{post.mediaType}</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl text-xs border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase">Legenda / Copy:</span>
                        <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed line-clamp-3">
                          {post.caption || 'Sem legenda cadastrada.'}
                        </p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-150 dark:border-slate-800/60 pt-2.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-500">
                          <User size={10} />
                          {post.responsiblePerson}
                        </span>
                        <span>{new Date(post.publicationDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* DETAIL AND EDIT SELECTION MODAL */}
      <AnimatePresence>
        {isDetailOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-2xl w-full border border-slate-150 dark:border-slate-800 shadow-2xl text-left"
            >
              {/* Modal Banner */}
              <div className="p-6 bg-[#08222a] border-b border-slate-800 text-white flex items-center justify-between">
                <div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${STATUS_META[selectedItem.status].color}`}>
                    {STATUS_META[selectedItem.status].label}
                  </span>
                  <h3 className="text-lg font-bold font-display text-white mt-1.5">{selectedItem.title}</h3>
                  <p className="text-[11px] text-teal-400">Workspace Corporativo: {selectedItem.clientName}</p>
                </div>
                <button 
                  onClick={() => setIsDetailOpen(false)} 
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body Container */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
                {/* Visual attachments & copy details */}
                <div className="space-y-4">
                  {selectedItem.mediaUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative aspect-video bg-slate-100 dark:bg-slate-850">
                      <img 
                        src={selectedItem.mediaUrl} 
                        alt={selectedItem.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400 flex flex-col justify-center items-center gap-2 aspect-video">
                      <ImageIcon size={24} className="text-slate-400" />
                      <span>Sem anexos de mídia cadastrados</span>
                    </div>
                  )}

                  {/* Caption info */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Texto da Publicação (Legenda)</span>
                    <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                      {selectedItem.caption || 'Nenhuma legenda cadastrada.'}
                    </div>
                  </div>
                </div>

                {/* Edit Form Fields or Actions */}
                <div className="space-y-4">
                  {/* Action row (Aprove / edit / delete) */}
                  <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                    {/* Approve button for clients */}
                    {selectedItem.status === 'aguardando_aprovacao' && (
                      <button
                        onClick={() => handleQuickApprove(selectedItem)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Aprovar Publicação</span>
                      </button>
                    )}

                    {currentUser?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => {
                            setIsDetailOpen(false);
                            setIsModalOpen(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          <Edit2 size={13} />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(selectedItem.id)}
                          className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer"
                          title="Excluir Post"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Meta Details Listing */}
                  <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="font-bold text-slate-400 uppercase text-[9px]">Plataforma</span>
                      <span className="font-semibold text-[#ffd700] bg-[#114455] px-2 py-0.5 rounded-lg">{selectedItem.platform}</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="font-bold text-slate-400 uppercase text-[9px]">Responsável</span>
                      <span className="font-semibold">{selectedItem.responsiblePerson}</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="font-bold text-slate-400 uppercase text-[9px]">Data Agendada</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-white">
                        {new Date(selectedItem.publicationDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/50">
                      <span className="font-bold text-slate-400 uppercase text-[9px]">Descrição Técnica</span>
                      <p className="text-right text-[11px] text-slate-500 font-medium truncate max-w-[180px]" title={selectedItem.description}>
                        {selectedItem.description || 'Nenhuma descrição técnica informada.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE & EDIT FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-lg w-full border border-slate-150 dark:border-slate-800 shadow-2xl text-left"
            >
              <div className="p-5 bg-[#08222a] border-b border-slate-800 text-white flex items-center justify-between">
                <h3 className="text-md font-bold text-white font-display">
                  {selectedItem ? 'Editar Agendamento' : 'Agendar Novo Conteúdo'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                
                {/* Client workspace selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Cliente da Parceria</label>
                  <select
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>

                {/* Post Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Título da Publicação *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Oferta de Inverno, Reels Dicas..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                  />
                </div>

                {/* Responsible Person and Publication Date row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Responsável Criativo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nome do redator/designer"
                      value={responsiblePerson}
                      onChange={(e) => setResponsiblePerson(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Data de Publicação *</label>
                    <input
                      type="date"
                      required
                      value={publicationDate}
                      onChange={(e) => setPublicationDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Social media platform and Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Canal Social</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Facebook">Facebook</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Outro">Outro Canal</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Status Editorial</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ContentStatus)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    >
                      <option value="rascunho">Rascunho</option>
                      <option value="em_producao">Em Produção</option>
                      <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="agendado">Agendado</option>
                      <option value="publicado">Publicado</option>
                    </select>
                  </div>
                </div>

                {/* Media URL attachment */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">URL da Imagem / Capa de Vídeo (Opcional)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                  />
                </div>

                {/* Description and Caption fields */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Legenda da Postagem (Copy)</label>
                  <textarea
                    rows={3}
                    placeholder="Digite hashtags, chamadas de ação e texto da publicação..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white resize-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Observações Técnicas / Briefing</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Necessita paleta azul, foco no CTA de WhatsApp..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white resize-none"
                  />
                </div>

                {/* Form buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-[#ffd700] text-[#114455] hover:bg-[#ffed4a] transition-all shadow-md cursor-pointer"
                  >
                    Salvar Mudanças
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deleteConfirmId && itemToDelete && (
        <div className="fixed inset-0 z-50 bg-[#08222a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-rose-500/20 overflow-hidden relative text-left"
          >
            <div className="h-1.5 w-full bg-rose-500" />
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-bold font-display">
                  Excluir Publicação
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tem certeza que deseja excluir permanentemente a publicação <strong className="text-rose-500 dark:text-rose-400">"{itemToDelete.title}"</strong> do calendário editorial?
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteContentItem}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Sim, Excluir Publicação
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
