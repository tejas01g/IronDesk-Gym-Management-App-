import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Member, MemberStatus, Payment, PaymentMode } from '../types/models';
import { calculateMemberStatus } from '../utils/memberStatus';
import { getMonthKey } from '../utils/dates';
import { APP_CONFIG } from '../config/app';
import { addDays } from 'date-fns';

export interface AddMemberInput {
  name: string;
  phone: string;
  planId: string;
  planName: string;
  planPrice: number;
  startDate: Date;
  durationDays: number;
  notes?: string;
  feeReceivedNow: boolean;
  paymentMode?: PaymentMode;
}

export interface UpdateMemberInput {
  name?: string;
  phone?: string;
  notes?: string;
}

export interface MemberCursorResult {
  members: Member[];
  lastDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Check if phone number is already registered for this gym
 */
export async function checkPhoneExists(
  gymId: string,
  phone: string,
  excludeMemberId?: string
): Promise<boolean> {
  const cleanPhone = phone.trim();
  let query = firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('members')
    .where('phone', '==', cleanPhone)
    .limit(1);

  const snapshot = await query.get();
  if (snapshot.empty) return false;
  if (excludeMemberId && snapshot.docs[0].id === excludeMemberId) {
    return false;
  }
  return true;
}

/**
 * Add a new member, optional payment, and update stats summary in ONE batched write
 */
export async function addMemberWithStats(
  gymId: string,
  input: AddMemberInput
): Promise<string> {
  const batch = firestore().batch();
  const now = firestore.Timestamp.now();
  const memberRef = firestore().collection('gyms').doc(gymId).collection('members').doc();
  const statsRef = firestore().collection('gyms').doc(gymId).collection('stats').doc('summary');

  const expiryDate = addDays(input.startDate, input.durationDays);
  const status: MemberStatus = calculateMemberStatus(expiryDate);

  const memberData: Omit<Member, 'id'> = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    planId: input.planId,
    planName: input.planName,
    planPrice: input.planPrice,
    startDate: firestore.Timestamp.fromDate(input.startDate),
    expiryDate: firestore.Timestamp.fromDate(expiryDate),
    status,
    notes: input.notes?.trim() || '',
    lastPaymentAt: input.feeReceivedNow ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };

  batch.set(memberRef, memberData);

  const currentMonthKey = getMonthKey(now.toDate());

  // If fee received now, write payment doc
  if (input.feeReceivedNow && input.paymentMode) {
    const paymentRef = firestore().collection('gyms').doc(gymId).collection('payments').doc();
    const paymentData: Omit<Payment, 'id'> = {
      memberId: memberRef.id,
      memberName: input.name.trim(),
      amount: input.planPrice,
      mode: input.paymentMode,
      status: 'paid',
      planId: input.planId,
      paidAt: now,
      monthKey: currentMonthKey,
      createdAt: now,
    };
    batch.set(paymentRef, paymentData);

    // Update stats: collected fee + member counts
    batch.update(statsRef, {
      totalMembers: firestore.FieldValue.increment(1),
      activeMembers: status === 'active' ? firestore.FieldValue.increment(1) : firestore.FieldValue.increment(0),
      expiringCount: status === 'expiring' ? firestore.FieldValue.increment(1) : firestore.FieldValue.increment(0),
      expiredCount: status === 'expired' ? firestore.FieldValue.increment(1) : firestore.FieldValue.increment(0),
      [`collected.${currentMonthKey}`]: firestore.FieldValue.increment(input.planPrice),
    });
  } else {
    // Fee not received yet: increment pending
    batch.update(statsRef, {
      totalMembers: firestore.FieldValue.increment(1),
      activeMembers: status === 'active' ? firestore.FieldValue.increment(1) : firestore.FieldValue.increment(0),
      expiringCount: status === 'expiring' ? firestore.FieldValue.increment(1) : firestore.FieldValue.increment(0),
      expiredCount: status === 'expired' ? firestore.FieldValue.increment(1) : firestore.FieldValue.increment(0),
      [`pending.${currentMonthKey}`]: firestore.FieldValue.increment(input.planPrice),
    });
  }

  await batch.commit();
  return memberRef.id;
}

/**
 * Fetch member details
 */
export async function getMemberById(gymId: string, memberId: string): Promise<Member | null> {
  const doc = await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('members')
    .doc(memberId)
    .get();

  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<Member, 'id'>) };
}

/**
 * Update member details
 */
export async function updateMember(
  gymId: string,
  memberId: string,
  data: UpdateMemberInput
): Promise<void> {
  await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('members')
    .doc(memberId)
    .update({
      ...data,
      updatedAt: firestore.Timestamp.now(),
    });
}

/**
 * Delete a member and atomically decrement stats summary in a batch
 */
export async function deleteMemberWithStats(
  gymId: string,
  member: Member
): Promise<void> {
  const batch = firestore().batch();
  const memberRef = firestore().collection('gyms').doc(gymId).collection('members').doc(member.id);
  const statsRef = firestore().collection('gyms').doc(gymId).collection('stats').doc('summary');

  batch.delete(memberRef);

  const statusDec: Record<string, any> = {
    totalMembers: firestore.FieldValue.increment(-1),
  };
  if (member.status === 'active') {
    statusDec.activeMembers = firestore.FieldValue.increment(-1);
  } else if (member.status === 'expiring') {
    statusDec.expiringCount = firestore.FieldValue.increment(-1);
  } else if (member.status === 'expired') {
    statusDec.expiredCount = firestore.FieldValue.increment(-1);
  }

  batch.update(statsRef, statusDec);
  await batch.commit();
}

/**
 * Paginated query for members with filter chips (All, Active, Expiring, Expired)
 */
export async function getMembersPaginated(
  gymId: string,
  filter: 'all' | MemberStatus,
  cursor: FirebaseFirestoreTypes.QueryDocumentSnapshot | null = null,
  pageSize: number = APP_CONFIG.PAGINATION_LIMIT
): Promise<MemberCursorResult> {
  let query: FirebaseFirestoreTypes.Query = firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('members');

  if (filter !== 'all') {
    query = query.where('status', '==', filter).orderBy('expiryDate', 'asc');
  } else {
    query = query.orderBy('createdAt', 'desc');
  }

  if (cursor) {
    query = query.startAfter(cursor);
  }

  query = query.limit(pageSize);
  const snapshot = await query.get();

  const members: Member[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Member, 'id'>),
  }));

  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  const hasMore = snapshot.docs.length === pageSize;

  return { members, lastDoc, hasMore };
}

/**
 * Dashboard query: top 10 members expiring in 7 days
 */
export async function getExpiringMembers(gymId: string, limitCount: number = 10): Promise<Member[]> {
  const snapshot = await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('members')
    .where('status', '==', 'expiring')
    .orderBy('expiryDate', 'asc')
    .limit(limitCount)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Member, 'id'>),
  }));
}

/**
 * Dashboard query: top 10 overdue / expired members
 */
export async function getOverdueMembers(gymId: string, limitCount: number = 10): Promise<Member[]> {
  const snapshot = await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('members')
    .where('status', '==', 'expired')
    .orderBy('expiryDate', 'asc')
    .limit(limitCount)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Member, 'id'>),
  }));
}
