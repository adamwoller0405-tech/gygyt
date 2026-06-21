import React, { useState } from 'react';
import { Bike, MessageSquare, Calendar, User, Award, ChevronRight, X } from 'lucide-react';

const slides = [
  {
    icon: Bike,
    title: 'Üdv a GYGYT Rideout-ban!',
    desc: 'Ez a Gyogyós Gyerekek Társaságának privát kerékpáros közössége. Tekerj, csevegj, és oszd meg a kalandjaidat!',
  },
  {
    icon: MessageSquare,
    title: 'Hírfolyam & Chat',
    desc: 'Ossz meg képeket a Hírfolyamban, vagy csevegj a többiekkel a Chatben. Külön csatornák a különböző rangoknak. Használj @mentions mások megjelölésére!',
  },
  {
    icon: Calendar,
    title: 'Események & Rangok',
    desc: 'Csatlakozz közös tekerésekhez, szerezz rangokat és kitüntetéseket, és építsd a történeted!',
  },
  {
    icon: User,
    title: 'Profil & Kitüntetések',
    desc: 'Szerkeszd a profilod, adj hozzá egyedi címkét, és gyűjts badge-eket a teljesítményeidért. QR kóddal is megoszthatod a profilod!',
  },
  {
    icon: Award,
    title: 'Tippek & Trükkök',
    desc: 'Húzd le a frissítéshez a hírfolyamban. Csúsztasd balra az üzeneteket a gyors törléshez. @említés működik chatben. Kapcsold ki az értesítéseket a Menüben.',
  },
];

interface Props {
  onDone: () => void;
}

export const OnboardingOverlay: React.FC<Props> = ({ onDone }) => {
  const [slide, setSlide] = useState(0);
  const S = slides[slide];

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="max-w-sm w-full space-y-8 text-center relative">
        <button onClick={onDone} className="absolute -top-4 right-0 text-neutral-600 hover:text-white p-2 transition-colors">
          <X size={20} />
        </button>

        <div className="w-28 h-28 bg-brand-orange/10 rounded-[40px] flex items-center justify-center mx-auto border border-brand-orange/20 shadow-2xl">
          <S.icon size={56} className="text-brand-orange" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">{S.title}</h2>
          <p className="text-xs text-neutral-400 font-bold leading-relaxed max-w-xs mx-auto">{S.desc}</p>
        </div>

        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-8 bg-brand-orange' : 'w-1.5 bg-neutral-700'}`} />
          ))}
        </div>

        <button
          onClick={() => slide < slides.length - 1 ? setSlide(slide + 1) : onDone()}
          className="bg-brand-orange text-black font-black px-10 py-4 rounded-2xl text-xs uppercase tracking-widest flex items-center gap-2 mx-auto transition-all active:scale-95"
        >
          <span>{slide < slides.length - 1 ? 'Tovább' : 'Kezdjük!'}</span>
          <ChevronRight size={16} />
        </button>

        {slide < slides.length - 1 && (
          <button onClick={onDone} className="text-[9px] text-neutral-600 font-black uppercase tracking-widest hover:text-neutral-400 transition-colors block mx-auto">
            Kihagyás
          </button>
        )}
      </div>
    </div>
  );
};
