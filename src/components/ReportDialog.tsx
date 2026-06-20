import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from './Toast';

const reasons = [
  'Nem megfelelő tartalom',
  'Zaklatás',
  'Spam',
  'Gyűlöletbeszéd',
  'Egyéb',
];

interface Props {
  targetType: 'post' | 'chat' | 'user';
  targetId: string;
  reporterId: string;
  onClose: () => void;
}

export const ReportDialog: React.FC<Props> = ({ targetType, targetId, reporterId, onClose }) => {
  const { toast } = useToast();
  const [reason, setReason] = useState(reasons[0]);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await addDoc(collection(db, 'reports'), {
        targetType,
        targetId,
        reportedBy: reporterId,
        reason,
        description,
        createdAt: new Date().toISOString(),
        status: 'pending',
      });
      toast('Jelentés elküldve! Az adminok megvizsgálják.');
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
            <Flag size={20} className="text-red-500" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Tartalom jelentése</h3>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Indok</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-black border border-border-subtle rounded-2xl px-4 py-3 text-xs text-neutral-200 outline-none focus:border-brand-orange">
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Részletek (opcionális)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Írd le pontosan mi a probléma..." className="w-full bg-black border border-border-subtle rounded-2xl p-4 text-xs text-neutral-200 placeholder-neutral-700 outline-none focus:border-brand-orange" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-border-subtle text-neutral-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">Mégse</button>
            <button type="submit" disabled={sending} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50">
              {sending ? 'Küldés...' : 'Jelentés'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
