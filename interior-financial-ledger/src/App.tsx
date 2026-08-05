/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useFinanceStore } from './hooks/useFinanceStore';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DigitalLedger from './components/DigitalLedger';
import WorkerSupplierManager from './components/WorkerSupplierManager';
import TransactionHistory from './components/TransactionHistory';
import InvoiceGenerator from './components/InvoiceGenerator';
import Reports from './components/Reports';
import AuthScreen from './components/AuthScreen';
import Toast, { ToastMessage } from './components/Toast';
import { Menu, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';
import ScheduleManager from './components/ScheduleManager';
import ProfitLossDashboard from './components/ProfitLossDashboard';
import AdminSettings from './components/AdminSettings';
import ProjectTracker from './components/ProjectTracker';
import StaffManagement from './components/StaffManagement';
import AddStaff from './components/AddStaff';
import { StaffSalary } from './types';

export default function App() {
  const store = useFinanceStore();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Custom Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Staff Salary Module Navigation State
  const [salaryView, setSalaryView] = useState<'list' | 'form' | 'details'>('list');
  const [editingSalary, setEditingSalary] = useState<StaffSalary | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToasts(prev => [...prev, { id: String(Date.now() + Math.random()), type, message }]);
  };

  const handleCloseToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Redirect to login tab when logged out
  useEffect(() => {
    if (!store.loading && store.setupComplete && !store.currentUser) {
      setCurrentTab('auth');
    }
  }, [store.currentUser, store.loading, store.setupComplete]);

  // Restrict access for Manager role
  useEffect(() => {
    if (store.currentUser?.role === 'manager') {
      const allowedTabs = ['dashboard', 'projects', 'ledger', 'history', 'invoices', 'auth'];
      if (!allowedTabs.includes(currentTab)) {
        setCurrentTab('dashboard');
        addToast('Access Denied: That page is reserved for system administrators.', 'error');
      }
    }
  }, [currentTab, store.currentUser]);

  // Switch tab with visual alert toast
  const handleOpenQuickForm = (type: 'income' | 'expense') => {
    setCurrentTab('ledger');
    addToast(`Switched to Ledger. Posting a new standard ${type} transaction.`, 'info');
  };

  // Page switcher
  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            projects={store.projects}
            transactions={store.transactions}
            workers={store.workers}
            suppliers={store.suppliers}
            getStatistics={store.getStatistics}
            setCurrentTab={setCurrentTab}
            onOpenQuickForm={handleOpenQuickForm}
          />
        );
      case 'projects':
        return (
          <ProjectTracker
            projects={store.projects}
            addProject={store.addProject}
            updateProject={store.updateProject}
            deleteProject={store.deleteProject}
            updateProjectTasks={store.updateProjectTasks}
            onAddToast={addToast}
          />
        );
      case 'ledger':
        return (
          <DigitalLedger
            projects={store.projects}
            transactions={store.transactions}
            workers={store.workers}
            suppliers={store.suppliers}
            currentUser={store.currentUser}
            addTransaction={store.addTransaction}
            addProject={store.addProject}
            onAddToast={addToast}
          />
        );
      case 'staff_salary':
        if (salaryView === 'form') {
          return (
            <AddStaff
              initialData={editingSalary}
              currency={store.companySettings?.currency}
              onAddToast={addToast}
              onCancel={() => {
                setSalaryView('list');
                setEditingSalary(null);
              }}
              onSave={(salaryData) => {
                if (salaryData.id) {
                  store.updateStaffSalary(salaryData as StaffSalary);
                  addToast(`Updated employee dossier for ${salaryData.employeeName}`, 'success');
                } else {
                  store.addStaffSalary(salaryData as Omit<StaffSalary, 'id'>);
                  addToast(`Added new staff member ${salaryData.employeeName}`, 'success');
                }
                setSalaryView('list');
                setEditingSalary(null);
              }}
            />
          );
        }
        return (
          <StaffManagement
            salaries={store.staffSalaries}
            currency={store.companySettings?.currency}
            onAddToast={addToast}
            onAddNew={() => {
              setEditingSalary(null);
              setSalaryView('form');
            }}
            onEdit={(salary) => {
              setEditingSalary(salary);
              setSalaryView('form');
            }}
            onDelete={(id) => {
              store.deleteStaffSalary(id);
            }}
            onAddStaffSalary={(salaryData) => {
              store.addStaffSalary(salaryData);
            }}
            onUpdateStaffSalary={(salaryData) => {
              store.updateStaffSalary(salaryData);
            }}
          />
        );
      case 'contractors':
        return (
          <WorkerSupplierManager
            workers={store.workers}
            suppliers={store.suppliers}
            projects={store.projects}
            transactions={store.transactions}
            addWorker={store.addWorker}
            addSupplier={store.addSupplier}
            updateWorker={store.updateWorker}
            deleteWorker={store.deleteWorker}
            updateSupplier={store.updateSupplier}
            deleteSupplier={store.deleteSupplier}
            adjustWorkerPending={store.adjustWorkerPending}
            adjustSupplierPending={store.adjustSupplierPending}
            addSupplierBill={store.addSupplierBill}
            deleteSupplierBill={store.deleteSupplierBill}
            onAddToast={addToast}
          />
        );
      case 'history':
        return (
          <TransactionHistory
            transactions={store.transactions}
            projects={store.projects}
            workers={store.workers}
            suppliers={store.suppliers}
            onAddToast={addToast}
          />
        );
      case 'invoices':
        return (
          <InvoiceGenerator
            projects={store.projects}
            invoices={store.invoices}
            addInvoice={store.addInvoice}
            onAddToast={addToast}
            companySettings={store.companySettings}
          />
        );
      case 'reports':
        return (
          <Reports
            projects={store.projects}
            transactions={store.transactions}
            workers={store.workers}
            suppliers={store.suppliers}
            onAddToast={addToast}
          />
        );
      case 'schedules':
        return (
          <ScheduleManager
            schedules={store.schedules}
            addScheduleEvent={store.addScheduleEvent}
            deleteScheduleEvent={store.deleteScheduleEvent}
            onAddToast={addToast}
            projects={store.projects}
          />
        );
      case 'profit_loss':
        return (
          <ProfitLossDashboard
            projects={store.projects}
            transactions={store.transactions}
          />
        );
      case 'settings':
        return (
          <AdminSettings
            users={store.users}
            currentUser={store.currentUser}
            adminUpdateUserCredentials={store.adminUpdateUserCredentials}
            adminAddAccountant={store.adminAddAccountant}
            adminDeleteUser={store.adminDeleteUser}
            onAddToast={addToast}
            companySettings={store.companySettings}
            updateCompanySettings={store.updateCompanySettings}
          />
        );
      case 'auth':
        return (
          <AuthScreen
            currentUser={store.currentUser}
            users={store.users}
            loginAsUser={store.loginAsUser}
            logoutUser={store.logoutUser}
            onAddToast={addToast}
          />
        );
      default:
        return (
          <div className="py-12 text-center text-slate-500">
            Tab component under development.
          </div>
        );
    }
  };

  if (store.loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 rounded-full border-4 border-slate-900 border-t-transparent dark:border-white animate-spin"></div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Initializing system...</span>
      </div>
    );
  }

  if (!store.currentUser) {
    return (
      <AuthScreen
        currentUser={store.currentUser}
        users={store.users}
        loginAsUser={store.loginAsUser}
        logoutUser={store.logoutUser}
        onAddToast={addToast}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={store.currentUser}
        isDarkMode={store.isDarkMode}
        toggleTheme={store.toggleTheme}
        resetToSeedData={store.resetToSeedData}
        factoryReset={store.resetUserAccounts}
        getStatistics={store.getStatistics}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        onAddToast={addToast}
        companySettings={store.companySettings}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Header bar */}
        <header className="h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 lg:hidden shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-serif font-black text-xs tracking-wider text-slate-900 dark:text-amber-400 uppercase">INCHX INTERIO</span>
          </div>

          {store.currentUser ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-500/10 text-amber-500 font-extrabold uppercase px-2 py-0.5 rounded border border-amber-500/20 tracking-wider">
                {store.currentUser.name}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400">Locked</span>
          )}
        </header>

        {/* Primary Page Canvas */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 overflow-y-auto">
          {/* Active Session Status Bar */}
          <div className="flex items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-950/60 rounded-xl border border-slate-200/50 dark:border-amber-500/10 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {store.currentUser ? (
                  <>
                    Logged in as:{' '}
                    <strong className="text-slate-800 dark:text-white uppercase tracking-wider">
                      {store.currentUser.role === 'admin' ? 'Admin' : 'Accountant'}
                    </strong>
                  </>
                ) : (
                  <>Session Locked. Please authenticate under the Access Control tab.</>
                )}
              </span>
            </div>
            {store.currentUser ? (
              <button
                onClick={() => {
                  store.logoutUser();
                  setCurrentTab('auth');
                  addToast('Logged out successfully.', 'info');
                }}
                className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline whitespace-nowrap uppercase tracking-wider"
              >
                Log Out ➜
              </button>
            ) : (
              <button
                onClick={() => setCurrentTab('auth')}
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline whitespace-nowrap uppercase tracking-wider"
              >
                Authenticate ➜
              </button>
            )}
          </div>

          {/* Active Tab Screen */}
          {renderActiveTab()}
        </main>
      </div>

      {/* Custom Dynamic Alert Toast Portal */}
      <Toast toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
}
