import React, { useState } from 'react';
import { Clock, X, ChevronRight } from 'lucide-react';
import { CyclingEvent, UserProfile } from '../types';

interface Props {
  events: CyclingEvent[];
  currentUser: UserProfile;
}

export const EventReminderBanner: React.FC<Props> = ({ events, currentUser }) => {
  const [dismissed, setDismissed] = useState(false);

  const upcoming = events
    .filter(ev => {
      const rsvp = ev.rsvps[currentUser.id];
      if (rsvp !== 'going') return false;
      const eventTime = new Date(ev.dateTime).getTime();
      const now = Date.now();
      const diffHours = (eventTime - now) / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 48;
    })
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  if (upcoming.length === 0 || dismissed) return null;

  return (
    <div className="space-y-1 px-3 pt-1">
      {upcoming.slice(0, 2).map(ev => {
        const eventTime = new Date(ev.dateTime).getTime();
        const diffHours = Math.round((eventTime - Date.now()) / (1000 * 60 * 60));
        const timeLabel = diffHours < 1 ? 'Hamarosan!' : diffHours < 24 ? `${diffHours} óra múlva` : `${Math.round(diffHours / 24)} nap múlva`;
        return (
          <div key={ev.id} className="bg-blue-500/5 border border-blue-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-3 animate-fade-in">
            <Clock size={16} className="text-blue-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider">Közelgő esemény</p>
              <p className="text-[11px] text-neutral-300 leading-relaxed mt-0.5 truncate">{ev.title} — {timeLabel}</p>
            </div>
            <button onClick={() => setDismissed(true)} className="text-neutral-600 hover:text-white shrink-0">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
