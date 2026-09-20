import { format, addDays, isPast, isToday, differenceInDays } from 'date-fns';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type AnyDate = Date | FirebaseFirestoreTypes.Timestamp | number | null | undefined;

export function toJsDate(date: AnyDate): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'number') return new Date(date);
  if (typeof (date as FirebaseFirestoreTypes.Timestamp).toDate === 'function') {
    return (date as FirebaseFirestoreTypes.Timestamp).toDate();
  }
  return new Date();
}

export function formatDate(date: AnyDate, formatStr: string = 'dd MMM yyyy'): string {
  if (!date) return '-';
  return format(toJsDate(date), formatStr);
}

export function formatDateTime(date: AnyDate, formatStr: string = 'dd MMM yyyy, hh:mm a'): string {
  if (!date) return '-';
  return format(toJsDate(date), formatStr);
}

export function getMonthKey(date: AnyDate = new Date()): string {
  return format(toJsDate(date), 'yyyy-MM');
}

export function getTodayDateKey(date: AnyDate = new Date()): string {
  return format(toJsDate(date), 'yyyy-MM-dd');
}

export function addDaysToDate(date: AnyDate, days: number): Date {
  return addDays(toJsDate(date), days);
}

export function isDateInPast(date: AnyDate): boolean {
  if (!date) return false;
  const d = toJsDate(date);
  if (isToday(d)) return false;
  return isPast(d);
}

export function getDaysDifference(targetDate: AnyDate, fromDate: AnyDate = new Date()): number {
  return differenceInDays(toJsDate(targetDate), toJsDate(fromDate));
}
