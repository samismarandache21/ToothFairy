// src/utils/settingsData.js
// Mock settings data — înlocuiește cu API calls când backend-ul e gata

export const ACCOUNT_SETTINGS = {
  firstName:   'Ion',
  lastName:    'Popescu',
  email:       'ion.popescu@cabinet.ro',
  phone:       '0740 123 456',
  cabinetName: 'Cabinet Dr. Popescu',
  city:        'Cluj-Napoca',
  plan:        'pro',
};

export const SMS_SETTINGS = {
  provider:        'esms',        // 'esms' | 'smslink'
  senderId:        'DrPopescu',
  reminderEnabled: true,
  reminderHours:   24,
  controlEnabled:  true,
  controlMonths:   6,
  creditsTotal:    200,
  creditsUsed:     58,
};

export const NOTIFICATION_SETTINGS = {
  newAppointmentEmail: true,
  cancelledEmail:      true,
  dailySummaryEmail:   false,
  lowCreditsSms:       true,
  lowCreditsThreshold: 20,
};
