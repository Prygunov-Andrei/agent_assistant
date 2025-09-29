import React from 'react';
import DashboardCard from '../components/DashboardCard';
import { COLORS } from '../constants';

const Home: React.FC = () => {
  const dashboardCards = [
    {
      title: 'Артисты',
      description: 'Управление артистами',
      icon: 'А',
      color: COLORS.primary,
      href: '/artists'
    },
    {
      title: 'Проекты',
      description: 'Управление проектами',
      icon: 'П',
      color: COLORS.success,
      href: '/projects'
    },
    {
      title: 'Компании',
      description: 'Управление компаниями',
      icon: 'К',
      color: COLORS.purple,
      href: '/companies'
    },
    {
      title: 'Заявки',
      description: 'Заявки из Telegram',
      icon: 'З',
      color: COLORS.warning,
      href: '/telegram-requests'
    }
  ];

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Панель управления
        </h1>
        <p className="text-xl text-gray-600">
          Добро пожаловать в систему управления актерским агентством
        </p>
      </div>

      <div className="dashboard-grid">
        {dashboardCards.map((card) => (
          <DashboardCard
            key={card.href}
            title={card.title}
            description={card.description}
            icon={card.icon}
            color={card.color}
            href={card.href}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
