/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { CRMClient, Campaign, ServiceRequest } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Archive, 
  Trash2, 
  Edit2, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  Instagram, 
  Linkedin, 
  Globe, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  ArrowLeft, 
  ExternalLink, 
  Eye, 
  Sparkles,
  LayoutGrid,
  List,
  Check,
  Building,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ClientsModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos'); // todos, em_dia, atrasado, pendente
  const [archiveFilter, setArchiveFilter] = useState<string>('ativos'); // ativos, arquivados, todos
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Active Client Workspace Selection
  const [selectedWorkspaceClient, setSelectedWorkspaceClient] = useState<CRMClient | null>(null);

  // Form Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<CRMClient | null>(null);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [logo, setLogo] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [contractInfo, setContractInfo] = useState('');
  const [monthlyPlan, setMonthlyPlan] = useState<number>(2500);
  const [paymentStatus, setPaymentStatus] = useState<'em_dia' | 'atrasado' | 'pendente'>('em_dia');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [clientPassword, setClientPassword] = useState('');

  // Notifications
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Scoped Workspace states
  const [workspaceCampaigns, setWorkspaceCampaigns] = useState<Campaign[]>([]);
  const [workspaceRequests, setWorkspaceRequests] = useState<ServiceRequest[]>([]);
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignBudget, setNewCampaignBudget] = useState(1500);
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestType, setNewRequestType] = useState('design_grafico');

  // Load clients list on mount
  useEffect(() => {
    loadClientsData();

    const handleSync = () => {
      loadClientsData();
    };
    window.addEventListener('storage-update', handleSync);
    return () => {
      window.removeEventListener('storage-update', handleSync);
    };
  }, []);

  const loadClientsData = () => {
    const data = StorageService.getClients();
    setClients(data);
  };

  // Scoped data loading when client workspace is opened
  useEffect(() => {
    const loadWorkspaceData = () => {
      if (selectedWorkspaceClient) {
        const allCampaigns = StorageService.getCampaigns();
        const filteredCamps = allCampaigns.filter(c => c.clientId === selectedWorkspaceClient.id);
        setWorkspaceCampaigns(filteredCamps);

        const allRequests = StorageService.getRequests();
        const filteredReqs = allRequests.filter(r => r.clientId === selectedWorkspaceClient.id);
        setWorkspaceRequests(filteredReqs);
      }
    };

    loadWorkspaceData();

    window.addEventListener('storage-update', loadWorkspaceData);
    return () => {
      window.removeEventListener('storage-update', loadWorkspaceData);
    };
  }, [selectedWorkspaceClient]);

  // Create Client Submit
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !email) {
      showError('Preencha os campos obrigatórios.');
      return;
    }

    const newId = `u-client-${Date.now()}`;
    const newClient: CRMClient = {
      id: newId,
      companyName,
      logo: logo || `https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=150&h=150&q=80`,
      contactPerson,
      email,
      phone,
      instagram,
      linkedin,
      website,
      contractInfo: contractInfo || 'Contrato Padrão Digital',
      monthlyPlan: Number(monthlyPlan) || 0,
      paymentStatus,
      startDate: startDate || new Date().toISOString().split('T')[0],
      notes,
      isArchived: false,
      createdAt: new Date().toISOString()
    };

    StorageService.saveClient(newClient, clientPassword || undefined);
    showSuccess(`Cliente cadastrado com sucesso! A senha padrão é "${clientPassword || 'cliente123'}".`);
    setIsCreateModalOpen(false);
    resetForm();
    loadClientsData();
  };

  // Edit Client Trigger
  const openEditModal = (client: CRMClient) => {
    setClientToEdit(client);
    setCompanyName(client.companyName);
    setLogo(client.logo);
    setContactPerson(client.contactPerson);
    setEmail(client.email);
    setPhone(client.phone);
    setInstagram(client.instagram || '');
    setLinkedin(client.linkedin || '');
    setWebsite(client.website || '');
    setContractInfo(client.contractInfo);
    setMonthlyPlan(client.monthlyPlan);
    setPaymentStatus(client.paymentStatus);
    setStartDate(client.startDate);
    setNotes(client.notes);
    setIsEditModalOpen(true);
  };

  // Save Edit Client
  const handleEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientToEdit) return;

    const updatedClient: CRMClient = {
      ...clientToEdit,
      companyName,
      logo,
      contactPerson,
      email,
      phone,
      instagram,
      linkedin,
      website,
      contractInfo,
      monthlyPlan: Number(monthlyPlan),
      paymentStatus,
      startDate,
      notes,
    };

    StorageService.saveClient(updatedClient);
    showSuccess('Perfil do cliente atualizado!');
    setIsEditModalOpen(false);
    resetForm();
    loadClientsData();

    // If edited is current workspace, update active workspace object too
    if (selectedWorkspaceClient && selectedWorkspaceClient.id === updatedClient.id) {
      setSelectedWorkspaceClient(updatedClient);
    }
  };

  // Archive Client Toggle
  const handleToggleArchive = (id: string, isArchived: boolean) => {
    StorageService.archiveClient(id, !isArchived);
    showSuccess(isArchived ? 'Cliente reativado com sucesso!' : 'Cliente arquivado temporariamente.');
    loadClientsData();
    if (selectedWorkspaceClient && selectedWorkspaceClient.id === id) {
      setSelectedWorkspaceClient(prev => prev ? { ...prev, isArchived: !isArchived } : null);
    }
  };

  // Delete Client Action
  const handleDeleteClient = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteClient = () => {
    if (deleteConfirmId) {
      StorageService.deleteClient(deleteConfirmId);
      showSuccess('Cliente removido do banco de dados.');
      loadClientsData();
      if (selectedWorkspaceClient && selectedWorkspaceClient.id === deleteConfirmId) {
        setSelectedWorkspaceClient(null);
      }
      setDeleteConfirmId(null);
    }
  };

  // Add Campaign inside Client Workspace
  const handleAddWorkspaceCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceClient || !newCampaignTitle) return;

    const newCampaign: Campaign = {
      id: `c-${Date.now()}`,
      title: newCampaignTitle,
      description: `Campanha criada no workspace corporativo de ${selectedWorkspaceClient.companyName}.`,
      clientId: selectedWorkspaceClient.id,
      clientName: selectedWorkspaceClient.companyName,
      status: 'planejamento',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: Number(newCampaignBudget) || 1000,
      platforms: ['Meta Ads', 'Google Ads'],
      metrics: {
        reach: 0,
        clicks: 0,
        conversions: 0,
        spend: 0
      }
    };

    StorageService.saveCampaign(newCampaign);
    setNewCampaignTitle('');
    // refresh campaigns
    const allCampaigns = StorageService.getCampaigns();
    setWorkspaceCampaigns(allCampaigns.filter(c => c.clientId === selectedWorkspaceClient.id));
    showSuccess('Nova campanha adicionada ao workspace.');
  };

  // Add Request inside Client Workspace
  const handleAddWorkspaceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceClient || !newRequestTitle) return;

    const newReq: ServiceRequest = {
      id: `r-${Date.now()}`,
      title: newRequestTitle,
      description: 'Solicitação criada pelo gestor através do Workspace CRM.',
      type: newRequestType as any,
      clientId: selectedWorkspaceClient.id,
      clientName: selectedWorkspaceClient.companyName,
      status: 'pendente',
      priority: 'media',
      createdAt: new Date().toISOString()
    };

    StorageService.saveRequest(newReq);
    setNewRequestTitle('');
    // refresh requests
    const allRequests = StorageService.getRequests();
    setWorkspaceRequests(allRequests.filter(r => r.clientId === selectedWorkspaceClient.id));
    showSuccess('Solicitação de serviço registrada.');
  };

  // Form Reset Helper
  const resetForm = () => {
    setClientToEdit(null);
    setCompanyName('');
    setLogo('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setInstagram('');
    setLinkedin('');
    setWebsite('');
    setContractInfo('');
    setMonthlyPlan(2500);
    setPaymentStatus('em_dia');
    setStartDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setClientPassword('');
  };

  // Toast Helpers
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3500);
  };
  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 3500);
  };

  // Filter & Search Logic
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'todos' || 
      client.paymentStatus === statusFilter;

    const matchesArchive = 
      archiveFilter === 'all' ||
      (archiveFilter === 'ativos' && !client.isArchived) ||
      (archiveFilter === 'arquivados' && client.isArchived);

    return matchesSearch && matchesStatus && matchesArchive;
  });

  const clientToDelete = clients.find(c => c.id === deleteConfirmId);

  // Calculate stats for header bar
  const totalInvoiced = clients.filter(c => !c.isArchived).reduce((acc, curr) => acc + curr.monthlyPlan, 0);
  const upToDateCount = clients.filter(c => !c.isArchived && c.paymentStatus === 'em_dia').length;
  const delayedCount = clients.filter(c => !c.isArchived && c.paymentStatus === 'atrasado').length;
  const pendingCount = clients.filter(c => !c.isArchived && c.paymentStatus === 'pendente').length;

  return (
    <div className="space-y-6">
      {/* Toast notifications feedback */}
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

      {/* Main Container Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">
            CRM de Gestão de Clientes
          </h1>
          <p className="text-slate-500 dark:text-teal-400 text-xs">
            {selectedWorkspaceClient 
              ? `Workspace ativo de: ${selectedWorkspaceClient.companyName}` 
              : 'Gerencie o faturamento, contratos, planos, contatos e simule o workspace exclusivo de cada parceiro.'
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedWorkspaceClient ? (
            <button
              onClick={() => setSelectedWorkspaceClient(null)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-[#114455] text-[#ffd700] border border-[#ffd700]/30 hover:bg-[#114455]/80 transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Voltar ao Painel CRM</span>
            </button>
          ) : (
            currentUser?.role === 'admin' && (
              <button
                onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#ffd700] text-[#114455] hover:bg-[#ffed4a] transition-all shadow-lg cursor-pointer"
              >
                <Plus size={16} />
                <span>Novo Cliente Comercial</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* WORKSPACE DETAILED VIEW (EACH CLIENT WORKSPACE) */}
      {selectedWorkspaceClient ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-left"
        >
          {/* Workspace Hero Profile */}
          <div className="bg-gradient-to-br from-[#08222a] to-[#114455] rounded-3xl p-6 sm:p-8 border border-teal-900/40 text-white relative overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-brand-accent/5 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-[#ffd700]/30 p-1 shrink-0 overflow-hidden shadow-lg">
                  <img 
                    src={selectedWorkspaceClient.logo} 
                    alt={selectedWorkspaceClient.companyName}
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                      {selectedWorkspaceClient.companyName}
                    </h2>
                    {selectedWorkspaceClient.isArchived ? (
                      <span className="px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-slate-500/30">
                        Arquivado
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                        Parceiro Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-teal-300 flex items-center gap-2">
                    <User size={12} className="text-[#ffd700]" /> 
                    <span>Contato Principal: <strong>{selectedWorkspaceClient.contactPerson}</strong></span>
                  </p>
                  <p className="text-[11px] text-slate-300 flex items-center gap-2">
                    <Calendar size={12} />
                    <span>Início da Parceria: {new Date(selectedWorkspaceClient.startDate).toLocaleDateString('pt-BR')}</span>
                  </p>
                </div>
              </div>

              {/* CRM Key Indicators */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="bg-[#08222a]/60 px-4 py-3 rounded-2xl border border-teal-900/30 min-w-[120px]">
                  <span className="text-[10px] uppercase font-bold text-teal-400 block tracking-widest">Plano Mensal</span>
                  <span className="text-lg font-bold font-mono text-[#ffd700]">
                    {selectedWorkspaceClient.monthlyPlan.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="bg-[#08222a]/60 px-4 py-3 rounded-2xl border border-teal-900/30 min-w-[120px]">
                  <span className="text-[10px] uppercase font-bold text-teal-400 block tracking-widest">Status Financeiro</span>
                  <div className="mt-1">
                    {selectedWorkspaceClient.paymentStatus === 'em_dia' && (
                      <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20">
                        ● EM DIA
                      </span>
                    )}
                    {selectedWorkspaceClient.paymentStatus === 'pendente' && (
                      <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-extrabold border border-amber-500/20">
                        ● PENDENTE
                      </span>
                    )}
                    {selectedWorkspaceClient.paymentStatus === 'atrasado' && (
                      <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-[10px] font-extrabold border border-rose-500/20">
                        ● EM ATRASO
                      </span>
                    )}
                  </div>
                </div>

                {/* Simulated workspace link */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      alert(`[Simulação] Você está sendo redirecionado para a interface de cliente de ${selectedWorkspaceClient.contactPerson}. Os dados exibidos no painel agora serão focados na empresa ${selectedWorkspaceClient.companyName}.`);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#ffd700] text-[#114455] hover:bg-[#ffed4a] text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>Simular Visão Cliente</span>
                  </button>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openEditModal(selectedWorkspaceClient)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 text-xs flex items-center justify-center cursor-pointer"
                      title="Editar dados cadastrais"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(selectedWorkspaceClient.id, selectedWorkspaceClient.isArchived)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 text-xs flex items-center justify-center cursor-pointer"
                      title={selectedWorkspaceClient.isArchived ? "Reativar Cliente" : "Arquivar Cliente"}
                    >
                      <Archive size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Body Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sidebar details column */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Contatos & Canais Sociais */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-[#114455]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <User size={15} className="text-[#ffd700]" />
                  Canais e Dados de Contato
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                      <Mail size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">E-mail Corporativo</span>
                      <a href={`mailto:${selectedWorkspaceClient.email}`} className="text-slate-700 dark:text-slate-200 hover:underline font-medium truncate block">
                        {selectedWorkspaceClient.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                      <Phone size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Telefone / WhatsApp</span>
                      <a href={`https://wa.me/${selectedWorkspaceClient.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-slate-700 dark:text-slate-200 hover:underline font-medium flex items-center gap-1">
                        {selectedWorkspaceClient.phone || 'Não informado'}
                        <ExternalLink size={10} className="text-slate-400" />
                      </a>
                    </div>
                  </div>

                  {selectedWorkspaceClient.website && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                        <Globe size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Website Oficial</span>
                        <a href={selectedWorkspaceClient.website} target="_blank" rel="noreferrer" className="text-slate-700 dark:text-slate-200 hover:underline font-medium truncate block">
                          {selectedWorkspaceClient.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedWorkspaceClient.instagram && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-rose-400 bg-rose-500/5">
                        <Instagram size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Instagram</span>
                        <a href={selectedWorkspaceClient.instagram} target="_blank" rel="noreferrer" className="text-slate-700 dark:text-slate-200 hover:underline font-medium truncate block">
                          Instagram @{selectedWorkspaceClient.companyName.toLowerCase().replace(/\s+/g, '')}
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedWorkspaceClient.linkedin && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-blue-400 bg-blue-500/5">
                        <Linkedin size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">LinkedIn</span>
                        <a href={selectedWorkspaceClient.linkedin} target="_blank" rel="noreferrer" className="text-slate-700 dark:text-slate-200 hover:underline font-medium truncate block">
                          Perfil Corporativo
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Contrato */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-[#114455]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <FileText size={15} className="text-[#ffd700]" />
                  Contrato & Vigência
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Objeto do Contrato</span>
                    <p className="text-slate-700 dark:text-slate-200 font-bold leading-relaxed">
                      {selectedWorkspaceClient.contractInfo}
                    </p>
                  </div>

                  {selectedWorkspaceClient.notes && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Observações do Gestor</span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11.5px] italic">
                        "{selectedWorkspaceClient.notes}"
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-400">
                    <span>Plano Ativo</span>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">Mensalidade SaaS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content modules tabs column (Campanhas e Solicitações) */}
            <div className="space-y-6 lg:col-span-2">
              
              {/* Campanhas Ativas do Cliente */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-[#114455]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Briefcase size={15} className="text-[#ffd700]" />
                    Campanhas de Marketing Scoped
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#114455]/10 dark:bg-slate-800 text-[#114455] dark:text-teal-300 text-[10px] font-bold">
                    {workspaceCampaigns.length} cadastradas
                  </span>
                </div>

                {/* Mini create campaign inside workspace */}
                <form onSubmit={handleAddWorkspaceCampaign} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                  <input
                    type="text"
                    required
                    placeholder="Título da Nova Campanha"
                    value={newCampaignTitle}
                    onChange={(e) => setNewCampaignTitle(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:text-white dark:border-slate-800 sm:col-span-2"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Verba R$"
                      value={newCampaignBudget}
                      onChange={(e) => setNewCampaignBudget(Number(e.target.value))}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:text-white dark:border-slate-800 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-light shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>

                {/* Scoped Campaigns List */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {workspaceCampaigns.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">Nenhuma campanha cadastrada para este cliente ainda.</p>
                  ) : (
                    workspaceCampaigns.map(camp => (
                      <div 
                        key={camp.id} 
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 hover:border-brand-accent/20 transition-all flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{camp.title}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="font-mono">Verba: R$ {camp.budget.toLocaleString('pt-BR')}</span>
                            <span>•</span>
                            <span className="capitalize text-teal-500">Status: {camp.status}</span>
                          </div>
                        </div>

                        <div>
                          {camp.status === 'ativo' ? (
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 rounded">Em Veiculação</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">{camp.status}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Solicitações de Serviço Recorrentes */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-[#114455]/20 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={15} className="text-[#ffd700]" />
                    Solicitações no Backlog
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#114455]/10 dark:bg-slate-800 text-[#114455] dark:text-teal-300 text-[10px] font-bold">
                    {workspaceRequests.length} abertas
                  </span>
                </div>

                {/* Add Request fast form */}
                <form onSubmit={handleAddWorkspaceRequest} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                  <input
                    type="text"
                    required
                    placeholder="Solicitar Criativo, Ajuste de Tráfego..."
                    value={newRequestTitle}
                    onChange={(e) => setNewRequestTitle(e.target.value)}
                    className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:text-white dark:border-slate-800 sm:col-span-2"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newRequestType}
                      onChange={(e) => setNewRequestType(e.target.value)}
                      className="w-full text-xs px-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:text-white dark:border-slate-800"
                    >
                      <option value="social_media">Social Media</option>
                      <option value="design_grafico">Design</option>
                      <option value="trafego_pago">Tráfego</option>
                      <option value="branding">Branding</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-light shrink-0 cursor-pointer"
                    >
                      Criar
                    </button>
                  </div>
                </form>

                {/* List requests */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {workspaceRequests.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">Nenhum pedido de design ou tráfego pendente.</p>
                  ) : (
                    workspaceRequests.map(req => (
                      <div 
                        key={req.id} 
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 hover:border-brand-accent/20 transition-all flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{req.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="capitalize bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-medium">{req.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-brand-accent font-semibold">{req.priority.toUpperCase()}</span>
                          </div>
                        </div>

                        <div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                            req.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-600' :
                            req.status === 'em_producao' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {req.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* STANDARD CRM LIST VIEW (GRID & TABLES) */
        <div className="space-y-6">
          {/* Quick KPI stats dashboard banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[#114455]/40 border border-teal-900/30 rounded-2xl backdrop-blur-sm text-left">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">Receita Mensal Recorrente</span>
              <h3 className="text-xl md:text-2xl font-bold mt-1 text-white font-mono">
                {totalInvoiced.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </h3>
              <p className="text-[9px] text-slate-400 mt-1">Soma de planos ativos</p>
            </div>

            <div className="p-4 bg-[#114455]/40 border border-teal-900/30 rounded-2xl text-left">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Pagamentos em Dia</span>
              <h3 className="text-xl md:text-2xl font-bold mt-1 text-white font-mono">{upToDateCount}</h3>
              <p className="text-[9px] text-emerald-400/80 mt-1">Faturas quitadas</p>
            </div>

            <div className="p-4 bg-[#114455]/40 border border-teal-900/30 rounded-2xl text-left">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Faturas Pendentes</span>
              <h3 className="text-xl md:text-2xl font-bold mt-1 text-white font-mono">{pendingCount}</h3>
              <p className="text-[9px] text-amber-400/80 mt-1">Aguardando vencimento</p>
            </div>

            <div className="p-4 bg-[#114455]/40 border border-teal-900/30 rounded-2xl text-left">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block">Inadimplência (Atraso)</span>
              <h3 className="text-xl md:text-2xl font-bold mt-1 text-white font-mono">{delayedCount}</h3>
              <p className="text-[9px] text-rose-400/80 mt-1">Requer cobrança ativa</p>
            </div>
          </div>

          {/* CRM Search and Filters Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por empresa, contato, e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Payment Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <DollarSign size={13} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-transparent dark:text-white border-none focus:outline-none cursor-pointer font-medium"
                >
                  <option value="todos">Faturamento: Todos</option>
                  <option value="em_dia">Apenas Em Dia</option>
                  <option value="pendente">Apenas Pendentes</option>
                  <option value="atrasado">Apenas Atrasados</option>
                </select>
              </div>

              {/* Archive state Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <Archive size={13} className="text-slate-400" />
                <select
                  value={archiveFilter}
                  onChange={(e) => setArchiveFilter(e.target.value)}
                  className="text-xs bg-transparent dark:text-white border-none focus:outline-none cursor-pointer font-medium"
                >
                  <option value="ativos">Clientes Ativos</option>
                  <option value="arquivados">Clientes Arquivados</option>
                  <option value="all">Ver Todos os Bancos</option>
                </select>
              </div>

              {/* Layout view toggle buttons */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-1 flex bg-slate-50 dark:bg-slate-850">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-[#114455] text-white dark:bg-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Visualizar em Grid"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-[#114455] text-white dark:bg-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Visualizar em Tabela"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* NO CLIENTS FALLBACK */}
          {filteredClients.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-[#114455]/10 rounded-full flex items-center justify-center mx-auto text-[#ffd700]">
                <HelpCircle size={30} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Nenhum cliente comercial encontrado</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tente alterar seus parâmetros de filtro de faturamento e busca acima ou cadastre um novo parceiro de marketing.
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            
            /* CARDS LAYOUT */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {filteredClients.map(client => (
                <motion.div
                  key={client.id}
                  layout
                  className="bg-[#08222a]/50 dark:bg-[#08222a]/40 border border-teal-900/30 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
                >
                  <div className="p-5 space-y-4">
                    {/* Top card bar with logo and dropdown status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-[#ffd700]/10 p-0.5 shrink-0 overflow-hidden shadow-sm">
                          <img 
                            src={client.logo} 
                            alt={client.companyName}
                            className="w-full h-full object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate font-display">
                            {client.companyName}
                          </h3>
                          <p className="text-[10px] text-teal-400 font-medium truncate flex items-center gap-1">
                            <User size={10} />
                            {client.contactPerson}
                          </p>
                        </div>
                      </div>

                      {/* Financial status Badge */}
                      <div>
                        {client.paymentStatus === 'em_dia' && (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                            Em Dia
                          </span>
                        )}
                        {client.paymentStatus === 'pendente' && (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                            Pendente
                          </span>
                        )}
                        {client.paymentStatus === 'atrasado' && (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-rose-500/10 text-rose-400 rounded-md border border-rose-500/20">
                            Em Atraso
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta quick list */}
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">Plano Mensal:</span>
                        <span className="font-bold text-white font-mono">
                          {client.monthlyPlan.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">E-mail:</span>
                        <span className="truncate max-w-[180px] font-medium text-teal-300">{client.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">Telefone:</span>
                        <span className="font-medium text-slate-200">{client.phone}</span>
                      </div>
                    </div>

                    {/* Social links block */}
                    <div className="flex items-center gap-2 pt-2 border-t border-teal-900/10">
                      {client.instagram && (
                        <a href={client.instagram} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors">
                          <Instagram size={12} />
                        </a>
                      )}
                      {client.linkedin && (
                        <a href={client.linkedin} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors">
                          <Linkedin size={12} />
                        </a>
                      )}
                      {client.website && (
                        <a href={client.website} target="_blank" rel="noreferrer" className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-slate-400 hover:text-teal-400 transition-colors">
                          <Globe size={12} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Bottom operational tools bar */}
                  <div className="bg-[#114455]/20 p-3 border-t border-teal-900/10 flex items-center justify-between">
                    {/* Workspace Direct Access Link */}
                    <button
                      onClick={() => setSelectedWorkspaceClient(client)}
                      className="text-[11px] font-bold text-[#ffd700] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Briefcase size={12} />
                      <span>Abrir Workspace</span>
                    </button>

                    {/* Manage actions */}
                    {currentUser?.role === 'admin' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Editar Perfil"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleToggleArchive(client.id, client.isArchived)}
                          className={`p-1.5 hover:bg-white/10 rounded transition-colors cursor-pointer ${client.isArchived ? 'text-[#ffd700]' : 'text-slate-400 hover:text-slate-100'}`}
                          title={client.isArchived ? "Reativar Cliente" : "Arquivar Cliente"}
                        >
                          <Archive size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-1.5 hover:bg-rose-500/10 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Excluir Permanentemente"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            
            /* TABLES LIST VIEW */
            <div className="bg-[#08222a]/50 rounded-2xl border border-teal-900/30 overflow-hidden text-left">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-teal-500 border-b border-teal-900/20 bg-[#114455]/20">
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">Nome da Empresa / Contato</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">Status Faturamento</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">Mensalidade</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider">E-mail / Telefone</th>
                      <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/10">
                    {filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-[#114455]/10 transition-colors text-xs text-slate-200">
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-white p-0.5 shrink-0 overflow-hidden border border-[#ffd700]/10">
                            <img src={client.logo} alt={client.companyName} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="font-bold text-white leading-tight">{client.companyName}</p>
                            <p className="text-[10px] text-teal-400 mt-0.5 font-medium">{client.contactPerson}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {client.paymentStatus === 'em_dia' && (
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">Em Dia</span>
                          )}
                          {client.paymentStatus === 'pendente' && (
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">Pendente</span>
                          )}
                          {client.paymentStatus === 'atrasado' && (
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-rose-500/10 text-rose-400 rounded-md border border-rose-500/20">Em Atraso</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-white">
                          {client.monthlyPlan.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-6 py-4 space-y-0.5">
                          <p className="font-semibold text-slate-300">{client.email}</p>
                          <p className="text-[10px] text-slate-400">{client.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedWorkspaceClient(client)}
                              className="px-2.5 py-1.5 rounded bg-[#ffd700]/10 hover:bg-[#ffd700]/20 text-[#ffd700] text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Workspace
                            </button>
                            {currentUser?.role === 'admin' && (
                              <div className="flex gap-1 border-l border-teal-900/20 pl-2">
                                <button onClick={() => openEditModal(client)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Editar"><Edit2 size={12} /></button>
                                <button onClick={() => handleToggleArchive(client.id, client.isArchived)} className={`p-1 hover:bg-white/10 rounded ${client.isArchived ? 'text-[#ffd700]' : 'text-slate-400'}`} title="Arquivar"><Archive size={12} /></button>
                                <button onClick={() => handleDeleteClient(client.id)} className="p-1 hover:bg-rose-500/10 rounded text-slate-400 hover:text-rose-400" title="Excluir"><Trash2 size={12} /></button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW CLIENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#08222a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative text-left"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-primary via-[#ffd700] to-teal-400" />
            
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 dark:text-brand-accent font-display">
                  Cadastrar Novo Cliente Comercial
                </h2>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Nome da Empresa */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Nome da Empresa *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Solaris Tech"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Pessoa de Contato */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Pessoa de Contato *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* E-mail Corporativo */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">E-mail Corporativo *</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: contato@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Telefone celular */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">WhatsApp / Telefone</label>
                    <input
                      type="text"
                      placeholder="Ex: (11) 98888-7777"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Senha de Acesso */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Senha de Acesso do Cliente</label>
                    <input
                      type="text"
                      placeholder="Deixe em branco para usar a padrão 'cliente123'"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Url de Logo */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">URL da Imagem Logotipo</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Plano Mensal */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Valor do Plano Mensal (R$)</label>
                    <input
                      type="number"
                      placeholder="2500"
                      value={monthlyPlan}
                      onChange={(e) => setMonthlyPlan(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white font-mono"
                    />
                  </div>

                  {/* Data de Inicio */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Data de Início de Contrato</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Status Pagamento */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Status Financeiro Inicial</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    >
                      <option value="em_dia">Em Dia (Adimplente)</option>
                      <option value="pendente">Aguardando Fatura (Pendente)</option>
                      <option value="atrasado">Em Atraso (Inadimplente)</option>
                    </select>
                  </div>

                  {/* Links de Redes sociais */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Instagram Link</label>
                    <input
                      type="text"
                      placeholder="https://instagram.com/perfil"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Website / LinkedIn Link</label>
                    <input
                      type="text"
                      placeholder="https://site.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                {/* Objeto do Contrato */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block uppercase">Especificação do Contrato</label>
                  <input
                    type="text"
                    placeholder="Ex: Contrato Anual recorrente de Gestão de Meta Ads e Design"
                    value={contractInfo}
                    onChange={(e) => setContractInfo(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                  />
                </div>

                {/* Notas / Observacoes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block uppercase">Observações Internas</label>
                  <textarea
                    rows={2}
                    placeholder="Meta do cliente, preferências de paleta de cor, cronogramas específicos..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-750 text-xs font-bold transition-all border border-slate-200/50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#114455] text-white hover:bg-[#1b5c72] dark:bg-brand-accent dark:hover:bg-brand-accent-hover dark:text-[#114455] font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Salvar Novo Cliente
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {isEditModalOpen && clientToEdit && (
        <div className="fixed inset-0 z-50 bg-[#08222a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative text-left"
          >
            <div className="h-1.5 w-full bg-[#ffd700]" />
            
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 dark:text-brand-accent font-display">
                  Editar Cadastro Comercial - {clientToEdit.companyName}
                </h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditClient} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Nome da Empresa */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Nome da Empresa *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Pessoa de Contato */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Pessoa de Contato *</label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* E-mail Corporativo */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">E-mail Corporativo *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Telefone celular */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">WhatsApp / Telefone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Url de Logo */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">URL da Imagem Logotipo</label>
                    <input
                      type="text"
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Plano Mensal */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Valor do Plano Mensal (R$)</label>
                    <input
                      type="number"
                      value={monthlyPlan}
                      onChange={(e) => setMonthlyPlan(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white font-mono"
                    />
                  </div>

                  {/* Data de Inicio */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Data de Início de Contrato</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Status Pagamento */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Status Financeiro</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    >
                      <option value="em_dia">Em Dia (Adimplente)</option>
                      <option value="pendente">Aguardando Fatura (Pendente)</option>
                      <option value="atrasado">Em Atraso (Inadimplente)</option>
                    </select>
                  </div>

                  {/* Links de Redes sociais */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Instagram Link</label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 block uppercase">Website Link</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                {/* Objeto do Contrato */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block uppercase">Especificação do Contrato</label>
                  <input
                    type="text"
                    value={contractInfo}
                    onChange={(e) => setContractInfo(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                  />
                </div>

                {/* Notas / Observacoes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block uppercase">Observações Internas</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-750 text-xs font-bold transition-all border border-slate-200/50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#114455] text-white hover:bg-[#1b5c72] dark:bg-brand-accent dark:hover:bg-brand-accent-hover dark:text-[#114455] font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deleteConfirmId && clientToDelete && (
        <div className="fixed inset-0 z-50 bg-[#08222a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl border border-rose-500/20 overflow-hidden relative text-left"
          >
            <div className="h-1.5 w-full bg-rose-500" />
            
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-3 text-rose-500">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <h2 className="text-lg font-bold font-display">
                  Confirmar Exclusão
                </h2>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tem certeza absoluta que deseja remover o cliente <strong className="text-rose-500 dark:text-rose-400">{clientToDelete.companyName}</strong> permanentemente do Aparato OS?
                </p>
                <p className="text-[11px] bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 p-3 rounded-xl text-rose-600 dark:text-rose-400 leading-relaxed font-medium">
                  ⚠️ Esta ação excluirá de forma irreversível suas credenciais de acesso, faturas associadas, campanhas e todo o histórico deste cliente.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-750 text-xs font-bold transition-all border border-slate-200/50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteClient}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Sim, Excluir Permanente
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
