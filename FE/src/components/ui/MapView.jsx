// src/components/ui/MapView.jsx
// OpenStreetMap iframe embed cu Nominatim geocoding — debounced 600ms

import { useState, useEffect } from 'react';

const MapView = ({ address, city, label, height = 280 }) => {
  const [coords,  setCoords]  = useState(null);
  const [error,   setError]   = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = [address, city].filter(Boolean).join(', ').trim();
    if (!query) { setCoords(null); setError(false); return; }

    setLoading(true);
    setError(false);
    setCoords(null);

    const timer = setTimeout(() => {
      // Structured query so Nominatim doesn't confuse city with county name
      const params = new URLSearchParams({ format: 'json', limit: '1', countrycodes: 'ro' });
      if (address) params.set('street', address);
      if (city)    params.set('city',   city);
      if (!address && !city) params.set('q', query);

      fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        { headers: { 'Accept-Language': 'ro,en' } }
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.length > 0) setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
          else setError(true);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }, 600);

    return () => { clearTimeout(timer); setLoading(false); };
  }, [address, city]);

  const hasAddress = !!(address || city);

  if (!hasAddress) return <div style={emptyStyle(height)}><span style={msgStyle}>Adaugă adresa pentru a vedea harta</span></div>;
  if (loading)     return <div style={emptyStyle(height)}><span style={msgStyle}>Se încarcă harta...</span></div>;
  if (error || !coords) return <div style={emptyStyle(height)}><span style={msgStyle}>Locația nu a putut fi găsită pe hartă.</span></div>;

  const { lat, lon } = coords;
  const delta = 0.005;
  const bbox  = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const src   = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB', height }}>
      <iframe
        title={label ?? 'Locație cabinet'}
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0, display: 'block' }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

const emptyStyle = (height) => ({
  height, borderRadius: 12, border: '1px solid #E5E7EB',
  background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center',
});
const msgStyle = { color: '#94A3B8', fontSize: 13 };

export default MapView;
