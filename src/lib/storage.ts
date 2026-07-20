/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Campaign, ServiceRequest, SupportTicket, Notification, CRMClient, ContentItem, CreativeItem, ManagedFile, Employee, Task, Invoice, Expense } from '../types';
import { db } from './firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';

// Simple user credentials mapping for simulation
export interface UserCredential {
  userId: string;
  email: string;
  passwordHash: string; // Plain text in local storage for simplicity but treated as credentials
}

const STORAGE_KEYS = {
  USERS: 'aparato_users',
  CREDENTIALS: 'aparato_credentials',
  CAMPAIGNS: 'aparato_campaigns',
  REQUESTS: 'aparato_requests',
  TICKETS: 'aparato_tickets',
  NOTIFICATIONS: 'aparato_notifications',
  THEME: 'aparato_theme',
  CLIENTS: 'aparato_clients',
  CONTENT: 'aparato_content',
  CREATIVES: 'aparato_creatives',
  FILES: 'aparato_files',
  TASKS: 'aparato_tasks',
  EMPLOYEES: 'aparato_employees',
  INVOICES: 'aparato_invoices',
  EXPENSES: 'aparato_expenses',
};

// Seed Data
const DEFAULT_USERS: User[] = [
  {
    id: 'u-admin-1',
    name: 'Aparato Marketing Team',
    email: 'admin@aparato.com.br',
    role: 'admin',
    createdAt: '2026-01-10T12:00:00Z',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  },
  {
    id: 'u-client-1',
    name: 'Carlos Silva',
    email: 'cliente@aparato.com.br',
    role: 'client',
    companyName: 'Salão Beleza Estilo',
    phone: '(11) 98765-4321',
    createdAt: '2026-02-15T14:30:00Z',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
  }
];

const DEFAULT_CREDENTIALS: UserCredential[] = [
  {
    userId: 'u-admin-1',
    email: 'admin@aparato.com.br',
    passwordHash: 'admin123',
  },
  {
    userId: 'u-client-1',
    email: 'cliente@aparato.com.br',
    passwordHash: 'cliente123',
  }
];

const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: 'c-1',
    title: 'Campanha de Inauguração - Unidade Jardins',
    description: 'Campanha integrada de tráfego pago e social media para lançamento da nova filial nos Jardins.',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    status: 'ativo',
    startDate: '2026-07-01',
    endDate: '2026-08-15',
    budget: 4500.00,
    platforms: ['Meta Ads', 'Google Ads', 'Instagram Organic'],
    metrics: {
      reach: 48500,
      clicks: 3120,
      conversions: 245,
      spend: 2150.00
    }
  },
  {
    id: 'c-2',
    title: 'Festival da Beleza - Dia dos Namorados',
    description: 'Promoção focada em pacotes de casal e tratamentos especiais de estética para o mês dos namorados.',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    status: 'concluido',
    startDate: '2026-05-20',
    endDate: '2026-06-15',
    budget: 2500.00,
    platforms: ['Meta Ads', 'WhatsApp Marketing'],
    metrics: {
      reach: 32000,
      clicks: 1890,
      conversions: 188,
      spend: 2500.00
    }
  },
  {
    id: 'c-3',
    title: 'Estratégia SEO & Google Meu Negócio',
    description: 'Otimização de listagem e tráfego orgânico para busca local na região da Zona Sul.',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    status: 'planejamento',
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    budget: 1800.00,
    platforms: ['Google Search', 'Google Maps'],
    metrics: {
      reach: 0,
      clicks: 0,
      conversions: 0,
      spend: 0
    }
  }
];

const DEFAULT_REQUESTS: ServiceRequest[] = [
  {
    id: 'r-1',
    title: 'Criativo para Instagram - Corte e Hidratação',
    description: 'Solicito a criação de um banner/carrossel focado no novo tratamento de hidratação vegana. Envio fotos em anexo.',
    type: 'design_grafico',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    status: 'em_producao',
    priority: 'media',
    createdAt: '2026-07-15T10:00:00Z',
    deadline: '2026-07-22',
    updates: [
      {
        by: 'Aparato Marketing Team',
        role: 'admin',
        text: 'Pedido recebido! O designer já está trabalhando na proposta visual.',
        createdAt: '2026-07-15T14:20:00Z'
      }
    ]
  },
  {
    id: 'r-2',
    title: 'Configuração de Campanha Meta Ads - Estética Facial',
    description: 'Subir campanha de conversão para agendamentos de limpeza de pele profunda. Orçamento de R$50/dia.',
    type: 'trafego_pago',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    status: 'revisao',
    priority: 'alta',
    createdAt: '2026-07-12T09:15:00Z',
    deadline: '2026-07-18',
    feedback: 'Ficou excelente, mas gostaria de ajustar o público para focar em mulheres de 25 a 45 anos na região.',
    updates: [
      {
        by: 'Aparato Marketing Team',
        role: 'admin',
        text: 'Campanha configurada e em rascunho. Favor revisar os textos e imagem antes de publicarmos.',
        createdAt: '2026-07-14T11:00:00Z'
      }
    ]
  },
  {
    id: 'r-3',
    title: 'Logotipo Novo - Projeto Estética Express',
    description: 'Desenvolvimento de uma identidade visual minimalista secundária para serviços rápidos em quiosques de shoppings.',
    type: 'branding',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    status: 'pendente',
    priority: 'media',
    createdAt: '2026-07-18T16:45:00Z',
    deadline: '2026-08-05'
  }
];

const DEFAULT_TICKETS: SupportTicket[] = [
  {
    id: 't-1',
    subject: 'Dúvida sobre faturamento do Google Ads',
    message: 'Olá, notei que o Google fez uma cobrança direta no meu cartão corporativo que não entendi muito bem. Vocês conseguem me enviar o relatório descritivo?',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    status: 'respondido',
    createdAt: '2026-07-10T11:30:00Z',
    replies: [
      {
        id: 'rep-1',
        userId: 'u-admin-1',
        userName: 'Aparato Marketing Team',
        userRole: 'admin',
        message: 'Olá Carlos! Verificamos que esse valor corresponde ao saldo consumido entre 01/07 e 09/07. Anexamos um PDF detalhado com o consumo por palavra-chave na aba de relatórios da sua campanha.',
        createdAt: '2026-07-10T15:45:00Z'
      }
    ]
  }
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    userId: 'u-client-1',
    title: 'Novo Comentário em Solicitação',
    message: 'A equipe Aparato atualizou o status da solicitação "Criativo para Instagram".',
    type: 'request',
    read: false,
    createdAt: '2026-07-15T14:20:00Z'
  },
  {
    id: 'n-2',
    userId: 'u-client-1',
    title: 'Campanha Concluída',
    message: 'A campanha "Festival da Beleza - Dia dos Namorados" foi finalizada com ótimos resultados!',
    type: 'campaign',
    read: true,
    createdAt: '2026-06-16T18:00:00Z'
  },
  {
    id: 'n-3',
    userId: 'u-admin-1',
    title: 'Nova Solicitação Recebida',
    message: 'O cliente "Salão Beleza Estilo" criou a solicitação "Logotipo Novo - Projeto Estética Express".',
    type: 'request',
    read: false,
    createdAt: '2026-07-18T16:45:00Z'
  }
];

