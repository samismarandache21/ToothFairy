// src/pages/patient/ExplorerPage.jsx

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuSearch, LuX, LuBuilding, LuUser, LuStethoscope, LuZap, LuClock, LuCalendarDays } from 'react-icons/lu';
import useExplorer    from '../../hooks/useExplorer';
import PatientTopbar  from '../../components/patient/PatientTopbar';
import DentistCard    from '../../components/patient/DentistCard';
import ClinicCard     from '../../components/patient/ClinicCard';
import usePatientAuth from '../../hooks/usePatientAuth';
import ElasticSlider  from '../../components/ui/ElasticSlider';


import '../../styles/globals.css';
import '../../styles/patient-portal.css';

const ExplorerPage = () => {
  const navigate = useNavigate();
  const { patient } = usePatientAuth();
  const searchRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
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
    filtered,        filteredClinics,
    cities,          specialties,    clinicSpecialties,
    serviceTypes,    serviceType,    setServiceType,
    timeFrom,        setTimeFrom,
    timeTo,          setTimeTo,
    slotDate,        setSlotDate,
    slotDateActive,
    urgencySort,     setUrgencySort,
    slotsFetching,
  } = useExplorer();

  // Generate 30-min time options 00:00–23:30
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    timeOptions.push(`${String(h).padStart(2, '0')}:00`);
    timeOptions.push(`${String(h).padStart(2, '0')}:30`);
  }

  const isClinics = activeTab === 'clinics';
  const resultCount = isClinics ? filteredClinics.length : filtered.length;

  // Close suggestions when clicking outside the search bar
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSuggestionClick = (s) => {
    setShowSuggestions(false);
    clearSearch();
    if (s.type === 'dentist') navigate(`/patient/dentist/${s.slug}`);
    else navigate(`/patient/clinic/${s.slug}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
  };

  return (
    <div className="explorer-page">
      <PatientTopbar patient={patient} />

      <div className="explorer-hero">
        <h1 className="explorer-hero__title">
          {isClinics
            ? <>Găsește <span>cabinetul</span> potrivit</>
            : <>Găsește <span>stomatologul</span> potrivit</>
          }
        </h1>
        <p className="explorer-hero__sub">
          {isClinics
            ? 'Cabinete stomatologice de top, echipe specializate și programări online'
            : 'Cabinetele stomatologice de top, rezervări online în câteva click-uri'
          }
        </p>

        {/* Search bar + autosuggest */}
        <div ref={searchRef} className="explorer-search-wrapper">
          <form className="explorer-search-bar" onSubmit={handleSearchSubmit}>
            <span className="explorer-search-bar__icon">
              <LuSearch size={16} />
            </span>
            <input
              type="text"
              placeholder={isClinics
                ? 'Caută cabinet, specialitate sau oraș...'
                : 'Caută dentist, specialitate sau serviciu...'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => { if (search) setShowSuggestions(true); }}
              autoComplete="off"
            />
            {search && (
              <button
                type="button"
                className="explorer-search-bar__clear"
                onClick={() => { clearSearch(); setShowSuggestions(false); }}
              >
                <LuX size={14} />
              </button>
            )}
            <button type="submit">Caută</button>
          </form>

          {/* Autosuggest dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="search-suggestion-item"
                  onMouseDown={() => handleSuggestionClick(s)}
                >
                  <span className="search-suggestion-item__icon">
                    {s.type === 'clinic' ? <LuBuilding size={14} /> : <LuUser size={14} />}
                  </span>
                  <span className="search-suggestion-item__body">
                    <span className="search-suggestion-item__label">{s.label}</span>
                    <span className="search-suggestion-item__sub">{s.sublabel}</span>
                  </span>
                  <span className={`search-suggestion-item__badge search-suggestion-item__badge--${s.type}`}>
                    {s.type === 'clinic' ? 'Cabinet' : 'Medic'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab toggle */}
        <div className="explorer-tabs">
          <button
            className={`explorer-tab${!isClinics ? ' explorer-tab--active' : ''}`}
            onClick={() => setActiveTab('dentists')}
          >
            <LuStethoscope size={14} style={{ marginRight: 6 }} />
            Stomatologi
          </button>
          <button
            className={`explorer-tab${isClinics ? ' explorer-tab--active' : ''}`}
            onClick={() => setActiveTab('clinics')}
          >
            <LuBuilding size={14} style={{ marginRight: 6 }} />
            Cabinete
          </button>
        </div>
      </div>

      <div className="explorer-body">
        {/* Filters */}
        <div className="explorer-filters">
          <div className="filter-pill">
            <span className="filter-pill__label">Oraș</span>
            <select
              className="filter-pill__select"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-pill">
            <span className="filter-pill__label">Specialitate</span>
            {!isClinics ? (
              <select
                className="filter-pill__select"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                {specialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <select
                className="filter-pill__select"
                value={clinicSpecialty}
                onChange={(e) => setClinicSpecialty(e.target.value)}
              >
                {clinicSpecialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          <div className="filter-pill">
            <span className="filter-pill__label">Serviciu</span>
            <select
              className="filter-pill__select"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              {serviceTypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="filter-price-slider">
            <span className="filter-pill__label" style={{ marginRight: 8 }}>Preț max</span>
            {!isClinics ? (
              <ElasticSlider
                key={`d-${dentistPriceBounds.min}-${dentistPriceBounds.max}`}
                startingValue={dentistPriceBounds.min}
                maxValue={dentistPriceBounds.max}
                defaultValue={priceMax ?? dentistPriceBounds.max}
                isStepped
                stepSize={50}
                onChange={setPriceMax}
              />
            ) : (
              <ElasticSlider
                key={`c-${clinicPriceBounds.min}-${clinicPriceBounds.max}`}
                startingValue={clinicPriceBounds.min}
                maxValue={clinicPriceBounds.max}
                defaultValue={clinicPriceMax ?? clinicPriceBounds.max}
                isStepped
                stepSize={50}
                onChange={setClinicPriceMax}
              />
            )}
          </div>

          {/* Date + time interval filter */}
          <div className={`filter-pill filter-pill--time${slotDateActive ? ' filter-pill--date-active' : ''}`}>
            <LuCalendarDays size={13} style={{ marginRight: 4, color: slotDateActive ? '#6366F1' : '#94A3B8' }} />
            <input
              type="date"
              className="filter-pill__select"
              value={slotDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => e.target.value && setSlotDate(e.target.value)}
              style={{ cursor: 'pointer', minWidth: 130 }}
            />
            <LuClock size={13} style={{ margin: '0 4px 0 8px', color: '#6366F1' }} />
            <select
              className="filter-pill__select"
              value={timeFrom}
              onChange={(e) => setTimeFrom(e.target.value)}
            >
              <option value="">De la</option>
              {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ margin: '0 4px', color: '#94A3B8', fontSize: 12 }}>–</span>
            <select
              className="filter-pill__select"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
            >
              <option value="">Până la</option>
              {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {slotsFetching && (
              <span style={{ marginLeft: 6, fontSize: 11, color: '#94A3B8' }}>se verifică...</span>
            )}
          </div>

          {/* Urgency sort */}
          <button
            className={`filter-pill filter-pill--urgency${urgencySort ? ' filter-pill--urgency-active' : ''}`}
            onClick={() => setUrgencySort((v) => !v)}
            type="button"
          >
            <LuZap size={13} style={{ marginRight: 4 }} />
            Disponibil acum
          </button>
        </div>

        <p className="explorer-results-info">
          {resultCount}{' '}
          {isClinics
            ? resultCount === 1 ? 'cabinet găsit' : 'cabinete găsite'
            : resultCount === 1 ? 'stomatolog găsit' : 'stomatologi găsiți'
          }
          {search && <span className="explorer-results-info__debounce"> · se actualizează...</span>}
        </p>

        {/* key={activeTab} forces remount → re-triggers stagger animation */}
        <div key={activeTab} className="explorer-grid">
          {isClinics ? (
            filteredClinics.length === 0 ? (
              <div className="explorer-empty">
                <div className="explorer-empty__icon"><LuBuilding size={32} color="#CBD5E1" /></div>
                <p className="explorer-empty__text">Niciun cabinet nu corespunde filtrelor selectate.</p>
              </div>
            ) : (
              filteredClinics.map((clinic, i) => (
                <ClinicCard key={clinic.id} clinic={clinic} style={{ '--i': i }} />
              ))
            )
          ) : (
            filtered.length === 0 ? (
              <div className="explorer-empty">
                <div className="explorer-empty__icon"><LuStethoscope size={32} color="#CBD5E1" /></div>
                <p className="explorer-empty__text">Niciun stomatolog nu corespunde filtrelor selectate.</p>
              </div>
            ) : (
              filtered.map((dentist, i) => (
                <DentistCard key={dentist.id} dentist={dentist} style={{ '--i': i }} />
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorerPage;
