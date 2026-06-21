import React, { useState } from 'react';
import { User, TrendingUp, Target, Compass, Settings, LogOut, Camera, Save, X, Loader2, Award, Check, Moon, Sun, Share2, Ban } from 'lucide-react';
import { getPhoto, uploadMedia } from '../lib/capacitor-web';
import { UserProfile, CyclingEvent } from '../types';
import { BadgeRenderer } from './BadgeRenderer';
import { ACHIEVEMENTS } from '../data/mockData';

interface ProfileSectionProps {
  users: UserProfile[];
  currentUser: UserProfile;
  events?: CyclingEvent[];
  onUpdateCurrentUser: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  users,
  currentUser,
  events = [],
  onUpdateCurrentUser,
  onLogout,
  onDeleteAccount,
  theme = 'dark',
  onToggleTheme
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatarUrl);
  const [editFlair, setEditFlair] = useState(currentUser.flair || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadAvatar = async () => {
    try {
      const image = await getPhoto({ quality: 90, allowEditing: true });
      if (image.webPath) {
        setIsUploading(true);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const url = await uploadMedia(blob);
        if (isEditing) {
          setEditAvatar(url);
        } else {
          onUpdateCurrentUser({ ...currentUser, avatarUrl: url });
        }
      }
    } catch { } finally { setIsUploading(false); }
  };

  const handleSaveProfile = () => {
    const updated = { ...currentUser, name: editName, avatarUrl: editAvatar, flair: editFlair || undefined };
    onUpdateCurrentUser(updated);
    setIsEditing(false);
  };

  const achievementsWithStatus = ACHIEVEMENTS.map(ach => ({
    ...ach,
    hasUnlocked: currentUser.achievements.includes(ach.id)
  }));

  const unlockedCount = achievementsWithStatus.filter(a => a.hasUnlocked).length;

  return (
      <div className="flex-1 flex flex-col h-full bg-bg-deep animate-fade-in overflow-y-auto">
        <div className="px-6 py-5 bg-bg-panel border-b border-border-subtle flex items-center justify-between sticky top-0 z-20 shadow-xl">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center space-x-2">
            <User className="text-brand-orange" size={18} />
            <span>Fiókom</span>
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2.5 rounded-2xl border transition-all ${isEditing ? 'bg-brand-orange text-black border-brand-orange' : 'bg-white/5 text-neutral-500 border-white/5'}`}
          >
            {isEditing ? <X size={20} /> : <Settings size={20} />}
          </button>
        </div>

        <div className="p-6 space-y-8 max-w-lg mx-auto w-full pb-24">

          <div className="bg-bg-card rounded-[48px] p-8 border border-border-card relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange/5 rounded-full blur-[70px] -mr-24 -mt-24" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative mb-6 group">
                <img
                  src={isEditing ? editAvatar : currentUser.avatarUrl}
                  alt=""
                  className="w-32 h-32 rounded-[44px] object-cover border-2 border-brand-orange/20 shadow-2xl transition-all group-hover:scale-105"
                />
                <div className="absolute -bottom-3 -right-3 drop-shadow-2xl">
                  <BadgeRenderer rank={currentUser.rank} size={64} />
                </div>
                <button
                  onClick={handleUploadAvatar}
                  disabled={isUploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[44px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? <Loader2 className="animate-spin text-white" size={24} /> : <Camera className="text-white" size={28} />}
                </button>
              </div>

              {isEditing ? (
                <div className="w-full space-y-4">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-black border border-border-subtle rounded-3xl px-5 py-3 text-center text-lg font-black text-white focus:border-brand-orange outline-none"
                    placeholder="Név"
                  />
                  <input
                    type="text"
                    value={editFlair}
                    onChange={(e) => setEditFlair(e.target.value)}
                    className="w-full bg-black border border-border-subtle rounded-3xl px-5 py-3 text-center text-xs font-bold text-yellow-400 focus:border-brand-orange outline-none"
                    placeholder="Egyedi címke (pl. 🏆 Hegymenő)"
                    maxLength={20}
                  />
                  <button onClick={handleSaveProfile} className="w-full bg-brand-orange text-black font-black p-4 rounded-3xl shadow-lg flex items-center justify-center space-x-2">
                    <Save size={18} />
                    <span>Mentés</span>
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{currentUser.name}</h3>
                  {currentUser.flair && <span className="text-[9px] font-black text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full mt-2 inline-block">{currentUser.flair}</span>}
                  <span className="text-[10px] font-black uppercase tracking-[4px] text-brand-orange mt-2 inline-block bg-brand-orange/10 px-4 py-1 rounded-full">{currentUser.rank}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
             {(() => {
               const userEvents = events.filter(e => Object.keys(e.rsvps).some(k => e.rsvps[k] === 'going' && k === currentUser.id));
               const now = new Date();
               const thisMonth = userEvents.filter(e => { const d = new Date(e.dateTime); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
               const thisYear = userEvents.filter(e => { const d = new Date(e.dateTime); return d.getFullYear() === now.getFullYear(); });
               const total = userEvents.length;
               return [
                 { icon: Compass, label: 'E HÓNAP', val: thisMonth.length },
                 { icon: TrendingUp, label: 'E ÉV', val: thisYear.length },
                 { icon: Award, label: 'ÖSSZES', val: total },
               ].map((s, i) => (
                <div key={i} className="bg-bg-panel border border-border-subtle p-4 rounded-[32px] text-center shadow-lg">
                   <s.icon className="text-brand-orange/20 mx-auto mb-2" size={22} />
                   <p className="text-[7px] font-black text-neutral-600 uppercase tracking-widest">{s.label}</p>
                   <p className="text-sm font-black text-white mt-1 font-mono">{s.val}</p>
                </div>
               ));
             })()}
          </div>

          <div className="bg-bg-card rounded-[32px] p-6 border border-border-card shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="text-brand-orange" size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-neutral-500">Kitüntetések</h3>
              </div>
              <span className="text-[10px] font-black text-brand-orange">{unlockedCount}/{ACHIEVEMENTS.length}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {achievementsWithStatus.map(ach => (
                <div key={ach.id} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${ach.hasUnlocked ? 'bg-brand-orange/10 border-brand-orange/30' : 'bg-black/40 border-border-subtle opacity-40'}`}>
                  <div className={`text-xl mb-1 ${ach.hasUnlocked ? '' : 'grayscale'}`}>
                    {ach.id === 'first_ride' ? '🚴' : ach.id === 'event_master' ? '📅' : ach.id === 'photo_master' ? '📸' : ach.id === 'chat_legend' ? '💬' : ach.id === 'veteran' ? '🛡️' : ach.id === 'social_butterfly' ? '🦋' : ach.id === 'night_rider' ? '🌙' : '🏆'}
                  </div>
                  {ach.hasUnlocked && <Check size={10} className="text-brand-orange" />}
                  <span className="text-[7px] font-black text-center leading-tight mt-0.5 text-white">{ach.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bg-card rounded-[32px] p-6 border border-border-card shadow-lg space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-brand-orange" size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-[3px] text-neutral-500">Tekerés Történet</h3>
            </div>
            {(() => {
              const pastRides = events.filter(e => new Date(e.dateTime) < new Date() && Object.keys(e.rsvps).some(k => e.rsvps[k] === 'going' && k === currentUser.id));
              if (pastRides.length === 0) return <p className="text-[10px] text-neutral-600 font-bold text-center py-4">Még nem voltál tekerésen</p>;
              return (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {pastRides.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()).slice(0, 10).map(ev => (
                    <div key={ev.id} className="flex items-start space-x-3 p-2.5 bg-black/30 rounded-2xl border border-border-subtle/30">
                      <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center text-sm shrink-0">
                        {ev.type === 'Race' ? '🏆' : ev.type === 'Meetup' ? '🍕' : ev.type === 'Social' ? '🎉' : ev.type === 'Maintenance' ? '🔧' : '🚴'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-white truncate">{ev.title}</p>
                        <p className="text-[8px] text-neutral-500 font-bold">{new Date(ev.dateTime).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' })} • {ev.locationName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <button onClick={() => { const url = `${window.location.origin}/app/?user=${currentUser.id}`; if (navigator.share) { navigator.share({ title: `GYGYT Rideout — ${currentUser.name}`, url }).catch(() => {}); } else { navigator.clipboard?.writeText(url).catch(() => {}); } }} className="w-full bg-bg-card border border-border-card p-5 rounded-[36px] flex items-center justify-center space-x-3 hover:bg-white/5 transition-all shadow-xl">
            <Share2 size={18} className="text-brand-orange" />
            <span className="text-xs font-black text-white uppercase tracking-wider">Profil Megosztása</span>
          </button>

          <details className="w-full bg-bg-card border border-border-card rounded-[36px] overflow-hidden shadow-xl group">
            <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center text-sm">📱</div>
                <span className="text-xs font-black text-white uppercase tracking-wider">QR Kód</span>
              </div>
              <span className="text-neutral-600 text-xs">+</span>
            </summary>
            <div className="px-5 pb-5 flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/app/?user=${currentUser.id}`)}`}
                alt="QR kód"
                className="w-36 h-36 rounded-2xl border border-border-subtle"
              />
            </div>
          </details>

          {(currentUser.blockedUsers?.length || 0) > 0 && (
            <details className="w-full bg-bg-card border border-border-card rounded-[36px] overflow-hidden shadow-xl group">
              <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Ban size={16} className="text-red-400" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">Letiltott felhasználók ({currentUser.blockedUsers!.length})</span>
                </div>
                <span className="text-neutral-600 text-xs">+</span>
              </summary>
              <div className="px-5 pb-5 space-y-2">
                {currentUser.blockedUsers!.map(blockedId => {
                  const blockedUser = users.find(u => u.id === blockedId);
                  return (
                    <div key={blockedId} className="flex items-center justify-between bg-black/40 rounded-2xl p-3">
                      <div className="flex items-center space-x-2">
                        <img src={blockedUser?.avatarUrl || ''} className="w-6 h-6 rounded-full object-cover" alt="" />
                        <span className="text-xs font-bold text-neutral-300">{blockedUser?.name || 'Ismeretlen'}</span>
                      </div>
                      <button onClick={() => {
                        const updated = { ...currentUser, blockedUsers: (currentUser.blockedUsers || []).filter(id => id !== blockedId) };
                        onUpdateCurrentUser(updated);
                      }} className="text-[9px] font-black text-green-400 bg-green-400/10 px-3 py-1 rounded-full hover:bg-green-400/20 transition-all">FELOLDÁS</button>
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          {onToggleTheme && (
            <button onClick={onToggleTheme} className="w-full bg-bg-card border border-border-card p-5 rounded-[36px] flex items-center justify-center space-x-3 hover:bg-white/5 transition-all shadow-xl">
              {theme === 'dark' ? <Sun size={18} className="text-brand-orange" /> : <Moon size={18} className="text-brand-orange" />}
              <span className="text-xs font-black text-white uppercase tracking-wider">{theme === 'dark' ? 'Világos Téma' : 'Sötét Téma'}</span>
            </button>
          )}

          {onDeleteAccount && (
            <button onClick={onDeleteAccount} className="w-full bg-red-500/5 border border-red-500/10 text-red-400 font-black p-5 rounded-[36px] uppercase tracking-widest text-xs flex items-center justify-center space-x-3 hover:bg-red-500/10 transition-all shadow-xl shadow-red-500/5">
              <X size={18} />
              <span>Fiók Törlése</span>
            </button>
          )}

          <button onClick={onLogout} className="w-full bg-red-500/5 border border-red-500/10 text-red-500 font-black p-5 rounded-[36px] uppercase tracking-widest text-xs flex items-center justify-center space-x-3 hover:bg-red-500/10 transition-all shadow-xl shadow-red-500/5">
            <LogOut size={18} />
            <span>Kijelentkezés</span>
          </button>

        </div>
      </div>
    );
  };