const DEFAULT_CLIENTS: CRMClient[] = [
  {
    id: 'u-client-1',
    companyName: 'Salão Beleza Estilo',
    logo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=150&h=150&q=80',
    contactPerson: 'Carlos Silva',
    email: 'cliente@aparato.com.br',
    phone: '(11) 98765-4321',
    instagram: 'https://instagram.com/salaobelezaestilo',
    website: 'https://salaobelezaestilo.com.br',
    contractInfo: 'Contrato Anual - Marketing Digital Completo (Fase 2)',
    monthlyPlan: 2500.00,
    paymentStatus: 'em_dia',
    startDate: '2026-02-15',
    notes: 'Cliente extremamente satisfeito. Foco total em trazer leads pelo Meta Ads e tráfego local.',
    isArchived: false,
    createdAt: '2026-02-15T14:30:00Z'
  },
  {
    id: 'u-client-2',
    companyName: 'Banco Horizonte',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=150&h=150&q=80',
    contactPerson: 'Mariana Costa',
    email: 'mariana@bancohorizonte.com',
    phone: '(11) 91122-3344',
    linkedin: 'https://linkedin.com/company/bancohorizonte',
    website: 'https://bancohorizonte.com.br',
    contractInfo: 'Contrato Semestral - Assessoria de Performance',
    monthlyPlan: 15000.00,
    paymentStatus: 'pendente',
    startDate: '2026-05-01',
    notes: 'Instituição financeira regional em expansão. Campanhas focadas em captação de correntistas premium.',
    isArchived: false,
    createdAt: '2026-05-01T10:00:00Z'
  },
  {
    id: 'u-client-3',
    companyName: 'Nexus Tech',
    logo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=150&h=150&q=80',
    contactPerson: 'Thiago Ramos',
    email: 'contato@nexustech.io',
    phone: '(11) 99988-7766',
    website: 'https://nexustech.io',
    contractInfo: 'Contrato Recorrente Mensal',
    monthlyPlan: 5200.00,
    paymentStatus: 'atrasado',
    startDate: '2026-01-15',
    notes: 'Startup de tecnologia (SaaS B2B). Necessita de novas artes de suporte e relatórios de ROI quinzenais.',
    isArchived: false,
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'u-client-4',
    companyName: 'Solaris Energy',
    logo: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=150&h=150&q=80',
    contactPerson: 'Roberto Santos',
    email: 'roberto@solarisenergy.com.br',
    phone: '(21) 98888-5555',
    website: 'https://solarisenergy.com.br',
    contractInfo: 'Campanha Avulsa SEO / Trimestral',
    monthlyPlan: 3800.00,
    paymentStatus: 'em_dia',
    startDate: '2026-06-10',
    notes: 'Empresa de energia solar fotovoltaica. Foco total em SEO orgânico local e anúncios de captação de orçamentos.',
    isArchived: false,
    createdAt: '2026-06-10T11:00:00Z'
  },
  {
    id: 'u-client-5',
    companyName: 'Padaria Bella Vista',
    logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=150&h=150&q=80',
    contactPerson: 'Antônio Fernandes',
    email: 'contato@bellavista.com.br',
    phone: '(11) 3214-5566',
    instagram: 'https://instagram.com/padariabellavista',
    contractInfo: 'Contrato Anual - Redes Sociais',
    monthlyPlan: 1800.00,
    paymentStatus: 'em_dia',
    startDate: '2025-09-01',
    notes: 'Contrato antigo, excelente pagador. Atualmente arquivado temporariamente devido a reformas de ampliação física.',
    isArchived: true,
    createdAt: '2025-09-01T14:00:00Z'
  }
];

