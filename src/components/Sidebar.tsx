import React, { useEffect, useState } from 'react';
import { Search, Link2, Clock, Trophy, Bell, Moon, Sun, ShieldAlert, X, ChevronRight, Bug, Settings, Globe } from 'lucide-react';
import { NotificationPreferences } from './NotificationPreferences';
import { useLang, type Lang } from '../lib/i18n';

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
  const { lang, setLang, t } = useLang();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { icon: Search, label: t('nav.search'), action: () => { onClose(); onOpenSearch(); } },
    { icon: Link2, label: t('nav.contact'), action: () => { onClose(); onNavigate('contact'); } },
    { icon: Clock, label: t('nav.calendar'), action: () => { onClose(); onNavigate('calendar'); } },
    { icon: Trophy, label: t('nav.leaderboard'), action: () => { onClose(); onNavigate('leaderboard'); } },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-72 z-[100] bg-bg-panel border-l border-border-subtle shadow-2xl animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">{t('nav.menu')}</h2>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white transition-colors" aria-label={t('common.close')}><X size={20} aria-hidden="true" /></button>
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
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">{t('nav.notifications')}</span>
            {unreadCount > 0 && <span className="text-[10px] font-black text-brand-orange">{unreadCount} {t('nav.new')}</span>}
          </button>

          <button onClick={onToggleTheme} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
            {theme === 'dark' ? <Sun size={20} className="text-brand-orange shrink-0" /> : <Moon size={20} className="text-brand-orange shrink-0" />}
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">{theme === 'dark' ? t('theme.light') : t('theme.dark')}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600 bg-black/40 px-2 py-1 rounded-full">{theme === 'dark' ? t('theme.dark_icon') : t('theme.light_icon')}</span>
          </button>

          <button onClick={() => setShowNotifPrefs(true)} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
            <Settings size={20} className="text-brand-orange shrink-0" />
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">{t('notif.settings')}</span>
            <ChevronRight size={14} className="text-neutral-600" />
          </button>

          <button onClick={() => { onClose(); onOpenBugReport(); }} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
            <Bug size={20} className="text-yellow-500 shrink-0" />
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">{t('nav.bug_report')}</span>
            <ChevronRight size={14} className="text-neutral-600" />
          </button>

          <div className="border-t border-border-subtle my-3" />

          <button onClick={() => setLang(lang === 'hu' ? 'en' : 'hu')} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
            <Globe size={20} className="text-brand-orange shrink-0" />
            <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">{t('language')}: {lang === 'hu' ? '🇭🇺 Magyar' : '🇬🇧 English'}</span>
            <ChevronRight size={14} className="text-neutral-600" />
          </button>

          <div className="border-t border-border-subtle my-3" />

          {isMod && (
            <>
              <button onClick={() => { onClose(); onNavigate('moderation'); }} className="w-full flex items-center space-x-3 p-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
                <ShieldAlert size={20} className="text-brand-orange shrink-0" />
                <span className="text-sm font-bold text-neutral-200 group-hover:text-white transition-colors flex-1">{t('admin.panel')}</span>
                <span className="text-[8px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">{t('admin.badge')}</span>
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
