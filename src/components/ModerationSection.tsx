/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, Check, X, ShieldX, Volume2, VolumeX, UserCheck, Trash2, KeyRound, UserMinus, ShieldCheck, ChevronRight, Award, PlusCircle, Loader2 } from 'lucide-react';
import { JoinRequest, UserProfile, UserRank } from '../types';
import { DEFAULT_AVATAR } from '../lib/defaults';
import { BadgeRenderer } from './BadgeRenderer';
import { ACHIEVEMENTS } from '../data/mockData';
import { useToast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';

interface ModerationSectionProps {
  joinRequests: JoinRequest[];
  users: UserProfile[];
  currentUser: UserProfile;
  onUpdateJoinRequests: (updated: JoinRequest[]) => void;
  onUpdateUsers: (updated: UserProfile[]) => void;
  onDeleteUser?: (userId: string) => void;
}

export const ModerationSection: React.FC<ModerationSectionProps> = ({
  joinRequests,
  users,
  currentUser,
  onUpdateJoinRequests,
  onUpdateUsers,
  onDeleteUser
}) => {
  const { toast } = useToast();
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<UserProfile | null>(null);
  const [banConfirmUser, setBanConfirmUser] = useState<UserProfile | null>(null);
  const [kickConfirmUser, setKickConfirmUser] = useState<UserProfile | null>(null);
  const [loadingReqs, setLoadingReqs] = useState<Set<string>>(new Set());

  const isMod = currentUser.rank === UserRank.ADMIN || currentUser.rank === UserRank.ELITE;

  const handleApproveRequest = async (req: JoinRequest) => {
    if (loadingReqs.has(req.id)) return;
    if (users.find(u => u.name === req.name)) {
        toast('Ez a név már foglalt!', 'error');
        return;
    }

    setLoadingReqs(prev => new Set(prev).add(req.id));

    const updatedRequests = joinRequests.map(r => r.id === req.id ? { ...r, status: 'approved' as const } : r);
    onUpdateJoinRequests(updatedRequests);

    const newUser: UserProfile = {
      id: req.firebaseUid || `user_${Date.now()}`,
      email: req.email,
      name: req.name,
      avatarUrl: DEFAULT_AVATAR,
      rank: UserRank.BRONZE,
      age: req.age,
      school: req.school,
      joinedDate: new Date().toISOString().split('T')[0],
      achievements: ['first_ride'],
      stats: {
        totalKm: 0,
        eventsJoined: 0,
        elevationGainedM: 0
      }
    };

    onUpdateUsers([...users, newUser]);
    toast(`${req.name} jóváhagyva! Most már bejelentkezhet az e-mail címével.`);
    setLoadingReqs(prev => { const next = new Set(prev); next.delete(req.id); return next; });
  };

  const handleRejectRequest = async (req: JoinRequest) => {
    if (loadingReqs.has(req.id)) return;
    setLoadingReqs(prev => new Set(prev).add(req.id));

    const updatedRequests = joinRequests.map(r => r.id === req.id ? { ...r, status: 'rejected' as const } : r);
    onUpdateJoinRequests(updatedRequests);
    toast(`${req.name} jelentkezése elutasítva.`, 'warning');
    setLoadingReqs(prev => { const next = new Set(prev); next.delete(req.id); return next; });
  };

  const handleChangeRank = (userId: string, newRank: UserRank) => {
    const updated = users.map(u => u.id === userId ? { ...u, rank: newRank } : u);
    onUpdateUsers(updated);
    if (selectedUserToEdit?.id === userId) setSelectedUserToEdit({ ...selectedUserToEdit, rank: newRank });
  };

  const handleToggleMute = (user: UserProfile) => {
    const updated = users.map(u => u.id === user.id ? { ...u, isMuted: !u.isMuted } : u);
    onUpdateUsers(updated);
    if (selectedUserToEdit?.id === user.id) setSelectedUserToEdit({ ...selectedUserToEdit, isMuted: !selectedUserToEdit.isMuted });
  };

  const handleToggleBan = (user: UserProfile) => {
    if (user.id === 'user_admin') {
        toast('A Rendszergazda nem tiltható ki!', 'error');
        return;
    }
    setBanConfirmUser(user);
  };

  if (!isMod) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center h-full bg-bg-deep animate-fade-in">
        <ShieldAlert size={64} className="text-red-500/30 mb-5 animate-pulse" />
        <h3 className="text-base font-black text-neutral-300 uppercase tracking-widest">Hozzáférés Megtagadva</h3>
        <p className="text-xs text-neutral-600 mt-3 max-w-[240px] leading-relaxed font-bold uppercase tracking-tighter">
          Ez a szekció kizárólag <span className="text-brand-orange">ADMIN</span> és <span className="text-brand-orange">ELITE</span> tagok számára elérhető.
        </p>
      </div>
    );
  }

  const pendingRequests = joinRequests.filter(r => r.status === 'pending');

  return (
    <div className="flex flex-col h-full bg-bg-deep animate-fade-in overflow-hidden">
      
      <div className="px-5 py-4 bg-bg-panel border-b border-border-subtle sticky top-0 z-20 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="text-brand-orange" size={20} />
          <h2 className="text-sm font-black text-white uppercase tracking-tight">Vezérlőpult</h2>
        </div>
        <span className="text-[10px] font-black tracking-widest text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20 shadow-inner">
          MODERÁCIÓ
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-24 max-w-lg mx-auto w-full">
        
        {/* Requests */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-neutral-500 ml-2 flex items-center space-x-2">
            <UserCheck size={12} className="text-brand-orange" />
            <span>Jelentkezések ({pendingRequests.length})</span>
          </h3>

          {pendingRequests.length === 0 ? (
            <div className="bg-bg-panel/30 border border-border-subtle rounded-[32px] p-8 text-center animate-fade-in">
              <p className="text-[11px] text-neutral-600 font-bold uppercase tracking-widest">Nincsenek várakozó kérelmek</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req.id} className="bg-bg-card border border-border-card rounded-[32px] p-5 space-y-4 shadow-2xl animate-fade-in group">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-black text-neutral-100 uppercase">{req.name}</h4>
                    <p className="text-[10px] font-bold text-neutral-500 mt-0.5">{req.age} ÉVES • {req.school}</p>
                  </div>
                  <span className="text-[8px] bg-black px-2 py-1 rounded-lg text-neutral-600 font-black border border-border-subtle">
                    {new Date(req.submittedAt).toLocaleDateString('hu-HU')}
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 italic bg-black/40 p-4 rounded-2xl border border-border-subtle leading-relaxed">
                  "{req.introduction}"
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleRejectRequest(req)}
                    disabled={loadingReqs.has(req.id)}
                    className="flex-1 py-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingReqs.has(req.id) ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Elutasít'}
                  </button>

                  <button
                    onClick={() => handleApproveRequest(req)}
                    disabled={loadingReqs.has(req.id)}
                    className="flex-1 py-3 rounded-2xl border border-green-500/20 bg-green-500/5 text-green-400 font-black text-[10px] uppercase tracking-widest hover:bg-green-500/10 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingReqs.has(req.id) ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Elfogad ✓'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Users list */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-neutral-500 ml-2">
            Csapattagok Kezelése
          </h3>

          <div className="bg-bg-card rounded-[32px] border border-border-card divide-y divide-border-subtle/30 overflow-hidden shadow-2xl">
            {users.filter(u => u.rank !== UserRank.ADMIN).map(u => (
              <div
                key={u.id}
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                  selectedUserToEdit?.id === u.id ? 'bg-white/5' : 'hover:bg-white/5'
                }`}
                onClick={() => setSelectedUserToEdit(u)}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-2xl object-cover shadow-md" />
                    {u.isBanned && (
                      <div className="absolute inset-0 bg-red-500/40 rounded-2xl flex items-center justify-center">
                        <ShieldX size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-neutral-100">{u.name}</span>
                      <BadgeRenderer rank={u.rank} size={14} />
                    </div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">{u.rank}</span>
                      {u.isMuted && <span className="text-[8px] font-black bg-yellow-500/10 text-yellow-500 px-1 rounded">NÉMA</span>}
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-black border border-border-subtle rounded-xl text-brand-orange group-hover:border-brand-orange/50 transition-colors">
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Editor Drawer */}
      {selectedUserToEdit && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-5 backdrop-blur-2xl animate-fade-in">
          <div className="bg-bg-panel border border-border-subtle rounded-[48px] p-8 max-w-sm w-full space-y-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-border-subtle pb-5">
              <div className="flex items-center space-x-4">
                <img src={selectedUserToEdit.avatarUrl} alt="" className="w-12 h-12 rounded-[22px] object-cover shadow-xl border-2 border-white/10" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase">{selectedUserToEdit.name} Profil Szerkesztés</h3>
                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Szerkesztés</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserToEdit(null)} className="p-2 bg-white/5 rounded-full hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Ranks */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[3px] text-neutral-500 ml-1">Rang Módosítása</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(UserRank).map(rk => (
                  <button
                    key={rk}
                    onClick={() => handleChangeRank(selectedUserToEdit.id, rk)}
                    className={`p-2.5 rounded-2xl border text-[9px] font-black uppercase transition-all ${
                      selectedUserToEdit.rank === rk
                        ? 'bg-brand-orange text-black border-brand-orange shadow-lg'
                        : 'bg-black text-neutral-600 border-border-subtle hover:text-neutral-400'
                    }`}
                  >
                    {rk}
                  </button>
                ))}
              </div>
            </div>

            {/* Achievements Editor */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[3px] text-neutral-500 ml-1">Kitüntetések Adományozása</label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto scrollbar-thin pr-2">
                {ACHIEVEMENTS.map(ach => {
                  const hasIt = selectedUserToEdit.achievements.includes(ach.id);
                  return (
                    <button
                      key={ach.id}
                      onClick={() => {
                        const newAch = hasIt
                          ? selectedUserToEdit.achievements.filter(id => id !== ach.id)
                          : [...selectedUserToEdit.achievements, ach.id];
                        const updated = { ...selectedUserToEdit, achievements: newAch };
                        onUpdateUsers(users.map(u => u.id === selectedUserToEdit.id ? updated : u));
                        setSelectedUserToEdit(updated);
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${hasIt ? 'bg-brand-orange/10 border-brand-orange/40 text-brand-orange' : 'bg-black border-border-subtle text-neutral-600'}`}
                    >
                      <div className="flex items-center space-x-2">
                        <Award size={14} />
                        <span className="text-[9px] font-black uppercase">{ach.title}</span>
                      </div>
                      {hasIt ? <Check size={12} /> : <PlusCircle size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-black uppercase tracking-[3px] text-neutral-500 ml-1">Kezelés</label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleToggleMute(selectedUserToEdit)}
                  className={`flex-1 p-4 rounded-3xl border flex items-center justify-center space-x-3 transition-all font-black text-[10px] uppercase tracking-widest ${
                    selectedUserToEdit.isMuted 
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 shadow-inner'
                      : 'bg-black text-neutral-400 border-border-subtle'
                  }`}
                >
                  {selectedUserToEdit.isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>{selectedUserToEdit.isMuted ? 'Hang' : 'Némítás'}</span>
                </button>

                <button
                  onClick={() => handleToggleBan(selectedUserToEdit)}
                  className={`flex-1 p-4 rounded-3xl border flex items-center justify-center space-x-3 transition-all font-black text-[10px] uppercase tracking-widest ${
                    selectedUserToEdit.isBanned 
                      ? 'bg-red-500/20 text-red-500 border-red-500/40 shadow-inner'
                      : 'bg-black text-red-600 border-red-900/30'
                  }`}
                >
                  <ShieldX size={16} />
                  <span>{selectedUserToEdit.isBanned ? 'Oldás' : 'Kitiltás'}</span>
                </button>

                <button
                  onClick={() => setKickConfirmUser(selectedUserToEdit)}
                  className="flex-1 p-4 rounded-3xl border border-red-900/30 bg-black text-red-600 flex items-center justify-center space-x-3 transition-all font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  <span>Kick</span>
                </button>
              </div>
            </div>

            <p className="text-center text-[9px] text-neutral-600 font-bold uppercase tracking-tighter opacity-50 pt-2">
              A változtatások azonnal mentésre kerülnek.
            </p>

          </div>
        </div>
      )}

      <ConfirmDialog
        open={banConfirmUser !== null}
        title={banConfirmUser?.isBanned ? 'Kitiltás feloldása' : 'Tag kitiltása'}
        message={banConfirmUser ? (banConfirmUser.isBanned ? `Feloldod ${banConfirmUser.name} kitiltását?` : `KITILTOD ${banConfirmUser.name} tagot a közösségből?`) : ''}
        confirmLabel={banConfirmUser?.isBanned ? 'Feloldás' : 'Kitiltás'}
        onConfirm={() => {
          if (banConfirmUser) {
            const updated = users.map(u => u.id === banConfirmUser.id ? { ...u, isBanned: !u.isBanned } : u);
            onUpdateUsers(updated);
            toast(banConfirmUser.isBanned ? `${banConfirmUser.name} feloldva!` : `${banConfirmUser.name} kitiltva!`);
            setSelectedUserToEdit(null);
            setBanConfirmUser(null);
          }
        }}
        onCancel={() => setBanConfirmUser(null)}
      />

      <ConfirmDialog
        open={kickConfirmUser !== null}
        title="Tag eltávolítása"
        message={kickConfirmUser ? `BIZTOSAN ELTÁVOLÍTOD ${kickConfirmUser.name} tagot a közösségből? Ez a művelet nem visszavonható!` : ''}
        confirmLabel="Eltávolítás"
        onConfirm={() => {
          if (kickConfirmUser && onDeleteUser) {
            onDeleteUser(kickConfirmUser.id);
            const updated = users.filter(u => u.id !== kickConfirmUser.id);
            onUpdateUsers(updated);
            toast(`${kickConfirmUser.name} eltávolítva a közösségből!`, 'warning');
            setSelectedUserToEdit(null);
            setKickConfirmUser(null);
          }
        }}
        onCancel={() => setKickConfirmUser(null)}
      />

    </div>
  );
};
