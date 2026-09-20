import firestore from '@react-native-firebase/firestore';
import { MembershipPlan } from '../types/models';

export async function getGymPlans(gymId: string): Promise<MembershipPlan[]> {
  const snap = await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('plans')
    .orderBy('createdAt', 'asc')
    .get();

  return snap.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<MembershipPlan, 'id'>),
  }));
}

export async function addGymPlan(
  gymId: string,
  plan: Omit<MembershipPlan, 'id' | 'createdAt'>
): Promise<MembershipPlan> {
  const ref = firestore().collection('gyms').doc(gymId).collection('plans').doc();
  const createdAt = firestore.Timestamp.now();
  const newPlan: Omit<MembershipPlan, 'id'> = {
    name: plan.name.trim(),
    durationDays: Number(plan.durationDays),
    price: Number(plan.price),
    isActive: plan.isActive ?? true,
    createdAt,
  };

  await ref.set(newPlan);
  return { id: ref.id, ...newPlan };
}

export async function updateGymPlan(
  gymId: string,
  planId: string,
  data: Partial<Omit<MembershipPlan, 'id' | 'createdAt'>>
): Promise<void> {
  await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('plans')
    .doc(planId)
    .update(data);
}

/**
 * Checks if any members are currently assigned to this plan before deleting.
 * If members exist, throw an error to block deletion.
 */
export async function deleteGymPlan(gymId: string, planId: string): Promise<void> {
  const membersUsingPlan = await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('members')
    .where('planId', '==', planId)
    .limit(1)
    .get();

  if (!membersUsingPlan.empty) {
    throw new Error('Cannot delete plan: members are currently assigned to this plan. You can deactivate it instead.');
  }

  await firestore()
    .collection('gyms')
    .doc(gymId)
    .collection('plans')
    .doc(planId)
    .delete();
}
