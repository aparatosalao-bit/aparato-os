/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { getSimulatedMarketingResponse } from './server/marketingSimulator';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'chat_db.json');

// Interface mirror from src/types.ts
interface ChatAttachment {
  name: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'voice';
  size?: string;
}

interface ChatReaction {
  emoji: string;
  users: string[];
}

interface ChatMessage {
  id: string;
  clientId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'client';
  senderAvatar?: string;
  text: string;
  attachment?: ChatAttachment;
  reactions: ChatReaction[];
  readBy: string[];
  createdAt: string;
}

// Initial/Seed Messages for rich experience
const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    clientId: 'u-client-1',
    senderId: 'u-admin-1',
    senderName: 'Carlos Silva (Aparato)',
    senderRole: 'admin',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Aparato',
    text: 'Olá Carlos! Já subimos o novo logo do Salão Beleza Estilo no Gerenciador de Arquivos. Dê uma olhada na versão V2 e me diga se ficou de seu agrado.',
    reactions: [
      { emoji: '👍', users: ['u-client-1'] }
    ],
    readBy: ['u-admin-1', 'u-client-1'],
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() // 3 hours ago
  },
  {
    id: 'msg-2',
    clientId: 'u-client-1',
    senderId: 'u-client-1',
    senderName: 'Carlos Salão',
    senderRole: 'client',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Carlos%20Salao',
    text: 'Excelente! O logo ficou sensacional. Já fiz o download para mandar produzir a nova fachada.',
    reactions: [
      { emoji: '🔥', users: ['u-admin-1'] }
    ],
    readBy: ['u-admin-1', 'u-client-1'],
    createdAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString() // 2.5 hours ago
  },
  {
    id: 'msg-3',
    clientId: 'u-client-1',
    senderId: 'u-client-1',
    senderName: 'Carlos Salão',
    senderRole: 'client',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Carlos%20Salao',
    text: 'Conseguimos produzir também um vídeo curto para o Reels do Instagram sobre a inauguração da ala de estética?',
    reactions: [],
    readBy: ['u-admin-1', 'u-client-1'],
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() // 2 hours ago
  },
  {
    id: 'msg-4',
    clientId: 'u-client-1',
    senderId: 'u-admin-1',
    senderName: 'Carlos Silva (Aparato)',
    senderRole: 'admin',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Aparato',
    text: 'Com certeza, Carlos! Vou passar essa demanda agora mesmo para o time de produção audiovisual. Enviarei um roteiro preliminar para aprovação ainda hoje.',
    reactions: [
      { emoji: '🚀', users: ['u-client-1'] }
    ],
    readBy: ['u-admin-1'],
    createdAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString() // 1.5 hours ago
  },
  {
    id: 'msg-5',
    clientId: 'u-client-2',
    senderId: 'u-client-2',
    senderName: 'Clara Horizonte',
    senderRole: 'client',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Clara%20Horizonte',
    text: 'Olá equipe da Aparato! Enviei o relatório financeiro consolidado do primeiro trimestre para balizar a nova campanha de marketing institucional.',
    reactions: [],
    readBy: ['u-admin-1'],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() // 1 day ago
  },
  {
    id: 'msg-6',
    clientId: 'u-client-2',
    senderId: 'u-admin-1',
    senderName: 'Carlos Silva (Aparato)',
    senderRole: 'admin',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Aparato',
    text: 'Relatório recebido, Clara! Já estamos debruçados nos dados estruturando os gatilhos e a distribuição de canais pagos. Ficou muito completo.',
    reactions: [
      { emoji: '❤️', users: ['u-client-2'] }
    ],
    readBy: ['u-admin-1', 'u-client-2'],
    createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString() // 22 hours ago
  },
  {
    id: 'msg-7',
    clientId: 'u-client-3',
    senderId: 'u-admin-1',
    senderName: 'Carlos Silva (Aparato)',
    senderRole: 'admin',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Aparato',
    text: 'Novo banner para captação do SaaS já está pronto e rodando no Facebook/Google Ads.',
    reactions: [],
    readBy: ['u-client-3'],
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() // 2 days ago
  },
  {
    id: 'msg-8',
    clientId: 'u-client-3',
    senderId: 'u-client-3',
    senderName: 'Felipe Nexus',
    senderRole: 'client',
    senderAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Felipe%20Nexus',
    text: 'Sensacional! O volume de conversões de trial aumentou significativamente hoje pela manhã.',
    reactions: [
      { emoji: '🔥', users: ['u-admin-1'] }
    ],
    readBy: ['u-admin-1', 'u-client-3'],
    createdAt: new Date(Date.now() - 1.5 * 24 * 3600 * 1000).toISOString() // 1.5 days ago
  }
];

