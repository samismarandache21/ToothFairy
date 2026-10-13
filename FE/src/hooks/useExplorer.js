// src/hooks/useExplorer.js

import { useState, useMemo, useEffect, useCallback } from 'react';
import { publicApi } from '../lib/api';

const ALL_CITIES_LABEL      = 'Toate orașele';
const ALL_SPECIALTIES_LABEL = 'Toate specialitățile';
const DEFAULT_PRICE_MAX     = 1500;

const pad2 = (n) => String(n).padStart(2, '0');

const nextWeekdayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const computePriceBounds = (cabList, specFilter) => {
  const prices = [];
  cabList.forEach((c) => {
    if (specFilter && specFilter !== ALL_SPECIALTIES_LABEL) {
      const specs = (() => { try { return JSON.parse(c.specialties ?? '[]'); } catch { return []; } })();
      if (!specs.includes(specFilter)) return;
    }
    (c.services ?? []).forEach((s) => {
      const p = Number(s.price);
      if (!isNaN(p) && p > 0) prices.push(p);
    });
  });
  if (prices.length === 0) return { min: 0, max: DEFAULT_PRICE_MAX };
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

// Returns today's date as YYYY-MM-DD
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

// Returns current time as HH:MM
const nowHHMM = () => {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

// Filters out past slots when the requested date is today
const validSlots = (slots, date) =>
  date === todayISO() ? slots.filter((s) => s > nowHHMM()) : slots;

// Earliest valid slot across all group members; returns null if none
const getEarliestSlot = (members, cache, date) => {
  let earliest = null;
  members.forEach((m) => {
    const slots = validSlots(cache[m.slug ?? m.id] ?? [], date ?? todayISO());
    if (slots.length > 0 && (earliest === null || slots[0] < earliest)) {
      earliest = slots[0];
    }
  });
  return earliest;
};

const useExplorer = () => {
  const [cabinets,  setCabinets]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTabRaw] = useState(
    () => sessionStorage.getItem('explorerTab') ?? 'dentists'
  );

  const setActiveTab = (tab) => {
    sessionStorage.setItem('explorerTab', tab);
    setActiveTabRaw(tab);
  };

  const [search,          setSearch]          = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [city,            setCity]            = useState(ALL_CITIES_LABEL);
  const [specialty,       setSpecialty]       = useState(ALL_SPECIALTIES_LABEL);
  const [clinicSpecialty, setClinicSpecialty] = useState(ALL_SPECIALTIES_LABEL);

  const [priceMax,       setPriceMax]       = useState(null);
  const [clinicPriceMax, setClinicPriceMax] = useState(null);
  const [serviceType,    setServiceType]    = useState(ALL_SPECIALTIES_LABEL);

  // Time-range filter + date
  const [timeFrom,       setTimeFrom]       = useState('');
  const [timeTo,         setTimeTo]         = useState('');
  const [slotDateRaw,    setSlotDateRaw]    = useState(nextWeekdayISO);
  const [slotDateActive, setSlotDateActive] = useState(false);

  // Wrap setter so selecting a date activates the date filter
  const setSlotDate = useCallback((d) => {
    setSlotDateRaw(d);
    setSlotDateActive(true);
  }, []);

  const slotDate = slotDateRaw;

  // Urgency sort toggle
  const [urgencySort, setUrgencySort] = useState(false);

  // Slots cache: { [date]: { [slug]: string[] } }
  const [slotsCacheByDate, setSlotsCacheByDate] = useState({});
  const [slotsFetching,    setSlotsFetching]    = useState(false);

  // Convenience: slots for the currently selected date
  const slotsCache = slotsCacheByDate[slotDate] ?? {};

  // Fetch at mount
  useEffect(() => {
    publicApi.getCabinets()
      .then((res) => {
        const mapped = res.data.map((c) => {
          const specs = (() => { try { return JSON.parse(c.specialties ?? '[]'); } catch { return []; } })();
          return {
            ...c,
            title:      'Dr.',
            specialty:  specs[0] ?? '',
            services:   c.services ?? [],
            priceRange: '',
            promoted:   c.plan === 'premium' || c.plan === 'pro',
            promotionTier: c.plan === 'premium' ? 2 : c.plan === 'pro' ? 1 : 0,
          };
        });
        setCabinets(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch slots for all cabinets for a specific date
  const fetchSlots = useCallback((cabList, date) => {
    if (cabList.length === 0) return;
    setSlotsFetching(true);
    Promise.allSettled(
      cabList.map((c) => {
        const slug = c.slug ?? c.id;
        return publicApi.getSlots(slug, date)
          .then((res) => [slug, res.data ?? []])
          .catch(() => [slug, []]);
      })
    ).then((results) => {
      const patch = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          const [slug, slots] = r.value;
          patch[slug] = slots;
        }
      });
      setSlotsCacheByDate((prev) => ({
        ...prev,
        [date]: { ...(prev[date] ?? {}), ...patch },
      }));
      setSlotsFetching(false);
    });
  }, []);

  // Fetch for selected date (time-range / date filter)
  useEffect(() => {
    if (!timeFrom && !timeTo && !slotDateActive) return;
    if (cabinets.length === 0) return;
    const dateCache = slotsCacheByDate[slotDate] ?? {};
    const missing = cabinets.filter((c) => !((c.slug ?? c.id) in dateCache));
    if (missing.length > 0) fetchSlots(missing, slotDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFrom, timeTo, slotDate, slotDateActive, cabinets.length]);

  // When urgencySort is on, fetch next 7 days so we can find the true nearest slot
  useEffect(() => {
    if (!urgencySort || cabinets.length === 0) return;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const dateCache = slotsCacheByDate[iso] ?? {};
      const missing = cabinets.filter((c) => !((c.slug ?? c.id) in dateCache));
      if (missing.length > 0) fetchSlots(missing, iso);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urgencySort, cabinets.length]);

  // Debounce 2s for grid
  useEffect(() => {
    if (!search) { setDebouncedSearch(''); return; }
    const t = setTimeout(() => setDebouncedSearch(search), 2000);
    return () => clearTimeout(t);
  }, [search]);

  const [suggestionQuery, setSuggestionQuery] = useState('');
  useEffect(() => {
    if (!search) { setSuggestionQuery(''); return; }
    const t = setTimeout(() => setSuggestionQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const cities = useMemo(() => {
    const set = new Set(cabinets.map((c) => c.city).filter(Boolean));
    return [ALL_CITIES_LABEL, ...Array.from(set).sort()];
  }, [cabinets]);

  const specialties = useMemo(() => {
    const set = new Set();
    cabinets.forEach((c) => {
      try { JSON.parse(c.specialties ?? '[]').forEach((s) => set.add(s)); } catch { /* ignore */ }
    });
    return [ALL_SPECIALTIES_LABEL, ...Array.from(set).sort()];
  }, [cabinets]);

  const serviceTypes = useMemo(() => {
    const set = new Set();
    cabinets.forEach((c) => {
      (c.services ?? []).forEach((s) => { if (s.name) set.add(s.name); });
    });
    return [ALL_SPECIALTIES_LABEL, ...Array.from(set).sort()];
  }, [cabinets]);

  const dentistPriceBounds = useMemo(
    () => computePriceBounds(cabinets, specialty),
    [cabinets, specialty]
  );
  const clinicPriceBounds = useMemo(
    () => computePriceBounds(cabinets, clinicSpecialty),
    [cabinets, clinicSpecialty]
  );

  useEffect(() => { setPriceMax(dentistPriceBounds.max); }, [dentistPriceBounds.max]);
  useEffect(() => { setClinicPriceMax(clinicPriceBounds.max); }, [clinicPriceBounds.max]);

  const suggestions = useMemo(() => {
    const q = suggestionQuery.toLowerCase().trim();
    if (!q) return [];
    const results = [];
    cabinets.forEach((c) => {
      const fullName       = `${c.firstName} ${c.lastName}`.trim();
      const cabSpecialties = (() => { try { return JSON.parse(c.specialties ?? '[]'); } catch { return []; } })();
      if (
        c.name.toLowerCase().includes(q) ||
        fullName.toLowerCase().includes(q) ||
        (c.city ?? '').toLowerCase().includes(q) ||
        cabSpecialties.some((s) => s.toLowerCase().includes(q))
      ) {
        results.push({
          type:     'dentist',
          label:    c.name,
          sublabel: `${cabSpecialties[0] ?? 'Cabinet'} · ${c.city ?? ''}`,
          slug:     c.slug ?? c.id,
        });
      }
    });
    return results.slice(0, 8);
  }, [cabinets, suggestionQuery]);

  const filterCabinets = (cabList, cityFilter, specFilter, maxPrice, q, svcType) => {
    return cabList
      .filter((c) => {
        if (q) {
          const fullName = `${c.firstName} ${c.lastName}`.trim().toLowerCase();
          const cabSpecs = (() => { try { return JSON.parse(c.specialties ?? '[]'); } catch { return []; } })();
          const matches  =
            c.name.toLowerCase().includes(q) ||
            fullName.includes(q) ||
            (c.city ?? '').toLowerCase().includes(q) ||
            cabSpecs.some((s) => s.toLowerCase().includes(q));
          if (!matches) return false;
        }
        if (cityFilter !== ALL_CITIES_LABEL && c.city !== cityFilter) return false;
        if (specFilter !== ALL_SPECIALTIES_LABEL) {
          const cabSpecs = (() => { try { return JSON.parse(c.specialties ?? '[]'); } catch { return []; } })();
          if (!cabSpecs.includes(specFilter)) return false;
        }
        if (svcType && svcType !== ALL_SPECIALTIES_LABEL) {
          const hasService = (c.services ?? []).some((s) => s.name === svcType);
          if (!hasService) return false;
        }
        if (maxPrice != null) {
          const services        = c.services ?? [];
          const pricedServices  = services.filter((s) => s.price != null && Number(s.price) > 0);
          if (pricedServices.length > 0) {
            const hasAffordable = pricedServices.some((s) => Number(s.price) <= maxPrice);
            if (!hasAffordable) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (b.promotionTier !== a.promotionTier) return b.promotionTier - a.promotionTier;
        return Number(b.rating) - Number(a.rating);
      });
  };

  const q                    = debouncedSearch.toLowerCase().trim();
  const filteredBase         = filterCabinets(cabinets, city, specialty,       priceMax,       q, serviceType);
  const filteredClinicsBase  = filterCabinets(cabinets, city, clinicSpecialty, clinicPriceMax, q, serviceType);

  // Finds the absolute nearest slot for a cabinet across the next 7 days
  const getNearestSlot = useCallback((slugOrId) => {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const slots = validSlots(slotsCacheByDate[iso]?.[slugOrId] ?? [], iso);
      if (slots.length > 0) return { date: iso, time: slots[0] };
    }
    return null;
  }, [slotsCacheByDate]);

  // Apply date/time/urgency filter to dentists list
  const filtered = useMemo(() => {
    let result = filteredBase;
    const hasTimeRange = timeFrom || timeTo;
    const needsSlots   = hasTimeRange || urgencySort || slotDateActive;

    if (needsSlots) {
      const getValid = (c) => validSlots(slotsCache[c.slug ?? c.id] ?? [], slotDate);

      if (hasTimeRange) {
        result = result.filter((c) => {
          return getValid(c).some((s) => {
            if (timeFrom && s < timeFrom) return false;
            if (timeTo   && s >= timeTo)  return false;
            return true;
          });
        });
      } else if (slotDateActive) {
        result = result.filter((c) => getValid(c).length > 0);
      }

      if (urgencySort) {
        const DAY_LABELS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
        result = [...result]
          .map((c) => {
            const nearest = getNearestSlot(c.slug ?? c.id);
            const sortKey = nearest ? `${nearest.date} ${nearest.time}` : '9999-99-99 99:99';
            const d = nearest ? new Date(nearest.date) : null;
            const label = nearest
              ? (nearest.date === todayISO() ? nearest.time : `${DAY_LABELS[d.getDay()]} ${nearest.time}`)
              : null;
            return { ...c, _sortKey: sortKey, earliestSlot: label };
          })
          .sort((a, b) => {
            if (a._sortKey !== b._sortKey) return a._sortKey < b._sortKey ? -1 : 1;
            if (b.promotionTier !== a.promotionTier) return b.promotionTier - a.promotionTier;
            return Number(b.rating) - Number(a.rating);
          })
          .map(({ _sortKey, ...c }) => c);
      } else {
        result = result.map((c) => {
          const slot = getValid(c)[0] ?? null;
          if (!slot) return { ...c, earliestSlot: null };
          const DAY_LABELS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
          const d = new Date(slotDate);
          const label = slotDate === todayISO() ? slot : `${DAY_LABELS[d.getDay()]} ${slot}`;
          return { ...c, earliestSlot: label };
        });
      }
    }

    return result;
  }, [filteredBase, timeFrom, timeTo, urgencySort, slotsCache, slotsCacheByDate, slotDateActive, slotDate, getNearestSlot]);

  // ── Group filtered clinics by clinicAccountId ───────────────────────────────
  const groupedClinics = useMemo(() => {
    const clinicGroups = new Map(); // clinicAccountId → group
    const solo         = [];        // individual cabinets not in any clinic

    filteredClinicsBase.forEach((c) => {
      if (c.clinicAccountId) {
        const key = c.clinicAccountId;
        if (!clinicGroups.has(key)) {
          clinicGroups.set(key, { ...c, dentistCount: 1, members: [c] });
        } else {
          const g = clinicGroups.get(key);
          g.dentistCount++;
          g.members.push(c);
          if (
            c.promotionTier > g.promotionTier ||
            (c.promotionTier === g.promotionTier && Number(c.rating) > Number(g.rating))
          ) {
            const saved = { dentistCount: g.dentistCount, members: g.members };
            clinicGroups.set(key, { ...c, ...saved });
          }
        }
      } else {
        solo.push({ ...c, dentistCount: 1, members: [c] });
      }
    });

    return [...Array.from(clinicGroups.values()), ...solo];
  }, [filteredClinicsBase]);

  // ── Apply date / time / urgency on grouped clinics ──────────────────────────
  const filteredGroupedClinics = useMemo(() => {
    let result = groupedClinics;
    const hasTimeRange = timeFrom || timeTo;
    const needsSlots   = hasTimeRange || urgencySort || slotDateActive;

    if (needsSlots) {
      const groupValidSlots = (group) =>
        group.members.flatMap((m) => validSlots(slotsCache[m.slug ?? m.id] ?? [], slotDate));

      if (hasTimeRange) {
        result = result.filter((group) =>
          groupValidSlots(group).some((slot) => {
            if (timeFrom && slot < timeFrom) return false;
            if (timeTo   && slot >= timeTo)  return false;
            return true;
          })
        );
      } else if (slotDateActive) {
        result = result.filter((group) => groupValidSlots(group).length > 0);
      }
      // urgencySort alone: no filtering — just sort

      if (urgencySort) {
        const DAY_LABELS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
        result = [...result]
          .map((g) => {
            // Find nearest slot across next 7 days for any member of this group
            let nearest = null;
            const today = new Date();
            for (let i = 0; i < 7; i++) {
              const d = new Date(today);
              d.setDate(today.getDate() + i);
              const iso = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
              const slot = getEarliestSlot(g.members, slotsCacheByDate[iso] ?? {}, iso);
              if (slot) { nearest = { date: iso, time: slot, day: d }; break; }
            }
            const sortKey = nearest ? `${nearest.date} ${nearest.time}` : '9999-99-99 99:99';
            const label = nearest
              ? (nearest.date === todayISO() ? nearest.time : `${DAY_LABELS[nearest.day.getDay()]} ${nearest.time}`)
              : null;
            return { ...g, _sortKey: sortKey, earliestSlot: label };
          })
          .sort((a, b) => {
            if (a._sortKey !== b._sortKey) return a._sortKey < b._sortKey ? -1 : 1;
            if (b.promotionTier !== a.promotionTier) return b.promotionTier - a.promotionTier;
            return Number(b.rating) - Number(a.rating);
          })
          .map(({ _sortKey, ...g }) => g);
      } else {
        result = result.map((g) => {
          const slot = getEarliestSlot(g.members, slotsCache, slotDate);
          if (!slot) return { ...g, earliestSlot: null };
          const DAY_LABELS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
          const d = new Date(slotDate);
          const label = slotDate === todayISO() ? slot : `${DAY_LABELS[d.getDay()]} ${slot}`;
          return { ...g, earliestSlot: label };
        });
      }
    }

    return result;
  }, [groupedClinics, timeFrom, timeTo, urgencySort, slotsCache, slotsCacheByDate, slotDateActive, slotDate, getNearestSlot]);

  const clearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setSuggestionQuery('');
  };

  return {
    activeTab,       setActiveTab,
    search,          setSearch,      clearSearch,
    suggestions,
    city,            setCity,
    specialty,       setSpecialty,
    clinicSpecialty, setClinicSpecialty,
    priceMax,        setPriceMax,
    clinicPriceMax,  setClinicPriceMax,
    dentistPriceBounds,
    clinicPriceBounds,
    filtered,
    filteredClinics:        filteredGroupedClinics,
    filteredGroupedClinics,
    cities,
    specialties,
    clinicSpecialties: specialties,
    serviceTypes,
    serviceType,     setServiceType,
    timeFrom,        setTimeFrom,
    timeTo,          setTimeTo,
    slotDate,        setSlotDate,
    slotDateActive,
    urgencySort,     setUrgencySort,
    slotsFetching,
    loading,
  };
};

export default useExplorer;