const DEFAULT_CONTENT: ContentItem[] = [
  {
    id: 'post-1',
    title: 'Inauguração Espaço Hair Care',
    description: 'Post anunciando a nova sala de hidratação e terapia capilar.',
    platform: 'Instagram',
    caption: 'Novidade incrível para as nossas clientes! ✨ Inauguramos o nosso novo Espaço Hair Care, um ambiente totalmente planejado para cuidar da saúde do seu cabelo com o carinho que ele merece. Agende já seu horário! 💇‍♀️ #Beleza #HairCare #SalaoEstilo',
    mediaUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&h=400&q=80',
    mediaType: 'image',
    responsiblePerson: 'Carlos Silva',
    publicationDate: '2026-07-19', // Today
    status: 'aprovado',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    createdAt: '2026-07-15T10:00:00Z'
  },
  {
    id: 'post-2',
    title: 'Dicas de Maquiagem para Pele Madura',
    description: 'Vídeo curto de dicas práticas com nossa especialista Helena.',
    platform: 'Instagram',
    caption: 'Sabe aquele efeito craquelado que tanto incomoda? Hoje a Helena separou 3 dicas essenciais para uma preparação de pele madura perfeita! Assista até o final e salve para não esquecer! 💄✨ #DicasDeMake #MaquiagemPeleMadura #SalaodeBeleza',
    mediaUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&h=400&q=80',
    mediaType: 'video',
    responsiblePerson: 'Juliana Vasconcelos',
    publicationDate: '2026-07-21',
    status: 'em_producao',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    createdAt: '2026-07-16T14:20:00Z'
  },
  {
    id: 'post-3',
    title: 'Investir na Selic vs CDB',
    description: 'Carrossel explicativo sobre renda fixa de forma simplificada.',
    platform: 'Instagram',
    caption: 'Com a variação da taxa de juros, muitos se perguntam: onde rende mais? Entenda de forma simples a diferença entre o Tesouro Selic e o CDB e saiba como dar o próximo passo rumo à sua liberdade financeira! 📈💼 #Financas #Investimentos #HorizonteBanco',
    mediaUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&h=400&q=80',
    mediaType: 'image',
    responsiblePerson: 'Mariana Costa',
    publicationDate: '2026-07-20',
    status: 'aguardando_aprovacao',
    clientId: 'u-client-2',
    clientName: 'Banco Horizonte',
    createdAt: '2026-07-17T09:00:00Z'
  },
  {
    id: 'post-4',
    title: 'Lançamento App Nexus Mobile',
    description: 'Post institucional sobre o lançamento do aplicativo nas lojas.',
    platform: 'LinkedIn',
    caption: 'É oficial! O Nexus Tech agora cabe no seu bolso. Lançamos hoje o nosso app mobile para Android e iOS, trazendo toda a gestão operacional da sua empresa para a palma da mão. 🚀 Baixe agora e experimente o futuro da eficiência! #NexusTech #Launch #TechSaaS',
    mediaUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=400&h=400&q=80',
    mediaType: 'image',
    responsiblePerson: 'Thiago Ramos',
    publicationDate: '2026-07-25',
    status: 'rascunho',
    clientId: 'u-client-3',
    clientName: 'Nexus Tech',
    createdAt: '2026-07-18T11:15:00Z'
  },
  {
    id: 'post-5',
    title: 'Energia Solar para Empresas: Guia de ROI',
    description: 'Post em blog + chamada para LinkedIn focado em economia industrial.',
    platform: 'LinkedIn',
    caption: 'Sua empresa está perdendo dinheiro com a conta de luz? Desenvolvemos um infográfico exclusivo demonstrando como o payback de sistemas solares comerciais caiu para menos de 3 anos no Brasil. Clique no link para fazer uma simulação gratuita! ☀️🌱 #EnergiaSolar #Solaris #Sustentabilidade',
    mediaUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=400&h=400&q=80',
    mediaType: 'image',
    responsiblePerson: 'Roberto Santos',
    publicationDate: '2026-07-18',
    status: 'publicado',
    clientId: 'u-client-4',
    clientName: 'Solaris Energy',
    createdAt: '2026-07-15T15:30:00Z'
  }
];

const DEFAULT_CREATIVES: CreativeItem[] = [
  {
    id: 'creative-1',
    title: 'Campanha de Hidratação de Inverno',
    description: 'Criativo principal em formato feed para promoção de hidratação profunda de inverno.',
    format: 'image',
    fileUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    status: 'pending',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    comments: [
      {
        id: 'c-1',
        userId: 'u-admin-1',
        userName: 'Carlos Silva',
        userRole: 'admin',
        content: 'Ficou excelente a iluminação da modelo. O que acha da copy sobre o inverno brasileiro?',
        createdAt: '2026-07-18T10:00:00Z'
      }
    ],
    revisions: [
      {
        id: 'rev-1-1',
        version: 1,
        fileUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        format: 'image',
        description: 'Primeira versão do criativo enviado para aprovação.',
        status: 'pending',
        changedBy: 'Carlos Silva',
        createdAt: '2026-07-18T09:30:00Z'
      }
    ],
    createdAt: '2026-07-18T09:30:00Z',
    updatedAt: '2026-07-18T10:00:00Z'
  },
  {
    id: 'creative-2',
    title: 'Vídeo Institucional: Tecnologia no Banco',
    description: 'Vídeo institucional mostrando a agilidade do atendimento digital.',
    format: 'video',
    fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-businesswoman-working-on-a-laptop-in-her-office-42352-large.mp4',
    status: 'changes_requested',
    clientId: 'u-client-2',
    clientName: 'Banco Horizonte',
    comments: [
      {
        id: 'c-2',
        userId: 'u-client-2',
        userName: 'Banco Horizonte',
        userRole: 'client',
        content: 'Gostamos da dinâmica, mas a cor institucional do banco ao final precisa ser um azul um pouco mais escuro.',
        createdAt: '2026-07-17T15:30:00Z'
      },
      {
        id: 'c-3',
        userId: 'u-admin-1',
        userName: 'Carlos Silva',
        userRole: 'admin',
        content: 'Entendido! Já estamos ajustando a identidade cromática na vinheta de encerramento.',
        createdAt: '2026-07-17T16:00:00Z'
      }
    ],
    revisions: [
      {
        id: 'rev-2-1',
        version: 1,
        fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-businesswoman-working-on-a-laptop-in-her-office-42352-large.mp4',
        format: 'video',
        description: 'Mock de gravação com transição clássica.',
        status: 'changes_requested',
        changedBy: 'Carlos Silva',
        createdAt: '2026-07-17T11:00:00Z'
      }
    ],
    createdAt: '2026-07-17T11:00:00Z',
    updatedAt: '2026-07-17T16:00:00Z'
  },
  {
    id: 'creative-3',
    title: 'Reels: 3 Erros ao Configurar o Cloud SaaS',
    description: 'Reels dinâmico de 15 segundos para atração orgânica no Instagram.',
    format: 'reels',
    fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-typing-on-a-keyboard-40546-large.mp4',
    status: 'approved',
    clientId: 'u-client-3',
    clientName: 'Nexus Tech',
    comments: [
      {
        id: 'c-4',
        userId: 'u-client-3',
        userName: 'Nexus Tech',
        userRole: 'client',
        content: 'Sensacional! Ficou super dinâmico e o roteiro está impecável. Aprovadíssimo!',
        createdAt: '2026-07-19T09:00:00Z'
      }
    ],
    revisions: [
      {
        id: 'rev-3-1',
        version: 1,
        fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-typing-on-a-keyboard-40546-large.mp4',
        format: 'reels',
        description: 'Primeira versão editada com legendas dinâmicas em amarelo.',
        status: 'approved',
        changedBy: 'Julia Martins',
        createdAt: '2026-07-19T08:30:00Z'
      }
    ],
    createdAt: '2026-07-19T08:30:00Z',
    updatedAt: '2026-07-19T09:00:00Z'
  },
  {
    id: 'creative-4',
    title: 'Apresentação Comercial: Solaris Energy 2026',
    description: 'Slides da nova proposta de economia solar para grandes empresas.',
    format: 'presentation',
    fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    status: 'approved',
    clientId: 'u-client-4',
    clientName: 'Solaris Energy',
    comments: [],
    revisions: [
      {
        id: 'rev-4-2',
        version: 2,
        fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
        format: 'presentation',
        description: 'Atualização das tabelas de ROI de acordo com a nova tarifa de energia elétrica.',
        status: 'approved',
        changedBy: 'Juliana Vasconcelos',
        createdAt: '2026-07-16T15:00:00Z'
      },
      {
        id: 'rev-4-1',
        version: 1,
        fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba1?auto=format&fit=crop&w=800&q=80',
        format: 'presentation',
        description: 'Versão inicial com dados tributários de 2025.',
        status: 'changes_requested',
        changedBy: 'Juliana Vasconcelos',
        createdAt: '2026-07-15T10:00:00Z'
      }
    ],
    createdAt: '2026-07-15T10:00:00Z',
    updatedAt: '2026-07-16T15:00:00Z'
  },
  {
    id: 'creative-5',
    title: 'E-book: Redução de Custos com Energia Solar',
    description: 'E-book em PDF interativo para geração de leads.',
    format: 'pdf',
    fileUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    status: 'pending',
    clientId: 'u-client-4',
    clientName: 'Solaris Energy',
    comments: [],
    revisions: [
      {
        id: 'rev-5-1',
        version: 1,
        fileUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
        format: 'pdf',
        description: 'Primeira versão do e-book exportado diretamente do Canva.',
        status: 'pending',
        changedBy: 'Rodrigo Abreu',
        createdAt: '2026-07-18T14:00:00Z'
      }
    ],
    createdAt: '2026-07-18T14:00:00Z',
    updatedAt: '2026-07-18T14:00:00Z'
  }
];

