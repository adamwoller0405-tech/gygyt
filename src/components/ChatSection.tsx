import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Hash, Send, Camera, Loader2, Flag, Trash2, Edit3, Smile, MessageSquare, ChevronLeft, Users, Search, X, RotateCcw, Filter, Ban, UserCheck } from 'lucide-react';
import { getPhoto, uploadMedia } from '../lib/capacitor-web';
import { ChatMessage, UserProfile, UserRank } from '../types';
import { useToast } from './Toast';
import { checkRateLimit } from '../lib/rateLimit';
import { ConfirmDialog } from './ConfirmDialog';
import { PullToRefresh } from './PullToRefresh';
import { GifPicker } from './GifPicker';

interface ChatSectionProps {
  chats: ChatMessage[];
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdateChats: (updatedChats: ChatMessage[]) => void;
  onReport?: (type: 'post' | 'chat' | 'user', id: string) => void;
  onBlockUser?: (userId: string, userName: string) => void;
  onToggleFollow?: (userId: string) => void;
  onUserTyping?: (channelId: string, isTyping: boolean) => void;
}

const PRESET_EMOJIS = ['🔥', '👍', '❤️', '🎯', '🚴', '🍕'];

const CHANNELS = [
  { id: 'global', name: 'Fő Csevegő', icon: '💬', desc: 'Általános duma', color: 'text-blue-400' },
  { id: 'og', name: 'OG Chat', icon: '🔥', desc: 'Elite / Bajnok', color: 'text-orange-400' },
  { id: 'mid', name: 'Mid Chat', icon: '💎', desc: 'Arany / Gyémánt', color: 'text-purple-400' },
  { id: 'rookie', name: 'Rookie Chat', icon: '🌱', desc: 'Ezüst / Bronz', color: 'text-green-400' },
];

const canAccessChannel = (rank: UserRank, channelId: string) => {
  if (rank === UserRank.ADMIN || rank === UserRank.ELITE) return true;
  if (channelId === 'global') return true;
  if (channelId === 'og') return rank === UserRank.CHAMPION;
  if (channelId === 'mid') return rank === UserRank.DIAMOND || rank === UserRank.GOLD;
  if (channelId === 'rookie') return rank === UserRank.SILVER || rank === UserRank.BRONZE;
  return false;
};

