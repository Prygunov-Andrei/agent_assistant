import React from 'react';
import type { PersonProject } from '../../types/people';

interface PersonProjectsProps {
  projects: PersonProject[];
  onProjectClick?: (projectId: number) => void;
  totalCount?: number; // Общее количество проектов
  showCount?: boolean; // Показывать ли счетчик после списка
}

export const PersonProjects: React.FC<PersonProjectsProps> = ({ 
  projects, 
  onProjectClick,
  totalCount,
  showCount = false 
}) => {
  const handleProjectClick = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    if (onProjectClick) {
      onProjectClick(projectId);
    }
  };
  
  // Если нет проектов и нужно показать счетчик
  if ((!projects || projects.length === 0) && showCount && totalCount !== undefined) {
    return (
      <span className="no-media">
        Нет проектов ({totalCount})
      </span>
    );
  }
  
  // Если нет проектов и не нужен счетчик
  if (!projects || projects.length === 0) {
    return <span className="no-media">Нет проектов</span>;
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {projects.map((project, index) => (
        <div key={project.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div
            onClick={(e) => handleProjectClick(e, project.id)}
            style={{
              fontSize: '13px',
              color: '#3b82f6',
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              flex: 1
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {project.title}
          </div>
          {/* Показываем счетчик после последнего проекта */}
          {showCount && index === projects.length - 1 && totalCount !== undefined && (
            <span style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              ({totalCount})
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
