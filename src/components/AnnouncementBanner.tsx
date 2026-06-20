import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Announcement } from '../types';
import { Megaphone, X } from 'lucide-react';

export const AnnouncementBanner: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'announcements'), (snap) => {
      setAnnouncements(snap.docs.map(d => d.data() as Announcement));
    });
    return unsub;
  }, []);

  const active = announcements.filter(a => a.active && !dismissed.has(a.id));
  if (active.length === 0) return null;

  return (
    <div className="space-y-1 px-3 pt-1">
      {active.map(a => (
        <div key={a.id} className="bg-brand-orange/5 border border-brand-orange/20 rounded-2xl px-4 py-2.5 flex items-start gap-3 animate-fade-in">
          <Megaphone size={16} className="text-brand-orange mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-brand-orange uppercase tracking-wider">{a.title}</p>
            <p className="text-[11px] text-neutral-300 leading-relaxed mt-0.5">{a.content}</p>
          </div>
          <button onClick={() => setDismissed(prev => new Set(prev).add(a.id))} className="text-neutral-600 hover:text-white shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
