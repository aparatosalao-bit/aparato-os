/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { Sidebar } from './components/Sidebar';
import logoImage from './assets/images/regenerated_image_1784501042739.png';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { CampaignsModule } from './components/CampaignsModule';
import { ServiceRequestsModule } from './components/ServiceRequestsModule';
import { SupportModule } from './components/SupportModule';
import { SettingsModule } from './components/SettingsModule';
import { ClientsModule } from './components/ClientsModule';
import { ContentCalendarModule } from './components/ContentCalendarModule';
import { CreativeApprovalModule } from './components/CreativeApprovalModule';
import { FileManagerModule } from './components/FileManagerModule';
import { ChatModule } from './components/ChatModule';
import { FinanceModule } from './components/FinanceModule';
import { AiAssistantModule } from './components/AiAssistantModule';
import { 
  Lock, 
  Mail, 
  UserPlus, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  Phone,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DashboardLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview setActiveTab={setActiveTab} />;
      case 'clients':
        return <ClientsModule />;
      case 'campaigns':
        return <CampaignsModule />;
      case 'calendar':
        return <ContentCalendarModule />;
      case 'ai-assistant':
        return <AiAssistantModule />;
      case 'creative-approval':
        return <CreativeApprovalModule />;
      case 'files':
        return <FileManagerModule />;
      case 'requests':
        return <ServiceRequestsModule />;
      case 'finance':
        return <FinanceModule />;
      case 'support':
        return <SupportModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <DashboardOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${sidebarOpen ? 'md:pl-64' : 'md:pl-20'}`}>
        <Header 
          activeTab={activeTab} 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {renderActiveModule()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const AuthScreens: React.FC = () => {
  const { login, register, requestPasswordRecovery, resetPasswordWithCode, recoveryCode } = useAuth();
  const [screen, setScreen] = useState<'login' | 'register' | 'recover' | 'reset'>('login');
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Recovery inputs
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearAlerts = () => {
    setError('');
    setSuccess('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (!email || !password) return;

    const res = login(email, password);
    if (!res.success) {
      setError(res.error || 'Erro ao realizar login.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (!name || !email || !password) {
      setError('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const res = register(name, email, password, companyName || undefined, phone || undefined);
    if (!res.success) {
      setError(res.error || 'Erro ao registrar conta.');
    } else {
      setSuccess('Conta criada com sucesso! Redirecionando...');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (!recoveryEmail) return;

    const res = requestPasswordRecovery(recoveryEmail);
    if (res.success) {
      setSuccess('Código de verificação gerado! Verifique os logs de segurança e digite o código de 6 dígitos.');
      setTimeout(() => {
        setScreen('reset');
        setSuccess('');
      }, 1500);
    } else {
      setError(res.error || 'Este e-mail não foi encontrado em nossa base.');
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    if (!verificationCode || !newPassword || !confirmNewPassword) return;

    if (newPassword !== confirmNewPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const res = resetPasswordWithCode(recoveryEmail, verificationCode, newPassword);
    if (res.success) {
      setSuccess('Sua senha foi atualizada com sucesso! Prossiga para realizar o login.');
      setTimeout(() => {
        setScreen('login');
        resetFields();
      }, 2000);
    } else {
      setError(res.error || 'Código incorreto ou inválido.');
    }
  };

  const resetFields = () => {
    setEmail('');
    setPassword('');
    setName('');
    setCompanyName('');
    setPhone('');
    setRecoveryEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    clearAlerts();
  };

  return (
    <div className="min-h-screen bg-brand-primary dark:bg-[#0a1f27] text-white flex flex-col justify-between p-4 relative overflow-hidden transition-colors duration-300">
      {/* Visual Ambient Background assets */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-brand-accent/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Top logo display */}
      <div className="flex items-center justify-between max-w-6xl mx-auto w-full py-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg border border-gold-200 overflow-hidden">
            <img 
              src={logoImage} 
              alt="Aparato Logo" 
              className="w-full h-full object-contain p-1"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-extrabold text-lg tracking-tight font-display text-white">
            Aparato <span className="text-brand-accent">OS</span>
          </span>
        </div>
        
        <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest hidden sm:block">
          SaaS Plataforma Integrada
        </div>
      </div>

      {/* Main card box area */}
      <div className="flex-1 flex items-center justify-center z-10 py-10">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200/20 dark:border-slate-800 overflow-hidden relative">
          
          {/* Top colored accent line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary-light" />
          
          <div className="p-6 sm:p-8 space-y-6 text-left">
            <AnimatePresence mode="wait">
              {/* LOGIN SCREEN */}
              {screen === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold font-display text-[#114455] dark:text-brand-accent">Acesse sua Conta</h2>
                    <p className="text-xs text-slate-500">Insira suas credenciais de parceiro da Aparato Marketing.</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">E-mail Corporativo</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com.br"
                          className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                          id="login-email-input"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500">Senha de Acesso</label>
                        <button
                          type="button"
                          onClick={() => { clearAlerts(); setScreen('recover'); }}
                          className="text-[11px] text-brand-primary dark:text-brand-accent hover:underline font-semibold"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Digite sua senha"
                          className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                          id="login-password-input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-light text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
                      id="login-submit-btn"
                    >
                      Acessar Aparato OS
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-400">
                      Área segura e restrita para parceiros credenciados.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* REGISTER SCREEN */}
              {screen === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold font-display text-[#114455] dark:text-brand-accent">Registrar Nova Conta</h2>
                    <p className="text-xs text-slate-500">Crie uma conta corporativa de cliente no Aparato OS.</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle size={16} className="shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Seu Nome Completo *</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-3 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Carlos Silva"
                          className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">E-mail Corporativo *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Ex: carlos@salaoestilo.com"
                          className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Nome da Empresa</label>
                        <div className="relative">
                          <Building className="absolute left-3.5 top-3 text-slate-400" size={16} />
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Salão Estilo"
                            className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Celular / WhatsApp</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(11) 98765-4321"
                            className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Senha de Acesso *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 5 dígitos"
                          className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary-light text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
                    >
                      Criar minha Conta Comercial
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => { resetFields(); setScreen('login'); }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft size={14} /> Voltar para o Login
                    </button>
                  </div>
                </motion.div>
              )}

              {/* PASSWORD RECOVERY EMAIL */}
              {screen === 'recover' && (
                <motion.div
                  key="recover"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold font-display text-[#114455] dark:text-brand-accent">Recuperar Senha</h2>
                    <p className="text-xs text-slate-500">Digite seu e-mail para enviarmos um código numérico de redefinição.</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-center gap-2 animate-pulse">
                      <CheckCircle size={16} className="shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  <form onSubmit={handleRecoverySubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Insira seu E-mail Cadastrado</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                        <input
                          type="email"
                          required
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          placeholder="Ex: cliente@aparato.com.br"
                          className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-light text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
                    >
                      Enviar Código de Segurança
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => { resetFields(); setScreen('login'); }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft size={14} /> Cancelar e Voltar
                    </button>
                  </div>
                </motion.div>
              )}

              {/* VERIFICATION CODE AND RESET FORM */}
              {screen === 'reset' && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold font-display text-[#114455] dark:text-brand-accent">Redefinir Senha</h2>
                    <p className="text-xs text-slate-500">Digite o código de 6 dígitos enviado e defina sua nova senha.</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle size={16} className="shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Dynamic simulated reminder so the user doesn't get blocked */}
                  {recoveryCode && (
                    <div className="p-3.5 bg-brand-accent/10 border border-brand-accent/25 rounded-xl text-xs text-amber-700 dark:text-brand-accent space-y-1">
                      <p className="font-bold">🔑 Código de Verificação Simulado:</p>
                      <p>Insira o código gerado pelo sistema: <strong className="text-sm tracking-widest">{recoveryCode}</strong></p>
                    </div>
                  )}

                  <form onSubmit={handleResetSubmit} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Código de 6 dígitos</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Ex: 123456"
                        className="w-full text-center text-sm font-bold tracking-widest px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Nova Senha</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 5 caracteres"
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirme sua nova senha"
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-850 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-light text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
                    >
                      Redefinir Minha Senha
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => { resetFields(); setScreen('login'); }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft size={14} /> Voltar para o Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer credits area */}
      <div className="text-[11px] text-slate-400 dark:text-slate-500 py-4 z-10 max-w-6xl mx-auto w-full text-center">
        © 2026 Aparato Marketing. Todos os direitos reservados. Termos de Serviço • Políticas de Privacidade.
      </div>
    </div>
  );
};

const MainRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DashboardLayout /> : <AuthScreens />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
