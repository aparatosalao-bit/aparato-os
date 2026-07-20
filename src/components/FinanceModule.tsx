/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { StorageService } from '../lib/storage';
import { Invoice, Expense, CRMClient, InvoiceStatus, ExpenseCategory } from '../types';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Trash2, 
  Edit3, 
  CreditCard, 
  QrCode, 
  Filter, 
  RefreshCw, 
  Percent, 
  Sparkles, 
  ArrowUpRight, 
  FileCheck, 
  FileX, 
  Check, 
  Download, 
  Info,
  Clock,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const FinanceModule: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Core Finance State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<CRMClient[]>([]);

  // Navigation & View States
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'invoices' | 'expenses' | 'clients'>('overview');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');

  // Modals States
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
  const [isPixPaidSimulated, setIsPixPaidSimulated] = useState(false);

  // Form Fields - Invoice
  const [invClientId, setInvClientId] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDueDate, setInvDueDate] = useState('');
  const [invStatus, setInvStatus] = useState<InvoiceStatus>('pendente');
  const [invDescription, setInvDescription] = useState('');

  // Form Fields - Expense
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('outros');
  const [expDescription, setExpDescription] = useState('');
  const [expRecipient, setExpRecipient] = useState('');
  const [expStatus, setExpStatus] = useState<'pago' | 'pendente'>('pendente');

  // Custom delete states
  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<string | null>(null);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  // Load Database
  useEffect(() => {
    refreshData();

    const handleSync = () => {
      refreshData();
    };
    window.addEventListener('storage-update', handleSync);
    return () => {
      window.removeEventListener('storage-update', handleSync);
    };
  }, []);

  const refreshData = () => {
    setInvoices(StorageService.getInvoices());
    setExpenses(StorageService.getExpenses());
    setClients(StorageService.getClients());
  };

  const invoiceToDelete = invoices.find(i => i.id === invoiceToDeleteId);
  const expenseToDelete = expenses.find(e => e.id === expenseToDeleteId);

  // ----------------------------------------------------
  // CALCULATION HELPERS
  // ----------------------------------------------------
  
  // Admin stats
  const totalRevenue = invoices
    .filter(i => i.status === 'paga')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExpenses = expenses
    .filter(e => e.status === 'pago')
    .reduce((sum, e) => sum + e.amount, 0);

  const netProfit = totalRevenue - totalExpenses;

  const pendingRevenue = invoices
    .filter(i => i.status === 'pendente')
    .reduce((sum, i) => sum + i.amount, 0);

  const overdueRevenue = invoices
    .filter(i => i.status === 'atrasada')
    .reduce((sum, i) => sum + i.amount, 0);

  // Client stats
  const clientInvoices = invoices.filter(i => i.clientId === currentUser?.id);
  const clientNextInvoice = clientInvoices
    .filter(i => i.status === 'pendente' || i.status === 'atrasada')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const clientPaidThisYear = clientInvoices
    .filter(i => i.status === 'paga')
    .reduce((sum, i) => sum + i.amount, 0);

  // Chart 1: Revenue vs Expenses by Month
  const getMonthlyChartData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = 2026;

    return months.map((month, index) => {
      const monthStr = String(index + 1).padStart(2, '0');
      
      const monthRevenue = invoices
        .filter(i => i.status === 'paga' && i.paymentDate?.startsWith(`${currentYear}-${monthStr}`))
        .reduce((sum, i) => sum + i.amount, 0);

      const monthExpenses = expenses
        .filter(e => e.status === 'pago' && e.date.startsWith(`${currentYear}-${monthStr}`))
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        name: month,
        Receita: monthRevenue,
        Despesa: monthExpenses,
        Lucro: monthRevenue - monthExpenses
      };
    });
  };

  // Chart 2: Expenses by Category
  const getCategoryChartData = () => {
    const categories: { key: ExpenseCategory; label: string; color: string }[] = [
      { key: 'salarios', label: 'Salários/Equipe', color: '#10B981' },
      { key: 'ferramentas', label: 'Softwares/Ferramentas', color: '#3B82F6' },
      { key: 'infraestrutura', label: 'Infraestrutura', color: '#F59E0B' },
      { key: 'impostos', label: 'Impostos', color: '#EF4444' },
      { key: 'marketing', label: 'Marketing Interno', color: '#8B5CF6' },
      { key: 'outros', label: 'Outros', color: '#6B7280' }
    ];

    return categories.map(cat => {
      const value = expenses
        .filter(e => e.status === 'pago' && e.category === cat.key)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        name: cat.label,
        value: value,
        color: cat.color
      };
    }).filter(c => c.value > 0);
  };

  // Format currency helper
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Filter lists
  const getFilteredInvoices = () => {
    let list = [...invoices];
    if (!isAdmin) {
      list = list.filter(i => i.clientId === currentUser?.id);
    } else {
      if (clientFilter !== 'all') {
        list = list.filter(i => i.clientId === clientFilter);
      }
    }

    if (statusFilter !== 'all') {
      list = list.filter(i => i.status === statusFilter);
    }

    if (searchQuery) {
      list = list.filter(i => 
        i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.clientName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  };

  const getFilteredExpenses = () => {
    let list = [...expenses];
    
    if (expenseCategoryFilter !== 'all') {
      list = list.filter(e => e.category === expenseCategoryFilter);
    }

    if (searchQuery) {
      list = list.filter(e => 
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.recipient.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // ----------------------------------------------------
  // INVOICE HANDLERS
  // ----------------------------------------------------
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invClientId || !invAmount || !invDueDate) return;

    const targetClient = clients.find(c => c.id === invClientId);
    if (!targetClient) return;

    const invoiceData: Invoice = {
      id: selectedInvoice ? selectedInvoice.id : `inv-${Date.now()}`,
      clientId: invClientId,
      clientName: targetClient.companyName,
      amount: parseFloat(invAmount),
      dueDate: invDueDate,
      status: invStatus,
      description: invDescription || `Serviços de Marketing - ${targetClient.companyName}`,
      documentUrl: selectedInvoice?.documentUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      createdAt: selectedInvoice ? selectedInvoice.createdAt : new Date().toISOString(),
      paymentDate: invStatus === 'paga' ? (selectedInvoice?.paymentDate || new Date().toISOString().split('T')[0]) : undefined
    };

    StorageService.saveInvoice(invoiceData);

    // Notify client if invoice was created or updated to outstanding
    if (!selectedInvoice && (invStatus === 'pendente' || invStatus === 'atrasada')) {
      StorageService.addNotification(
        invClientId,
        'Nova Fatura Gerada',
        `Uma nova fatura no valor de ${formatBRL(parseFloat(invAmount))} com vencimento em ${new Date(invDueDate).toLocaleDateString('pt-BR')} foi gerada.`,
        'system'
      );
    }

    setIsInvoiceModalOpen(false);
    setSelectedInvoice(null);
    clearInvoiceForm();
    refreshData();
  };

  const handleEditInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setInvClientId(inv.clientId);
    setInvAmount(inv.amount.toString());
    setInvDueDate(inv.dueDate);
    setInvStatus(inv.status);
    setInvDescription(inv.description);
    setIsInvoiceModalOpen(true);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoiceToDeleteId(id);
  };

  const confirmDeleteInvoice = () => {
    if (invoiceToDeleteId) {
      StorageService.deleteInvoice(invoiceToDeleteId);
      refreshData();
      setInvoiceToDeleteId(null);
    }
  };

  const handleMarkAsPaid = (inv: Invoice) => {
    const updated: Invoice = {
      ...inv,
      status: 'paga',
      paymentDate: new Date().toISOString().split('T')[0]
    };
    StorageService.saveInvoice(updated);
    
    // Notify client of payment receipt
    StorageService.addNotification(
      inv.clientId,
      'Pagamento Confirmado',
      `Confirmamos o recebimento do pagamento da fatura #${inv.id.substring(0, 8)} no valor de ${formatBRL(inv.amount)}. Obrigado!`,
      'system'
    );

    refreshData();
  };

  const clearInvoiceForm = () => {
    setInvClientId('');
    setInvAmount('');
    setInvDueDate('');
    setInvStatus('pendente');
    setInvDescription('');
  };

  // ----------------------------------------------------
  // EXPENSE HANDLERS
  // ----------------------------------------------------
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || !expDate || !expRecipient) return;

    const expenseData: Expense = {
      id: selectedExpense ? selectedExpense.id : `exp-${Date.now()}`,
      amount: parseFloat(expAmount),
      date: expDate,
      category: expCategory,
      description: expDescription || `Despesa com ${expCategory}`,
      recipient: expRecipient,
      status: expStatus,
      createdAt: selectedExpense ? selectedExpense.createdAt : new Date().toISOString()
    };

    StorageService.saveExpense(expenseData);
    setIsExpenseModalOpen(false);
    setSelectedExpense(null);
    clearExpenseForm();
    refreshData();
  };

  const handleEditExpense = (exp: Expense) => {
    setSelectedExpense(exp);
    setExpAmount(exp.amount.toString());
    setExpDate(exp.date);
    setExpCategory(exp.category);
    setExpDescription(exp.description);
    setExpRecipient(exp.recipient);
    setExpStatus(exp.status);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenseToDeleteId(id);
  };

  const confirmDeleteExpense = () => {
    if (expenseToDeleteId) {
      StorageService.deleteExpense(expenseToDeleteId);
      refreshData();
      setExpenseToDeleteId(null);
    }
  };

  const clearExpenseForm = () => {
    setExpAmount('');
    setExpDate('');
    setExpCategory('outros');
    setExpDescription('');
    setExpRecipient('');
    setExpStatus('pendente');
  };

  // Quick action: Generate monthly invoice for a client
  const handleGenerateMonthlyInvoice = (client: CRMClient) => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth(), 10); // Vence dia 10 do mês corrente
    const dueDateStr = nextMonth.toISOString().split('T')[0];

    const invoiceData: Invoice = {
      id: `inv-auto-${Date.now()}`,
      clientId: client.id,
      clientName: client.companyName,
      amount: client.monthlyPlan,
      dueDate: dueDateStr,
      status: 'pendente',
      description: `Mensalidade de Serviços - Contrato Recorrente - Competência ${today.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`,
      documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      createdAt: new Date().toISOString()
    };

    StorageService.saveInvoice(invoiceData);
    
    // Notify
    StorageService.addNotification(
      client.id,
      'Fatura Gerada Automaticamente',
      `Fatura de serviço recorrente gerada no valor de ${formatBRL(client.monthlyPlan)}. Vencimento em ${new Date(dueDateStr).toLocaleDateString('pt-BR')}.`,
      'system'
    );

    refreshData();
    alert(`Fatura gerada com sucesso para ${client.companyName}!`);
  };

  // Pix payment simulation
  const handleOpenPayment = (inv: Invoice) => {
    setInvoiceToPay(inv);
    setIsPixPaidSimulated(false);
    setIsPaymentModalOpen(true);
  };

  const handleSimulatePaymentSuccess = () => {
    if (!invoiceToPay) return;
    setIsPixPaidSimulated(true);
    setTimeout(() => {
      handleMarkAsPaid(invoiceToPay);
      setIsPaymentModalOpen(false);
      setInvoiceToPay(null);
    }, 1800);
  };

  return (
    <div id="finance-module-root" className="space-y-6 text-left p-6 max-w-7xl mx-auto">
      
      {/* Header and Summary block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span id="finance-badge" className="text-[10px] font-black tracking-widest uppercase text-[#114455] dark:text-[#ffd700] bg-[#114455]/10 dark:bg-[#ffd700]/10 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles size={11} /> Módulo Financeiro
            </span>
          </div>
          <h1 id="finance-title" className="text-2xl font-black tracking-tight text-slate-850 dark:text-white mt-2">
            Controle de Faturamento & Caixa
          </h1>
          <p id="finance-desc" className="text-xs text-slate-500 max-w-xl">
            {isAdmin 
              ? 'Controle faturas mensais de clientes, acompanhe despesas fixas/variáveis e analise a margem de lucro líquido da agência.'
              : 'Gerencie o plano recorrente contratado com a Aparato, visualize faturas pendentes, histórico de pagamentos e comprovantes.'
            }
          </p>
        </div>

        {/* Action buttons (Admin only) */}
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="new-invoice-btn"
              onClick={() => {
                clearInvoiceForm();
                setSelectedInvoice(null);
                setIsInvoiceModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#114455] text-white hover:bg-[#114455]/95 rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all border border-[#114455]"
            >
              <Plus size={14} className="text-[#ffd700]" />
              <span>Nova Fatura</span>
            </button>
            <button
              id="new-expense-btn"
              onClick={() => {
                clearExpenseForm();
                setSelectedExpense(null);
                setIsExpenseModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition-all border border-transparent"
            >
              <Plus size={14} className="text-[#ffd700]" />
              <span>Nova Despesa</span>
            </button>
          </div>
        )}
      </div>

      {/* ADMIN VIEW */}
      {isAdmin ? (
        <div className="space-y-6">
          
          {/* Key Metrics Grid */}
          <div id="admin-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Revenue card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Receita Recebida (Mês)</span>
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <TrendingUp size={16} />
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mt-3 font-mono">
                {formatBRL(totalRevenue)}
              </h2>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                <span className="text-emerald-600 font-bold flex items-center">
                  +12.4% <ArrowUpRight size={10} />
                </span>
                <span>vs mês anterior</span>
              </div>
            </div>

            {/* Expenses card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Despesas Pagas</span>
                <span className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl">
                  <TrendingDown size={16} />
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mt-3 font-mono">
                {formatBRL(totalExpenses)}
              </h2>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                <span className="text-rose-600 font-bold flex items-center">
                  -3.8% <TrendingDown size={10} />
                </span>
                <span>eficiência operacional</span>
              </div>
            </div>

            {/* Net Profit card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">Lucro Líquido Real</span>
                <span className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-2xl">
                  <DollarSign size={16} />
                </span>
              </div>
              <h2 className={`text-xl font-black mt-3 font-mono ${netProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600'}`}>
                {formatBRL(netProfit)}
              </h2>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                <span className="font-bold text-teal-600 font-mono">
                  {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </span>
                <span>margem de lucro líquido</span>
              </div>
            </div>

            {/* Pending Invoices card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400">A Receber / Pendente</span>
                <span className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <AlertTriangle size={16} />
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mt-3 font-mono">
                {formatBRL(pendingRevenue + overdueRevenue)}
              </h2>
              <div className="flex items-center gap-1 mt-1 text-[10px]">
                <span className="font-extrabold text-red-500 font-mono">{formatBRL(overdueRevenue)}</span>
                <span className="text-slate-400">em atraso</span>
              </div>
            </div>

          </div>

          {/* Sub Navigation Tabs for Admin */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'border-[#114455] text-[#114455] dark:border-[#ffd700] dark:text-[#ffd700]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Visão Geral (Gráficos)
            </button>
            <button
              onClick={() => setActiveSubTab('invoices')}
              className={`px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'invoices'
                  ? 'border-[#114455] text-[#114455] dark:border-[#ffd700] dark:text-[#ffd700]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Faturamento & Mensalidades ({invoices.length})
            </button>
            <button
              onClick={() => setActiveSubTab('expenses')}
              className={`px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'expenses'
                  ? 'border-[#114455] text-[#114455] dark:border-[#ffd700] dark:text-[#ffd700]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Despesas & Custos ({expenses.length})
            </button>
            <button
              onClick={() => setActiveSubTab('clients')}
              className={`px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'clients'
                  ? 'border-[#114455] text-[#114455] dark:border-[#ffd700] dark:text-[#ffd700]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Planos por Cliente
            </button>
          </div>

          {/* TAB CONTENT: OVERVIEW (CHARTS) */}
          {activeSubTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Monthly breakdown chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm lg:col-span-2 text-left">
                <div className="mb-4">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Histórico Financeiro 2026</h3>
                  <p className="text-[10px] text-slate-400">Comparativo mensal entre receitas recebidas e despesas pagas.</p>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getMonthlyChartData()}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                        formatter={(value) => [`R$ ${value}`, '']}
                      />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expenses Category breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left">
                <div className="mb-4">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Despesas por Categoria</h3>
                  <p className="text-[10px] text-slate-400">Classificação percentual das despesas pagas.</p>
                </div>

                {getCategoryChartData().length === 0 ? (
                  <div className="h-60 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                    <TrendingDown className="text-slate-300 stroke-1 mb-2" size={30} />
                    <span>Nenhuma despesa paga cadastrada para exibição do gráfico.</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-44 flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCategoryChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {getCategoryChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Progress representation list for easy reading */}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {getCategoryChartData().map((item, idx) => {
                        const percent = ((item.value / totalExpenses) * 100).toFixed(1);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                {item.name}
                              </span>
                              <span className="font-mono text-slate-500 font-extrabold">
                                {formatBRL(item.value)} ({percent}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: item.color }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB CONTENT: INVOICES LIST (BILLING) */}
          {activeSubTab === 'invoices' && (
            <div className="space-y-4">
              
              {/* Search and Filters Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-sm justify-between">
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Buscar por descrição ou cliente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-teal-500 placeholder-slate-400"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-850 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="paga">Pago</option>
                    <option value="pendente">Pendente</option>
                    <option value="atrasada">Atrasado</option>
                    <option value="cancelada">Cancelado</option>
                  </select>

                  <select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-850 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todos os Clientes</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  Mostrando {getFilteredInvoices().length} faturas
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">ID</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Cliente</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Descrição / Competência</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Vencimento</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Valor</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      {getFilteredInvoices().length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                            Nenhuma fatura localizada para os parâmetros informados.
                          </td>
                        </tr>
                      ) : (
                        getFilteredInvoices().map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-all">
                            <td className="px-6 py-4 font-mono font-bold text-[#114455] dark:text-[#ffd700]">
                              #{inv.id.substring(0, 8)}
                            </td>
                            <td className="px-6 py-4 font-black">
                              {inv.clientName}
                            </td>
                            <td className="px-6 py-4 text-slate-500 max-w-[220px] truncate" title={inv.description}>
                              {inv.description}
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-500">
                              {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 font-bold font-mono">
                              {formatBRL(inv.amount)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                                inv.status === 'paga' 
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400'
                                  : inv.status === 'pendente'
                                  ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
                                  : inv.status === 'atrasada'
                                  ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
                                  : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800'
                              }`}>
                                {inv.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {inv.status !== 'paga' && (
                                  <button
                                    onClick={() => handleMarkAsPaid(inv)}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/30 text-emerald-600 rounded-xl cursor-pointer"
                                    title="Marcar como Paga"
                                  >
                                    <Check size={13} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditInvoice(inv)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(inv.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: EXPENSES LIST */}
          {activeSubTab === 'expenses' && (
            <div className="space-y-4">
              
              {/* Filters */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-sm justify-between">
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Buscar por descrição ou fornecedor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none placeholder-slate-400"
                    />
                  </div>

                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    className="text-xs bg-slate-50 dark:bg-slate-850 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Todas as Categorias</option>
                    <option value="salarios">Salários/Equipe</option>
                    <option value="ferramentas">Ferramentas/SaaS</option>
                    <option value="infraestrutura">Infraestrutura</option>
                    <option value="impostos">Impostos</option>
                    <option value="marketing">Marketing Interno</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  Mostrando {getFilteredExpenses().length} despesas
                </div>
              </div>

              {/* Expense Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Destinatário / Fornecedor</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Descrição</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Categoria</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Data</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Valor</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Estado</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      {getFilteredExpenses().length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                            Nenhuma despesa ou custo registrado.
                          </td>
                        </tr>
                      ) : (
                        getFilteredExpenses().map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-all">
                            <td className="px-6 py-4 font-black">
                              {exp.recipient}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {exp.description}
                            </td>
                            <td className="px-6 py-4 font-semibold uppercase text-[10px] tracking-wide">
                              {exp.category}
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-500">
                              {new Date(exp.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-6 py-4 font-bold font-mono text-rose-600">
                              {formatBRL(exp.amount)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                                exp.status === 'pago'
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20'
                              }`}>
                                {exp.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleEditExpense(exp)}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: CLIENT RECURRING PLANS */}
          {activeSubTab === 'clients' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.filter(c => !c.isArchived).map((client) => {
                // Find all paid / pending for this client to check billing health
                const clientInvoices = invoices.filter(i => i.clientId === client.id);
                const pendingCount = clientInvoices.filter(i => i.status === 'pendente' || i.status === 'atrasada').length;

                return (
                  <div key={client.id} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left flex flex-col justify-between h-[220px]">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={client.logo} 
                            alt={client.companyName} 
                            className="w-10 h-10 rounded-2xl object-cover bg-slate-50 border border-slate-150 dark:border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h3 className="text-xs font-black text-slate-800 dark:text-white">{client.companyName}</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Responsável: {client.contactPerson}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                          pendingCount > 0 
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20' 
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                        }`}>
                          {pendingCount > 0 ? `${pendingCount} Pendente` : 'Regular'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Mensalidade Contratada</span>
                        <div className="text-sm font-black font-mono text-slate-850 dark:text-white flex items-center gap-1">
                          {formatBRL(client.monthlyPlan)}
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">/ mês</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block truncate">{client.contractInfo}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-mono">
                        Ativo desde {new Date(client.startDate).toLocaleDateString('pt-BR')}
                      </span>
                      <button
                        onClick={() => handleGenerateMonthlyInvoice(client)}
                        className="px-3 py-1.5 bg-[#114455]/10 hover:bg-[#114455]/20 dark:bg-[#ffd700]/10 dark:hover:bg-[#ffd700]/20 text-[#114455] dark:text-[#ffd700] text-[10px] font-black rounded-lg cursor-pointer transition-all"
                      >
                        Gerar Cobrança
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        // CLIENT VIEW
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Main Section: List of Invoices & Active Plan */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Contract Summary Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Seu Plano Ativo</span>
                <h3 className="text-base font-black text-slate-850 dark:text-white">
                  Assessoria de Marketing Recorrente
                </h3>
                <p className="text-xs text-slate-500">
                  {currentUser?.companyName || 'Empresa Cliente'} - Serviços contratados ativos.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-left sm:text-right shrink-0">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Valor do Plano</span>
                <div className="text-lg font-black text-[#114455] dark:text-[#ffd700] font-mono mt-0.5">
                  {formatBRL(clients.find(c => c.id === currentUser?.id)?.monthlyPlan || 0)}
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">/mês</span>
                </div>
              </div>
            </div>

            {/* Invoices Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Histórico de Cobranças</h2>
                <p className="text-[10px] text-slate-400">Acompanhe todos os lançamentos e faturas emitidas para sua conta.</p>
              </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              {clientInvoices.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic text-xs">
                  Nenhuma fatura localizada para sua conta de cliente.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800">
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">ID</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Descrição</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Vencimento</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Valor</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {clientInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-all">
                          <td className="px-6 py-4 font-mono font-bold text-[#114455] dark:text-[#ffd700]">
                            #{inv.id.substring(0, 8)}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                            {inv.description}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500">
                            {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 font-black font-mono">
                            {formatBRL(inv.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                              inv.status === 'paga' 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                                : inv.status === 'pendente'
                                ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                                : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                            }`}>
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {inv.status !== 'paga' && (
                                <button
                                  onClick={() => handleOpenPayment(inv)}
                                  className="px-3 py-1.5 bg-[#114455] text-white hover:bg-[#114455]/95 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                                >
                                  <CreditCard size={12} />
                                  <span>Pagar</span>
                                </button>
                              )}
                              {inv.documentUrl && (
                                <a
                                  href={inv.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-[#114455] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all inline-flex items-center"
                                  title="Baixar Nota/Documento"
                                >
                                  <Download size={14} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Right / Sidebar: Next billing, info alert, and details */}
          <div className="space-y-6 text-left">
            
            {/* Payment Summary Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-left space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Vencimento Próximo</h3>
              
              {clientNextInvoice ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Valor Pendente</span>
                    <span className="text-sm font-black font-mono text-slate-800 dark:text-white">{formatBRL(clientNextInvoice.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Vence em</span>
                    <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                      {new Date(clientNextInvoice.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenPayment(clientNextInvoice)}
                      className="w-full py-2.5 bg-[#114455] hover:bg-[#114455]/95 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                    >
                      <QrCode size={14} className="text-[#ffd700]" />
                      <span>Gerar PIX de Pagamento</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle size={16} />
                    <span className="text-xs font-bold">Nenhum pagamento pendente!</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sua conta está em dia. Muito obrigado pela confiança nos serviços Aparato.
                  </p>
                </div>
              )}
            </div>

            {/* Financial Info details Card */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-3xl p-5 text-left space-y-3.5">
              <div className="flex items-center gap-2 text-[#114455] dark:text-[#ffd700]">
                <Info size={16} />
                <h4 className="text-xs font-black uppercase tracking-wider">Informações Importantes</h4>
              </div>

              <div className="space-y-2.5 text-[11px] text-slate-500 leading-relaxed">
                <p>
                  1. <strong>Emissão de Notas:</strong> As notas fiscais de serviço (NFS-e) são emitidas no primeiro dia útil subsequente ao pagamento compensado.
                </p>
                <p>
                  2. <strong>Atrasos:</strong> Pagamentos com atraso superior a 10 dias do vencimento podem acarretar em pausa automática das campanhas ativas de tráfego pago.
                </p>
                <p>
                  3. <strong>Segunda Via:</strong> Se precisar alterar o método de faturamento (boleto/crédito), por favor entre em contato via canal de Suporte/Ticket.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: NEW / EDIT INVOICE (ADMIN ONLY)
          ---------------------------------------------------- */}
      <AnimatePresence>
        {isInvoiceModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full text-left"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-black text-slate-850 dark:text-white">
                  {selectedInvoice ? 'Editar Fatura' : 'Lançar Nova Fatura'}
                </h3>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs">
                
                {/* Client dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Cliente Associado</label>
                  <select
                    required
                    value={invClientId}
                    onChange={(e) => setInvClientId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="">Selecione o Cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Valor Cobrado (R$)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="Ex: 2500.00"
                      value={invAmount}
                      onChange={(e) => setInvAmount(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Data de Vencimento</label>
                    <input
                      required
                      type="date"
                      value={invDueDate}
                      onChange={(e) => setInvDueDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Status dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Status da Cobrança</label>
                  <select
                    value={invStatus}
                    onChange={(e) => setInvStatus(e.target.value as InvoiceStatus)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="paga">Pago</option>
                    <option value="atrasada">Atrasado</option>
                    <option value="cancelada">Cancelado</option>
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Descrição do Lançamento</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Mensalidade de Serviços de Marketing Digital - Referência Julho/2026"
                    value={invDescription}
                    onChange={(e) => setInvDescription(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#114455] text-white rounded-xl font-black cursor-pointer hover:bg-[#114455]/95 transition-all"
                  >
                    Salvar Fatura
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------
          MODAL: NEW / EDIT EXPENSE (ADMIN ONLY)
          ---------------------------------------------------- */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full text-left"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-black text-slate-850 dark:text-white">
                  {selectedExpense ? 'Editar Despesa' : 'Lançar Nova Despesa'}
                </h3>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
                
                {/* Recipient */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Destinatário / Fornecedor</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Adobe Systems, Ana Souza, AWS Cloud"
                    value={expRecipient}
                    onChange={(e) => setExpRecipient(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Valor Despesa (R$)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      placeholder="Ex: 450.00"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Data do Pagamento</label>
                    <input
                      required
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Categoria</label>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="salarios">Salários/Equipe</option>
                      <option value="ferramentas">Ferramentas/SaaS</option>
                      <option value="infraestrutura">Infraestrutura</option>
                      <option value="impostos">Impostos</option>
                      <option value="marketing">Marketing Interno</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  {/* State */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Estado de Pagamento</label>
                    <select
                      value={expStatus}
                      onChange={(e) => setExpStatus(e.target.value as 'pago' | 'pendente')}
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 block">Descrição / Detalhe</label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Assinatura Adobe Creative Cloud Suite e Figma Pro"
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-850 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white rounded-xl font-bold cursor-pointer transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#114455] text-white rounded-xl font-black cursor-pointer hover:bg-[#114455]/95 transition-all"
                  >
                    Salvar Despesa
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------------------------------------------
          MODAL: PIX PAYMENT INTERACTION (CLIENT ONLY)
          ---------------------------------------------------- */}
      <AnimatePresence>
        {isPaymentModalOpen && invoiceToPay && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 text-left">
                <h3 className="text-xs font-black uppercase text-slate-400">Pagar com PIX</h3>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Fatura de Marketing #{invoiceToPay.id.substring(0, 8)}</p>
                  <h4 className="text-lg font-black font-mono text-[#114455] dark:text-[#ffd700]">
                    {formatBRL(invoiceToPay.amount)}
                  </h4>
                  <p className="text-[10px] text-slate-400">Beneficiário: Aparato Agência Ltda.</p>
                </div>

                {/* Simulated QR Code box */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {isPixPaidSimulated ? (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }}
                      className="h-44 flex flex-col items-center justify-center text-emerald-600 gap-1"
                    >
                      <CheckCircle size={45} className="animate-bounce" />
                      <span className="text-xs font-black">Pagamento Confirmado!</span>
                      <span className="text-[10px] text-slate-400">Seu recibo foi gerado e enviado.</span>
                    </motion.div>
                  ) : (
                    <>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        {/* Beautiful generated mock QR Code */}
                        <img 
                          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=mock-aparato-pix-payment" 
                          alt="Pix QR Code" 
                          className="w-36 h-36"
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono mt-3 text-center">
                        Escaneie o QR Code acima no aplicativo do seu banco para concluir o pagamento.
                      </span>
                    </>
                  )}
                </div>

                {/* Actions */}
                {!isPixPaidSimulated && (
                  <div className="space-y-2">
                    <button
                      onClick={handleSimulatePaymentSuccess}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <span>Simular Pagamento Concluído</span>
                    </button>
                    <button
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                    >
                      Voltar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM DELETE INVOICE MODAL */}
      {invoiceToDeleteId && invoiceToDelete && (
        <div className="fixed inset-0 z-50 bg-[#08222a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-rose-500/20 overflow-hidden relative text-left"
          >
            <div className="h-1.5 w-full bg-rose-500" />
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-bold font-display">
                  Excluir Fatura
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tem certeza que deseja excluir permanentemente a fatura <strong className="text-rose-500 dark:text-rose-400">#{invoiceToDelete.id.substring(0, 8)}</strong> no valor de <strong className="text-rose-500 dark:text-rose-400">{formatBRL(invoiceToDelete.amount)}</strong>? Esta ação não pode ser revertida.
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInvoiceToDeleteId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteInvoice}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Sim, Excluir Fatura
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* CUSTOM CONFIRM DELETE EXPENSE MODAL */}
      {expenseToDeleteId && expenseToDelete && (
        <div className="fixed inset-0 z-50 bg-[#08222a]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-rose-500/20 overflow-hidden relative text-left"
          >
            <div className="h-1.5 w-full bg-rose-500" />
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle size={20} />
                <h3 className="text-lg font-bold font-display">
                  Excluir Despesa
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tem certeza que deseja excluir permanentemente a despesa <strong className="text-rose-500 dark:text-rose-400">"{expenseToDelete.description}"</strong> no valor de <strong className="text-rose-500 dark:text-rose-400">{formatBRL(expenseToDelete.amount)}</strong>? Esta ação é irreversível.
              </p>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExpenseToDeleteId(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteExpense}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Sim, Excluir Despesa
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
