/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Hash, Send, Camera, Loader2 } from 'lucide-react';
import { getPhoto, uploadMedia } from '../lib/capacitor-web';
import { ChatMessage, UserProfile, UserRank } from '../types';
import { useToast } from './Toast';

interface ChatSectionProps {
  chats: ChatMessage[];
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdateChats: (updatedChats: ChatMessage[]) => void;
  onReport?: (messageId: string) => void;
}

const PRESET_EMOJIS = ['🔥', '👍', '❤️', '🎯', '🚴‍♂️', '🍕'];

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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState<string>('');
  const [showEmojiPickerId, setShowEmojiPickerId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats, activeChannel]);

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
        {currentChatMessages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'} group max-w-[90%] ${msg.senderId === currentUser.id ? 'ml-auto' : 'mr-auto'} animate-fade-in`}>
            <div className="flex items-start space-x-2">
              {msg.senderId !== currentUser.id && <img src={msg.senderAvatar} className="w-8 h-8 rounded-full object-cover mt-1 border border-white/10" alt="" />}
              <div className="flex flex-col">
                <div className={`p-3 rounded-2xl text-xs shadow-lg ${msg.senderId === currentUser.id ? 'bg-brand-orange text-black font-extrabold rounded-tr-none' : 'bg-bg-card text-neutral-200 rounded-tl-none border border-border-card'}`}>
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
                </div>
                <span className="text-[8px] text-neutral-500 font-mono mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-bg-panel border-t border-border-subtle shadow-2xl">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2.5">
          <button type="button" onClick={handleUploadMedia} disabled={isUploading} className="p-3 bg-black text-brand-orange rounded-2xl border border-border-subtle transition-all active:scale-90 flex items-center justify-center">
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
          </button>
          <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Üzenet..." className="flex-1 bg-black px-4 py-3 rounded-2xl text-xs text-neutral-200 outline-none focus:border-brand-orange border border-border-subtle transition-all" />
          <button type="submit" disabled={!messageText.trim()} className={`p-3 rounded-2xl transition-all ${!messageText.trim() ? 'bg-neutral-800 text-neutral-600' : 'bg-brand-orange text-black font-black active:scale-95'}`}><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
};
