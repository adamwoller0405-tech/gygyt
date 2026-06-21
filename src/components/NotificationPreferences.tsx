import React, { useState, useEffect } from 'react';
import { Bell, X, BellOff } from 'lucide-react';

interface Props {
  onClose: () => void;
}

interface Prefs {
  likes: boolean;
  comments: boolean;
  eventReminders: boolean;
  achievements: boolean;
}

const STORAGE_KEY = 'gygyt_notif_prefs';

const defaults: Prefs = {
  likes: true,
  comments: true,
  eventReminders: true,
  achievements: true,
};

export const NotificationPreferences: React.FC<Props> = ({ onClose }) => {
  const [prefs, setPrefs] = useState<Prefs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch { return defaults; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const toggle = (key: keyof Prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const items: { key: keyof Prefs; label: string; desc: string }[] = [
    { key: 'likes', label: 'Kedvelések', desc: 'Értesítés, ha valaki like-olja a bejegyzésed' },
    { key: 'comments', label: 'Hozzászólások', desc: 'Értesítés új hozzászólásokról' },
    { key: 'eventReminders', label: 'Esemény emlékeztetők', desc: 'Emlékeztető közelgő eseményekről' },
    { key: 'achievements', label: 'Kitüntetések', desc: 'Értesítés új kitüntetésekről' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-bg-panel border border-border-subtle rounded-[40px] p-6 max-w-sm w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell size={18} className="text-brand-orange" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Értesítések</h3>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          {items.map(item => (
            <button key={item.key} onClick={() => toggle(item.key)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-border-subtle hover:bg-white/5 transition-all text-left">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">{item.label}</p>
                <p className="text-[9px] text-neutral-500 mt-0.5">{item.desc}</p>
              </div>
              <div className={`w-10 h-5 rounded-full transition-all flex items-center ${prefs[item.key] ? 'bg-brand-orange justify-end' : 'bg-neutral-700 justify-start'} p-0.5 shrink-0 ml-3`}>
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </div>
            </button>
          ))}
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-3 flex items-start space-x-2">
          <BellOff size={14} className="text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-[9px] text-yellow-400/70 leading-relaxed">A push értesítések még fejlesztés alatt állnak. Ezek a beállítások az alkalmazáson belüli jelzéseket vezérlik.</p>
        </div>
      </div>
    </div>
  );
};
