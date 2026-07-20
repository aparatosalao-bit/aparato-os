/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { Campaign, ServiceRequest, User } from '../types';
import { 
  Megaphone, 
  FileCode2, 
  LifeBuoy, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle,
  Plus, 
  ArrowUpRight,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ticketsCount, setTicketsCount] = useState(0);

  const loadData = () => {
    const allCampaigns = StorageService.getCampaigns();
    const allRequests = StorageService.getRequests();
    const allUsers = StorageService.getUsers();
    const allTickets = StorageService.getTickets();

    if (currentUser?.role === 'admin') {
      setCampaigns(allCampaigns);
      setRequests(allRequests);
      setUsers(allUsers.filter(u => u.role === 'client'));
      setTicketsCount(allTickets.filter(t => t.status !== 'fechado').length);
    } else if (currentUser) {
      setCampaigns(allCampaigns.filter(c => c.clientId === currentUser.id));
      setRequests(allRequests.filter(r => r.clientId === currentUser.id));
      setTicketsCount(allTickets.filter(t => t.clientId === currentUser.id && t.status !== 'fechado').length);
    }
  };

  useEffect(() => {
    loadData();
    // Poll to keep in sync with local storage edits
    const interval = setInterval(loadData, 3000);

    const handleSync = () => {
      loadData();
    };
    window.addEventListener('storage-update', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage-update', handleSync);
    };
  }, [currentUser]);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  // Calculations for Client
  const activeCampaigns = campaigns.filter(c => c.status === 'ativo');
  const totalBudget = campaigns.reduce((acc, c) => acc + c.budget, 0);
  const pendingRequests = requests.filter(r => r.status !== 'concluido' && r.status !== 'cancelado');
  
  // Total metrics
  const totalReach = campaigns.reduce((acc, c) => acc + (c.metrics?.reach || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.metrics?.clicks || 0), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.metrics?.conversions || 0), 0);
  const totalSpend = campaigns.reduce((acc, c) => acc + (c.metrics?.spend || 0), 0);

  // Recharts Chart Data (Weekly conversions simulation)
  const chartData = [
    { name: 'Semana 1', alcance: Math.round(totalReach * 0.15), cliques: Math.round(totalClicks * 0.16), conversões: Math.round(totalConversions * 0.14) },
    { name: 'Semana 2', alcance: Math.round(totalReach * 0.32), cliques: Math.round(totalClicks * 0.35), conversões: Math.round(totalConversions * 0.28) },
    { name: 'Semana 3', alcance: Math.round(totalReach * 0.65), cliques: Math.round(totalClicks * 0.68), conversões: Math.round(totalConversions * 0.58) },
    { name: 'Semana 4', alcance: totalReach, cliques: totalClicks, conversões: totalConversions },
  ];

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-brand-primary dark:bg-[#0a232c] p-6 sm:p-8 text-white shadow-xl border border-gold-500/20"
      >
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-56 h-56 rounded-full bg-brand-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent/20 border border-brand-accent/30 text-brand-accent text-xs font-semibold">
              <Sparkles size={13} />
              <span>Aparato Marketing OS • v1.1.0</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">
              {isAdmin ? 'Central de Comando Aparato' : `Olá, ${currentUser.name}!`}
            </h2>
            <p className="text-sm text-slate-200">
              {isAdmin 
                ? 'Monitore a performance de campanhas, solucione tíquetes e acelere as entregas dos seus clientes em uma única tela integrada.'
                : `Acompanhe o crescimento de ${currentUser.companyName || 'sua empresa'} com estatísticas consolidadas e relatórios em tempo real.`
              }
            </p>
          </div>
          
          <div className="flex gap-3 shrink-0">
            {isAdmin ? (
              <button 
                onClick={() => setActiveTab('requests')}
                className="px-5 py-3 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-brand-primary font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                id="admin-quick-requests-btn"
              >
                <FileCode2 size={16} />
                <span>Analisar Pedidos</span>
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className="px-5 py-3 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-brand-primary font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  id="client-quick-request-btn"
                >
                  <Plus size={16} />
                  <span>Nova Solicitação</span>
                </button>
                <button 
                  onClick={() => setActiveTab('campaigns')}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
                  id="client-quick-campaigns-btn"
                >
                  <span>Ver Campanhas</span>
                  <ArrowUpRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {isAdmin ? (
          // Admin KPI Grid
          <>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Clientes</span>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Users size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white font-display">
                  {users.length}
                </h3>
                <p className="text-xs text-teal-600 font-semibold mt-1 flex items-center gap-1">
                  <span>Clientes ativos na base</span>
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Campanhas Ativas</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Megaphone size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white font-display">
                  {campaigns.filter(c => c.status === 'ativo').length}
                </h3>
                <p className="text-xs text-indigo-600 font-semibold mt-1">
                  De {campaigns.length} campanhas totais
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pedidos Pendentes</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Clock size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white font-display">
                  {requests.filter(r => r.status === 'pendente' || r.status === 'em_producao').length}
                </h3>
                <p className="text-xs text-amber-600 font-semibold mt-1">
                  Aguardando ação da equipe
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Suporte Aberto</span>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <LifeBuoy size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white font-display">
                  {ticketsCount}
                </h3>
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  Chamados ativos sem solução
                </p>
              </div>
            </div>
          </>
        ) : (
          // Client KPI Grid
          <>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Investimento Total</span>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white font-display truncate">
                  {formatCurrency(totalSpend)}
                </h3>
                <p className="text-xs text-teal-600 font-semibold mt-1">
                  Budget contratado: {formatCurrency(totalBudget)}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Campanhas Ativas</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Megaphone size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white font-display">
                  {activeCampaigns.length}
                </h3>
                <p className="text-xs text-indigo-600 font-semibold mt-1">
                  {campaigns.length} planejadas ou finalizadas
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Solicitações Ativas</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FileCode2 size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white font-display">
                  {pendingRequests.length}
                </h3>
                <p className="text-xs text-amber-600 font-semibold mt-1">
                  Em produção ou revisão
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Atendimento Técnico</span>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <LifeBuoy size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white font-display">
                  {ticketsCount}
                </h3>
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  Chamados de suporte abertos
                </p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Analytics Chart & Secondary Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Conversions Chart */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-accent" />
                <span>Desempenho de Conversões</span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Evolução semanal de conversões e cliques nas campanhas ativas.
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Cliques
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-brand-accent font-bold bg-gold-100 dark:bg-gold-500/10 px-2 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                Conversões
              </span>
            </div>
          </div>

          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCliques" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConversoes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffd700" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ffd700" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111827', 
                    borderColor: '#374151',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="cliques" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCliques)" />
                <Area type="monotone" dataKey="conversões" stroke="#ffd700" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConversoes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Dynamic Secondary Panel (Client Info for Admin / Manager info for Client) */}
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
        >
          {isAdmin ? (
            // Admin: Client Roster list preview
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Building size={18} className="text-brand-accent" />
                    <span>Contas de Clientes</span>
                  </h3>
                  <span className="text-[10px] font-bold text-brand-primary dark:text-brand-accent px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    {users.length} Ativos
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                  Acesse perfis de clientes e histórico de campanhas.
                </p>

                <div className="space-y-3">
                  {users.map((client) => (
                    <div 
                      key={client.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img 
                          src={client.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(client.name)}`} 
                          alt={client.name} 
                          className="w-8 h-8 rounded-full border border-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {client.companyName || 'Empresa'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            Contatos: {client.name}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 bg-teal-500/5 border border-teal-500/10 rounded-xl flex items-center gap-3">
                  <ShieldCheck size={20} className="text-teal-600 shrink-0" />
                  <p className="text-[11px] text-teal-800 dark:text-teal-400 leading-tight">
                    <strong>Tudo sob controle!</strong> Nenhum alerta de integridade crítico reportado nas últimas 24h.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Client: Manager support card
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <LifeBuoy size={18} className="text-brand-accent" />
                    <span>Seu Gerente de Conta</span>
                  </h3>
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </div>
                
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-850 flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80" 
                    alt="Mariana Santos"
                    className="w-12 h-12 rounded-full border-2 border-brand-accent object-cover"
                  />
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">Mariana Santos</h4>
                    <p className="text-[10px] text-slate-400">Head of Account Management</p>
                    <p className="text-[10px] text-slate-400">mariana@aparato.com.br</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Precisa de uma reunião estratégica urgente de alinhamento ou quer ajustar detalhes contratuais? Fale direto com seu gestor comercial.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setActiveTab('support')}
                  className="w-full py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-xs transition-all text-center block cursor-pointer"
                  id="contact-manager-btn"
                >
                  Abrir Chamado Especial
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Pending Items Table Area */}
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {isAdmin ? 'Solicitações Recentes de Clientes' : 'Suas Solicitações Recentes'}
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhamento de andamento das tarefas de design, redação e tráfego.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('requests')}
            className="text-xs font-bold text-brand-primary dark:text-brand-accent hover:underline flex items-center gap-1 cursor-pointer"
            id="view-all-requests-dashboard-btn"
          >
            <span>Ver tudo</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400 dark:text-slate-500">Nenhum pedido de marketing registrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Título do Pedido</th>
                  {isAdmin && <th className="py-3 px-2">Cliente</th>}
                  <th className="py-3 px-2">Tipo</th>
                  <th className="py-3 px-2">Prioridade</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {requests.slice(0, 3).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-2 font-bold text-slate-800 dark:text-white">{req.title}</td>
                    {isAdmin && <td className="py-3.5 px-2">{req.clientName}</td>}
                    <td className="py-3.5 px-2">
                      <span className="capitalize">
                        {req.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.priority === 'alta' 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400' 
                          : req.priority === 'media'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-400'
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'concluido'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : req.status === 'revisao'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400'
                          : req.status === 'em_producao'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400'
                          : req.status === 'cancelado'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
