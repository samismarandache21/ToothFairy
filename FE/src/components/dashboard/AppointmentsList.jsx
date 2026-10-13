// src/components/dashboard/AppointmentsList.jsx

import { useNavigate } from 'react-router-dom';
import { LuCalendarDays, LuStethoscope } from 'react-icons/lu';
import CardHeader from '../ui/CardHeader';

const AppointmentsList = ({ appointments, statusLabel }) => {
  const navigate = useNavigate();

  return (
    <div className="card">
      <CardHeader
        title={<span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><LuCalendarDays size={15} color="#2DD4BF" /> Programări Astăzi</span>}
        actionLabel="Vezi toate →"
        onAction={() => navigate('/calendar')}
      />
      <div>
        {appointments.map((appt) => {
          const s = statusLabel[appt.status] || statusLabel.pending;
          return (
            <div
              key={appt.id}
              className="appt-item"
              onClick={() => navigate('/calendar')}
            >
              <div className="appt-item__time-col">
                <div className="appt-item__time">{appt.time}</div>
                <div className="appt-item__dur">{appt.duration} min</div>
              </div>
              <div className="appt-item__bar" style={{ background: appt.color }} />
              <div className="appt-item__info">
                <div className="appt-item__name">{appt.patient}</div>
                <div className="appt-item__type">
                  <LuStethoscope size={12} style={{ marginRight: 4, verticalAlign: 'middle', color: '#2DD4BF' }} />
                  {appt.type}
                </div>
              </div>
              <span className={`appt-item__status ${s.css}`}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AppointmentsList;
