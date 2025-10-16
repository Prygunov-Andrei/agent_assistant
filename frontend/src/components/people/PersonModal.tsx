import React, { useState, useEffect } from 'react';
import type { Person, PersonFormData, PersonModalMode, PersonProject } from '../../types/people';
import { PersonForm } from './PersonForm';
import { PersonAvatar } from './PersonAvatar';
import { PersonContacts } from './PersonContacts';
import { PersonProjects } from './PersonProjects';
import { PersonProjectsManager } from './PersonProjectsManager';
import ProjectFormModal from '../projects/ProjectFormModal';
import { peopleService } from '../../services/people';
import { projectsService } from '../../services/projects';
import { useAuth } from '../../contexts/AuthContext';
import { ErrorHandler } from '../../utils/errorHandler';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId?: number;
  personType: 'director' | 'producer' | 'casting_director';
  mode: PersonModalMode;
  onSuccess?: (person: Person | null) => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  personId,
  personType,
  mode: initialMode,
  onSuccess
}) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<PersonModalMode>(initialMode);
  const [person, setPerson] = useState<Person | null>(null);
  const [currentPersonId, setCurrentPersonId] = useState<number | undefined>(personId);
  const [allProjects, setAllProjects] = useState<PersonProject[]>([]);
  const [pendingProjects, setPendingProjects] = useState<PersonProject[]>([]); // Проекты для создания
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Состояния для модального окна проекта
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  // Сброс mode и данных при открытии/смене персоны
  useEffect(() => {
    if (isOpen) {
      // Сбрасываем ВСЕ состояние
      setMode(initialMode);
      setCurrentPersonId(personId);
      setShowDeleteConfirm(false);
      setError(null);
      setPerson(null);
      setAllProjects([]);
      setSelectedProject(null);
      setShowProjectModal(false);
      
      // Если открываем существующую персону - сразу ставим loading и начинаем загрузку
      if (personId && initialMode !== 'create') {
        setLoading(true);
        loadPerson();
      } else {
        setLoading(false);
      }
    } else {
      // При закрытии окна также очищаем все данные
      setPerson(null);
      setAllProjects([]);
      setSelectedProject(null);
      setShowProjectModal(false);
      setLoading(false);
    }
  }, [isOpen, personId, initialMode]);
  
  const loadPerson = async () => {
    const idToLoad = currentPersonId || personId;
    if (!idToLoad) return;
    
    // Очищаем старые данные перед загрузкой новых
    setPerson(null);
    setAllProjects([]);
    setLoading(true);
    
    try {
      const data = await peopleService.getPersonById(idToLoad);
      setPerson(data);
      
      // Загружаем ВСЕ проекты персоны (не только 5 последних)
      const projects = await peopleService.getPersonProjects(idToLoad, 100);
      setAllProjects(projects);
    } catch (err) {
      ErrorHandler.logError(err, 'PersonModal.loadPerson');
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (data: PersonFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      let result: Person;
      if (mode === 'create') {
        // Создаем персону
        result = await peopleService.createPerson(data);
        
        // Сохраняем ID созданной персоны
        setCurrentPersonId(result.id);
        
        // Если есть предварительно выбранные проекты - привязываем их
        if (pendingProjects.length > 0) {
          try {
            for (const project of pendingProjects) {
              console.log('Привязка проекта:', project.id, 'к персоне:', result.id, 'тип:', personType);
              
              // Загружаем полные данные проекта
              const projectDetails = await projectsService.getProject(project.id);
              
              const updateData: any = {};
              
              if (personType === 'casting_director') {
                updateData.casting_director = result.id;
              } else if (personType === 'director') {
                updateData.director = result.id;
              } else if (personType === 'producer') {
                // Фильтруем null значения и берем только id
                const existingProducers = (projectDetails.producers || [])
                  .map((p: any) => p?.id)
                  .filter((id: any) => id != null);
                console.log('Существующие продюсеры:', existingProducers);
                updateData.producers = [...existingProducers, result.id];
              }
              
              console.log('Данные для PATCH:', JSON.stringify(updateData));
              const updated = await projectsService.updateProject(project.id, updateData);
              console.log('Проект обновлен:', updated);
            }
          } catch (err: any) {
            console.error('Ошибка привязки проектов:', err);
            console.error('Детали ошибки:', err.response?.data);
            ErrorHandler.logError(err, 'PersonModal.linkPendingProjects');
            // Показываем детальную ошибку
            const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            alert(`Не удалось привязать проекты:\n${errorDetail}\n\nВы можете добавить их позже через редактирование.`);
          }
        }
        
        // Уведомляем родителя об успехе и закрываем окно
        console.log('PersonModal: персона создана успешно', result);
        if (onSuccess) {
          console.log('PersonModal: вызываем onSuccess');
          onSuccess(result);
        }
        console.log('PersonModal: закрываем окно');
        onClose();
        
        setLoading(false);
        return;
      } else {
        // Обновляем существующую персону
        const idToUpdate = currentPersonId || personId;
        if (!idToUpdate) {
          throw new Error('ID персоны не определен');
        }
        result = await peopleService.updatePerson(idToUpdate, data);
        onSuccess?.(result);
        onClose();
      }
    } catch (err: any) {
      ErrorHandler.logError(err, 'PersonModal.handleSubmit');
      
      // Формируем читаемое сообщение об ошибке
      let errorMessage = 'Ошибка сохранения';
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Собираем все ошибки в одно сообщение
          const errors = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          errorMessage = errors || 'Ошибка валидации данных';
        } else {
          errorMessage = errorData.message || String(errorData);
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    const idToDelete = currentPersonId || personId;
    if (!idToDelete) return;
    
    setLoading(true);
    try {
      await peopleService.deletePerson(idToDelete);
      onSuccess?.(null);
      onClose();
    } catch (err: any) {
      ErrorHandler.logError(err, 'PersonModal.handleDelete');
      setError(err.response?.data?.message || 'Ошибка удаления');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const canEdit = person && user && person.created_by === user.username;
  
  // Отладка: выводим в консоль для проверки
  useEffect(() => {
    if (person && user) {
      console.log('PersonModal Debug:', {
        person_created_by: person.created_by,
        user_username: user.username,
        canEdit: canEdit
      });
    }
  }, [person, user, canEdit]);
  
  // Обработчик клика по проекту
  const handleProjectClick = async (projectId: number) => {
    try {
      const projectDetails = await projectsService.getProject(projectId);
      setSelectedProject(projectDetails);
      setShowProjectModal(true);
    } catch (err) {
      ErrorHandler.logError(err, 'PersonModal.handleProjectClick');
      alert('Ошибка загрузки проекта');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        zIndex: 999999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          maxWidth: '1000px', 
          width: '95%', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
          <button
            onClick={onClose}
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#6b7280',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{ padding: '24px', overflow: 'auto' }}>
          {error && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '16px' 
            }}>
              <p style={{ color: '#991b1b' }}>{error}</p>
            </div>
          )}
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                border: '3px solid #e2e8f0', 
                borderTop: '3px solid #3182ce', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p style={{ color: '#6b7280' }}>Загрузка...</p>
            </div>
          )}
          
          {!loading && (mode === 'create' || mode === 'edit') && (
            <PersonForm
              initialData={person || undefined}
              personType={personType}
              onSubmit={handleSubmit}
              onCancel={onClose}
              mode={mode}
            >
              {/* Управление проектами в режиме создания */}
              {mode === 'create' && (
                <PersonProjectsManager
                  personId={0} // Временный ID для режима создания
                  personType={personType}
                  projects={pendingProjects}
                  onProjectsChange={(newProjects) => {
                    setPendingProjects(newProjects);
                  }}
                />
              )}
              
              {mode === 'edit' && person && (
                <PersonProjectsManager
                  personId={person.id}
                  personType={personType}
                  projects={allProjects}
                  onProjectsChange={(newProjects) => {
                    setAllProjects(newProjects);
                    // Обновляем счетчик проектов
                    if (person) {
                      setPerson({ ...person, projects_count: newProjects.length });
                    }
                  }}
                />
              )}
            </PersonForm>
          )}
          
          {!loading && mode === 'view' && person && person.id === personId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Заголовок */}
              <div style={{ textAlign: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <PersonAvatar 
                    photo={person.photo} 
                    fullName={person.full_name}
                    size="lg"
                  />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                  {person.full_name}
                </h2>
                <p style={{ color: '#6b7280', marginTop: '8px' }}>
                  {person.person_type === 'director' && 'Режиссер'}
                  {person.person_type === 'producer' && 'Продюсер'}
                  {person.person_type === 'casting_director' && 'Кастинг-директор'}
                </p>
              </div>
              
              {/* Контакты */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Контакты</h3>
                <PersonContacts
                  phones={person.phones}
                  emails={person.emails}
                  telegram_usernames={person.telegram_usernames}
                  phone={person.phone}
                  email={person.email}
                  telegram={person.telegram_username}
                  compact={false}
                />
              </div>
              
              {/* Проекты */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  Проекты ({person.projects_count || 0})
                </h3>
                {allProjects && allProjects.length > 0 ? (
                  <PersonProjects 
                    projects={allProjects}
                    onProjectClick={handleProjectClick}
                  />
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>Нет связанных проектов</p>
                )}
              </div>
              
              {/* Биография */}
              {person.bio && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Биография</h3>
                  <p style={{ color: '#4b5563', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{person.bio}</p>
                </div>
              )}
              
              {/* Награды */}
              {person.awards && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Награды</h3>
                  <p style={{ color: '#4b5563', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{person.awards}</p>
                </div>
              )}
              
              {/* Дополнительная информация */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                {person.birth_date && (
                  <div>
                    <p style={{ color: '#6b7280' }}>Дата рождения:</p>
                    <p style={{ fontWeight: '500', color: '#1f2937' }}>{person.birth_date}</p>
                  </div>
                )}
                {person.nationality && (
                  <div>
                    <p style={{ color: '#6b7280' }}>Национальность:</p>
                    <p style={{ fontWeight: '500', color: '#1f2937' }}>{person.nationality}</p>
                  </div>
                )}
                {person.website && (
                  <div>
                    <p style={{ color: '#6b7280' }}>Сайт:</p>
                    <a 
                      href={person.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      Перейти
                    </a>
                  </div>
                )}
                {person.kinopoisk_url && (
                  <div>
                    <p style={{ color: '#6b7280' }}>Кинопоиск:</p>
                    <a 
                      href={person.kinopoisk_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      Перейти
                    </a>
                  </div>
                )}
              </div>
              
              {/* Кнопки действий */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                {canEdit && !showDeleteConfirm && (
                  <>
                    <button
                      onClick={() => setMode('edit')}
                      className="btn btn-primary"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn btn-danger"
                    >
                      Удалить
                    </button>
                  </>
                )}
                {showDeleteConfirm && (
                  <div style={{ 
                    width: '100%', 
                    backgroundColor: '#fef2f2', 
                    border: '1px solid #fecaca', 
                    borderRadius: '8px', 
                    padding: '16px' 
                  }}>
                    <p style={{ color: '#991b1b', marginBottom: '16px' }}>
                      Вы уверены, что хотите удалить эту персону? Это действие нельзя отменить.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="btn btn-secondary"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleDelete}
                        className="btn btn-danger"
                      >
                        Да, удалить
                      </button>
                    </div>
                  </div>
                )}
                {!showDeleteConfirm && (
                  <button
                    onClick={onClose}
                    className="btn btn-secondary"
                  >
                    Закрыть
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Модальное окно просмотра проекта */}
        <ProjectFormModal
          mode="view"
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          projectData={selectedProject}
        />
      </div>
    </div>
  );
};
