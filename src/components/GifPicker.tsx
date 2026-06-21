import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, RefreshCw } from 'lucide-react';

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
}

const GIPHY_KEYS = ['dc6zaTOxFJmzC', 'l6VJc7C5R3FwUt9iCfmcmqXzQ7KZ3Zmo'];

export const GifPicker: React.FC<Props> = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const keyIndexRef = useRef(0);

  const search = async (q: string, retries = 1): Promise<void> => {
    setLoading(true);
    setError('');
    const key = GIPHY_KEYS[keyIndexRef.current % GIPHY_KEYS.length];
    try {
      const endpoint = q.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encodeURIComponent(q)}&limit=24&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=24&rating=g`;
      const res = await fetch(endpoint, { mode: 'cors' });
      if (res.status === 429 && retries > 0) {
        keyIndexRef.current++;
        await search(q, retries - 1);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setGifs(data.data ? data.data.map((g: any) => g.images?.fixed_height?.url).filter(Boolean) : []);
    } catch {
      if (retries > 0) { keyIndexRef.current++; await search(q, retries - 1); return; }
      setError('Nem sikerült betölteni. Próbáld újra később.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { search(''); }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-bg-panel border border-border-subtle rounded-[32px] p-5 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">GIF Választó</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1" aria-label="Bezárás"><X size={18} /></button>
        </div>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input autoFocus value={query} onChange={(e) => handleQueryChange(e.target.value)} placeholder="GIF keresése..."
            className="w-full bg-black border border-border-subtle rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-700 outline-none focus:border-brand-orange" />
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-brand-orange" /></div>
          ) : error ? (
            <div className="flex flex-col items-center py-10 space-y-3">
              <p className="text-xs text-neutral-500">{error}</p>
              <button onClick={() => { keyIndexRef.current = 0; search(query); }} className="flex items-center space-x-1.5 text-[9px] font-black text-brand-orange uppercase tracking-wider hover:underline">
                <RefreshCw size={12} /><span>Újrapróbálkozás</span>
              </button>
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex justify-center py-10">
              <p className="text-xs text-neutral-500">Nincs találat</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {gifs.map((url, i) => (
                <button key={i} onClick={() => onSelect(url)} className="aspect-square rounded-xl overflow-hidden border border-border-subtle hover:border-brand-orange transition-all active:scale-95">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
