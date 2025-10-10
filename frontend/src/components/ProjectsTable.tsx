import * as React from 'react';
import { useState } from 'react';
import { projectsService } from '../services/projects';
import { ErrorHandler } from '../utils/errorHandler';
import VirtualizedList from './common/VirtualizedList';
import { TableSkeleton } from './common/SkeletonLoader';
import AnimatedContainer from './common/AnimatedContainer';

interface Project {
  id: number;
  title: string;
  project_type: {
    id: number;
    name: string;
  };
  genre: {
    id: number;
    name: string;
  };
  description?: string;
  premiere_date?: string;
  status?: string;
  casting_director?: {
    id: number;
    name: string;
  };
  director?: {
    id: number;
    name: string;
  };
  producer?: {
    id: number;
    name: string;
  };
  production_company?: {
    id: number;
    name: string;
  };
  roles: Array<{
    id: number;
    name: string;
    description?: string;
    role_type?: {
      id: number;
      name: string;
    };
    gender?: string;
    age_min?: number;
    age_max?: number;
    media_presence?: string;
    height?: string;
    body_type?: string;
    hair_color?: string;
    eye_color?: string;
    hairstyle?: string;
    clothing_size?: string;
    shoe_size?: {
      id: number;
      name: string;
    };
    nationality?: {
      id: number;
      name: string;
    };
    rate_per_shift?: string;
    shooting_dates?: string;
    shooting_location?: string;
    rate_conditions?: string;
    skills_required?: Array<{
      id?: number;
      name: string;
    }>;
  }>;
  created_at: string;
  request?: {
    id: number;
    text: string;
  };
}