const DEFAULT_FILES: ManagedFile[] = [
  {
    id: 'file-1',
    name: 'logo_salao_principal_alta.png',
    category: 'logos',
    size: '450 KB',
    type: 'image/png',
    fileUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    uploadedBy: 'Carlos Silva',
    version: 2,
    history: [
      {
        id: 'h-1-2',
        version: 2,
        name: 'logo_salao_principal_alta.png',
        fileUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        size: '450 KB',
        uploadedBy: 'Carlos Silva',
        createdAt: '2026-07-18T10:00:00Z',
        note: 'Logo principal em alta definição com fundo transparente.'
      },
      {
        id: 'h-1-1',
        version: 1,
        name: 'logo_salao_principal_baixa.png',
        fileUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80',
        size: '120 KB',
        uploadedBy: 'Carlos Silva',
        createdAt: '2026-07-15T09:00:00Z',
        note: 'Primeira versão do logo em baixa resolução.'
      }
    ],
    createdAt: '2026-07-15T09:00:00Z',
    updatedAt: '2026-07-18T10:00:00Z'
  },
  {
    id: 'file-2',
    name: 'manual_da_marca_v1.pdf',
    category: 'identidade_visual',
    size: '3.4 MB',
    type: 'application/pdf',
    fileUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    uploadedBy: 'Carlos Silva',
    version: 1,
    history: [
      {
        id: 'h-2-1',
        version: 1,
        name: 'manual_da_marca_v1.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
        size: '3.4 MB',
        uploadedBy: 'Carlos Silva',
        createdAt: '2026-07-16T14:00:00Z',
        note: 'Manual de identidade visual completo com paleta de cores e tipografias.'
      }
    ],
    createdAt: '2026-07-16T14:00:00Z',
    updatedAt: '2026-07-16T14:00:00Z'
  },
  {
    id: 'file-3',
    name: 'contrato_salao_aparato_2026.pdf',
    category: 'contratos',
    size: '1.2 MB',
    type: 'application/pdf',
    fileUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    uploadedBy: 'Aparato Marketing Team',
    version: 1,
    history: [
      {
        id: 'h-3-1',
        version: 1,
        name: 'contrato_salao_aparato_2026.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
        size: '1.2 MB',
        uploadedBy: 'Aparato Marketing Team',
        createdAt: '2026-07-10T11:00:00Z',
        note: 'Contrato anual assinado digitalmente de prestação de serviços de marketing.'
      }
    ],
    createdAt: '2026-07-10T11:00:00Z',
    updatedAt: '2026-07-10T11:00:00Z'
  },
  {
    id: 'file-4',
    name: 'banco_horizonte_vetorial.svg',
    category: 'logos',
    size: '120 KB',
    type: 'image/svg+xml',
    fileUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    clientId: 'u-client-2',
    clientName: 'Banco Horizonte',
    uploadedBy: 'Aparato Marketing Team',
    version: 1,
    history: [
      {
        id: 'h-4-1',
        version: 1,
        name: 'banco_horizonte_vetorial.svg',
        fileUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
        size: '120 KB',
        uploadedBy: 'Aparato Marketing Team',
        createdAt: '2026-07-14T09:00:00Z',
        note: 'Logo vetorial do Banco Horizonte em curvas.'
      }
    ],
    createdAt: '2026-07-14T09:00:00Z',
    updatedAt: '2026-07-14T09:00:00Z'
  },
  {
    id: 'file-5',
    name: 'video_institucional_digital.mp4',
    category: 'videos',
    size: '18.5 MB',
    type: 'video/mp4',
    fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-businesswoman-working-on-a-laptop-in-her-office-42352-large.mp4',
    clientId: 'u-client-2',
    clientName: 'Banco Horizonte',
    uploadedBy: 'Aparato Marketing Team',
    version: 1,
    history: [
      {
        id: 'h-5-1',
        version: 1,
        name: 'video_institucional_digital.mp4',
        fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-businesswoman-working-on-a-laptop-in-her-office-42352-large.mp4',
        size: '18.5 MB',
        uploadedBy: 'Aparato Marketing Team',
        createdAt: '2026-07-16T15:00:00Z',
        note: 'Vídeo corporativo institucional final para campanhas patrocinadas.'
      }
    ],
    createdAt: '2026-07-16T15:00:00Z',
    updatedAt: '2026-07-16T15:00:00Z'
  },
  {
    id: 'file-6',
    name: 'relatorio_analise_investidores.pdf',
    category: 'relatorios',
    size: '4.8 MB',
    type: 'application/pdf',
    fileUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    clientId: 'u-client-2',
    clientName: 'Banco Horizonte',
    uploadedBy: 'Banco Horizonte',
    version: 1,
    history: [
      {
        id: 'h-6-1',
        version: 1,
        name: 'relatorio_analise_investidores.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
        size: '4.8 MB',
        uploadedBy: 'Banco Horizonte',
        createdAt: '2026-07-17T11:00:00Z',
        note: 'Análise de resultados financeiros do primeiro trimestre para investidores.'
      }
    ],
    createdAt: '2026-07-17T11:00:00Z',
    updatedAt: '2026-07-17T11:00:00Z'
  },
  {
    id: 'file-7',
    name: 'logo_nexus_dark_mode.png',
    category: 'logos',
    size: '180 KB',
    type: 'image/png',
    fileUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    clientId: 'u-client-3',
    clientName: 'Nexus Tech',
    uploadedBy: 'Nexus Tech',
    version: 1,
    history: [
      {
        id: 'h-7-1',
        version: 1,
        name: 'logo_nexus_dark_mode.png',
        fileUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
        size: '180 KB',
        uploadedBy: 'Nexus Tech',
        createdAt: '2026-07-18T10:00:00Z',
        note: 'Variação de logo otimizada para interfaces escuras.'
      }
    ],
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-18T10:00:00Z'
  },
  {
    id: 'file-8',
    name: 'banner_campanha_saas_2026.png',
    category: 'marketing',
    size: '1.1 MB',
    type: 'image/png',
    fileUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
    clientId: 'u-client-3',
    clientName: 'Nexus Tech',
    uploadedBy: 'Aparato Marketing Team',
    version: 1,
    history: [
      {
        id: 'h-8-1',
        version: 1,
        name: 'banner_campanha_saas_2026.png',
        fileUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
        size: '1.1 MB',
        uploadedBy: 'Aparato Marketing Team',
        createdAt: '2026-07-18T16:00:00Z',
        note: 'Artes finais prontas para tráfego pago da nova campanha de conversão SaaS.'
      }
    ],
    createdAt: '2026-07-18T16:00:00Z',
    updatedAt: '2026-07-18T16:00:00Z'
  },
  {
    id: 'file-9',
    name: 'apresentacao_servicos_corporativos.pdf',
    category: 'documentos',
    size: '2.5 MB',
    type: 'application/pdf',
    fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    clientId: 'u-client-4',
    clientName: 'Solaris Energy',
    uploadedBy: 'Aparato Marketing Team',
    version: 1,
    history: [
      {
        id: 'h-9-1',
        version: 1,
        name: 'apresentacao_servicos_corporativos.pdf',
        fileUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
        size: '2.5 MB',
        uploadedBy: 'Aparato Marketing Team',
        createdAt: '2026-07-15T09:30:00Z',
        note: 'Slides explicativos para fechamento de vendas b2b.'
      }
    ],
    createdAt: '2026-07-15T09:30:00Z',
    updatedAt: '2026-07-15T09:30:00Z'
  }
];


