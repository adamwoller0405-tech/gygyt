/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRank {
  ADMIN = 'ADMIN',
  ELITE = 'ELITE',
  CHAMPION = 'CHAMPION',
  DIAMOND = 'DIAMOND',
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  BRONZE = 'BRONZE'
}

export interface UserProfile {
  id: string;
  email?: string;
  name: string;
  avatarUrl: string;
  rank: UserRank;
  age: number;
  school: string;
  joinedDate: string;
  achievements: string[]; // List of achievement IDs
  stats: {
    eventsJoined: number;
  };
  isMuted?: boolean;
  isBanned?: boolean;
  flair?: string;
  blockedUsers?: string[];
  typingIn?: { channelId: string; lastTypedAt: string };
  modNote?: string;
  warnings?: { reason: string; date: string; warnedBy: string }[];
}

export interface JoinRequest {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  age: number;
  school: string;
  introduction: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ChatMessage {
  id: string;
  channelId: string; // 'global', 'og', 'mid', 'rookie'
  senderId: string;
  senderName: string;
  senderRank: UserRank;
  senderAvatar: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp: string;
  repliedTo?: {
    messageId: string;
    senderName: string;
    content: string;
  };
  reactions: {
    [emoji: string]: string[]; // emoji -> array of userIds
  };
  readBy?: string[]; // userIds
  isEdited?: boolean;
  isDeleted?: boolean;
}

export interface CyclingEvent {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  locationName: string; // E.g., Pilisvörösvár, Balatonfüred
  difficulty: 'Könnyű' | 'Közepes' | 'Nehéz' | 'Extrém';
  type: 'Ride' | 'Race' | 'Meetup' | 'Social' | 'Maintenance';
  creatorId: string;
  creatorName: string;
  rsvps: {
    [userId: string]: 'going' | 'maybe' | 'not_going';
  };
  photos?: string[]; // Media uploaded after event
  maxParticipants?: number;
  checkIns?: { [userId: string]: string }; // userId → ISO timestamp of check-in
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRank: UserRank;
  mediaUrls: string[]; // multiple media per post
  mediaType: 'image' | 'video'; // image or video posts
  caption: string;
  likes: string[]; // List of userIds
  comments: FeedComment[];
  hashtags: string[]; // #ride, #GYGYT
  createdAt: string;
  isSaved?: boolean;
}

export interface FeedComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRank: UserRank;
  content: string;
  createdAt: string;
  imageUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'mileage' | 'social' | 'events' | 'legacy';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
  active: boolean;
}

export interface Report {
  id: string;
  targetType: 'post' | 'chat' | 'user';
  targetId: string;
  reportedBy: string;
  reason: string;
  description: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'event_rsvp';
  fromUserId: string;
  fromName: string;
  postId?: string;
  eventId?: string;
  read: boolean;
  createdAt: string;
}
