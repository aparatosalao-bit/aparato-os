/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { SupportTicket } from '../types';
import { 
  LifeBuoy, 
  Plus, 
  MessageSquare, 
  Send, 
  Check, 
  Clock, 
  X,
  AlertCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SupportModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // New Ticket Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Reply message text
  const [replyText, setReplyText] = useState('');
  
  // Confirmation state
  const [closeConfirmTicket, setCloseConfirmTicket] = useState<SupportTicket | null>(null);

  const loadTickets = () => {
    const allTickets = StorageService.getTickets();
    if (currentUser?.role === 'admin') {
      setTickets(allTickets);
    } else if (currentUser) {
      setTickets(allTickets.filter(t => t.clientId === currentUser.id));
    }
  };

  useEffect(() => {
    loadTickets();

    const handleSync = () => {
      loadTickets();
    };
    window.addEventListener('storage-update', handleSync);
    return () => {
      window.removeEventListener('storage-update', handleSync);
    };
  }, [currentUser]);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    const newTicket: SupportTicket = {
      id: `t-${Date.now()}`,
      subject,
      message,
      clientId: currentUser.id,
      clientName: currentUser.companyName || currentUser.name,
      status: 'aberto',
      createdAt: new Date().toISOString(),
      replies: []
    };

    StorageService.saveTicket(newTicket);
    
    // Notify admin
    StorageService.addNotification(
      'u-admin-1',
      'Novo Chamado de Suporte',
      `O cliente "${currentUser.companyName || currentUser.name}" abriu o chamado: "${subject}".`,
      'support'
    );

    setSubject('');
    setMessage('');
    setShowAddModal(false);
    loadTickets();
  };

  const handlePostReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    const updatedReplies = [...selectedTicket.replies];
    updatedReplies.push({
      id: `rep-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      message: replyText.trim(),
      createdAt: new Date().toISOString()
    });

    const newStatus = isAdmin ? 'respondido' : 'em_atendimento';
    const updatedTicket: SupportTicket = {
      ...selectedTicket,
      status: newStatus,
      replies: updatedReplies
    };

    StorageService.saveTicket(updatedTicket);

    // Notify other party
    if (isAdmin) {
      StorageService.addNotification(
        selectedTicket.clientId,
        'Chamado de Suporte Respondido',
        `O time Aparato respondeu ao seu chamado: "${selectedTicket.subject}".`,
        'support'
      );
    } else {
      StorageService.addNotification(
        'u-admin-1',
        'Réplica em Chamado de Suporte',
        `O cliente "${selectedTicket.clientName}" respondeu no chamado: "${selectedTicket.subject}".`,
        'support'
      );
    }

    setSelectedTicket(updatedTicket);
    setReplyText('');
    loadTickets();
  };

  const handleCloseTicket = (ticket: SupportTicket) => {
    setCloseConfirmTicket(ticket);
  };

  const confirmCloseTicket = () => {
    if (closeConfirmTicket) {
      const updated: SupportTicket = { ...closeConfirmTicket, status: 'fechado' };
      StorageService.saveTicket(updated);
      
      if (selectedTicket && selectedTicket.id === closeConfirmTicket.id) {
        setSelectedTicket(updated);
      }
      loadTickets();
      setCloseConfirmTicket(null);
    }
  };

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'aberto': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300';
      case 'em_atendimento': return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 border-sky-300';
      case 'respondido': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-300';
      case 'fechado': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white font-display">
            Suporte e Atendimento
          </h2>
          <p className="text-xs text-slate-400">
            Fale diretamente com nossa equipe de criação e analistas de tráfego pago para alinhar suas estratégias.
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-primary dark:bg-brand-accent dark:hover:bg-brand-accent-hover dark:text-brand-primary text-white hover:bg-brand-primary-light font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="open-new-ticket-btn"
          >
            <Plus size={16} />
            <span>Novo Chamado</span>
          </button>
        )}
      </div>

      {/* Main Panel layout splits tickets and conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seus Chamados</h3>
          
          {tickets.length === 0 ? (
            <div className="py-12 text-center">
              <LifeBuoy className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={32} />
              <p className="text-xs text-slate-400">Nenhum chamado de suporte aberto.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected 
                        ? 'border-brand-accent bg-slate-50 dark:bg-slate-850' 
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">
                      {t.subject}
                    </h4>
                    {isAdmin && (
                      <span className="text-[9px] text-brand-accent font-semibold uppercase block mt-1">
                        {t.clientName}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Conversation Area */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col min-h-[450px]">
          {selectedTicket ? (
            <div className="flex-1 flex flex-col justify-between h-full overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="truncate">{selectedTicket.subject}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Iniciado por {selectedTicket.clientName} em {new Date(selectedTicket.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex gap-2">
                  {selectedTicket.status !== 'fechado' && (
                    <button
                      onClick={() => handleCloseTicket(selectedTicket)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Fechar Chamado"
                    >
                      <Check size={12} />
                      <span>Resolvido</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chat timeline messages container */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[350px]">
                {/* Initial Ticket Message */}
                <div className="flex gap-3 text-left">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 text-slate-600 font-bold text-xs uppercase">
                    {selectedTicket.clientName.substring(0, 2)}
                  </div>
                  <div className="space-y-1 max-w-[85%]">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3.5 rounded-r-2xl rounded-bl-2xl">
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {selectedTicket.message}
                      </p>
                    </div>
                    <span className="text-[9px] text-slate-400 block pl-1">
                      {selectedTicket.clientName} • {new Date(selectedTicket.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Replies */}
                {selectedTicket.replies.map((rep) => {
                  const isOwnMessage = rep.userId === currentUser.id;
                  return (
                    <div 
                      key={rep.id} 
                      className={`flex gap-3 text-left ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwnMessage && (
                        <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center shrink-0 border border-brand-accent text-white font-bold text-xs uppercase">
                          {rep.userName.substring(0, 2)}
                        </div>
                      )}

                      <div className="space-y-1 max-w-[85%]">
                        <div className={`p-3.5 rounded-2xl ${
                          isOwnMessage 
                            ? 'bg-brand-primary text-white rounded-l-2xl rounded-br-2xl' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-r-2xl rounded-bl-2xl'
                        }`}>
                          <p className="text-xs font-medium leading-relaxed">
                            {rep.message}
                          </p>
                        </div>
                        <span className={`text-[9px] text-slate-400 block pl-1 ${isOwnMessage ? 'text-right pr-1' : ''}`}>
                          {rep.userName} ({rep.userRole === 'admin' ? 'Aparato' : 'Cliente'}) • {new Date(rep.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Entry bar */}
              {selectedTicket.status !== 'fechado' ? (
                <form 
                  onSubmit={handlePostReply} 
                  className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    required
                    placeholder="Digite sua resposta técnica..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-light dark:bg-brand-accent dark:hover:bg-brand-accent-hover dark:text-brand-primary font-bold flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Send size={15} />
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 text-center border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold italic">
                    Este chamado de suporte foi resolvido e fechado.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <HelpCircle className="text-slate-300 dark:text-slate-700 mb-3 animate-bounce" size={40} />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum chamado selecionado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Selecione um chamado de suporte técnico ao lado para revisar a linha de mensagens ou postar novas atualizações.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal (Only clients) */}
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
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-brand-primary text-white">
                <h3 className="text-sm font-bold font-display flex items-center gap-2">
                  <LifeBuoy size={16} className="text-brand-accent" />
                  <span>Novo Chamado de Suporte</span>
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-200 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Assunto / Tópico principal</label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex: Dúvida sobre faturamento ou alteração de verba"
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Mensagem descritiva</label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      placeholder="Escreva detalhadamente o seu problema ou dúvida para que possamos responder da melhor forma possível."
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-brand-primary font-bold text-xs shadow-md"
                  >
                    Enviar Chamado
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM CLOSE TICKET MODAL */}
      {closeConfirmTicket && (
        <div className="fixed inset-0 z-50 bg-[#08222a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-teal-500/20 overflow-hidden relative text-left"
          >
            <div className="h-1.5 w-full bg-teal-500" />
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-teal-500">
                <AlertCircle size={20} />
                <h3 className="text-lg font-bold font-display">
                  Concluir Chamado de Suporte
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Deseja realmente marcar o chamado <strong className="text-teal-600 dark:text-teal-400">"{closeConfirmTicket.subject}"</strong> como resolvido/fechado?
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCloseConfirmTicket(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmCloseTicket}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-750 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Confirmar e Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
