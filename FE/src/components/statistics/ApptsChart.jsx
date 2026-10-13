// src/components/statistics/ApptsChart.jsx

const BAR_AREA_H = 160; // pixel height for bar zone

const ApptsChart = ({ data, title, today }) => {
  const maxVal = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="chart-card">
      <div className="chart-card__title">{title}</div>
      <div className="bar-chart">
        {data.map((item, i) => {
          const barH    = Math.max((item.count / maxVal) * BAR_AREA_H, 4);
          const isToday = item.day === today;
          return (
            <div key={i} className="bar-chart__col">
              <span className="bar-chart__value">{item.count}</span>
              <div
                className={`bar-chart__bar${isToday ? ' bar-chart__bar--today' : ''}`}
                style={{ height: barH }}
                title={`${item.day}: ${item.count} programări`}
              />
              <div className="bar-chart__label">{item.day}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApptsChart;