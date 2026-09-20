import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Member, Payment, PaymentMode, MemberStatus } from '../types/models';
import { calculateMemberStatus } from '../utils/memberStatus';
import { getMonthKey } from '../utils/dates';
import { APP_CONFIG } from '../config/app';

export interface CollectFeeInput {
  member: Member;
  planId: string;
  planName: string;
  amount: number;
  mode: PaymentMode;
  newExpiryDate: Date;
}

export interface PaymentCursorResult {
  payments: Payment[];
  lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Collect a fee / renew membership:
 * Atomic batched write that writes the payment, updates the member, and increments collected stats.
 */
export async function collectFeeWithStats(
  gymId: string,
  input: CollectFeeInput
): Promise<string> {
  const batch = firestore().batch();
  const now = firestore.Timestamp.now();
  const paymentRef = firestore().collection('gyms').doc(gymId).collection('payments').doc();
  const memberRef = firestore().collection('gyms').doc(gymId).collection('members').doc(input.member.id);
  const statsRef = firestore().collection('gyms').doc(gymId).collection('stats').doc('summary');

  const currentMonthKey = getMonthKey(now.toDate());
  const newStatus: MemberStatus = calculateMemberStatus(input.newExpiryDate);

  // 1. Payment Document
  const paymentData: Omit<Payment, 'id'> = {
    memberId: input.member.id,
    memberName: input.member.name,
    amount: input.amount,
    mode: input.mode,
    status: 'paid',
    planId: input.planId,
    paidAt: now,
    monthKey: currentMonthKey,
    createdAt: now,
  };
  batch.set(paymentRef, paymentData);

  // 2. Member update
  batch.update(memberRef, {
    planId: input.planId,
    planName: input.planName,
    planPrice: input.amount,
    expiryDate: firestore.Timestamp.fromDate(input.newExpiryDate),
    status: newStatus,
    lastPaymentAt: now,
    updatedAt: now,
  });

  // 3. Stats update
  const statsUpdate: Record<string, any> = {
    [`collected.${currentMonthKey}`]: firestore.FieldValue.increment(input.amount),
  };

  // Adjust member status counters if status changed
  const oldStatus = input.member.status;
  if (oldStatus !== newStatus) {
    if (oldStatus === 'expired') {
      statsUpdate.expiredCount = firestore.FieldValue.increment(-1);
    } else if (oldStatus === 'expiring') {
      statsUpdate.expiringCount = firestore.FieldValue.increment(-1);
    } else if (oldStatus === 'active') {
      statsUpdate.activeMembers = firestore.FieldValue.increment(-1);
    }

    if (newStatus === 'active') {
      statsUpdate.activeMembers = firestore.FieldValue.increment(1);
    } else if (newStatus === 'expiring') {
      statsUpdate.expiringCount = firestore.FieldValue.increment(1);
    }
  }

  batch.update(statsRef, statsUpdate);
  await batch.commit();

  return paymentRef.id;
}

/**
 * Get paginated list of payments, optionally filtered by monthKey ("2026-09")
 */
export async function getPaymentsPaginated(
  gymId: string,
  monthKey?: string,
  cursor: FirebaseFirestoreTypes.QueryDocumentSnapshot | null = null,
  pageSize: number = APP_CONFIG.PAGINATION_LIMIT
): Promise<PaymentCursorResult> {
  let query: FirebaseFirestoreTypes.Query = firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('payments');

  if (monthKey) {
    query = query.where('monthKey', '==', monthKey).orderBy('paidAt', 'desc');
  } else {
    query = query.orderBy('paidAt', 'desc');
  }

  if (cursor) {
    query = query.startAfter(cursor);
  }

  query = query.limit(pageSize);
  const snapshot = await query.get();

  const payments: Payment[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Payment, 'id'>),
  }));

  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  const hasMore = snapshot.docs.length === pageSize;

  return { payments, lastDoc, hasMore };
}

/**
 * Fetch all payments for a specific member
 */
export async function getMemberPaymentHistory(
  gymId: string,
  memberId: string
): Promise<Payment[]> {
  const snapshot = await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('payments')
    .where('memberId', '==', memberId)
    .orderBy('paidAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Payment, 'id'>),
  }));
}
