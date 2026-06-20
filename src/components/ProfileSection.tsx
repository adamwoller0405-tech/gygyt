import React, { useState } from 'react';
import { User, TrendingUp, Target, Compass, Settings, LogOut, Camera, Save, X, Loader2, Award, Check, Moon, Sun } from 'lucide-react';
import { getPhoto, uploadMedia } from '../lib/capacitor-web';
import { UserProfile } from '../types';
import { BadgeRenderer } from './BadgeRenderer';
import { ACHIEVEMENTS } from '../data/mockData';

interface ProfileSectionProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onUpdateCurrentUser: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  users,
  currentUser,
  onUpdateCurrentUser,
  onLogout,
  theme = 'dark',
  onToggleTheme
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatarUrl);
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
    const updated = { ...currentUser, name: editName, avatarUrl: editAvatar };
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
                  <button onClick={handleSaveProfile} className="w-full bg-brand-orange text-black font-black p-4 rounded-3xl shadow-lg flex items-center justify-center space-x-2">
                    <Save size={18} />
                    <span>Mentés</span>
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{currentUser.name}</h3>
                  <span className="text-[10px] font-black uppercase tracking-[4px] text-brand-orange mt-3 inline-block bg-brand-orange/10 px-4 py-1 rounded-full">{currentUser.rank}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
             {[
               { icon: TrendingUp, label: 'KM', val: currentUser.stats.totalKm },
               { icon: Compass, label: 'TÚRA', val: currentUser.stats.eventsJoined },
               { icon: Target, label: 'SZINT', val: `+${currentUser.stats.elevationGainedM}m` }
             ].map((s, i) => (
               <div key={i} className="bg-bg-panel border border-border-subtle p-5 rounded-[32px] text-center shadow-lg">
                  <s.icon className="text-brand-orange/20 mx-auto mb-2" size={24} />
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">{s.label}</p>
                  <p className="text-sm font-black text-white mt-1 font-mono">{s.val}</p>
               </div>
             ))}
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
                    {ach.id === 'first_ride' ? '🚴' : ach.id === '100_km' ? '🏅' : ach.id === '500_km' ? '🔥' : ach.id === '1000_km' ? '👑' : ach.id === 'event_master' ? '📅' : ach.id === 'photo_master' ? '📸' : ach.id === 'chat_legend' ? '💬' : '🛡️'}
                  </div>
                  {ach.hasUnlocked && <Check size={10} className="text-brand-orange" />}
                  <span className="text-[7px] font-black text-center leading-tight mt-0.5 text-white">{ach.title}</span>
                </div>
              ))}
            </div>
          </div>

          {onToggleTheme && (
            <button onClick={onToggleTheme} className="w-full bg-bg-card border border-border-card p-5 rounded-[36px] flex items-center justify-center space-x-3 hover:bg-white/5 transition-all shadow-xl">
              {theme === 'dark' ? <Sun size={18} className="text-brand-orange" /> : <Moon size={18} className="text-brand-orange" />}
              <span className="text-xs font-black text-white uppercase tracking-wider">{theme === 'dark' ? 'Világos Téma' : 'Sötét Téma'}</span>
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
