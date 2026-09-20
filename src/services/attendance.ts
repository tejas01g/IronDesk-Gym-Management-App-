import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { AttendanceEntry } from '../types/models';

/**
 * Toggle check-in attendance for a member on a given date.
 * Batched write synchronizes the entry and the stats/summary present count.
 */
export async function toggleAttendanceWithStats(
  gymId: string,
  dateKey: string, // "yyyy-MM-dd"
  memberId: string,
  memberName: string,
  present: boolean
): Promise<void> {
  const batch = firestore().batch();
  const entryRef = firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('attendance')
    .doc(dateKey)
    .collection('entries')
    .doc(memberId);

  const statsRef = firestore().collection('gyms').doc(gymId).collection('stats').doc('summary');

  if (present) {
    const entryData: AttendanceEntry = {
      memberId,
      memberName,
      present: true,
      checkedInAt: firestore.Timestamp.now(),
    };
    batch.set(entryRef, entryData);
    batch.update(statsRef, {
      [`presentToday.${dateKey}`]: firestore.FieldValue.increment(1),
    });
  } else {
    batch.delete(entryRef);
    batch.update(statsRef, {
      [`presentToday.${dateKey}`]: firestore.FieldValue.increment(-1),
    });
  }

  await batch.commit();
}

/**
 * Get all attendance records for a specific date
 */
export async function getAttendanceForDate(
  gymId: string,
  dateKey: string
): Promise<Record<string, AttendanceEntry>> {
  const snapshot = await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('attendance')
    .doc(dateKey)
    .collection('entries')
    .get();

  const entries: Record<string, AttendanceEntry> = {};
  snapshot.docs.forEach(doc => {
    entries[doc.id] = doc.data() as AttendanceEntry;
  });
  return entries;
}

/**
 * Real-time listener for attendance entries on a given date (e.g. today)
 */
export function subscribeToAttendance(
  gymId: string,
  dateKey: string,
  onUpdate: (entries: Record<string, AttendanceEntry>) => void
): () => void {
  return firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('attendance')
    .doc(dateKey)
    .collection('entries')
    .onSnapshot(snapshot => {
      const entries: Record<string, AttendanceEntry> = {};
      if (snapshot) {
        snapshot.docs.forEach(doc => {
          entries[doc.id] = doc.data() as AttendanceEntry;
        });
      }
      onUpdate(entries);
    }, error => {
      console.warn('[Attendance] Subscription error:', error);
    });
}
