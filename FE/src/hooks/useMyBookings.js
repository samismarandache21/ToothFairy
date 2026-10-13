// src/hooks/useMyBookings.js

import { useState, useEffect, useCallback } from 'react';
import { patientAuthApi, publicApi, removePatientToken } from '../lib/api';

const isUpcoming = (b) => {
  const apptDate = new Date(`${b.date}T${b.time}`);
  return apptDate >= new Date() && b.status !== 'cancelled';
};

const useMyBookings = () => {
  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);

  const mapBooking = (b) => ({
    ...b,
    dentistName: [b.dentistFirstName, b.dentistLastName].filter(Boolean).join(' ') || b.cabinetName,
    dentistSlug: b.cabinetSlug,
    dentistCity: b.cabinetCity,
    duration:    b.durationMinutes,
    price:       b.price ?? 0,
  });

  const load = useCallback(async () => {
    const token = localStorage.getItem('patientToken');
    if (!token) { setLoading(false); return; }
    try {
      const res = await patientAuthApi.getBookings();
      setBookings(res.data.map(mapBooking));
    } catch (err) {
      if (err?.response?.status === 401) {
        removePatientToken();
        window.location.replace('/patient/login');
        return;
      }
      setBookings([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const upcoming = bookings.filter(isUpcoming);
  const past     = bookings.filter((b) => !isUpcoming(b));

  const cancel = async (id) => {
    await patientAuthApi.cancelBooking(id);
    await load();
  };

  const submitReview = async (id, review) => {
    const booking = bookings.find((b) => b.id === id);
    if (booking) {
      await publicApi.submitReview(booking.cabinetSlug, { ...review, appointmentId: booking.id });
    }
    await load();
  };

  const openReview  = (booking) => setReviewTarget(booking);
  const closeReview = ()        => setReviewTarget(null);

  return {
    upcoming,
    past,
    loading,
    cancel,
    reviewTarget,
    openReview,
    closeReview,
    submitReview,
  };
};

export default useMyBookings;
