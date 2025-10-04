import * as React from 'react';
import { useState } from 'react';
import { requestsService } from '../services/requests';
import { projectsService } from '../services/projects';
import LoadingSpinner from './LoadingSpinner';
import { ProjectCreationForm } from './projects/creation/ProjectCreationForm';
import RequestAnalysisModal from './analysis/RequestAnalysisModal';
import FixedContextPanel from './layout/FixedContextPanel';
import type { RequestListItem } from '../types';
import type { ProjectCreationForm as ProjectForm } from '../types/projects';
import type { LLMAnalysisResult } from '../types/llm';

const RequestsTable: React.FC = () => {
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [contextRequestText, setContextRequestText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<LLMAnalysisResult | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestsService.getRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setError('Ошибка загрузки запросов');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateProject = (requestId: number) => {
    setSelectedRequestId(requestId);
    setShowProjectForm(true);
  };

  const handleProjectSubmit = async (projectData: ProjectForm) => {
    try {
      // Создаем проект через API (без поля roles)
      const createdProject = await projectsService.createProject({
        title: projectData.title,
        description: projectData.description || undefined,
        project_type: projectData.project_type,
        genre: projectData.genre,
        premiere_date: projectData.premiere_date || undefined,
        request_id: projectData.request_id,
      });
      
      console.log('Project created successfully:', createdProject);
      
      // Создаем роли для проекта, если они есть
      if (projectData.roles && projectData.roles.length > 0) {
        for (const role of projectData.roles) {
          try {
            await projectsService.createProjectRole({
              project: createdProject.id,
              name: role.title,
              description: role.description,
              requirements: role.requirements,
              salary: role.salary,
              start_date: role.start_date,
              end_date: role.end_date,
              gender: role.gender,
              age_range: role.age_range,
              skills_required: role.skills_required,
              suggested_artists: role.selected_artists,
            });
            console.log('Role created successfully:', role.title);
          } catch (roleError) {
            console.error('Error creating role:', roleError);
            // Продолжаем создание других ролей даже если одна не удалась
          }
        }
      }
      
      setShowProjectForm(false);
      setSelectedRequestId(null);
      
      // Можно добавить уведомление об успешном создании
      alert('Проект успешно создан!');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Ошибка при создании проекта. Попробуйте снова.');
    }
  };

  const handleProjectCancel = () => {
    setShowProjectForm(false);
    setSelectedRequestId(null);
  };

  const handleAnalyzeRequest = (requestId: number) => {
    setSelectedRequestId(requestId);
    setShowAnalysisModal(true);
  };

  const handleShowContext = (requestText: string, requestId: number) => {
    setContextRequestText(requestText);
    setSelectedRequestId(requestId);
    setShowContextPanel(true);
  };

  const handleAnalysisComplete = (result: LLMAnalysisResult) => {
    setAnalysisResult(result);
    setShowProjectForm(true);
    setShowAnalysisModal(false);
  };

  // Убираем обрезку текста - показываем полный текст
  const displayText = (text: string) => {
    return text;
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка запросов..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
        </div>
        <button onClick={fetchRequests} className="btn btn-primary">
          Попробовать снова
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Запросы КД
        </h2>
        <p className="text-gray-600 mb-6">
          Пока нет запросов для обработки.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="fade-in">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="requests-table">
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="requests-table-row">
                    <td className="requests-table-cell">
                      <div className="request-date">
                        <div className="request-date-date">
                          {request.original_created_at ? new Date(request.original_created_at).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          }) : 'Не указано'}
                        </div>
                        <div className="request-date-time">
                          {request.original_created_at ? new Date(request.original_created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Не указано'}
                        </div>
                      </div>
                    </td>
                    <td className="requests-table-cell">
                      <div className="request-author">
                        <div className="request-author-name">
                          {request.author_name}
                        </div>
                        {request.is_forwarded && (
                          <div className="request-forwarded">
                            Переслано
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="requests-table-cell">
                      <div className="request-text">
                        {displayText(request.text)}
                      </div>
                    </td>
                    <td className="requests-table-cell">
                      <div className="request-media">
                        {request.images && request.images.length > 0 && (
                          <div className="media-item">
                            <div className="images-container">
                              {request.images.map((image, index) => (
                                <img 
                                  key={index}
                                  src={image.image} 
                                  alt={`Фото запроса ${index + 1}`}
                                  className="request-image"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {request.files && request.files.length > 0 && (
                          <div className="media-item">
                            <div className="files-container">
                              {request.files.map((file, index) => (
                                <div key={index} className="file-item">
                                  <span className="media-icon">📄</span>
                                  <a 
                                    href={file.file} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="file-link"
                                  >
                                    {file.original_filename}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(!request.images || request.images.length === 0) && (!request.files || request.files.length === 0) && (
                          <span className="no-media">Нет медиа</span>
                        )}
                      </div>
                    </td>
                    <td className="requests-table-cell">
                      <div className="request-actions space-y-2">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleAnalyzeRequest(request.id)}
                            className="btn btn-secondary btn-sm"
                            title="Анализировать запрос с помощью ИИ"
                          >
                            🤖 Анализировать
                          </button>
                          <button
                            onClick={() => handleCreateProject(request.id)}
                            className="btn btn-primary btn-sm"
                            title="Создать проект из этого запроса"
                          >
                            Создать проект
                          </button>
                          <button
                            onClick={() => handleShowContext(request.text, request.id)}
                            className="btn btn-outline btn-sm"
                            title="Показать полный текст запроса"
                          >
                            📄 Контекст
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Модальное окно создания проекта */}
      {showProjectForm && selectedRequestId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Создание проекта из запроса</h2>
              <button
                onClick={handleProjectCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ProjectCreationForm
              requestId={selectedRequestId}
              analysisResult={analysisResult}
              onSubmit={handleProjectSubmit}
              onCancel={handleProjectCancel}
            />
          </div>
        </div>
      )}

      {/* Модальное окно анализа запроса */}
      <RequestAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        requestId={selectedRequestId || undefined}
        requestText={requests.find(r => r.id === selectedRequestId)?.text}
        onAnalysisComplete={handleAnalysisComplete}
      />

      {/* Контекстная панель */}
      <FixedContextPanel
        requestText={contextRequestText}
        requestId={selectedRequestId || undefined}
        isVisible={showContextPanel}
        onClose={() => setShowContextPanel(false)}
      />
    </>
  );
};

export default RequestsTable;
