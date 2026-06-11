import type { User, Story, LiveStream, Transaction, Wallet } from '../types';

// ── Users ──────────────────────────────────────────────────────────

export const MOCK_ME: User = {
  id: 'me',
  username: 'Kouadio Tech 🇨🇮',
  handle: '@ivorian_creator',
  avatarEmoji: '👨🏾‍💻',
  bio: 'Afro-tech & Live Streaming. Daily lives 20h GMT 🔥',
  role: 'creator',
  isVerified: true,
  followersCount: 1_200_000,
  followingCount: 450,
  likesCount: 8_500_000,
};

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    username: 'Adjoa Beauté',
    handle: '@adjoa_beauty',
    avatarEmoji: '👸',
    role: 'creator',
    isVerified: true,
    followersCount: 245_000,
    followingCount: 120,
    likesCount: 1_200_000,
    isFollowing: true,
  },
  {
    id: 'u2',
    username: 'Kouassi DJ',
    handle: '@kouassi_dj',
    avatarEmoji: '🎤',
    role: 'creator',
    isVerified: false,
    followersCount: 89_000,
    followingCount: 300,
    likesCount: 450_000,
    isFollowing: false,
  },
  {
    id: 'u3',
    username: 'Fatou Cook',
    handle: '@fatou_cuisine',
    avatarEmoji: '👩',
    role: 'creator',
    isVerified: true,
    followersCount: 120_000,
    followingCount: 200,
    likesCount: 780_000,
    isFollowing: true,
  },
  {
    id: 'u4',
    username: 'DJ Amani',
    handle: '@dj_amani',
    avatarEmoji: '🎧',
    role: 'creator',
    isVerified: true,
    followersCount: 380_000,
    followingCount: 80,
    likesCount: 2_100_000,
    isFollowing: false,
  },
  {
    id: 'u5',
    username: 'Yao Photos',
    handle: '@yao_lens',
    avatarEmoji: '📸',
    role: 'creator',
    isVerified: false,
    followersCount: 45_000,
    followingCount: 600,
    likesCount: 180_000,
    isFollowing: false,
  },
];

// ── Stories ────────────────────────────────────────────────────────

export const MOCK_STORIES: Story[] = [
  {
    id: 's1',
    user: MOCK_USERS[0],
    isLive: true,
    ring: 'green',
  },
  {
    id: 's2',
    user: MOCK_USERS[1],
    isLive: true,
    isPaid: true,
    ring: 'orange',
  },
  {
    id: 's3',
    user: MOCK_USERS[2],
    isLive: true,
    ring: 'green',
  },
  {
    id: 's4',
    user: MOCK_USERS[4],
    isLive: false,
    ring: 'gray',
  },
];

// ── Live Streams ────────────────────────────────────────────────────

export const MOCK_STREAMS: LiveStream[] = [
  {
    id: 'ls1',
    host: MOCK_USERS[0],
    title: 'Afro-tech & beauté 🌿',
    emoji: '🎤',
    description: 'Nouveau produit naturel ivoirien — on test en direct !',
    viewerCount: 1_241,
    isLive: true,
    visibility: 'public',
    category: 'beauty',
    startedAt: new Date(Date.now() - 1000 * 60 * 34),
    gifts: [
      {
        id: 'g1',
        sender: { id: 'u10', username: 'Ibrahim' },
        emoji: '⭐',
        label: 'Ibrahim +500C',
        coinsValue: 500,
        sentAt: new Date(),
      },
      {
        id: 'g2',
        sender: { id: 'u11', username: 'Awa' },
        emoji: '🌹',
        label: 'Awa +100C',
        coinsValue: 100,
        sentAt: new Date(),
      },
    ],
    comments: [
      {
        id: 'c1',
        author: { id: 'u10', username: 'Koffi', avatarEmoji: '👦' },
        text: 'Afro-tech to the world 🔥',
        sentAt: new Date(),
      },
      {
        id: 'c2',
        author: { id: 'u11', username: 'Yasmine', avatarEmoji: '📸' },
        text: "L'ambiance est incroyable ❤️",
        sentAt: new Date(),
      },
      {
        id: 'c3',
        author: { id: 'u12', username: 'Moussa', avatarEmoji: '🎧' },
        text: 'Envoyez les cœurs 🇨🇮',
        sentAt: new Date(),
      },
    ],
  },
  {
    id: 'ls2',
    host: MOCK_USERS[3],
    title: 'Session AfroBeats exclusive 🎵',
    emoji: '🎧',
    description: 'Mix privé — accès sur paiement',
    viewerCount: 340,
    isLive: true,
    visibility: 'private',
    priceXOF: 2_000,
    category: 'music',
    startedAt: new Date(Date.now() - 1000 * 60 * 15),
    gifts: [],
    comments: [],
  },
  {
    id: 'ls3',
    host: MOCK_USERS[1],
    title: 'Freestyle vendredi 🎤',
    emoji: '🎤',
    description: 'Open-mic depuis Cocody',
    viewerCount: 892,
    isLive: true,
    visibility: 'public',
    category: 'music',
    startedAt: new Date(Date.now() - 1000 * 60 * 62),
    gifts: [],
    comments: [],
  },
  {
    id: 'ls4',
    host: MOCK_USERS[2],
    title: 'Attiéké spécial mariage 👰',
    emoji: '🍛',
    description: 'Recette secrète de grand-maman',
    viewerCount: 2_100,
    isLive: true,
    visibility: 'public',
    category: 'cooking',
    startedAt: new Date(Date.now() - 1000 * 60 * 20),
    gifts: [],
    comments: [],
  },
];

// ── Past Lives (for profile) ────────────────────────────────────────

export const MOCK_PAST_LIVES = [
  { id: 'pl1', emoji: '🎤', viewCount: 14_200 },
  { id: 'pl2', emoji: '💻', viewCount: 8_500 },
  { id: 'pl3', emoji: '📸', viewCount: 21_000 },
  { id: 'pl4', emoji: '🎧', viewCount: 6_100 },
];

// ── Wallet ──────────────────────────────────────────────────────────

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    type: 'gift_received',
    label: 'Cadeaux reçus',
    amountXOF: 12_500,
    date: new Date(),
    emoji: '🎁',
  },
  {
    id: 't2',
    type: 'private_live',
    label: 'Live privé × 34',
    amountXOF: 17_000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24),
    emoji: '🔒',
  },
  {
    id: 't3',
    type: 'withdrawal',
    label: 'Retrait Wave',
    amountXOF: -50_000,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22),
    emoji: '💸',
  },
];

export const MOCK_WALLET: Wallet = {
  balanceXOF: 350_000,
  trendPercent: 15,
  livesCount: 42,
  privateLivesCount: 8,
  totalViewers: 1_200,
  transactions: MOCK_TRANSACTIONS,
};

// ── Helpers ─────────────────────────────────────────────────────────

export function formatXOF(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(1)}M FCFA`;
  if (abs >= 1_000)     return `${(abs / 1_000).toFixed(0)} 000 FCFA`;
  return `${abs} FCFA`;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1)  return "À l'instant";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  return `${Math.floor(hrs / 24)}j`;
}
