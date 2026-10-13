// src/lib/api.js
// Axios client cu JWT interceptor + toate API calls organizate pe domenii

import axios from 'axios';

// Derivăm base URL din hostname curent — funcționează atât pe localhost cât și de pe telefon/alt device din rețea
const API_BASE = `http://${window.location.hostname}:8080/api`;

// ── Instanță axios ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: adaugă JWT din localStorage ───────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: 401 → redirect la login (doar portal medic) ───────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      // Nu redirecționăm dacă utilizatorul este în portalul pacientului
      // sau pe o rută publică — redirect-ul e valabil doar pentru portalul medicului
      if (!path.startsWith('/patient') && !path.startsWith('/public')) {
        console.error('[api] 401 pe', error.config?.url, '— redirect la /login');
        localStorage.removeItem('token');
        localStorage.removeItem('cabinet');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ── Cabinet token helpers ────────────────────────────────────────────────────
export const setToken   = (token)   => localStorage.setItem('token', token);
export const getToken   = ()        => localStorage.getItem('token');
export const removeToken = ()       => {
  localStorage.removeItem('token');
  localStorage.removeItem('cabinet');
};

export const getCabinetFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem('cabinet')) ?? null;
  } catch {
    return null;
  }
};

export const saveCabinetToStorage = (cabinet) =>
  localStorage.setItem('cabinet', JSON.stringify(cabinet));

// ── Patient token helpers ────────────────────────────────────────────────────
export const setPatientToken    = (token) => localStorage.setItem('patientToken', token);
export const removePatientToken = ()      => {
  localStorage.removeItem('patientToken');
  localStorage.removeItem('patientAccount');
};

export const getPatientFromStorage  = () => {
  try {
    return JSON.parse(localStorage.getItem('patientAccount')) ?? null;
  } catch {
    return null;
  }
};

export const savePatientToStorage = (patient) =>
  localStorage.setItem('patientAccount', JSON.stringify(patient));

// ── Auth ────────────────────────────────────────────────────────────────────
// POST /auth/login     → { token, cabinet }
// POST /auth/register  → { token, cabinet }
export const authApi = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// ── Cabinet ─────────────────────────────────────────────────────────────────
// GET /cabinet/me  → { id, name, email, phone, address, city, description, smsCredits, plan, rating, reviewCount }
// PUT /cabinet/me  → same shape
export const cabinetApi = {
  getMe:               ()           => api.get('/cabinet/me'),
  updateMe:            (data)       => api.put('/cabinet/me', data),
  updateCoverPhoto:    (coverPhoto)   => api.put('/cabinet/me/cover-photo',   { coverPhoto }),
  updateProfilePhoto:  (profilePhoto) => api.put('/cabinet/me/profile-photo', { profilePhoto }),
  getMyClinic:         ()           => api.get('/cabinet/my-clinic'),
  getMyJoinRequests:   ()           => api.get('/cabinet/my-join-requests'),
  sendJoinRequest:     (data)       => api.post('/cabinet/join-request', data),
};

// ── Reviews ──────────────────────────────────────────────────────────────────
// GET /reviews → [{ id, name, stars, text, date, platform }]
export const reviewsApi = {
  getMyReviews: () => api.get('/reviews'),
};

// ── Patients ────────────────────────────────────────────────────────────────
// GET    /patients              → [Patient]
// GET    /patients/search?q=    → [Patient]
// GET    /patients/{id}         → Patient + appointmentHistory[]
// POST   /patients              → Patient
// PUT    /patients/{id}         → Patient
// DELETE /patients/{id}
export const patientsApi = {
  getAll:    ()          => api.get('/patients'),
  search:    (q)         => api.get('/patients/search', { params: { q } }),
  getById:      (id)        => api.get(`/patients/${id}`),
  getFullHistory: (id)     => api.get(`/patients/${id}/full-history`),
  create:       (data)     => api.post('/patients', data),
  update:       (id, data) => api.put(`/patients/${id}`, data),
  delete:       (id)       => api.delete(`/patients/${id}`),
};

// ── Appointments ─────────────────────────────────────────────────────────────
// GET    /appointments                   → [Appointment]
// GET    /appointments?date=YYYY-MM-DD   → [Appointment] filtrate
// GET    /appointments/today             → [Appointment]
// GET    /appointments/upcoming          → [Appointment] următoarele 7 zile
// GET    /appointments/check-conflict    → { conflict: boolean }
// POST   /appointments                   → Appointment
// PUT    /appointments/{id}              → Appointment
// PUT    /appointments/{id}/status       → Appointment
// DELETE /appointments/{id}
export const appointmentsApi = {
  getAll:         (date)        => api.get('/appointments', { params: date ? { date } : {} }),
  getToday:       ()            => api.get('/appointments/today'),
  getUpcoming:    ()            => api.get('/appointments/upcoming'),
  checkConflict:  (params)      => api.get('/appointments/check-conflict', { params }),
  create:         (data)        => api.post('/appointments', data),
  update:         (id, data)    => api.put(`/appointments/${id}`, data),
  updateStatus:   (id, status)  => api.put(`/appointments/${id}/status`, { status }),
  delete:         (id)          => api.delete(`/appointments/${id}`),
};

