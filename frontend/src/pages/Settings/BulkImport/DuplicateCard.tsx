/**
 * Карточка похожей персоны (дубликата)
 */
import React from 'react';
import type { PotentialDuplicate } from '../../../types/bulkImport';
import './BulkImport.css';

interface DuplicateCardProps {
  duplicate: PotentialDuplicate;
  selected: boolean;
  onSelect: () => void;
}

const DuplicateCard: React.FC<DuplicateCardProps> = ({ duplicate, selected, onSelect }) => {
  const getMatchScoreColor = (score: number): string => {
    if (score >= 90) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  };

  return (
    <div className={`duplicate-card ${selected ? 'selected' : ''}`}>
      <div className="duplicate-header">
        <div className="duplicate-info">
          {duplicate.existing_data.photo_url && (
            <img 
              src={duplicate.existing_data.photo_url} 
              alt={duplicate.existing_data.full_name}
              className="duplicate-photo"
            />
          )}
          <div>
            <h4>{duplicate.existing_data.full_name}</h4>
            <p className="duplicate-type">{duplicate.existing_data.person_type}</p>
          </div>
        </div>
        <div className={`match-score ${getMatchScoreColor(duplicate.match_score)}`}>
          {duplicate.match_score}%
        </div>
      </div>

      <div className="duplicate-body">
        <div className="match-reasons">
          <strong>Причины совпадения:</strong>
          <ul>
            {duplicate.match_reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>

        <div className="existing-contacts">
          <strong>Существующие контакты:</strong>
          {duplicate.existing_data.phones.length > 0 && (
            <div className="contact-group">
              <span className="contact-label">📞</span>
              <span>{duplicate.existing_data.phones.join(', ')}</span>
            </div>
          )}
          {duplicate.existing_data.telegrams.length > 0 && (
            <div className="contact-group">
              <span className="contact-label">✈️</span>
              <span>{duplicate.existing_data.telegrams.join(', ')}</span>
            </div>
          )}
          {duplicate.existing_data.emails.length > 0 && (
            <div className="contact-group">
              <span className="contact-label">📧</span>
              <span>{duplicate.existing_data.emails.join(', ')}</span>
            </div>
          )}
          {duplicate.existing_data.kinopoisk_url && (
            <div className="contact-group">
              <span className="contact-label">🎬</span>
              <a 
                href={duplicate.existing_data.kinopoisk_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Профиль на Кинопоиске
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="duplicate-footer">
        <button
          className={`btn ${selected ? 'btn-primary' : 'btn-secondary'}`}
          onClick={onSelect}
          type="button"
        >
          {selected ? '✓ Выбрано - Обновить эту персону' : 'Обновить эту персону'}
        </button>
      </div>
    </div>
  );
};

export default DuplicateCard;

