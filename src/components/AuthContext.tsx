/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService, initializeDatabase } from '../lib/storage';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, passwordHash: string) => { success: boolean; error?: string };
  register: (name: string, email: string, passwordHash: string, companyName?: string, phone?: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => { success: boolean; error?: string };
  requestPasswordRecovery: (email: string) => { success: boolean; error?: string };
  resetPasswordWithCode: (email: string, code: string, newPasswordHash: string) => { success: boolean; error?: string };
  recoveryCode: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  useEffect(() => {
    // Initialize standard/seed data if not already present in localStorage
    initializeDatabase();

    // Check if user is already logged in (session persistence)
    const sessionUser = localStorage.getItem('aparato_session_user');
    if (sessionUser) {
      try {
        const user = JSON.parse(sessionUser) as User;
        // Verify user still exists in DB
        const users = StorageService.getUsers();
        const existing = users.find(u => u.id === user.id);
        if (existing) {
          setCurrentUser(existing);
        } else {
          localStorage.removeItem('aparato_session_user');
        }
      } catch (e) {
        localStorage.removeItem('aparato_session_user');
      }
    }
  }, []);

  const login = (email: string, passwordHash: string) => {
    const credentials = StorageService.getCredentials();
    const cred = credentials.find(c => c.email.toLowerCase() === email.toLowerCase());
    
    if (!cred || cred.passwordHash !== passwordHash) {
      return { success: false, error: 'E-mail ou senha incorretos. Por favor, tente novamente.' };
    }

    const users = StorageService.getUsers();
    const user = users.find(u => u.id === cred.userId);
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado no banco de dados.' };
    }

    setCurrentUser(user);
    localStorage.setItem('aparato_session_user', JSON.stringify(user));
    
    // Add login notification
    StorageService.addNotification(
      user.id,
      'Acesso Detectado',
      `Login realizado com sucesso em ${new Date().toLocaleTimeString('pt-BR')}.`,
      'system'
    );

    return { success: true };
  };

  const register = (
    name: string,
    email: string,
    passwordHash: string,
    companyName?: string,
    phone?: string
  ) => {
    const users = StorageService.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Este e-mail já está cadastrado em nosso sistema.' };
    }

    const id = `u-client-${Date.now()}`;
    const newUser: User = {
      id,
      name,
      email,
      role: 'client', // Registration defaults to Client
      companyName,
      phone,
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };

    // Save to localStorage DB
    StorageService.saveUser(newUser, passwordHash);
    
    // Create notification for admin
    StorageService.addNotification(
      'u-admin-1',
      'Novo Cliente Registrado',
      `O cliente "${name}" (${companyName || 'Autônomo'}) criou uma conta no Aparato OS.`,
      'system'
    );

    // Auto login
    setCurrentUser(newUser);
    localStorage.setItem('aparato_session_user', JSON.stringify(newUser));

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      localStorage.removeItem('aparato_session_user');
      setCurrentUser(null);
    }
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!currentUser) return { success: false, error: 'Nenhum usuário logado.' };

    const users = StorageService.getUsers();
    const updatedUser = { ...currentUser, ...updatedData } as User;

    // Email change verification
    if (updatedData.email && updatedData.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      if (users.some(u => u.email.toLowerCase() === updatedData.email!.toLowerCase() && u.id !== currentUser.id)) {
        return { success: false, error: 'Este e-mail já está sendo utilizado por outro usuário.' };
      }
    }

    // Save
    StorageService.saveUser(updatedUser);
    setCurrentUser(updatedUser);
    localStorage.setItem('aparato_session_user', JSON.stringify(updatedUser));

    return { success: true };
  };

  const requestPasswordRecovery = (email: string) => {
    const users = StorageService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, error: 'E-mail não cadastrado.' };
    }

    // Generate a clean recovery code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRecoveryCode(code);
    
    // Simulate email dispatch
    console.log(`[Recuperação de Senha] Código de segurança enviado para ${email}: ${code}`);
    
    // Create a notification for security tracking
    StorageService.addNotification(
      user.id,
      'Recuperação de Senha Solicitada',
      'Um código de verificação foi gerado para alteração de senha.',
      'system'
    );

    return { success: true };
  };

  const resetPasswordWithCode = (email: string, code: string, newPasswordHash: string) => {
    if (!recoveryCode || code !== recoveryCode) {
      return { success: false, error: 'Código de segurança incorreto ou expirado.' };
    }

    const users = StorageService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    // Save with the new password
    StorageService.saveUser(user, newPasswordHash);
    
    // Reset state
    setRecoveryCode(null);

    // Create success notification
    StorageService.addNotification(
      user.id,
      'Senha Redefinida',
      'Sua senha de acesso foi redefinida com sucesso.',
      'system'
    );

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        register,
        logout,
        updateProfile,
        requestPasswordRecovery,
        resetPasswordWithCode,
        recoveryCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
