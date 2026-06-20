import React, { useState, useMemo } from 'react';
import { X, Image } from 'lucide-react';
import { CyclingEvent } from '../types';

interface Props {
  events: CyclingEvent[];
  onClose: () => void;
}

export const PhotoGallery: React.FC<Props> = ({ events, onClose }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const allPhotos = useMemo(() => {
    const photos: { url: string; eventTitle: string }[] = [];
    events.forEach(e => {
      if (e.photos) {
        e.photos.forEach(url => photos.push({ url, eventTitle: e.title }));
      }
    });
    return photos;
  }, [events]);

  return (
    <div className="fixed inset-0 z-50 bg-black animate-fade-in">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Image size={18} className="text-brand-orange" />
          <span>Galéria ({allPhotos.length})</span>
        </h2>
        <button onClick={onClose} className="text-neutral-500 hover:text-white"><X size={20} /></button>
      </div>

      <div className="h-full overflow-y-auto pt-16 pb-8 px-3">
        {allPhotos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-neutral-600 font-bold">Nincsenek feltöltött képek</p>
          </div>
        ) : (
          <div className="columns-2 gap-2 space-y-2">
            {allPhotos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setSelectedPhoto(photo.url)}
                className="break-inside-avoid rounded-2xl overflow-hidden border border-border-subtle hover:border-brand-orange/50 transition-all active:scale-[0.98]"
              >
                <img src={photo.url} alt="" className="w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedPhoto(null)}>
          <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 text-white/60 hover:text-white z-10"><X size={24} /></button>
          <img src={selectedPhoto} className="max-w-full max-h-full object-contain rounded-2xl" alt="" />
        </div>
      )}
    </div>
  );
};
