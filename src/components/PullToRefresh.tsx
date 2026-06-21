import React, { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const PullToRefresh: React.FC<Props> = ({ onRefresh, children, containerRef: externalRef }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = externalRef || internalRef;

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      setPullDistance(Math.min(dy * 0.5, 120));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) return;
    pulling.current = false;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } catch {}
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, refreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overscroll-contain"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={{ height: pullDistance, transition: pulling.current ? 'none' : 'height 0.3s ease' }} className="flex items-center justify-center overflow-hidden">
        {pullDistance > 0 && (
          <div className={`flex items-center space-x-2 transition-opacity ${pullDistance >= THRESHOLD ? 'opacity-100' : 'opacity-50'}`}>
            {refreshing ? (
              <Loader2 size={16} className="animate-spin text-brand-orange" />
            ) : (
              <div className={`w-1 h-8 rounded-full bg-brand-orange transition-all ${pullDistance >= THRESHOLD ? 'rotate-0' : 'rotate-180'}`} />
            )}
            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
              {refreshing ? 'Frissítés...' : pullDistance >= THRESHOLD ? 'Engedd el a frissítéshez' : 'Húzd le a frissítéshez'}
            </span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
