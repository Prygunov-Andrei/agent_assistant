/**
 * Компонент предпросмотра импортируемых данных
 */
import React from 'react';
import type { ImportSession } from '../../../types/bulkImport';
import './BulkImport.css';

interface ImportPreviewProps {
  session: ImportSession;
  onConfirm: () => void;
  onCancel: () => void;
}

const ImportPreview: React.FC<ImportPreviewProps> = ({ session, onConfirm, onCancel }) => {
  const hasErrors = session.invalid_rows > 0;
  const hasDuplicates = session.records_data.preview.some(
    row => row.potential_duplicates.length > 0
  );

  return (
    <div className="import-preview">
      <div className="header">
        <h2>Предпросмотр данных</h2>
        <p className="filename">Файл: {session.original_filename}</p>
      </div>

      <div className="statistics">
        <div className="stat-card">
          <div className="stat-value">{session.total_rows}</div>
          <div className="stat-label">Всего строк</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{session.valid_rows}</div>
          <div className="stat-label">Валидных</div>
        </div>
        {hasErrors && (
          <div className="stat-card error">
            <div className="stat-value">{session.invalid_rows}</div>
            <div className="stat-label">С ошибками</div>
          </div>
        )}
        {hasDuplicates && (
          <div className="stat-card warning">
            <div className="stat-value">
              {session.records_data.preview.filter(r => r.potential_duplicates.length > 0).length}
            </div>
            <div className="stat-label">Возможных дубликатов</div>
          </div>
        )}
      </div>

      {hasErrors && (
        <div className="errors-section">
          <h3>⚠️ Обнаружены ошибки</h3>
          <div className="error-list">
            {session.records_data.errors.map((error) => (
              <div key={error.row_number} className="error-item">
                <strong>Строка {error.row_number}:</strong>
                <ul>
                  {error.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="error-note">
            Строки с ошибками будут пропущены при импорте. 
            Исправьте ошибки в файле и загрузите его заново, или продолжите без этих строк.
          </p>
        </div>
      )}

      {hasDuplicates && (
        <div className="duplicates-info">
          <h3>🔍 Найдены возможные дубликаты</h3>
          <p>
            Система обнаружила {session.records_data.preview.filter(r => r.potential_duplicates.length > 0).length} персон, 
            которые уже могут быть в базе. На следующем шаге вы сможете решить, 
            создать новую запись или обновить существующую.
          </p>
        </div>
      )}

      <div className="preview-table-wrapper">
        <h3>Данные для импорта</h3>
        <table className="preview-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Тип</th>
              <th>ФИО</th>
              <th>Контакты</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {session.records_data.preview
              .filter(row => row.validation_errors.length === 0)
              .slice(0, 20)
              .map((row) => (
                <tr key={row.row_number}>
                  <td>{row.row_number}</td>
                  <td>{row.data.person_type}</td>
                  <td>
                    {row.data.last_name} {row.data.first_name}
                  </td>
                  <td>
                    <div className="contacts-preview">
                      {row.data.phones.length > 0 && (
                        <div>📞 {row.data.phones.join(', ')}</div>
                      )}
                      {row.data.telegrams.length > 0 && (
                        <div>✈️ {row.data.telegrams.join(', ')}</div>
                      )}
                      {row.data.emails.length > 0 && (
                        <div>📧 {row.data.emails.join(', ')}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    {row.potential_duplicates.length > 0 ? (
                      <span className="badge warning">
                        Возможный дубликат
                      </span>
                    ) : (
                      <span className="badge success">
                        Новая
                      </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {session.valid_rows > 20 && (
          <p className="table-note">
            Показаны первые 20 записей из {session.valid_rows}
          </p>
        )}
      </div>

      <div className="footer-actions">
        <button 
          className="btn-secondary" 
          onClick={onCancel}
          type="button"
        >
          Отмена
        </button>
        <button 
          className="btn-primary btn-large"
          onClick={onConfirm}
          disabled={session.valid_rows === 0}
          type="button"
        >
          {hasDuplicates ? 'Продолжить и разрешить дубликаты →' : 'Импортировать →'}
        </button>
      </div>
    </div>
  );
};

export default ImportPreview;

