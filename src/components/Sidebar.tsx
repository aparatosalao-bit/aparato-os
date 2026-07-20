/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from './AuthContext';
import logoImage from '../assets/images/regenerated_image_1784501042739.png';
import { 
  LayoutDashboard, 
  Megaphone, 
  FileCode2, 
  LifeBuoy, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Building2,
  Users,
  Calendar,
  CheckSquare,
  Folder,
  MessageSquare,
  DollarSign,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen 
}) => {
  const { currentUser, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    ...(currentUser?.role === 'admin' ? [{ id: 'clients', label: 'Gestão Clientes', icon: Users }] : []),
    { id: 'campaigns', label: 'Campanhas', icon: Megaphone },
    { id: 'calendar', label: 'Calendário Editorial', icon: Calendar },
    { id: 'ai-assistant', label: 'Assistente IA Marketing', icon: Sparkles },
    { id: 'creative-approval', label: 'Aprovação de Criativos', icon: CheckSquare },
    { id: 'files', label: 'Gerenciador de Arquivos', icon: Folder },
    { id: 'requests', label: 'Solicitações', icon: FileCode2 },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'support', label: 'Suporte Técnico', icon: LifeBuoy },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  if (!currentUser) return null;

  return (
    <aside 
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-[#114455]/30 bg-[#08222a] text-white flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#114455]/30">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-gold-200 overflow-hidden">
            <img 
              src={logoImage} 
              alt="Aparato Logo" 
              className="w-full h-full object-contain p-1"
              referrerPolicy="no-referrer"
            />
          </div>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-bold text-base leading-none tracking-tight font-display text-white">
                Aparato <span className="text-brand-accent">OS</span>
              </span>
              <span className="text-[10px] text-slate-300 tracking-wider uppercase font-medium mt-1">
                Marketing Hub
              </span>
            </motion.div>
          )}
        </div>

        {/* Toggle Button for Desktop */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-md hover:bg-[#1b5c72] text-slate-300 hover:text-white transition-colors"
          id="sidebar-toggle-btn"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all group relative ${
                isActive 
                  ? 'bg-[#114455] text-white border-l-2 border-[#ffd700] rounded-r-lg shadow-sm' 
                  : 'text-slate-300 hover:bg-[#114455]/40 hover:text-white transition-colors'
              }`}
              id={`nav-item-${item.id}`}
            >
              <Icon size={20} className={isActive ? 'text-[#ffd700]' : 'text-slate-400 group-hover:text-white'} />
              {isOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
              
              {/* Highlight active item indicator on collapsed sidebar */}
              {!isOpen && isActive && (
                <div className="absolute right-1 w-1 h-6 bg-[#ffd700] rounded-l-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile / Meta Area */}
      <div className="p-3 border-t border-[#114455]/30 space-y-2">
        {currentUser.role === 'admin' && isOpen && (
          <div className="mx-2 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[11px] text-brand-accent">
            <ShieldAlert size={14} className="shrink-0" />
            <span className="font-medium truncate">Acesso Administrativo</span>
          </div>
        )}

        <div className={`flex items-center ${isOpen ? 'justify-between px-2' : 'justify-center'} py-2`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`}
              alt={currentUser.name} 
              className="w-9 h-9 rounded-full border-2 border-brand-accent object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
            {isOpen && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-300 truncate mt-0.5 flex items-center gap-1">
                  <Building2 size={10} />
                  {currentUser.companyName || 'Aparato Team'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Logout Action */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-200 hover:bg-rose-500/10 hover:text-rose-100 transition-colors ${
            isOpen ? '' : 'justify-center'
          }`}
          id="sidebar-logout-btn"
          title="Sair da Conta"
        >
          <LogOut size={20} className="shrink-0" />
          {isOpen && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};
