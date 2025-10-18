/**
 * Типы для системы резервного копирования (локальное хранение + email)
 */

export interface BackupRecord {
  id: string;
  filename: string;
  file_size: number;
  file_size_mb: number;
  status: 'pending' | 'success' | 'failed' | 'deleted';
  status_display: string;
  google_drive_file_id?: string; // Используется для локального пути
  google_drive_url?: string; // Используется для локального URL
  created_by: string;
  created_at: string;
  completed_at?: string;
  duration?: number;
  error_message?: string;
}

export interface LocalStorageInfo {
  backup_dir: string;
  total_space_gb: number;
  free_space_gb: number;
  used_space_gb: number;
  email_enabled: boolean;
  email_recipient?: string;
}

export interface BackupStatistics {
  last_backup: {
    filename?: string;
    created_at?: string;
    file_size_mb?: number;
    status?: string;
  } | null;
  statistics: {
    total_backups: number;
    successful_backups: number;
    failed_backups: number;
    total_size_mb: number;
  };
  local_storage: LocalStorageInfo;
}

export interface BackupCreateRequest {
  // Пока пустой, но готов для расширения
}

export interface BackupDeleteResponse {
  message: string;
}

export interface BackupError {
  error: string;
}
