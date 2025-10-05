import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ProjectCreationForm as ProjectForm } from '../../../types/projects';
import type { LLMAnalysisResult } from '../../../types/llm';
import type { RequestListItem } from '../../../types';
import { projectsService } from '../../../services/projects';
import { ErrorHandler } from '../../../utils/errorHandler';
import { ProjectCreationForm } from './ProjectCreationForm';
import ModalContextPanel from './ModalContextPanel';
import MatchingSuggestionsPanel from './MatchingSuggestionsPanel';
import AnimatedContainer, { Transition } from '../../common/AnimatedContainer';
import LLMStatusIndicator from '../../llm/LLMStatusIndicator';

interface ProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestListItem | null;
  analysisResult?: LLMAnalysisResult;
  onProjectCreated: (projectData: ProjectForm) => void;
}

const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({
  isOpen,
  onClose,
  request,
  analysisResult,
  onProjectCreated,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysisResult, setCurrentAnalysisResult] = useState<LLMAnalysisResult | null>(analysisResult || null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Автоматический анализ при открытии модального окна
  useEffect(() => {
    if (isOpen && request && !currentAnalysisResult && !isAnalyzing) {
      handleAutoAnalysis();
    }
  }, [isOpen, request]);

  const handleAutoAnalysis = async () => {
    if (!request) return;

    setIsAnalyzing(true);
    try {
      // Вызываем API для анализа запроса
      const response = await projectsService.analyzeRequest(request.id);
      
      const analysisResult: LLMAnalysisResult = {
        project_analysis: {
          project_title: response.data?.project_analysis?.project_title || '',
          description: response.data?.project_analysis?.description || '',
          project_type: response.data?.project_analysis?.project_type || '',
          genre: response.data?.project_analysis?.genre || '',
          premiere_date: response.data?.project_analysis?.premiere_date || '',
          confidence: response.data?.project_analysis?.confidence || 0.85,
          roles: response.data?.project_analysis?.roles?.map((role: any) => ({
            role_type: role.role_type || 'main',
            character_name: role.character_name || role.name || role.title,
            description: role.description,
            age_range: role.age_range,
            gender: role.gender,
            skills_required: role.skills_required || {
              acting_skills: [],
              physical_skills: [],
              languages: [],
              special_requirements: []
            },
            suggested_artists: role.suggested_artists || []
          })) || [],
          contacts: response.data?.project_analysis?.contacts || {
            casting_director: null,
            director: null,
            producers: [],
            production_company: null
          }
        }
      };

      setCurrentAnalysisResult(analysisResult);
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectCreationModal.autoAnalysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProjectSubmit = async (projectData: ProjectForm) => {
    try {
      // Создаем проект через API (без поля roles)
      const createdProject = await projectsService.createProject({
        title: projectData.title,
        description: projectData.description || undefined,
        project_type: projectData.project_type,
        genre: projectData.genre,
        // premiere_date: projectData.premiere_date || undefined, // Временно отключено
        request: projectData.request_id, // Используем request вместо request_id
      });
      
      // Создаем роли для проекта, если они есть
      if (projectData.roles && projectData.roles.length > 0) {
        for (const role of projectData.roles) {
          if (role.name && role.name.trim()) {
            try {
              await projectsService.createProjectRole({
                project: createdProject.id,
                title: role.name, // Используем title вместо name
                description: role.description || '',
                requirements: role.audition_requirements || '', // Используем requirements вместо audition_requirements
                skills_required: role.skills_required || [],
                suggested_artists: role.suggested_artists || [],
              });
            } catch (roleError) {
              ErrorHandler.logError(roleError, 'ProjectCreationModal.createRole');
            }
          }
        }
      }
      
      setHasUnsavedChanges(false);
      onProjectCreated(projectData);
      onClose();
    } catch (error) {
      ErrorHandler.logError(error, 'ProjectCreationModal.createProject');
      throw error; // Пробрасываем ошибку для обработки в форме
    }
  };

  const handleProjectCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedWarning(false);
    onClose();
  };

  const handleFormChange = (hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  };

  // Блокируем скролл при открытии модального окна
  useEffect(() => {
    if (isOpen && request) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const modalContent = (
    <Transition show={isOpen} animation="fade" duration={200}>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center" 
        style={{ 
          position: 'fixed !important', 
          top: '0 !important', 
          left: '0 !important', 
          right: '0 !important', 
          bottom: '0 !important', 
          zIndex: '9999 !important',
          width: '100vw !important',
          height: '100vh !important'
        }}
      >
        <AnimatedContainer animation="scaleIn" className="w-full h-full">
          <div className="bg-white shadow-xl h-full flex flex-col overflow-hidden" style={{ borderRadius: '0 !important' }}>
          {/* Заголовок модального окна */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2 md:space-x-4">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                <span className="hidden sm:inline">Создание проекта из запроса </span>
                <span className="sm:hidden">Проект </span>
                #{request.id}
              </h2>
              {isAnalyzing && (
                <LLMStatusIndicator 
                  status="analyzing" 
                  message="Анализируем запрос..."
                />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleProjectCancel}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                aria-label="Закрыть"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Основное содержимое */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Левая панель - контекст запроса (25-40% экрана) */}
            <div className="w-full lg:w-1/3 lg:min-w-80 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50 max-h-96 lg:max-h-none">
              <ModalContextPanel 
                request={request}
                analysisResult={currentAnalysisResult || undefined}
              />
            </div>

            {/* Правая панель - основная форма (60-75% экрана) */}
            <div className="flex-1 flex flex-col">
              {/* Панель совпадений */}
              {currentAnalysisResult && (
                <div className="border-b border-gray-200 bg-blue-50">
                  <MatchingSuggestionsPanel 
                    analysisResult={currentAnalysisResult || undefined}
                    request={request}
                  />
                </div>
              )}

              {/* Форма создания проекта */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <ProjectCreationForm
                  requestId={request.id}
                  analysisResult={currentAnalysisResult || undefined}
                  onSubmit={handleProjectSubmit}
                  onCancel={handleProjectCancel}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          </div>

          {/* Предупреждение о несохраненных изменениях */}
          {showUnsavedWarning && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Несохраненные изменения
                </h3>
                <p className="text-gray-600 mb-6">
                  У вас есть несохраненные изменения. Вы уверены, что хотите закрыть без сохранения?
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowUnsavedWarning(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleConfirmClose}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Закрыть без сохранения
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnimatedContainer>
    </div>
    </Transition>
  );

  return createPortal(modalContent, document.body);
};

export default ProjectCreationModal;
