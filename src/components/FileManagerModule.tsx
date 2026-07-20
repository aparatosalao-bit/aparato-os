/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { ManagedFile, FileCategory, FileHistoryItem, CRMClient } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  FolderOpen, 
  Upload, 
  Download, 
  Eye, 
  History, 
  FileText, 
  Video, 
  Image as ImageIcon, 
  Layers, 
  Clock, 
  User, 
  Check, 
  X, 
  AlertCircle, 
  ExternalLink,
  Users,
  CheckCircle2,
  XCircle,
  File,
  Sparkles,
  ArrowUpRight,
  Filter,
  RefreshCw,
  FolderPlus,
  BookOpen,
  PieChart,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Maps and localization
const CATEGORY_META = {
  logos: { label: 'Logos', icon: Sparkles, color: 'text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/15' },
  identidade_visual: { label: 'Identidade Visual', icon: Layers, color: 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/15' },
  fotos: { label: 'Fotos', icon: ImageIcon, color: 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15' },
  videos: { label: 'Vídeos', icon: Video, color: 'text-pink-500 bg-pink-500/10 hover:bg-pink-500/15' },
  documentos: { label: 'Documentos', icon: FileText, color: 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/15' },
  contratos: { label: 'Contratos', icon: BookOpen, color: 'text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/15' },
  relatorios: { label: 'Relatórios', icon: PieChart, color: 'text-teal-500 bg-teal-500/10 hover:bg-teal-500/15' },
  marketing: { label: 'Materiais de Marketing', icon: ArrowUpRight, color: 'text-purple-500 bg-purple-500/10 hover:bg-purple-500/15' },
};

export const FileManagerModule: React.FC = () => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Data lists
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [clients, setClients] = useState<CRMClient[]>([]);
  
  // Filtering & Search
  const [selectedClientId, setSelectedClientId] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals & Panels State
  const [selectedFile, setSelectedFile] = useState<ManagedFile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'create' | 'version'>('create');
  
  // Confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Create / New Version Form fields
  const [fileName, setFileName] = useState('');
  const [fileCategory, setFileCategory] = useState<FileCategory>('logos');
  const [fileUrl, setFileUrl] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [fileSize, setFileSize] = useState('1.5 MB');
  const [fileType, setFileType] = useState('image/png');
  const [uploadNote, setUploadNote] = useState('');

  // Drag and drop zone interactive feedback
  const [dragActive, setDragActive] = useState(false);

  // Success / Error alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sample media presets to fill mock inputs beautifully
  const samplePresets = [
    { name: 'logo_corporativo_alta.png', size: '380 KB', type: 'image/png', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', category: 'logos' },
    { name: 'fotos_modelo_campanha_inverno.jpg', size: '2.4 MB', type: 'image/jpeg', url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', category: 'fotos' },
    { name: 'video_institucional_completo.mp4', size: '14.2 MB', type: 'video/mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-businesswoman-working-on-a-laptop-in-her-office-42352-large.mp4', category: 'videos' },
    { name: 'contrato_prestacao_servicos_marketing.pdf', size: '1.1 MB', type: 'application/pdf', url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80', category: 'contratos' },
    { name: 'planejamento_anual_branding.pdf', size: '4.5 MB', type: 'application/pdf', url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80', category: 'identidade_visual' },
    { name: 'relatorio_metas_segundo_semestre.pdf', size: '890 KB', type: 'application/pdf', url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80', category: 'relatorios' },
  ];

  useEffect(() => {
    loadDatabase();

    const handleSync = () => {
      loadDatabase();
    };
    window.addEventListener('storage-update', handleSync);
    return () => {
      window.removeEventListener('storage-update', handleSync);
    };
  }, [currentUser]);

  const loadDatabase = () => {
    const list = StorageService.getFiles();
    setFiles(list);
    const clientsList = StorageService.getClients();
    setClients(clientsList);

    // Enforce client workspace boundary
    if (currentUser?.role === 'client') {
      setSelectedClientId(currentUser.id);
    } else {
      setSelectedClientId('todos');
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3500);
  };

  // Drag-and-drop visual detection handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
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
        setFileName(file.name);
        
        const sizeStr = sizeInMB < 0.1 
          ? (file.size / 1024).toFixed(0) + ' KB' 
          : sizeInMB.toFixed(1) + ' MB';
        setFileSize(sizeStr);
        setFileType(file.type || 'application/octet-stream');
        
        // Auto-assign category from mime-type or file extension
        if (file.type.startsWith('image/')) {
          setFileCategory('fotos');
        } else if (file.type.startsWith('video/')) {
          setFileCategory('videos');
        } else if (file.name.endsWith('.pdf')) {
          setFileCategory('documentos');
        } else if (file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) {
          setFileCategory('identidade_visual');
        } else {
          setFileCategory('documentos');
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
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Preset Selection Clicker
  const handleSelectPreset = (preset: typeof samplePresets[0]) => {
    setFileName(preset.name);
    setFileSize(preset.size);
    setFileType(preset.type);
    setFileCategory(preset.category as FileCategory);
    setFileUrl(preset.url);
  };

  // Form submission: Create or New Version
  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileName || !fileUrl) {
      showError('Defina o nome do arquivo e insira uma URL de mídia.');
      return;
    }

    const currentClientId = uploadMode === 'version' && selectedFile ? selectedFile.clientId : formClientId;
    const clientRef = clients.find(c => c.id === currentClientId);
    
    if (currentUser?.role === 'client' && currentClientId !== currentUser.id) {
      showError('Operação não autorizada no workspace de outro cliente.');
      return;
    }

    if (!clientRef && currentUser?.role === 'admin') {
      showError('Selecione um cliente para associar o arquivo.');
      return;
    }

    const clientName = clientRef ? clientRef.companyName : (currentUser?.name || 'Cliente');

    if (uploadMode === 'version' && selectedFile) {
      // Add a new version in File History
      const nextVersionNum = selectedFile.version + 1;
      const historyItem: FileHistoryItem = {
        id: `h-file-${Date.now()}`,
        version: nextVersionNum,
        name: fileName,
        fileUrl,
        size: fileSize,
        uploadedBy: currentUser?.name || 'Sistema',
        createdAt: new Date().toISOString(),
        note: uploadNote || `Nova versão V${nextVersionNum} do arquivo.`
      };

      const updatedFile: ManagedFile = {
        ...selectedFile,
        name: fileName,
        fileUrl,
        size: fileSize,
        type: fileType,
        version: nextVersionNum,
        uploadedBy: currentUser?.name || 'Sistema',
        history: [historyItem, ...selectedFile.history],
        updatedAt: new Date().toISOString()
      };

      StorageService.saveFile(updatedFile);
      setSelectedFile(updatedFile);
      showSuccess(`Versão V${nextVersionNum} de "${fileName}" carregada no histórico com sucesso!`);
    } else {
      // Create fresh file
      const newId = `file-${Date.now()}`;
      const firstHistoryItem: FileHistoryItem = {
        id: `h-file-${Date.now()}`,
        version: 1,
        name: fileName,
        fileUrl,
        size: fileSize,
        uploadedBy: currentUser?.name || 'Sistema',
        createdAt: new Date().toISOString(),
        note: uploadNote || 'Primeiro upload do arquivo.'
      };

      const newFile: ManagedFile = {
        id: newId,
        name: fileName,
        category: fileCategory,
        size: fileSize,
        type: fileType,
        fileUrl,
        clientId: currentUser?.role === 'client' ? currentUser.id : currentClientId,
        clientName: currentUser?.role === 'client' ? (currentUser.name || 'Minha Conta') : clientName,
        uploadedBy: currentUser?.name || 'Sistema',
        version: 1,
        history: [firstHistoryItem],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      StorageService.saveFile(newFile);
      showSuccess(`Arquivo "${fileName}" adicionado com sucesso no workspace!`);
    }

    setIsUploadOpen(false);
    setUploadNote('');
    loadDatabase();
  };

  // Delete file handler
  const handleDeleteFile = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteFile = () => {
    if (deleteConfirmId) {
      StorageService.deleteFile(deleteConfirmId);
      showSuccess('Arquivo removido com sucesso.');
      setIsPreviewOpen(false);
      loadDatabase();
      setDeleteConfirmId(null);
    }
  };

  // Download simulation
  const handleDownloadFile = (file: ManagedFile) => {
    showSuccess(`Iniciando download seguro de "${file.name}"...`);
    // Open in separate window to bypass iframe limits
    window.open(file.fileUrl, '_blank');
  };

  // Filter logic
  const filteredFiles = files.filter(item => {
    // 1. Enforce active client boundary first
    const belongsToMe = currentUser?.role === 'admin' 
      ? (selectedClientId === 'todos' || item.clientId === selectedClientId)
      : (item.clientId === currentUser?.id);
    
    // 2. Category match
    const matchesCategory = selectedCategory === 'todos' || item.category === selectedCategory;

    // 3. Search text match
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.clientName.toLowerCase().includes(searchQuery.toLowerCase());

    return belongsToMe && matchesCategory && matchesSearch;
  });

  const fileToDelete = files.find(f => f.id === deleteConfirmId);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 p-4 bg-[#114455] text-white rounded-xl shadow-2xl border border-teal-500/30 font-bold text-xs flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-[#ffd700]" />
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

      {/* Header bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display flex items-center gap-2">
            Gerenciador de Arquivos
            <span className="text-xs font-bold text-[#ffd700] bg-[#114455] px-2.5 py-1 rounded-full uppercase tracking-widest">
              Digital Assets
            </span>
          </h1>
          <p className="text-slate-500 dark:text-teal-400 text-xs mt-1">
            Armazenamento unificado, controle de versão e organização em categorias exclusivas para seu Workspace.
          </p>
        </div>

        <button
          onClick={() => {
            setUploadMode('create');
            setFileName('');
            setUploadNote('');
            setFileCategory('logos');
            setFileUrl('');
            setFormClientId(clients[0]?.id || '');
            setIsUploadOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#ffd700] text-[#114455] hover:bg-[#ffed4a] transition-all shadow-md self-start xl:self-center cursor-pointer font-sans"
        >
          <Upload size={14} />
          <span>Fazer Upload</span>
        </button>
      </div>

      {/* Storage stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 text-left">
          <div className="p-3 bg-[#114455]/10 text-[#114455] dark:text-[#ffd700] rounded-xl">
            <HardDrive size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Espaço Utilizado</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">46.5 MB</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 text-left">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total de Arquivos</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">{filteredFiles.length} itens</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 text-left">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <History size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Última Atualização</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">Hoje às 11:42</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 text-left">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <Layers size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Formatos Ativos</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">PNG, JPG, PDF, MP4</span>
          </div>
        </div>
      </div>

      {/* Control ribbon with search & filtering */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 text-left">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Buscar por nome, proprietário ou palavra-chave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none font-medium"
            />
          </div>

          {/* Filters Area */}
          <div className="flex flex-wrap items-center gap-3">
            {currentUser?.role === 'admin' && (
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-[#ffd700]" />
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white font-medium focus:outline-none"
                >
                  <option value="todos">Todos os Clientes</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-[#ffd700]" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white font-medium focus:outline-none"
              >
                <option value="todos">Todas as Categorias</option>
                <option value="logos">Logos</option>
                <option value="identidade_visual">Identidade Visual</option>
                <option value="fotos">Fotos</option>
                <option value="videos">Vídeos</option>
                <option value="documentos">Documentos</option>
                <option value="contratos">Contratos</option>
                <option value="relatorios">Relatórios</option>
                <option value="marketing">Materiais de Marketing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Fast Filter Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'todos'
                ? 'bg-[#114455] text-white'
                : 'bg-slate-100 dark:bg-slate-850 text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Ver Tudo
          </button>
          {Object.entries(CATEGORY_META).map(([key, value]) => {
            const CatIcon = value.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  selectedCategory === key
                    ? 'bg-[#114455] text-white'
                    : 'bg-slate-100 dark:bg-slate-850 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <CatIcon size={12} />
                <span>{value.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN FILES GRID AND EMPTY STATE */}
      <div className="space-y-4">
        {filteredFiles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl py-16 px-4 text-center space-y-3">
            <FolderOpen size={48} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-800 dark:text-white">Nenhum arquivo encontrado</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Experimente alterar os filtros selecionados ou digite um termo diferente no buscador.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredFiles.map((file) => {
              const meta = CATEGORY_META[file.category] || { label: 'Arquivo', icon: File, color: 'text-slate-500 bg-slate-500/10' };
              const Icon = meta.icon;
              const isImage = file.type.startsWith('image/');
              
              return (
                <motion.div
                  key={file.id}
                  layoutId={`file-card-${file.id}`}
                  onClick={() => {
                    setSelectedFile(file);
                    setIsPreviewOpen(true);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between text-left"
                >
                  {/* Visual frame based on format */}
                  <div className="aspect-video relative bg-slate-100 dark:bg-slate-950/40 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800">
                    {isImage ? (
                      <img 
                        src={file.fileUrl} 
                        alt={file.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <span className={`p-3.5 rounded-full ${meta.color}`}>
                          <Icon size={24} />
                        </span>
                        <span className="text-[10px] font-mono tracking-widest uppercase">{file.type.split('/')[1] || 'DOC'}</span>
                      </div>
                    )}

                    {/* Version Badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-mono px-2 py-0.5 rounded-full border border-white/10">
                      V{file.version}
                    </div>

                    {/* Category Label badge */}
                    <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-[9px] font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                      <Icon size={10} className="text-[#114455] dark:text-[#ffd700]" />
                      <span className="text-slate-700 dark:text-slate-300">{meta.label}</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-3">
                    <div className="space-y-0.5">
                      {currentUser?.role === 'admin' && (
                        <span className="text-[9px] text-[#ffd700] bg-[#114455]/20 dark:bg-[#ffd700]/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider block w-fit mb-1">
                          {file.clientName}
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1" title={file.name}>
                        {file.name}
                      </h4>
                    </div>

                    {/* Metadata line */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>{file.size}</span>
                      <span className="flex items-center gap-1 font-mono text-[9px]">
                        <Clock size={10} />
                        {new Date(file.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Quick trigger footer */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-850/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <User size={10} />
                      <span className="truncate">{file.uploadedBy}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file);
                        }}
                        className="p-1 hover:text-[#114455] dark:hover:text-[#ffd700] rounded transition-all cursor-pointer"
                        title="Download"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMPREHENSIVE FILE PREVIEW MODAL */}
      <AnimatePresence>
        {isPreviewOpen && selectedFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              layoutId={`file-card-${selectedFile.id}`}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-4xl w-full border border-slate-150 dark:border-slate-800 shadow-2xl text-left my-8"
            >
              {/* Modal Banner */}
              <div className="p-6 bg-[#08222a] border-b border-slate-800 text-white flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-[#ffd700] text-[#114455] rounded">
                      Categoria: {CATEGORY_META[selectedFile.category]?.label || 'Outros'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Versão Ativa V{selectedFile.version}</span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-white truncate max-w-md sm:max-w-xl">{selectedFile.name}</h3>
                  <p className="text-xs text-teal-400">Workspace de Parceria: {selectedFile.clientName}</p>
                </div>
                
                <button 
                  onClick={() => setIsPreviewOpen(false)} 
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800/80 rounded-full transition-all cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Two Column Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800 max-h-[75vh] overflow-y-auto">
                
                {/* Visual Preview Half */}
                <div className="lg:col-span-7 p-6 space-y-4 bg-slate-50 dark:bg-slate-950/20">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Painel de Pré-Visualização</span>

                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-900 flex items-center justify-center relative shadow-sm">
                    {selectedFile.type.startsWith('image/') ? (
                      <img 
                        src={selectedFile.fileUrl} 
                        alt={selectedFile.name}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : selectedFile.type.startsWith('video/') ? (
                      <video 
                        src={selectedFile.fileUrl} 
                        className="w-full h-full object-contain"
                        controls
                        playsInline
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-400 p-6 text-center">
                        <FileText size={48} className="text-[#ffd700]" />
                        <div>
                          <p className="text-xs font-bold text-white">{selectedFile.name}</p>
                          <p className="text-[10px] text-slate-400">Tipo de arquivo: {selectedFile.type}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleDownloadFile(selectedFile)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#114455] text-white hover:bg-[#114455]/90 text-xs font-bold rounded-xl transition-all shadow cursor-pointer font-sans"
                    >
                      <Download size={14} className="text-[#ffd700]" />
                      <span>Fazer Download</span>
                    </button>

                    <button
                      onClick={() => {
                        setUploadMode('version');
                        setFileName(selectedFile.name);
                        setFileSize(selectedFile.size);
                        setFileType(selectedFile.type);
                        setFileUrl('');
                        setIsUploadOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#ffd700] text-[#114455] hover:bg-[#ffed4a] text-xs font-bold rounded-xl transition-all shadow cursor-pointer font-sans"
                    >
                      <RefreshCw size={14} />
                      <span>Atualizar Versão (V{selectedFile.version + 1})</span>
                    </button>

                    <button
                      onClick={() => handleDeleteFile(selectedFile.id)}
                      className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer"
                      title="Excluir Arquivo"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* File History & Details Half */}
                <div className="lg:col-span-5 p-6 space-y-6">
                  {/* Info table */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Informações Gerais</span>
                    
                    <div className="bg-slate-50 dark:bg-slate-850/60 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span>Tamanho:</span>
                        <strong className="text-slate-800 dark:text-white">{selectedFile.size}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Formato MIME:</span>
                        <strong className="text-slate-800 dark:text-white">{selectedFile.type}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Enviado por:</span>
                        <strong className="text-slate-800 dark:text-white">{selectedFile.uploadedBy}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Criado em:</span>
                        <strong className="text-slate-800 dark:text-white">{new Date(selectedFile.createdAt).toLocaleString('pt-BR')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* History log block */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <History size={13} className="text-[#ffd700]" />
                      Histórico de Versões
                    </span>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {selectedFile.history.map((rev) => (
                        <div 
                          key={rev.id} 
                          className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl text-xs border border-slate-150 dark:border-slate-800 flex flex-col gap-1.5 text-left"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-800 dark:text-white">Versão V{rev.version}</span>
                            <span className="text-[9px] font-mono text-slate-400">{new Date(rev.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 italic">
                            "{rev.note}"
                          </p>
                          
                          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                            <span>Uploader: <strong>{rev.uploadedBy}</strong></span>
                            <span>{rev.size}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMPREHENSIVE UPLOAD FORM & PRESENTS CARDS */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden max-w-lg w-full border border-slate-150 dark:border-slate-800 shadow-2xl text-left my-8"
            >
              {/* Modal Banner */}
              <div className="p-5 bg-[#08222a] border-b border-slate-800 text-white flex items-center justify-between">
                <h3 className="text-md font-bold text-white font-display flex items-center gap-2">
                  <Upload size={16} className="text-[#ffd700]" />
                  {uploadMode === 'version' ? `Atualizar Versão (V${(selectedFile?.version || 1) + 1})` : 'Adicionar Novo Arquivo no Workspace'}
                </h3>
                <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white cursor-pointer font-bold">
                  ✕
                </button>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleUploadFile} className="p-6 space-y-4">
                
                {/* Interactive Drag & Drop Box */}
                {uploadMode === 'create' && (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2 relative cursor-pointer ${
                      dragActive 
                        ? 'border-[#ffd700] bg-[#114455]/10' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-[#ffd700] bg-slate-50 dark:bg-slate-850/50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={onFileSelectChange}
                      className="hidden"
                    />
                    <Upload size={28} className="text-slate-400 animate-pulse" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Arraste e solte ou <span className="text-[#ffd700] underline">clique para selecionar</span>
                      </p>
                      <p className="text-[10px] text-slate-400">Identidade Visual, Contratos, Fotos, Logos, Relatórios</p>
                    </div>
                    <span className="text-[9px] text-[#ffd700] bg-[#114455] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest font-mono">
                      Upload Local do Computador
                    </span>
                  </div>
                )}

                {/* Presets Grid */}
                {uploadMode === 'create' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Usar Preset Demonstrador</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1">
                      {samplePresets.map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectPreset(p)}
                          className={`p-2 rounded-xl border text-[10px] text-left font-semibold truncate transition-all cursor-pointer flex flex-col justify-between ${
                            fileName === p.name ? 'border-[#ffd700] bg-[#114455]/15 text-[#ffd700]' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          <span className="truncate w-full font-bold">{p.name}</span>
                          <span className="text-[8px] opacity-75">{CATEGORY_META[p.category].label} • {p.size}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* File Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Nome do Arquivo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: manual_da_marca.pdf"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none"
                      />
                    </div>

                    {/* Category */}
                    {uploadMode === 'create' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block">Categoria *</label>
                        <select
                          value={fileCategory}
                          onChange={(e) => setFileCategory(e.target.value as FileCategory)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none"
                        >
                          <option value="logos">Logos</option>
                          <option value="identidade_visual">Identidade Visual</option>
                          <option value="fotos">Fotos</option>
                          <option value="videos">Vídeos</option>
                          <option value="documentos">Documentos</option>
                          <option value="contratos">Contratos</option>
                          <option value="relatorios">Relatórios</option>
                          <option value="marketing">Materiais de Marketing</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* File Size */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Tamanho (Ex: 1.2 MB) *</label>
                      <input
                        type="text"
                        required
                        placeholder="1.2 MB"
                        value={fileSize}
                        onChange={(e) => setFileSize(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none"
                      />
                    </div>

                    {/* File Type MIME */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">MIME Type (Ex: image/png) *</label>
                      <input
                        type="text"
                        required
                        placeholder="application/pdf"
                        value={fileType}
                        onChange={(e) => setFileType(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Manual File URL */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Link da Mídia / Mock URL *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://..."
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none"
                    />
                  </div>

                  {/* Client Workspace Selector (Admin ONLY) */}
                  {uploadMode === 'create' && currentUser?.role === 'admin' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Vincular ao Cliente *</label>
                      <select
                        value={formClientId}
                        onChange={(e) => setFormClientId(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none"
                      >
                        <option value="">Selecione um cliente...</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.companyName}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Note / Change description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      {uploadMode === 'version' ? 'O que mudou nesta versão? *' : 'Notas do Upload (Opcional)'}
                    </label>
                    <input
                      type="text"
                      required={uploadMode === 'version'}
                      placeholder={uploadMode === 'version' ? "Ex: Correção de cores na paleta" : "Notas explicativas..."}
                      value={uploadNote}
                      onChange={(e) => setUploadNote(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white text-center cursor-pointer font-sans"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#114455] text-white hover:bg-[#114455]/95 text-xs font-bold text-center cursor-pointer font-sans"
                  >
                    Salvar Arquivo
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM DELETE FILE MODAL */}
      {deleteConfirmId && fileToDelete && (
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
                  Excluir Arquivo
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tem certeza de que deseja excluir permanentemente o arquivo <strong className="text-rose-500 dark:text-rose-400">"{fileToDelete.name}"</strong> e todo o seu histórico de versões? Esta ação não pode ser revertida.
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
                  onClick={confirmDeleteFile}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Sim, Excluir Arquivo
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
