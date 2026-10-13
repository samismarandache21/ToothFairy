// src/hooks/useSettings.js

import { useState, useEffect } from 'react';
import { cabinetApi } from '../lib/api';
import { useDoctor } from '../contexts/DoctorContext';

const DEFAULT_SMS_SETTINGS = {
  provider:        'esms',
  senderId:        '',
  reminderEnabled: true,
  reminderHours:   24,
  controlEnabled:  true,
  controlMonths:   6,
};

const DEFAULT_NOTIFICATION_SETTINGS = {
  newAppointmentEmail: true,
  cancelledEmail:      true,
  dailySummaryEmail:   false,
  lowCreditsSms:       true,
  lowCreditsThreshold: 20,
};

const CREDITS_TOTAL = 200;

const useSettings = () => {
  const [account,       setAccount]       = useState({ firstName: '', lastName: '', email: '', phone: '', cabinetName: '', address: '', city: '', plan: '' });
  const [sms,           setSms]           = useState(DEFAULT_SMS_SETTINGS);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATION_SETTINGS);
  const [activeTab,     setActiveTab]     = useState('account');
  const [saved,         setSaved]         = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [smsCredits,    setSmsCredits]    = useState(0);

  const { doctor, refreshDoctor } = useDoctor();

  useEffect(() => {
    cabinetApi.getMe().then((res) => {
      const c = res.data;
      setAccount({
        firstName:   c.firstName  ?? '',
        lastName:    c.lastName   ?? '',
        email:       c.email      ?? '',
        phone:       c.phone      ?? '',
        cabinetName: c.name       ?? '',
        address:     c.address    ?? '',
        city:        c.city       ?? '',
        plan:        c.plan       ?? 'starter',
      });
      setSms(JSON.parse(c.smsSettings          ?? 'null') ?? DEFAULT_SMS_SETTINGS);
      setNotifications(JSON.parse(c.notificationSettings ?? 'null') ?? DEFAULT_NOTIFICATION_SETTINGS);
      setSmsCredits(c.smsCredits ?? 0);
    }).finally(() => setLoading(false));
  }, []);

  const updateAccount = (field, value) =>
    setAccount((prev) => ({ ...prev, [field]: value }));

  const updateSms = (field, value) =>
    setSms((prev) => ({ ...prev, [field]: value }));

  const updateNotif = (field, value) =>
    setNotifications((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (activeTab === 'account') {
      await cabinetApi.updateMe({
        firstName: account.firstName,
        lastName:  account.lastName,
        phone:     account.phone,
        name:      account.cabinetName,
        address:   account.address,
        city:      account.city,
      });
    } else if (activeTab === 'sms') {
      await cabinetApi.updateMe({ smsSettings: JSON.stringify(sms) });
    } else if (activeTab === 'notifications') {
      await cabinetApi.updateMe({ notificationSettings: JSON.stringify(notifications) });
    }
    await refreshDoctor();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const creditsPct = Math.round((smsCredits / CREDITS_TOTAL) * 100);

  return {
    doctor,
    account,
    sms,
    notifications,
    activeTab,
    setActiveTab,
    saved,
    loading,
    creditsPct,
    updateAccount,
    updateSms,
    updateNotif,
    handleSave,
  };
};

export default useSettings;
