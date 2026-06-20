import React, { useState, useMemo } from 'react';
import { Search, X, User, FileText, Calendar } from 'lucide-react';
import { UserProfile, FeedPost, CyclingEvent } from '../types';

interface Props {
  users: UserProfile[];
  posts: FeedPost[];
  events: CyclingEvent[];
  onClose: () => void;
}

export const SearchBar: React.FC<Props> = ({ users, posts, events, onClose }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();

    const matchedUsers = users.filter(u => u.name.toLowerCase().includes(q));
    const matchedPosts = posts.filter(p => p.caption.toLowerCase().includes(q) || p.hashtags.some(h => h.toLowerCase().includes(q)));
    const matchedEvents = events.filter(e => e.title.toLowerCase().includes(q) || e.locationName.toLowerCase().includes(q));

    return { users: matchedUsers, posts: matchedPosts, events: matchedEvents };
  }, [query, users, posts, events]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="p-4 pt-12 max-w-lg mx-auto">
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Keresés tagok, bejegyzések, események..."
            className="w-full bg-black border border-border-subtle rounded-2xl pl-10 pr-10 py-3.5 text-xs text-white placeholder-neutral-700 outline-none focus:border-brand-orange"
          />
          <button onClick={onClose} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {results && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {results.users.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 ml-1">Tagok ({results.users.length})</p>
                {results.users.map(u => (
                  <div key={u.id} className="w-full flex items-center gap-3 bg-bg-panel border border-border-subtle rounded-2xl p-3">
                    <img src={u.avatarUrl} className="w-8 h-8 rounded-xl object-cover" alt="" />
                    <div>
                      <p className="text-xs font-bold text-white">{u.name}</p>
                      <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">{u.rank}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.posts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 ml-1">Bejegyzések ({results.posts.length})</p>
                {results.posts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-bg-panel border border-border-subtle rounded-2xl p-3">
                    <FileText size={16} className="text-brand-orange shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{p.caption || '(nincs szöveg)'}</p>
                      <p className="text-[9px] text-neutral-500">{p.authorName} • {new Date(p.createdAt).toLocaleDateString('hu-HU')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.events.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 ml-1">Események ({results.events.length})</p>
                {results.events.map(e => (
                  <div key={e.id} className="flex items-center gap-3 bg-bg-panel border border-border-subtle rounded-2xl p-3">
                    <Calendar size={16} className="text-brand-orange shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{e.title}</p>
                      <p className="text-[9px] text-neutral-500">{e.locationName} • {new Date(e.dateTime).toLocaleDateString('hu-HU')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.users.length === 0 && results.posts.length === 0 && results.events.length === 0 && (
              <p className="text-center text-xs text-neutral-600 font-bold py-10">Nincs találat</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
