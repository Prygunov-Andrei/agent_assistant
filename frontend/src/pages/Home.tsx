import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Запросы КД
        </h1>
        <p className="text-xl text-gray-600">
          Управление запросами от кастинг-директоров
        </p>
      </div>

      <div className="text-center py-12">
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card-body">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Раздел в разработке
            </h2>
            <p className="text-gray-600 mb-4">
              Здесь будут отображаться все запросы от кастинг-директоров с возможностью:
            </p>
            <ul className="text-left text-gray-600 space-y-2">
              <li>• Просмотр новых запросов</li>
              <li>• Фильтрация по проектам и типам ролей</li>
              <li>• Управление статусами заявок</li>
              <li>• Отправка предложений артистов</li>
              <li>• Коммуникация с кастинг-директорами</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;