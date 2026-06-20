import React, { useState } from 'react';
import { Bike, MessageSquare, Calendar, User, ChevronRight } from 'lucide-react';

const slides = [
  {
    icon: Bike,
    title: 'Üdv a GYGYT-ben!',
    desc: 'Ez a Gyogyós Gyerekek Társaságának privát kerékpáros közössége. Tekerj, csevegj, és oszd meg a kalandjaidat!',
  },
  {
    icon: MessageSquare,
    title: 'Hírfolyam & Chat',
    desc: 'Ossz meg képeket a Hírfolyamban, vagy csevegj a többiekkel a Chatben. Külön csatornák a különböző rangoknak.',
  },
  {
    icon: Calendar,
    title: 'Események & Rangok',
    desc: 'Csatlakozz közös tekerésekhez, gyűjts kilométereket, és szerezz rangokat és kitüntetéseket!',
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
      <div className="max-w-sm w-full space-y-10 text-center">
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
      </div>
    </div>
  );
};
