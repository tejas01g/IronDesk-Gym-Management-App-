import firestore from '@react-native-firebase/firestore';
import { GymDoc, MembershipPlan, PlanStatus, SubscriptionPeriod, StatsSummary } from '../types/models';
import { APP_CONFIG } from '../config/app';
import { addDays } from 'date-fns';

export interface CreateGymInput {
  gymName: string;
  ownerName: string;
  phone: string;
  city: string;
  upiId: string;
}

export interface InitialPlanInput {
  name: string;
  durationDays: number;
  price: number;
}

/**
 * Fetch gym document for owner
 */
export async function getGymDocument(gymId: string): Promise<GymDoc | null> {
  const doc = await firestore().collection('gyms').doc(gymId).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data() as GymDoc;
}

/**
 * One atomic batched write to initialize gym document, default membership plans, and stats summary
 */
export async function createGymWithPlans(
  gymId: string,
  gymInput: CreateGymInput,
  plans: InitialPlanInput[]
): Promise<void> {
  const batch = firestore().batch();
  const now = firestore.Timestamp.now();

  // 1. Gym Document
  const gymRef = firestore().collection('gyms').doc(gymId);
  const gymData: GymDoc = {
    ownerUid: gymId,
    gymName: gymInput.gymName.trim(),
    ownerName: gymInput.ownerName.trim(),
    phone: gymInput.phone.trim(),
    city: gymInput.city.trim(),
    upiId: gymInput.upiId.trim(),
    planStatus: 'trial', // initial pending plan selection
    trialEndsAt: null,
    planExpiry: null,
    subscriptionPlan: null,
    reminderTemplate: APP_CONFIG.DEFAULT_REMINDER_TEMPLATE,
    createdAt: now,
    updatedAt: now,
  };
  batch.set(gymRef, gymData);

  // 2. Membership Plans
  const plansCol = gymRef.collection('plans');
  plans.forEach(p => {
    const planRef = plansCol.doc();
    const planData: Omit<MembershipPlan, 'id'> = {
      name: p.name.trim(),
      durationDays: Number(p.durationDays),
      price: Number(p.price),
      isActive: true,
      createdAt: now,
    };
    batch.set(planRef, planData);
  });

  // 3. Stats Summary document
  const statsRef = gymRef.collection('stats').doc('summary');
  const initialStats: StatsSummary = {
    totalMembers: 0,
    activeMembers: 0,
    expiringCount: 0,
    expiredCount: 0,
    collected: {},
    pending: {},
    presentToday: {},
  };
  batch.set(statsRef, initialStats);

  await batch.commit();
}

/**
 * Activate 30-day free trial
 */
export async function activateFreeTrial(gymId: string): Promise<void> {
  const now = new Date();
  const trialEnd = addDays(now, APP_CONFIG.TRIAL_DAYS);

  await firestore().collection('gyms').doc(gymId).update({
    planStatus: 'trial' as PlanStatus,
    trialEndsAt: firestore.Timestamp.fromDate(trialEnd),
    updatedAt: firestore.Timestamp.now(),
  });
}

/**
 * Submit UTR reference for Founder Subscription (sets pending_verification)
 */
export async function submitFounderSubscriptionUtr(
  gymId: string,
  subscriptionPlan: SubscriptionPeriod,
  utr: string
): Promise<void> {
  await firestore().collection('gyms').doc(gymId).update({
    planStatus: 'pending_verification' as PlanStatus,
    subscriptionPlan,
    utr: utr.trim(),
    updatedAt: firestore.Timestamp.now(),
  });
}

/**
 * Update general gym profile
 */
export async function updateGymProfile(
  gymId: string,
  data: Partial<Pick<GymDoc, 'gymName' | 'ownerName' | 'city' | 'upiId' | 'reminderTemplate'>>
): Promise<void> {
  await firestore().collection('gyms').doc(gymId).update({
    ...data,
    updatedAt: firestore.Timestamp.now(),
  });
}
