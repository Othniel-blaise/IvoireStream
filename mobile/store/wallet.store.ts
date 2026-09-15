import { create } from 'zustand';
import type { Wallet, Transaction } from '../types';
import { apiGet } from '../lib/api';

const EMPTY_WALLET: Wallet = {
  balanceXOF: 0,
  trendPercent: 0,
  livesCount: 0,
  privateLivesCount: 0,
  totalViewers: 0,
  transactions: [],
};

interface WalletStore {
  wallet:      Wallet;
  isLoading:   boolean;
  fetchWallet: () => Promise<void>;
  setWallet:   (wallet: Wallet) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  wallet:    EMPTY_WALLET,
  isLoading: false,

  fetchWallet: async () => {
    set({ isLoading: true });
    const res = await apiGet<{ wallet: Omit<Wallet, 'transactions'> & { transactions: (Omit<Transaction, 'date'> & { date: string })[] } }>('/api/wallet');
    if (res.success && res.data) {
      const w = res.data.wallet;
      set({ wallet: { ...w, transactions: w.transactions.map(t => ({ ...t, date: new Date(t.date) })) } });
    }
    set({ isLoading: false });
  },

  setWallet: (wallet) => set({ wallet }),
}));
