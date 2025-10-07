import React from 'react';
import type { RequestListItem } from '../../../types';

interface ModalContentProps {
  selectedRequest: RequestListItem;
  isAnalyzing: boolean;
  handleModalClose: () => void;
  formData: any;
  handleFormChange: (field: string, value: any) => void;
  castingDirector: any;
  setCastingDirector: (value: any) => void;
  director: any;
  setDirector: (value: any) => void;
  producer: any;
  setProducer: (value: any) => void;
  productionCompany: any;
  setProductionCompany: (value: any) => void;
  castingDirectorSearch: any[];
  directorSearch: any[];
  producerSearch: any[];
  companySearch: any[];
  showCastingDirectorDropdown: boolean;
  showDirectorDropdown: boolean;
  showProducerDropdown: boolean;
  showCompanyDropdown: boolean;
  searchPerson: (query: string, type: 'casting_director' | 'director' | 'producer' | 'company') => void;
  selectPerson: (person: any, type: 'casting_director' | 'director' | 'producer' | 'company') => void;
  createNewPerson: (type: 'casting_director' | 'director' | 'producer' | 'company') => void;
  setHasUnsavedChanges: (value: boolean) => void;
  roles: any[];
  handleRoleChange: (index: number, field: string, value: any) => void;
  addRole: () => void;
  removeRole: (index: number) => void;
  toggleRoleCollapse: (index: number) => void;
  collapseRole: (index: number) => void;
  collapsedRoles: Set<number>;
  handleProjectSubmit: (e: React.FormEvent) => void;
}

const ModalContent: React.FC<ModalContentProps> = ({
  selectedRequest,
  isAnalyzing,
  handleModalClose,
  formData,
  handleFormChange,
  castingDirector,
  setCastingDirector,
  director,
  setDirector,
  producer,
  setProducer,
  productionCompany,
  setProductionCompany,
  castingDirectorSearch,
  directorSearch,
  producerSearch,
  companySearch,
  showCastingDirectorDropdown,
  showDirectorDropdown,
  showProducerDropdown,
  showCompanyDropdown,
  searchPerson,
  selectPerson,
  createNewPerson,
  setHasUnsavedChanges,
  roles,
  handleRoleChange,
  addRole,
  removeRole,
  toggleRoleCollapse,
  collapseRole,
  collapsedRoles,
  handleProjectSubmit
}) => {
  return (
    <div 
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '1200px',
        width: '95%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Заголовок модального окна */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', margin: 0 }}>
            Создание проекта из запроса #{selectedRequest.id}
          </h2>
          {isAnalyzing && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              backgroundColor: '#dbeafe',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#1e40af'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid #1e40af',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Анализируем запрос...
            </div>
          )}
        </div>
        <button
          onClick={handleModalClose}
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#6b7280',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            padding: '5px'
          }}
        >
          &times;
        </button>
      </div>

      {/* Основное содержимое */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        minHeight: '0'
      }}>
        {/* Левая панель - контекст запроса */}
        <div style={{
          width: '35%',
          minWidth: '300px',
          borderRight: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          overflow: 'auto',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            Контекст запроса
          </h3>
          <div style={{ marginBottom: '12px' }}>
            <strong>Автор:</strong> {selectedRequest.author_name}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Дата:</strong> {selectedRequest.original_created_at ? new Date(selectedRequest.original_created_at).toLocaleDateString('ru-RU') : 'Не указано'}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Текст:</strong>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '12px', 
            borderRadius: '4px', 
            border: '1px solid #d1d5db',
            maxHeight: '200px',
            overflow: 'auto',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            {selectedRequest.text}
          </div>
          
          {/* Медиа файлы */}
          {(selectedRequest.images && selectedRequest.images.length > 0) || (selectedRequest.files && selectedRequest.files.length > 0) ? (
            <div style={{ marginTop: '16px' }}>
              <strong>Медиа:</strong>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '12px', 
                borderRadius: '4px', 
                border: '1px solid #d1d5db',
                marginTop: '8px'
              }}>
                {/* Изображения */}
                {selectedRequest.images && selectedRequest.images.length > 0 && (
                  <div style={{ marginBottom: selectedRequest.files && selectedRequest.files.length > 0 ? '12px' : '0' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
                      Изображения ({selectedRequest.images.length})
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px' }}>
                      {selectedRequest.images.map((image: any, index: number) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <img
                            src={image.image}
                            alt={`Изображение ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: '1px solid #e5e7eb',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(image.image, '_blank');
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Файлы */}
                {selectedRequest.files && selectedRequest.files.length > 0 && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
                      Файлы ({selectedRequest.files.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedRequest.files.map((file: any, index: number) => (
                        <a
                          key={index}
                          href={file.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 8px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            color: '#1f2937',
                            fontSize: '12px',
                            border: '1px solid #e5e7eb',
                            transition: 'background-color 0.2s'
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        >
                          <span style={{ fontSize: '14px' }}>📄</span>
                          <span style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}>
                            {file.original_filename || `Файл ${index + 1}`}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>
              Медиа не найдено
            </div>
          )}
        </div>

        {/* Правая панель - форма */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '20px'
        }}>
          {/* TO BE CONTINUED IN NEXT MESSAGE DUE TO SIZE */}
        </div>
      </div>
    </div>
  );
};

export default ModalContent;

