import React from 'react';
import type { PersonProject } from '../../types/people';

interface PersonProjectsProps {
  projects: PersonProject[];
  onProjectClick?: (projectId: number) => void;
}

export const PersonProjects: React.FC<PersonProjectsProps> = ({ projects, onProjectClick }) => {
  if (!projects || projects.length === 0) {
    return <span className="no-media">Нет проектов</span>;
  }
  
  const handleProjectClick = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    if (onProjectClick) {
      onProjectClick(projectId);
    }
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={(e) => handleProjectClick(e, project.id)}
          style={{
            fontSize: '13px',
            color: '#3b82f6',
            cursor: 'pointer',
            padding: '2px 8px',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {project.title}
        </div>
      ))}
    </div>
  );
};
