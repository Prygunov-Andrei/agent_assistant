import React from 'react';

interface ContactsMergeModalProps {
  isOpen: boolean;
  personName: string;
  oldContacts: {
    phone?: string | null;
    email?: string | null;
    telegram?: string | null;
  };
  newContacts: {
    phone?: string;
    email?: string;
    telegram?: string;
  };
  differentContacts: string[]; // ['phone', 'email', 'telegram']
  onMerge: (action: 'add' | 'replace') => void;
  onCancel: () => void;
}

const ContactsMergeModal: React.FC<ContactsMergeModalProps> = ({
  isOpen,
  personName,
  oldContacts,
  newContacts,
  differentContacts,
  onMerge,
  onCancel
}) => {
  if (!isOpen) return null;

  const contactLabels: Record<string, string> = {
    phone: '📞 Телефон',
    email: '📧 Email',
    telegram: '💬 Telegram'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999999
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '2px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            🔄 Обновить контакты?
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '16px',
            color: '#6b7280'
          }}>
            Для <strong>{personName}</strong>
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <p style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Найдены новые контакты из запроса:
          </p>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  Тип контакта
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  В БД сейчас
                </th>
                <th style={{
                  padding: '12px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  Новый из запроса
                </th>
              </tr>
            </thead>
            <tbody>
              {differentContacts.map((contactType, index) => (
                <tr key={contactType} style={{
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                }}>
                  <td style={{
                    padding: '12px',
                    fontWeight: '500',
                    color: '#111827',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    {contactLabels[contactType]}
                  </td>
                  <td style={{
                    padding: '12px',
                    color: '#6b7280',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    {oldContacts[contactType as keyof typeof oldContacts] || (
                      <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>не указан</span>
                    )}
                  </td>
                  <td style={{
                    padding: '12px',
                    color: '#059669',
                    fontWeight: '500',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    {newContacts[contactType as keyof typeof newContacts]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #dbeafe'
          }}>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#1e40af',
              lineHeight: '1.6'
            }}>
              <strong>ℹ️ Что делать?</strong><br />
              • <strong>Добавить новые</strong> — новые контакты добавятся к существующим (до 5 шт.)<br />
              • <strong>Перезаписать</strong> — заменить ТОЛЬКО указанные контакты (остальные останутся как есть)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '20px 24px',
          borderTop: '2px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          backgroundColor: '#f9fafb'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            ❌ Отмена
          </button>
          <button
            onClick={() => onMerge('add')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            ➕ Добавить новые
          </button>
          <button
            onClick={() => onMerge('replace')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ffffff',
              backgroundColor: '#f59e0b',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#d97706';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f59e0b';
            }}
          >
            🔄 Перезаписать
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactsMergeModal;

