/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'client';

export interface CRMClient {
  id: string;
  companyName: string;
  logo: string;
  contactPerson: string;
  email: string;
  phone: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
  contractInfo: string;
  monthlyPlan: number;
  paymentStatus: 'em_dia' | 'atrasado' | 'pendente';
  startDate: string;
  notes: string;
  isArchived: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export type CampaignStatus = 'planejamento' | 'ativo' | 'pausado' | 'concluido';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  budget: number;
  platforms: string[]; // e.g., ['Meta Ads', 'Google Ads', 'TikTok Ads']
  metrics?: {
    reach: number;
    clicks: number;
    conversions: number;
    spend: number;
  };
}

export type ServiceRequestType = 
  | 'social_media' 
  | 'design_grafico' 
  | 'trafego_pago' 
  | 'branding' 
  | 'copywriting' 
  | 'outros';

export type ServiceRequestStatus = 
  | 'pendente' 
  | 'em_producao' 
  | 'revisao' 
  | 'concluido' 
  | 'cancelado';

export type ServiceRequestPriority = 'baixa' | 'media' | 'alta';

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  type: ServiceRequestType;
  clientId: string;
  clientName: string;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  createdAt: string;
  deadline?: string;
  feedback?: string;
  updates?: {
    by: string;
    role: UserRole;
    text: string;
    createdAt: string;
  }[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  clientId: string;
  clientName: string;
  status: 'aberto' | 'em_atendimento' | 'respondido' | 'fechado';
  createdAt: string;
  replies: {
    id: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    message: string;
    createdAt: string;
  }[];
}

export interface Notification {
  id: string;
  userId: string; // 'all' or specific user id
  title: string;
  message: string;
  type: 'campaign' | 'request' | 'support' | 'system';
  read: boolean;
  createdAt: string;
}

export type ContentStatus = 
  | 'rascunho' 
  | 'em_producao' 
  | 'aguardando_aprovacao' 
  | 'aprovado' 
  | 'agendado' 
  | 'publicado';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  platform: string;
  caption: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  responsiblePerson: string;
  publicationDate: string; // YYYY-MM-DD
  status: ContentStatus;
  clientId: string;
  clientName: string;
  createdAt: string;
}

export type CreativeFormat = 'image' | 'video' | 'reels' | 'stories' | 'pdf' | 'presentation';

export type CreativeApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface CreativeComment {
  id: string;
  userId: string;
  userName: string;
  userRole: 'admin' | 'client';
  content: string;
  createdAt: string;
}

export interface CreativeRevision {
  id: string;
  version: number;
  fileUrl: string;
  format: CreativeFormat;
  description: string;
  status: CreativeApprovalStatus;
  changedBy: string;
  comments?: string;
  createdAt: string;
}

export interface CreativeItem {
  id: string;
  title: string;
  description: string;
  format: CreativeFormat;
  fileUrl: string;
  status: CreativeApprovalStatus;
  clientId: string;
  clientName: string;
  comments: CreativeComment[];
  revisions: CreativeRevision[];
  createdAt: string;
  updatedAt: string;
}

export type FileCategory = 
  | 'logos' 
  | 'identidade_visual' 
  | 'fotos' 
  | 'videos' 
  | 'documentos' 
  | 'contratos' 
  | 'relatorios' 
  | 'marketing';

export interface FileHistoryItem {
  id: string;
  version: number;
  name: string;
  fileUrl: string;
  size: string;
  uploadedBy: string;
  createdAt: string;
  note: string;
}

export interface ManagedFile {
  id: string;
  name: string;
  category: FileCategory;
  size: string;
  type: string;
  fileUrl: string;
  clientId: string;
  clientName: string;
  uploadedBy: string;
  version: number;
  history: FileHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export type ChatAttachmentType = 'image' | 'video' | 'document' | 'voice';

export interface ChatAttachment {
  name: string;
  url: string;
  type: ChatAttachmentType;
  size?: string;
}

export interface ChatReaction {
  emoji: string;
  users: string[]; // List of user IDs who reacted
}

export interface ChatMessage {
  id: string;
  clientId: string; // Used as the channel/conversation ID
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar?: string;
  text: string;
  attachment?: ChatAttachment;
  reactions: ChatReaction[];
  readBy: string[]; // List of user IDs who have read this message
  createdAt: string;
}

export interface ChatConversation {
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string; // e.g. Designer, Redator, Gestor de Tráfego, Dev, etc.
  avatar?: string;
  permissions: string[]; // e.g. ['Criar Tarefas', 'Editar Tarefas', 'Excluir Tarefas', 'Gerenciar Equipe']
  assignedProjects: string[]; // List of company names or IDs
  createdAt: string;
}

export interface TaskComment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
  size?: string;
}

export type TaskPriority = 'baixa' | 'media' | 'alta';
export type TaskStatus = 'a_fazer' | 'em_andamento' | 'revisao' | 'concluido';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedEmployeeId?: string; // Reference to Employee ID
  deadline: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  attachments: TaskAttachment[];
  comments: TaskComment[];
  clientId?: string; // associated project/client
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'paga' | 'pendente' | 'atrasada' | 'cancelada';

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: InvoiceStatus;
  description: string;
  documentUrl?: string;
  createdAt: string;
}

export type ExpenseCategory = 'salarios' | 'ferramentas' | 'infraestrutura' | 'impostos' | 'marketing' | 'outros';

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  description: string;
  recipient: string;
  status: 'pago' | 'pendente';
  createdAt: string;
}