// Load messages from database file or write seed messages
let messages: ChatMessage[] = [];
try {
  if (fs.existsSync(DB_FILE)) {
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    messages = JSON.parse(fileContent);
  } else {
    messages = SEED_MESSAGES;
    fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2));
  }
} catch (e) {
  console.error('Falha ao inicializar banco de dados de chat:', e);
  messages = SEED_MESSAGES;
}

const saveMessages = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(messages, null, 2));
  } catch (e) {
    console.error('Falha ao salvar mensagens de chat:', e);
  }
};

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  // --- WEBSOCKET SERVER ATTACHMENT ---
  const wss = new WebSocketServer({ server });
  
  // Track active socket connections by user
  const activeConnections = new Map<string, WebSocket>();

  wss.on('connection', (ws) => {
    let connectedUserId: string | null = null;

    ws.on('message', (messageBuffer) => {
      try {
        const payload = JSON.parse(messageBuffer.toString());
        
        // Handle identity registration on connect
        if (payload.type === 'register') {
          connectedUserId = payload.userId;
          if (connectedUserId) {
            activeConnections.set(connectedUserId, ws);
            console.log(`Conexão WebSocket registrada para usuário: ${connectedUserId}`);
          }
        }
      } catch (err) {
        console.error('Erro ao processar mensagem do WebSocket:', err);
      }
    });

    ws.on('close', () => {
      if (connectedUserId) {
        activeConnections.delete(connectedUserId);
        console.log(`Conexão WebSocket encerrada para usuário: ${connectedUserId}`);
      }
    });
  });

  // Broadcast helper
  const broadcast = (data: any) => {
    const payloadStr = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payloadStr);
      }
    });
  };

  // --- AI MARKETING ASSISTANT ROUTES ---
  app.post('/api/marketing/generate', async (req, res) => {
    const { action, prompt, options } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'O parâmetro action é obrigatório' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY não configurada. Usando gerador alternativo/simulado.");
        const simulatedText = getSimulatedMarketingResponse(action, prompt, options);
        return res.json({ text: simulatedText, source: 'fallback_simulator' });
      }

      // Lazy initialization of Gemini SDK
      const { GoogleGenAI } = await import('@google/genai');
      const aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemInstruction = "Você é um Assistente de Marketing de IA especialista e co-piloto para administradores de negócios e agências, especialmente no nicho de salões de beleza, clínicas de estética e bem-estar (Aparato OS). Responda sempre em português brasileiro de forma profissional, persuasiva, criativa e estruturada.";
      let fullPrompt = "";

      if (action === 'chat') {
        fullPrompt = prompt || "Olá!";
      } else if (action === 'caption') {
        const { topic, tone, network, audience } = options || {};
        systemInstruction += " Você é especialista em redação publicitária e social media. Escreva legendas envolventes, com ganchos fortes, emojis apropriados e chamadas para ação (CTA).";
        fullPrompt = `Gere uma legenda para rede social (${network || 'Instagram'}).
Nicho/Tema: ${topic}
Tom de voz: ${tone || 'profissional e amigável'}
Público-alvo: ${audience || 'clientes em geral'}
Por favor, inclua emojis relevantes, estrutura de quebra de linhas para leitura agradável e sugestão de imagem/criativo visual ideal para acompanhar.`;
      } else if (action === 'ideas') {
        const { topic, platform, goal } = options || {};
        systemInstruction += " Você é um planejador de conteúdo altamente criativo e estrategista.";
        fullPrompt = `Gere 5 ideias inovadoras de conteúdo para a plataforma ${platform || 'Instagram/TikTok'}.
Nicho/Tema: ${topic}
Objetivo principal: ${goal || 'engajamento e autoridade'}
Para cada ideia forneça:
1. Título chamativo
2. Formato sugerido (Reels, Carrossel, Stories, etc.)
3. Resumo da ideia e roteiro visual básico.`;
      } else if (action === 'strategy') {
        const { topic, objectives, budget, targetAudience } = options || {};
        systemInstruction += " Você é um Diretor de Marketing Estratégico especialista em crescimento de negócios (growth marketing).";
        fullPrompt = `Desenvolva uma estratégia de marketing completa para:
Tema/Negócio: ${topic}
Objetivos: ${objectives || 'atrair novos clientes e fidelizar os atuais'}
Orçamento estimado: ${budget || 'baixo/médio'}
Público Alvo: ${targetAudience || 'público local interessado em beleza/estética'}

Forneça a estratégia estruturada em:
- Análise de Canais Recomendados
- Cronograma de Ações Rápidas (Semana 1 a 4)
- Diferenciais competitivos e posicionamento de marca
- Principais métricas de sucesso (KPIs) para monitorar.`;
      } else if (action === 'script') {
        const { topic, platform, videoGoal, duration } = options || {};
        systemInstruction += " Você é um roteirista de vídeo profissional especializado em vídeos curtos e virais (Reels, TikTok, Shorts).";
        fullPrompt = `Escreva um roteiro de vídeo completo e detalhado para ${platform || 'Instagram Reels'}.
Tema: ${topic}
Objetivo do Vídeo: ${videoGoal || 'conversão/venda'}
Duração Estimada: ${duration || '60 segundos'}

Estruture o roteiro em colunas ou seções claras de:
1. Gancho Inicial (primeiros 3 segundos - crucial)
2. Desenvolvimento/Conteúdo (parágrafos rápidos e fáceis de ler)
3. Chamada para Ação (CTA) clara
4. Dicas de Áudio/Música e Direção de Vídeo (o que mostrar na câmera).`;
      } else if (action === 'adCopy') {
        const { topic, mainBenefit, network, targetAudience, offer } = options || {};
        systemInstruction += " Você é um redator de anúncios de alta conversão (Copywriter).";
        fullPrompt = `Escreva 3 variações de anúncios publicitários altamente persuasivos para rodar no ${network || 'Meta Ads (Instagram/Facebook)'}.
Produto/Serviço: ${topic}
Benefício Principal: ${mainBenefit}
Público Alvo: ${targetAudience || 'potenciais clientes na região'}
Oferta/Chamada: ${offer || 'Sem oferta específica'}

Forneça as 3 variações:
1. Variação 1: Direta focada na dor do cliente e solução rápida.
2. Variação 2: Focada no desejo, transformação e status social.
3. Variação 3: Curta, com gatilho de escassez e CTA de clique.`;
      } else if (action === 'hashtags') {
        const { topic, platform, quantity } = options || {};
        systemInstruction += " Você é um estrategista de SEO para redes sociais.";
        fullPrompt = `Gere uma lista de hashtags altamente otimizadas para ${platform || 'Instagram/TikTok'}.
Tema do Post: ${topic}
Quantidade: ${quantity || 15} hashtags.
Divida-as em categorias: hashtags amplas (nicho grande), hashtags médias (nicho específico) e hashtags de geolocalização ou locais, para maximizar o alcance orgânico.`;
      } else if (action === 'summary') {
        const { rawText, summaryLength, focalPoints } = options || {};
        systemInstruction += " Você é um analista de negócios sênior e resumidor analítico especialista.";
        fullPrompt = `Analise o seguinte relatório/dados de marketing e forneça um resumo executivo de nível de diretoria:
Tamanho do resumo desejado: ${summaryLength || 'detalhado'}
Foco de análise: ${focalPoints || 'principais conquistas, métricas críticas e pontos de melhoria'}

Texto do Relatório/Dados:
"""
${rawText}
"""

Por favor, apresente um resumo executivo limpo, com tópicos bem formatados, dados chaves destacados e 3 recomendações acionáveis de marketing baseadas nestes dados.`;
      }

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: fullPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const responseText = response.text || "Desculpe, não consegui processar a geração no momento.";
      return res.json({ text: responseText, source: 'gemini' });

    } catch (error: any) {
      console.error("Erro na geração da IA de Marketing:", error);
      const simulatedText = getSimulatedMarketingResponse(action, prompt || '', options);
      return res.json({
        text: simulatedText,
        source: 'fallback_error',
        error: error.message || String(error)
      });
    }
  });

  // --- API CHAT ROUTES ---

  // Get messages for a channel (clientId)
  app.get('/api/chat/messages', (req, res) => {
    const { clientId } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: 'Parâmetro clientId é obrigatório' });
    }

    const filtered = messages.filter(m => m.clientId === clientId);
    res.json(filtered);
  });

  // Create a new message
  app.post('/api/chat/messages', (req, res) => {
    const { clientId, senderId, senderName, senderRole, senderAvatar, text, attachment } = req.body;
    
    if (!clientId || !senderId || !senderName || (!text && !attachment)) {
      return res.status(400).json({ error: 'Parâmetros incompletos para envio de mensagem' });
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clientId,
      senderId,
      senderName,
      senderRole,
      senderAvatar,
      text: text || '',
      attachment,
      reactions: [],
      readBy: [senderId],
      createdAt: new Date().toISOString()
    };

    messages.push(newMessage);
    saveMessages();

    // Broadcast the new message event to all sockets
    broadcast({
      type: 'message',
      message: newMessage
    });

    res.status(201).json(newMessage);
  });

  // Mark channel messages as read
  app.post('/api/chat/read', (req, res) => {
    const { clientId, userId } = req.body;
    if (!clientId || !userId) {
      return res.status(400).json({ error: 'Parâmetros clientId e userId são obrigatórios' });
    }

    let modified = false;
    messages = messages.map(m => {
      if (m.clientId === clientId && !m.readBy.includes(userId)) {
        modified = true;
        return {
          ...m,
          readBy: [...m.readBy, userId]
        };
      }
      return m;
    });

    if (modified) {
      saveMessages();
      broadcast({
        type: 'read_update',
        clientId,
        userId
      });
    }

    res.json({ success: true });
  });

  // Add or toggle emoji reactions
  app.post('/api/chat/reactions', (req, res) => {
    const { messageId, userId, emoji } = req.body;
    if (!messageId || !userId || !emoji) {
      return res.status(400).json({ error: 'Parâmetros incompletos para reação' });
    }

    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }

    const targetMsg = messages[msgIndex];
    let reactions = [...targetMsg.reactions];

    const reactionIndex = reactions.findIndex(r => r.emoji === emoji);
    if (reactionIndex > -1) {
      // Emoji exists, toggle user
      const users = [...reactions[reactionIndex].users];
      const userIdx = users.indexOf(userId);
      if (userIdx > -1) {
        // Remove reaction
        users.splice(userIdx, 1);
      } else {
        // Add reaction
        users.push(userId);
      }

      if (users.length === 0) {
        reactions.splice(reactionIndex, 1);
      } else {
        reactions[reactionIndex] = { ...reactions[reactionIndex], users };
      }
    } else {
      // New emoji reaction
      reactions.push({
        emoji,
        users: [userId]
      });
    }

    messages[msgIndex] = {
      ...targetMsg,
      reactions
    };
    saveMessages();

    broadcast({
      type: 'reaction_update',
      messageId,
      reactions
    });

    res.json({ success: true, reactions });
  });

  // Clean chat (optional helper for debugging)
  app.post('/api/chat/reset', (req, res) => {
    messages = SEED_MESSAGES;
    saveMessages();
    broadcast({ type: 'reset' });
    res.json({ success: true, message: 'Chat redefinido para dados iniciais' });
  });

  // --- VITE DEV / PRODUCTION INGRESS HANDLERS ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind the unified HTTP and WS server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server unificado HTTP/WS rodando na porta ${PORT}`);
  });
}

startServer();
