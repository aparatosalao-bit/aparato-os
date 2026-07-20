/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { CreativeItem, CreativeComment, CreativeRevision, CreativeFormat, CreativeApprovalStatus, CRMClient } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  MessageSquare, 
  History, 
  Upload, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  Layers, 
  Clock, 
  ChevronRight, 
  User, 
  Sparkles, 
  ExternalLink,
  Users,
  AlertCircle,
  FolderOpen,
  ArrowUpRight,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  Sliders,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Status style mappings
const STATUS_META = {
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  approved: { label: 'Aprovado', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  rejected: { label: 'Rejeitado', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  changes_requested: { label: 'Alterações Solicitadas', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
};

// Format icon and styling mappings
const FORMAT_META = {
  image: { label: 'Imagem', icon: ImageIcon, color: 'text-indigo-400 bg-indigo-500/10' },
  video: { label: 'Vídeo Feed', icon: Video, color: 'text-rose-400 bg-rose-500/10' },
  reels: { label: 'Reels', icon: Video, color: 'text-emerald-400 bg-emerald-500/10' },
  stories: { label: 'Story', icon: ImageIcon, color: 'text-pink-400 bg-pink-500/10' },
  pdf: { label: 'PDF Documento', icon: FileText, color: 'text-amber-400 bg-amber-500/10' },
  presentation: { label: 'Apresentação', icon: Layers, color: 'text-cyan-400 bg-cyan-500/10' },
};

export const CreativeApprovalModule: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Data State
  const [creatives, setCreatives] = useState<CreativeItem[]>([]);
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [formatFilter, setFormatFilter] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'all' | 'history'>('all');

  // Interactive details modal
  const [selectedCreative, setSelectedCreative] = useState<CreativeItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newComment, setNewComment] = useState('');

  // Confirmation and prompt states
  const [deleteCreativeId, setDeleteCreativeId] = useState<string | null>(null);
  const [rejectCreativeId, setRejectCreativeId] = useState<string | null>(null);
  const [adjustCreativeId, setAdjustCreativeId] = useState<string | null>(null);
  const [adjustNoteText, setAdjustNoteText] = useState('');

  // Creation / New Version state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'create' | 'revision'>('create');
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<CreativeFormat>('image');
  const [fileUrl, setFileUrl] = useState('');
  const [formClientId, setFormClientId] = useState('');

  // Drag and drop upload zone simulation
  const [dragOverZone, setDragOverZone] = useState(false);

  // File selection reference and handler for real file reading
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processSelectedFile = (file: File) => {
    // 30MB limit check
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 30) {
      showError('O arquivo selecionado é muito grande (limite de 30MB para armazenamento local).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Url = event.target.result as string;
        setFileUrl(base64Url);
        
        // Auto-detect format based on mime-type or file extension
        let detectedFormat: CreativeFormat = format;
        if (file.type.startsWith('image/')) {
          if (format !== 'stories') {
            detectedFormat = 'image';
          }
        } else if (file.type.startsWith('video/')) {
          if (format !== 'reels') {
            detectedFormat = 'video';
          }
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          detectedFormat = 'pdf';
        } else if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
          detectedFormat = 'presentation';
        }

        setFormat(detectedFormat);
        
        // Set default title if not set
        if (!title) {
          const nameWithoutExtension = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          setTitle(nameWithoutExtension);
        }
        
        showSuccess(`Arquivo "${file.name}" carregado com sucesso do seu computador!`);
      }
    };
    reader.onerror = () => {
      showError('Falha ao ler o arquivo do seu computador.');
    };
    reader.readAsDataURL(file);
  };

  const onFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Success / Error triggers
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sample urls to make it extremely easy to upload nice content
  const sampleUrls = {
    image: [
      { name: 'Campanha Estética 1', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80' },
      { name: 'Estúdio de Maquiagem', url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80' },
      { name: 'Penteado Elegante', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80' }
    ],
    video: [
      { name: 'Workspace Business', url: 'https://assets.mixkit.co/videos/preview/mixkit-businesswoman-working-on-a-laptop-in-her-office-42352-large.mp4' },
      { name: 'Teclado Mecânico', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-typing-on-a-keyboard-40546-large.mp4' }
    ],
    pdf: [
      { name: 'Relatório Financeiro', url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80' },
      { name: 'Proposta Comercial', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80' }
    ]
  };

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
    const list = StorageService.getCreatives();
    setCreatives(list);
    const clientsList = StorageService.getClients();
    setClients(clientsList);

    if (currentUser?.role === 'client') {
      setSelectedClientId(currentUser.id);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  // Drag over handler for upload zone
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(true);
  };

  const onDragLeave = () => {
    setDragOverZone(false);
  };

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    } else {
      // Simulate drop with a beautiful random preset if no physical file was dropped
      const formatTypes: CreativeFormat[] = ['image', 'video', 'reels', 'stories', 'pdf', 'presentation'];
      const randomFormat = formatTypes[Math.floor(Math.random() * formatTypes.length)];
      
      let url = '';
      if (randomFormat === 'video' || randomFormat === 'reels') {
        url = sampleUrls.video[Math.floor(Math.random() * sampleUrls.video.length)].url;
      } else if (randomFormat === 'pdf' || randomFormat === 'presentation') {
        url = sampleUrls.pdf[Math.floor(Math.random() * sampleUrls.pdf.length)].url;
      } else {
        url = sampleUrls.image[Math.floor(Math.random() * sampleUrls.image.length)].url;
      }

      setFormat(randomFormat);
      setFileUrl(url);
      setTitle('Arquivo Arrastado e Carregado');
      setDescription('Arquivo simulado via drag & drop com sucesso.');
      showSuccess('Arquivo recebido com sucesso! Complete os campos abaixo.');
    }
  };

  // Submit Creative Item (Upload / Add)
  const handleUploadCreative = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      showError('Apenas administradores podem fazer upload de novos criativos.');
      return;
    }

    if (!title || !fileUrl) {
      showError('Por favor, defina um título e anexe/insira a URL do arquivo.');
      return;
    }

    const targetClientId = uploadMode === 'revision' && selectedCreative ? selectedCreative.clientId : formClientId;
    const clientRef = clients.find(c => c.id === targetClientId);
    if (!clientRef) {
      showError('Selecione um cliente válido.');
      return;
    }

    if (uploadMode === 'revision' && selectedCreative) {
      // Create a new version/revision for existing item
      const nextVersion = selectedCreative.revisions.length + 1;
      const newRevision: CreativeRevision = {
        id: `rev-${selectedCreative.id}-${Date.now()}`,
        version: nextVersion,
        fileUrl,
        format,
        description: description || `Nova versão V${nextVersion}`,
        status: 'pending',
        changedBy: currentUser.name,
        createdAt: new Date().toISOString()
      };

      const updatedCreative: CreativeItem = {
        ...selectedCreative,
        fileUrl,
        format,
        description: description || selectedCreative.description,
        status: 'pending', // reset to pending for client review
        revisions: [newRevision, ...selectedCreative.revisions],
        updatedAt: new Date().toISOString()
      };

      StorageService.saveCreative(updatedCreative);
      setSelectedCreative(updatedCreative);
      showSuccess(`Versão V${nextVersion} enviada com sucesso para aprovação!`);
    } else {
      // Create entirely new creative item
      const newId = `creative-${Date.now()}`;
      const firstRevision: CreativeRevision = {
        id: `rev-${newId}-${Date.now()}`,
        version: 1,
        fileUrl,
        format,
        description: description || 'Primeiro envio do arquivo.',
        status: 'pending',
        changedBy: currentUser.name,
        createdAt: new Date().toISOString()
      };

      const newCreative: CreativeItem = {
        id: newId,
        title,
        description,
        format,
        fileUrl,
        status: 'pending',
        clientId: targetClientId,
        clientName: clientRef.companyName,
        comments: [],
        revisions: [firstRevision],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      StorageService.saveCreative(newCreative);
      showSuccess('Novo criativo enviado para aprovação com sucesso!');
    }

    setIsUploadOpen(false);
    loadData();
  };

  // Quick Action: Approve / Request Changes / Reject
  const handleUpdateStatus = (status: CreativeApprovalStatus, comments?: string) => {
    if (!selectedCreative) return;

    // Build automated comment
    const statusLabels = {
      approved: 'aprovou este criativo ✔️',
      rejected: 'rejeitou este criativo ❌',
      changes_requested: 'solicitou alterações no criativo 📝'
    };

    const actionText = statusLabels[status as keyof typeof statusLabels] || 'atualizou o status';
    
    const automComment: CreativeComment = {
      id: `comment-sys-${Date.now()}`,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Visitante',
      userRole: currentUser?.role === 'admin' ? 'admin' : 'client',
      content: comments ? `${comments} (Ação: Alteração Solicitada)` : `Status atualizado: ${currentUser?.name} ${actionText}`,
      createdAt: new Date().toISOString()
    };

    // Update revision history item state too
    const updatedRevisions = [...selectedCreative.revisions];
    if (updatedRevisions.length > 0) {
      updatedRevisions[0] = {
        ...updatedRevisions[0],
        status: status,
        comments: comments || undefined
      };
    }

    const updatedCreative: CreativeItem = {
      ...selectedCreative,
      status,
      comments: [automComment, ...selectedCreative.comments],
      revisions: updatedRevisions,
      updatedAt: new Date().toISOString()
    };

    StorageService.saveCreative(updatedCreative);
    setSelectedCreative(updatedCreative);
    showSuccess(`Status do criativo atualizado para "${STATUS_META[status].label}"!`);
    loadData();
  };

  // Submit Comments
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedCreative) return;

    const userComment: CreativeComment = {
      id: `comment-${Date.now()}`,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'Usuário',
      userRole: currentUser?.role === 'admin' ? 'admin' : 'client',
      content: newComment.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedCreative: CreativeItem = {
      ...selectedCreative,
      comments: [userComment, ...selectedCreative.comments],
      updatedAt: new Date().toISOString()
    };

    StorageService.saveCreative(updatedCreative);
    setSelectedCreative(updatedCreative);
    setNewComment('');
    loadData();
  };

  // Delete Creative entirely
  const handleDeleteCreative = (id: string) => {
    if (currentUser?.role !== 'admin') {
      showError('Apenas administradores podem remover criativos.');
      return;
    }
    setDeleteCreativeId(id);
  };

  const confirmDeleteCreative = () => {
    if (deleteCreativeId) {
      StorageService.deleteCreative(deleteCreativeId);
      showSuccess('Criativo removido do banco.');
      setIsDetailOpen(false);
      loadData();
      setDeleteCreativeId(null);
    }
  };

  const handleConfirmReject = () => {
    if (rejectCreativeId) {
      handleUpdateStatus('rejected');
      setRejectCreativeId(null);
    }
  };

  const handleConfirmAdjust = () => {
    if (adjustCreativeId && adjustNoteText.trim()) {
      handleUpdateStatus('changes_requested', adjustNoteText);
      setAdjustCreativeId(null);
      setAdjustNoteText('');
    }
  };

  // Scoped creatives
  const filteredCreatives = creatives.filter(item => {
    const matchesClient = selectedClientId === 'todos' || item.clientId === selectedClientId;
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter;
    const matchesFormat = formatFilter === 'todos' || item.format === formatFilter;
    return matchesClient && matchesStatus && matchesFormat;
  });

  const creativeToDelete = creatives.find(c => c.id === deleteCreativeId);

  return (
    <div className="space-y-6">
      {/* Toast Feedback notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 p-4 bg-emerald-500 text-white rounded-xl shadow-2xl border border-emerald-400 font-bold text-xs flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 p-4 bg-rose-500 text-white rounded-xl shadow-2xl border border-rose-400 font-bold text-xs flex items-center gap-2"
          >
            <XCircle size={16} />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display flex items-center gap-2">
            Aprovação de Criativos
            <span className="text-xs font-bold text-[#ffd700] bg-[#114455] px-2.5 py-1 rounded-full uppercase tracking-widest">
              Premium Agency Hub
            </span>
          </h1>
          <p className="text-slate-500 dark:text-teal-400 text-xs">
            Central de feedback em tempo real, upload de novas versões e aprovação ágil de mídias para clientes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Main Switch Tabs */}
          <div className="bg-slate-100 dark:bg-slate-850 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-[#114455] text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Feed de Aprovações
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history' 
                  ? 'bg-[#114455] text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <History size={13} />
              <span>Histórico de Uploads</span>
            </button>
          </div>

          {/* Quick upload trigger */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                setUploadMode('create');
                setTitle('');
                setDescription('');
                setFormat('image');
                setFileUrl('');
                setFormClientId(clients[0]?.id || '');
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#ffd700] text-[#114455] hover:bg-[#ffed4a] transition-all shadow-md cursor-pointer"
            >
              <Upload size={14} />
              <span>Novo Criativo</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Ribbon Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-4">
        {/* Workspace filtering */}
        {currentUser?.role === 'admin' ? (
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <Users size={14} className="text-[#ffd700]" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white font-medium focus:outline-none"
            >
              <option value="todos">Todos os Workspaces</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-teal-400">
            <Users size={14} />
            <span>Workspace Ativo: {clients.find(c => c.id === currentUser?.id)?.companyName || 'Meu Workspace'}</span>
          </div>
        )}

        {/* Status filtering */}
        <div className="flex items-center gap-2 flex-1 min-w-[150px]">
          <Sliders size={14} className="text-[#ffd700]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white font-medium focus:outline-none"
          >
            <option value="todos">Todos os Status</option>
            <option value="pending">Pendente de Revisão</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
            <option value="changes_requested">Alteração Solicitada</option>
          </select>
        </div>

        {/* Format filtering */}
        <div className="flex items-center gap-2 flex-1 min-w-[150px]">
          <FolderOpen size={14} className="text-[#ffd700]" />
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white font-medium focus:outline-none"
          >
            <option value="todos">Todos os Formatos</option>
            <option value="image">Imagens</option>
            <option value="video">Vídeos Feed</option>
            <option value="reels">Reels</option>
            <option value="stories">Stories</option>
            <option value="pdf">PDFs</option>
            <option value="presentation">Apresentações</option>
          </select>
        </div>
      </div>

      {/* TAB 1: ALL ACTIVE CREATIVES FEED */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {filteredCreatives.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl py-16 px-4 text-center space-y-3">
              <FolderOpen size={48} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">Nenhum criativo localizado</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Não há criativos pendentes de aprovação ou histórico correspondente aos filtros de pesquisa atuais.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCreatives.map((item) => {
                const formatMeta = FORMAT_META[item.format];
                const FormatIcon = formatMeta.icon;
                const statusMeta = STATUS_META[item.status];
                
                // Check if has video formats
                const isVideo = item.format === 'video' || item.format === 'reels';
                
                return (
                  <motion.div
                    key={item.id}
                    layoutId={`creative-card-${item.id}`}
                    onClick={() => {
                      setSelectedCreative(item);
                      setIsDetailOpen(true);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    {/* Header bar inside card */}
                    <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] text-slate-400 font-bold block">{item.clientName}</span>
                        <h3 className="text-xs font-extrabold text-slate-800 dark:text-white line-clamp-1">{item.title}</h3>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* Preview window inside card */}
                    <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800">
                      {isVideo ? (
                        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                          {/* Simulated cover with play icon */}
                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-10 hover:bg-slate-900/10 transition-all">
                            <span className="p-3 bg-[#ffd700] text-[#114455] rounded-full shadow-lg">
                              <Play size={16} fill="#114455" />
                            </span>
                          </div>
                          <video 
                            src={item.fileUrl} 
                            className="w-full h-full object-cover opacity-60"
                            muted
                            loop
                            playsInline
                          />
                        </div>
                      ) : (
                        <img 
                          src={item.fileUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {/* Format tag badge */}
                      <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-md text-[9px] font-extrabold uppercase flex items-center gap-1 ${formatMeta.color} backdrop-blur-md`}>
                        <FormatIcon size={10} />
                        <span>{formatMeta.label}</span>
                      </div>

                      {/* Version badge */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-mono px-2 py-0.5 rounded-full border border-white/15">
                        Versão V{item.revisions[0]?.version || 1}
                      </div>
                    </div>

                    {/* Footer bar inside card */}
                    <div className="p-4 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-850/40">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} className="text-[#ffd700]" />
                          <span className="font-bold">{item.comments.length}</span>
                        </span>
                        
                        <span className="flex items-center gap-1">
                          <History size={12} className="text-[#ffd700]" />
                          <span className="font-bold">{item.revisions.length} versões</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 font-mono text-[9px] font-semibold text-slate-400">
                        <Clock size={10} />
                        <span>{new Date(item.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: UPLOAD & ACTIONS HISTORY (DASHBOARD LOG) */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <History size={16} className="text-[#ffd700]" />
              Histórico Consolidado de Revisões & Atividade
            </h3>
            <p className="text-[11px] text-slate-400">Linha do tempo cronológica com logs de alteração e aprovação de todas as marcas.</p>
          </div>

          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 pl-6 ml-3 space-y-6 text-left">
            {creatives.flatMap(item => 
              item.revisions.map(rev => ({
                ...rev,
                creativeId: item.id,
                creativeTitle: item.title,
                clientName: item.clientName
              }))
            )
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((rev) => {
              const formatMeta = FORMAT_META[rev.format];
              const statusMeta = STATUS_META[rev.status];
              
              return (
                <div key={rev.id} className="relative group">
                  {/* Bullet indicator point */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-[#ffd700] group-hover:scale-125 transition-all flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#114455]" />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">{rev.clientName}</span>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-white">
                          {rev.creativeTitle} <span className="text-[#ffd700] font-mono">V{rev.version}</span>
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                        
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${formatMeta.color} uppercase`}>
                          {formatMeta.label}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium">
                      {rev.description}
                    </p>

                    {rev.comments && (
                      <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl text-[10px] italic text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 font-medium">
                        Nota de Alteração: {rev.comments}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        Enviado por: <strong className="text-slate-600 dark:text-slate-300">{rev.changedBy}</strong>
                      </span>
                      <span>{new Date(rev.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE DETAIL MODAL WITH VIDEO PLAYER, COMMNETS & REVISIONS */}
      <AnimatePresence>
        {isDetailOpen && selectedCreative && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              layoutId={`creative-card-${selectedCreative.id}`}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-4xl w-full border border-slate-150 dark:border-slate-800 shadow-2xl text-left my-8"
            >
              {/* Modal Banner */}
              <div className="p-6 bg-[#08222a] border-b border-slate-800 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md border ${STATUS_META[selectedCreative.status].color}`}>
                      {STATUS_META[selectedCreative.status].label}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Versão V{selectedCreative.revisions[0]?.version || 1}</span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-white">{selectedCreative.title}</h3>
                  <p className="text-xs text-teal-400">Workspace de Parceria: {selectedCreative.clientName}</p>
                </div>
                
                <button 
                  onClick={() => setIsDetailOpen(false)} 
                  className="p-1 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800/80 rounded-full transition-all self-start sm:self-center cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Three Column / Double Grid body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800 max-h-[75vh] overflow-y-auto">
                
                {/* COLUMN A (lg:6): High Fidelity Visual Preview Frame */}
                <div className="lg:col-span-7 p-6 space-y-4 bg-slate-50 dark:bg-slate-950/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pré-Visualização do Criativo</span>

                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-900 flex items-center justify-center relative shadow-sm">
                    {selectedCreative.format === 'video' || selectedCreative.format === 'reels' ? (
                      <video 
                        src={selectedCreative.fileUrl} 
                        className="w-full h-full object-contain"
                        controls
                        playsInline
                      />
                    ) : (
                      <img 
                        src={selectedCreative.fileUrl} 
                        alt={selectedCreative.title}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  {/* Creative Description block */}
                  <div className="space-y-1 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Briefing / Descrição Técnica</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedCreative.description || 'Nenhum briefing cadastrado para este criativo.'}
                    </p>
                  </div>

                  {/* Actions Bar for clients & admins */}
                  <div className="pt-2">
                    {/* Status approvals workflow */}
                    <div className="flex flex-wrap gap-2.5">
                      {selectedCreative.status === 'pending' && currentUser?.role === 'client' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus('approved')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            <Check size={14} />
                            <span>Aprovar Conteúdo</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setAdjustCreativeId(selectedCreative.id);
                              setAdjustNoteText('');
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            <MessageSquare size={14} />
                            <span>Solicitar Ajustes</span>
                          </button>

                          <button
                            onClick={() => {
                              setRejectCreativeId(selectedCreative.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            <X size={14} />
                            <span>Rejeitar</span>
                          </button>
                        </>
                      )}

                      {/* Administrator upload new version action */}
                      {currentUser?.role === 'admin' && (
                        <div className="w-full flex gap-2">
                          <button
                            onClick={() => {
                              setUploadMode('revision');
                              setTitle(selectedCreative.title);
                              setDescription('');
                              setFormat(selectedCreative.format);
                              setFileUrl('');
                              setIsUploadOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#ffd700] text-[#114455] hover:bg-[#ffed4a] text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            <Upload size={14} />
                            <span>Enviar Nova Versão (V{(selectedCreative.revisions[0]?.version || 1) + 1})</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCreative(selectedCreative.id)}
                            className="px-3.5 py-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer"
                            title="Remover Criativo"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* COLUMN B (lg:5): Comments Stream and Revision History */}
                <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6">
                  
                  {/* UPPER SUBSECTION: Revision History tracker */}
                  <div className="space-y-3 flex-1 min-h-[150px] max-h-[220px] overflow-y-auto border-b border-slate-100 dark:border-slate-800 pb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <History size={12} className="text-[#ffd700]" />
                      Histórico de Versões
                    </span>

                    <div className="space-y-2">
                      {selectedCreative.revisions.map((rev) => (
                        <div 
                          key={rev.id} 
                          className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl text-xs border border-slate-100 dark:border-slate-800/40"
                        >
                          <div className="space-y-0.5 text-left">
                            <span className="font-extrabold text-slate-800 dark:text-white">Versão V{rev.version}</span>
                            <span className="text-[10px] text-slate-400 block">{new Date(rev.createdAt).toLocaleDateString('pt-BR')} por {rev.changedBy}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${STATUS_META[rev.status].color}`}>
                              {STATUS_META[rev.status].label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LOWER SUBSECTION: Real comments thread */}
                  <div className="space-y-4 flex-1 flex flex-col justify-between max-h-[300px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MessageSquare size={12} className="text-[#ffd700]" />
                      Canal de Feedbacks ({selectedCreative.comments.length})
                    </span>

                    {/* Speech bubbles list */}
                    <div className="space-y-3 overflow-y-auto max-h-[180px] pr-1 flex-1 text-xs">
                      {selectedCreative.comments.length === 0 ? (
                        <p className="text-center text-slate-400 italic py-6">Nenhum comentário cadastrado. Deixe um feedback acima!</p>
                      ) : (
                        selectedCreative.comments.map((comment) => {
                          const isAdmin = comment.userRole === 'admin';
                          return (
                            <div 
                              key={comment.id}
                              className={`flex flex-col space-y-1 ${isAdmin ? 'items-start' : 'items-end'}`}
                            >
                              <span className="text-[10px] text-slate-400 font-bold px-1">{comment.userName}</span>
                              <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                                isAdmin 
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none' 
                                  : 'bg-[#114455] text-white rounded-tr-none'
                              }`}>
                                {comment.content}
                              </div>
                              <span className="text-[8px] text-slate-400 font-mono px-1">
                                {new Date(comment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* New feedback comment form */}
                    <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <input
                        type="text"
                        placeholder="Escreva uma mensagem..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#114455] text-white text-xs font-bold hover:bg-[#114455]/85 cursor-pointer"
                      >
                        Enviar
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPREHENSIVE UPLOAD FORM & DRAG DRAG OVERLAY */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-lg w-full border border-slate-150 dark:border-slate-800 shadow-2xl text-left my-8"
            >
              <div className="p-5 bg-[#08222a] border-b border-slate-800 text-white flex items-center justify-between">
                <h3 className="text-md font-bold text-white font-display flex items-center gap-2">
                  <Upload size={16} className="text-[#ffd700]" />
                  {uploadMode === 'revision' ? 'Enviar Nova Revisão / Versão' : 'Fazer Upload de Novo Criativo'}
                </h3>
                <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white cursor-pointer font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleUploadCreative} className="p-6 space-y-4">
                
                {/* Drag and Drop and File Browse zone */}
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDropFile}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 relative cursor-pointer ${
                    dragOverZone 
                      ? 'border-[#ffd700] bg-slate-100 dark:bg-slate-800' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-[#ffd700] hover:bg-slate-100/50 dark:hover:bg-slate-800/20 bg-slate-50 dark:bg-slate-850/50'
                  }`}
                  title="Clique para selecionar um arquivo do computador ou arraste-o para cá"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileSelectChange}
                    accept="image/*,video/*,application/pdf"
                    className="hidden"
                  />
                  
                  <Upload size={32} className="text-slate-400 group-hover:scale-115 transition-all" />
                  
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Clique para selecionar ou arraste arquivos aqui</p>
                    <p className="text-[10px] text-slate-400">Suporta Imagens, Vídeos, Reels, Stories, PDFs e Propostas</p>
                  </div>

                  <span className="text-[9px] text-[#ffd700] bg-[#114455] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                    Upload Local do Computador Ativo
                  </span>
                </div>

                {/* Preset Fast Select URLs to keep it gorgeous */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Selecionar Demonstrador de Mídia</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormat('image');
                        setFileUrl(sampleUrls.image[0].url);
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-semibold text-center cursor-pointer ${
                        fileUrl === sampleUrls.image[0].url ? 'border-[#ffd700] bg-[#114455]/10 text-[#ffd700]' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Preset Imagem
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormat('video');
                        setFileUrl(sampleUrls.video[0].url);
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-semibold text-center cursor-pointer ${
                        fileUrl === sampleUrls.video[0].url ? 'border-[#ffd700] bg-[#114455]/10 text-[#ffd700]' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Preset Vídeo (Laptop)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormat('pdf');
                        setFileUrl(sampleUrls.pdf[0].url);
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-semibold text-center cursor-pointer ${
                        fileUrl === sampleUrls.pdf[0].url ? 'border-[#ffd700] bg-[#114455]/10 text-[#ffd700]' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Preset Proposta/PDF
                    </button>
                  </div>
                </div>

                {/* File URL manual entry */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">URL do arquivo / Mock URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="https://... ou arquivo carregado"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                  />
                </div>

                {uploadMode === 'create' && (
                  <>
                    {/* Client Selector (Admin ONLY) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Workspace do Cliente *</label>
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

                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Título da Peça Criativa *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Criativo Feed - Black Friday..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {/* Format and Upload Mode row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Formato de Peça</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as CreativeFormat)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                    >
                      <option value="image">Imagem Feed</option>
                      <option value="video">Vídeo Feed</option>
                      <option value="reels">Reels</option>
                      <option value="stories">Story</option>
                      <option value="pdf">PDF Documento</option>
                      <option value="presentation">Apresentação / Proposta</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Versão de Envio</label>
                    <div className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 dark:text-white font-mono font-bold">
                      {uploadMode === 'revision' && selectedCreative 
                        ? `V${selectedCreative.revisions.length + 1} (Revisão)` 
                        : 'V1 (Novo Criativo)'
                      }
                    </div>
                  </div>
                </div>

                {/* Description (Briefing note) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    {uploadMode === 'revision' ? 'O que mudou nesta nova versão? (Changelog)' : 'Briefing / Descrição Detalhada'}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={uploadMode === 'revision' ? 'Ex: Ajustado paleta azul para combinar com logo e corrigido o CTA.' : 'Ex: Focado em chamar atenção para a promoção de natal e cupom NATAL10...'}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white resize-none"
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-[#ffd700] text-[#114455] hover:bg-[#ffed4a] transition-all shadow-md cursor-pointer"
                  >
                    Confirmar Envio
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM DELETE CREATIVE MODAL */}
      {deleteCreativeId && creativeToDelete && (
        <div className="fixed inset-0 z-50 bg-[#08222a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-rose-500/20 overflow-hidden relative text-left"
          >
            <div className="h-1.5 w-full bg-rose-500" />
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertCircle size={20} />
                <h3 className="text-lg font-bold font-display">
                  Excluir Criativo
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tem certeza absoluta que deseja remover permanentemente o criativo <strong className="text-rose-500 dark:text-rose-400">"{creativeToDelete.title}"</strong> e todo o seu histórico de revisões? Esta ação não pode ser desfeita.
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteCreativeId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteCreative}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Sim, Excluir Criativo
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* CUSTOM REJECT CREATIVE MODAL */}
      {rejectCreativeId && (
        <div className="fixed inset-0 z-50 bg-[#08222a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-rose-500/20 overflow-hidden relative text-left"
          >
            <div className="h-1.5 w-full bg-rose-500" />
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertCircle size={20} />
                <h3 className="text-lg font-bold font-display">
                  Confirmar Rejeição
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tem certeza de que deseja <strong className="text-rose-500 dark:text-rose-400">REJEITAR</strong> este conteúdo completamente?
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectCreativeId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Confirmar Rejeição
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* CUSTOM REQUEST ADJUSTMENTS MODAL */}
      {adjustCreativeId && (
        <div className="fixed inset-0 z-50 bg-[#08222a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-blue-500/20 overflow-hidden relative text-left"
          >
            <div className="h-1.5 w-full bg-blue-500" />
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-blue-500">
                <MessageSquare size={20} />
                <h3 className="text-lg font-bold font-display">
                  Solicitar Ajustes
                </h3>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Por favor, digite detalhadamente as alterações solicitadas para a agência Aparato:
                </p>
                <textarea
                  rows={4}
                  value={adjustNoteText}
                  onChange={(e) => setAdjustNoteText(e.target.value)}
                  placeholder="Ex: Por favor altere a cor de fundo para azul marinho e aumente o tamanho do logotipo..."
                  className="w-full text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustCreativeId(null);
                    setAdjustNoteText('');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAdjust}
                  disabled={!adjustNoteText.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Enviar Solicitação
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
