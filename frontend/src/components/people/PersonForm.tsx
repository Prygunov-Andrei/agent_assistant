import React, { useState } from 'react';
import type { Person, PersonFormData } from '../../types/people';
import { ContactsManager } from './ContactsManager';

interface PersonFormProps {
  initialData?: Person;
  personType: 'director' | 'producer' | 'casting_director';
  onSubmit: (data: PersonFormData) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
  children?: React.ReactNode;
}

export const PersonForm: React.FC<PersonFormProps> = ({
  initialData,
  personType,
  onSubmit,
  onCancel,
  mode,
  children
}) => {
  const [formData, setFormData] = useState<PersonFormData>({
    person_type: personType,
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    middle_name: initialData?.middle_name || '',
    // Множественные контакты
    phones: initialData?.phones || [],
    emails: initialData?.emails || [],
    telegram_usernames: initialData?.telegram_usernames || [],
    bio: initialData?.bio || '',
    birth_date: initialData?.birth_date || '',
    nationality: initialData?.nationality || '',
    website: initialData?.website || '',
    kinopoisk_url: initialData?.kinopoisk_url || '',
    awards: initialData?.awards || '',
    social_media: initialData?.social_media || {}
  });
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialData?.photo || null
  );
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  const getPersonTypeLabel = () => {
    const labels = {
      director: 'Режиссера',
      producer: 'Продюсера',
      casting_director: 'Кастинг-директора'
    };
    return labels[personType];
  };
  
  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
          {mode === 'create' ? `Создать ${getPersonTypeLabel()}` : `Редактировать ${getPersonTypeLabel()}`}
        </h2>
      </div>
      
      {/* Фото */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
          Фотография
        </label>
        <div style={{ 
          width: '128px', 
          height: '128px', 
          borderRadius: '50%', 
          overflow: 'hidden', 
          backgroundColor: '#f3f4f6',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {photoPreview ? (
            <img src={photoPreview} alt="Превью" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
              Нет фото
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          style={{ fontSize: '13px' }}
        />
      </div>
      
      {/* ФИО */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Фамилия *</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            required
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Имя</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Отчество</label>
          <input
            type="text"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>
      </div>
      
      {/* Контакты - множественные */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '16px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
          Контактная информация
        </h3>
        
        <ContactsManager
          type="phone"
          contacts={formData.phones || []}
          onChange={(phones) => setFormData(prev => ({ ...prev, phones }))}
        />
        
        <ContactsManager
          type="email"
          contacts={formData.emails || []}
          onChange={(emails) => setFormData(prev => ({ ...prev, emails }))}
        />
        
        <ContactsManager
          type="telegram"
          contacts={formData.telegram_usernames || []}
          onChange={(telegram_usernames) => setFormData(prev => ({ ...prev, telegram_usernames }))}
        />
      </div>
      
      {/* Дополнительные поля */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Дата рождения</label>
          <input
            type="date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Национальность</label>
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            className="form-input"
          />
        </div>
      </div>
      
      {/* Ссылки */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Личный сайт</label>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="https://example.com"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Кинопоиск</label>
          <input
            type="url"
            name="kinopoisk_url"
            value={formData.kinopoisk_url}
            onChange={handleInputChange}
            placeholder="https://kinopoisk.ru/..."
            className="form-input"
          />
        </div>
      </div>
      
      {/* Биография */}
      <div className="form-group">
        <label className="form-label">Биография</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          rows={4}
          className="form-input"
          style={{ resize: 'vertical' }}
        />
      </div>
      
      {/* Награды */}
      <div className="form-group">
        <label className="form-label">Награды и достижения</label>
        <textarea
          name="awards"
          value={formData.awards}
          onChange={handleInputChange}
          rows={3}
          className="form-input"
          style={{ resize: 'vertical' }}
        />
      </div>
      
      {/* Дополнительный контент (например, управление проектами) */}
      {children && (
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          {children}
        </div>
      )}
      
      {/* Кнопки */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="btn btn-primary"
        >
          {mode === 'create' ? 'Создать' : 'Сохранить'}
        </button>
      </div>
    </form>
  );
};
