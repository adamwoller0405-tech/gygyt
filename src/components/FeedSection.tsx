/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Send, PlusCircle, Trash2, Hash, Camera, Loader2, X, ZoomIn } from 'lucide-react';
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const isEditor = currentUser.rank === UserRank.ADMIN || currentUser.rank === UserRank.ELITE;

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

  const handleLike = (postId: string) => {
    const updated = posts.map(p => {
      if (p.id !== postId) return p;
      const likes = p.likes.includes(currentUser.id)
        ? p.likes.filter(id => id !== currentUser.id)
        : [...p.likes, currentUser.id];
      return { ...p, likes };
    });
    onUpdatePosts(updated);
  };

  const handleComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    const comment: FeedComment = {
      id: `comment_${Date.now()}`,
      postId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      authorRank: currentUser.rank,
      content: text,
      createdAt: new Date().toISOString()
    };
    const updated = posts.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
    );
    onUpdatePosts(updated);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleSave = (postId: string) => {
    const updated = posts.map(p =>
      p.id === postId ? { ...p, isSaved: !p.isSaved } : p
    );
    onUpdatePosts(updated);
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
    <div className="flex-1 flex flex-col h-full bg-bg-deep animate-fade-in overflow-hidden min-h-0">
      
      <div className="px-5 py-4 bg-bg-panel border-b border-border-subtle flex items-center justify-between shadow-lg z-20">
        <div className="flex space-x-3">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${activeTab === 'all' ? 'bg-brand-orange text-black' : 'text-neutral-500'}`}>Hírfolyam</button>
          <button onClick={() => setActiveTab('saved')} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${activeTab === 'saved' ? 'bg-brand-orange text-black' : 'text-neutral-500'}`}>Mentett</button>
        </div>
        {isEditor && <button onClick={() => setShowNewPostModal(true)} className="bg-brand-orange/10 p-2 rounded-xl text-brand-orange transition-all active:scale-95"><PlusCircle size={20} /></button>}
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

              <div className="aspect-[4/3] bg-neutral-950 flex items-center justify-center relative overflow-hidden rounded-none cursor-pointer group/media" onClick={() => setLightboxUrl(post.mediaUrls[0])}>
                {post.mediaType === 'video' ? (
                  <video src={post.mediaUrls[0]} className="w-full h-full object-cover" controls onClick={(e) => e.stopPropagation()} />
                ) : (
                  <>
                    <img src={post.mediaUrls[0]} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/media:bg-black/20 transition-all">
                      <ZoomIn className="text-white opacity-0 group-hover/media:opacity-100 transition-all" size={28} />
                    </div>
                  </>
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

                <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
                  <div className="flex items-center space-x-4">
                    <button onClick={() => handleLike(post.id)} className={`flex items-center space-x-1 transition-all active:scale-90 ${post.likes.includes(currentUser.id) ? 'text-red-500' : 'text-neutral-600 hover:text-neutral-400'}`}>
                      <Heart size={16} fill={post.likes.includes(currentUser.id) ? 'currentColor' : 'none'} />
                      <span className="text-[10px] font-black">{post.likes.length || ''}</span>
                    </button>
                    <button onClick={() => setCommentInputs(prev => ({ ...prev, [post.id + '_open']: prev[post.id + '_open'] ? '' : 'true' }))} className="flex items-center space-x-1 text-neutral-600 hover:text-neutral-400 transition-all active:scale-90">
                      <MessageCircle size={16} />
                      <span className="text-[10px] font-black">{post.comments.length || ''}</span>
                    </button>
                  </div>
                  <button onClick={() => handleSave(post.id)} className={`transition-all active:scale-90 ${post.isSaved ? 'text-brand-orange' : 'text-neutral-600 hover:text-neutral-400'}`}>
                    <Bookmark size={16} fill={post.isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {(commentInputs[post.id + '_open'] === 'true' || post.comments.length > 0) && (
                  <div className="space-y-3 pt-1">
                    {post.comments.map(c => (
                      <div key={c.id} className="flex items-start space-x-2.5">
                        <img src={c.authorAvatar} className="w-6 h-6 rounded-full object-cover mt-0.5" alt="" />
                        <div className="bg-black/40 rounded-2xl px-3 py-2 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-white">{c.authorName}</span>
                            <span className="text-[7px] text-neutral-600 font-black uppercase tracking-wider">{c.authorRank}</span>
                          </div>
                          <p className="text-[11px] text-neutral-300 mt-0.5">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleComment(post.id); }}
                        placeholder="Írj hozzászólást..."
                        className="flex-1 bg-black border border-border-subtle rounded-2xl px-4 py-2 text-xs text-white placeholder-neutral-700 outline-none focus:border-brand-orange"
                      />
                      <button onClick={() => handleComment(post.id)} className="text-brand-orange p-2 active:scale-90 transition-all">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
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

      {lightboxUrl && <ImageViewer url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

    </div>
  );
};

const ImageViewer: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
  const imgRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const lastDist = useRef(0);
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const getDist = (t: React.TouchEvent<HTMLDivElement>) => {
    if (t.touches.length < 2) return 0;
    const dx = t.touches[0].clientX - t.touches[1].clientX;
    const dy = t.touches[0].clientY - t.touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      lastDist.current = getDist(e);
    } else if (e.touches.length === 1 && scale > 1) {
      dragging.current = true;
      dragStart.current = { x: e.touches[0].clientX - dragPos.current.x, y: e.touches[0].clientY - dragPos.current.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = getDist(e);
      if (lastDist.current > 0) {
        const newScale = Math.max(1, Math.min(5, scale * (dist / lastDist.current)));
        setScale(newScale);
      }
      lastDist.current = dist;
    } else if (e.touches.length === 1 && dragging.current) {
      const newPos = {
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      };
      dragPos.current = newPos;
      setPos(newPos);
    }
  };

  const handleTouchEnd = () => {
    dragging.current = false;
    lastDist.current = 0;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.max(1, Math.min(5, s * delta)));
  };

  const resetZoom = () => {
    setScale(1);
    setPos({ x: 0, y: 0 });
    dragPos.current = { x: 0, y: 0 };
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in touch-none select-none"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <button onClick={onClose} className="absolute top-6 right-6 z-10 text-white/70 hover:text-white p-2"><X size={28} /></button>
      {scale > 1 && (
        <button onClick={resetZoom} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-white/10 text-white text-xs font-black px-5 py-2 rounded-full backdrop-blur-md hover:bg-white/20 transition-all">
          1:1 ({scale.toFixed(1)}x)
        </button>
      )}
      <div
        ref={imgRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
          transition: dragging.current ? 'none' : 'transform 0.2s ease-out',
        }}
        className="max-w-full max-h-full flex items-center justify-center"
      >
        <img src={url} className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl" alt="" draggable={false} />
      </div>
    </div>
  );
};
