/**
 * Страница настроек
 */
import React, { useState } from 'react';
import BulkImportPage from './BulkImport/BulkImportPage';
import './Settings.css';

type SettingsTab = 'general' | 'import' | 'profile';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('import');

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Настройки</h1>
      </div>

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
          type="button"
        >
          Общие
        </button>
        <button
          className={`settings-tab ${activeTab === 'import' ? 'active' : ''}`}
          onClick={() => setActiveTab('import')}
          type="button"
        >
          Импорт персон
        </button>
        <button
          className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          type="button"
        >
          Профиль
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-section">
            <h2>Общие настройки</h2>
            <p>Раздел в разработке...</p>
          </div>
        )}

        {activeTab === 'import' && (
          <BulkImportPage />
        )}

        {activeTab === 'profile' && (
          <div className="settings-section">
            <h2>Настройки профиля</h2>
            <p>Раздел в разработке...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;

