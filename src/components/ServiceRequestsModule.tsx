/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { ServiceRequest, ServiceRequestStatus, ServiceRequestType, ServiceRequestPriority, User } from '../types';
import { 
  FileCode2, 
  Plus, 
  Check, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  User as UserIcon,
  MessageSquare,
  Sparkles,
  Calendar,
  Send,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ServiceRequestsModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  
  // Filtering states
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterPriority, setFilterPriority] = useState<string>('todos');
  
  // Selected request details modal
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Request Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ServiceRequestType>('social_media');
  const [priority, setPriority] = useState<ServiceRequestPriority>('media');
  const [deadline, setDeadline] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  // Comment / Log update state
  const [updateLogText, setUpdateLogText] = useState('');

  const loadRequests = () => {
    const allRequests = StorageService.getRequests();
    const allUsers = StorageService.getUsers();

    if (currentUser?.role === 'admin') {
      setRequests(allRequests);
      setClients(allUsers.filter(u => u.role === 'client'));
    } else if (currentUser) {
      setRequests(allRequests.filter(r => r.clientId === currentUser.id));
    }
  };

  useEffect(() => {
    loadRequests();

    const handleSync = () => {
      loadRequests();
    };
    window.addEventListener('storage-update', handleSync);
    return () => {
      window.removeEventListener('storage-update', handleSync);
    };
  }, [currentUser]);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    let finalClientId = currentUser.id;
    let finalClientName = currentUser.companyName || currentUser.name;

    if (isAdmin) {
      const selectedClientObj = clients.find(c => c.id === selectedClientId);
      if (!selectedClientObj) {
        alert('Selecione um cliente válido.');
        return;
      }
      finalClientId = selectedClientObj.id;
      finalClientName = selectedClientObj.companyName || selectedClientObj.name;
    }

    const newRequest: ServiceRequest = {
      id: `r-${Date.now()}`,
      title,
      description,
      type,
      clientId: finalClientId,
      clientName: finalClientName,
      status: 'pendente',
      priority,
      createdAt: new Date().toISOString(),
      deadline: deadline || undefined,
      updates: []
    };

    StorageService.saveRequest(newRequest);

    // Notify client or admin
    if (isAdmin) {
      StorageService.addNotification(
        finalClientId,
        'Novo Pedido Registrado',
        `A equipe Aparato registrou uma nova solicitação: "${title}".`,
        'request'
      );
    } else {
      StorageService.addNotification(
        'u-admin-1',
        'Nova Solicitação de Marketing',
        `O cliente "${finalClientName}" enviou o pedido: "${title}".`,
        'request'
      );
    }

    setTitle('');
    setDescription('');
    setType('social_media');
    setPriority('media');
    setDeadline('');
    setSelectedClientId('');
    setShowAddModal(false);
    loadRequests();
  };

  const handleStatusChange = (requestId: string, newStatus: ServiceRequestStatus) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    const updated = { ...req, status: newStatus };
    
    // Auto insert an update comment
    const updateLogs = req.updates ? [...req.updates] : [];
    updateLogs.push({
      by: currentUser.name,
      role: currentUser.role,
      text: `Status alterado de "${req.status.replace('_', ' ')}" para "${newStatus.replace('_', ' ')}".`,
      createdAt: new Date().toISOString()
    });
    updated.updates = updateLogs;

    StorageService.saveRequest(updated);
    
    // Notify client
    StorageService.addNotification(
      req.clientId,
      'Solicitação Atualizada',
      `O status do pedido "${req.title}" foi atualizado para "${newStatus.replace('_', ' ')}".`,
      'request'
    );

    // Update state to render details accurately
    if (selectedRequest && selectedRequest.id === requestId) {
      setSelectedRequest(updated);
    }
    loadRequests();
  };

  const handlePostUpdateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !updateLogText.trim()) return;

    const updateLogs = selectedRequest.updates ? [...selectedRequest.updates] : [];
    updateLogs.push({
      by: currentUser.name,
      role: currentUser.role,
      text: updateLogText.trim(),
      createdAt: new Date().toISOString()
    });

    const updated = { ...selectedRequest, updates: updateLogs };
    StorageService.saveRequest(updated);
    
    // Notify target client if Admin posts
    if (isAdmin) {
      StorageService.addNotification(
        selectedRequest.clientId,
        'Novo Comentário em Pedido',
        `A equipe adicionou uma atualização em "${selectedRequest.title}": "${updateLogText.substring(0, 40)}..."`,
        'request'
      );
    }

    setSelectedRequest(updated);
    setUpdateLogText('');
    loadRequests();
  };

  const filteredRequests = requests.filter(req => {
    const statusMatch = filterStatus === 'todos' || req.status === filterStatus;
    const priorityMatch = filterPriority === 'todos' || req.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const getPriorityStyle = (prio: ServiceRequestPriority) => {
    switch (prio) {
      case 'alta': return 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
      case 'media': return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'baixa': return 'bg-slate-500/10 border-slate-500/20 text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusColor = (st: ServiceRequestStatus) => {
    switch (st) {
      case 'pendente': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-300';
      case 'em_producao': return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-400/25';
      case 'revisao': return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-400/25';
      case 'concluido': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-400/25';
      case 'cancelado': return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-400/25';
    }
  };

  // horizontal timeline steps definition
  const progressSteps: { key: ServiceRequestStatus; label: string }[] = [
    { key: 'pendente', label: 'Pendente' },
    { key: 'em_producao', label: 'Produção' },
    { key: 'revisao', label: 'Revisão' },
    { key: 'concluido', label: 'Concluído' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white font-display">
            Central de Demandas
          </h2>
          <p className="text-xs text-slate-400">
            Gerencie o pipeline de criação de criativos, textos de copy, e estratégias de anúncios pagos.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-primary dark:bg-brand-accent dark:hover:bg-brand-accent-hover dark:text-brand-primary text-white hover:bg-brand-primary-light font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          id="add-new-request-btn"
        >
          <Plus size={16} />
          <span>Solicitar Novo Job</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <ListFilter size={16} className="text-brand-accent" />
          <span className="text-xs font-bold text-slate-800 dark:text-white">Filtros Avançados:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="em_producao">Em Produção</option>
              <option value="revisao">Revisão</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Prioridade</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
            >
              <option value="todos">Todas</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Request Grid Board */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <FileCode2 className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum job encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Não há solicitações cadastradas correspondentes aos filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((req) => (
            <motion.div
              key={req.id}
              layout
              onClick={() => setSelectedRequest(req)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-accent dark:hover:border-brand-accent rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getPriorityStyle(req.priority)} uppercase`}>
                    {req.priority}
                  </span>
                  
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(req.status)}`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white line-clamp-1">
                    {req.title}
                  </h3>
                  {isAdmin && (
                    <p className="text-[10px] text-brand-accent font-semibold uppercase tracking-wider flex items-center gap-1">
                      <UserIcon size={10} /> {req.clientName}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mt-1">
                    {req.description}
                  </p>
                </div>

                {/* Sub-details */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>Categoria:</span>
                    <span className="capitalize text-slate-600 dark:text-slate-300">{req.type.replace('_', ' ')}</span>
                  </div>
                  {req.deadline && (
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>Prazo Alvo:</span>
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Calendar size={11} /> {new Date(req.deadline).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer interaction prompt */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-brand-primary dark:text-brand-accent">
                <span className="flex items-center gap-1">
                  <MessageSquare size={13} />
                  <span>{req.updates?.length || 0} Logs</span>
                </span>
                <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Detalhes <ArrowRight size={12} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Slide-Over / Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-screen w-full max-w-lg shadow-2xl relative z-50 flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-brand-primary text-white">
                <div className="min-w-0">
                  <span className="text-[10px] text-brand-accent font-semibold tracking-wider uppercase">
                    Job ID: {selectedRequest.id}
                  </span>
                  <h3 className="text-sm font-extrabold font-display truncate">
                    {selectedRequest.title}
                  </h3>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-slate-200 hover:text-white cursor-pointer shrink-0">
                  <Check size={18} />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Meta details */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Prioridade</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                        {selectedRequest.priority}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Canal</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                        {selectedRequest.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Cliente</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedRequest.clientName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Data Limite</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedRequest.deadline ? new Date(selectedRequest.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Detalhamento Técnico</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                    {selectedRequest.description}
                  </p>
                </div>

                {/* Progress horizontal steps visualizer */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Status & Entrega</h4>
                  
                  {/* Status update control buttons if ADMIN */}
                  {isAdmin ? (
                    <div className="flex flex-wrap gap-2">
                      {progressSteps.map((step) => {
                        const isCurrent = selectedRequest.status === step.key;
                        return (
                          <button
                            key={step.key}
                            onClick={() => handleStatusChange(selectedRequest.id, step.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCurrent 
                                ? 'bg-brand-accent text-brand-primary' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {step.label}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handleStatusChange(selectedRequest.id, 'cancelado')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedRequest.status === 'cancelado'
                            ? 'bg-rose-500 text-white'
                            : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                        }`}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    /* Customer display: real milestone tracker */
                    <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between relative">
                        {progressSteps.map((step, idx) => {
                          const statusIndex = progressSteps.findIndex(s => s.key === selectedRequest.status);
                          const isCompleted = idx <= statusIndex;
                          const isCurrent = selectedRequest.status === step.key;

                          return (
                            <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isCompleted 
                                  ? 'bg-brand-accent text-brand-primary' 
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                              }`}>
                                {isCompleted ? <Check size={12} /> : idx + 1}
                              </div>
                              <span className={`text-[9px] font-bold mt-1.5 ${
                                isCurrent ? 'text-brand-accent' : 'text-slate-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit log updates */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Sparkles size={14} className="text-brand-accent" />
                    <span>Linha do Tempo (Logs de Entrega)</span>
                  </h4>

                  <div className="space-y-3.5">
                    {(!selectedRequest.updates || selectedRequest.updates.length === 0) ? (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pl-2">
                        Nenhuma atualização ou nota de progresso registrada para este job.
                      </p>
                    ) : (
                      selectedRequest.updates.map((log, idx) => (
                        <div 
                          key={idx}
                          className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-700 dark:text-slate-300">
                              {log.by} <span className="text-slate-400 font-medium">({log.role === 'admin' ? 'Aparato Team' : 'Cliente'})</span>
                            </span>
                            <span className="text-slate-400">
                              {new Date(log.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {log.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Add developer-style updates form at the bottom */}
              <form onSubmit={handlePostUpdateLog} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-2 shrink-0">
                <input
                  type="text"
                  required
                  placeholder="Escreva uma observação ou tire dúvidas..."
                  value={updateLogText}
                  onChange={(e) => setUpdateLogText(e.target.value)}
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 dark:text-white"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-light dark:bg-brand-accent dark:hover:bg-brand-accent-hover dark:text-brand-primary font-bold flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Request Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-brand-primary text-white">
                <h3 className="text-sm font-bold font-display flex items-center gap-2">
                  <FileCode2 size={16} className="text-brand-accent" />
                  <span>Solicitar Novo Job</span>
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-200 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateRequest} className="p-5 space-y-4">
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">O que você precisa? (Título curto)</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Carrossel de Fotos do Dia dos Pais"
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Client Select (if Admin) */}
                  {isAdmin && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">Cliente Solicitante</label>
                      <select
                        required
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                      >
                        <option value="">-- Escolha um Cliente --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Type / Category */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Tipo de Serviço</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as ServiceRequestType)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    >
                      <option value="social_media">Social Media (Post / Carrossel / Reels)</option>
                      <option value="design_grafico">Design Gráfico (Identidade / Catálogo / Banner)</option>
                      <option value="trafego_pago">Tráfego Pago (Configuração / Otimização)</option>
                      <option value="branding">Branding (Logotipo / Estudo de Marca)</option>
                      <option value="copywriting">Copywriting (Redação de Artigos / Anúncios)</option>
                      <option value="outros">Outros Demandas</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Descrição detalhada do Job</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Indique as referências visuais, dimensões desejadas, textos sugeridos e foco do anúncio."
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Priority & Deadline */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">Prioridade</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as ServiceRequestPriority)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                      >
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">Prazo Esperado</label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-brand-primary font-bold text-xs shadow-md cursor-pointer"
                  >
                    Enviar Solicitação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
