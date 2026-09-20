import { create } from 'zustand';
import { FirebaseAuthTypes } from '../services/firebase';
import { signOutUser } from '../services/auth';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  confirmation: FirebaseAuthTypes.ConfirmationResult | null;
  status: 'initializing' | 'authenticated' | 'unauthenticated';
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  setConfirmation: (confirmation: FirebaseAuthTypes.ConfirmationResult | null) => void;
  setStatus: (status: 'initializing' | 'authenticated' | 'unauthenticated') => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  confirmation: null,
  status: 'initializing',
  setUser: (user) =>
    set({
      user,
      status: user ? 'authenticated' : 'unauthenticated',
    }),
  setConfirmation: (confirmation) => set({ confirmation }),
  setStatus: (status) => set({ status }),
  logout: async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('[AuthStore] Sign out error:', e);
    }
    set({ user: null, confirmation: null, status: 'unauthenticated' });
  },
}));
