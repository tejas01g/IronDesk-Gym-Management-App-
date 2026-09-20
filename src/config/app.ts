export const APP_CONFIG = {
  APP_NAME: 'IronDesk',
  DEVELOPER_UPI_ID: 'irondesk.dev@okhdfcbank', // Put developer UPI ID for founder subscription
  DEVELOPER_NAME: 'IronDesk Founder Offer',
  DEVELOPER_WHATSAPP: '919876543210',
  TRIAL_DAYS: 30,
  SUBSCRIPTION: {
    MONTHLY: {
      id: 'monthly' as const,
      name: 'Monthly Pass',
      price: 499,
      durationDays: 30,
      label: '₹499 / month',
    },
    YEARLY: {
      id: 'yearly' as const,
      name: 'Founder Annual Pass',
      price: 4999,
      durationDays: 365,
      label: '₹4,999 / year',
      badge: 'SAVE 16%',
    },
  },
  DEFAULT_REMINDER_TEMPLATE:
    'Hi {name}, your membership at {gym} is expiring on {expiry}. Please renew your fee of {amount} to continue your workout uninterrupted. Pay directly via UPI: {upi_link}',
  DEFAULT_PLANS: [
    {
      name: '1 Month General',
      durationDays: 30,
      price: 1000,
    },
    {
      name: '3 Months Quarter',
      durationDays: 90,
      price: 2700,
    },
    {
      name: '12 Months Annual',
      durationDays: 365,
      price: 9000,
    },
  ],
  PAGINATION_LIMIT: 20,
  UPCOMING_EXPIRY_DAYS: 7,
};
