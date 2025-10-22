import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { requestsService } from '../services/requests';
import { projectsService } from '../services/projects';
import { ErrorHandler } from '../utils/errorHandler';
import { ProjectCreationForm } from '../components/projects/creation/ProjectCreationForm';
import ModalContextPanel from '../components/projects/creation/ModalContextPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import type { RequestListItem } from '../types';
import type { LLMAnalysisResult } from '../types/llm';
import type { ProjectCreationForm as ProjectForm } from '../types/projects';

const ProjectCreationPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const requestId = queryParams.get('requestId');

  const [request, setRequest] = useState<RequestListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LLMAnalysisResult | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) {
        setError('ID запроса не указан.');
        setLoading(false);
        return;
      }
      try {
        const fetchedRequest = await requestsService.getRequest(parseInt(requestId));
        setRequest(fetchedRequest);
      } catch (err) {
        ErrorHandler.logError(err, 'ProjectCreationPage.fetchRequest');
        setError('Не удалось загрузить запрос.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  useEffect(() => {
    if (request && !analysisResult && !isAnalyzing) {
      handleAnalyzeRequest();
    }
  }, [request, analysisResult, isAnalyzing]);

  const handleAnalyzeRequest = async () => {
    if (!request) return;
    setIsAnalyzing(true);
    try {
      const result = await projectsService.analyzeRequest(request.id);
      setAnalysisResult(result);
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectCreationPage.analyzeRequest');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProjectSubmit = async (projectData: ProjectForm) => {
    try {
      const createdProject = await projectsService.createProject({
        title: projectData.title,
        description: projectData.description || undefined,
        project_type: projectData.project_type,
        genre: projectData.genre,
        request: projectData.request_id,
      });

      if (projectData.roles && projectData.roles.length > 0) {
        for (const role of projectData.roles) {
          if (role.name && role.name.trim()) {
            try {
              await projectsService.createProjectRole({
                project: createdProject.id,
                title: role.name,
                description: role.description || '',
                requirements: role.audition_requirements || '',
                skills_required: role.skills_required || [],
                suggested_artists: role.suggested_artists || [],
              });
            } catch (roleError) {
              ErrorHandler.logError(roleError, 'ProjectCreationPage.createRole');
            }
          }
        }
      }
      // alert('Проект успешно создан!'); // Убрано
      window.close();
    } catch (error) {
      ErrorHandler.logError(error, 'ProjectCreationPage.createProject');
      // alert('Ошибка при создании проекта. Попробуйте снова.'); // Убрано
    }
  };

  const handleProjectCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      window.close();
    }
  };

  const handleFormChange = (hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  };

  const confirmClose = () => {
    setShowUnsavedWarning(false);
    window.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <h2 className="text-xl font-semibold text-gray-900 mt-4">Загрузка проекта</h2>
          <p className="text-gray-600 mt-2">Получаем данные запроса...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Ошибка загрузки</h1>
          <p className="text-gray-600 mb-6">{error || 'Запрос не найден'}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.close()}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Закрыть окно
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Создание проекта из запроса #{request.id}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Автор: {request.author_name} • {request.is_forwarded ? 'Переслано' : 'Оригинал'}
              </p>
            </div>
            <button
              onClick={handleProjectCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              title="Закрыть окно"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая панель контекста */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200">
              <ModalContextPanel
                request={request}
                analysisResult={analysisResult || undefined}
              />
            </div>
          </div>

          {/* Правая панель с формой */}
          <div className="lg:col-span-2 space-y-6">
            {/* Форма создания проекта */}
            <div className="bg-white rounded-lg border border-gray-200">
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <LoadingSpinner />
                    <h3 className="text-lg font-semibold text-gray-900 mt-4">Анализируем запрос</h3>
                    <p className="text-gray-600 mt-2">ИИ обрабатывает данные...</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <ProjectCreationForm
                    requestId={request.id}
                    initialData={analysisResult?.project_analysis ? {
                      title: analysisResult.project_analysis.project_title,
                      description: analysisResult.project_analysis.project_description,
                      project_type: 0, // Будет определён в форме на основе project_type_raw
                      premiere_date: analysisResult.project_analysis.premiere_date,
                      roles: analysisResult.project_analysis.roles.map(role => ({
                        name: role.role_name || role.character_name,
                        description: role.role_description || role.description,
                        media_presence: role.media_presence as 'yes' | 'no' | 'doesnt_matter' | undefined,
                        audition_requirements: role.audition_requirements,
                        skills_required: role.skills_required?.acting_skills || [],
                        suggested_artists: [],
                      })),
                    } : undefined}
                    analysisResult={analysisResult || undefined}
                    onSubmit={handleProjectSubmit}
                    onCancel={handleProjectCancel}
                    onChange={handleFormChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Предупреждение о несохраненных изменениях */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-md">
            <h3 className="text-lg font-semibold mb-4">Несохраненные изменения</h3>
            <p className="mb-6">У вас есть несохраненные изменения. Вы уверены, что хотите закрыть окно?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmClose}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Закрыть без сохранения
              </button>
              <button
                onClick={() => setShowUnsavedWarning(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Продолжить редактирование
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCreationPage;