/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { StorageService } from '../lib/storage';
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Lock, 
  Bell, 
  Palette, 
  Check, 
  AlertCircle,
  Building
} from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsModule: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile forms
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [companyName, setCompanyName] = useState(currentUser?.companyName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  
  // Passwords form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status alerts
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Notification states
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(false);

  if (!currentUser) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    const res = updateProfile({
      name,
      email,
      companyName: currentUser.role === 'client' ? companyName : undefined,
      phone,
    });

    if (res.success) {
      setProfileSuccess('Perfil atualizado com sucesso no banco de dados!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } else {
      setProfileError(res.error || 'Erro ao atualizar perfil.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 5) {
      setPasswordError('A nova senha deve possuir pelo menos 5 caracteres.');
      return;
    }

    // Authenticate current password
    const credentials = StorageService.getCredentials();
    const cred = credentials.find(c => c.userId === currentUser.id);

    if (!cred || cred.passwordHash !== currentPassword) {
      setPasswordError('Senha atual incorreta.');
      return;
    }

    // Save
    StorageService.saveUser(currentUser, newPassword);
    
    setPasswordSuccess('Sua senha de acesso foi atualizada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(''), 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      {/* Profile and general info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <UserIcon className="text-brand-accent" size={18} />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Informações do Perfil
            </h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
                <Check size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">E-mail Comercial</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                />
              </div>

              {currentUser.role === 'client' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">Nome da Empresa</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Celular / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-light dark:bg-brand-accent dark:hover:bg-brand-accent-hover dark:text-brand-primary font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Salvar Configurações de Perfil
              </button>
            </div>
          </form>
        </div>

        {/* Password Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="text-brand-accent" size={18} />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Segurança e Senha
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
                <Check size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Senha Atual</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Nova Senha</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 5 digitos"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 block">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-white font-bold text-xs shadow-sm transition-all cursor-pointer border border-slate-200/50 dark:border-slate-700"
              >
                Alterar Senha de Acesso
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Visual Settings and notifications sidebar settings */}
      <div className="space-y-6">
        {/* Visual presets Theme Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="text-brand-accent" size={18} />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Aparência Visual
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-brand-accent bg-gold-100/30'
                  : 'border-slate-150 hover:bg-slate-50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 border flex items-center justify-center text-slate-500">
                ☀️
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Modo Claro</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-brand-accent bg-brand-primary-light/10'
                  : 'border-slate-800 hover:bg-slate-800/30'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#0a232c] border border-[#1b5c72] flex items-center justify-center text-yellow-400">
                🌙
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Modo Escuro</span>
            </button>
          </div>
        </div>

        {/* Notifications Checkboxes Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="text-brand-accent" size={18} />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Canais de Notificação
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifEmail}
                onChange={(e) => setNotifEmail(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Notificações por E-mail</span>
                <span className="text-[10px] text-slate-400">Receba boletins de status de jobs no seu e-mail corporativo.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifPush}
                onChange={(e) => setNotifPush(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Notificações de Sistema</span>
                <span className="text-[10px] text-slate-400">Ativar balão interno de alertas e novas mensagens de suporte.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifWeekly}
                onChange={(e) => setNotifWeekly(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200 block">Relatórios Semanais (ROI)</span>
                <span className="text-[10px] text-slate-400">Receba compilados de cliques e conversões nas noites de domingo.</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
