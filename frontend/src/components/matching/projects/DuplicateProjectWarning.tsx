import React from 'react';
import type { ProjectMatch } from '../../../types/projects';

interface DuplicateProjectWarningProps {
  duplicates: ProjectMatch[];
  onIgnore: () => void;
  onSelectExisting: (projectId: number) => void;
  className?: string;
}

const DuplicateProjectWarning: React.FC<DuplicateProjectWarningProps> = ({
  duplicates,
  onIgnore,
  onSelectExisting,
  className,
}) => {
  if (duplicates.length === 0) {
    return null;
  }

  const highConfidenceDuplicates = duplicates.filter(d => d.confidence === 'high');
  const mediumConfidenceDuplicates = duplicates.filter(d => d.confidence === 'medium');

  return (
    <div className={`duplicate-project-warning ${className || ''}`}>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Обнаружены похожие проекты
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Мы нашли {duplicates.length} проект(ов), которые могут быть похожи на тот, который вы создаете.
                Рекомендуем проверить их перед созданием нового проекта.
              </p>
            </div>

            {/* Высокая уверенность */}
            {highConfidenceDuplicates.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-red-800 mb-2">
                  🚨 Высокая вероятность дубликата:
                </h4>
                <div className="space-y-2">
                  {highConfidenceDuplicates.map((project) => (
                    <div
                      key={project.id}
                      className="bg-red-50 border border-red-200 rounded-md p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-red-900">{project.title}</h5>
                          {project.description && (
                            <p className="text-sm text-red-700 mt-1 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-red-600">
                            <span>Статус: {project.status_display}</span>
                            {project.project_type && <span>Тип: {project.project_type}</span>}
                            {project.premiere_date && (
                              <span>Премьера: {new Date(project.premiere_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-3 flex flex-col gap-2">
                          <button
                            onClick={() => onSelectExisting(project.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                          >
                            Выбрать этот
                          </button>
                          <span className="text-xs text-red-600 text-center">
                            {project.score.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Средняя уверенность */}
            {mediumConfidenceDuplicates.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                  ⚠️ Возможные совпадения:
                </h4>
                <div className="space-y-2">
                  {mediumConfidenceDuplicates.map((project) => (
                    <div
                      key={project.id}
                      className="bg-yellow-50 border border-yellow-200 rounded-md p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-yellow-900">{project.title}</h5>
                          {project.description && (
                            <p className="text-sm text-yellow-700 mt-1 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-yellow-600">
                            <span>Статус: {project.status_display}</span>
                            {project.project_type && <span>Тип: {project.project_type}</span>}
                          </div>
                        </div>
                        <div className="ml-3 flex flex-col gap-2">
                          <button
                            onClick={() => onSelectExisting(project.id)}
                            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
                          >
                            Выбрать этот
                          </button>
                          <span className="text-xs text-yellow-600 text-center">
                            {project.score.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Действия */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={onIgnore}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
              >
                Создать новый проект
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateProjectWarning;
