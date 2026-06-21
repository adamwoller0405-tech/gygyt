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
    description: 'Sikeresen teljesítetted az első közös GYGYT Rideout gurulást!',
    iconName: 'Bike',
    category: 'events'
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
    description: 'Már több mint egy éve tekersz a GYGYT Rideout csapatában.',
    iconName: 'ShieldAlert',
    category: 'legacy'
  },
  {
    id: 'social_butterfly',
    title: 'Társaság Lélek',
    description: 'Vegyél részt 5 különböző eseményen.',
    iconName: 'Users',
    category: 'social'
  },
  {
    id: 'night_rider',
    title: 'Éjszakai Tekerő',
    description: 'Csatlakozz egy esti/éjszakai tekeréshez.',
    iconName: 'Moon',
    category: 'events'
  }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_admin',
    name: 'Admin',
    avatarUrl: DEFAULT_AVATAR,
    rank: UserRank.ADMIN,
    age: 0,
    school: 'GYGYT Rideout HQ',
    joinedDate: new Date().toISOString().split('T')[0],
    achievements: [],
    stats: {
      eventsJoined: 0
    }
  }
];

export const INITIAL_JOIN_REQUESTS: JoinRequest[] = [];
export const INITIAL_EVENTS: CyclingEvent[] = [];
export const INITIAL_POSTS: FeedPost[] = [];
export const INITIAL_CHATS: ChatMessage[] = [];
