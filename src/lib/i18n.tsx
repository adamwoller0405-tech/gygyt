import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'hu' | 'en';

const STORAGE_KEY = 'gygyt_lang';

const translations: Record<Lang, Record<string, string>> = {
  hu: {
    'nav.feed': 'Hírfolyam',
    'nav.chat': 'Chat',
    'nav.events': 'Események',
    'nav.calendar': 'Naptár',
    'nav.contact': 'Kapcsolat',
    'nav.leaderboard': 'Ranglista',
    'nav.profile': 'Profil',
    'nav.moderation': 'Vezérlőpult',
    'nav.gallery': 'Galéria',
    'nav.settings': 'Beállítások',
    'nav.logout': 'Kijelentkezés',
    'nav.theme': 'Téma váltás',
    'nav.search': 'Keresés',
    'nav.notifications': 'Értesítések',
    'nav.bug_report': 'Hibajelentés',
    'nav.menu': 'Menü',
    'nav.new': 'új',
    'common.search': 'Keresés...',
    'common.save': 'Mentés',
    'common.cancel': 'Mégse',
    'common.delete': 'Törlés',
    'common.share': 'Megosztás',
    'common.report': 'Jelentés',
    'common.loading': 'Betöltés...',
    'common.no_content': 'Még nincs tartalom',
    'common.close': 'Bezárás',
    'lang.hu': 'Magyar',
    'lang.en': 'English',
    'feed.new_post': 'Új bejegyzés',
    'events.create': 'Esemény létrehozása',
    'chat.placeholder': 'Írj valamit...',
    'profile.edit': 'Profil szerkesztése',
    'notif.like': 'kedvelte a bejegyzésed',
    'notif.comment': 'hozzászólt a bejegyzésedhez',
    'notif.event_rsvp': 'válaszolt az eseményedre',
    'language': 'Nyelv',
    'theme.dark': 'Sötét téma',
    'theme.light': 'Világos téma',
    'theme.dark_icon': '🌙',
    'theme.light_icon': '☀️',
    'notif.settings': 'Értesítési beállítások',
    'admin.panel': 'Vezérlőpult',
    'admin.badge': 'Admin',
  },
  en: {
    'nav.feed': 'Feed',
    'nav.chat': 'Chat',
    'nav.events': 'Events',
    'nav.calendar': 'Calendar',
    'nav.contact': 'Contact',
    'nav.leaderboard': 'Leaderboard',
    'nav.profile': 'Profile',
    'nav.moderation': 'Dashboard',
    'nav.gallery': 'Gallery',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.theme': 'Toggle theme',
    'nav.search': 'Search',
    'nav.notifications': 'Notifications',
    'nav.bug_report': 'Bug report',
    'nav.menu': 'Menu',
    'nav.new': 'new',
    'common.search': 'Search...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.share': 'Share',
    'common.report': 'Report',
    'common.loading': 'Loading...',
    'common.no_content': 'No content yet',
    'common.close': 'Close',
    'lang.hu': 'Magyar',
    'lang.en': 'English',
    'feed.new_post': 'New post',
    'events.create': 'Create event',
    'chat.placeholder': 'Type something...',
    'profile.edit': 'Edit profile',
    'notif.like': 'liked your post',
    'notif.comment': 'commented on your post',
    'notif.event_rsvp': 'responded to your event',
    'language': 'Language',
    'theme.dark': 'Dark theme',
    'theme.light': 'Light theme',
    'theme.dark_icon': '🌙',
    'theme.light_icon': '☀️',
    'notif.settings': 'Notification settings',
    'admin.panel': 'Dashboard',
    'admin.badge': 'Admin',
  },
};

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangContextType>({ lang: 'hu', setLang: () => {}, t: (k) => k });

export const useLang = () => useContext(LangContext);

export const LangProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(STORAGE_KEY) as Lang) || 'hu');

  const setLang = (l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  };

  const t = (key: string) => translations[lang][key] || key;

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
};
