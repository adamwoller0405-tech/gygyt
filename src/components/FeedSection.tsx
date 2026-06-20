/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, MessageCircle, Bookmark, Send, PlusCircle, Trash2, Hash, Camera, Loader2 } from 'lucide-react';
import { getPhoto, uploadMedia } from '../lib/capacitor-web';
import { FeedPost, UserProfile, UserRank, FeedComment } from '../types';
import { BadgeRenderer } from './BadgeRenderer';

interface FeedSectionProps {
  posts: FeedPost[];
  currentUser: UserProfile;
  onUpdatePosts: (updatedPosts: FeedPost[]) => void;
  users: UserProfile[];
  onSavePost?: (postId: string) => void;
  onReport?: (postId: string) => void;
}

export const FeedSection: React.FC<FeedSectionProps> = ({
  posts,
  currentUser,
  onUpdatePosts,
  users,
  onSavePost,
  onReport
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostMediaUrl, setNewPostMediaUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isMediaVideo, setIsMediaVideo] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [currentHashFilter, setCurrentHashFilter] = useState<string | null>(null);

  const filteredPosts = posts
    .filter(post => activeTab === 'saved' ? post.isSaved : true)
    .filter(post => currentHashFilter ? post.hashtags.includes(currentHashFilter.toLowerCase()) : true);

  const handleUploadMedia = async () => {
    try {
      const image = await getPhoto({ quality: 90, allowEditing: false });
      if (image.webPath) {
        setIsUploading(true);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const url = await uploadMedia(blob);
        setNewPostMediaUrl(url);
        setIsMediaVideo(url.includes('/video/upload/') || url.endsWith('.mp4'));
      }
    } catch (err) { console.error(err); } finally { setIsUploading(false); }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostCaption.trim() || !newPostMediaUrl) return;

    const extraTags = newPostCaption.match(/#[a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+/g)?.map(m => m.replace('#', '').toLowerCase()) || [];
    if (!extraTags.includes('gygyt')) extraTags.push('gygyt');

    const newPost: FeedPost = {
      id: `post_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      authorRank: currentUser.rank,
      mediaUrls: [newPostMediaUrl],
      mediaType: isMediaVideo ? 'video' : 'image',
      caption: newPostCaption,
      likes: [],
      comments: [],
      hashtags: extraTags,
      createdAt: new Date().toISOString()
    };

    onUpdatePosts([newPost, ...posts]);
    setNewPostCaption('');
    setNewPostMediaUrl('');
    setShowNewPostModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-deep animate-fade-in overflow-hidden">
      
      <div className="px-5 py-4 bg-bg-panel border-b border-border-subtle flex items-center justify-between shadow-lg z-20">
        <div className="flex space-x-3">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${activeTab === 'all' ? 'bg-brand-orange text-black' : 'text-neutral-500'}`}>Hírfolyam</button>
          <button onClick={() => setActiveTab('saved')} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${activeTab === 'saved' ? 'bg-brand-orange text-black' : 'text-neutral-500'}`}>Mentett</button>
        </div>
        <button onClick={() => setShowNewPostModal(true)} className="bg-brand-orange/10 p-2 rounded-xl text-brand-orange transition-all active:scale-95"><PlusCircle size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 scroll-smooth">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-neutral-700 font-black uppercase tracking-widest text-xs">Még nincs tartalom</div>
        ) : (
          <div className="max-w-lg mx-auto w-full space-y-6">
          {filteredPosts.map(post => (
            <article key={post.id} className="bg-bg-card rounded-[32px] overflow-hidden border border-border-card shadow-2xl animate-fade-in group">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={post.authorAvatar} className="w-10 h-10 rounded-full object-cover border border-white/5" alt="" />
                  <div>
                    <p className="text-xs font-black text-white leading-none">{post.authorName}</p>
                    <span className="text-[8px] font-black text-brand-orange tracking-widest uppercase">{post.authorRank}</span>
                  </div>
                </div>
              </div>

              <div className="aspect-[4/3] bg-neutral-950 flex items-center justify-center relative overflow-hidden rounded-none">
                {post.mediaType === 'video' ? (
                  <video src={post.mediaUrls[0]} className="w-full h-full object-cover" controls />
                ) : (
                  <img src={post.mediaUrls[0]} className="w-full h-full object-cover" alt="" />
                )}
              </div>

              <div className="p-5 space-y-3">
                <p className="text-xs text-neutral-300 leading-relaxed">
                   <strong className="text-white mr-2">{post.authorName.split(' ')[1]}</strong>
                   {post.caption}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map(h => <span key={h} className="text-[10px] font-black text-brand-orange">#{h}</span>)}
                </div>
              </div>
            </article>
          ))}
          </div>
        )}
      </div>

      {showNewPostModal && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 backdrop-blur-2xl animate-fade-in">
          <div className="bg-bg-panel border border-border-subtle rounded-[48px] p-8 max-w-sm w-full space-y-6 shadow-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest text-center">Új Bejegyzés</h3>

            <div
              onClick={handleUploadMedia}
              className="aspect-square bg-black border-2 border-dashed border-border-subtle rounded-[40px] flex flex-col items-center justify-center cursor-pointer hover:border-brand-orange transition-all overflow-hidden relative"
            >
              {isUploading ? <Loader2 className="animate-spin text-brand-orange" /> : (
                newPostMediaUrl ? (
                   isMediaVideo ? <video src={newPostMediaUrl} className="w-full h-full object-cover" muted /> : <img src={newPostMediaUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <>
                    <Camera className="text-neutral-700 mb-2" size={40} />
                    <span className="text-[10px] text-neutral-600 font-black">MÉDIA KIVÁLASZTÁSA</span>
                  </>
                )
              )}
            </div>

            <textarea
              value={newPostCaption}
              onChange={(e) => setNewPostCaption(e.target.value)}
              className="w-full bg-black border border-border-subtle rounded-3xl p-5 text-xs text-white outline-none focus:border-brand-orange"
              placeholder="Írj valamit..."
              rows={3}
            />

            <div className="flex gap-4">
              <button onClick={() => setShowNewPostModal(false)} className="flex-1 py-4 rounded-3xl text-[10px] font-black uppercase text-neutral-500 hover:text-white transition-all">Mégse</button>
              <button onClick={handleCreatePost} disabled={!newPostMediaUrl || !newPostCaption.trim()} className="flex-1 bg-brand-orange text-black font-black py-4 rounded-3xl text-[10px] uppercase shadow-lg disabled:opacity-50">Megosztás</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
