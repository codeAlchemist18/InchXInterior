/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, ProjectTask } from '../types';
import { 
  Briefcase, 
  Plus, 
  Calendar, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowRight,
  Sliders,
  Check,
  Edit,
  Trash2
} from 'lucide-react';

interface ProjectTrackerProps {
  projects: Project[];
  addProject: (proj: any) => Project;
  updateProject: (projectId: string, updatedData: any) => void;
  deleteProject: (projectId: string) => void;
  updateProjectTasks: (projectId: string, tasks: any[]) => void;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function ProjectTracker({
  projects,
  addProject,
  updateProject,
  deleteProject,
  updateProjectTasks,
  onAddToast
}: ProjectTrackerProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] || null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Project Form State
  const [name, setName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expectedCompletionDate, setExpectedCompletionDate] = useState<string>('');

  // Edit Project Form State
  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editClientName, setEditClientName] = useState<string>('');
  const [editClientEmail, setEditClientEmail] = useState<string>('');
  const [editClientPhone, setEditClientPhone] = useState<string>('');
  const [editAddress, setEditAddress] = useState<string>('');
  const [editBudget, setEditBudget] = useState<string>('');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editExpectedCompletionDate, setEditExpectedCompletionDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'planning' | 'in-progress' | 'completed' | 'on-hold'>('planning');

  const handleOpenEditForm = (proj: Project) => {
    setEditName(proj.name);
    setEditClientName(proj.clientName);
    setEditClientEmail(proj.clientEmail || '');
    setEditClientPhone(proj.clientPhone || '');
    setEditAddress(proj.address || '');
    setEditBudget(String(proj.budget));
    setEditStartDate(proj.startDate || '');
    setEditExpectedCompletionDate(proj.expectedCompletionDate || '');
    setEditStatus(proj.status);
    setShowEditForm(true);
  };

  const handleUpdateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editClientName.trim() || !editBudget || Number(editBudget) <= 0) {
      onAddToast('Please fill in Name, Client Name, and valid Budget amount.', 'error');
      return;
    }
    if (!activeProj) return;

    updateProject(activeProj.id, {
      name: editName.trim(),
      clientName: editClientName.trim(),
      clientEmail: editClientEmail.trim(),
      clientPhone: editClientPhone.trim(),
      address: editAddress.trim(),
      budget: Number(editBudget),
      startDate: editStartDate,
      expectedCompletionDate: editExpectedCompletionDate || undefined,
      status: editStatus
    });

    onAddToast(`Updated Site info for: ${editName}`, 'success');
    setShowEditForm(false);
  };

  const handleDeleteProjectClick = (projId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete project "${name}"? This action cannot be undone.`)) {
      deleteProject(projId);
      onAddToast(`Deleted project site: ${name}`, 'success');
      setSelectedProject(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRemainingDays = (endDateStr?: string) => {
    if (!endDateStr) return { days: null, label: 'Timeline Undefined', isOverdue: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(endDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { days: diffDays, label: `Overdue by ${Math.abs(diffDays)} days`, isOverdue: true };
    } else if (diffDays === 0) {
      return { days: 0, label: 'Ends Today', isOverdue: false, isToday: true };
    } else {
      return { days: diffDays, label: `${diffDays} Days Remaining`, isOverdue: false };
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientName.trim() || !budget || Number(budget) <= 0) {
      onAddToast('Please fill in Name, Client Name, and valid Budget amount.', 'error');
      return;
    }

    const newProj = addProject({
      name: name.trim(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || `${clientName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      clientPhone: clientPhone.trim() || '+91 99999 88888',
      address: address.trim() || 'Site Address Pending',
      budget: Number(budget),
      status: 'planning',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      expectedCompletionDate: expectedCompletionDate || undefined
    });

    onAddToast(`Registered Site: ${newProj.name}`, 'success');
    setSelectedProject(newProj);
    setShowAddForm(false);
    
    // Reset Form
    setName('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setAddress('');
    setBudget('');
    setExpectedCompletionDate('');
  };

  const handleTaskStatusChange = (taskId: string, newStatus: 'completed' | 'pending' | 'not-started') => {
    if (!selectedProject) return;
    const currentTasks = selectedProject.tasks || [];
    const updatedTasks = currentTasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: newStatus };
      }
      return t;
    });

    updateProjectTasks(selectedProject.id, updatedTasks);
    
    // Update local selection to reflect store state changes
    const updatedProj = {
      ...selectedProject,
      tasks: updatedTasks
    };
    setSelectedProject(updatedProj);
    onAddToast('Site checklist task progress updated!', 'success');
  };

  // Find the exact project details from prop array to ensure local storage sync is shown
  const activeProj = selectedProject 
    ? projects.find(p => p.id === selectedProject.id) || selectedProject
    : projects[0] || null;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Interactive Site & Progress Tracker
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track site status, tasks timeline completion, and contract cash-flow budgets dynamically.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-slate-950 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Project Worksite
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950">
          <Briefcase className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">No registered worksites in the ERP.</p>
          <p className="text-slate-400 text-xs mt-1">Create your first premium site project to manage measurement & procurement milestones.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Launch Setup Wizard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Worksite List */}
          <div className="lg:col-span-1 space-y-3.5">
            <h3 className="text-xs font-extrabold tracking-widest text-slate-400 dark:text-amber-500/60 uppercase">
              Registered Worksite Sites ({projects.length})
            </h3>
            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
              {projects.map((p) => {
                const totalTasks = p.tasks?.length || 12;
                const completedTasks = p.tasks?.filter(t => t.status === 'completed').length || 0;
                const progressPercent = Math.round((completedTasks / totalTasks) * 100);
                const remaining = getRemainingDays(p.expectedCompletionDate);
                const isSelected = activeProj && activeProj.id === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-xs font-semibold space-y-3 ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-amber-400/10 dark:border-amber-400/40 dark:text-white shadow-md'
                        : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-xs truncate max-w-[150px]">{p.name}</h4>
                        <p className={`text-[9px] uppercase tracking-wider font-bold ${isSelected ? 'text-slate-300 dark:text-amber-400/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          {p.clientName}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        p.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : p.status === 'in-progress'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border border-slate-200/20'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className={isSelected ? 'text-slate-300' : 'text-slate-400'}>Task Completion</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className={`h-1.5 w-full rounded-full overflow-hidden ${isSelected ? 'bg-slate-800 dark:bg-slate-900' : 'bg-slate-100 dark:bg-slate-900'}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isSelected ? 'bg-white dark:bg-amber-400' : 'bg-slate-900 dark:bg-amber-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Timeline Info */}
                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100/10 dark:border-slate-900/10">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="h-3 w-3 shrink-0" />
                        Est. Date
                      </span>
                      <span className={`font-mono font-bold ${
                        remaining.isOverdue 
                          ? 'text-rose-500' 
                          : isSelected 
                          ? 'text-amber-400 dark:text-amber-300' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {remaining.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Worksite Detail Pane & Task checklist */}
          <div className="lg:col-span-2 space-y-6">
            {activeProj && (
              <>
                {/* Main Worksite Summary Card */}
                <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-900">
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        {activeProj.name}
                      </h2>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>{activeProj.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest text-[9px]">
                        Budget Level: {formatCurrency(activeProj.budget)}
                      </span>
                      <button
                        onClick={() => handleOpenEditForm(activeProj)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-950 dark:hover:text-slate-200 transition-all cursor-pointer border border-slate-200/50 dark:border-slate-800/50 shadow-2xs"
                        title="Edit Project Worksite"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProjectClick(activeProj.id, activeProj.name)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all cursor-pointer border border-slate-200/50 dark:border-slate-800/50 shadow-2xs"
                        title="Delete Project Worksite"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Client Info Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/40 dark:border-slate-800/40 text-[11px] font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <span className="block text-[8px] text-slate-400 font-black uppercase">Client Name</span>
                        <strong className="text-slate-800 dark:text-white text-xs">{activeProj.clientName}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <span className="block text-[8px] text-slate-400 font-black uppercase">Phone Number</span>
                        <span className="text-slate-800 dark:text-slate-200 font-mono">{activeProj.clientPhone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <div className="truncate">
                        <span className="block text-[8px] text-slate-400 font-black uppercase">Email Address</span>
                        <span className="text-slate-800 dark:text-slate-200 truncate">{activeProj.clientEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950 rounded-xl text-center">
                      <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Contract Budget</span>
                      <span className="text-sm font-black font-serif text-slate-800 dark:text-white block mt-1">
                        {formatCurrency(activeProj.budget)}
                      </span>
                    </div>

                    <div className="p-3 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950 rounded-xl text-center">
                      <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Ledger Spent Outflow</span>
                      <span className="text-sm font-black font-serif text-rose-500 block mt-1">
                        {formatCurrency(activeProj.spent)}
                      </span>
                    </div>

                    <div className="p-3 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950 rounded-xl text-center">
                      <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Remaining Margin</span>
                      <span className={`text-sm font-black font-serif block mt-1 ${(activeProj.budget - activeProj.spent) < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(activeProj.budget - activeProj.spent)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Task Milestone Checklist */}
                <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sliders className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                      Milestone Site Management Tasksheet
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Select individual project items status. Updates will automatically recalculate total site progress metrics.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(activeProj.tasks || []).map((task) => {
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
                            task.status === 'completed'
                              ? 'bg-emerald-500/[0.02] border-emerald-500/10 text-slate-800 dark:text-slate-100'
                              : task.status === 'pending'
                              ? 'bg-amber-500/[0.02] border-amber-500/10 text-slate-800 dark:text-slate-100'
                              : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-900 text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                            ) : task.status === 'pending' ? (
                              <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0 animate-pulse" />
                            ) : (
                              <Circle className="h-4.5 w-4.5 text-slate-300 dark:text-slate-700 shrink-0" />
                            )}
                            <span className="truncate">{task.name}</span>
                          </div>

                          <select
                            value={task.status}
                            onChange={(e) => handleTaskStatusChange(task.id, e.target.value as any)}
                            className={`p-1 text-[10px] rounded-lg border outline-hidden cursor-pointer font-bold uppercase tracking-wider ${
                              task.status === 'completed'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400'
                                : task.status === 'pending'
                                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
                                : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <option value="not-started">Not Started</option>
                            <option value="pending">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Project Worksite Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-lg w-full shadow-lg text-xs font-semibold space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Register New Project Worksite
              </h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕ Close</button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Project Site Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skyline Villa - Jubilee Hills"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Client Email</label>
                  <input
                    type="email"
                    placeholder="e.g. client@gmail.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Client Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 99999 88888"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Project Budget Limit (INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Site Address</label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, Signature Towers, Madhapur, Hyderabad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Site Commencement Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Expected Completion Date</label>
                  <input
                    type="date"
                    value={expectedCompletionDate}
                    onChange={(e) => setExpectedCompletionDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold rounded-lg cursor-pointer"
              >
                Register & Initialize Worksite Tasks
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Worksite Overlay */}
      {showEditForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-lg w-full shadow-lg text-xs font-semibold space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Modify Project Worksite Details
              </h3>
              <button onClick={() => setShowEditForm(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕ Close</button>
            </div>

            <form onSubmit={handleUpdateProjectSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Project Site Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Skyline Villa - Jubilee Hills"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Client Email</label>
                  <input
                    type="email"
                    placeholder="e.g. client@gmail.com"
                    value={editClientEmail}
                    onChange={(e) => setEditClientEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Client Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 99999 88888"
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Project Budget Limit (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500000"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Current Status *</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg cursor-pointer"
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Site Address</label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, Signature Towers, Madhapur, Hyderabad"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-500 mb-1">Site Commencement Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Expected Completion Date</label>
                  <input
                    type="date"
                    value={editExpectedCompletionDate}
                    onChange={(e) => setEditExpectedCompletionDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold rounded-lg cursor-pointer"
              >
                Save Project Specification Updates
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