const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Ana Souza',
    email: 'ana.souza@aparato.com.br',
    role: 'Designer Sênior',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    permissions: ['Criar Tarefas', 'Editar Tarefas', 'Excluir Tarefas', 'Gerenciar Equipe'],
    assignedProjects: ['Salão Beleza Estilo', 'Nexus SaaS'],
    createdAt: '2026-03-01T10:00:00Z'
  },
  {
    id: 'emp-2',
    name: 'Thiago Ribeiro',
    email: 'thiago.ribeiro@aparato.com.br',
    role: 'Gestor de Tráfego Paid',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    permissions: ['Criar Tarefas', 'Editar Tarefas'],
    assignedProjects: ['Salão Beleza Estilo', 'Clara Horizonte Financial'],
    createdAt: '2026-04-10T09:30:00Z'
  },
  {
    id: 'emp-3',
    name: 'Mariana Costa',
    email: 'mariana.costa@aparato.com.br',
    role: 'Social Media & Copywriter',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
    permissions: ['Criar Tarefas', 'Editar Tarefas'],
    assignedProjects: ['Clara Horizonte Financial', 'Nexus SaaS'],
    createdAt: '2026-05-15T11:00:00Z'
  }
];

const DEFAULT_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Criação dos Banners Estáticos de Lançamento',
    description: 'Desenvolver as 3 variações de banners (1:1, 9:16 e 16:9) para a campanha do Instagram e Google Ads.',
    assignedEmployeeId: 'emp-1',
    deadline: '2026-07-25',
    priority: 'alta',
    status: 'em_andamento',
    attachments: [
      { name: 'logo_versao_horizontal.png', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', size: '240 KB' }
    ],
    comments: [
      {
        id: 'tc-1',
        userName: 'Aparato Marketing Team',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
        text: 'Ana, favor focar nas cores da paleta dourada conforme o briefing do cliente.',
        createdAt: '2026-07-18T14:00:00Z'
      }
    ],
    clientId: 'u-client-1',
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-18T14:00:00Z'
  },
  {
    id: 't-2',
    title: 'Configuração das Campanhas de Remarketing',
    description: 'Configurar o pixel e criar os públicos de remarketing no Gerenciador de Anúncios da Meta.',
    assignedEmployeeId: 'emp-2',
    deadline: '2026-07-28',
    priority: 'media',
    status: 'a_fazer',
    attachments: [],
    comments: [],
    clientId: 'u-client-1',
    createdAt: '2026-07-19T09:00:00Z',
    updatedAt: '2026-07-19T09:00:00Z'
  },
  {
    id: 't-3',
    title: 'Revisão do Copy do Post de Inauguração',
    description: 'Revisar os gatilhos mentais e a chamada para ação (CTA) do post carrossel do feed do Beleza Estilo.',
    assignedEmployeeId: 'emp-3',
    deadline: '2026-07-22',
    priority: 'baixa',
    status: 'revisao',
    attachments: [],
    comments: [
      {
        id: 'tc-2',
        userName: 'Carlos Salão',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
        text: 'Eu sugeriria colocar um CTA direto para o nosso link de agendamentos no WhatsApp.',
        createdAt: '2026-07-19T10:30:00Z'
      }
    ],
    clientId: 'u-client-1',
    createdAt: '2026-07-18T11:00:00Z',
    updatedAt: '2026-07-19T10:30:00Z'
  }
];


