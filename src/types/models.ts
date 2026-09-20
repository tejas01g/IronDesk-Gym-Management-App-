import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type PlanStatus = 'trial' | 'pending_verification' | 'active' | 'expired';
export type SubscriptionPeriod = 'monthly' | 'yearly';
export type MemberStatus = 'active' | 'expiring' | 'expired';
export type PaymentMode = 'cash' | 'upi';
export type PaymentStatus = 'paid' | 'pending';

export interface GymDoc {
  ownerUid: string;
  gymName: string;
  ownerName: string;
  phone: string;
  city: string;
  upiId: string;
  planStatus: PlanStatus;
  trialEndsAt: FirebaseFirestoreTypes.Timestamp | null;
  planExpiry: FirebaseFirestoreTypes.Timestamp | null;
  subscriptionPlan: SubscriptionPeriod | null;
  utr?: string;
  reminderTemplate: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface MembershipPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  isActive: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  planId: string;
  planName: string;
  planPrice: number;
  startDate: FirebaseFirestoreTypes.Timestamp;
  expiryDate: FirebaseFirestoreTypes.Timestamp;
  status: MemberStatus;
  notes?: string;
  lastPaymentAt?: FirebaseFirestoreTypes.Timestamp;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  mode: PaymentMode;
  status: PaymentStatus;
  planId: string;
  paidAt: FirebaseFirestoreTypes.Timestamp;
  monthKey: string; // e.g. "2026-09"
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface AttendanceEntry {
  memberId: string;
  memberName: string;
  present: boolean;
  checkedInAt?: FirebaseFirestoreTypes.Timestamp;
}

export interface StatsSummary {
  totalMembers: number;
  activeMembers: number;
  expiringCount: number;
  expiredCount: number;
  collected: Record<string, number>; // { "2026-09": 38400 }
  pending: Record<string, number>;   // { "2026-09": 9600 }
  presentToday: Record<string, number>; // { "2026-09-20": 37 }
}
