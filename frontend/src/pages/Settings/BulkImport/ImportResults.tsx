/**
 * Компонент отображения результатов импорта
 */
import React from 'react';
import type { ImportResult } from '../../../types/bulkImport';
import './BulkImport.css';

interface ImportResultsProps {
  results: ImportResult;
  onStartOver: () => void;
}

const ImportResults: React.FC<ImportResultsProps> = ({ results, onStartOver }) => {
  const isSuccess = results.statistics.errors === 0;
  const totalProcessed = 
    results.statistics.created + 
    results.statistics.updated + 
    results.statistics.skipped + 
    results.statistics.errors;

  return (
    <div className="import-results">
      <div className={`header ${isSuccess ? 'success' : 'partial-success'}`}>
        {isSuccess ? (
          <>
            <div className="success-icon">✅</div>
            <h2>Импорт завершен успешно!</h2>
          </>
        ) : (
          <>
            <div className="warning-icon">⚠️</div>
            <h2>Импорт завершен с ошибками</h2>
          </>
        )}
      </div>

      <div className="statistics-grid">
        <div className="stat-card large success">
          <div className="stat-value">{results.statistics.created}</div>
          <div className="stat-label">Создано персон</div>
        </div>
        <div className="stat-card large info">
          <div className="stat-value">{results.statistics.updated}</div>
          <div className="stat-label">Обновлено персон</div>
        </div>
        <div className="stat-card large">
          <div className="stat-value">{results.statistics.skipped}</div>
          <div className="stat-label">Пропущено</div>
        </div>
        {results.statistics.errors > 0 && (
          <div className="stat-card large error">
            <div className="stat-value">{results.statistics.errors}</div>
            <div className="stat-label">Ошибок</div>
          </div>
        )}
      </div>

      <div className="details-section">
        <h3>Детали импорта</h3>
        <div className="details-table-wrapper">
          <table className="details-table">
            <thead>
              <tr>
                <th>Строка</th>
                <th>Действие</th>
                <th>Персона</th>
                <th>Результат</th>
              </tr>
            </thead>
            <tbody>
              {results.details.map((detail, idx) => (
                <tr key={idx} className={detail.action}>
                  <td>{detail.row_number}</td>
                  <td>
                    {detail.action === 'created' && '✨ Создано'}
                    {detail.action === 'updated' && '🔄 Обновлено'}
                    {detail.action === 'skipped' && '⏭️ Пропущено'}
                    {detail.action === 'error' && '❌ Ошибка'}
                  </td>
                  <td>
                    {detail.full_name || '-'}
                    {detail.person_id && (
                      <span className="person-id"> (ID: {detail.person_id})</span>
                    )}
                  </td>
                  <td>
                    {detail.error ? (
                      <span className="error-text">{detail.error}</span>
                    ) : (
                      <span className="success-text">Успешно</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isSuccess && results.statistics.errors > 0 && (
        <div className="error-summary">
          <h4>⚠️ Внимание</h4>
          <p>
            При импорте возникли ошибки. Пожалуйста, проверьте детали выше 
            и при необходимости исправьте данные в файле.
          </p>
        </div>
      )}

      <div className="footer-actions">
        <button 
          className="btn-primary btn-large"
          onClick={onStartOver}
          type="button"
        >
          Импортировать еще файл
        </button>
      </div>
    </div>
  );
};

export default ImportResults;