const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    amount: 2500.00,
    dueDate: '2026-07-10',
    paymentDate: '2026-07-09',
    status: 'paga',
    description: 'Mensalidade de Serviços de Marketing Digital - Referência Julho/2026',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: '2026-07-01T08:00:00Z'
  },
  {
    id: 'inv-2',
    clientId: 'u-client-2',
    clientName: 'Banco Horizonte',
    amount: 15000.00,
    dueDate: '2026-07-25',
    status: 'pendente',
    description: 'Assessoria de Performance e Tráfego Pago - Referência Julho/2026',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: '2026-07-01T08:00:00Z'
  },
  {
    id: 'inv-3',
    clientId: 'u-client-3',
    clientName: 'Nexus Tech',
    amount: 5200.00,
    dueDate: '2026-07-15',
    status: 'atrasada',
    description: 'Gestão de Conteúdo e Criação Visual - Referência Julho/2026',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: '2026-07-01T08:00:00Z'
  },
  {
    id: 'inv-4',
    clientId: 'u-client-1',
    clientName: 'Salão Beleza Estilo',
    amount: 2500.00,
    dueDate: '2026-06-10',
    paymentDate: '2026-06-10',
    status: 'paga',
    description: 'Mensalidade de Serviços de Marketing Digital - Referência Junho/2026',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: '2026-06-01T08:00:00Z'
  },
  {
    id: 'inv-5',
    clientId: 'u-client-2',
    clientName: 'Banco Horizonte',
    amount: 15000.00,
    dueDate: '2026-06-25',
    paymentDate: '2026-06-24',
    status: 'paga',
    description: 'Assessoria de Performance e Tráfego Pago - Referência Junho/2026',
    documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: '2026-06-01T08:00:00Z'
  }
];

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    amount: 3500.00,
    date: '2026-07-05',
    category: 'salarios',
    description: 'Honorários de Equipe - Designer Sênior (Ana Souza)',
    recipient: 'Ana Souza',
    status: 'pago',
    createdAt: '2026-07-05T10:00:00Z'
  },
  {
    id: 'exp-2',
    amount: 2800.00,
    date: '2026-07-05',
    category: 'salarios',
    description: 'Honorários de Equipe - Gestor de Tráfego Paid (Thiago Ribeiro)',
    recipient: 'Thiago Ribeiro',
    status: 'pago',
    createdAt: '2026-07-05T10:00:00Z'
  },
  {
    id: 'exp-3',
    amount: 450.00,
    date: '2026-07-10',
    category: 'ferramentas',
    description: 'Assinatura Adobe Creative Cloud Suite e Figma Pro',
    recipient: 'Adobe Systems',
    status: 'pago',
    createdAt: '2026-07-10T11:00:00Z'
  },
  {
    id: 'exp-4',
    amount: 1200.00,
    date: '2026-07-20',
    category: 'impostos',
    description: 'DAS Simples Nacional - Competência Junho/2026',
    recipient: 'Receita Federal',
    status: 'pendente',
    createdAt: '2026-07-15T09:00:00Z'
  }
];


// Helper to safely fetch from localStorage or initialize with seed data
function getStoredData<T>(key: string, seed: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return seed;
  }
}

function setStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage`, error);
  }
}

// Map local storage keys to firestore collection names
const KEY_TO_COLLECTION: { [key: string]: string } = {
  [STORAGE_KEYS.USERS]: 'users',
  [STORAGE_KEYS.CREDENTIALS]: 'credentials',
  [STORAGE_KEYS.CAMPAIGNS]: 'campaigns',
  [STORAGE_KEYS.REQUESTS]: 'requests',
  [STORAGE_KEYS.TICKETS]: 'tickets',
  [STORAGE_KEYS.NOTIFICATIONS]: 'notifications',
  [STORAGE_KEYS.CLIENTS]: 'clients',
  [STORAGE_KEYS.CONTENT]: 'content',
  [STORAGE_KEYS.CREATIVES]: 'creatives',
  [STORAGE_KEYS.FILES]: 'files',
  [STORAGE_KEYS.TASKS]: 'tasks',
  [STORAGE_KEYS.EMPLOYEES]: 'employees',
  [STORAGE_KEYS.INVOICES]: 'invoices',
  [STORAGE_KEYS.EXPENSES]: 'expenses',
};

const DEFAULT_SEEDS: { [key: string]: any[] } = {
  'users': DEFAULT_USERS,
  'credentials': DEFAULT_CREDENTIALS,
  'campaigns': DEFAULT_CAMPAIGNS,
  'requests': DEFAULT_REQUESTS,
  'tickets': DEFAULT_TICKETS,
  'notifications': DEFAULT_NOTIFICATIONS,
  'clients': DEFAULT_CLIENTS,
  'content': DEFAULT_CONTENT,
  'creatives': DEFAULT_CREATIVES,
  'files': DEFAULT_FILES,
  'tasks': DEFAULT_TASKS,
  'employees': DEFAULT_EMPLOYEES,
  'invoices': DEFAULT_INVOICES,
  'expenses': DEFAULT_EXPENSES,
};

async function saveToFirestore(collectionName: string, item: any): Promise<void> {
  try {
    const id = item.id || item.userId;
    if (!id) return;
    await setDoc(doc(db, collectionName, id), item);
  } catch (error) {
    console.error(`Error saving to Firestore [${collectionName}]:`, error);
  }
}

async function deleteFromFirestore(collectionName: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Error deleting from Firestore [${collectionName}]:`, error);
  }
}

function setupFirestoreSync() {
  Object.entries(KEY_TO_COLLECTION).forEach(([localStorageKey, collectionName]) => {
    const colRef = collection(db, collectionName);
    
    // Subscribe to Firestore changes in real-time
    onSnapshot(colRef, async (snapshot) => {
      if (snapshot.empty) {
        // If Firestore collection is empty, check if we have seed data and populate it
        const seedData = DEFAULT_SEEDS[collectionName];
        if (seedData && seedData.length > 0) {
          console.log(`Seeding Firestore collection [${collectionName}] with default data...`);
          try {
            const batch = writeBatch(db);
            seedData.forEach(item => {
              const id = item.id || item.userId;
              if (id) {
                const docRef = doc(db, collectionName, id);
                batch.set(docRef, item);
              }
            });
            await batch.commit();
          } catch (e) {
            console.error(`Error seeding Firestore collection [${collectionName}]:`, e);
          }
        }
        return;
      }

      // Map Firestore documents to array of objects
      const items: any[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data());
      });

      // Update localStorage with fresh Firestore data
      localStorage.setItem(localStorageKey, JSON.stringify(items));

      // Dispatch a custom window event to trigger re-renders in mounted components
      window.dispatchEvent(new CustomEvent('storage-update', { 
        detail: { key: localStorageKey, collection: collectionName } 
      }));
    }, (error) => {
      console.error(`Firestore listener error on [${collectionName}]:`, error);
    });
  });
}

let isSyncInitialized = false;

