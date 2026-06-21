import React, { useState } from 'react';
import { Bike, ArrowRight } from 'lucide-react';
import { signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useToast } from './Toast';

interface AuthSectionProps {
  onLogin: (username: string, password: string) => void;
  onRegister: (data: { email: string, password: string, name: string, age: number, school: string, intro: string }) => void;
}

export const AuthSection: React.FC<AuthSectionProps> = ({ onLogin, onRegister }) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [regIntro, setRegIntro] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      toast(`Google Login hiba: ${err.message}`, 'error');
    }
  };

  const handlePasswordReset = async () => {
    const email = username.includes('@') ? username : `${username.toLowerCase()}@gygyt.app`;
    if (!email) { toast('Írd be az e-mail címed a jelszó mezőbe!', 'warning'); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      toast('Jelszó-visszaállítási link elküldve! Nézd meg az e-mail fiókodat.');
    } catch (err: any) {
      toast(`Hiba: ${err.message}`, 'error');
    }
  };

  return (
    <div className="flex-1 min-h-dynamic bg-bg-deep flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-brand-orange/10 rounded-[32px] flex items-center justify-center mx-auto text-brand-orange border border-brand-orange/20 shadow-2xl animate-bounce">
            <Bike size={40} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">GYGYT <span className="text-brand-orange">Rideout</span> <span className="text-[8px] text-yellow-500">BÉTA</span></h2>
        </div>

        <div className="flex bg-black p-1 rounded-2xl border border-border-subtle">
          <button onClick={() => setMode('login')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${mode === 'login' ? 'bg-brand-orange text-black' : 'text-neutral-500'}`}>Belépés</button>
          <button onClick={() => setMode('register')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${mode === 'register' ? 'bg-brand-orange text-black' : 'text-neutral-500'}`}>Regisztráció</button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }} className="space-y-4 animate-fade-in">
            <input type="text" placeholder="E-mail vagy Felhasználónév" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border border-border-subtle rounded-2xl px-5 py-4 text-xs text-white" required />
            <input type="password" placeholder="Jelszó" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-border-subtle rounded-2xl px-5 py-4 text-xs text-white" required />
            <button type="submit" className="w-full bg-brand-orange text-black font-black p-4 rounded-2xl flex items-center justify-center space-x-2"><span>Bejelentkezés</span><ArrowRight size={16} /></button>
            <button type="button" onClick={handleGoogleSignIn} className="w-full bg-white text-black font-black p-4 rounded-2xl flex items-center justify-center space-x-3">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
              <span>Belépés Google-el</span>
            </button>
            <button type="button" onClick={handlePasswordReset} className="w-full text-[10px] font-black text-neutral-600 hover:text-brand-orange transition-colors uppercase tracking-widest py-2">Elfelejtett jelszó?</button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onRegister({ email: regEmail, password: regPassword, name: regName, age: Number(regAge), school: regSchool, intro: regIntro }); }} className="space-y-4 animate-fade-in">
            <input type="email" placeholder="E-mail cím" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-black border border-border-subtle rounded-2xl px-5 py-3 text-xs text-white" required />
            <input type="password" placeholder="Jelszó" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full bg-black border border-border-subtle rounded-2xl px-5 py-3 text-xs text-white" required />
            <input type="text" placeholder="Teljes Név" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full bg-black border border-border-subtle rounded-2xl px-5 py-3 text-xs text-white" required />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Kor" value={regAge} onChange={(e) => setRegAge(e.target.value)} className="w-full bg-black border border-border-subtle rounded-2xl px-5 py-3 text-xs text-white" required />
              <input type="text" placeholder="Iskola" value={regSchool} onChange={(e) => setRegSchool(e.target.value)} className="w-full bg-black border border-border-subtle rounded-2xl px-5 py-3 text-xs text-white" required />
            </div>
            <textarea placeholder="Bemutatkozás" rows={3} value={regIntro} onChange={(e) => setRegIntro(e.target.value)} className="w-full bg-black border border-border-subtle rounded-2xl p-5 text-xs text-white" required />
            <button type="submit" className="w-full bg-brand-orange text-black font-black p-4 rounded-2xl">Jelentkezés beküldése</button>
          </form>
        )}
      </div>
    </div>
  );
};
