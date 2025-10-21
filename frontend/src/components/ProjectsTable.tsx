import * as React from 'react';
import { useState } from 'react';
import { projectsService } from '../services/projects';
import { ErrorHandler } from '../utils/errorHandler';
import VirtualizedList from './common/VirtualizedList';
import { TableSkeleton } from './common/SkeletonLoader';
import AnimatedContainer from './common/AnimatedContainer';
import ProjectFormModal from './projects/ProjectFormModal';
import type { ProjectExpanded } from '../types/projects';

const ProjectsTable: React.FC = () => {
  const [projects, setProjects] = useState<ProjectExpanded[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния модального окна просмотра
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectExpanded | null>(null);
  

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsService.getProjects();
      // API возвращает { results: [...], count: N, next: ..., previous: ... }
      const data = response.results || response;
      setProjects(Array.isArray(data) ? (data as unknown as ProjectExpanded[]) : []);
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
  const handleRowClick = async (project: ProjectExpanded) => {
    try {
      // Загружаем ПОЛНЫЕ данные проекта с API (включая все роли с деталями)
      const fullProject = await projectsService.getProject(project.id) as unknown as ProjectExpanded;
      console.log('Полный проект:', fullProject);
      setSelectedProject(fullProject);
      setShowViewModal(true);
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectsTable.handleRowClick');
      alert('Ошибка при загрузке проекта');
    }
  };

  // Закрытие модального окна просмотра
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedProject(null);
  };


  // Рендер строки таблицы
  const renderProjectRow = (project: ProjectExpanded, _index: number) => (
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
            {project.roles.map((role) => (
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
                {role.name}
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

      {/* Модальное окно просмотра/редактирования проекта */}
      <ProjectFormModal
        mode="view"
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        projectData={selectedProject}
      />
    </>
  );
};

export default ProjectsTable;

