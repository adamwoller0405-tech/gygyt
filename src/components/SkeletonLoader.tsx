import React from 'react';

interface SkeletonLoaderProps {
  type: 'post' | 'chat' | 'event' | 'profile';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 1 }) => {
  const shimmer = 'animate-pulse bg-neutral-800/60 rounded-full';

  const PostSkeleton = () => (
    <div className="bg-bg-card rounded-[32px] overflow-hidden border border-border-card shadow-2xl animate-fade-in">
      <div className="p-4 flex items-center space-x-3">
        <div className={`w-10 h-10 ${shimmer} rounded-full`} />
        <div className="space-y-2 flex-1">
          <div className={`h-3 w-28 ${shimmer}`} />
          <div className={`h-2 w-16 ${shimmer}`} />
        </div>
      </div>
      <div className={`aspect-[4/3] ${shimmer} rounded-none`} />
      <div className="p-5 space-y-3">
        <div className={`h-3 w-full ${shimmer}`} />
        <div className={`h-3 w-3/4 ${shimmer}`} />
        <div className="flex gap-2">
          <div className={`h-4 w-14 ${shimmer}`} />
          <div className={`h-4 w-14 ${shimmer}`} />
        </div>
      </div>
    </div>
  );

  const ChatSkeleton = () => (
    <div className={`flex ${Math.random() > 0.5 ? 'items-end' : 'items-start'} space-x-2 animate-fade-in`}>
      <div className={`w-7 h-7 ${shimmer} rounded-full shrink-0`} />
      <div className="space-y-2 flex-1 max-w-[75%]">
        <div className={`h-2.5 w-16 ${shimmer}`} />
        <div className={`h-12 w-full ${shimmer} rounded-2xl`} />
      </div>
    </div>
  );

  const EventSkeleton = () => (
    <div className="bg-bg-card border border-border-card rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
      <div className="bg-bg-panel p-3.5 border-b border-border-card">
        <div className={`h-4 w-24 ${shimmer}`} />
      </div>
      <div className="p-4 space-y-3">
        <div className={`h-5 w-3/4 ${shimmer}`} />
        <div className={`h-3 w-1/2 ${shimmer}`} />
        <div className="grid grid-cols-2 gap-2.5">
          <div className={`h-14 ${shimmer} rounded-2xl`} />
          <div className={`h-14 ${shimmer} rounded-2xl`} />
        </div>
      </div>
    </div>
  );

  const ProfileSkeleton = () => (
    <div className="flex flex-col items-center space-y-4 animate-fade-in">
      <div className={`w-32 h-32 ${shimmer} rounded-[44px]`} />
      <div className={`h-5 w-40 ${shimmer}`} />
      <div className={`h-3 w-24 ${shimmer}`} />
    </div>
  );

  const items = Array.from({ length: count });
  const RenderItem = type === 'post' ? PostSkeleton : type === 'chat' ? ChatSkeleton : type === 'event' ? EventSkeleton : ProfileSkeleton;

  return (
    <div className="space-y-4" aria-hidden="true">
      {items.map((_, i) => <RenderItem key={i} />)}
    </div>
  );
};
