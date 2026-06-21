/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Bookmark, Send, PlusCircle, Camera, Loader2, X, ZoomIn, Flag, Trash2, Share2 } from 'lucide-react';
import { getPhoto, uploadMedia } from '../lib/capacitor-web';
import { FeedPost, UserProfile, UserRank, FeedComment } from '../types';
import { BadgeRenderer } from './BadgeRenderer';
import { useToast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { checkRateLimit } from '../lib/rateLimit';
import { PullToRefresh } from './PullToRefresh';

interface FeedSectionProps {
  posts: FeedPost[];
  currentUser: UserProfile;
  users: UserProfile[];
  onUpdatePosts: (updatedPosts: FeedPost[]) => void;
  onReport?: (type: 'post' | 'chat' | 'user', id: string) => void;
}

export const FeedSection: React.FC<FeedSectionProps> = ({
  posts,
  currentUser,
  users,
  onUpdatePosts,
  onReport
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState(() => localStorage.getItem('draft_post_caption') || '');
  const [newPostMediaUrl, setNewPostMediaUrl] = useState(() => localStorage.getItem('draft_post_media') || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isMediaVideo, setIsMediaVideo] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [commentUploading, setCommentUploading] = useState<string | null>(null);
  const [currentHashFilter, setCurrentHashFilter] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<FeedPost | null>(null);
  const { toast } = useToast();

  const handleRefresh = async () => {
    await new Promise(r => setTimeout(r, 500));
  };

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
        localStorage.setItem('draft_post_media', url);
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

  const handleComment = async (postId: string, imageUrl?: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text && !imageUrl) return;
    const comment: FeedComment = {
      id: `comment_${Date.now()}`,
      postId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      authorRank: currentUser.rank,
      content: text || '',
      createdAt: new Date().toISOString(),
      imageUrl
    };
    const updated = posts.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
    );
    onUpdatePosts(updated);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleCommentUpload = async (postId: string) => {
    try {
      const image = await getPhoto({ quality: 70, allowEditing: false });
      if (image.webPath) {
        setCommentUploading(postId);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const url = await uploadMedia(blob);
        await handleComment(postId, url);
      }
    } catch {} finally { setCommentUploading(null); }
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
    if (!checkRateLimit(`post_${currentUser.id}`, 5, 60000)) { toast('Túl sok bejegyzés! Várj egy kicsit.', 'warning'); return; }

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
    localStorage.removeItem('draft_post_caption');
    localStorage.removeItem('draft_post_media');
    setShowNewPostModal(false);
  };

  const handleDeletePost = () => {
    if (!deleteConfirmPost) return;
    const updated = posts.filter(p => p.id !== deleteConfirmPost.id);
    onUpdatePosts(updated);
    toast('Bejegyzés törölve!');
    setDeleteConfirmPost(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-deep animate-fade-in overflow-hidden min-h-0">
      
      <div className="px-5 py-4 bg-bg-panel border-b border-border-subtle flex items-center justify-between shadow-lg z-20">
        <div className="flex space-x-3">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${activeTab === 'all' ? 'bg-brand-orange text-black' : 'text-neutral-500'}`}>Hírfolyam</button>
          <button onClick={() => setActiveTab('saved')} className={`px-4 py-1.5 rounded-full text-xs font-black transition-all ${activeTab === 'saved' ? 'bg-brand-orange text-black' : 'text-neutral-500'}`}>Mentett</button>
        </div>
        {isEditor && <button onClick={() => setShowNewPostModal(true)} className="bg-brand-orange/10 p-2 rounded-xl text-brand-orange transition-all active:scale-95" aria-label="Új bejegyzés"><PlusCircle size={20} aria-hidden="true" /></button>}
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-6 pb-24 scroll-smooth">
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
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[8px] font-black text-brand-orange tracking-widest uppercase">{post.authorRank}</span>
                      {(() => {
                        const author = users.find(u => u.id === post.authorId);
                        return author?.flair ? <span className="text-[6px] font-black text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full">{author.flair}</span> : null;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {post.authorId === currentUser.id && (
                    <button onClick={() => setDeleteConfirmPost(post)} className="p-1.5 text-neutral-600 hover:text-red-500 transition-all" aria-label="Törlés"><Trash2 size={14} aria-hidden="true" /></button>
                  )}
                  {onReport && (
                    <button onClick={() => onReport('post', post.id)} className="p-1.5 text-neutral-600 hover:text-red-500 transition-all" aria-label="Jelentés"><Flag size={14} aria-hidden="true" /></button>
                  )}
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
                    <button onClick={() => { const url = `${window.location.origin}/app/`; if (navigator.share) { navigator.share({ title: 'GYGYT Rideout', text: post.caption, url }).catch(() => {}); } else { navigator.clipboard?.writeText(url).catch(() => {}); } }} className="flex items-center space-x-1 text-neutral-600 hover:text-neutral-400 transition-all active:scale-90" aria-label="Megosztás">
                      <Share2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <button onClick={() => handleSave(post.id)} className={`transition-all active:scale-90 ${post.isSaved ? 'text-brand-orange' : 'text-neutral-600 hover:text-neutral-400'}`} aria-label="Mentés">
                    <Bookmark size={16} fill={post.isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
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
                          {c.content && <p className="text-[11px] text-neutral-300 mt-0.5">{c.content}</p>}
                          {c.imageUrl && <img src={c.imageUrl} className="mt-1.5 rounded-xl max-w-[180px] border border-white/5" alt="" />}
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
                      <button onClick={() => handleCommentUpload(post.id)} disabled={commentUploading === post.id} className="text-neutral-600 hover:text-brand-orange p-2 active:scale-90 transition-all" aria-label="Kamera">
                        {commentUploading === post.id ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                      </button>
                      <button onClick={() => handleComment(post.id)} className="text-brand-orange p-2 active:scale-90 transition-all" aria-label="Küldés">
                        <Send size={16} aria-hidden="true" />
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
      </PullToRefresh>

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
              onChange={(e) => { setNewPostCaption(e.target.value); localStorage.setItem('draft_post_caption', e.target.value); }}
              className="w-full bg-black border border-border-subtle rounded-3xl p-5 text-xs text-white outline-none focus:border-brand-orange"
              placeholder="Írj valamit..."
              rows={3}
            />

            <div className="flex gap-4">
              <button onClick={() => { setShowNewPostModal(false); }} className="flex-1 py-4 rounded-3xl text-[10px] font-black uppercase text-neutral-500 hover:text-white transition-all">Mégse</button>
              <button onClick={handleCreatePost} disabled={!newPostMediaUrl || !newPostCaption.trim()} className="flex-1 bg-brand-orange text-black font-black py-4 rounded-3xl text-[10px] uppercase shadow-lg disabled:opacity-50">Megosztás</button>
            </div>
          </div>
        </div>
      )}

      {lightboxUrl && <ImageViewer url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      <ConfirmDialog
        open={deleteConfirmPost !== null}
        title="Bejegyzés törlése"
        message="Biztosan törlöd ezt a bejegyzést?"
        confirmLabel="Törlés"
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteConfirmPost(null)}
      />

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
      <button onClick={onClose} className="absolute top-6 right-6 z-10 text-white/70 hover:text-white p-2" aria-label="Bezárás"><X size={28} aria-hidden="true" /></button>
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
