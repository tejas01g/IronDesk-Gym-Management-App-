import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'irondesk-storage',
});

export const STORAGE_KEYS = {
  HAS_SEEN_ONBOARDING: 'has_seen_onboarding',
} as const;

export function hasSeenOnboarding(): boolean {
  return storage.getBoolean(STORAGE_KEYS.HAS_SEEN_ONBOARDING) ?? false;
}

export function setHasSeenOnboarding(seen: boolean = true): void {
  storage.set(STORAGE_KEYS.HAS_SEEN_ONBOARDING, seen);
}
