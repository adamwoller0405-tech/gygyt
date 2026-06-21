import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Story } from '../types';

interface StoriesBarProps {
  stories: Story[];
  currentUserId: string;
  isEditor: boolean;
  onAddStory: () => void;
  onUpdateStories: (stories: Story[]) => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ stories, currentUserId, isEditor, onAddStory, onUpdateStories }) => {
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const activeStories = stories.filter(s => Date.now() - new Date(s.timestamp).getTime() < 86400000);

  useEffect(() => {
    if (viewingIndex === null) { setProgress(0); return; }
    const duration = 5000;
    const interval = 50;
    const step = interval / duration;
    const timer = setInterval(() => {
      setProgress(p => {
        const next = p + step;
        if (next >= 1) {
          goNext();
          return 0;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [viewingIndex]);

  const goNext = useCallback(() => {
    setViewingIndex(prev => {
      if (prev === null || prev >= activeStories.length - 1) return null;
      const next = prev + 1;
      markViewed(next);
      return next;
    });
  }, [activeStories.length]);

  const markViewed = (idx: number) => {
    const story = activeStories[idx];
    if (!story || story.viewedBy.includes(currentUserId)) return;
    onUpdateStories(stories.map(s => s.id === story.id ? { ...s, viewedBy: [...s.viewedBy, currentUserId] } : s));
  };

  const handleClick = (idx: number) => {
    setViewingIndex(idx);
    markViewed(idx);
    setProgress(0);
  };

  return (
    <>
      <div className="flex space-x-3 overflow-x-auto scrollbar-none px-4 py-3">
        {isEditor && (
          <button onClick={onAddStory} className="flex-shrink-0 w-16 h-16 rounded-2xl bg-black border border-border-subtle flex flex-col items-center justify-center space-y-0.5 text-neutral-500 hover:text-brand-orange hover:border-brand-orange/30 transition-all active:scale-90">
            <Plus size={18} />
            <span className="text-[6px] font-black uppercase tracking-wider">Story</span>
          </button>
        )}
        {activeStories.map((story, i) => (
          <button key={story.id} onClick={() => handleClick(i)}
            className="flex-shrink-0 flex flex-col items-center space-y-1.5 group active:scale-90 transition-all">
            <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 p-0.5 ${story.viewedBy.includes(currentUserId) ? 'border-neutral-700' : 'border-brand-orange'}`}>
              <img src={story.mediaUrl} className="w-full h-full rounded-xl object-cover" alt="" />
            </div>
            <span className="text-[7px] font-black text-neutral-500 truncate max-w-[64px]">{story.userName.split(' ')[1]}</span>
          </button>
        ))}
      </div>

      {viewingIndex !== null && activeStories[viewingIndex] && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center" onClick={() => setViewingIndex(null)}>
          <div className="absolute top-4 left-4 right-4 flex space-x-1">
            {activeStories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full bg-white transition-all ${i === viewingIndex ? '' : i < viewingIndex! ? 'w-full' : 'w-0'}`}
                  style={i === viewingIndex ? { width: `${progress * 100}%` } : {}} />
              </div>
            ))}
          </div>
          <div className="absolute top-8 left-4 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
            <img src={activeStories[viewingIndex].userAvatar} className="w-8 h-8 rounded-full object-cover border border-white/20" alt="" />
            <span className="text-xs font-black text-white">{activeStories[viewingIndex].userName}</span>
          </div>
          <img src={activeStories[viewingIndex].mediaUrl} className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl" alt="" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-all">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </>
  );
};
