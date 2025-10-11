import React from 'react';

interface PersonContactsProps {
  phone?: string | null;
  email?: string | null;
  telegram?: string | null;
}

export const PersonContacts: React.FC<PersonContactsProps> = ({ 
  phone, 
  email, 
  telegram 
}) => {
  const hasAnyContact = phone || email || telegram;
  
  if (!hasAnyContact) {
    return <span className="no-media">Нет контактов</span>;
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#4b5563' }}>
      {phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px' }}>📞</span>
          <span>{phone}</span>
        </div>
      )}
      {telegram && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px' }}>✈️</span>
          <span>{telegram}</span>
        </div>
      )}
      {email && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px' }}>📧</span>
          <span>{email}</span>
        </div>
      )}
    </div>
  );
};
