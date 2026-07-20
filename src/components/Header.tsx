/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { StorageService } from '../lib/storage';
import { Notification } from '../types';
import { 
  Bell, 
  Sun, 
  Moon, 
  Menu, 
  CheckCircle, 
  Trash2, 
  Megaphone, 
  FileCode2, 
  LifeBuoy, 
  Settings as SettingsIcon,
  CircleAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  activeTab: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  sidebarOpen, 
  setSidebarOpen 
}) => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Load notifications periodically
  const fetchNotifications = () => {
    if (!currentUser) return;
    const allNotifs = StorageService.getNotifications();
    // Admin gets system & admin notifications; clients get their specific ones or general
    const userNotifs = allNotifs.filter(n => 
      n.userId === currentUser.id || 
      (currentUser.role === 'admin' && n.userId === 'u-admin-1') ||
      n.userId === 'all'
    );
    setNotifications(userNotifs);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 5 seconds to simulate dynamic database triggers
    const interval = setInterval(fetchNotifications, 5000);

    const handleSync = () => {
      fetchNotifications();
    };
    window.addEventListener('storage-update', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage-update', handleSync);
    };
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.markNotificationAsRead(id);
    fetchNotifications();
  };

  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    const targetUserId = currentUser.role === 'admin' ? 'u-admin-1' : currentUser.id;
    StorageService.markAllNotificationsAsRead(targetUserId);
    fetchNotifications();
  };

  const handleClearNotifications = () => {
    if (!currentUser) return;
    const targetUserId = currentUser.role === 'admin' ? 'u-admin-1' : currentUser.id;
    StorageService.clearNotifications(targetUserId);
    fetchNotifications();
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Painel de Controle';
      case 'campaigns': return 'Central de Campanhas';
      case 'requests': return 'Solicitações de Marketing';
      case 'support': return 'Suporte Técnico';
      case 'settings': return 'Configurações da Plataforma';
      default: return 'Aparato OS';
    }
  };

  const getTabSubtitle = () => {
    if (currentUser?.role === 'admin') {
      switch (activeTab) {
        case 'dashboard': return 'Visão consolidada de todas as contas e métricas ativas.';
        case 'campaigns': return 'Gerencie, publique e atualize métricas de campanhas de marketing.';
        case 'requests': return 'Avalie, comente e mude status das solicitações recebidas.';
        case 'support': return 'Responda a dúvidas e chamados abertos pelos clientes.';
        case 'settings': return 'Ajustes globais do seu perfil de administrador.';
        default: return 'Painel Administrativo';
      }
    } else {
      switch (activeTab) {
        case 'dashboard': return `Seja bem-vindo de volta à sua central, ${currentUser?.name.split(' ')[0]}!`;
        case 'campaigns': return 'Acompanhe os resultados reais de suas campanhas contratadas.';
        case 'requests': return 'Solicite novos posts, artes, redações e tráfego pago.';
        case 'support': return 'Abra chamados técnicos e tire dúvidas com nosso time.';
        case 'settings': return 'Gerencie as preferências da sua conta corporativa.';
        default: return 'Sua central de marketing digital';
      }
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'campaign': return <Megaphone className="text-amber-500" size={16} />;
      case 'request': return <FileCode2 className="text-blue-500" size={16} />;
      case 'support': return <LifeBuoy className="text-emerald-500" size={16} />;
      default: return <CircleAlert className="text-slate-400" size={16} />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-[#0d3340]/80 backdrop-blur-md border-b border-slate-200 dark:border-[#114455]/30 flex items-center justify-between px-6 transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Toggle */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          id="header-mobile-toggle"
        >
          <Menu size={20} />
        </button>

        {/* Dynamic Titles */}
        <div>
          <h1 className="text-lg font-bold font-display text-slate-800 dark:text-white leading-tight">
            {getTabTitle()}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            {getTabSubtitle()}
          </p>
        </div>
      </div>

      {/* Utility Actions */}
      <div className="flex items-center gap-3">
        {/* Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-all cursor-pointer relative"
          title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          id="theme-toggle-btn"
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.div
                key="sun"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Sun size={18} className="text-brand-accent" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -45, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Moon size={18} className="text-brand-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-all relative cursor-pointer"
            id="notifications-bell-btn"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifDropdown && (
              <>
                {/* Overlay layer to close dropdown */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifDropdown(false)} 
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {/* Dropdown Header */}
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      Notificações ({notifications.length})
                    </span>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] text-brand-primary dark:text-brand-accent hover:underline font-semibold"
                        >
                          Ler todas
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={handleClearNotifications}
                          className="text-[10px] text-rose-500 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Trash2 size={10} /> Limpar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Body */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={24} />
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Nenhuma notificação por aqui.
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`p-3 text-left transition-colors cursor-pointer relative flex gap-3 ${
                            notif.read ? 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50' : 'bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/20 dark:hover:bg-slate-800/40'
                          }`}
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                        >
                          <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between gap-1">
                              <span className="truncate">{notif.title}</span>
                              {!notif.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent shrink-0" />
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                              {notif.message}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1">
                              {new Date(notif.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Visual Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <img 
            src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'A')}`}
            alt={currentUser?.name} 
            className="w-8 h-8 rounded-full border border-gold-500"
            referrerPolicy="no-referrer"
          />
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-white leading-none truncate max-w-[80px]">
              {currentUser?.name.split(' ')[0]}
            </p>
            <span className="text-[9px] text-brand-accent font-semibold uppercase tracking-wider">
              {currentUser?.role === 'admin' ? 'Admin' : 'Cliente'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
