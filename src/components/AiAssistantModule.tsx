import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { CRMClient, ContentItem, ContentStatus } from '../types';
import { 
  Sparkles, 
  Send, 
  Bot, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Calendar, 
  Folder, 
  Palette, 
  Key, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Clock, 
  Plus, 
  LayoutTemplate, 
  MessageSquare, 
  Settings, 
  FileText, 
  Loader2, 
  ArrowRight, 
  Sliders, 
  ExternalLink,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Award,
  Video,
  FileCheck2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Integration interface
interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'social' | 'workspace' | 'design' | 'api';
  status: 'connected' | 'disconnected';
  config: {
    accessToken?: string;
    pageId?: string;
    apiKey?: string;
    folderId?: string;
    calendarId?: string;
  };
}

// Preset prompts for the chat
const PRESET_PROMPTS = [
  "Como atrair mais clientes para o salão nas terças-feiras?",
  "Ideias de posts sobre tratamentos faciais para o frio",
  "Roteiro de Reels rápido de 15 segundos para estética",
  "Esboço de campanha de anúncios com baixo orçamento"
];

export const AiAssistantModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'chat' | 'integrations'>('generate');
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  // Content generator states
  const [selectedTool, setSelectedTool] = useState<string>('caption');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('profissional e amigável');
  const [network, setNetwork] = useState('Instagram');
  const [audience, setAudience] = useState('clientes do salão');
  const [ideasPlatform, setIdeasPlatform] = useState('Instagram');
  const [ideasGoal, setIdeasGoal] = useState('engajamento e conexão');
  const [stratObjectives, setStratObjectives] = useState('aumento de faturamento');
  const [stratBudget, setStratBudget] = useState('médio');
  const [scriptPlatform, setScriptPlatform] = useState('Instagram Reels');
  const [scriptGoal, setScriptGoal] = useState('venda/conversão');
  const [scriptDuration, setScriptDuration] = useState('60 segundos');
  const [adBenefit, setAdBenefit] = useState('resultado imediato e seguro');
  const [adOffer, setAdOffer] = useState('Desconto de 15% na primeira visita');
  const [tagQty, setTagQty] = useState('15');
  const [summaryReport, setSummaryReport] = useState('');
  const [summaryLength, setSummaryLength] = useState('detalhado');
  const [summaryFocus, setSummaryFocus] = useState('métricas chaves e plano de ação');

  // Generation status states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [generationSource, setGenerationSource] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Chat states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{sender: 'user' | 'assistant', text: string, time: string}[]>([
    { 
      sender: 'assistant', 
      text: 'Olá! Sou seu co-piloto de marketing no Aparato OS. Posso te ajudar a redigir copys, criar pautas, desenhar estratégias ou analisar os relatórios. O que vamos criar hoje?', 
      time: '12:00' 
    }
  ]);
  const [chatGenerating, setChatGenerating] = useState(false);

  // Integration Hub States
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: 'instagram', name: 'Instagram Professional', description: 'Publique, agende e analise suas métricas de feed e reels.', icon: Instagram, category: 'social', status: 'connected', config: { accessToken: 'ig_prod_9981248', pageId: 'aparato.beauty' } },
    { id: 'facebook', name: 'Facebook Pages', description: 'Sincronize campanhas de anúncios e publicações de feed direto nas suas páginas.', icon: Facebook, category: 'social', status: 'connected', config: { accessToken: 'fb_prod_8827361', pageId: '109283719283' } },
    { id: 'linkedin', name: 'LinkedIn Company', description: 'Divulgue novidades corporativas e estratégias de posicionamento b2b.', icon: Linkedin, category: 'social', status: 'disconnected', config: {} },
    { id: 'tiktok', name: 'TikTok for Business', description: 'Automatize agendamentos de vídeos curtos diretamente no perfil comercial.', icon: Video, category: 'social', status: 'disconnected', config: {} },
    { id: 'gdrive', name: 'Google Drive', description: 'Exporte relatórios gerados por IA e salve seus criativos em pastas compartilhadas.', icon: Folder, category: 'workspace', status: 'connected', config: { folderId: 'gdrive_folder_aparato_marketing' } },
    { id: 'gcal', name: 'Google Calendar', description: 'Agende postagens geradas por IA diretamente no seu calendário editorial pessoal.', icon: Calendar, category: 'workspace', status: 'connected', config: { calendarId: 'aparatosalao@gmail.com' } },
    { id: 'canva', name: 'Canva', description: 'Abra layouts do Canva diretamente no Aparato para criar artes a partir das copys geradas.', icon: Palette, category: 'design', status: 'connected', config: { apiKey: 'can_client_991823' } },
    { id: 'openai', name: 'OpenAI API', description: 'Utilize o modelo GPT-4o como motor alternativo de escrita para suas copys.', icon: Key, category: 'api', status: 'disconnected', config: {} }
  ]);

  // Modals / Overlays
  const [showConfigModal, setShowConfigModal] = useState<Integration | null>(null);
  const [configFields, setConfigFields] = useState<{ [key: string]: string }>({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean, msg: string } | null>(null);
  
  // Canva Design Drawer
  const [showCanvaDrawer, setShowCanvaDrawer] = useState(false);
  const [canvaBannerType, setCanvaBannerType] = useState('feed'); // feed, stories, banner

  // Scheduler Modal
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [schedTitle, setSchedTitle] = useState('');
  const [schedDate, setSchedDate] = useState('2026-07-20');
  const [schedStatus, setSchedStatus] = useState<ContentStatus>('rascunho');

  // Load clients
  useEffect(() => {
    const allClients = StorageService.getClients();
    setClients(allClients);
    if (allClients.length > 0) {
      if (currentUser?.role === 'client') {
        const clientMatch = allClients.find(c => c.id === currentUser.id);
        if (clientMatch) setSelectedClientId(clientMatch.id);
      } else {
        setSelectedClientId(allClients[0].id);
      }
    }
  }, [currentUser]);

  // Autoselect tool default placeholders to help user understand
  useEffect(() => {
    if (selectedTool === 'caption') {
      setTopic('Hidratação Profunda de Óleo de Argan');
    } else if (selectedTool === 'ideas') {
      setTopic('Estética Corporal e Drenagem Linfática');
    } else if (selectedTool === 'strategy') {
      setTopic('Clínica de Estética e Salão Premium');
    } else if (selectedTool === 'script') {
      setTopic('3 Erros comuns ao lavar o cabelo em casa');
    } else if (selectedTool === 'adCopy') {
      setTopic('Design de Sobrancelhas com Henna');
    } else if (selectedTool === 'hashtags') {
      setTopic('Cronograma Capilar');
    } else if (selectedTool === 'summary') {
      setTopic('Relatório trimestral');
      // Autofill rawText with fake report if empty
      setSummaryReport(`--- RELATÓRIO DE DESEMPENHO TRIMESTRAL (BELEZA ESTILO) ---
Período: Abril - Junho 2026
Alcance total nas redes: 45.000 pessoas (+12% vs trimestre anterior)
Visualizações de vídeos (Reels): 120.000 visualizações
Novos Agendamentos de Estética: 340 agendamentos diretos via Instagram
Serviço mais procurado: Drenagem corporal modeladora e Limpeza de Pele VIP
Custo por Clique (CPC): R$ 0,85 (Redução de 15% após novos criativos em vídeo)
Taxa de rejeição do site de agendamento: 42% (considerado alto, lentidão no celular)`);
    }
  }, [selectedTool]);

  const handleCopyText = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate content using express server Gemini route
  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setGeneratedResult('');
    setGenerationSource('');

    const activeClient = clients.find(c => c.id === selectedClientId);

    // Build tool-specific options
    let options: any = { topic };

    if (selectedTool === 'caption') {
      options = { topic, tone, network, audience };
    } else if (selectedTool === 'ideas') {
      options = { topic, platform: ideasPlatform, goal: ideasGoal };
    } else if (selectedTool === 'strategy') {
      options = { topic, objectives: stratObjectives, budget: stratBudget, targetAudience: audience };
    } else if (selectedTool === 'script') {
      options = { topic, platform: scriptPlatform, videoGoal: scriptGoal, duration: scriptDuration };
    } else if (selectedTool === 'adCopy') {
      options = { topic, mainBenefit: adBenefit, network, targetAudience: audience, offer: adOffer };
    } else if (selectedTool === 'hashtags') {
      options = { topic, platform: ideasPlatform, quantity: tagQty };
    } else if (selectedTool === 'summary') {
      options = { rawText: summaryReport, summaryLength, focalPoints: summaryFocus };
    }

    try {
      const response = await fetch('/api/marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedTool,
          prompt: topic,
          options
        })
      });

      const data = await response.json();
      if (data.text) {
        setGeneratedResult(data.text);
        setGenerationSource(data.source === 'gemini' ? 'Gemini 3.5' : 'Simulador de IA');
      } else {
        setGeneratedResult('Desculpe, ocorreu um erro inesperado ao conectar ao servidor.');
      }
    } catch (err: any) {
      console.error(err);
      setGeneratedResult('Erro de conexão. Verifique sua rede e tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Send message in general chat
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user' as const, text: textToSend, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatGenerating(true);

    try {
      const response = await fetch('/api/marketing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          prompt: textToSend
        })
      });

      const data = await response.json();
      
      const assistantMsg = {
        sender: 'assistant' as const,
        text: data.text || 'Não consegui processar a resposta.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev, 
        { sender: 'assistant', text: 'Ocorreu um erro de conexão ao tentar falar com o assistente.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } finally {
      setChatGenerating(false);
    }
  };

  // Toggle Integration status locally
  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'connected' ? 'disconnected' : 'connected';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  // Open integration settings modal
  const openIntegrationConfig = (integration: Integration) => {
    setShowConfigModal(integration);
    setConfigFields({
      accessToken: integration.config.accessToken || '',
      pageId: integration.config.pageId || '',
      apiKey: integration.config.apiKey || '',
      folderId: integration.config.folderId || '',
      calendarId: integration.config.calendarId || '',
    });
    setTestResult(null);
  };

  // Save integration configuration & test
  const handleSaveAndTestConfig = async () => {
    if (!showConfigModal) return;
    setIsTestingConnection(true);
    setTestResult(null);

    // Simulate real connection test latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isApiKeyFieldOnly = ['openai', 'canva'].includes(showConfigModal.id);
    const hasValues = isApiKeyFieldOnly ? !!configFields.apiKey : (!!configFields.accessToken || !!configFields.folderId || !!configFields.calendarId);

    if (hasValues) {
      setTestResult({
        success: true,
        msg: `Conexão bem sucedida com o provedor do ${showConfigModal.name}! Autenticado com sucesso.`
      });

      // Mark integrated in state
      setIntegrations(prev => prev.map(item => {
        if (item.id === showConfigModal.id) {
          return {
            ...item,
            status: 'connected',
            config: {
              ...item.config,
              ...configFields
            }
          };
        }
        return item;
      }));
    } else {
      setTestResult({
        success: false,
        msg: 'Erro ao conectar: Preencha as credenciais obrigatórias para prosseguir.'
      });
    }
    setIsTestingConnection(false);
  };

  // Schedule content in database
  const handleSchedulePost = () => {
    const activeClient = clients.find(c => c.id === selectedClientId);
    if (!activeClient) return;

    const newPost: ContentItem = {
      id: `cont-${Date.now()}`,
      title: schedTitle || `Post IA: ${topic.substring(0, 30)}...`,
      description: `Conteúdo gerado por IA para o canal ${network}`,
      platform: network === 'Instagram' ? 'Instagram' : network === 'LinkedIn' ? 'LinkedIn' : network === 'Facebook' ? 'Facebook' : 'Outro',
      caption: generatedResult,
      responsiblePerson: currentUser?.name || 'IA Marketing Assistant',
      publicationDate: schedDate,
      status: schedStatus,
      clientId: activeClient.id,
      clientName: activeClient.companyName,
      createdAt: new Date().toISOString()
    };

    StorageService.saveContentItem(newPost);
    setShowSchedulerModal(false);
    
    // Add nice system notification
    StorageService.addNotification(
      currentUser?.id || 'all',
      'Post Agendado com Sucesso! 📅',
      `O post "${newPost.title}" foi criado no Calendário Editorial para o dia ${schedDate}.`,
      'system'
    );

    alert(`Sucesso! O post foi inserido no Calendário Editorial do cliente "${activeClient.companyName}".`);
  };

  const handleSimulateExportDrive = () => {
    alert(`Documento Exportado! 📁\n\nO arquivo "Aparato_Marketing_${selectedTool}_${Date.now().toString().slice(-4)}.md" foi criado na sua conta sincronizada do Google Drive.`);
  };

  const handleSimulateAddGoogleCalendar = () => {
    alert(`Lembrete Criado! 🗓️\n\nUm lembrete de agendamento de post foi adicionado ao Google Calendar vinculando o dia selecionado.`);
  };

  const isIntegrationActive = (id: string) => {
    const found = integrations.find(item => item.id === id);
    return found ? found.status === 'connected' : false;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d3441] to-[#164e63] rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={160} className="text-gold-200" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide text-brand-accent uppercase">
            <Sparkles size={14} className="animate-pulse text-yellow-400" />
            Co-Piloto Inteligente
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">
            Assistente de Marketing IA
          </h1>
          <p className="text-sm text-slate-200 leading-relaxed">
            Turbine o engajamento das redes sociais, desenhe funis estratégicos e gere copys incríveis para seus clientes e salões de beleza em poucos segundos usando IA avançada.
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl max-w-md">
        <button
          onClick={() => setActiveSubTab('generate')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'generate'
              ? 'bg-white dark:bg-slate-800 text-[#164e63] shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <LayoutTemplate size={16} />
            <span>Gerador IA</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'chat'
              ? 'bg-white dark:bg-slate-800 text-[#164e63] shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare size={16} />
            <span>Chat IA</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('integrations')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'integrations'
              ? 'bg-white dark:bg-slate-800 text-[#164e63] shadow-sm font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Sliders size={16} />
            <span>Integrações</span>
          </div>
        </button>
      </div>

      {/* TAB 1: GENERATE CONTENT */}
      {activeSubTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Tool Selector & Form Inputs (Left) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Target Client & Network Settings Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={15} className="text-[#164e63]" />
                Configurações Gerais
              </h2>

              <div className="space-y-3">
                {currentUser?.role === 'admin' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Cliente Destino (CRM)
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#164e63]"
                    >
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.companyName}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Sua Empresa
                    </label>
                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">
                      {currentUser?.companyName || 'Meu Salão'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Selector Form */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Selecione a Ferramenta IA
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setSelectedTool('caption')}
                    className={`py-2 px-3 text-left rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                      selectedTool === 'caption'
                        ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 border-sky-200 dark:border-sky-900/50 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Instagram size={14} />
                    <span>Legendas Redes</span>
                  </button>
                  <button
                    onClick={() => setSelectedTool('ideas')}
                    className={`py-2 px-3 text-left rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                      selectedTool === 'ideas'
                        ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 border-sky-200 dark:border-sky-900/50 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <PlusCircle size={14} />
                    <span>Ideias de Conteúdo</span>
                  </button>
                  <button
                    onClick={() => setSelectedTool('strategy')}
                    className={`py-2 px-3 text-left rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                      selectedTool === 'strategy'
                        ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 border-sky-200 dark:border-sky-900/50 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <TrendingUp size={14} />
                    <span>Plano Estratégico</span>
                  </button>
                  <button
                    onClick={() => setSelectedTool('script')}
                    className={`py-2 px-3 text-left rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                      selectedTool === 'script'
                        ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 border-sky-200 dark:border-sky-900/50 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Video size={14} />
                    <span>Roteiro de Vídeo</span>
                  </button>
                  <button
                    onClick={() => setSelectedTool('adCopy')}
                    className={`py-2 px-3 text-left rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                      selectedTool === 'adCopy'
                        ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 border-sky-200 dark:border-sky-900/50 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Award size={14} />
                    <span>Copy de Anúncio</span>
                  </button>
                  <button
                    onClick={() => setSelectedTool('hashtags')}
                    className={`py-2 px-3 text-left rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                      selectedTool === 'hashtags'
                        ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 border-sky-200 dark:border-sky-900/50 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles size={14} />
                    <span>Gerar Hashtags</span>
                  </button>
                  <button
                    onClick={() => setSelectedTool('summary')}
                    className={`col-span-2 py-2 px-3 text-left rounded-lg text-xs font-medium flex items-center gap-2 border transition-all ${
                      selectedTool === 'summary'
                        ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600 border-sky-200 dark:border-sky-900/50 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FileText size={14} />
                    <span>Resumo de Relatório de Métricas</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs Form */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                
                {/* Topic / Offer field */}
                {selectedTool !== 'summary' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {selectedTool === 'adCopy' ? 'Produto ou Serviço Promovido' : 'Tema Central, Nicho ou Produto'}
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ex: Escova Orgânica, Limpeza de Pele, Massagem Relaxante..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#164e63]"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                        Insira os Dados Brutos do Relatório
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSummaryReport(`--- RELATÓRIO DO GOOGLE DRIVE (Aparato OS Studio) ---
Acessado em: 19 de Julho, 2026
Postagens no Instagram: 18 publicações
Taxa de Engajamento Médio: 4.8% (+0.5% vs semana anterior)
Leads de Agendamento convertidos: 114
Custo por clique médio (CPC): R$ 1,12
Problema crítico: Queda de tráfego orgânico no sábado.`);
                        }}
                        className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Folder size={10} />
                        Importar do Drive Sincronizado
                      </button>
                    </div>
                    <textarea
                      value={summaryReport}
                      onChange={(e) => setSummaryReport(e.target.value)}
                      rows={5}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#164e63] font-mono leading-relaxed"
                      placeholder="Cole dados de visitas, CTR, agendamentos, custos ou outros relatórios para resumir..."
                    />
                  </div>
                )}

                {/* Conditional fields - Social Media & Captions */}
                {selectedTool === 'caption' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tom de Voz</label>
                      <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="profissional e amigável">Profissional & Amigável</option>
                        <option value="extremamente persuasivo">Persuasivo & Marcante</option>
                        <option value="descontraído e humorado">Descontraído & Divertido</option>
                        <option value="sofisticado e luxuoso">Sofisticado & Exclusivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rede Social</label>
                      <select value={network} onChange={(e) => setNetwork(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="TikTok">TikTok</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Content Ideas */}
                {selectedTool === 'ideas' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Plataforma Canal</label>
                      <select value={ideasPlatform} onChange={(e) => setIdeasPlatform(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="Instagram Feed">Instagram Feed</option>
                        <option value="Instagram Stories">Instagram Stories</option>
                        <option value="TikTok/Reels">Vídeo Curto (Reels/TikTok)</option>
                        <option value="Pinterest">Pinterest</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Objetivo Editorial</label>
                      <select value={ideasGoal} onChange={(e) => setIdeasGoal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="engajamento e conexão">Engajamento & Interação</option>
                        <option value="venda e agendamentos">Conversão & Vendas</option>
                        <option value="educar a audiência">Educativo & Autoridade</option>
                        <option value="vencer objeções">Quebra de Objeções</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Strategy */}
                {selectedTool === 'strategy' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Objetivo Estratégico</label>
                      <select value={stratObjectives} onChange={(e) => setStratObjectives(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="aumento de faturamento">Aumento de Faturamento</option>
                        <option value="atração de novos clientes">Atração de Clientes Novos</option>
                        <option value="fidelização e recorrência">Fidelização & Recorrência</option>
                        <option value="branding e reconhecimento">Reconhecimento de Marca</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Orçamento Estimado</label>
                      <select value={stratBudget} onChange={(e) => setStratBudget(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="baixo">Baixo (Até R$ 500/mês)</option>
                        <option value="médio">Médio (R$ 500 - R$ 2.000/mês)</option>
                        <option value="alto">Alto (Mais de R$ 2.000/mês)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Video Scripts */}
                {selectedTool === 'script' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Formato</label>
                      <select value={scriptPlatform} onChange={(e) => setScriptPlatform(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="Instagram Reels">Reels</option>
                        <option value="TikTok">TikTok</option>
                        <option value="YouTube Shorts">Shorts</option>
                        <option value="YouTube Longo">YouTube Longo</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Objetivo</label>
                      <select value={scriptGoal} onChange={(e) => setScriptGoal(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="venda/conversão">Venda direta</option>
                        <option value="educativo/viral">Viralização</option>
                        <option value="conexão/autoridade">Estilo de Vida</option>
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Duração</label>
                      <select value={scriptDuration} onChange={(e) => setScriptDuration(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="15 segundos">15s</option>
                        <option value="30 segundos">30s</option>
                        <option value="60 segundos">60s</option>
                        <option value="90 segundos">90s</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Ad Copy */}
                {selectedTool === 'adCopy' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Benefício Chave do Serviço</label>
                      <input
                        type="text"
                        value={adBenefit}
                        onChange={(e) => setAdBenefit(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#164e63]"
                        placeholder="Ex: fios brilhosos sem frizz, massagem relaxadora rápida..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Oferta de Entrada / CTA</label>
                      <input
                        type="text"
                        value={adOffer}
                        onChange={(e) => setAdOffer(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#164e63]"
                        placeholder="Ex: Hidratação grátis agendando hoje, 15% de bônus..."
                      />
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                {selectedTool === 'hashtags' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rede / Algoritmo</label>
                      <select value={ideasPlatform} onChange={(e) => setIdeasPlatform(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Facebook">Facebook</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Quantidade</label>
                      <select value={tagQty} onChange={(e) => setTagQty(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="10">10 hashtags</option>
                        <option value="15">15 hashtags</option>
                        <option value="20">20 hashtags</option>
                        <option value="30">30 hashtags</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Summary Settings */}
                {selectedTool === 'summary' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tamanho do Resumo</label>
                      <select value={summaryLength} onChange={(e) => setSummaryLength(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                        <option value="direto">Curto e Executivo (Direto ao ponto)</option>
                        <option value="detalhado">Completo (Com análises de canais)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Foco de Análise</label>
                      <input
                        type="text"
                        value={summaryFocus}
                        onChange={(e) => setSummaryFocus(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#164e63]"
                        placeholder="Ex: Gargalos de custo, ROAS..."
                      />
                    </div>
                  </div>
                )}

                {/* General Audience field for tools that need target persona */}
                {['caption', 'strategy', 'adCopy'].includes(selectedTool) && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Público-Alvo Específico</label>
                    <input
                      type="text"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="Ex: Mulheres entre 25 e 45 anos, mães ocupadas..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#164e63]"
                    />
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerateContent}
                disabled={isGenerating || (!topic && selectedTool !== 'summary')}
                className="w-full py-2.5 px-4 bg-[#164e63] hover:bg-[#0d3441] disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-medium rounded-lg text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Gerando Copy com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="text-yellow-400" />
                    <span>Gerar com Inteligência Artificial</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Card Viewer (Right) */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Bot className="text-[#164e63]" size={18} />
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Resultado Gerado por IA
                  </span>
                  {generationSource && (
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded border border-emerald-100 dark:border-emerald-900/50">
                      Motor: {isIntegrationActive('openai') ? 'OpenAI GPT-4o' : generationSource}
                    </span>
                  )}
                </div>

                {generatedResult && (
                  <button
                    onClick={() => handleCopyText(generatedResult)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-[#164e63] dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Text Body / Content Area */}
              <div className="flex-1 p-6 overflow-y-auto min-h-[300px] flex flex-col justify-between">
                {generatedResult ? (
                  <div className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                      {generatedResult}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-600 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Nenhum conteúdo gerado ainda</p>
                      <p className="text-xs max-w-xs mt-1">Preencha os campos e selecione uma ferramenta de IA à esquerda para impulsionar suas campanhas.</p>
                    </div>
                  </div>
                )}

                {/* Quick Integrations Workflows inside Generation */}
                {generatedResult && (
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Ações de Integração de Canal
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          setSchedTitle(`IA Post: ${topic.substring(0, 20)}`);
                          setShowSchedulerModal(true);
                        }}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Calendar size={13} className="text-purple-500" />
                        Agendar Post
                      </button>

                      <button
                        onClick={handleSimulateExportDrive}
                        disabled={!isIntegrationActive('gdrive')}
                        className={`py-1.5 px-2 border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isIntegrationActive('gdrive')
                            ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            : 'bg-slate-100 dark:bg-slate-900/50 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Folder size={13} className={isIntegrationActive('gdrive') ? 'text-blue-500' : 'text-slate-400'} />
                        Salvar no Drive
                      </button>

                      <button
                        onClick={handleSimulateAddGoogleCalendar}
                        disabled={!isIntegrationActive('gcal')}
                        className={`py-1.5 px-2 border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isIntegrationActive('gcal')
                            ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            : 'bg-slate-100 dark:bg-slate-900/50 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Clock size={13} className={isIntegrationActive('gcal') ? 'text-emerald-500' : 'text-slate-400'} />
                        Add Google Cal
                      </button>

                      <button
                        onClick={() => {
                          if (isIntegrationActive('canva')) {
                            setShowCanvaDrawer(true);
                          } else {
                            alert('Habilite a integração do Canva no painel de Integrações primeiro!');
                          }
                        }}
                        className={`py-1.5 px-2 border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isIntegrationActive('canva')
                            ? 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            : 'bg-slate-100 dark:bg-slate-900/50 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Palette size={13} className={isIntegrationActive('canva') ? 'text-pink-500' : 'text-slate-400'} />
                        Criar no Canva
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI INTERACTIVE CHAT */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Preset Suggestions & Core prompt instructions (Left) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wide">
                <Sparkles size={15} className="text-[#164e63]" />
                Sugestões de Prompts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Clique em uma pauta recomendada abaixo para iniciar uma consulta rápida com o Assistente de IA do Aparato OS:
              </p>
              
              <div className="space-y-2 pt-1">
                {PRESET_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    disabled={chatGenerating}
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 transition-colors block cursor-pointer hover:border-slate-300 leading-normal"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Como usar o Chat IA</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Você pode pedir ideias de marketing local, sugestão de promoções relâmpago, redação de mensagens para reativação de clientes no WhatsApp, e conselhos de SEO para o site do seu salão de beleza.
              </p>
            </div>
          </div>

          {/* Interactive Live Chat Screen (Right) */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-[520px] flex flex-col justify-between overflow-hidden">
              {/* Chat Title bar */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#164e63] flex items-center justify-center text-white shrink-0">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Suporte Editorial IA</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Ativo • Motor Gemini 3.5 Flash
                  </p>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-2.5 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {msg.sender === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-[#164e63] text-white flex items-center justify-center shrink-0">
                          <Bot size={13} />
                        </div>
                      )}
                      <div>
                        <div className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                          msg.sender === 'user'
                            ? 'bg-[#164e63] text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-800'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 block px-1">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {chatGenerating && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2.5 max-w-[80%]">
                      <div className="w-7 h-7 rounded-full bg-[#164e63] text-white flex items-center justify-center shrink-0">
                        <Bot size={13} />
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl rounded-tl-none px-4 py-2.5 border border-slate-200/50 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <Loader2 size={12} className="animate-spin" />
                          <span>Pensando na estratégia ideal...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form Footer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(chatInput);
                }}
                className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatGenerating}
                  placeholder="Pergunte qualquer coisa sobre sua estratégia de marketing..."
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#164e63] placeholder-slate-400 dark:placeholder-slate-600"
                />
                <button
                  type="submit"
                  disabled={chatGenerating || !chatInput.trim()}
                  className="p-2.5 bg-[#164e63] hover:bg-[#0d3441] disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTEGRATION HUB */}
      {activeSubTab === 'integrations' && (
        <div className="space-y-6">
          {/* Header instructions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Hub de Integrações de Marketing
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
              Gerencie a conexão direta do Aparato OS com suas ferramentas de terceiros e redes de mídia social. Ao conectar as contas, você habilita fluxos automatizados como exportação de arquivos, agendamento de posts e o motor alternativo de escrita da OpenAI.
            </p>
          </div>

          {/* Integrations Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <div
                  key={integration.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Header line */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        integration.category === 'social' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500' :
                        integration.category === 'workspace' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-500' :
                        integration.category === 'design' ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-500' :
                        'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
                      }`}>
                        <Icon size={20} />
                      </div>

                      {/* Toggle status pill or toggle button */}
                      <button
                        onClick={() => toggleIntegration(integration.id)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors cursor-pointer ${
                          integration.status === 'connected'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {integration.status === 'connected' ? 'Conectado' : 'Inativo'}
                      </button>
                    </div>

                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      {integration.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                      {integration.description}
                    </p>
                  </div>

                  {/* Actions footer inside card */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                      {integration.category}
                    </span>
                    <button
                      onClick={() => openIntegrationConfig(integration)}
                      className="text-xs text-[#164e63] dark:text-[#4194b3] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Settings size={12} />
                      Configurar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: INTEGRATION SETUP */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/20 text-sky-600 flex items-center justify-center">
                  <Settings size={16} />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Configurar {showConfigModal.name}</h3>
                  <p className="text-[10px] text-slate-500">Credenciais e Integração API</p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfigModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Input Forms */}
            <div className="p-6 space-y-4">
              
              {/* Conditional Inputs */}
              {showConfigModal.category === 'social' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Access Token (Token de Acesso API)
                    </label>
                    <input
                      type="password"
                      value={configFields.accessToken || ''}
                      onChange={(e) => setConfigFields({ ...configFields, accessToken: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
                      placeholder="ig_prod_... ou fb_prod_..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      Identificador de Página / Perfil Comercial
                    </label>
                    <input
                      type="text"
                      value={configFields.pageId || ''}
                      onChange={(e) => setConfigFields({ ...configFields, pageId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
                      placeholder="@perfil_do_salao ou 1082736182"
                    />
                  </div>
                </>
              )}

              {showConfigModal.id === 'gdrive' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Google Folder ID (Pasta Destino)
                  </label>
                  <input
                    type="text"
                    value={configFields.folderId || ''}
                    onChange={(e) => setConfigFields({ ...configFields, folderId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="Nome da pasta ou Hash da ID"
                  />
                </div>
              )}

              {showConfigModal.id === 'gcal' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Google Calendar Account (E-mail)
                  </label>
                  <input
                    type="email"
                    value={configFields.calendarId || ''}
                    onChange={(e) => setConfigFields({ ...configFields, calendarId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="Ex: aparatosalao@gmail.com"
                  />
                </div>
              )}

              {['canva', 'openai'].includes(showConfigModal.id) && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Chave da API (Secret API Key)
                    </label>
                    {showConfigModal.id === 'openai' && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Lock size={10} /> Criptografado
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    value={configFields.apiKey || ''}
                    onChange={(e) => setConfigFields({ ...configFields, apiKey: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                    placeholder="Ex: sk-proj-... ou cn_client_..."
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Suas chaves são salvas localmente no navegador por motivos de segurança e nunca são expostas em logs públicos.
                  </p>
                </div>
              )}

              {/* Live Connection Test Results */}
              {testResult && (
                <div className={`p-3.5 rounded-lg border text-xs leading-normal flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-150 dark:border-emerald-900/30'
                    : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-150'
                }`}>
                  {testResult.success ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" /> : <XCircle size={16} className="shrink-0 text-red-500 mt-0.5" />}
                  <span>{testResult.msg}</span>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowConfigModal(null)}
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline"
              >
                Cancelar
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAndTestConfig}
                  disabled={isTestingConnection}
                  className="px-3.5 py-1.5 bg-[#164e63] hover:bg-[#0d3441] disabled:bg-slate-300 text-white font-medium rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Testando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={11} />
                      <span>Testar Conexão</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: CANVA DESIGN STUDIO OVERLAY */}
      {showCanvaDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="bg-white dark:bg-slate-900 h-full w-full max-w-3xl shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 bg-[#03121a] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#7c2ae8] to-[#00c4cc] flex items-center justify-center text-white font-black text-lg">
                  C
                </span>
                <div>
                  <h3 className="font-bold text-base">Canva Design Plugin</h3>
                  <p className="text-[10px] text-slate-300">Criador de Artes & Criativos de Beleza</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCanvaDrawer(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕ Fechar Canva
              </button>
            </div>

            {/* Design Body */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">1. Selecione o Tipo de Layout no Canva</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setCanvaBannerType('feed')}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        canvaBannerType === 'feed'
                          ? 'border-indigo-500 bg-indigo-50/10 text-indigo-600 font-bold text-xs'
                          : 'border-slate-200 text-slate-600 text-xs'
                      }`}
                    >
                      Feed Quadrado (1:1)
                    </button>
                    <button
                      onClick={() => setCanvaBannerType('stories')}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        canvaBannerType === 'stories'
                          ? 'border-indigo-500 bg-indigo-50/10 text-indigo-600 font-bold text-xs'
                          : 'border-slate-200 text-slate-600 text-xs'
                      }`}
                    >
                      Stories/Reels (9:16)
                    </button>
                    <button
                      onClick={() => setCanvaBannerType('banner')}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        canvaBannerType === 'banner'
                          ? 'border-indigo-500 bg-indigo-50/10 text-indigo-600 font-bold text-xs'
                          : 'border-slate-200 text-slate-600 text-xs'
                      }`}
                    >
                      Banner de Site (16:9)
                    </button>
                  </div>
                </div>

                {/* Canva mockup iframe element */}
                <div className="bg-slate-800 rounded-xl relative overflow-hidden flex flex-col items-center justify-center border-4 border-slate-700 shadow-lg" style={{ height: '360px' }}>
                  
                  {/* Canva mock interface */}
                  <div className="absolute top-0 left-0 right-0 bg-[#252b31] text-slate-300 text-[10px] px-3 py-1.5 flex items-center justify-between border-b border-slate-700">
                    <span className="font-bold flex items-center gap-1 text-white">
                      <Palette size={10} className="text-[#00c4cc]" /> Canva Editor Mockup
                    </span>
                    <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-100">Template Beleza Premium v4</span>
                  </div>

                  <div className="text-center p-6 space-y-3 z-10 max-w-sm text-white">
                    <div className="w-16 h-16 rounded-full bg-slate-900/60 mx-auto flex items-center justify-center text-pink-400">
                      <Palette size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">Visualização do Canva Ativada</p>
                      <p className="text-[11px] text-slate-400">O Canva carregou a paleta do salão e o rascunho de texto gerado pelo assistente.</p>
                    </div>

                    <div className="p-3 bg-slate-900/80 rounded border border-slate-700/50 text-[11px] font-mono leading-tight text-slate-300 text-left line-clamp-3">
                      "{topic}"
                    </div>
                  </div>

                  {/* Aesthetic grid overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Pronto para Exportar?</h4>
                  <p className="text-[10px] text-slate-500">Isso importará o criativo gerado diretamente no Gerenciador de Arquivos.</p>
                </div>
                <button
                  onClick={() => {
                    alert('Sucesso! O criativo do Canva foi renderizado e importado no Gerenciador de Arquivos do cliente como "criativo_IA_canva.png"');
                    setShowCanvaDrawer(false);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg text-xs transition-all shadow cursor-pointer"
                >
                  Salvar Design no Aparato
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: EDITORIAL CALENDAR SCHEDULER */}
      {showSchedulerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600 flex items-center justify-center">
                  <Calendar size={16} />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Agendar Post Editorial</h3>
                  <p className="text-[10px] text-slate-500">Insere o item no Calendário Integrado</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSchedulerModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Título da Publicação
                </label>
                <input
                  type="text"
                  value={schedTitle}
                  onChange={(e) => setSchedTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="Ex: Lançamento Hidratação de Argan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Data de Publicação
                  </label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={schedStatus}
                    onChange={(e) => setSchedStatus(e.target.value as ContentStatus)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="em_producao">Em Produção</option>
                    <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="agendado">Agendado</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Ao salvar, o Aparato OS associará a copy gerada por IA e o canal selecionado (<strong>{network}</strong>) ao perfil do cliente no calendário de pautas.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-150 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSchedulerModal(false)}
                className="text-xs font-medium text-slate-500 hover:underline mr-2"
              >
                Voltar
              </button>
              <button
                onClick={handleSchedulePost}
                className="px-4 py-1.5 bg-[#164e63] hover:bg-[#0d3441] text-white font-medium rounded-lg text-xs transition-all shadow"
              >
                Confirmar Agendamento
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
