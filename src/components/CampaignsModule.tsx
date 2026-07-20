/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { Campaign, CampaignStatus, User } from '../types';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  PieChart, 
  X, 
  Briefcase,
  Share2,
  CheckCircle,
  Eye,
  Check,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CampaignsModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  // Confirmation states
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('planejamento');
  const [platformsInput, setPlatformsInput] = useState('');
  
  // Metric update states
  const [metricsReach, setMetricsReach] = useState('');
  const [metricsClicks, setMetricsClicks] = useState('');
  const [metricsConversions, setMetricsConversions] = useState('');
  const [metricsSpend, setMetricsSpend] = useState('');

  const loadCampaigns = () => {
    const allCampaigns = StorageService.getCampaigns();
    if (currentUser?.role === 'admin') {
      setCampaigns(allCampaigns);
      const allUsers = StorageService.getUsers();
      setClients(allUsers.filter(u => u.role === 'client'));
    } else if (currentUser) {
      setCampaigns(allCampaigns.filter(c => c.clientId === currentUser.id));
    }
  };

  useEffect(() => {
    loadCampaigns();

    const handleSync = () => {
      loadCampaigns();
    };
    window.addEventListener('storage-update', handleSync);
    return () => {
      window.removeEventListener('storage-update', handleSync);
    };
  }, [currentUser]);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedClientId('');
    setBudget('');
    setStartDate('');
    setEndDate('');
    setStatus('planejamento');
    setPlatformsInput('');
    setMetricsReach('');
    setMetricsClicks('');
    setMetricsConversions('');
    setMetricsSpend('');
    setEditingCampaign(null);
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate || !budget) return;

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

    const newCampaign: Campaign = {
      id: editingCampaign ? editingCampaign.id : `c-${Date.now()}`,
      title,
      description,
      clientId: finalClientId,
      clientName: finalClientName,
      status,
      startDate,
      endDate,
      budget: parseFloat(budget),
      platforms: platformsInput.split(',').map(p => p.trim()).filter(Boolean),
      metrics: {
        reach: metricsReach ? parseInt(metricsReach) : 0,
        clicks: metricsClicks ? parseInt(metricsClicks) : 0,
        conversions: metricsConversions ? parseInt(metricsConversions) : 0,
        spend: metricsSpend ? parseFloat(metricsSpend) : 0,
      }
    };

    StorageService.saveCampaign(newCampaign);
    
    // Notification logic
    if (isAdmin) {
      StorageService.addNotification(
        finalClientId,
        editingCampaign ? 'Campanha Atualizada' : 'Nova Campanha Criada',
        `Sua campanha "${title}" foi ${editingCampaign ? 'atualizada' : 'planejada'} pelo time Aparato.`,
        'campaign'
      );
    } else {
      StorageService.addNotification(
        'u-admin-1',
        'Campanha Solicitada',
        `O cliente "${finalClientName}" criou o rascunho de campanha "${title}".`,
        'campaign'
      );
    }

    resetForm();
    setShowAddModal(false);
    loadCampaigns();
  };

  const handleEditClick = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setTitle(campaign.title);
    setDescription(campaign.description);
    setSelectedClientId(campaign.clientId);
    setBudget(campaign.budget.toString());
    setStartDate(campaign.startDate);
    setEndDate(campaign.endDate);
    setStatus(campaign.status);
    setPlatformsInput(campaign.platforms.join(', '));
    setMetricsReach(campaign.metrics?.reach.toString() || '0');
    setMetricsClicks(campaign.metrics?.clicks.toString() || '0');
    setMetricsConversions(campaign.metrics?.conversions.toString() || '0');
    setMetricsSpend(campaign.metrics?.spend.toString() || '0');
    setShowAddModal(true);
  };

  const handleDeleteCampaign = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const confirmDeleteCampaign = () => {
    if (deleteConfirmId) {
      StorageService.deleteCampaign(deleteConfirmId);
      loadCampaigns();
      setDeleteConfirmId(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white font-display">
            Acompanhamento de Campanhas
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe orçamentos, mídias integradas, CTR e conversões geradas.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="px-4 py-2.5 rounded-xl bg-brand-primary dark:bg-brand-accent dark:hover:bg-brand-accent-hover dark:text-brand-primary text-white hover:bg-brand-primary-light font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          id="create-new-campaign-btn"
        >
          <Plus size={16} />
          <span>Nova Campanha</span>
        </button>
      </div>

      {/* Grid List */}
      {campaigns.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <Megaphone className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={40} />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma campanha cadastrada</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Abra uma nova campanha para monitorar cliques, conversões e faturamento em tempo real.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            // Conversions ratios
            const clicks = campaign.metrics?.clicks || 0;
            const conversions = campaign.metrics?.conversions || 0;
            const spend = campaign.metrics?.spend || 0;
            const conversionRate = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : '0';
            const costPerAcquisition = conversions > 0 ? (spend / conversions).toFixed(2) : '0.00';

            return (
              <motion.div
                key={campaign.id}
                layout
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Status & Menu */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      campaign.status === 'ativo'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : campaign.status === 'concluido'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400'
                        : campaign.status === 'pausado'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        campaign.status === 'ativo' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                      {campaign.status}
                    </span>

                    {/* Actions if Admin */}
                    {isAdmin && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditClick(campaign)}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Editar"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id, campaign.title)}
                          className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title & Client details */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white leading-snug">
                      {campaign.title}
                    </h3>
                    {isAdmin && (
                      <p className="text-[10px] text-brand-accent font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Briefcase size={10} /> {campaign.clientName}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {campaign.description}
                    </p>
                  </div>

                  {/* Platforms */}
                  {campaign.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {campaign.platforms.map((plat) => (
                        <span key={plat} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-750">
                          {plat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Finance Progress Bar */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Verba Executada</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatCurrency(spend)} <span className="text-slate-400">/ {formatCurrency(campaign.budget)}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-slate-200/20">
                      <div 
                        className="h-full bg-brand-accent" 
                        style={{ width: `${Math.min((spend / campaign.budget) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Active Performance Metrics */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Cliques</span>
                      <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                        {campaign.metrics?.clicks.toLocaleString('pt-BR') || '0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Conversões</span>
                      <span className="text-sm font-extrabold text-brand-accent">
                        {campaign.metrics?.conversions.toLocaleString('pt-BR') || '0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Taxa de Conversão</span>
                      <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        {conversionRate}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">CPA Médio</span>
                      <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        R$ {costPerAcquisition}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date span info */}
                <div className="flex items-center gap-1.5 mt-4 pt-3 text-[10px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800">
                  <Calendar size={12} />
                  <span>
                    {new Date(campaign.startDate).toLocaleDateString('pt-BR')} até {new Date(campaign.endDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden relative z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-brand-primary text-white">
                <h3 className="text-sm font-bold font-display flex items-center gap-2">
                  <Megaphone size={16} className="text-brand-accent" />
                  <span>{editingCampaign ? 'Editar Campanha de Marketing' : 'Criar Nova Campanha'}</span>
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-200 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateCampaign} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Título da Campanha</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Ofertas de Outono - Estética Facial"
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Client Select (if Admin) */}
                  {isAdmin && (
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-500 block">Selecione o Cliente</label>
                      <select
                        required
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                      >
                        <option value="">-- Selecione um Cliente --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.companyName || c.name} ({c.name})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Description */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Descrição</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Foco da campanha, objetivos de tráfego, criativos..."
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Budget */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Orçamento Total (R$)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="4500.00"
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Status Atual</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CampaignStatus)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    >
                      <option value="planejamento">Planejamento</option>
                      <option value="ativo">Ativo</option>
                      <option value="pausado">Pausado</option>
                      <option value="concluido">Concluido</option>
                    </select>
                  </div>

                  {/* Platforms */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Plataformas / Mídias (separadas por vírgula)</label>
                    <input
                      type="text"
                      value={platformsInput}
                      onChange={(e) => setPlatformsInput(e.target.value)}
                      placeholder="Meta Ads, Google Ads, TikTok Ads, Instagram Organic"
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  {/* Dates */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Data de Início</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 block">Data de Término</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    />
                  </div>
                </div>

                {/* Metrics adjustment area */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3.5 border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                    <TrendingUp size={14} className="text-brand-accent" />
                    <span>Métricas de Performance Real</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Alcance (Pessoas)</label>
                      <input
                        type="number"
                        value={metricsReach}
                        onChange={(e) => setMetricsReach(e.target.value)}
                        placeholder="Ex: 12000"
                        className="w-full text-[11px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Cliques Únicos</label>
                      <input
                        type="number"
                        value={metricsClicks}
                        onChange={(e) => setMetricsClicks(e.target.value)}
                        placeholder="Ex: 450"
                        className="w-full text-[11px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Conversões Geradas</label>
                      <input
                        type="number"
                        value={metricsConversions}
                        onChange={(e) => setMetricsConversions(e.target.value)}
                        placeholder="Ex: 50"
                        className="w-full text-[11px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Gasto Atual (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={metricsSpend}
                        onChange={(e) => setMetricsSpend(e.target.value)}
                        placeholder="Ex: 1250.00"
                        className="w-full text-[11px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-brand-primary font-bold text-xs shadow-md"
                  >
                    {editingCampaign ? 'Salvar Alterações' : 'Criar Campanha'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deleteConfirmId && (
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
                  Confirmar Remoção de Campanha
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tem certeza que deseja remover permanentemente a campanha <strong className="text-rose-500 dark:text-rose-400">"{deleteConfirmName}"</strong>? Esta ação não pode ser desfeita.
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
                  onClick={confirmDeleteCampaign}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Sim, Excluir Campanha
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