const ProjectsTable: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния модального окна просмотра
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Состояние для модального окна удаления
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  
  // Состояние для сворачивания ролей
  const [collapsedRoles, setCollapsedRoles] = useState<Set<number>>(new Set());

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsService.getProjects();
      // API возвращает { results: [...], count: N, next: ..., previous: ... }
      const data = response.results || response;
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectsTable.fetchProjects');
      setError('Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProjects();
  }, []);

  // Обработчик клика по строке проекта
  const handleRowClick = (project: Project) => {
    setSelectedProject(project);
    setShowViewModal(true);
  };

  // Закрытие модального окна просмотра
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedProject(null);
    setCollapsedRoles(new Set()); // Сбрасываем состояние сворачивания
  };
  
  // Переключение сворачивания роли
  const toggleRoleCollapse = (roleId: number) => {
    setCollapsedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // Открытие модального окна удаления
  const handleDeleteClick = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
    setShowDeleteModal(true);
  };

  // Подтверждение удаления
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      await projectsService.deleteProject(projectToDelete);
      setProjects(projects.filter(p => p.id !== projectToDelete));
      setShowDeleteModal(false);
      setProjectToDelete(null);
      
      // Если удаляем текущий просматриваемый проект, закрываем окно
      if (selectedProject?.id === projectToDelete) {
        setShowViewModal(false);
        setSelectedProject(null);
      }
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectsTable.handleConfirmDelete');
      alert('Ошибка при удалении проекта');
    }
  };

  // Отмена удаления
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  // Рендер строки таблицы
  const renderProjectRow = (project: Project, _index: number) => (
    <tr 
      key={project.id} 
      className="requests-table-row hover:bg-blue-50 cursor-pointer transition-colors duration-200"
      onClick={() => handleRowClick(project)}
    >
      <td className="requests-table-cell">
        <div className="request-date">
          <div className="request-date-date">
            {project.created_at ? new Date(project.created_at).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            }) : 'Не указано'}
          </div>
          <div className="request-date-time">
            {project.created_at ? new Date(project.created_at).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            }) : ''}
          </div>
        </div>
      </td>
      <td className="requests-table-cell">
        <div style={{ fontWeight: '600', fontSize: '15px', color: '#111827' }}>
          {project.title}
        </div>
        {project.project_type && (
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {project.project_type.name}
            {project.genre && ` • ${project.genre.name}`}
          </div>
        )}
      </td>
      <td className="requests-table-cell">
        <div style={{ fontSize: '14px', color: '#374151' }}>
          {project.casting_director?.name || 'Не указан'}
        </div>
      </td>
      <td className="requests-table-cell">
        {project.roles && project.roles.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {project.roles.map((role, index) => (
              <div 
                key={role.id} 
                style={{ 
                  fontSize: '13px', 
                  color: '#4b5563',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {index + 1}. {role.name}
              </div>
            ))}
          </div>
        ) : (
          <span className="no-media">Нет ролей</span>
        )}
      </td>
    </tr>
  );

  if (loading) {
    return (
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div className="card overflow-hidden">
          <div className="p-4">
            <TableSkeleton rows={8} columns={4} />
          </div>
        </div>
      </AnimatedContainer>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
        </div>
        <button onClick={fetchProjects} className="btn btn-primary">
          Попробовать снова
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-6">
          Пока нет проектов. Создайте первый проект из запроса!
        </p>
      </div>
    );
  }

  return (
    <>
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="requests-table">
              <tbody>
                {projects.length > 50 ? (
                  <VirtualizedList
                    items={projects}
                    itemHeight={120}
                    containerHeight={600}
                    renderItem={renderProjectRow}
                  />
                ) : (
                  projects.map((project) => renderProjectRow(project, projects.indexOf(project)))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedContainer>

      {/* Модальное окно просмотра проекта - будет реализовано далее */}
      {showViewModal && selectedProject && (
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
          onClick={handleCloseViewModal}
        >
          <div 
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              maxWidth: '1200px', 
              width: '95%', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px', 
              borderBottom: '1px solid #e5e7eb', 
              backgroundColor: '#f9fafb' 
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', margin: 0 }}>
                Проект: {selectedProject.title}
              </h2>
              <button 
                onClick={handleCloseViewModal} 
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

            {/* BODY - Временно показываем базовую информацию */}
            <div style={{ 
              flex: 1, 
              overflow: 'auto', 
              padding: '20px' 
            }}>
              <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                Детальный просмотр проекта будет реализован далее...
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <strong>Тип проекта:</strong> {selectedProject.project_type?.name}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Жанр:</strong> {selectedProject.genre?.name}
              </div>
              {selectedProject.description && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Описание:</strong> {selectedProject.description}
                </div>
              )}
              <div style={{ marginBottom: '16px' }}>
                <strong>Кастинг-директор:</strong> {selectedProject.casting_director?.name || 'Не указан'}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Количество ролей:</strong> {selectedProject.roles?.length || 0}
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ 
              padding: '20px', 
              borderTop: '1px solid #e5e7eb', 
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={handleCloseViewModal}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Закрыть
              </button>
              <button
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Редактировать
              </button>
              <button
                onClick={(e) => {
                  handleDeleteClick(e, selectedProject.id);
                }}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            zIndex: 1000000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
          onClick={handleCancelDelete}
        >
          <div 
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '28px', 
              maxWidth: '440px', 
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              animation: 'slideIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: '#fee2e2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px', color: '#111827' }}>
                  Удалить проект?
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Это действие нельзя отменить
                </p>
              </div>
            </div>
            
            <p style={{ color: '#4b5563', marginBottom: '24px', fontSize: '15px', lineHeight: '1.5' }}>
              Вы уверены, что хотите удалить этот проект? Все роли и связанные данные будут безвозвратно удалены из системы.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={handleCancelDelete} 
                style={{ 
                  padding: '10px 20px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  backgroundColor: 'white', 
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                Отмена
              </button>
              <button 
                onClick={handleConfirmDelete} 
                style={{ 
                  padding: '10px 20px', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  backgroundColor: '#dc2626', 
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Удалить проект
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectsTable;

