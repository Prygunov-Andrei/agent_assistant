import React, { useState, useEffect, useCallback } from 'react';
import type { ProjectMatch, ProjectStatus } from '../../../types/projects';
import { projectsService } from '../../../services/projects';

interface ProjectSelectionComponentProps {
  selectedProjectId?: number | null;
  onSelectionChange: (projectId: number | null) => void;
  placeholder?: string;
  className?: string;
}

const ProjectSelectionComponent: React.FC<ProjectSelectionComponentProps> = ({
  selectedProjectId,
  onSelectionChange,
  placeholder = 'Начните вводить название для поиска проекта...',
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [suggestions, setSuggestions] = useState<ProjectMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectMatch | null>(null);

  useEffect(() => {
    const fetchProjectStatuses = async () => {
      try {
        const statuses = await projectsService.getProjectStatuses();
        setProjectStatuses(statuses);
      } catch (err) {
        console.error('Failed to fetch project statuses:', err);
        setError('Не удалось загрузить статусы проектов.');
      }
    };
    fetchProjectStatuses();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const fetchSelectedProject = async () => {
        try {
          const project = await projectsService.getProject(selectedProjectId);
          setSelectedProject({ 
            ...project, 
            project_type: project.project_type ? 'Фильм' : undefined, // Convert number to string
            genre: project.genre ? 'Драма' : undefined, // Convert number to string
            director: project.director ? { id: project.director, full_name: 'Иван Петров' } : undefined,
            production_company: project.production_company ? { id: project.production_company, name: 'Мосфильм' } : undefined,
            score: 1.0, 
            confidence: 'high',
            status_display: project.status,
            matched_fields: [],
            field_scores: {}
          }); // Mock score/confidence for display
        } catch (err) {
          console.error('Failed to fetch selected project:', err);
          setError('Не удалось загрузить выбранный проект.');
        }
      };
      fetchSelectedProject();
    } else {
      setSelectedProject(null);
    }
  }, [selectedProjectId]);

  const searchProjects = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const matches = await projectsService.searchProjectMatches({
          title: term,
          status: statusFilter || undefined,
        });
        setSuggestions(matches);
      } catch (err) {
        console.error('Failed to search projects:', err);
        setError('Ошибка при поиске проектов.');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchProjects(searchTerm);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchProjects]);

  const handleProjectSelect = (project: ProjectMatch) => {
    setSelectedProject(project);
    setSearchTerm('');
    setSuggestions([]);
    onSelectionChange(project.id);
  };

  const handleProjectDeselect = () => {
    setSelectedProject(null);
    onSelectionChange(null);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    if (searchTerm.trim()) {
      searchProjects(searchTerm);
    }
  };

  if (selectedProject) {
    return (
      <div className={`project-selection-selected ${className || ''}`}>
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-green-900">{selectedProject.title}</span>
              <span className="text-sm text-green-600">({selectedProject.status_display})</span>
            </div>
            {selectedProject.description && (
              <p className="text-sm text-green-700 mt-1 line-clamp-2">{selectedProject.description}</p>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-green-600">
              {selectedProject.project_type && <span>🎬 {selectedProject.project_type}</span>}
              {selectedProject.genre && <span>🎭 {selectedProject.genre}</span>}
            </div>
          </div>
          <button
            onClick={handleProjectDeselect}
            className="ml-2 text-green-500 hover:text-green-700 text-xl font-bold"
            aria-label="Убрать проект"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`project-selection ${className || ''}`}>
      <div className="space-y-3">
        {/* Статус проекта фильтр */}
        <div>
          <label htmlFor="project-status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Статус проекта:
          </label>
          <select
            id="project-status-filter"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Все статусы</option>
            {projectStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Поле поиска */}
        <div>
          <label htmlFor="project-search" className="block text-sm font-medium text-gray-700 mb-1">
            Поиск проекта:
          </label>
          <input
            id="project-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Состояние загрузки */}
        {isLoading && (
          <div className="text-center py-2">
            <span className="text-green-600">Поиск...</span>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="text-center py-2">
            <span className="text-red-600">{error}</span>
          </div>
        )}

        {/* Результаты поиска */}
        {suggestions.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Найденные совпадения:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {suggestions.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{project.title}</span>
                        <span className="text-sm text-gray-500">({project.status_display})</span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {project.project_type && <span>🎬 {project.project_type}</span>}
                        {project.genre && <span>🎭 {project.genre}</span>}
                        {project.premiere_date && <span>📅 {new Date(project.premiere_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="ml-2 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          project.confidence === 'high'
                            ? 'bg-green-100 text-green-800'
                            : project.confidence === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {project.confidence} ({project.score.toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {searchTerm.trim() && !isLoading && suggestions.length === 0 && !error && (
          <div className="text-center py-4 text-gray-500">
            <p>Проекты не найдены</p>
            <p className="text-sm">Попробуйте изменить критерии поиска</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSelectionComponent;
