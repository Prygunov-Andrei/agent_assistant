/**
 * Компонент загрузки файла для импорта
 */
import React, { useState, useCallback } from 'react';
import bulkImportService from '../../../services/bulkImportService';
import type { ImportSession } from '../../../types/bulkImport';
import './BulkImport.css';

interface FileUploaderProps {
  onFileUploaded: (session: ImportSession) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    // Валидация
    if (!file.name.endsWith('.xlsx')) {
      setError('Пожалуйста, загрузите файл в формате .xlsx');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5 МБ');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const session = await bulkImportService.uploadFile(file);
      onFileUploaded(session);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Ошибка при загрузке файла. Проверьте формат и попробуйте снова.';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [onFileUploaded]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="file-uploader">
      <div 
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Загрузка и анализ файла...</p>
          </div>
        ) : (
          <>
            <div className="dropzone-icon">📁</div>
            {isDragActive ? (
              <p>Отпустите файл здесь...</p>
            ) : (
              <>
                <p className="main-text">
                  Перетащите файл Excel сюда
                </p>
                <p className="sub-text">или</p>
                <label htmlFor="file-input" className="btn-select">
                  Выберите файл
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <p className="hint">
                  Поддерживается только формат .xlsx (до 5 МБ)
                </p>
              </>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default FileUploader;

