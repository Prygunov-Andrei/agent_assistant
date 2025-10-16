import React, { useState } from 'react';

interface ContactsManagerProps {
  type: 'phone' | 'email' | 'telegram';
  contacts: string[];
  onChange: (contacts: string[]) => void;
  maxContacts?: number;
  label?: string;
  placeholder?: string;
}

export const ContactsManager: React.FC<ContactsManagerProps> = ({
  type,
  contacts,
  onChange,
  maxContacts = 5,
  label,
  placeholder
}) => {
  const [newContact, setNewContact] = useState('');

  const getDefaultLabel = () => {
    const labels = {
      phone: 'Телефоны',
      email: 'Email адреса',
      telegram: 'Telegram аккаунты'
    };
    return labels[type];
  };

  const getDefaultPlaceholder = () => {
    const placeholders = {
      phone: '+7 (999) 123-45-67',
      email: 'email@example.com',
      telegram: '@username'
    };
    return placeholders[type];
  };

  const handleAdd = () => {
    const trimmedContact = newContact.trim();
    
    if (!trimmedContact) {
      return;
    }

    // Проверка на дубликат
    if (contacts.includes(trimmedContact)) {
      alert('Этот контакт уже добавлен');
      return;
    }

    // Проверка на максимальное количество
    if (contacts.length >= maxContacts) {
      alert(`Максимум ${maxContacts} контактов`);
      return;
    }

    onChange([...contacts, trimmedContact]);
    setNewContact('');
  };

  const handleRemove = (index: number) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    onChange(updatedContacts);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">
        {label || getDefaultLabel()} {contacts.length > 0 && `(${contacts.length}/${maxContacts})`}
      </label>
      
      {/* Список существующих контактов */}
      {contacts.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {contacts.map((contact, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                marginBottom: '6px'
              }}
            >
              <span style={{ flex: 1, fontSize: '14px', color: '#374151' }}>
                {index === 0 && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      backgroundColor: '#3182ce',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '11px',
                      marginRight: '8px',
                      fontWeight: '600'
                    }}
                  >
                    Основной
                  </span>
                )}
                {contact}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  color: '#dc2626',
                  backgroundColor: 'transparent',
                  border: '1px solid #fca5a5',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fee2e2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Форма добавления нового контакта */}
      {contacts.length < maxContacts && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type={type === 'email' ? 'email' : 'text'}
            value={newContact}
            onChange={(e) => setNewContact(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || getDefaultPlaceholder()}
            className="form-input"
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="btn btn-secondary"
            style={{ whiteSpace: 'nowrap' }}
          >
            + Добавить
          </button>
        </div>
      )}
      
      {contacts.length >= maxContacts && (
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
          Достигнут лимит контактов ({maxContacts})
        </p>
      )}
    </div>
  );
};

