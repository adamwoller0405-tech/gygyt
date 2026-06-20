import React, { useState, useEffect, useRef } from 'react';
import { Hash, Send, Camera, Loader2, Flag, Trash2, Edit3, Smile } from 'lucide-react';
import { getPhoto, uploadMedia } from '../lib/capacitor-web';
import { ChatMessage, UserProfile, UserRank } from '../types';
import { useToast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';

interface ChatSectionProps {
  chats: ChatMessage[];
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdateChats: (updatedChats: ChatMessage[]) => void;
  onReport?: (type: 'post' | 'chat' | 'user', id: string) => void;
}

const PRESET_EMOJIS = ['🔥', '👍', '❤️', '🎯', '🚴', '🍕'];

export const ChatSection: React.FC<ChatSectionProps> = ({
  chats,
  currentUser,
  users,
  onUpdateChats,
  onReport
}) => {
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState<string>('global');
  const [messageText, setMessageText] = useState<string>('');
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editMsgId, setEditMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<ChatMessage | null>(null);
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

  const canAccessChannel = (channelId: string) => {
    const rank = currentUser.rank;
    if (rank === UserRank.ADMIN || rank === UserRank.ELITE) return true;
    if (channelId === 'global') return true;
    if (channelId === 'og') return rank === UserRank.CHAMPION;
    if (channelId === 'mid') return rank === UserRank.DIAMOND || rank === UserRank.GOLD;
    if (channelId === 'rookie') return rank === UserRank.SILVER || rank === UserRank.BRONZE;
    return false;
  };

  const getChannelsList = () => {
    const list = [{ id: 'global', name: '💬 Fő Csevegő (Globális)', desc: 'Általános duma' }];
    if (canAccessChannel('og')) list.push({ id: 'og', name: '🔥 OG Chat (Elite / Bajnok)', desc: 'Elite megbeszélés' });
    if (canAccessChannel('mid')) list.push({ id: 'mid', name: '💎 Mid Chat (Arany / Gyémánt)', desc: 'Középszint' });
    if (canAccessChannel('rookie')) list.push({ id: 'rookie', name: '🌱 Rookie Chat (Ezüst / Bronz)', desc: 'Kezdők' });
    return list;
  };

  const channelInfo = getChannelsList();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    if (currentUser.isMuted) {
      toast('Néma üzemmódban vagy!', 'warning');
      return;
    }

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
      newMessage.repliedTo = {
        messageId: replyMessage.id,
        senderName: replyMessage.senderName,
        content: replyMessage.content
      };
      setReplyMessage(null);
    }

    onUpdateChats([...chats, newMessage]);
    setMessageText('');
    setShowEmojiPicker(false);
  };

  const handleUploadMedia = async () => {
    try {
      const image = await getPhoto({ quality: 90, allowEditing: false });
      if (image.webPath) {
        setIsUploading(true);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const url = await uploadMedia(blob);
        const isVideo = url.endsWith('.mp4') || url.endsWith('.mov') || url.includes('/video/upload/');

        const newMessage: ChatMessage = {
          id: `message_${Date.now()}`,
          channelId: activeChannel,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRank: currentUser.rank,
          senderAvatar: currentUser.avatarUrl,
          content: isVideo ? 'Videó küldve 📹' : 'Fénykép küldve 📸',
          imageUrl: isVideo ? undefined : url,
          videoUrl: isVideo ? url : undefined,
          timestamp: new Date().toISOString(),
          reactions: {},
          readBy: [currentUser.id]
        };
        onUpdateChats([...chats, newMessage]);
      }
    } catch (err: any) {
      console.error('Upload failed', err);
      if (err.message !== 'User cancelled photos app') {
        toast(`Feltöltési hiba: ${err.message}`, 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartEdit = (msg: ChatMessage) => {
    setEditMsgId(msg.id);
    setEditText(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editText.trim()) return;
    const updated = chats.map(c => c.id === msgId ? { ...c, content: editText.trim(), isEdited: true } : c);
    onUpdateChats(updated);
    setEditMsgId(null);
    setEditText('');
  };

  const handleDeleteMsg = () => {
    if (!deleteConfirmMsg) return;
    const updated = chats.map(c => c.id === deleteConfirmMsg.id ? { ...c, content: 'Üzenet törölve', isDeleted: true, imageUrl: undefined, videoUrl: undefined } : c);
    onUpdateChats(updated);
    setDeleteConfirmMsg(null);
  };

  const handleEmojiPick = (emoji: string) => {
    setMessageText(prev => prev + emoji);
  };

  const currentChatMessages = chats.filter(c => c.channelId === activeChannel);

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-deep animate-fade-in overflow-hidden min-h-0">
      <div className="bg-bg-panel border-b border-border-subtle p-2 overflow-x-auto flex space-x-1.5 scrollbar-none">
        {channelInfo.map(ch => (
          <button key={ch.id} onClick={() => setActiveChannel(ch.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${activeChannel === ch.id ? 'bg-brand-orange text-black' : 'text-neutral-400 hover:text-white'}`}>
            <Hash size={13} />
            <span>{ch.id.toUpperCase()}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 p-3.5 overflow-y-auto space-y-4 scroll-smooth max-w-lg mx-auto w-full" ref={scrollRef}>
        {currentChatMessages.map(msg => {
          const isOwn = msg.senderId === currentUser.id;
          const isDeleted = msg.isDeleted;

          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group max-w-[90%] ${isOwn ? 'ml-auto' : 'mr-auto'} animate-fade-in`}>
              <div className="flex items-start space-x-2">
                {!isOwn && <img src={msg.senderAvatar} className="w-8 h-8 rounded-full object-cover mt-1 border border-white/10" alt="" />}
                <div className="flex flex-col">
                  {!isOwn && (
                    <div className="flex items-center space-x-1.5 mb-1 ml-1">
                      <span className="text-xs font-black text-white leading-none">{msg.senderName}</span>
                      <span className="text-[8px] font-black text-brand-orange uppercase">{msg.senderRank}</span>
                    </div>
                  )}
                  <div className={`relative ${isDeleted ? 'opacity-50' : ''}`}>
                    {editMsgId === msg.id ? (
                      <div className="flex items-center space-x-2">
                        <input ref={editInputRef} type="text" value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(msg.id); if (e.key === 'Escape') setEditMsgId(null); }} className="bg-black border border-brand-orange rounded-2xl px-3 py-2 text-xs text-white outline-none flex-1" />
                        <button onClick={() => handleSaveEdit(msg.id)} className="text-brand-orange text-[10px] font-black">Ment</button>
                        <button onClick={() => setEditMsgId(null)} className="text-neutral-600 text-[10px]">Mégse</button>
                      </div>
                    ) : (
                      <div className={`p-3 rounded-2xl text-xs shadow-lg ${isOwn ? 'bg-brand-orange text-black font-extrabold rounded-tr-none' : 'bg-bg-card text-neutral-200 rounded-tl-none border border-border-card'}`}>
                        {isDeleted ? (
                          <p className="italic text-neutral-500 text-[10px]">Üzenet törölve</p>
                        ) : (
                          <>
                            <p className="break-words leading-relaxed">{msg.content}</p>

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
                    {isOwn && !isDeleted && editMsgId !== msg.id && (
                      <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStartEdit(msg)} className="p-1 bg-bg-panel border border-border-subtle rounded-lg text-neutral-500 hover:text-white transition-all"><Edit3 size={12} /></button>
                        <button onClick={() => setDeleteConfirmMsg(msg)} className="p-1 bg-bg-panel border border-border-subtle rounded-lg text-neutral-500 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1 px-1">
                    <span className="text-[8px] text-neutral-500 font-mono">{new Date(msg.timestamp).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}</span>
                    {onReport && !isDeleted && (
                      <button onClick={() => onReport('chat', msg.id)} className="text-neutral-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Flag size={10} /></button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showEmojiPicker && (
        <div className="px-4 pt-2 bg-bg-panel border-t border-border-subtle">
          <div className="flex space-x-3 pb-3 overflow-x-auto">
            {PRESET_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => handleEmojiPick(emoji)} className="text-2xl hover:scale-125 transition-transform active:scale-95">{emoji}</button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-bg-panel border-t border-border-subtle shadow-2xl">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2.5">
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 bg-black text-brand-orange rounded-2xl border border-border-subtle transition-all active:scale-90 flex items-center justify-center">
            <Smile size={20} />
          </button>
          <button type="button" onClick={handleUploadMedia} disabled={isUploading} className="p-3 bg-black text-brand-orange rounded-2xl border border-border-subtle transition-all active:scale-90 flex items-center justify-center">
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
          </button>
          <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Üzenet..." className="flex-1 bg-black px-4 py-3 rounded-2xl text-xs text-neutral-200 outline-none focus:border-brand-orange border border-border-subtle transition-all" />
          <button type="submit" disabled={!messageText.trim()} className={`p-3 rounded-2xl transition-all ${!messageText.trim() ? 'bg-neutral-800 text-neutral-600' : 'bg-brand-orange text-black font-black active:scale-95'}`}><Send size={18} /></button>
        </form>
      </div>

      <ConfirmDialog
        open={deleteConfirmMsg !== null}
        title="Üzenet törlése"
        message="Biztosan törlöd ezt az üzenetet?"
        confirmLabel="Törlés"
        onConfirm={handleDeleteMsg}
        onCancel={() => setDeleteConfirmMsg(null)}
      />
    </div>
  );
};
