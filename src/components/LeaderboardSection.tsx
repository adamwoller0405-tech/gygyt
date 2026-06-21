import React, { useMemo } from 'react';
import { Trophy, Compass } from 'lucide-react';
import { UserProfile } from '../types';
import { BadgeRenderer } from './BadgeRenderer';

interface Props {
  users: UserProfile[];
  currentUser: UserProfile;
}

export const LeaderboardSection: React.FC<Props> = ({ users, currentUser }) => {
  const sorted = useMemo(() => {
    const list = [...users].filter(u => !u.isBanned);
    list.sort((a, b) => b.stats.eventsJoined - a.stats.eventsJoined);
    return list;
  }, [users]);

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-deep animate-fade-in overflow-hidden min-h-0">
      <div className="px-6 py-5 bg-bg-panel border-b border-border-subtle flex items-center justify-between sticky top-0 z-20 shadow-xl">
        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center space-x-2">
          <Trophy className="text-brand-orange" size={18} />
          <span>Ranglista</span>
        </h2>
      </div>

      <div className="flex bg-black/40 mx-4 mt-4 p-1 rounded-2xl border border-border-subtle max-w-[180px]">
        <div className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase bg-brand-orange text-black">
          <Compass size={14} />
          <span>TÚRA</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24 scroll-smooth max-w-lg mx-auto w-full">
        {sorted.map((u, i) => {
          const isMe = u.id === currentUser.id;
          const val = u.stats.eventsJoined;
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';

          return (
            <div key={u.id} className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all ${isMe ? 'bg-brand-orange/10 border-brand-orange/40' : 'bg-bg-card border-border-card hover:border-border-subtle'}`}>
              <div className="w-8 text-center shrink-0">
                {i < 3 ? <span className="text-lg">{medal}</span> : <span className="text-[10px] font-black text-neutral-600">#{i + 1}</span>}
              </div>

              <img src={u.avatarUrl} className="w-9 h-9 rounded-xl object-cover shrink-0 border border-white/5" alt="" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-black text-white truncate">{u.name}</span>
                  <BadgeRenderer rank={u.rank} size={12} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">{u.rank}</span>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-black text-brand-orange font-mono">{val}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};