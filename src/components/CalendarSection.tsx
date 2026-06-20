import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Bike, MapPin, Users } from 'lucide-react';
import { CyclingEvent } from '../types';

const DAYS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
const MONTHS = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'];

interface Props {
  events: CyclingEvent[];
}

export const CalendarSection: React.FC<Props> = ({ events }) => {
  const [date, setDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = date.getFullYear();
  const month = date.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const eventsByDay = useMemo(() => {
    const map: Record<number, CyclingEvent[]> = {};
    events.forEach(e => {
      const d = new Date(e.dateTime);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(e);
      }
    });
    return map;
  }, [events, year, month]);

  const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  const prevMonth = () => { setDate(new Date(year, month - 1, 1)); setSelectedDay(null); };
  const nextMonth = () => { setDate(new Date(year, month + 1, 1)); setSelectedDay(null); };

  return (
    <div className="flex-1 flex flex-col bg-bg-deep animate-fade-in overflow-y-auto">
      <div className="px-5 py-4 bg-bg-panel border-b border-border-subtle sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/5 transition-colors"><ChevronLeft size={18} className="text-neutral-400" /></button>
          <h2 className="text-sm font-black text-white uppercase tracking-wider">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/5 transition-colors"><ChevronRight size={18} className="text-neutral-400" /></button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[9px] font-black text-neutral-600 uppercase tracking-wider py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasEvents = !!eventsByDay[day];
            const isSelected = selectedDay === day;
            const today = new Date();
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative aspect-square rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-brand-orange text-black shadow-lg'
                    : isToday
                    ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/30'
                    : hasEvents
                    ? 'bg-white/5 text-white hover:bg-white/10'
                    : 'text-neutral-600 hover:bg-white/5'
                }`}
              >
                {day}
                {hasEvents && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-orange" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedEvents.length > 0 && (
        <div className="px-4 pb-24 space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">
            Események • {selectedDay}. {MONTHS[month]}
          </h3>
          {selectedEvents.map(e => (
            <div key={e.id} className="bg-bg-card border border-border-card rounded-3xl p-4 space-y-2 shadow-xl">
              <h4 className="text-sm font-black text-white">{e.title}</h4>
              <div className="flex flex-wrap gap-3 text-[10px] text-neutral-400 font-bold">
                <span className="flex items-center gap-1"><MapPin size={12} />{e.locationName}</span>
                <span className="flex items-center gap-1"><Bike size={12} />{e.distanceKm} km</span>
                <span className="flex items-center gap-1"><Users size={12} />{Object.values(e.rsvps).filter(v => v === 'going').length} megy</span>
              </div>
              <p className="text-xs text-neutral-500">{e.description}</p>
            </div>
          ))}
        </div>
      )}

      {selectedDay && selectedEvents.length === 0 && (
        <div className="px-4 pb-24">
          <p className="text-center text-xs text-neutral-600 font-bold py-10">Nincs esemény ezen a napon</p>
        </div>
      )}
    </div>
  );
};
