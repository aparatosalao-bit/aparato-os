/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { CRMClient, ChatMessage, ChatAttachment, ChatAttachmentType, ChatConversation, ChatReaction } from '../types';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Mic, 
  Trash2, 
  MoreVertical, 
  Check, 
  CheckCheck, 
  Bell, 
  Volume2, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileText as FileIcon, 
  HelpCircle, 
  Users, 
  Circle, 
  Search, 
  X, 
  MessageSquare, 
  Phone, 
  Info,
  ChevronDown,
  Download,
  Flame,
  AlertCircle,
  Play,
  Pause,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Preset emojis for reactions picker
const PRESET_EMOJIS = ['👍', '❤️', '🔥', '🚀', '😂', '🎉', '😢', '🙏'];

// Predefined mock attachments to simulate uploads beautifully
const ATTACHMENT_PRESETS = [
  { name: 'logo_versao_horizontal.png', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', type: 'image' as const, size: '240 KB' },
  { name: 'video_campanha_teaser.mp4', url: 'https://assets.mixkit.co/videos/preview/mixkit-businesswoman-working-on-a-laptop-in-her-office-42352-large.mp4', type: 'video' as const, size: '8.4 MB' },
  { name: 'proposta_comercial_revisada.pdf', url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80', type: 'document' as const, size: '1.2 MB' },
];

export const ChatModule: React.FC = () => {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>(''); // clientId for the active chat
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // UI Inputs & Controls
  const [typedMessage, setTypedMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState<string | null>(null); // messageId for inline, or 'input' for main input
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
  
  // Voice Recording Emulation
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedWaves, setRecordedWaves] = useState<number[]>([]);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Connection State
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // In-app Notifications Toast queue
  const [toasts, setToasts] = useState<{ id: string; sender: string; text: string }[]>([]);

  // Ref scroll to bottom
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Load clients and establish WebSocket connection
  useEffect(() => {
    const list = StorageService.getClients();
    setClients(list);
    
    // Choose initial channel
    if (currentUser?.role === 'client') {
      setActiveChannelId(currentUser.id);
    } else if (list.length > 0) {
      setActiveChannelId(list[0].id);
    }

    // Connect WS
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [currentUser]);

  // Fetch messages when channel changes, and mark them as read
  useEffect(() => {
    if (activeChannelId) {
      fetchMessagesForChannel(activeChannelId);
      markChannelAsRead(activeChannelId);
    }
  }, [activeChannelId, socketConnected]);

  // Scroll to bottom whenever messages list grows/updates
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up conversation list updates on messages changes
  useEffect(() => {
    rebuildConversationsList();
  }, [messages, clients]);

  // Establishing WebSocket
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const host = window.location.host;
    const wsUrl = `${protocol}${host}`;

    console.log(`Conectando WebSocket em: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket conectado com sucesso.');
      setSocketConnected(true);
      
      // Register current user identity with server
      if (currentUser) {
        ws.send(JSON.stringify({
          type: 'register',
          userId: currentUser.id
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('Evento WebSocket recebido:', payload);

        if (payload.type === 'message') {
          const newMsg = payload.message as ChatMessage;
          
          // Append if it belongs to the currently active channel
          if (newMsg.clientId === activeChannelId) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev; // Avoid duplicate
              return [...prev, newMsg];
            });
            // Automatically mark as read if we are looking at this chat
            markChannelAsRead(activeChannelId);
          } else {
            // It's for another channel. Trigger a toast notification if user is a valid recipient
            const isAdminRecipient = currentUser?.role === 'admin';
            const isClientRecipient = currentUser?.role === 'client' && currentUser.id === newMsg.clientId;

            if (isAdminRecipient || isClientRecipient) {
              // Add a nice transient notification Toast
              const toastId = `toast-${Date.now()}`;
              setToasts(prev => [...prev, {
                id: toastId,
                sender: newMsg.senderName,
                text: newMsg.text || 'Enviou uma mídia.'
              }]);
              setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toastId));
              }, 4000);

              // Refetch active messages silently to keep unread counts updated
              rebuildConversationsList();
            }
          }
        } 
        else if (payload.type === 'reaction_update') {
          const { messageId, reactions } = payload;
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
        }
        else if (payload.type === 'read_update') {
          const { clientId, userId } = payload;
          if (clientId === activeChannelId) {
            setMessages(prev => prev.map(m => {
              if (!m.readBy.includes(userId)) {
                return { ...m, readBy: [...m.readBy, userId] };
              }
              return m;
            }));
          }
        }
        else if (payload.type === 'reset') {
          if (activeChannelId) {
            fetchMessagesForChannel(activeChannelId);
          }
        }
      } catch (err) {
        console.error('Falha ao interpretar frame do socket:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket desconectado. Tentando reconectar em 3s...');
      setSocketConnected(false);
      setTimeout(connectWebSocket, 3000);
    };
  };

  const fetchMessagesForChannel = async (clientId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Falha ao buscar mensagens:', err);
    }
  };

  const markChannelAsRead = async (clientId: string) => {
    if (!currentUser) return;
    try {
      await fetch('/api/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, userId: currentUser.id })
      });
    } catch (err) {
      console.error('Falha ao ler canal:', err);
    }
  };

  const rebuildConversationsList = async () => {
    if (currentUser?.role === 'client') {
      // Clients only chat with Aparato Marketing
      setConversations([
        {
          clientId: currentUser.id,
          clientName: 'Aparato Marketing',
          clientAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Aparato',
          lastMessageText: messages[messages.length - 1]?.text || 'Sem mensagens ainda',
          lastMessageAt: messages[messages.length - 1]?.createdAt || new Date().toISOString(),
          unreadCount: 0
        }
      ]);
      return;
    }

    // Admin lists all clients as chat threads
    const buildList = await Promise.all(clients.map(async (client) => {
      // Simple fetch-free count calculation from loaded memory lists (approximated/simulated)
      // For precision, fetch messages from database
      const res = await fetch(`/api/chat/messages?clientId=${client.id}`);
      let channelMsgs: ChatMessage[] = [];
      if (res.ok) {
        channelMsgs = await res.json();
      }

      const unread = channelMsgs.filter(m => m.senderId !== currentUser?.id && !m.readBy.includes(currentUser?.id || '')).length;
      const lastMsg = channelMsgs[channelMsgs.length - 1];

      return {
        clientId: client.id,
        clientName: client.companyName,
        clientAvatar: client.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(client.companyName)}`,
        lastMessageText: lastMsg ? lastMsg.text || 'Enviou uma mídia' : 'Nenhuma conversa iniciada',
        lastMessageAt: lastMsg ? lastMsg.createdAt : client.createdAt,
        unreadCount: unread
      };
    }));

    // Sort by last message date desc
    buildList.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    setConversations(buildList);
  };

  // Dispatch text / attachment message
  const handleSendMessage = async (textToSend?: string, attachmentToSend?: ChatAttachment) => {
    if (!activeChannelId || !currentUser) return;

    const contentText = textToSend !== undefined ? textToSend : typedMessage;
    if (!contentText.trim() && !attachmentToSend) return;

    const payload = {
      clientId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.role === 'admin' ? `${currentUser.name} (Aparato)` : currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text: contentText,
      attachment: attachmentToSend
    };

    try {
      // Post via REST API
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const created = await response.json();
        setMessages(prev => [...prev, created]);
        if (!textToSend) setTypedMessage('');
        setIsAttachmentMenuOpen(false);
      }
    } catch (e) {
      console.error('Falha ao enviar mensagem:', e);
    }
  };

  // Keyboard shortcut to send with enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add Emoji reaction to message
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/chat/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, userId: currentUser.id, emoji })
      });

      if (response.ok) {
        const result = await response.json();
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: result.reactions } : m));
        setIsEmojiPickerOpen(null);
      }
    } catch (err) {
      console.error('Falha ao aplicar reação:', err);
    }
  };

  // Emulate interactive voice message recording
  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setRecordedWaves([]);
    
    // Generate organic jumping waves
    recordingTimer.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
      setRecordedWaves(prev => [...prev, Math.floor(Math.random() * 80) + 20]);
    }, 1000);
  };

  const stopAndSendVoiceRecording = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }
    setIsRecording(false);

    // Build the mock audio attachment
    const durationMin = Math.floor(recordingSeconds / 60);
    const durationSec = recordingSeconds % 60;
    const durationStr = `${durationMin}:${durationSec < 10 ? '0' : ''}${durationSec}`;

    const mockVoiceAttachment: ChatAttachment = {
      name: `Mensagem de Voz (${durationStr})`,
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Preset standard audio stream
      type: 'voice',
      size: `${(recordingSeconds * 12).toFixed(0)} KB`
    };

    handleSendMessage('', mockVoiceAttachment);
    setRecordingSeconds(0);
    setRecordedWaves([]);
  };

  const cancelVoiceRecording = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordedWaves([]);
  };

  // Filter conversations in Admin view
  const filteredConversations = conversations.filter(c => 
    c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter messages in the current chat
  const filteredMessages = messages.filter(m => 
    m.text.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  const activeClientInfo = clients.find(c => c.id === activeChannelId);

  return (
    <div className="flex h-[calc(100vh-140px)] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans relative">
      
      {/* Dynamic Browser-like Notification Toast overlay */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="bg-[#114455] text-white p-4 rounded-2xl shadow-xl border border-teal-500/20 flex items-start gap-3 pointer-events-auto cursor-pointer"
              onClick={() => {
                // Find or navigate if Admin
                if (currentUser?.role === 'admin') {
                  const client = clients.find(c => c.companyName.includes(toast.sender.replace(' (Aparato)', '')));
                  if (client) setActiveChannelId(client.id);
                }
              }}
            >
              <div className="p-2 bg-white/10 rounded-full">
                <Bell size={16} className="text-[#ffd700]" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#ffd700]">{toast.sender}</p>
                <p className="text-[11px] text-slate-200 line-clamp-1 mt-0.5">{toast.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* SIDEBAR: Discord / Slack aubergine style channel panel */}
      {currentUser?.role === 'admin' && (
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-[#08222a] text-white flex flex-col justify-between shrink-0 hidden md:flex">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h2 className="text-sm font-black uppercase tracking-wider font-display">Aparato Chat</h2>
              </div>
              <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded text-[#ffd700] uppercase tracking-widest font-extrabold">
                {socketConnected ? 'WS Ativo' : 'Conectando'}
              </span>
            </div>

            {/* Client Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
              <input
                type="text"
                placeholder="Filtrar conversas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-4 py-2 rounded-xl bg-black/30 text-white placeholder-slate-500 border border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Conversations Channels list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-1 text-left">Direct Messages</div>
            {filteredConversations.length === 0 ? (
              <p className="text-xs text-slate-600 p-4 text-center">Nenhum cliente cadastrado.</p>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeChannelId === conv.clientId;
                return (
                  <button
                    key={conv.clientId}
                    onClick={() => setActiveChannelId(conv.clientId)}
                    className={`w-full p-3 rounded-2xl transition-all cursor-pointer text-left flex items-center justify-between ${
                      isActive 
                        ? 'bg-[#114455] text-white' 
                        : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img 
                          src={conv.clientAvatar} 
                          alt={conv.clientName} 
                          className="w-10 h-10 rounded-xl object-cover bg-white"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#08222a] rounded-full"></div>
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{conv.clientName}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{conv.lastMessageText}</p>
                      </div>
                    </div>

                    {/* Unread & Metadata */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(conv.lastMessageAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Admin Profiler line */}
          <div className="p-4 border-t border-slate-800 bg-black/20 flex items-center gap-3 text-left">
            <div className="relative shrink-0">
              <img 
                src={currentUser?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Aparato'} 
                alt={currentUser?.name} 
                className="w-9 h-9 rounded-full bg-slate-800"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#08222a]"></div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{currentUser?.name || 'Aparato Team'}</p>
              <p className="text-[10px] text-slate-500">Agência Administradora</p>
            </div>
          </div>
        </div>
      )}

      {/* CLIENT SIDE VIEW BAR */}
      {currentUser?.role === 'client' && (
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-[#08222a] text-white flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="p-4 border-b border-slate-800 text-left">
            <h2 className="text-sm font-black uppercase tracking-wider font-display">Meu Workspace</h2>
            <p className="text-[10px] text-teal-400 mt-0.5">Parceria com Aparato Marketing</p>
          </div>

          <div className="flex-1 p-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-1 text-left">Canais</div>
            <button
              className="w-full p-3 rounded-2xl bg-[#114455] text-white text-left flex items-center gap-3 cursor-pointer"
            >
              <MessageSquare size={16} className="text-[#ffd700]" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate"># chat-direto</p>
                <p className="text-[9px] text-slate-300">Falar com a agência</p>
              </div>
            </button>
          </div>

          {/* Client Profiler line */}
          <div className="p-4 border-t border-slate-800 bg-black/20 flex items-center gap-3 text-left">
            <div className="relative shrink-0">
              <img 
                src={currentUser?.avatar} 
                alt={currentUser?.name} 
                className="w-9 h-9 rounded-full bg-slate-800"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#08222a]"></div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-500">{currentUser?.companyName || 'Cliente Partner'}</p>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONVERSATION FRAME */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 justify-between">
        
        {/* Chat Area Header */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0 text-left">
            <div className="relative">
              <img 
                src={currentUser?.role === 'client' ? 'https://api.dicebear.com/7.x/initials/svg?seed=Aparato' : (activeClientInfo?.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeChannelId)}`)}
                alt="Logo do Canal" 
                className="w-9 h-9 rounded-xl object-cover border border-slate-150 dark:border-slate-850"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                {currentUser?.role === 'client' ? 'Aparato Marketing' : (activeClientInfo?.companyName || 'Carregando Chat...')}
              </h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                <Circle size={8} className="fill-emerald-500 stroke-none" />
                <span>Ativo agora</span>
              </p>
            </div>
          </div>

          {/* Actions top bar */}
          <div className="flex items-center gap-2">
            {/* Search within chat */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                type="text"
                placeholder="Buscar mensagens..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="text-[10px] pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white focus:outline-none"
              />
            </div>

            <button
              onClick={() => setIsInfoSidebarOpen(!isInfoSidebarOpen)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="Informações do Cliente"
            >
              <Info size={18} />
            </button>
          </div>
        </div>

        {/* MESSAGES VIEWSTREAM */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 scrollbar-thin">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-12">
              <div className="p-4 bg-[#114455]/10 rounded-full text-[#114455] dark:text-[#ffd700]">
                <MessageSquare size={32} />
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Nenhuma mensagem enviada</h4>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Envie a primeira mensagem para alinhar ideias, aprovações, dúvidas ou materiais com a agência.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const isMe = msg.senderId === currentUser?.id;
              
              // Group consecutive messages by user within 3 minutes
              const prevMsg = filteredMessages[idx - 1];
              const isGrouped = prevMsg && 
                                prevMsg.senderId === msg.senderId && 
                                (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 3 * 60 * 1000);

              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 group relative ${isMe ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-4'}`}
                >
                  {/* Left Side Avatar (only for non-grouped, non-me) */}
                  {!isMe && !isGrouped && (
                    <img 
                      src={msg.senderAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Aparato'} 
                      alt={msg.senderName} 
                      className="w-9 h-9 rounded-xl object-cover shrink-0 bg-slate-200"
                    />
                  )}
                  {/* Spacing alignment for grouped non-me */}
                  {!isMe && isGrouped && <div className="w-9 shrink-0"></div>}

                  {/* Message Bubble box */}
                  <div className={`max-w-[70%] text-left ${isMe ? 'order-1' : 'order-2'}`}>
                    
                    {/* Username & Time Header (only for non-grouped) */}
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-850 dark:text-slate-100">
                          {msg.senderName}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {/* Text block or attachment card */}
                    <div className="space-y-2">
                      {msg.text && (
                        <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-[#114455] text-white rounded-tr-none' 
                            : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-150 dark:border-slate-800 rounded-tl-none'
                        }`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      )}

                      {/* Attachment Box Rendering */}
                      {msg.attachment && (
                        <div className="rounded-2xl overflow-hidden border border-slate-150 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-850 max-w-sm">
                          {/* Image Attachment */}
                          {msg.attachment.type === 'image' && (
                            <div className="relative group/media">
                              <img 
                                src={msg.attachment.url} 
                                alt={msg.attachment.name} 
                                className="w-full h-40 object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-all flex items-center justify-center">
                                <a 
                                  href={msg.attachment.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2.5 bg-white text-slate-800 rounded-full font-bold shadow hover:scale-105 transition-all text-xs flex items-center gap-1"
                                >
                                  <ExternalLink size={12} />
                                  <span>Ampliar</span>
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Video Attachment */}
                          {msg.attachment.type === 'video' && (
                            <div className="aspect-video relative bg-black flex items-center justify-center">
                              <video 
                                src={msg.attachment.url} 
                                className="w-full h-full object-cover" 
                                controls
                                playsInline
                              />
                            </div>
                          )}

                          {/* Document Attachment */}
                          {msg.attachment.type === 'document' && (
                            <div className="p-4 flex items-center gap-3">
                              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                <FileIcon size={20} />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate" title={msg.attachment.name}>
                                  {msg.attachment.name}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{msg.attachment.size || '1.1 MB'} • Documento PDF</p>
                              </div>
                              <a
                                href={msg.attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-850 dark:hover:text-white rounded-lg transition-all"
                              >
                                <Download size={14} />
                              </a>
                            </div>
                          )}

                          {/* Voice Message Attachment */}
                          {msg.attachment.type === 'voice' && (
                            <div className="p-3 flex items-center gap-3 min-w-[220px]">
                              <button 
                                onClick={() => {
                                  // Play mock sound notification trigger
                                  const audio = new Audio(msg.attachment?.url);
                                  audio.volume = 0.4;
                                  audio.play().catch(() => {});
                                }}
                                className="p-2.5 bg-[#114455] text-[#ffd700] rounded-full hover:scale-105 transition-all cursor-pointer"
                              >
                                <Play size={14} className="fill-[#ffd700]" />
                              </button>
                              
                              {/* Waves visualizer */}
                              <div className="flex-1 flex items-center gap-0.5 h-6">
                                {[30, 60, 45, 80, 20, 50, 75, 40, 90, 30, 65, 40, 70, 25, 60].map((h, i) => (
                                  <span 
                                    key={i} 
                                    className="w-[3px] bg-slate-300 dark:bg-slate-600 rounded-full" 
                                    style={{ height: `${h}%` }}
                                  ></span>
                                ))}
                              </div>

                              <span className="text-[10px] text-slate-400 font-mono pr-2">{msg.attachment.name.split('(')[1]?.replace(')', '') || '0:12'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reactions Display Strip */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {msg.reactions.map((react, rIdx) => {
                          const hasIReacted = currentUser && react.users.includes(currentUser.id);
                          return (
                            <button
                              key={rIdx}
                              onClick={() => handleToggleReaction(msg.id, react.emoji)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                                hasIReacted
                                  ? 'bg-[#114455]/15 border-[#114455] text-[#114455] dark:text-[#ffd700] dark:border-[#ffd700]/30'
                                  : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-850 text-slate-500'
                              }`}
                              title={react.users.join(', ')}
                            >
                              <span>{react.emoji}</span>
                              <span className="text-[9px] font-mono">{react.users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Delivery & Read statuses (Only shown for me on hover or last message) */}
                    {isMe && (
                      <div className="flex justify-end items-center gap-1 mt-1 text-[9px] text-slate-400 font-mono">
                        {msg.readBy.filter(id => id !== currentUser.id).length > 0 ? (
                          <span className="flex items-center gap-0.5 text-teal-600">
                            <span>Lido</span>
                            <CheckCheck size={11} />
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-slate-300">
                            <span>Enviado</span>
                            <Check size={11} />
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline Floating Reaction Picker Trigger (on hover) */}
                  <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md p-1 rounded-xl z-20 ${
                    isMe ? 'right-[75%]' : 'left-[75%]'
                  }`}>
                    {PRESET_EMOJIS.slice(0, 5).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleToggleReaction(msg.id, emoji)}
                        className="hover:scale-125 transition-all text-xs p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}

                    <div className="relative">
                      <button
                        onClick={() => setIsEmojiPickerOpen(isEmojiPickerOpen === msg.id ? null : msg.id)}
                        className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        <Smile size={13} />
                      </button>

                      {/* Full Emoji List Drawer */}
                      {isEmojiPickerOpen === msg.id && (
                        <div className="absolute bottom-6 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-xl grid grid-cols-4 gap-1.5 z-50 w-32">
                          {PRESET_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className="text-sm p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side Avatar (only for me) */}
                  {isMe && !isGrouped && (
                    <img 
                      src={currentUser?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Aparato'} 
                      alt="Avatar" 
                      className="w-9 h-9 rounded-xl object-cover shrink-0 bg-slate-200 order-2"
                    />
                  )}
                  {/* Spacing alignment for grouped me */}
                  {isMe && isGrouped && <div className="w-9 shrink-0 order-2"></div>}

                </div>
              );
            })
          )}
          <div ref={messageEndRef} />
        </div>

        {/* BOTTOM RICH EDITOR PANEL */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 space-y-3">
          
          {/* Active Preset or Voice Waveform line */}
          {isRecording ? (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold animate-pulse">
                <Mic size={14} />
                <span>Gravando áudio: {recordingSeconds}s</span>
              </div>
              
              {/* Voice Jumping Wave blocks */}
              <div className="flex-1 flex items-center justify-center gap-[3px] h-6 overflow-hidden">
                {recordedWaves.slice(-25).map((val, idx) => (
                  <span 
                    key={idx} 
                    className="w-[3px] bg-red-500 rounded-full transition-all duration-350"
                    style={{ height: `${val}%` }}
                  ></span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={stopAndSendVoiceRecording}
                  className="px-3.5 py-1 bg-red-600 text-white hover:bg-red-700 text-[10px] font-bold rounded-lg cursor-pointer shadow"
                >
                  Enviar
                </button>
              </div>
            </div>
          ) : isAttachmentMenuOpen ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inserir Mock de Anexo</span>
                <button onClick={() => setIsAttachmentMenuOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white">
                  <X size={12} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ATTACHMENT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage('', p)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#ffd700] text-left transition-all bg-white dark:bg-slate-900 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-slate-500">
                      {p.type === 'image' ? <ImageIcon size={14} className="text-indigo-500" /> : p.type === 'video' ? <VideoIcon size={14} className="text-pink-500" /> : <FileIcon size={14} className="text-emerald-500" />}
                      <span className="text-[9px] font-bold uppercase">{p.type === 'image' ? 'Imagem' : p.type === 'video' ? 'Vídeo' : 'PDF Documento'}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 dark:text-white truncate">{p.name}</p>
                    <span className="text-[9px] text-slate-400 block">{p.size}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Core Input Field Box */}
          <div className="flex items-end gap-3">
            
            {/* Attachment paperclip trigger */}
            <button
              onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
              className="p-3 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-2xl transition-all shrink-0 cursor-pointer"
              title="Anexar Mídia"
              disabled={isRecording}
            >
              <Paperclip size={16} />
            </button>

            {/* Main Text Input */}
            <div className="flex-1 relative">
              <textarea
                placeholder="Enviar mensagem..."
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isRecording}
                rows={1}
                className="w-full text-xs pl-4 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white focus:outline-none placeholder-slate-400 font-medium resize-none min-h-[44px] max-h-[140px] leading-relaxed"
              />

              {/* Input Emoji trigger */}
              <div className="absolute right-3.5 bottom-3 text-slate-400">
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(isEmojiPickerOpen === 'input' ? null : 'input')}
                  className="hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <Smile size={16} />
                </button>

                {isEmojiPickerOpen === 'input' && (
                  <div className="absolute bottom-8 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 shadow-2xl grid grid-cols-4 gap-1.5 z-50 w-36">
                    {PRESET_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setTypedMessage(prev => prev + emoji);
                          setIsEmojiPickerOpen(null);
                        }}
                        className="text-md p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mic / Voice Recording trigger */}
            {!typedMessage.trim() ? (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="p-3 bg-slate-50 dark:bg-slate-850 hover:bg-red-500/10 hover:text-red-600 text-slate-400 rounded-2xl transition-all shrink-0 cursor-pointer"
                title="Gravar Mensagem de Voz"
                disabled={isRecording}
              >
                <Mic size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="p-3 bg-[#114455] text-white hover:bg-[#114455]/95 rounded-2xl transition-all shrink-0 shadow-md cursor-pointer"
              >
                <Send size={15} className="text-[#ffd700]" />
              </button>
            )}

          </div>

        </div>

      </div>

      {/* RIGHT CONVERSATION INFO SIDEBAR */}
      <AnimatePresence>
        {isInfoSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between shrink-0 h-full overflow-y-auto text-left"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-wider font-display text-slate-800 dark:text-white">Membros & Info</h4>
                <button 
                  onClick={() => setIsInfoSidebarOpen(false)} 
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-all font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Profile Card */}
              <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800/60 pb-6">
                <img 
                  src={currentUser?.role === 'client' ? 'https://api.dicebear.com/7.x/initials/svg?seed=Aparato' : (activeClientInfo?.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activeChannelId)}`)}
                  alt="Avatar" 
                  className="w-16 h-16 rounded-3xl object-cover mx-auto bg-slate-100 border border-slate-200 dark:border-slate-800"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                    {currentUser?.role === 'client' ? 'Aparato Marketing' : activeClientInfo?.companyName}
                  </h5>
                  <p className="text-[10px] text-slate-400">Canal de Parceria Exclusivo</p>
                </div>
              </div>

              {/* Members Detail list */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Membros Participantes</span>
                <div className="space-y-3 text-xs text-slate-650">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">Aparato Team</p>
                      <p className="text-[9px] text-slate-400">Administrador / Produção</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {currentUser?.role === 'client' ? currentUser?.name : (activeClientInfo?.contactPerson || 'Cliente')}
                      </p>
                      <p className="text-[9px] text-slate-400">Parceiro de Contrato</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details table */}
              {activeClientInfo && currentUser?.role === 'admin' && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-800/60 pt-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dados de Contato</span>
                  <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block">E-mail Corporativo:</span>
                      <strong className="text-slate-800 dark:text-white">{activeClientInfo.email}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Telefone:</span>
                      <strong className="text-slate-800 dark:text-white">{activeClientInfo.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Plano Mensal:</span>
                      <strong className="text-[#ffd700] bg-[#114455] px-2 py-0.5 rounded font-extrabold text-[10px]">
                        R$ {activeClientInfo.monthlyPlan.toLocaleString('pt-BR')} /mês
                      </strong>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
