import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';
import { MemberStatus } from '../types/models';
import { AnyDate, toJsDate } from './dates';

/**
 * Calculates member status based on expiry:
 * - Active: expiry > now + 7 days
 * - Expiring: expiry is within next 7 days (including today)
 * - Expired: expiry is before today
 */
export function calculateMemberStatus(expiryDate: AnyDate): MemberStatus {
  if (!expiryDate) return 'expired';
  const expiry = startOfDay(toJsDate(expiryDate));
  const today = startOfDay(new Date());

  const diffDays = differenceInCalendarDays(expiry, today);

  if (diffDays < 0) {
    return 'expired';
  } else if (diffDays <= 7) {
    return 'expiring';
  } else {
    return 'active';
  }
}

/**
 * On renewal:
 * - If member is still active (expiry > today), new expiry = old expiry + plan duration
 * - If expired, new expiry = today + duration
 */
export function calculateNewExpiry(
  currentExpiry: AnyDate,
  durationDays: number,
  isRenewal: boolean = false
): Date {
  const today = startOfDay(new Date());

  if (isRenewal && currentExpiry) {
    const expiry = startOfDay(toJsDate(currentExpiry));
    if (differenceInCalendarDays(expiry, today) >= 0) {
      // Still active, extend from current expiry
      return addDays(expiry, durationDays);
    }
  }

  // New member or already expired, start from today
  return addDays(today, durationDays);
}

/**
 * Returns human readable countdown / expiry status:
 * e.g. "Expires in 3 days", "Expired 5 days ago", "Expires today"
 */
export function getExpiryCountdownText(expiryDate: AnyDate): string {
  if (!expiryDate) return 'No expiry date';
  const expiry = startOfDay(toJsDate(expiryDate));
  const today = startOfDay(new Date());
  const diff = differenceInCalendarDays(expiry, today);

  if (diff < 0) {
    const daysAgo = Math.abs(diff);
    return `Expired ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
  } else if (diff === 0) {
    return 'Expires today';
  } else if (diff === 1) {
    return 'Expires tomorrow';
  } else {
    return `Expires in ${diff} days`;
  }
}
