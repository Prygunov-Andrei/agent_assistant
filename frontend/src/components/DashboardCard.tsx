import * as React from 'react';
import { Link } from 'react-router-dom';
import type { DashboardCardProps } from '../types';

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  icon,
  color,
  href
}) => {
  return (
    <Link to={href} className="dashboard-card">
      <div className="dashboard-card-body">
        <div className="dashboard-card-content">
          <div 
            className="dashboard-card-icon"
            style={{ backgroundColor: color }}
          >
            <span className="dashboard-card-icon-text">{icon}</span>
          </div>
          <div className="dashboard-card-text">
            <div className="dashboard-card-category">
              {title}
            </div>
            <div className="dashboard-card-description">
              {description}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DashboardCard;
