/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Briefcase, Plus, Trash2, Bell, AlertTriangle } from 'lucide-react';
import { ScheduleEvent } from '../types';
import DateTimePicker from './DateTimePicker';

interface ScheduleManagerProps {
  schedules: ScheduleEvent[];
  addScheduleEvent: (event: any) => void;
  deleteScheduleEvent: (id: string) => void;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  projects: any[];
}

const EVENT_TYPES = [
  { id: 'site_visit', label: 'Site Visit', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'client_meeting', label: 'Client Meeting', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'supplier_meeting', label: 'Supplier Meeting', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'office_meeting', label: 'Office Meeting', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'personal_reminder', label: 'Personal Reminder', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
];

export default function ScheduleManager({
  schedules,
  addScheduleEvent,
  deleteScheduleEvent,
  onAddToast,
  projects
}: ScheduleManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [type, setType] = useState<'site_visit' | 'client_meeting' | 'supplier_meeting' | 'office_meeting' | 'personal_reminder'>('site_visit');
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState(new Date().toISOString());
  const [location, setLocation] = useState('');
  const [personName, setPersonName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [reminderTime, setReminderTime] = useState<'15m' | '30m' | '1h' | '1d'>('15m');

  // Trigger browser notifications or alerts on upcoming events
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      schedules.forEach(event => {
        const eventDate = new Date(event.date);
        
        // Extract time from event.time if stored separately
        if (event.time) {
          const [hours, minutes] = event.time.split(':').map(Number);
          eventDate.setHours(hours, minutes, 0, 0);
        }

        const diffMs = eventDate.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        let triggerMinutes = 15;
        if (event.reminderTime === '30m') triggerMinutes = 30;
        if (event.reminderTime === '1h') triggerMinutes = 60;
        if (event.reminderTime === '1d') triggerMinutes = 1440;

        // If time diff matches reminder offset precisely (within a 1 minute window)
        if (diffMins === triggerMinutes) {
          onAddToast(`REMINDER: Upcoming "${event.title}" scheduled in ${event.reminderTime === '1d' ? '1 day' : event.reminderTime === '1h' ? '1 hour' : event.reminderTime === '30m' ? '30 minutes' : '15 minutes'}!`, 'info');
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [schedules]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onAddToast('Please fill out the event title', 'error');
      return;
    }

    const dt = new Date(dateTime);
    const dateOnly = dt.toISOString().slice(0, 10);
    const timeOnly = dt.toTimeString().slice(0, 5); // HH:MM

    addScheduleEvent({
      type,
      title: title.trim(),
      date: dateOnly,
      time: timeOnly,
      location: location.trim(),
      personName: personName.trim(),
      projectName: projectName || 'General Overhead',
      notes: notes.trim(),
      priority,
      reminderTime
    });

    onAddToast(`Successfully scheduled: ${title}`, 'success');
    setShowAddForm(false);
    // Reset form
    setTitle('');
    setLocation('');
    setPersonName('');
    setProjectName('');
    setNotes('');
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'high':
        return <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase">High Priority</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase">Medium Priority</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[9px] font-bold uppercase">Low Priority</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif font-black text-slate-900 dark:text-amber-400 uppercase tracking-wider">
            Admin Schedule Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
            Organize site visits, client meetings, and system notifications
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="py-2 px-4 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? 'View Schedule' : 'Create New Event'}</span>
        </button>
      </div>

      {showAddForm ? (
        <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-amber-500/15 p-6 rounded-2xl shadow-md max-w-2xl mx-auto">
          <h2 className="text-sm font-serif font-bold text-slate-900 dark:text-amber-400 mb-6 flex items-center gap-2 uppercase tracking-wide">
            <Plus className="h-4.5 w-4.5 text-amber-500" />
            <span>Schedule New Event</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Event Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                >
                  <option value="site_visit">Site Visit</option>
                  <option value="client_meeting">Client Meeting</option>
                  <option value="supplier_meeting">Supplier Meeting</option>
                  <option value="office_meeting">Office Meeting</option>
                  <option value="personal_reminder">Personal Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Initial Site Measurement & Design Briefing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateTimePicker
                value={dateTime}
                onChange={setDateTime}
                label="Date & Time"
              />

              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Location / Platform
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104 Villa, Jubilee Hills / Zoom"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Person Name (With Whom)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Ramesh Kumar"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Reference Site / Project
                </label>
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                >
                  <option value="">-- General Overhead --</option>
                  {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {['low', 'medium', 'high'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p as any)}
                      className={`py-2 rounded-lg border text-[10px] transition-all capitalize font-bold ${
                        priority === p
                          ? 'bg-slate-950 text-amber-400 border-amber-500 dark:bg-amber-500/10 dark:text-amber-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Alert Reminder Trigger
                </label>
                <select
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                >
                  <option value="15m">15 Minutes Before</option>
                  <option value="30m">30 Minutes Before</option>
                  <option value="1h">1 Hour Before</option>
                  <option value="1d">1 Day Before</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 dark:text-amber-500/60 uppercase tracking-widest mb-1.5 font-black">
                  Brief Discussion Memo / Notes
                </label>
                <input
                  type="text"
                  placeholder="Need to carry layouts, site notebook and measure tapes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl font-bold transition-all uppercase tracking-wider mt-2"
            >
              Confirm and Add Schedule
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
              <Calendar className="h-10 w-10 text-slate-300 dark:text-amber-500/30 mx-auto" />
              <div className="text-slate-900 dark:text-white font-serif font-bold">No upcoming schedule entries found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Click "Create New Event" above to schedule site visits, client design sessions, or supplier milestones.</p>
            </div>
          ) : (
            schedules.map((event) => {
              const matchedType = EVENT_TYPES.find(t => t.id === event.type);
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${matchedType?.color || 'bg-slate-100 text-slate-500'}`}>
                        {matchedType?.label || event.type.replace('_', ' ')}
                      </span>
                      {getPriorityBadge(event.priority)}
                    </div>

                    <div>
                      <h3 className="text-sm font-serif font-extrabold text-slate-900 dark:text-white leading-snug">
                        {event.title}
                      </h3>
                      {event.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1 font-medium">
                          "{event.notes}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-900 space-y-1.5 text-slate-600 dark:text-slate-400 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-amber-500/80" />
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {event.date} at {event.time}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.personName && (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>With {event.personName}</span>
                        </div>
                      )}
                      {event.projectName && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{event.projectName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-900 text-[10px] font-bold">
                    <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                      <Bell className="h-3.5 w-3.5 text-amber-500" />
                      Alert {event.reminderTime === '15m' ? '15 min' : event.reminderTime === '30m' ? '30 min' : event.reminderTime === '1h' ? '1 hour' : '1 day'} before
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this schedule event?')) {
                          deleteScheduleEvent(event.id);
                          onAddToast('Removed schedule event.', 'info');
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