// Initial seed trigger and Firestore real-time synchronization hookup
export function initializeDatabase(): void {
  if (isSyncInitialized) return;
  isSyncInitialized = true;

  // 1. Initialize local cache from localStorage if present
  getStoredData(STORAGE_KEYS.USERS, DEFAULT_USERS);
  getStoredData(STORAGE_KEYS.CREDENTIALS, DEFAULT_CREDENTIALS);
  getStoredData(STORAGE_KEYS.CAMPAIGNS, DEFAULT_CAMPAIGNS);
  getStoredData(STORAGE_KEYS.REQUESTS, DEFAULT_REQUESTS);
  getStoredData(STORAGE_KEYS.TICKETS, DEFAULT_TICKETS);
  getStoredData(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  getStoredData(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS);
  getStoredData(STORAGE_KEYS.CONTENT, DEFAULT_CONTENT);
  getStoredData(STORAGE_KEYS.CREATIVES, DEFAULT_CREATIVES);
  getStoredData(STORAGE_KEYS.FILES, DEFAULT_FILES);
  getStoredData(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  getStoredData(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
  getStoredData(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
  getStoredData(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);

  // 2. Setup real-time listeners for each collection
  setupFirestoreSync();
}

// API Emulation Services
export const StorageService = {
  // --- CREATIVE APPROVAL ---
  getCreatives(): CreativeItem[] {
    return getStoredData(STORAGE_KEYS.CREATIVES, DEFAULT_CREATIVES);
  },

  saveCreative(creative: CreativeItem): void {
    const items = this.getCreatives();
    const index = items.findIndex(i => i.id === creative.id);
    if (index >= 0) {
      items[index] = creative;
    } else {
      items.push(creative);
    }
    setStoredData(STORAGE_KEYS.CREATIVES, items);
    saveToFirestore('creatives', creative);
  },

  deleteCreative(id: string): void {
    const items = this.getCreatives();
    const filtered = items.filter(i => i.id !== id);
    setStoredData(STORAGE_KEYS.CREATIVES, filtered);
    deleteFromFirestore('creatives', id);
  },

  // --- FILE MANAGER ---
  getFiles(): ManagedFile[] {
    return getStoredData(STORAGE_KEYS.FILES, DEFAULT_FILES);
  },

  saveFile(file: ManagedFile): void {
    const items = this.getFiles();
    const index = items.findIndex(i => i.id === file.id);
    if (index >= 0) {
      items[index] = file;
    } else {
      items.push(file);
    }
    setStoredData(STORAGE_KEYS.FILES, items);
    saveToFirestore('files', file);
  },

  deleteFile(id: string): void {
    const items = this.getFiles();
    const filtered = items.filter(i => i.id !== id);
    setStoredData(STORAGE_KEYS.FILES, filtered);
    deleteFromFirestore('files', id);
  },

  // --- CONTENT CALENDAR ---
  getContentItems(): ContentItem[] {
    return getStoredData(STORAGE_KEYS.CONTENT, DEFAULT_CONTENT);
  },

  saveContentItem(item: ContentItem): void {
    const items = this.getContentItems();
    const index = items.findIndex(i => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    setStoredData(STORAGE_KEYS.CONTENT, items);
    saveToFirestore('content', item);
  },

  deleteContentItem(id: string): void {
    const items = this.getContentItems();
    const filtered = items.filter(i => i.id !== id);
    setStoredData(STORAGE_KEYS.CONTENT, filtered);
    deleteFromFirestore('content', id);
  },

  // --- CLIENTS CRM ---
  getClients(): CRMClient[] {
    return getStoredData(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS);
  },

  saveClient(client: CRMClient, password?: string): void {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    setStoredData(STORAGE_KEYS.CLIENTS, clients);
    saveToFirestore('clients', client);

    // Maintain secondary sync with USERS if role is client
    const users = this.getUsers();
    const uIndex = users.findIndex(u => u.id === client.id);
    const updatedUser: User = {
      id: client.id,
      name: client.contactPerson,
      email: client.email,
      role: 'client',
      companyName: client.companyName,
      phone: client.phone,
      avatar: client.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(client.contactPerson)}`,
      createdAt: client.startDate || new Date().toISOString()
    };
    if (uIndex >= 0) {
      users[uIndex] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    setStoredData(STORAGE_KEYS.USERS, users);
    saveToFirestore('users', updatedUser);

    // Also sync credentials
    const credentials = this.getCredentials();
    const credIndex = credentials.findIndex(c => c.userId === client.id);
    const passToUse = password || 'cliente123';
    
    if (credIndex >= 0) {
      credentials[credIndex].email = client.email;
      if (password) {
        credentials[credIndex].passwordHash = password;
      }
      setStoredData(STORAGE_KEYS.CREDENTIALS, credentials);
      saveToFirestore('credentials', credentials[credIndex]);
    } else {
      const newCred = {
        userId: client.id,
        email: client.email,
        passwordHash: passToUse
      };
      credentials.push(newCred);
      setStoredData(STORAGE_KEYS.CREDENTIALS, credentials);
      saveToFirestore('credentials', newCred);
    }
  },

  deleteClient(id: string): void {
    const clients = this.getClients();
    const filtered = clients.filter(c => c.id !== id);
    setStoredData(STORAGE_KEYS.CLIENTS, filtered);
    deleteFromFirestore('clients', id);

    // Delete corresponding user and campaigns if needed, or keep clean
    const users = this.getUsers().filter(u => u.id !== id);
    setStoredData(STORAGE_KEYS.USERS, users);
    deleteFromFirestore('users', id);

    const creds = this.getCredentials().filter(c => c.userId !== id);
    setStoredData(STORAGE_KEYS.CREDENTIALS, creds);
    deleteFromFirestore('credentials', id);
  },

  archiveClient(id: string, archive: boolean): void {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index >= 0) {
      clients[index].isArchived = archive;
      setStoredData(STORAGE_KEYS.CLIENTS, clients);
      saveToFirestore('clients', clients[index]);
    }
  },

  // --- USERS ---
  getUsers(): User[] {
    return getStoredData(STORAGE_KEYS.USERS, DEFAULT_USERS);
  },
  
  getCredentials(): UserCredential[] {
    return getStoredData(STORAGE_KEYS.CREDENTIALS, DEFAULT_CREDENTIALS);
  },
  
  saveUser(user: User, password?: string): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    setStoredData(STORAGE_KEYS.USERS, users);
    saveToFirestore('users', user);

    if (password) {
      const credentials = this.getCredentials();
      const credIndex = credentials.findIndex(c => c.userId === user.id);
      let targetCred: UserCredential;
      if (credIndex >= 0) {
        credentials[credIndex].passwordHash = password;
        credentials[credIndex].email = user.email;
        targetCred = credentials[credIndex];
      } else {
        targetCred = {
          userId: user.id,
          email: user.email,
          passwordHash: password,
        };
        credentials.push(targetCred);
      }
      setStoredData(STORAGE_KEYS.CREDENTIALS, credentials);
      saveToFirestore('credentials', targetCred);
    }
  },

  // --- CAMPAIGNS ---
  getCampaigns(): Campaign[] {
    return getStoredData(STORAGE_KEYS.CAMPAIGNS, DEFAULT_CAMPAIGNS);
  },

  saveCampaign(campaign: Campaign): void {
    const campaigns = this.getCampaigns();
    const index = campaigns.findIndex(c => c.id === campaign.id);
    if (index >= 0) {
      campaigns[index] = campaign;
    } else {
      campaigns.push(campaign);
    }
    setStoredData(STORAGE_KEYS.CAMPAIGNS, campaigns);
    saveToFirestore('campaigns', campaign);
  },

  deleteCampaign(id: string): void {
    const campaigns = this.getCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    setStoredData(STORAGE_KEYS.CAMPAIGNS, filtered);
    deleteFromFirestore('campaigns', id);
  },

  // --- SERVICE REQUESTS ---
  getRequests(): ServiceRequest[] {
    return getStoredData(STORAGE_KEYS.REQUESTS, DEFAULT_REQUESTS);
  },

  saveRequest(request: ServiceRequest): void {
    const requests = this.getRequests();
    const index = requests.findIndex(r => r.id === request.id);
    if (index >= 0) {
      requests[index] = request;
    } else {
      requests.push(request);
    }
    setStoredData(STORAGE_KEYS.REQUESTS, requests);
    saveToFirestore('requests', request);
  },

  // --- SUPPORT TICKETS ---
  getTickets(): SupportTicket[] {
    return getStoredData(STORAGE_KEYS.TICKETS, DEFAULT_TICKETS);
  },

  saveTicket(ticket: SupportTicket): void {
    const tickets = this.getTickets();
    const index = tickets.findIndex(t => t.id === ticket.id);
    if (index >= 0) {
      tickets[index] = ticket;
    } else {
      tickets.push(ticket);
    }
    setStoredData(STORAGE_KEYS.TICKETS, tickets);
    saveToFirestore('tickets', ticket);
  },

  // --- NOTIFICATIONS ---
  getNotifications(): Notification[] {
    return getStoredData(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
  },

  addNotification(userId: string, title: string, message: string, type: 'campaign' | 'request' | 'support' | 'system'): void {
    const notifications = this.getNotifications();
    const newNotification: Notification = {
      id: `n-${Date.now()}`,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotification);
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, notifications);
    saveToFirestore('notifications', newNotification);
  },

  markNotificationAsRead(id: string): void {
    const notifications = this.getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index >= 0) {
      notifications[index].read = true;
      setStoredData(STORAGE_KEYS.NOTIFICATIONS, notifications);
      saveToFirestore('notifications', notifications[index]);
    }
  },

  markAllNotificationsAsRead(userId: string): void {
    const notifications = this.getNotifications();
    const updated = notifications.map(n => {
      if (n.userId === userId || n.userId === 'all') {
        const up = { ...n, read: true };
        saveToFirestore('notifications', up);
        return up;
      }
      return n;
    });
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  clearNotifications(userId: string): void {
    const notifications = this.getNotifications();
    const toDelete = notifications.filter(n => n.userId === userId || n.userId === 'all');
    toDelete.forEach(n => {
      deleteFromFirestore('notifications', n.id);
    });
    const filtered = notifications.filter(n => n.userId !== userId && n.userId !== 'all');
    setStoredData(STORAGE_KEYS.NOTIFICATIONS, filtered);
  },

  // --- TASKS ---
  getTasks(): Task[] {
    return getStoredData(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  },

  saveTask(task: Task): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    setStoredData(STORAGE_KEYS.TASKS, tasks);
    saveToFirestore('tasks', task);
  },

  deleteTask(id: string): void {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    setStoredData(STORAGE_KEYS.TASKS, filtered);
    deleteFromFirestore('tasks', id);
  },

  // --- EMPLOYEES ---
  getEmployees(): Employee[] {
    return getStoredData(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES);
  },

  saveEmployee(employee: Employee): void {
    const employees = this.getEmployees();
    const index = employees.findIndex(e => e.id === employee.id);
    if (index >= 0) {
      employees[index] = employee;
    } else {
      employees.push(employee);
    }
    setStoredData(STORAGE_KEYS.EMPLOYEES, employees);
    saveToFirestore('employees', employee);
  },

  deleteEmployee(id: string): void {
    const employees = this.getEmployees();
    const filtered = employees.filter(e => e.id !== id);
    setStoredData(STORAGE_KEYS.EMPLOYEES, filtered);
    deleteFromFirestore('employees', id);
  },

  // --- INVOICES ---
  getInvoices(): Invoice[] {
    return getStoredData(STORAGE_KEYS.INVOICES, DEFAULT_INVOICES);
  },

  saveInvoice(invoice: Invoice): void {
    const invoices = this.getInvoices();
    const index = invoices.findIndex(i => i.id === invoice.id);
    if (index >= 0) {
      invoices[index] = invoice;
    } else {
      invoices.push(invoice);
    }
    setStoredData(STORAGE_KEYS.INVOICES, invoices);
    saveToFirestore('invoices', invoice);
  },

  deleteInvoice(id: string): void {
    const invoices = this.getInvoices();
    const filtered = invoices.filter(i => i.id !== id);
    setStoredData(STORAGE_KEYS.INVOICES, filtered);
    deleteFromFirestore('invoices', id);
  },

  // --- EXPENSES ---
  getExpenses(): Expense[] {
    return getStoredData(STORAGE_KEYS.EXPENSES, DEFAULT_EXPENSES);
  },

  saveExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === expense.id);
    if (index >= 0) {
      expenses[index] = expense;
    } else {
      expenses.push(expense);
    }
    setStoredData(STORAGE_KEYS.EXPENSES, expenses);
    saveToFirestore('expenses', expense);
  },

  deleteExpense(id: string): void {
    const expenses = this.getExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    setStoredData(STORAGE_KEYS.EXPENSES, filtered);
    deleteFromFirestore('expenses', id);
  }
};
