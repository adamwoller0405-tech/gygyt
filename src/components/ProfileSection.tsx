/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, TrendingUp, Target, Compass, Settings, LogOut, Camera, Save, X, Loader2 } from 'lucide-react';
import { getPhoto, uploadMedia } from '../lib/capacitor-web';
import { UserProfile, UserRank } from '../types';
import { BadgeRenderer } from './BadgeRenderer';

interface ProfileSectionProps {
  users: UserProfile[];
  currentUser: UserProfile;
  onUpdateCurrentUser: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  users,
  currentUser,
  onUpdateCurrentUser,
  onLogout,
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

          <button onClick={onLogout} className="w-full bg-red-500/5 border border-red-500/10 text-red-500 font-black p-5 rounded-[36px] uppercase tracking-widest text-xs flex items-center justify-center space-x-3 hover:bg-red-500/10 transition-all shadow-xl shadow-red-500/5">
            <LogOut size={18} />
            <span>Kijelentkezés</span>
          </button>

        </div>
      </div>
    );
  };
