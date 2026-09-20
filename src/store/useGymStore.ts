import { create } from 'zustand';
import { GymDoc, MembershipPlan, StatsSummary } from '../types/models';
import { getGymDocument } from '../services/gym';
import { getGymPlans } from '../services/plans';
import { getStatsSummary } from '../services/stats';

interface GymState {
  gym: GymDoc | null;
  plans: MembershipPlan[];
  statsSummary: StatsSummary | null;
  isLoadingGym: boolean;
  setGym: (gym: GymDoc | null) => void;
  setPlans: (plans: MembershipPlan[]) => void;
  setStatsSummary: (stats: StatsSummary | null) => void;
  loadGymData: (gymId: string) => Promise<void>;
  resetGym: () => void;
}

export const useGymStore = create<GymState>((set) => ({
  gym: null,
  plans: [],
  statsSummary: null,
  isLoadingGym: false,
  setGym: (gym) => set({ gym }),
  setPlans: (plans) => set({ plans }),
  setStatsSummary: (statsSummary) => set({ statsSummary }),
  loadGymData: async (gymId: string) => {
    set({ isLoadingGym: true });
    try {
      const [gym, plans, statsSummary] = await Promise.all([
        getGymDocument(gymId),
        getGymPlans(gymId),
        getStatsSummary(gymId),
      ]);
      set({ gym, plans, statsSummary, isLoadingGym: false });
    } catch (error) {
      console.warn('[GymStore] Error loading gym data:', error);
      set({ isLoadingGym: false });
    }
  },
  resetGym: () => set({ gym: null, plans: [], statsSummary: null, isLoadingGym: false }),
}));
