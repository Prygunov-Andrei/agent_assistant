import React, { useState, useEffect } from 'react';
import { projectsService } from '../../services/projects';
import { ErrorHandler } from '../../utils/errorHandler';
import type { PersonProject } from '../../types/people';

interface PersonProjectsManagerProps {
  personId: number;
  personType: 'director' | 'producer' | 'casting_director';
  projects: PersonProject[];
  onProjectsChange: (projects: PersonProject[]) => void;
}

interface ProjectSearchResult {
  id: number;
  title: string;
  project_type: { name: string };
  genre: { name: string };
}

export const PersonProjectsManager: React.FC<PersonProjectsManagerProps> = ({
  personId,
  personType,
  projects,
  onProjectsChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProjectSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await projectsService.getProjects();
      const allProjects = response.results || response;
      
      // Фильтруем проекты по названию и исключаем уже добавленные
      const filtered = allProjects.filter((p: any) => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !projects.find(existing => existing.id === p.id)
      );
      
      setSearchResults(filtered.slice(0, 10) as unknown as ProjectSearchResult[]);
    } catch (err) {
      ErrorHandler.logError(err, 'PersonProjectsManager.handleSearch');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (searchQuery) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);
  
  const handleAddProject = async (project: ProjectSearchResult) => {
    try {
      const newProject: PersonProject = {
        id: project.id,
        title: project.title,
        created_at: new Date().toISOString()
      };
      
      // Если personId = 0, то мы в режиме создания - только локально добавляем
      if (personId === 0) {
        onProjectsChange([...projects, newProject]);
        setSearchQuery('');
        setSearchResults([]);
        setShowSearch(false);
        return;
      }
      
      // Иначе обновляем проект через API
      const updateData: any = {};
      
      if (personType === 'casting_director') {
        updateData.casting_director = personId;
      } else if (personType === 'director') {
        updateData.director = personId;
      } else if (personType === 'producer') {
        // Для продюсеров - это ManyToMany, нужно добавить в список
        const projectDetails = await projectsService.getProject(project.id);
        // Фильтруем null значения
        const existingProducers = (projectDetails.producers || [])
          .map((p: any) => p?.id)
          .filter((id: any) => id != null);
        updateData.producers = [...existingProducers, personId];
      }
      
      await projectsService.updateProject(project.id, updateData);
      
      // Добавляем проект в локальный список
      onProjectsChange([...projects, newProject]);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearch(false);
    } catch (err: any) {
      ErrorHandler.logError(err, 'PersonProjectsManager.handleAddProject');
      
      // Показываем понятное сообщение об ошибке
      if (err.response?.status === 403) {
        // alert(`❌ Нет прав для редактирования этого проекта\n\n` +
        //       `Проект "${project.title}" может редактировать только его создатель.\n\n` +
        //       `Вы можете попросить создателя проекта добавить вас в команду.`); // Убрано
      } else {
        // alert('Ошибка при добавлении проекта'); // Убрано
      }
    }
  };
  
  const handleRemoveProject = async (projectId: number) => {
    if (!confirm('Удалить связь с этим проектом?')) {
      return;
    }
    
    try {
      // Если personId = 0, то мы в режиме создания - только локально удаляем
      if (personId === 0) {
        onProjectsChange(projects.filter(p => p.id !== projectId));
        return;
      }
      
      // Иначе обновляем проект через API, удаляя ссылку на персону
      const updateData: any = {};
      
      if (personType === 'casting_director') {
        updateData.casting_director = null;
      } else if (personType === 'director') {
        updateData.director = null;
      } else if (personType === 'producer') {
        // Для продюсеров - удаляем из списка
        const projectDetails = await projectsService.getProject(projectId);
        // Фильтруем null значения
        const existingProducers = (projectDetails.producers || [])
          .map((p: any) => p?.id)
          .filter((id: any) => id != null);
        updateData.producers = existingProducers.filter((id: number) => id !== personId);
      }
      
      await projectsService.updateProject(projectId, updateData);
      
      // Удаляем из локального списка
      onProjectsChange(projects.filter(p => p.id !== projectId));
    } catch (err: any) {
      ErrorHandler.logError(err, 'PersonProjectsManager.handleRemoveProject');
      
      // Показываем понятное сообщение об ошибке
      if (err.response?.status === 403) {
        const projectToRemove = projects.find(p => p.id === projectId);
        // alert(`❌ Нет прав для редактирования этого проекта\n\n` +
        //       `Проект "${projectToRemove?.title}" может редактировать только его создатель.\n\n` +
        //       `Вы можете попросить создателя проекта удалить вас из команды.`); // Убрано
      } else {
        // alert('Ошибка при удалении связи с проектом'); // Убрано
      }
    }
  };
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>
          Проекты ({projects.length})
        </h3>
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="btn btn-primary"
          style={{ fontSize: '13px', padding: '6px 12px' }}
        >
          + Добавить проект
        </button>
      </div>
      
      {/* Поиск проектов */}
      {showSearch && (
        <div style={{ 
          marginBottom: '12px', 
          padding: '12px', 
          backgroundColor: '#f9fafb', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск проекта по названию..."
            className="form-input"
            style={{ marginBottom: '8px' }}
          />
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '8px', color: '#6b7280', fontSize: '13px' }}>
              Поиск...
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {searchResults.map(project => (
                <div
                  key={project.id}
                  onClick={() => handleAddProject(project)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    border: '1px solid #e5e7eb'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                    {project.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {project.project_type.name} • {project.genre.name}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && !loading && searchResults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '8px', color: '#6b7280', fontSize: '13px' }}>
              Проекты не найдены
            </div>
          )}
        </div>
      )}
      
      {/* Список проектов */}
      {projects.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ fontSize: '14px', color: '#1f2937' }}>
                {project.title}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveProject(project.id)}
                className="btn btn-danger"
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '16px', 
          backgroundColor: '#f9fafb', 
          borderRadius: '4px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Нет связанных проектов
        </div>
      )}
    </div>
  );
};