export const ChatSection: React.FC<ChatSectionProps> = ({ chats, currentUser, users, onUpdateChats, onReport, onBlockUser, onToggleFollow, onUserTyping }) => {
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState('global');
  const [messageText, setMessageText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editMsgId, setEditMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<ChatMessage | null>(null);
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'servers' | 'dms'>('servers');
  const [showNewDm, setShowNewDm] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [undoMsgId, setUndoMsgId] = useState<string | null>(null);
  const [undoTimer, setUndoTimer] = useState<number>(5);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [swipedMsgId, setSwipedMsgId] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(-1);
  const swipeTouchStart = useRef<{ x: number; y: number; msgId: string } | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, activeChannel]);

  useEffect(() => {
    if (editMsgId && editInputRef.current) editInputRef.current.focus();
  }, [editMsgId]);

  // Mark messages as read when viewing a channel
  useEffect(() => {
    const unread = chats.filter(c =>
      c.channelId === activeChannel &&
      !c.readBy?.includes(currentUser.id) &&
      c.senderId !== currentUser.id
    );
    if (unread.length === 0) return;
    const updated = chats.map(c =>
      c.channelId === activeChannel && !c.readBy?.includes(currentUser.id)
        ? { ...c, readBy: [...(c.readBy || []), currentUser.id] }
        : c
    );
    onUpdateChats(updated);
  }, [activeChannel]);

  const availableChannels = CHANNELS.filter(ch => canAccessChannel(currentUser.rank, ch.id));

  // Get all DM channel IDs that involve current user
  const userDmChannels = chats
    .filter(c => c.channelId?.startsWith('dm_'))
    .reduce<string[]>((acc, c) => {
      const chId = c.channelId!;
      if (!acc.includes(chId)) acc.push(chId);
      return acc;
    }, [] as string[]);

  const getDmPartner = (chId: string): UserProfile | null => {
    const parts = chId.replace('dm_', '').split('_');
    const partnerId = parts.find(p => p !== currentUser.id);
    return users.find(u => u.id === partnerId) || null;
  };

  const dmChannels = userDmChannels.map(chId => {
    const partner = getDmPartner(chId);
    return { id: chId, partner };
  });

  const clearUndo = useCallback(() => {
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoIntervalRef.current = null;
    undoTimeoutRef.current = null;
    setUndoMsgId(null);
    setUndoTimer(5);
  }, []);

  useEffect(() => {
    return () => clearUndo();
  }, [clearUndo]);

  const handleUndo = () => {
    if (undoMsgId) {
      onUpdateChats(chats.filter(c => c.id !== undoMsgId));
      toast('Üzenet visszavonva');
      clearUndo();
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    if (currentUser.isMuted) { toast('Néma üzemmódban vagy!', 'warning'); return; }
    if (!checkRateLimit(`chat_${currentUser.id}`, 20, 60000)) { toast('Túl sok üzenet! Várj egy kicsit.', 'warning'); return; }

    const newMessage: ChatMessage = {
      id: `message_${Date.now()}`,
      channelId: activeChannel,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRank: currentUser.rank,
      senderAvatar: currentUser.avatarUrl,
      content: messageText,
      timestamp: new Date().toISOString(),
      reactions: {},
      readBy: [currentUser.id]
    };

    if (replyMessage) {
      newMessage.repliedTo = { messageId: replyMessage.id, senderName: replyMessage.senderName, content: replyMessage.content };
      setReplyMessage(null);
    }

    onUpdateChats([...chats, newMessage]);
    setMessageText('');
    setShowEmojiPicker(false);
    onUserTyping?.(activeChannel, false);
    if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }

    clearUndo();
    setUndoMsgId(newMessage.id);
    setUndoTimer(5);
    undoIntervalRef.current = setInterval(() => {
      setUndoTimer(t => { if (t <= 1) { clearUndo(); return 0; } return t - 1; });
    }, 1000);
    undoTimeoutRef.current = setTimeout(() => clearUndo(), 5000);
  };

  const handleUploadMedia = async () => {
    try {
      const image = await getPhoto({ quality: 90, allowEditing: false });
      if (image.webPath) {
        setIsUploading(true);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const url = await uploadMedia(blob);
        const newMessage: ChatMessage = {
          id: `message_${Date.now()}`,
          channelId: activeChannel,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRank: currentUser.rank,
          senderAvatar: currentUser.avatarUrl,
          content: '',
          imageUrl: url,
          timestamp: new Date().toISOString(),
          reactions: {},
          readBy: [currentUser.id]
        };
        onUpdateChats([...chats, newMessage]);
      }
    } catch (err: any) {
      if (err.message !== 'User cancelled photos app') toast(`Feltöltési hiba: ${err.message}`, 'error');
    } finally { setIsUploading(false); }
  };

  const handleStartEdit = (msg: ChatMessage) => { setEditMsgId(msg.id); setEditText(msg.content); };
  const handleSaveEdit = (msgId: string) => {
    if (!editText.trim()) return;
    onUpdateChats(chats.map(c => c.id === msgId ? { ...c, content: editText.trim(), isEdited: true } : c));
    setEditMsgId(null); setEditText('');
  };
  const handleDeleteMsg = () => {
    if (!deleteConfirmMsg) return;
    onUpdateChats(chats.map(c => c.id === deleteConfirmMsg.id ? { ...c, content: 'Üzenet törölve', isDeleted: true, imageUrl: undefined, videoUrl: undefined } : c));
    setDeleteConfirmMsg(null);
  };
  const handleEmojiPick = (emoji: string) => setMessageText(prev => prev + emoji);

  const startDm = (targetUser: UserProfile) => {
    const ids = [currentUser.id, targetUser.id].sort();
    const dmId = `dm_${ids.join('_')}`;
    setActiveChannel(dmId);
    setShowNewDm(false);
    setSidebarOpen(false);
  };

  const currentChatMessages = useMemo(() => {
    const blocked = currentUser.blockedUsers || [];
    const channelMsgs = chats.filter(c => c.channelId === activeChannel && !blocked.includes(c.senderId));
    if (!chatSearchQuery.trim()) return channelMsgs;
    const q = chatSearchQuery.toLowerCase();
    return channelMsgs.filter(m =>
      (m.content?.toLowerCase().includes(q) || m.senderName?.toLowerCase().includes(q)) && !m.isDeleted
    );
  }, [chats, activeChannel, chatSearchQuery, currentUser.blockedUsers]);

  const handleRefresh = async () => {
    await new Promise(r => setTimeout(r, 500));
  };

  const currentChannelName = CHANNELS.find(ch => ch.id === activeChannel)?.name || (activeChannel.startsWith('dm_') ? getDmPartner(activeChannel)?.name || 'Ismeretlen' : 'Csevegés');

  const nonDmUsers = users.filter(u => u.id !== currentUser.id && u.rank !== UserRank.ADMIN && !u.isBanned);
  const filteredDmUsers = dmSearch.trim() ? nonDmUsers.filter(u => u.name.toLowerCase().includes(dmSearch.toLowerCase())) : nonDmUsers;
  const mentionUsers = mentionQuery.trim() ? users.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()) && u.id !== currentUser.id && !u.isBanned) : [];

  return (
    <div className="flex-1 flex h-full bg-bg-deep overflow-hidden min-h-0 relative">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed md:relative z-50 md:z-auto h-full w-64 bg-bg-panel border-r border-border-subtle flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-xs font-black text-white uppercase tracking-widest">GYGYT Rideout</h2>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-neutral-500 hover:text-white" aria-label="Bezárás"><X size={18} aria-hidden="true" /></button>
        </div>

        {/* Tabs: Szerverek / DM */}
        <div className="flex mx-3 mt-3 p-0.5 bg-black/40 rounded-xl border border-border-subtle">
          <button onClick={() => setActiveTab('servers')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'servers' ? 'bg-brand-orange text-black' : 'text-neutral-500'}`}>
            <Hash size={12} className="inline mr-1" />Szobák
          </button>
          <button onClick={() => setActiveTab('dms')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeTab === 'dms' ? 'bg-brand-orange text-black' : 'text-neutral-500'}`}>
            <MessageSquare size={12} className="inline mr-1" />Üzenetek
          </button>
        </div>

        {/* Server List */}
        {activeTab === 'servers' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {availableChannels.map(ch => {
              const isActive = activeChannel === ch.id;
              return (
                <button key={ch.id} onClick={() => { setActiveChannel(ch.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-2xl transition-all text-left ${isActive ? 'bg-brand-orange/10 border border-brand-orange/30' : 'hover:bg-white/5 border border-transparent'}`}>
                  <span className="text-lg">{ch.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate ${isActive ? 'text-brand-orange' : 'text-neutral-200'}`}>{ch.name}</p>
                    <p className="text-[8px] text-neutral-500 uppercase tracking-wider">{ch.desc}</p>
                  </div>
                </button>
              );
            })}
            <div className="border-t border-border-subtle my-2" />
            <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest px-3 py-2">#{chats.filter(c => c.channelId === activeChannel).length} üzenet</p>
          </div>
        )}

        {/* DM List */}
        {activeTab === 'dms' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <button onClick={() => setShowNewDm(!showNewDm)}
              className="w-full flex items-center space-x-3 p-3 rounded-2xl border border-dashed border-border-subtle text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-all text-left mb-2">
              <Users size={16} />
              <span className="text-[10px] font-black uppercase">Új üzenet</span>
            </button>

            {showNewDm && (
              <div className="bg-black/60 rounded-2xl p-3 mb-3 border border-border-subtle space-y-2 animate-fade-in">
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                  <input type="text" value={dmSearch} onChange={(e) => setDmSearch(e.target.value)}
                    placeholder="Keresés..."
                    className="w-full bg-black border border-border-subtle rounded-xl px-8 py-2 text-[10px] text-neutral-200 placeholder-neutral-700 outline-none focus:border-brand-orange" />
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredDmUsers.map(u => (
                    <button key={u.id} onClick={() => startDm(u)}
                      className="w-full flex items-center space-x-2 p-2 rounded-xl hover:bg-white/5 transition-all text-left">
                      <img src={u.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                      <span className="text-[10px] font-bold text-neutral-200">{u.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dmChannels.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={24} className="mx-auto text-neutral-800 mb-2" />
                <p className="text-[10px] text-neutral-600 font-bold">Nincs még üzeneted</p>
              </div>
            ) : (
              dmChannels.map(dm => {
                const isActive = activeChannel === dm.id;
                const unread = chats.filter(c => c.channelId === dm.id && !c.readBy?.includes(currentUser.id)).length;
                return (
                  <button key={dm.id} onClick={() => { setActiveChannel(dm.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center space-x-3 p-3 rounded-2xl transition-all text-left ${isActive ? 'bg-brand-orange/10 border border-brand-orange/30' : 'hover:bg-white/5 border border-transparent'}`}>
                    <img src={dm.partner?.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black truncate ${isActive ? 'text-brand-orange' : 'text-neutral-200'}`}>{dm.partner?.name || 'Ismeretlen'}</p>
                      <p className="text-[8px] text-neutral-500 truncate">{dm.partner?.rank || ''}</p>
                    </div>
                    {unread > 0 && (
                      <span className="bg-red-600 text-white text-[8px] font-black rounded-full h-4 w-4 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-bg-panel border-b border-border-subtle px-4 py-3 flex items-center space-x-3 shadow-lg">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-neutral-500 hover:text-white transition-colors" aria-label="Navigáció">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <Hash size={18} className="text-brand-orange shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-white truncate">{currentChannelName}</h3>
            <p className="text-[8px] text-neutral-500 font-bold">
              {activeChannel.startsWith('dm_') ? 'Privát üzenet' : `#${activeChannel}`}
            </p>
          </div>
          <button onClick={() => setChatSearchOpen(!chatSearchOpen)} className={`p-2 rounded-xl transition-all ${chatSearchOpen ? 'bg-brand-orange/20 text-brand-orange' : 'text-neutral-500 hover:text-white'}`} aria-label="Keresés">
            <Search size={16} aria-hidden="true" />
          </button>
          {replyMessage && (
            <button onClick={() => setReplyMessage(null)} className="text-[9px] text-neutral-500 hover:text-white px-2 py-1 rounded-lg bg-black/40 border border-border-subtle transition-all">
              Válasz törlése
            </button>
          )}
        </div>

        {chatSearchOpen && (
          <div className="px-4 py-2 bg-bg-panel border-b border-border-subtle animate-slide-up">
            <div className="relative max-w-md mx-auto">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                autoFocus
                type="text"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                placeholder="Üzenetek keresése..."
                className="w-full bg-black border border-border-subtle rounded-xl pl-8 pr-8 py-2 text-[11px] text-white placeholder-neutral-700 outline-none focus:border-brand-orange"
              />
              {chatSearchQuery && (
                <button onClick={() => setChatSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white" aria-label="Keresés törlése">
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </div>
            {chatSearchQuery && (
              <p className="text-[8px] text-neutral-500 font-bold mt-1.5 text-center">
                {currentChatMessages.length} találat
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        <PullToRefresh onRefresh={handleRefresh} containerRef={scrollRef}>
          <div className="p-3.5 space-y-4 scroll-smooth max-w-2xl mx-auto w-full" onClick={() => setSwipedMsgId(null)}>
          {currentChatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-neutral-600">
              <MessageSquare size={40} className="mb-3 text-neutral-800" />
              <p className="text-sm font-bold">Nincsenek üzenetek</p>
              <p className="text-xs mt-1">Legyél te az első!</p>
            </div>
          ) : (
            currentChatMessages.map(msg => {
              const isOwn = msg.senderId === currentUser.id;
              const isDeleted = msg.isDeleted;
              const isSwiped = swipedMsgId === msg.id;
              return (
                <div key={msg.id}
                  className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-stretch overflow-hidden ${isOwn ? 'ml-auto' : 'mr-auto'} animate-fade-in`}
                  style={{ maxWidth: isSwiped ? '100%' : '85%' }}
                  onTouchStart={(e) => {
                    if (msg.isDeleted || msg.senderId !== currentUser.id) return;
                    const touch = e.touches[0];
                    swipeTouchStart.current = { x: touch.clientX, y: touch.clientY, msgId: msg.id };
                  }}
                  onTouchMove={(e) => {
                    if (!swipeTouchStart.current || swipeTouchStart.current.msgId !== msg.id) return;
                    const touch = e.touches[0];
                    const dx = swipeTouchStart.current.x - touch.clientX;
                    const dy = Math.abs(swipeTouchStart.current.y - touch.clientY);
                    if (dx > 20 && dy < dx) {
                      e.preventDefault();
                      if (dx > 80) setSwipedMsgId(msg.id);
                    }
                  }}
                  onTouchEnd={() => {
                    if (swipeTouchStart.current?.msgId === msg.id) swipeTouchStart.current = null;
                  }}
                >
                  {isSwiped && isOwn && !isDeleted && (
                    <button
                      onClick={() => setDeleteConfirmMsg(msg)}
                      className="flex-shrink-0 bg-red-600 text-white flex items-center justify-center px-6 text-[9px] font-black uppercase tracking-wider rounded-2xl ml-2 active:scale-95"
                    >
                      Törlés
                    </button>
                  )}
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group max-w-full flex-1 min-w-0`}>
                  <div className="flex items-start space-x-2 w-full">
                    {!isOwn && <img src={msg.senderAvatar} className="w-7 h-7 rounded-full object-cover mt-1 border border-white/10 shrink-0" alt="" />}
                    <div className="flex flex-col min-w-0 w-full">
                      {!isOwn && (
                        <div className="flex items-center space-x-1.5 mb-1 ml-1">
                          <span className="text-xs font-black text-white leading-none">{msg.senderName}</span>
                          <span className="text-[7px] font-black text-brand-orange uppercase">{msg.senderRank}</span>
                          {(() => {
                            const sender = users.find(u => u.id === msg.senderId);
                            return sender?.flair ? <span className="text-[6px] font-black text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">{sender.flair}</span> : null;
                          })()}
                        </div>
                      )}
                      {msg.repliedTo && (
                        <div className="text-[9px] text-neutral-500 bg-black/30 px-3 py-1.5 rounded-t-2xl border-l-2 border-brand-orange mb-0.5 ml-1 truncate max-w-[240px]">
                          <span className="font-bold text-neutral-400">{msg.repliedTo.senderName}: </span>
                          {msg.repliedTo.content}
                        </div>
                      )}
                      <div className={`relative ${isDeleted ? 'opacity-50' : ''}`}>
                        {editMsgId === msg.id ? (
                          <div className="flex items-center space-x-2">
                            <input ref={editInputRef} type="text" value={editText} onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(msg.id); if (e.key === 'Escape') setEditMsgId(null); }}
                              className="bg-black border border-brand-orange rounded-2xl px-3 py-2 text-xs text-white outline-none flex-1" />
                            <button onClick={() => handleSaveEdit(msg.id)} className="text-brand-orange text-[10px] font-black">Ment</button>
                            <button onClick={() => setEditMsgId(null)} className="text-neutral-600 text-[10px]">Mégse</button>
                          </div>
                        ) : (
                          <div className={`p-3 rounded-2xl text-xs shadow-lg ${isOwn ? 'bg-brand-orange text-black font-extrabold rounded-tr-none' : 'bg-bg-card text-neutral-200 rounded-tl-none border border-border-card'}`}>
                            {isDeleted ? (
                              <p className="italic text-neutral-500 text-[10px]">Üzenet törölve</p>
                            ) : (
                              <>
                                <p className="break-words leading-relaxed">{msg.content.split(/(@[a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ\.\-_]+)/g).map((part, i) => part.startsWith('@') ? <span key={i} className="text-brand-orange font-black">{part}</span> : part)}</p>
                                {msg.imageUrl && (
                                  <div className="mt-2 rounded-xl overflow-hidden border border-black/20 shadow-md">
                                    <img src={msg.imageUrl} className="w-full max-w-[240px] block" alt="" />
                                  </div>
                                )}
                                {msg.videoUrl && (
                                  <div className="mt-2 rounded-xl overflow-hidden border border-black/20 shadow-md relative group/vid max-w-[240px]">
                                    <video src={msg.videoUrl} className="w-full block" controls />
                                  </div>
                                )}
                                {msg.isEdited && !isDeleted && (
                                  <span className="text-[8px] text-neutral-500 italic block mt-1">(szerkesztve)</span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 px-1">
                    {isOwn && !isDeleted && editMsgId !== msg.id && (
                      <>
                        <button onClick={() => handleStartEdit(msg)} className="text-neutral-600 hover:text-white transition-all opacity-0 group-hover:opacity-100" aria-label="Szerkesztés"><Edit3 size={10} aria-hidden="true" /></button>
                        <button onClick={() => setDeleteConfirmMsg(msg)} className="text-neutral-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" aria-label="Törlés"><Trash2 size={10} aria-hidden="true" /></button>
                      </>
                    )}
                    {!isOwn && !isDeleted && (
                      <button onClick={() => setReplyMessage(msg)} className="text-neutral-600 hover:text-white transition-all opacity-0 group-hover:opacity-100" aria-label="Válasz"><MessageSquare size={10} aria-hidden="true" /></button>
                    )}
                    <span className="text-[8px] text-neutral-500 font-mono">{new Date(msg.timestamp).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</span>
                    {isOwn && !isDeleted && msg.readBy && msg.readBy.length > 1 && (
                      <span className="text-[7px] text-blue-400 font-black tracking-wider" title={msg.readBy.filter(id => id !== currentUser.id).length + ' másik olvasta'}>
                        LÁTVA
                      </span>
                    )}
                    {!isOwn && !isDeleted && onToggleFollow && (
                      <button onClick={() => onToggleFollow(msg.senderId)} className="text-neutral-700 hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100" aria-label={currentUser.following?.includes(msg.senderId) ? 'Követés leállítása' : 'Követés'}>
                        <UserCheck size={10} />
                      </button>
                    )}
                    {!isOwn && !isDeleted && onBlockUser && (
                      <button onClick={() => onBlockUser(msg.senderId, msg.senderName)} className="text-neutral-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Ban size={10} /></button>
                    )}
                    {onReport && !isDeleted && (
                      <button onClick={() => onReport('chat', msg.id)} className="text-neutral-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" aria-label="Jelentés"><Flag size={10} aria-hidden="true" /></button>
                    )}
                  </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </PullToRefresh>

        {/* Typing indicator */}
        {(() => {
          const now = Date.now();
          const typers = users.filter(u =>
            u.typingIn?.channelId === activeChannel &&
            u.id !== currentUser.id &&
            now - new Date(u.typingIn.lastTypedAt).getTime() < 4000
          );
          if (typers.length === 0) return null;
          return (
            <div className="px-4 py-1.5 bg-bg-panel border-t border-border-subtle">
              <p className="text-[9px] text-neutral-500 font-bold">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-orange animate-pulse mr-1.5" />
                {typers.map(t => t.name).join(', ')} {typers.length === 1 ? 'ír...' : 'írnak...'}
              </p>
            </div>
          );
        })()}

        {/* Reply preview */}
        {replyMessage && (
          <div className="px-4 py-2 bg-bg-panel border-t border-border-subtle flex items-center space-x-2">
            <div className="flex-1 text-[10px] text-neutral-400 truncate">
              <span className="font-bold text-neutral-300">Válasz {replyMessage.senderName}-nek: </span>
              {replyMessage.content}
            </div>
            <button onClick={() => setReplyMessage(null)} className="text-neutral-600 hover:text-white" aria-label="Bezárás"><X size={14} aria-hidden="true" /></button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="px-4 pt-2 bg-bg-panel border-t border-border-subtle">
            <div className="flex space-x-3 pb-3 overflow-x-auto">
              {PRESET_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => handleEmojiPick(emoji)} className="text-2xl hover:scale-125 transition-transform active:scale-95">{emoji}</button>
              ))}
            </div>
          </div>
        )}

        {undoMsgId && (
          <div className="px-4 py-2 bg-bg-panel border-t border-border-subtle flex items-center justify-between animate-slide-up">
            <span className="text-[10px] text-neutral-400">
              <span className="font-bold text-brand-orange">Visszavonás</span> ({undoTimer}s)
            </span>
            <button onClick={handleUndo} className="flex items-center space-x-1 text-[10px] font-black text-white bg-brand-orange/20 hover:bg-brand-orange/30 px-3 py-1.5 rounded-xl transition-all active:scale-95">
              <RotateCcw size={12} />
              <span>VISSZA</span>
            </button>
          </div>
        )}

        {showGifPicker && <GifPicker onSelect={(url) => {
          if (currentUser.isMuted) { toast('Néma üzemmódban vagy!', 'warning'); setShowGifPicker(false); return; }
          const newMessage: ChatMessage = {
            id: `message_${Date.now()}`,
            channelId: activeChannel,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderRank: currentUser.rank,
            senderAvatar: currentUser.avatarUrl,
            content: '',
            imageUrl: url,
            timestamp: new Date().toISOString(),
            reactions: {},
            readBy: [currentUser.id]
          };
          onUpdateChats([...chats, newMessage]);
          setShowGifPicker(false);
        }} onClose={() => setShowGifPicker(false)} />}

        <div className="p-3 bg-bg-panel border-t border-border-subtle relative">
          {mentionQuery && mentionUsers.length > 0 && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden max-h-36 overflow-y-auto z-10">
              {mentionUsers.slice(0, 8).map(u => (
                <button key={u.id} type="button" onClick={() => {
                  const before = messageText.slice(0, mentionIndex);
                  const after = messageText.slice(mentionIndex + mentionQuery.length + 1);
                  setMessageText(`${before}@${u.name} ${after}`);
                  setMentionQuery('');
                  setMentionIndex(-1);
                }} className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-white/5 transition-all text-left">
                  <img src={u.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                  <span className="text-[10px] font-bold text-neutral-200">@{u.name}</span>
                  <span className="text-[7px] text-neutral-500 ml-auto">{u.rank}</span>
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2 max-w-2xl mx-auto">
            <button type="button" onClick={() => setShowGifPicker(true)} className="p-2.5 bg-black text-purple-500 rounded-xl border border-border-subtle transition-all active:scale-90 flex items-center justify-center text-[9px] font-black" aria-label="GIF">
              GIF
            </button>
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 bg-black text-brand-orange rounded-xl border border-border-subtle transition-all active:scale-90 flex items-center justify-center" aria-label="Emoji">
              <Smile size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={handleUploadMedia} disabled={isUploading} className="p-2.5 bg-black text-brand-orange rounded-xl border border-border-subtle transition-all active:scale-90 flex items-center justify-center" aria-label="Kamera">
              {isUploading ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Camera size={18} aria-hidden="true" />}
            </button>
            <input type="text" value={messageText} onChange={(e) => {
              const val = e.target.value;
              setMessageText(val);
              const lastAt = val.lastIndexOf('@');
              if (lastAt >= 0 && (lastAt === 0 || val[lastAt - 1] === ' ')) {
                const afterAt = val.slice(lastAt + 1);
                const word = afterAt.split(' ')[0];
                setMentionQuery(word);
                setMentionIndex(lastAt);
              } else { setMentionQuery(''); setMentionIndex(-1); }
              onUserTyping?.(activeChannel, true);
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => onUserTyping?.(activeChannel, false), 3000);
            }} placeholder="Üzenet..."
              className="flex-1 bg-black px-4 py-2.5 rounded-xl text-xs text-neutral-200 outline-none focus:border-brand-orange border border-border-subtle transition-all"
              onKeyDown={(e) => {
                if (mentionQuery && mentionUsers.length > 0) {
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    const u = mentionUsers[0];
                    const before = messageText.slice(0, mentionIndex);
                    const after = messageText.slice(mentionIndex + mentionQuery.length + 1);
                    setMessageText(`${before}@${u.name} ${after}`);
                    setMentionQuery('');
                    setMentionIndex(-1);
                    return;
                  }
                  if (e.key === 'Escape') { setMentionQuery(''); setMentionIndex(-1); return; }
                }
                if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(e);
              }} />
            <button type="submit" disabled={!messageText.trim()}
              className={`p-2.5 rounded-xl transition-all ${!messageText.trim() ? 'bg-neutral-800 text-neutral-600' : 'bg-brand-orange text-black font-black active:scale-95'}`} aria-label="Küldés">
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog open={deleteConfirmMsg !== null} title="Üzenet törlése" message="Biztosan törlöd ezt az üzenetet?" confirmLabel="Törlés" onConfirm={handleDeleteMsg} onCancel={() => setDeleteConfirmMsg(null)} />
    </div>
  );
};