import firestore from '@react-native-firebase/firestore';
import { StatsSummary } from '../types/models';

export async function getStatsSummary(gymId: string): Promise<StatsSummary | null> {
  const doc = await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('stats')
    .doc('summary')
    .get();

  if (!doc.exists) return null;
  return doc.data() as StatsSummary;
}

/**
 * Real-time listener for the dashboard summary counter
 */
export function subscribeToStatsSummary(
  gymId: string,
  onUpdate: (stats: StatsSummary | null) => void
): () => void {
  return firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('stats')
    .doc('summary')
    .onSnapshot(doc => {
      if (doc && doc.exists) {
        onUpdate(doc.data() as StatsSummary);
      } else {
        onUpdate(null);
      }
    }, error => {
      console.warn('[Stats] Subscription error:', error);
    });
}
