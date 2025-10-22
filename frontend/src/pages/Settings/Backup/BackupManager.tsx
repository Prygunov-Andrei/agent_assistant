/**
 * Компонент для управления резервными копиями базы данных
 */

import React, { useState, useEffect } from 'react';
import type { BackupRecord, BackupStatistics } from '../../../types/backup';
import { backupService } from '../../../services/backupService';
import { useAuth } from '../../../contexts/AuthContext';
import './BackupManager.css';

interface BackupManagerProps {
  className?: string;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ className }) => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<BackupStatistics | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = backupService.canCreateBackup(user);
  const canDelete = backupService.canDeleteBackup(user);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, backupsData] = await Promise.all([
        backupService.getStatistics(),
        backupService.getBackups()
      ]);
      
      setStatistics(statsData);
      setBackups(backupsData);
    } catch (err) {
      setError('Ошибка загрузки данных о бэкапах');
      console.error('Failed to load backup data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!canCreate) return;
    
    try {
      setCreating(true);
      setError(null);
      
      const newBackup = await backupService.createBackup();
      
      // Обновляем список бэкапов
      setBackups(prev => [newBackup, ...prev]);
      
      // Перезагружаем статистику
      const statsData = await backupService.getStatistics();
      setStatistics(statsData);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания бэкапа');
      console.error('Failed to create backup:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (!canDelete) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить этот бэкап?')) {
      return;
    }
    
    try {
      setError(null);
      
      await backupService.deleteBackup(id);
      
      // Обновляем список бэкапов
      setBackups(prev => prev.filter(backup => backup.id !== id));
      
      // Перезагружаем статистику
      const statsData = await backupService.getStatistics();
      setStatistics(statsData);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления бэкапа');
      console.error('Failed to delete backup:', err);
    }
  };

  if (loading) {
    return (
      <div className={`backup-manager ${className || ''}`}>
        <div className="backup-loading">
          <div className="spinner"></div>
          <p>Загрузка данных о бэкапах...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`backup-manager ${className || ''}`}>

      {error && (
        <div className="backup-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button 
            className="error-close" 
            onClick={() => setError(null)}
            title="Закрыть"
          >
            ×
          </button>
        </div>
      )}

      {/* Статистика */}
      {statistics && (
        <div className="backup-statistics">
          <h3>📊 Статистика</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Последний бэкап:</div>
              <div className="stat-value">
                {statistics.last_backup ? (
                  <>
                    <div>{statistics.last_backup.filename}</div>
                    <div className="stat-meta">
                      {backupService.formatDate(statistics.last_backup.created_at || '')}
                      {statistics.last_backup.file_size_mb && (
                        <span> • {statistics.last_backup.file_size_mb} МБ</span>
                      )}
                    </div>
                  </>
                ) : (
                  'Нет бэкапов'
                )}
              </div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Всего бэкапов:</div>
              <div className="stat-value">{statistics.statistics.total_backups}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Успешных:</div>
              <div className="stat-value success">{statistics.statistics.successful_backups}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">С ошибками:</div>
              <div className="stat-value error">{statistics.statistics.failed_backups}</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-label">Общий размер:</div>
              <div className="stat-value">{statistics.statistics.total_size_mb} МБ</div>
            </div>
          </div>
          
          {/* Информация о локальном хранилище */}
          <div className="storage-info">
            <h4>💾 Локальное хранилище</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Папка:</div>
                <div className="stat-value">{statistics.local_storage.backup_dir}</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Свободно места:</div>
                <div className="stat-value">{statistics.local_storage.free_space_gb} ГБ</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Использовано:</div>
                <div className="stat-value">{statistics.local_storage.used_space_gb} ГБ</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Общий объем:</div>
                <div className="stat-value">{statistics.local_storage.total_space_gb} ГБ</div>
              </div>
            </div>
          </div>
          
          {/* Информация о email */}
          <div className="email-info">
            <h4>📧 Email уведомления</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Статус:</div>
                <div className={`stat-value ${statistics.local_storage.email_enabled ? 'success' : 'error'}`}>
                  {statistics.local_storage.email_enabled ? '✅ Включены' : '❌ Отключены'}
                </div>
              </div>
              
              {statistics.local_storage.email_recipient && (
                <div className="stat-item">
                  <div className="stat-label">Получатель:</div>
                  <div className="stat-value">{statistics.local_storage.email_recipient}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Кнопка создания бэкапа */}
      <div className="backup-actions">
        <button
          className={`create-backup-btn ${!canCreate ? 'disabled' : ''}`}
          onClick={handleCreateBackup}
          disabled={!canCreate || creating}
        >
          {creating ? (
            <>
              <div className="spinner small"></div>
              Создание бэкапа...
            </>
          ) : (
            <>
              🔄 Создать новый бэкап
            </>
          )}
        </button>
        
        {!canCreate && (
          <p className="permission-note">
            Только администраторы могут создавать бэкапы
          </p>
        )}
      </div>

      {/* Список бэкапов */}
      <div className="backup-list">
        <h3>📁 История бэкапов ({backups.filter(backup => backup.status !== 'deleted').length})</h3>
        
        {backups.filter(backup => backup.status !== 'deleted').length === 0 ? (
          <div className="no-backups">
            <p>📭 Нет созданных бэкапов</p>
          </div>
        ) : (
          <div className="backups-grid">
            {backups.filter(backup => backup.status !== 'deleted').map((backup) => (
              <div key={backup.id} className="backup-card">
                <div className="backup-card-header">
                  <div className="backup-status">
                    <span className={`status-icon ${backup.status}`}>
                      {backupService.getStatusIcon(backup.status)}
                    </span>
                    <span className={`status-text ${backup.status}`}>
                      {backup.status_display}
                    </span>
                  </div>
                  
                  {canDelete && backup.status !== 'deleted' && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteBackup(backup.id)}
                      title="Удалить бэкап"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                
                <div className="backup-info">
                  <div className="backup-filename">{backup.filename}</div>
                  
                  <div className="backup-meta">
                    <div className="meta-item">
                      <span className="meta-label">Размер:</span>
                      <span className="meta-value">{backup.file_size_mb} МБ</span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="meta-label">Создан:</span>
                      <span className="meta-value">
                        {backupService.formatDate(backup.created_at)}
                      </span>
                    </div>
                    
                    {backup.created_by && (
                      <div className="meta-item">
                        <span className="meta-label">Автор:</span>
                        <span className="meta-value">{backup.created_by}</span>
                      </div>
                    )}
                    
                    {backup.duration && (
                      <div className="meta-item">
                        <span className="meta-label">Время создания:</span>
                        <span className="meta-value">{backup.duration.toFixed(1)} сек</span>
                      </div>
                    )}
                  </div>
                  
                  {backup.google_drive_url && (
                    <div className="backup-actions-card">
                      <span className="local-file-info">
                        📁 Локальный файл: {backup.google_drive_file_id}
                      </span>
                    </div>
                  )}
                  
                  {backup.error_message && (
                    <div className="backup-error-message">
                      <span className="error-label">Ошибка:</span>
                      <span className="error-text">{backup.error_message}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
