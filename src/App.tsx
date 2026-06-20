/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  MessageSquare,
  Calendar,
  User as UserIcon,
  ShieldAlert,
  Compass,
  Bike,
  LogOut,
  Clock,
  Loader2,
  Image,
  Flag,
  ShieldX
} from 'lucide-react';

import {
  onSnapshot,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, type User } from 'firebase/auth';
import { auth, db } from './lib/firebase';

import { AuthSection } from './components/AuthSection';
import { OfflineBanner } from './components/OfflineBanner';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { ReportDialog } from './components/ReportDialog';

const FeedSection = lazy(() => import('./components/FeedSection').then(m => ({ default: m.FeedSection })));
const ChatSection = lazy(() => import('./components/ChatSection').then(m => ({ default: m.ChatSection })));
const EventsSection = lazy(() => import('./components/EventsSection').then(m => ({ default: m.EventsSection })));
const ProfileSection = lazy(() => import('./components/ProfileSection').then(m => ({ default: m.ProfileSection })));
const ModerationSection = lazy(() => import('./components/ModerationSection').then(m => ({ default: m.ModerationSection })));
const PhotoGallery = lazy(() => import('./components/PhotoGallery').then(m => ({ default: m.PhotoGallery })));
const CalendarSection = lazy(() => import('./components/CalendarSection').then(m => ({ default: m.CalendarSection })));

