/**
 * Компонент разрешения конфликтов (дубликатов)
 */
import React, { useState, useMemo } from 'react';
import type { ImportSession, ImportDecision } from '../../../types/bulkImport';
import DuplicateCard from './DuplicateCard';
import './BulkImport.css';

interface ConflictResolverProps {
  session: ImportSession;
  onConfirm: (decisions: ImportDecision[]) => void;
  onCancel: () => void;
}

const ConflictResolver: React.FC<ConflictResolverProps> = ({ 
  session, 
  onConfirm, 
  onCancel 
}) => {
  const [decisions, setDecisions] = useState<Map<number, ImportDecision>>(new Map());

  const rowsWithDuplicates = useMemo(() => {
    return session.records_data.preview.filter(
      row => row.potential_duplicates.length > 0 && row.validation_errors.length === 0
    );
  }, [session]);

  const handleDecision = (
    rowNumber: number, 
    action: 'create' | 'update' | 'skip',
    personId?: number
  ) => {
    setDecisions(prev => {
      const newDecisions = new Map(prev);
      newDecisions.set(rowNumber, { 
        row_number: rowNumber, 
        action, 
        person_id: personId 
      });
      return newDecisions;
    });
  };

  const handleConfirm = () => {
    // Собираем все решения
    const allDecisions: ImportDecision[] = [];
    
    // Добавляем решения для строк с дубликатами
    rowsWithDuplicates.forEach(row => {
      if (decisions.has(row.row_number)) {
        allDecisions.push(decisions.get(row.row_number)!);
      }
    });
    
    // Добавляем автоматические решения для строк без дубликатов
    session.records_data.preview.forEach(row => {
      if (
        row.potential_duplicates.length === 0 && 
        row.validation_errors.length === 0 &&
        !decisions.has(row.row_number)
      ) {
        allDecisions.push({
          row_number: row.row_number,
          action: 'create'
        });
      }
    });

    // Добавляем решения для пропуска строк с ошибками
    session.records_data.preview.forEach(row => {
      if (row.validation_errors.length > 0) {
        allDecisions.push({
          row_number: row.row_number,
          action: 'skip'
        });
      }
    });

    onConfirm(allDecisions);
  };

  const allDecided = rowsWithDuplicates.every(row => 
    decisions.has(row.row_number)
  );

  const progress = rowsWithDuplicates.length > 0 
    ? (decisions.size / rowsWithDuplicates.length) * 100 
    : 100;

  if (rowsWithDuplicates.length === 0) {
    // Нет дубликатов, сразу импортируем
    handleConfirm();
    return null;
  }

  return (
    <div className="conflict-resolver">
      <div className="header">
        <h2>Разрешение конфликтов</h2>
        <p>
          Найдено {rowsWithDuplicates.length} записей с возможными дубликатами.
          Пожалуйста, примите решение для каждой записи.
        </p>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-text">
          {decisions.size} / {rowsWithDuplicates.length} решений принято
        </span>
      </div>

      <div className="conflicts-list">
        {rowsWithDuplicates.map(row => {
          const currentDecision = decisions.get(row.row_number);
          
          return (
            <div key={row.row_number} className="conflict-item">
              <div className="new-data-section">
                <h3>Новая персона (строка {row.row_number})</h3>
                <div className="person-info">
                  <div className="info-row">
                    <strong>Тип:</strong> {row.data.person_type}
                  </div>
                  <div className="info-row">
                    <strong>ФИО:</strong> {row.data.last_name} {row.data.first_name}
                  </div>
                  {row.data.phones.length > 0 && (
                    <div className="info-row">
                      <strong>📞 Телефоны:</strong> {row.data.phones.join(', ')}
                    </div>
                  )}
                  {row.data.telegrams.length > 0 && (
                    <div className="info-row">
                      <strong>✈️ Telegram:</strong> {row.data.telegrams.join(', ')}
                    </div>
                  )}
                  {row.data.emails.length > 0 && (
                    <div className="info-row">
                      <strong>📧 Email:</strong> {row.data.emails.join(', ')}
                    </div>
                  )}
                  {row.data.kinopoisk_url && (
                    <div className="info-row">
                      <strong>🎬 Кинопоиск:</strong> 
                      <a 
                        href={row.data.kinopoisk_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {row.data.kinopoisk_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="duplicates-section">
                <h4>Найдены похожие персоны в базе:</h4>
                <div className="duplicates-grid">
                  {row.potential_duplicates.map(duplicate => (
                    <DuplicateCard
                      key={duplicate.person_id}
                      duplicate={duplicate}
                      selected={
                        currentDecision?.action === 'update' &&
                        currentDecision?.person_id === duplicate.person_id
                      }
                      onSelect={() => handleDecision(
                        row.row_number, 
                        'update', 
                        duplicate.person_id
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className={`btn ${currentDecision?.action === 'create' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => handleDecision(row.row_number, 'create')}
                  type="button"
                >
                  ✨ Создать новую персону
                </button>
                <button
                  className={`btn ${currentDecision?.action === 'skip' ? 'btn-warning' : 'btn-outline'}`}
                  onClick={() => handleDecision(row.row_number, 'skip')}
                  type="button"
                >
                  ⏭️ Пропустить
                </button>
              </div>
            </div>
          );
        })}
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
          onClick={handleConfirm}
          disabled={!allDecided}
          type="button"
        >
          Подтвердить и выполнить импорт →
        </button>
      </div>
    </div>
  );
};

export default ConflictResolver;

