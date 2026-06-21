import React, { useState } from 'react';
import { Bug, X, Loader2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './Toast';

interface Props {
  reporterId: string;
  onClose: () => void;
}

export const BugReportDialog: React.FC<Props> = ({ reporterId, onClose }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'bugReports'), {
        title: title.trim(),
        description: description.trim(),
        reportedBy: reporterId,
        createdAt: new Date().toISOString(),
        status: 'open',
      });
      toast('Hibajelentés elküldve! Köszönjük a segítséged.');
      onClose();
    } catch (err: any) {
      toast(`Hiba: ${err.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-5 backdrop-blur-sm animate-fade-in">
      <div className="bg-bg-panel border border-border-subtle rounded-[32px] p-6 max-w-sm w-full space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bug size={20} className="text-yellow-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Hibajelentés</h3>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Cím</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Rövid leírás a hibáról..."
              className="w-full bg-black border border-border-subtle rounded-2xl px-4 py-3 text-xs text-neutral-200 placeholder-neutral-700 outline-none focus:border-brand-orange"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Részletek</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Írd le pontosan mi történt, mit csináltál, és mi a várt viselkedés..."
              className="w-full bg-black border border-border-subtle rounded-2xl p-4 text-xs text-neutral-200 placeholder-neutral-700 outline-none focus:border-brand-orange"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-border-subtle text-neutral-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">Mégse</button>
            <button type="submit" disabled={sending || !title.trim() || !description.trim()} className="flex-1 py-3 rounded-2xl bg-yellow-500 text-black font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2">
              {sending ? <><Loader2 size={14} className="animate-spin" /><span>Küldés...</span></> : <span>Küldés</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};