import { UserProfile, UserRank, ChatMessage, CyclingEvent, FeedPost, JoinRequest, Announcement, Report } from './types';
import { DEFAULT_AVATAR } from './lib/defaults';
import { APP_VERSION } from './lib/version';
import { ToastProvider, useToast } from './components/Toast';

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<CyclingEvent[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'feed' | 'chat' | 'events' | 'calendar' | 'members' | 'profile' | 'moderation' | 'gallery'>('feed');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'chat' | 'user'; id: string } | null>(null);

  useEffect(() => {
    enableMultiTabIndexedDbPersistence(db).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('gygyt_onboarding_done')) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        const snap = await getDoc(userDoc);
        if (!snap.exists() && user.email === 'admin@gygyt.app') {
          await setDoc(userDoc, {
            id: user.uid,
            name: user.displayName || 'Admin',
            email: user.email,
            avatarUrl: user.photoURL || DEFAULT_AVATAR,
            rank: UserRank.ADMIN,
            age: 0,
            school: 'GYGYT HQ',
            joinedDate: new Date().toISOString().split('T')[0],
            achievements: [],
            stats: { totalKm: 0, eventsJoined: 0, elevationGainedM: 0 }
          });
        }
      } else {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => doc.data() as UserProfile));
      setLoading(false);
    });

    const unsubChats = onSnapshot(query(collection(db, 'chats'), orderBy('timestamp', 'asc')), (snap) => {
      setChats(snap.docs.map(doc => doc.data() as ChatMessage));
    });

    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('createdAt', 'desc')), (snap) => {
      setPosts(snap.docs.map(doc => doc.data() as FeedPost));
    });

    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      setEvents(snap.docs.map(doc => doc.data() as CyclingEvent));
    });

    const unsubReqs = onSnapshot(collection(db, 'joinRequests'), (snap) => {
      setJoinRequests(snap.docs.map(doc => doc.data() as JoinRequest));
    });

    return () => {
      unsubUsers(); unsubChats(); unsubPosts(); unsubEvents(); unsubReqs();
    };
  }, [firebaseUser]);

  const handleReport = (type: 'post' | 'chat' | 'user', id: string) => {
    setReportTarget({ type, id });
  };

  const handleLogin = async (username: string, pass: string) => {
    try {
      const email = username.toLowerCase() === 'admin' ? 'admin@gygyt.app' :
                   (username.includes('@') ? username : `${username.toLowerCase()}@gygyt.app`);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      toast(`Belépési hiba: ${err.message}`, 'error');
    }
  };

  const handleRegister = async (data: { email: string, password: string, name: string, age: number, school: string, intro: string }) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const reqId = `req_${Date.now()}`;
      await setDoc(doc(db, 'joinRequests', reqId), {
        id: reqId,
        firebaseUid: cred.user.uid,
        email: data.email,
        name: data.name,
        age: data.age,
        school: data.school,
        introduction: data.intro,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      });
      toast('Jelentkezés beküldve! Várj az admin jóváhagyására.');
    } catch (err: any) { toast(err.message, 'error'); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentTab('feed');
  };

  const activeUser = users.find(u => u.id === firebaseUser?.uid || u.email === firebaseUser?.email);

  // Fallback: if user is authenticated but not in users collection,
  // check if their join request was approved
  const isApproved = !activeUser && firebaseUser && joinRequests.some(r =>
    r.firebaseUid === firebaseUser.uid && r.status === 'approved'
  );

  const isMod = activeUser && (activeUser.rank === UserRank.ADMIN || activeUser.rank === UserRank.ELITE);

  if (loading) return <div className="flex items-center justify-center h-dynamic bg-bg-deep"><Bike size={48} className="text-brand-orange animate-pulse" /></div>;
  if (!firebaseUser) return <AuthSection onLogin={handleLogin} onRegister={handleRegister} />;

  if (activeUser?.isBanned) {
    return (
      <div className="flex-1 min-h-dynamic bg-bg-deep flex flex-col items-center justify-center p-8 text-center animate-fade-in space-y-8">
        <div className="relative">
          <ShieldX size={64} className="text-red-500 animate-pulse" />
          <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Kitiltva</h2>
          <p className="text-xs text-neutral-500 font-bold max-w-xs mx-auto leading-relaxed">
            Fiókodat egy <span className="text-red-500">Adminisztrátor</span> felfüggesztette. Ha úgy gondolod, ez tévedés, vedd fel a kapcsolatot az adminokkal.
          </p>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-black text-neutral-600 uppercase tracking-widest border border-white/5 px-6 py-3 rounded-2xl hover:text-white transition-all flex items-center space-x-2">
          <LogOut size={14} />
          <span>Kijelentkezés</span>
        </button>
      </div>
    );
  }

  if (!activeUser) {
    if (isApproved) {
      return (
        <div className="flex-1 min-h-dynamic bg-bg-deep flex flex-col items-center justify-center p-8 text-center animate-fade-in space-y-8">
          <div className="relative">
            <Loader2 size={64} className="text-brand-orange animate-spin" />
            <div className="absolute inset-0 bg-brand-orange/20 blur-2xl rounded-full" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Profil betöltése</h2>
            <p className="text-xs text-neutral-500 font-bold max-w-xs mx-auto leading-relaxed">
              Fiókodat jóváhagyták! A profil adatok szinkronizálása folyamatban van. Kérlek várj...
            </p>
          </div>
          <button onClick={handleLogout} className="text-[10px] font-black text-neutral-600 uppercase tracking-widest border border-white/5 px-6 py-3 rounded-2xl hover:text-white transition-all flex items-center space-x-2">
            <LogOut size={14} />
            <span>Kijelentkezés</span>
          </button>
        </div>
      );
    }
    return (
      <div className="flex-1 min-h-dynamic bg-bg-deep flex flex-col items-center justify-center p-8 text-center animate-fade-in space-y-8">
        <div className="relative">
          <Clock size={64} className="text-brand-orange animate-spin-slow" />
          <div className="absolute inset-0 bg-brand-orange/20 blur-2xl rounded-full" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Jóváhagyásra vár</h2>
          <p className="text-xs text-neutral-500 font-bold max-w-xs mx-auto leading-relaxed">
            Sikeresen jelentkeztél! Fiókodat egy <span className="text-brand-orange">Adminisztrátor</span> fogja aktiválni hamarosan.
          </p>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-black text-neutral-600 uppercase tracking-widest border border-white/5 px-6 py-3 rounded-2xl hover:text-white transition-all flex items-center space-x-2">
          <LogOut size={14} />
          <span>Vissza a belépéshez</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dynamic w-full bg-bg-deep text-neutral-100 overflow-hidden font-sans">
      <OfflineBanner />
      <AnnouncementBanner />
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 min-h-0 relative">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 size={32} className="text-brand-orange animate-spin" /></div>}>
            {currentTab === 'feed' && <FeedSection posts={posts} currentUser={activeUser} onUpdatePosts={async (up) => {
              const deletedIds = posts.filter(op => !up.find(p => p.id === op.id)).map(p => p.id);
              for (const id of deletedIds) await deleteDoc(doc(db, 'posts', id));
              for (const p of up) {
                const old = posts.find(op => op.id === p.id);
                if (!old || JSON.stringify(old) !== JSON.stringify(p)) await setDoc(doc(db, 'posts', p.id), p);
              }
            }} users={users} onReport={(id) => handleReport('post', id)} />}

            {currentTab === 'chat' && <ChatSection chats={chats} currentUser={activeUser} users={users} onUpdateChats={async (uc) => {
              const deletedIds = chats.filter(oc => !uc.find(c => c.id === oc.id)).map(c => c.id);
              for (const id of deletedIds) await deleteDoc(doc(db, 'chats', id));
              for (const c of uc) {
                const old = chats.find(oc => oc.id === c.id);
                if (!old || JSON.stringify(old) !== JSON.stringify(c)) await setDoc(doc(db, 'chats', c.id), c);
              }
            }} onReport={(id) => handleReport('chat', id)} />}

            {currentTab === 'events' && <EventsSection events={events} currentUser={activeUser} users={users} onUpdateEvents={async (ue) => {
              const deletedIds = events.filter(oe => !ue.find(e => e.id === oe.id)).map(e => e.id);
              for (const id of deletedIds) await deleteDoc(doc(db, 'events', id));
              for (const e of ue) {
                const old = events.find(oe => oe.id === e.id);
                if (!old || JSON.stringify(old) !== JSON.stringify(e)) await setDoc(doc(db, 'events', e.id), e);
              }
            }} onUserStatsUpdate={async (uid, stats) => {
              await updateDoc(doc(db, 'users', uid), {
                stats: { totalKm: stats.km, elevationGainedM: stats.elevation, eventsJoined: stats.events }
              });
            }} />}

            {currentTab === 'calendar' && <CalendarSection events={events} />}

            {currentTab === 'members' && <ProfileSection users={users} currentUser={activeUser} onUpdateCurrentUser={async (u) => await setDoc(doc(db, 'users', u.id), u)} mode="members" />}

            {currentTab === 'profile' && <ProfileSection users={users} currentUser={activeUser} onUpdateCurrentUser={async (u) => await setDoc(doc(db, 'users', u.id), u)} onLogout={handleLogout} mode="personal" />}

            {currentTab === 'gallery' && <PhotoGallery events={events} onClose={() => setCurrentTab('events')} />}

            {currentTab === 'moderation' && <ModerationSection joinRequests={joinRequests} users={users} currentUser={activeUser} onUpdateJoinRequests={async (reqs) => {
              for (const r of reqs) {
                const old = joinRequests.find(or => or.id === r.id);
                if (!old || old.status !== r.status) await setDoc(doc(db, 'joinRequests', r.id), r);
              }
            }} onUpdateUsers={async (uList) => {
              for (const u of uList) {
                const old = users.find(ou => ou.id === u.id);
                if (!old) {
                  await setDoc(doc(db, 'users', u.id), u);
                } else if (JSON.stringify(old) !== JSON.stringify(u)) {
                  await setDoc(doc(db, 'users', u.id), u);
                }
              }
            }} onDeleteUser={async (userId) => {
              await deleteDoc(doc(db, 'users', userId));
            }} />}
          </Suspense>
        </div>

        <nav className="h-20 nav-safe-area bg-bg-panel border-t border-border-subtle flex items-center justify-around px-4 pb-4 relative z-30 shadow-2xl">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 text-[7px] text-neutral-600 font-black tracking-widest uppercase">
            {'GYGYT Live v' + APP_VERSION}
          </div>

          {[
            { id: 'feed', icon: Compass, label: 'Hírfolyam' },
            { id: 'chat', icon: MessageSquare, label: 'Chat' },
            { id: 'events', icon: Calendar, label: 'Tekerések' },
            { id: 'members', icon: UserIcon, label: 'Tagok' },
            { id: 'calendar', icon: Clock, label: 'Naptár' },
          ].map(t => (
            <button key={t.id} onClick={() => setCurrentTab(t.id as any)} className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 ${currentTab === t.id ? 'text-brand-orange scale-110' : 'text-neutral-600'}`}>
              <t.icon size={22} className="mb-1" />
              <span className="text-[8px] font-black uppercase tracking-tighter">{t.label}</span>
            </button>
          ))}

          <button onClick={() => setCurrentTab('profile')} className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-300 ${currentTab === 'profile' ? 'text-brand-orange scale-110' : 'text-neutral-600'}`}>
            <div className={`relative mb-1 p-0.5 rounded-full border-2 ${currentTab === 'profile' ? 'border-brand-orange' : 'border-transparent'}`}>
              <img src={activeUser.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter">Profil</span>
          </button>

          {isMod && (
            <button onClick={() => setCurrentTab('moderation')} className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${currentTab === 'moderation' ? 'text-brand-orange scale-110' : 'text-neutral-600'}`}>
              {joinRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute top-1 right-5 bg-red-600 font-black text-[7px] rounded-full text-white h-3.5 w-3.5 flex items-center justify-center border border-black shadow-lg animate-pulse">{joinRequests.filter(r => r.status === 'pending').length}</span>
              )}
              <ShieldAlert size={22} className="mb-1" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Vezérlő</span>
            </button>
          )}
        </nav>
      </div>

      {showOnboarding && <OnboardingOverlay onDone={() => { setShowOnboarding(false); localStorage.setItem('gygyt_onboarding_done', '1'); }} />}

      {reportTarget && <ReportDialog targetType={reportTarget.type} targetId={reportTarget.id} reporterId={activeUser?.id || ''} onClose={() => setReportTarget(null)} />}
    </div>
  );
}
