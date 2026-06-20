/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, UserRank, CyclingEvent, FeedPost, ChatMessage, JoinRequest, Achievement } from '../types';
import { DEFAULT_AVATAR } from '../lib/defaults';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_ride',
    title: 'Első Tekerés',
    description: 'Sikeresen teljesítetted az első közös GYGYT gurulást!',
    iconName: 'Bike',
    category: 'mileage'
  },
  {
    id: '100_km',
    title: '100 km Klub',
    description: 'Tekerj le összesen legalább 100 kilométert!',
    iconName: 'Award',
    category: 'mileage'
  },
  {
    id: '500_km',
    title: '500 km Klub',
    description: 'Átlépted az 500 kilométeres bűvös határt!',
    iconName: 'Flame',
    category: 'mileage'
  },
  {
    id: '1000_km',
    title: '1000 km Klub',
    description: 'Eszméletlen! 1000 kilométer a GYGYT színeiben!',
    iconName: 'Crown',
    category: 'mileage'
  },
  {
    id: 'event_master',
    title: 'Esemény Mester',
    description: 'Vegyél részt legalább 10 közös eseményen.',
    iconName: 'Calendar',
    category: 'events'
  },
  {
    id: 'photo_master',
    title: 'Fotó Mester',
    description: 'Tölts fel legalább 5 képet a tekerések után.',
    iconName: 'Camera',
    category: 'social'
  },
  {
    id: 'chat_legend',
    title: 'Csevegő Legenda',
    description: 'Legyél az egyik legaktívabb tag a csevegőben.',
    iconName: 'MessageSquare',
    category: 'social'
  },
  {
    id: 'veteran',
    title: 'Veterán Tag',
    description: 'Már több mint egy éve tekersz a GYGYT csapatában.',
    iconName: 'ShieldAlert',
    category: 'legacy'
  }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_admin',
    name: 'Admin',
    avatarUrl: DEFAULT_AVATAR,
    rank: UserRank.ADMIN,
    age: 0,
    school: 'GYGYT HQ',
    joinedDate: new Date().toISOString().split('T')[0],
    achievements: [],
    stats: {
      totalKm: 0,
      eventsJoined: 0,
      elevationGainedM: 0
    }
  }
];

export const INITIAL_JOIN_REQUESTS: JoinRequest[] = [];
export const INITIAL_EVENTS: CyclingEvent[] = [];
export const INITIAL_POSTS: FeedPost[] = [];
export const INITIAL_CHATS: ChatMessage[] = [];
