import React from 'react';
import { Link2, Share2 } from 'lucide-react';

const SITE_URL = 'https://gygyt.pages.dev';

const links = [
  { label: 'TikTok', url: 'https://tiktok.com/@gygyttekeres', icon: '🎵', color: 'from-pink-500 to-purple-600' },
  { label: 'Instagram', url: 'https://instagram.com/gygyttekeres', icon: '📸', color: 'from-purple-500 to-orange-500' },
  { label: 'Facebook', url: 'https://facebook.com/gygyttekeres', icon: '👍', color: 'from-blue-600 to-blue-800' },
  { label: 'Discord', url: 'https://discord.gg/gygyt', icon: '💬', color: 'from-indigo-500 to-indigo-700' },
  { label: 'YouTube', url: 'https://youtube.com/@gygyttekeres', icon: '▶️', color: 'from-red-600 to-red-800' },
  { label: 'Strava Klub', url: 'https://strava.com/clubs/gygyt', icon: '🏃', color: 'from-orange-600 to-orange-800' },
];

export const ContactSection: React.FC = () => {
  const handleShare = async () => {
    const url = SITE_URL;
    if (navigator.share) {
      try { await navigator.share({ title: 'GYGYT Tekerés', url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); } catch {}
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-deep animate-fade-in overflow-y-auto min-h-0">
      <div className="px-6 py-5 bg-bg-panel border-b border-border-subtle flex items-center justify-between sticky top-0 z-20 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center space-x-2">
          <Link2 className="text-brand-orange" size={18} />
          <span>Kapcsolat</span>
        </h2>
      </div>

      <div className="p-6 space-y-5 max-w-lg mx-auto w-full pb-24">
        <div className="bg-bg-card rounded-[48px] p-8 border border-border-card shadow-2xl text-center">
          <div className="text-6xl mb-4">🚴</div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">GYGYT Tekerés</h3>
          <p className="text-xs text-neutral-500 mt-2 max-w-xs mx-auto leading-relaxed">
            Kövess minket a közösségi platformokon, és csatlakozz a beszélgetésekhez!
          </p>
        </div>

        <div className="space-y-3">
          {links.map(l => (
            <a
              key={l.label}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center space-x-4 bg-gradient-to-r ${l.color} rounded-3xl p-4 shadow-lg hover:scale-[1.02] active:scale-95 transition-all`}
            >
              <span className="text-2xl">{l.icon}</span>
              <div>
                <p className="text-sm font-black text-white">{l.label}</p>
                <p className="text-[10px] text-white/70 truncate max-w-[200px]">{l.url.replace('https://', '')}</p>
              </div>
            </a>
          ))}
        </div>

        <button
          onClick={handleShare}
          className="w-full bg-bg-card border border-border-card rounded-3xl p-5 flex items-center justify-center space-x-3 shadow-lg hover:bg-white/5 transition-all active:scale-95"
        >
          <Share2 className="text-brand-orange" size={22} />
          <span className="text-sm font-black text-white uppercase tracking-wider">GYGYT Link Megosztása</span>
        </button>

        <div className="bg-bg-card border border-border-card rounded-[32px] p-6 shadow-lg text-center">
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Landing Page</p>
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-orange font-black mt-1 block hover:underline">{SITE_URL}</a>
        </div>
      </div>
    </div>
  );
};
