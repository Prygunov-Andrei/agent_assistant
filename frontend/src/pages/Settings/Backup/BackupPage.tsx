/**
 * Страница управления резервными копиями в настройках
 */

import React from 'react';
import { BackupManager } from './BackupManager';
import './BackupPage.css';

export const BackupPage: React.FC = () => {
  return (
    <div className="backup-page">
      <div className="backup-page-header">
        <h1>🔄 Резервное копирование</h1>
        <p className="backup-page-description">
          Управление резервными копиями базы данных с автоматическим хранением на Google Drive
        </p>
      </div>
      
      <div className="backup-page-content">
        <BackupManager />
      </div>
    </div>
  );
};
