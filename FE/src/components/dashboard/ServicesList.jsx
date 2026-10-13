// src/components/dashboard/ServicesList.jsx

import { useNavigate } from 'react-router-dom';
import { LuStethoscope, LuClock, LuPencil, LuTrash2 } from 'react-icons/lu';
import CardHeader from '../ui/CardHeader';

const ServicesList = ({ services }) => {
  const navigate = useNavigate();

  return (
    <div className="card">
      <CardHeader
        title={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LuStethoscope size={14} color="#2DD4BF" /> Serviciile Mele</span>}
        actionLabel="+ Adaugă serviciu"
        onAction={() => navigate('/services')}
      />
      <div>
        {services.map((svc) => (
          <div key={svc.id} className="service-row">
            <div className="service-row__dot" style={{ background: svc.color }} />
            <div className="service-row__name">{svc.name}</div>
            <div className="service-row__dur">
              <LuClock size={12} style={{ marginRight: 3, color: '#6B7280' }} />
              {svc.duration} min
            </div>
            <div className="service-row__price">{svc.price} RON</div>
            <div className="service-row__actions">
              <button
                className="icon-btn icon-btn--edit"
                title="Editează"
                onClick={() => navigate('/services')}
              >
                <LuPencil size={13} />
              </button>
              <button
                className="icon-btn icon-btn--del"
                title="Șterge"
                onClick={() => navigate('/services')}
              >
                <LuTrash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesList;
