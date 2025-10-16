import React, { useState } from 'react';

interface PersonContactsProps {
  // Новые поля - массивы контактов
  phones?: string[];
  emails?: string[];
  telegram_usernames?: string[];
  // Старые поля для обратной совместимости
  phone?: string | null;
  email?: string | null;
  telegram?: string | null;
  // Режим отображения
  compact?: boolean; // По умолчанию true - показывать только первый + счетчик
}

export const PersonContacts: React.FC<PersonContactsProps> = ({ 
  phones = [],
  emails = [],
  telegram_usernames = [],
  phone, 
  email, 
  telegram,
  compact = true
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Используем новые поля или fallback на старые
  const allPhones = phones.length > 0 ? phones : (phone ? [phone] : []);
  const allEmails = emails.length > 0 ? emails : (email ? [email] : []);
  const allTelegrams = telegram_usernames.length > 0 ? telegram_usernames : (telegram ? [telegram] : []);
  
  const hasAnyContact = allPhones.length > 0 || allEmails.length > 0 || allTelegrams.length > 0;
  
  if (!hasAnyContact) {
    return <span className="no-media">Нет контактов</span>;
  }
  
  const renderContactList = (contacts: string[], icon: string, showAll: boolean) => {
    if (contacts.length === 0) return null;
    
    const displayContacts = (showAll || !compact) ? contacts : contacts.slice(0, 1);
    const remainingCount = contacts.length - displayContacts.length;
    
    return (
      <>
        {displayContacts.map((contact, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '14px' }}>{icon}</span>
            <span>{contact}</span>
            {index === 0 && contacts.length > 1 && compact && !expanded && (
              <span 
                style={{ 
                  fontSize: '11px', 
                  color: '#6b7280',
                  marginLeft: '4px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(true);
                }}
              >
                (еще {remainingCount})
              </span>
            )}
          </div>
        ))}
      </>
    );
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#4b5563' }}>
      {renderContactList(allPhones, '📞', expanded)}
      {renderContactList(allTelegrams, '✈️', expanded)}
      {renderContactList(allEmails, '📧', expanded)}
      
      {compact && expanded && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(false);
          }}
          style={{
            fontSize: '11px',
            color: '#6b7280',
            background: 'none',
            border: 'none',
            padding: '4px 0',
            cursor: 'pointer',
            textDecoration: 'underline',
            textAlign: 'left'
          }}
        >
          Свернуть
        </button>
      )}
    </div>
  );
};
