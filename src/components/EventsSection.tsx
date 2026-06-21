/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Award, Users, PlusCircle, Check, HelpCircle, X, Camera, Trash2, Download } from 'lucide-react';
import { CyclingEvent, UserProfile, UserRank } from '../types';
import { BadgeRenderer } from './BadgeRenderer';
import { useToast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { PullToRefresh } from './PullToRefresh';

interface EventsSectionProps {
  events: CyclingEvent[];
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdateEvents: (updatedEvents: CyclingEvent[]) => void;
  onUserStatsUpdate?: (userId: string, stats: { events: number }) => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({
  events,
  currentUser,
  users,
  onUpdateEvents,
  onUserStatsUpdate
}) => {
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState(() => localStorage.getItem('draft_event_title') || '');
  const [description, setDescription] = useState(() => localStorage.getItem('draft_event_desc') || '');
  const [dateTime, setDateTime] = useState(() => localStorage.getItem('draft_event_date') || '');
  const [locationName, setLocationName] = useState(() => localStorage.getItem('draft_event_location') || '');
  const [difficulty, setDifficulty] = useState<'Könnyű' | 'Közepes' | 'Nehéz' | 'Extrém'>('Közepes');
  const [type, setType] = useState<'Ride' | 'Race' | 'Meetup' | 'Social' | 'Maintenance'>('Ride');
  const [maxParticipants, setMaxParticipants] = useState<number>(0);
  const [selectedEventIdForPhoto, setSelectedEventIdForPhoto] = useState<string | null>(null);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState<string | null>(null);

  const handleRefresh = async () => {
    await new Promise(r => setTimeout(r, 500));
  };

  const isEditor = currentUser.rank === UserRank.ADMIN || currentUser.rank === UserRank.ELITE;

  const handleRsvp = (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const oldStatus = event.rsvps[currentUser.id];

    const updated = events.map(ev => {
      if (ev.id === eventId) {
        const rsvps = { ...ev.rsvps };
        rsvps[currentUser.id] = status;
        return { ...ev, rsvps };
      }
      return ev;
    });

    onUpdateEvents(updated);

    // Update event count if status changed to/from 'going'
    if (onUserStatsUpdate && oldStatus !== status) {
        let eventChange = 0;
        if (status === 'going') {
            eventChange = 1;
        } else if (oldStatus === 'going') {
            eventChange = -1;
        }
        if (eventChange !== 0) {
            onUserStatsUpdate(currentUser.id, {
                events: currentUser.stats.eventsJoined + eventChange
            });
        }
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!isEditor) {
      toast('Nincs jogosultságod törölni ezt az eseményt!', 'error');
      return;
    }
    setDeleteConfirmEventId(eventId);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditor) { toast('Nincs jogosultságod eseményt létrehozni!', 'error'); return; }
    if (!title.trim() || !dateTime || !locationName.trim()) return;

    const newEvent: CyclingEvent = {
      id: `event_${Date.now()}`,
      title,
      description,
      dateTime,
      locationName,
      difficulty,
      type,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      rsvps: {
        [currentUser.id]: 'going'
      },
      maxParticipants: maxParticipants > 0 ? maxParticipants : undefined
    };

    onUpdateEvents([...events, newEvent]);
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setDateTime('');
    setLocationName('');
    setMaxParticipants(0);
    ['draft_event_title', 'draft_event_desc', 'draft_event_date', 'draft_event_location'].forEach(k => localStorage.removeItem(k));
  };

  const handleAddPhoto = (eventId: string) => {
    const url = photoUrlInput.trim();
    const updated = events.map(ev => {
      if (ev.id === eventId) {
        return {
          ...ev,
          photos: [...(ev.photos || []), url || 'https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=800']
        };
      }
      return ev;
    });

    onUpdateEvents(updated);
    setPhotoUrlInput('');
    setSelectedEventIdForPhoto(null);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Könnyű': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Közepes': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'Nehéz': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Extrém': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-neutral-800 text-neutral-400';
    }
  };

  const getTypeLabel = (t: string) => {
    switch (t) {
      case 'Ride': return '🚴‍♂️ Közös Tekerés';
      case 'Race': return '🏆 Verseny';
      case 'Meetup': return '🍕 Találkozó';
      case 'Social': return '🎉 Társasági Program';
      case 'Maintenance': return '🔧 Karbantartás';
      default: return t;
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-deep animate-fade-in min-h-0">
      
      <div className="bg-bg-panel px-4 py-3 border-b border-border-subtle sticky top-0 z-20 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2">
          <Calendar className="text-brand-orange" size={18} />
          <h2 className="text-sm font-black text-white uppercase tracking-tight">GYGYT Rideout Naptár <span className="text-[8px] text-yellow-500 ml-1">BÉTA</span></h2>
        </div>

        {isEditor && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1 text-xs font-bold text-black bg-brand-orange py-1.5 px-4 rounded-full transition-all hover:brightness-110 active:scale-95 shadow-md shadow-brand-orange/20"
          >
            <PlusCircle size={14} />
            <span>Új Tekerés</span>
          </button>
        )}
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-3.5 space-y-4 max-w-lg mx-auto w-full pb-20">
        {events.length === 0 ? (
          <div className="text-center py-20 text-neutral-500 animate-fade-in">
            <Calendar size={48} className="mx-auto mb-3 text-neutral-800" />
            <p className="text-sm font-bold text-neutral-400">Nincsenek kiírt tekerések.</p>
            <p className="text-xs mt-1">Szervezz egyet te!</p>
          </div>
        ) : (
          events.map(ev => {
            const rsvpEntries = Object.entries(ev.rsvps || {});
            const goingCount = rsvpEntries.filter(([_, status]) => status === 'going').length;
            const maybeCount = rsvpEntries.filter(([_, status]) => status === 'maybe').length;
            const notGoingCount = rsvpEntries.filter(([_, status]) => status === 'not_going').length;
            const myRsvp = ev.rsvps ? ev.rsvps[currentUser.id] : undefined;
            const isFull = ev.maxParticipants ? goingCount >= ev.maxParticipants : false;

            return (
              <div 
                key={ev.id} 
                className="bg-bg-card border border-border-card rounded-3xl overflow-hidden shadow-2xl animate-fade-in"
              >
                <div className="bg-bg-panel p-3.5 border-b border-border-card flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black uppercase text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full border border-brand-orange/20">
                    {getTypeLabel(ev.type)}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const start = new Date(ev.dateTime);
                        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
                        const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                        const ics = [
                          'BEGIN:VCALENDAR',
                          'VERSION:2.0',
                          'PRODID:-//GYGYT Rideout//HU',
                          'BEGIN:VEVENT',
                          `DTSTART:${fmt(start)}`,
                          `DTEND:${fmt(end)}`,
                          `SUMMARY:${ev.title}`,
                          `DESCRIPTION:${ev.description || ''}`,
                          `LOCATION:${ev.locationName}`,
                          'END:VEVENT',
                          'END:VCALENDAR',
                        ].join('\r\n');
                        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `${ev.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
                        a.click(); URL.revokeObjectURL(url);
                      }}
                      className="p-1.5 text-neutral-600 hover:text-brand-orange transition-colors"
                      title="Naptárba"
                    >
                      <Download size={14} />
                    </button>
                    {isEditor && (
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1.5 text-neutral-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4.5 space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-neutral-100 uppercase tracking-tight leading-tight">{ev.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-500 font-bold">
                      <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{ev.creatorName} által</span>
                      <span className="text-brand-orange">•</span>
                      <span className="uppercase">{new Date(ev.dateTime).toLocaleDateString('hu-HU', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>

                  {ev.description && (
                    <p className="text-xs text-neutral-400 leading-relaxed bg-black/30 p-3 rounded-2xl border border-border-subtle/50 italic">
                      "{ev.description}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-black/50 p-3 rounded-2xl border border-border-subtle flex items-center space-x-3 shadow-inner">
                      <Calendar className="text-brand-orange" size={16} />
                      <div className="truncate">
                        <p className="text-[8px] text-neutral-500 uppercase font-black tracking-tighter">Helyszín</p>
                        <p className="font-bold text-neutral-100 truncate">{ev.locationName}</p>
                      </div>
                    </div>

                    <div className={`p-3 rounded-2xl border flex items-center space-x-3 ${getDifficultyColor(ev.difficulty)} shadow-inner`}>
                      <Award className="text-current" size={16} />
                      <div>
                        <p className="text-[8px] opacity-60 uppercase font-black tracking-tighter">Nehézség</p>
                        <p className="font-black">{ev.difficulty}</p>
                      </div>
                    </div>
                  </div>

                  {/* Gallery */}
                  <div className="pt-2 border-t border-border-subtle/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider flex items-center space-x-1.5">
                        <Camera size={12} className="text-brand-orange" />
                        <span>Fotók ({ev.photos?.length || 0})</span>
                      </span>
                      <button
                        onClick={() => setSelectedEventIdForPhoto(selectedEventIdForPhoto === ev.id ? null : ev.id)}
                        className="text-[9px] font-black text-brand-orange border border-brand-orange/30 px-3 py-1 rounded-full hover:bg-brand-orange/5 transition-all"
                      >
                        + KÉP HOZZÁADÁSA
                      </button>
                    </div>

                    {selectedEventIdForPhoto === ev.id && (
                      <div className="bg-black/60 p-3 rounded-2xl mb-3 border border-brand-orange/20 animate-slide-up">
                        <input
                          type="url"
                          placeholder="Fénykép URL linkje..."
                          value={photoUrlInput}
                          onChange={(e) => setPhotoUrlInput(e.target.value)}
                          className="w-full bg-neutral-900 border border-border-subtle text-xs text-neutral-100 p-2 rounded-xl focus:border-brand-orange outline-none"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => handleAddPhoto(ev.id)}
                            className="bg-brand-orange text-[10px] text-black font-black px-4 py-1.5 rounded-xl transition-all active:scale-95"
                          >
                            MENTÉS
                          </button>
                        </div>
                      </div>
                    )}

                    {ev.photos && ev.photos.length > 0 && (
                      <div className="flex space-x-2 overflow-x-auto py-1 scrollbar-none snap-x">
                        {ev.photos.map((p, pIdx) => (
                          <div key={pIdx} className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-border-subtle snap-center shadow-lg">
                            <img src={p} alt="Esemény" className="object-cover w-full h-full hover:scale-110 transition-transform duration-300" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Attendance */}
                  <div className="bg-black/40 p-4 rounded-3xl border border-border-subtle/50 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider flex items-center space-x-1.5">
                        <Users size={12} className="text-brand-orange" />
                        <span>Résztvevők ({goingCount})</span>
                      </span>
                      <div className="font-mono text-[9px] font-bold space-x-3">
                        <span className="text-green-400">MEGY: {goingCount}</span>
                        <span className="text-yellow-500">TALÁN: {maybeCount}</span>
                        {ev.maxParticipants && (
                          <span className={`${isFull ? 'text-red-400' : 'text-neutral-400'}`}>
                            {isFull ? 'TELT' : `${ev.maxParticipants - goingCount} szabad`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ev.rsvps || {}).map(([userId, status]) => {
                        const rider = users.find(u => u.id === userId);
                        if (!rider || status === 'not_going') return null;
                        
                        const strokeColor = status === 'going' ? 'border-green-500' : 'border-yellow-500';

                        return (
                          <div key={userId} className="relative group/avatar">
                            <img
                              src={rider.avatarUrl}
                              alt={rider.name}
                              className={`w-7 h-7 rounded-full object-cover border-2 ${strokeColor} shadow-md`}
                              title={rider.name}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RSVP Buttons */}
                  <div className="pt-2 border-t border-border-subtle/50 flex gap-2 text-[10px] font-black uppercase tracking-widest select-none">
                    <button
                      onClick={() => handleRsvp(ev.id, 'going')}
                      disabled={isFull && myRsvp !== 'going'}
                      className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center space-x-2 border transition-all active:scale-95 ${
                        myRsvp === 'going'
                          ? 'bg-green-500/10 text-green-400 border-green-500/40 shadow-inner'
                          : isFull
                          ? 'bg-black/50 text-neutral-700 border-border-subtle cursor-not-allowed'
                          : 'bg-black text-neutral-500 border-border-subtle hover:text-neutral-300'
                      }`}
                    >
                      <Check size={14} />
                      <span>{isFull && myRsvp !== 'going' ? 'Tele' : 'Megyek'}</span>
                    </button>

                    <button
                      onClick={() => handleRsvp(ev.id, 'maybe')}
                      className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center space-x-2 border transition-all active:scale-95 ${
                        myRsvp === 'maybe'
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/40 shadow-inner'
                          : 'bg-black text-neutral-500 border-border-subtle hover:text-neutral-300'
                      }`}
                    >
                      <HelpCircle size={14} />
                      <span>Talán</span>
                    </button>

                    <button
                      onClick={() => handleRsvp(ev.id, 'not_going')}
                      className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center space-x-2 border transition-all active:scale-95 ${
                        myRsvp === 'not_going'
                          ? 'bg-red-500/10 text-red-400 border-red-500/40 shadow-inner'
                          : 'bg-black text-neutral-500 border-border-subtle hover:text-neutral-300'
                      }`}
                    >
                      <X size={14} />
                      <span>Nem</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
        </div>
      </PullToRefresh>

      {/* New Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" id="event-create-modal">
          <div className="bg-bg-panel border border-border-subtle rounded-[40px] p-6 max-w-sm w-full space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="text-brand-orange" size={20} />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Új Esemény Kiírása</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Tekerés megnevezése</label>
                  <input
                    type="text"
                    placeholder="pl. Dobogókő Csúcstámadás ⛰️"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); localStorage.setItem('draft_event_title', e.target.value); }}
                    className="w-full bg-black border border-border-subtle rounded-2xl px-4 py-3 text-neutral-200 placeholder-neutral-700 outline-none focus:border-brand-orange transition-all"
                    required
                  />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Részletek (opcionális)</label>
                  <textarea
                    placeholder="Útvonal, tempó, pihenők..."
                    rows={2}
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); localStorage.setItem('draft_event_desc', e.target.value); }}
                    className="w-full bg-black border border-border-subtle rounded-2xl p-4 text-neutral-200 placeholder-neutral-700 outline-none focus:border-brand-orange transition-all"
                  />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Időpont</label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => { setDateTime(e.target.value); localStorage.setItem('draft_event_date', e.target.value); }}
                    className="w-full bg-black border border-border-subtle rounded-2xl px-3 py-3 text-neutral-200 outline-none focus:border-brand-orange transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Helyszín</label>
                  <input
                    type="text"
                    placeholder="pl. Margitsziget"
                    value={locationName}
                    onChange={(e) => { setLocationName(e.target.value); localStorage.setItem('draft_event_location', e.target.value); }}
                    className="w-full bg-black border border-border-subtle rounded-2xl px-3 py-3 text-neutral-200 placeholder-neutral-700 outline-none focus:border-brand-orange transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Típus</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-black border border-border-subtle rounded-2xl px-2 py-3 text-neutral-200 outline-none focus:border-brand-orange transition-all"
                  >
                    <option value="Ride">🚴‍♂️ Tekerés</option>
                    <option value="Race">🏆 Verseny</option>
                    <option value="Meetup">🍕 Találkozó</option>
                    <option value="Social">🎉 Társasági</option>
                    <option value="Maintenance">🔧 Karbantartás</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Nehézség</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-black border border-border-subtle rounded-2xl px-2 py-3 text-neutral-200 outline-none focus:border-brand-orange transition-all"
                  >
                    <option value="Könnyű">Könnyű</option>
                    <option value="Közepes">Közepes</option>
                    <option value="Nehéz">Nehéz</option>
                    <option value="Extrém">Extrém</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Max. létszám (0 = korlátlan)</label>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 0)}
                  className="w-full bg-black border border-border-subtle rounded-2xl px-4 py-3 text-neutral-200 outline-none focus:border-brand-orange transition-all"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white/5 border border-border-subtle text-neutral-500 font-black p-3.5 rounded-2xl transition-all hover:bg-white/10 hover:text-neutral-300"
                >
                  MÉGSE
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-orange text-black font-black p-3.5 rounded-2xl transition-all hover:brightness-110 shadow-lg shadow-brand-orange/20"
                >
                  KÖZZÉTÉTEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmEventId !== null}
        title="Esemény törlése"
        message="Biztosan törlöd ezt a tekerési eseményt a naptárból?"
        onConfirm={() => {
          if (deleteConfirmEventId) {
            const updated = events.filter(e => e.id !== deleteConfirmEventId);
            onUpdateEvents(updated);
            setDeleteConfirmEventId(null);
            toast('Esemény törölve!');
          }
        }}
        onCancel={() => setDeleteConfirmEventId(null)}
      />

    </div>
  );
};
