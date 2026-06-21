import React, { useEffect, useState } from 'react';
import { Search, Link2, Clock, Trophy, Bell, Moon, Sun, ShieldAlert, X, ChevronRight, Bug, Settings } from 'lucide-react';
import { NotificationPreferences } from './NotificationPreferences';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenBugReport: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  unreadCount: number;
  isMod: boolean;
  appVersion: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen, onClose, onNavigate, onOpenSearch, onOpenBugReport,
  theme, onToggleTheme, unreadCount, isMod, appVersion
}) => {
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { icon: Search, label: 'Keresés', action: () => { onClose(); onOpenSearch(); } },
    { icon: Link2, label: 'Kapcsolat', action: () => { onClose(); onNavigate('contact'); } },
    { icon: Clock, label: 'Naptár', action: () => { onClose(); onNavigate('calendar'); } },
    { icon: Trophy, label: 'Ranglista', action: () => { onClose(); onNavigate('leaderboard'); } },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-72 z-[100] bg-bg-panel border-l border-border-subtle shadow-2xl animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Menü</h2>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white transition-colors" aria-label="Bezárás"><X size={20} aria-hidden="true" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {items.map(item => (
            <button key={item.label} onClick={item.action} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
              <item.icon size={20} className="text-brand-orange shrink-0" />
              <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">{item.label}</span>
              <ChevronRight size={14} className="text-neutral-600" />
            </button>
          ))}

          <div className="border-t border-border-subtle my-3" />

          <button onClick={() => { onClose(); }} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
            <div className="relative shrink-0">
              <Bell size={20} className="text-brand-orange" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center border border-black">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">Értesítések</span>
            {unreadCount > 0 && <span className="text-[10px] font-black text-brand-orange">{unreadCount} új</span>}
          </button>

          <button onClick={onToggleTheme} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
            {theme === 'dark' ? <Sun size={20} className="text-brand-orange shrink-0" /> : <Moon size={20} className="text-brand-orange shrink-0" />}
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">{theme === 'dark' ? 'Világos Téma' : 'Sötét Téma'}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600 bg-black/40 px-2 py-1 rounded-full">{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>

          <button onClick={() => setShowNotifPrefs(true)} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
            <Settings size={20} className="text-brand-orange shrink-0" />
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">Értesítési beállítások</span>
            <ChevronRight size={14} className="text-neutral-600" />
          </button>

          <button onClick={() => { onClose(); onOpenBugReport(); }} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
            <Bug size={20} className="text-yellow-500 shrink-0" />
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">Hibajelentés</span>
            <ChevronRight size={14} className="text-neutral-600" />
          </button>

          <div className="border-t border-border-subtle my-3" />

          {isMod && (
            <>
              <button onClick={() => { onClose(); onNavigate('moderation'); }} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
                <ShieldAlert size={20} className="text-brand-orange shrink-0" />
                <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">Vezérlőpult</span>
                <span className="text-[8px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Admin</span>
              </button>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border-subtle">
          <p className="text-[8px] text-neutral-600 font-black tracking-widest text-center">GYGYT Rideout v{appVersion}</p>
        </div>
      </div>

      {showNotifPrefs && <NotificationPreferences onClose={() => setShowNotifPrefs(false)} />}
    </>
  );
};