// ── Treatment Types ─────────────────────────────────────────────────────────
// GET    /treatment-types       → [TreatmentType]
// POST   /treatment-types       → TreatmentType
// PUT    /treatment-types/{id}  → TreatmentType
// DELETE /treatment-types/{id}
export const treatmentTypesApi = {
  getAll:  ()          => api.get('/treatment-types'),
  create:  (data)      => api.post('/treatment-types', data),
  update:  (id, data)  => api.put(`/treatment-types/${id}`, data),
  delete:  (id)        => api.delete(`/treatment-types/${id}`),
};

// ── Import Agendă ────────────────────────────────────────────────────────────
// POST /import/image   multipart/form-data (field: file) → ImportPreviewResponse
// POST /import/confirm { data, programari }              → { created: N }
const makeFormData = (file) => { const fd = new FormData(); fd.append('file', file); return fd; };

export const importApi = {
  preview:  (file) => api.post('/import/image',           makeFormData(file), { headers: { 'Content-Type': 'multipart/form-data' } }),
  debugOcr: (file) => api.post('/import/image/debug-ocr', makeFormData(file), { headers: { 'Content-Type': 'multipart/form-data' } }),
  confirm:  (data) => api.post('/import/confirm', data),
};

// ── Breaks (schedule pauses) ─────────────────────────────────────────────────
// GET    /breaks          → [Break]
// POST   /breaks          → Break
// PUT    /breaks/{id}     → Break
// DELETE /breaks/{id}
export const breaksApi = {
  getAll:  ()          => api.get('/breaks'),
  create:  (data)      => api.post('/breaks', data),
  update:  (id, data)  => api.put(`/breaks/${id}`, data),
  delete:  (id)        => api.delete(`/breaks/${id}`),
};

// ── Stats ────────────────────────────────────────────────────────────────────
// GET /stats/dashboard → { weeklyAppointments, newPatientsMonth, noShowsMonth,
//                          smsCredits, weeklyAppts[], monthlyTrend[], serviceBreakdown[] }
export const statsApi = {
  getDashboard: () => api.get('/stats/dashboard'),
};

// ── Public Portal ────────────────────────────────────────────────────────────
// Instanță axios separată — folosește patientToken (nu doctor token).
// Evită redirectul la /login al interceptorului doctor când token-ul de doctor
// este prezent în localStorage dar pacientul încearcă să facă o programare.
const publicAxios = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

publicAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('patientToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// GET  /public/cabinets                 → lista cabinete (explorer)
// GET  /public/cabinet/{slug}           → date publice
// GET  /public/cabinet/{slug}/slots     → sloturi disponibile
// POST /public/cabinet/{slug}/book      → programare anonimă/pacient
// POST /public/cabinet/{slug}/review    → recenzie
export const publicApi = {
  getCabinets:  ()             => publicAxios.get('/public/cabinets'),
  getCabinet:   (slug)         => publicAxios.get(`/public/cabinet/${slug}`),
  getSlots:     (slug, date, durationMinutes) => publicAxios.get(`/public/cabinet/${slug}/slots`, { params: { date, ...(durationMinutes ? { durationMinutes } : {}) } }),
  book:         (slug, data)   => publicAxios.post(`/public/cabinet/${slug}/book`, data),
  submitReview: (slug, data)   => publicAxios.post(`/public/cabinet/${slug}/review`, data),
  getReviews:   (slug)         => publicAxios.get(`/public/cabinet/${slug}/reviews`),
};

// ── Stripe ───────────────────────────────────────────────────────────────────
// POST /stripe/setup-intent                    → { clientSecret }  (PUBLIC)
// POST /stripe/payment-methods/setup-intent   → { clientSecret }  (AUTH)
// GET  /stripe/payment-methods                → [PaymentMethodDto]
// PUT  /stripe/payment-methods/{id}/default   → 200
// DELETE /stripe/payment-methods/{id}         → 200
// GET  /stripe/subscription                   → SubscriptionDto
// PUT  /stripe/subscription/plan              → 200
export const stripeApi = {
  // Checkout Session (link/redirect — abordarea principală)
  createRegistrationSession: (successUrl, cancelUrl) =>
    api.post('/stripe/registration-session', { successUrl, cancelUrl }),
  createAddCardSession: (successUrl, cancelUrl) =>
    api.post('/stripe/add-card-session', { successUrl, cancelUrl }),
  finalizeAddCard: (sessionId) =>
    api.post('/stripe/add-card-finalize', { sessionId }),

  // Setup Intent embedded (fallback / compatibilitate)
  createSetupIntent:         ()       => api.post('/stripe/setup-intent'),
  createCustomerSetupIntent: ()       => api.post('/stripe/payment-methods/setup-intent'),

  // Carduri & abonament
  getPaymentMethods:         ()       => api.get('/stripe/payment-methods'),
  setDefaultPaymentMethod:   (pmId)   => api.put(`/stripe/payment-methods/${pmId}/default`),
  detachPaymentMethod:       (pmId)   => api.delete(`/stripe/payment-methods/${pmId}`),
  getSubscription:           ()       => api.get('/stripe/subscription'),
  changePlan:                (plan)   => api.put('/stripe/subscription/plan', { plan }),
};

// ── Clinic Admin ─────────────────────────────────────────────────────────────
// Instanță axios separată — folosește clinicToken din localStorage
const clinicApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

clinicApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clinicToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

export const setClinicToken    = (token) => localStorage.setItem('clinicToken', token);
export const removeClinicToken = ()      => {
  localStorage.removeItem('clinicToken');
  localStorage.removeItem('clinicAccount');
};
export const getClinicFromStorage  = () => {
  try { return JSON.parse(localStorage.getItem('clinicAccount')) ?? null; } catch { return null; }
};
export const saveClinicToStorage = (clinic) =>
  localStorage.setItem('clinicAccount', JSON.stringify(clinic));

// ── Clinic Stripe ─────────────────────────────────────────────────────────────
// POST /stripe/clinic/registration-session  (PUBLIC)
// POST /stripe/clinic/add-card-session      (AUTH)
// POST /stripe/clinic/add-card-finalize     (AUTH)
// GET  /stripe/clinic/payment-methods       (AUTH)
// PUT  /stripe/clinic/payment-methods/{id}/default (AUTH)
// DELETE /stripe/clinic/payment-methods/{id} (AUTH)
// GET  /stripe/clinic/subscription          (AUTH)
export const clinicStripeApi = {
  createRegistrationSession: (successUrl, cancelUrl) =>
    clinicApi.post('/stripe/clinic/registration-session', { successUrl, cancelUrl }),
  createAddCardSession: (successUrl, cancelUrl) =>
    clinicApi.post('/stripe/clinic/add-card-session', { successUrl, cancelUrl }),
  finalizeAddCard: (sessionId) =>
    clinicApi.post('/stripe/clinic/add-card-finalize', { sessionId }),
  getPaymentMethods:       ()      => clinicApi.get('/stripe/clinic/payment-methods'),
  setDefaultPaymentMethod: (pmId)  => clinicApi.put(`/stripe/clinic/payment-methods/${pmId}/default`),
  detachPaymentMethod:     (pmId)  => clinicApi.delete(`/stripe/clinic/payment-methods/${pmId}`),
  getSubscription:         ()      => clinicApi.get('/stripe/clinic/subscription'),
};

// POST /clinic-auth/register  → { token, clinic }
// POST /clinic-auth/login     → { token, clinic }
// GET  /clinic/me             → { id, name, email, ... dentistCount, monthlyTotal }
// GET  /clinic/me/stats       → aggregate + per-dentist stats
// GET  /clinic/me/dentists    → [Cabinet]
// GET  /clinic/me/requests    → [JoinRequest + dentist info]
// PUT  /clinic/me/requests/{id}/approve
// PUT  /clinic/me/requests/{id}/reject
// DELETE /clinic/me/dentists/{cabinetId}
export const clinicAdminApi = {
  register:       (data)  => clinicApi.post('/clinic-auth/register', data),
  login:          (data)  => clinicApi.post('/clinic-auth/login', data),
  getMe:          ()      => clinicApi.get('/clinic/me'),
  updateMe:       (data)  => clinicApi.put('/clinic/me', data),
  getStats:       ()      => clinicApi.get('/clinic/me/stats'),
  getDentists:    ()      => clinicApi.get('/clinic/me/dentists'),
  getRequests:    ()      => clinicApi.get('/clinic/me/requests'),
  approveRequest: (id)    => clinicApi.put(`/clinic/me/requests/${id}/approve`),
  rejectRequest:  (id)    => clinicApi.put(`/clinic/me/requests/${id}/reject`),
  removeDentist:  (cabId) => clinicApi.delete(`/clinic/me/dentists/${cabId}`),
};

// ── Patient Auth ─────────────────────────────────────────────────────────────
// Instanță axios separată — folosește patientToken din localStorage
const patientApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

patientApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('patientToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// POST /patient-auth/register  → { token, patient }
// POST /patient-auth/login     → { token, patient }
// GET  /patient-auth/bookings  → [PatientBookingResponse]
// PUT  /patient-auth/bookings/{id}/cancel
export const patientAuthApi = {
  register:      (data) => patientApi.post('/patient-auth/register', data),
  login:         (data) => patientApi.post('/patient-auth/login', data),
  getBookings:   ()     => patientApi.get('/patient-auth/bookings'),
  cancelBooking: (id)   => patientApi.put(`/patient-auth/bookings/${id}/cancel`),
};

export default api;
