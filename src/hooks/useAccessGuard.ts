import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGymStore } from '../store/useGymStore';
import { RootStackParamList } from '../app/navigation/types';
import { isDateInPast } from '../utils/dates';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function useAccessGuard() {
  const navigation = useNavigation<NavProp>();
  const gym = useGymStore((s) => s.gym);
  const isLoadingGym = useGymStore((s) => s.isLoadingGym);

  useEffect(() => {
    if (isLoadingGym || !gym) return;

    if (gym.planStatus === 'expired') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'SubscriptionLock' }],
      });
      return;
    }

    if (gym.planStatus === 'trial' && gym.trialEndsAt) {
      if (isDateInPast(gym.trialEndsAt)) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SubscriptionLock' }],
        });
        return;
      }
    }

    if (gym.planStatus === 'active' && gym.planExpiry) {
      if (isDateInPast(gym.planExpiry)) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SubscriptionLock' }],
        });
        return;
      }
    }
  }, [gym, isLoadingGym, navigation]);

  const isExpired = Boolean(
    gym?.planStatus === 'expired' ||
      (gym?.planStatus === 'trial' && gym?.trialEndsAt && isDateInPast(gym.trialEndsAt)) ||
      (gym?.planStatus === 'active' && gym?.planExpiry && isDateInPast(gym.planExpiry))
  );

  return { isExpired, planStatus: gym?.planStatus, gym };
}
