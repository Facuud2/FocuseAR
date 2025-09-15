import React from 'react';

const GeneralStats = () => {
  const statsData = [
    { value: 478, label: 'Exámenes', color: 'var(--primary-neon-color)' },
    {
      value: 618,
      label: 'Horas de estudio',
      color: 'var(--secondary-neon-color)',
    },
    {
      value: 521,
      label: 'Archivos subidos',
      color: 'var(--tertiary-neon-color)',
    },
    { value: 345, label: 'Recordatorios', color: 'var(--accent-blue)' },
  ];

  return (
    <div className="panel stats-panel grid-span-2">
      <div className="panel-title-container">
        <h3 className="panel-title">General Stats</h3>
        <span className="panel-title-stat">1065</span>
      </div>
      <div className="stats-grid">
        {statsData.slice(0, 4).map((item, index) => (
          <div key={index} className="stat-item">
            <div
              className="stat-circle"
              style={{ borderColor: item.color, color: item.color }}
            >
              {item.value}
            </div>
            <div className="stat-text">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneralStats;
