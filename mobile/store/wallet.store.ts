import { create } from 'zustand';
import type { Wallet } from '../types';
import { MOCK_WALLET } from '../constants/mock-data';

interface WalletStore {
  wallet: Wallet;
  setWallet: (wallet: Wallet) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  wallet: MOCK_WALLET,
  setWallet: (wallet) => set({ wallet }),
}));
