// ──────────────────────────────────────────────
// Core Domain Types — IvoireStream
// ──────────────────────────────────────────────

export type UserRole = 'viewer' | 'creator' | 'admin';

export interface User {
  id: string;
  username: string;
  handle: string;
  avatarEmoji: string;
  bio?: string;
  role: UserRole;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  isFollowing?: boolean;
}

export interface Story {
  id: string;
  user: Pick<User, 'id' | 'username' | 'handle' | 'avatarEmoji'>;
  isLive: boolean;
  isPaid?: boolean;
  ring: 'green' | 'orange' | 'gray';
}

export type StreamVisibility = 'public' | 'private';

export interface LiveStream {
  id: string;
  host: User;
  title: string;
  emoji: string;
  description?: string;
  viewerCount: number;
  isLive: boolean;
  visibility: StreamVisibility;
  priceXOF?: number;       // Price in FCFA for private streams
  category: StreamCategory;
  startedAt: Date;
  gifts: Gift[];
  comments: Comment[];
}

export type StreamCategory =
  | 'music'
  | 'comedy'
  | 'beauty'
  | 'tech'
  | 'cooking'
  | 'sports'
  | 'education'
  | 'lifestyle';

export interface Gift {
  id: string;
  sender: Pick<User, 'id' | 'username'>;
  emoji: string;
  label: string;
  coinsValue: number;
  sentAt: Date;
}

export interface Comment {
  id: string;
  author: Pick<User, 'id' | 'username' | 'avatarEmoji'>;
  text: string;
  sentAt: Date;
}

// ── Wallet ──

export type TransactionType = 'gift_received' | 'private_live' | 'withdrawal';

export interface Transaction {
  id: string;
  type: TransactionType;
  label: string;
  amountXOF: number;       // positive = credit, negative = debit
  date: Date;
  emoji: string;
}

export interface Wallet {
  balanceXOF: number;
  trendPercent: number;
  livesCount: number;
  privateLivesCount: number;
  totalViewers: number;
  transactions: Transaction[];
}

// ── Auth ──

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ── Feed ──

export interface FeedState {
  activeTab: 'forYou' | 'live' | 'subscriptions';
  streams: LiveStream[];
  stories: Story[];
}

// ── Navigation params ──

export type RootStackParams = {
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  '(tabs)': undefined;
  'live/[id]': { id: string };
  'user/[id]': { id: string };
};
