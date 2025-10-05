import * as React from 'react';
import { useState } from 'react';
import { requestsService } from '../services/requests';
import { ErrorHandler } from '../utils/errorHandler';
import VirtualizedList from './common/VirtualizedList';
import { TableSkeleton } from './common/SkeletonLoader';
import AnimatedContainer from './common/AnimatedContainer';
import type { RequestListItem } from '../types';

const RequestsTable: React.FC = () => {
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestsService.getRequests();
      setRequests(data);
    } catch (err) {
      ErrorHandler.logError(err, 'RequestsTable.fetchRequests');
      setError('Ошибка загрузки запросов');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests();
  }, []);

  const handleRowClick = (request: RequestListItem) => {
    // Создаем URL с параметрами для нового окна
    const params = new URLSearchParams({
      requestId: request.id.toString(),
      mode: 'project-creation'
    });
    
    // Открываем в том же окне для сохранения авторизации
    window.location.href = `/project-creation?${params.toString()}`;
  };

  const handleProjectCreated = async (_projectData: ProjectForm) => {
    setShowProjectModal(false);
    setSelectedRequest(null);
    
    // Обновляем список запросов
    await fetchRequests();
    
    // Можно добавить уведомление об успешном создании
    alert('Проект успешно создан!');
  };

  // Удалены неиспользуемые функции handleAnalyzeRequest и handleShowContext


  // Убираем обрезку текста - показываем полный текст
  const displayText = (text: string) => {
    return text;
  };

  // Компонент для рендеринга строки запроса
  const renderRequestRow = (request: RequestListItem, _index: number) => (
    <tr 
      key={request.id} 
      className="requests-table-row hover:bg-blue-50 cursor-pointer transition-colors duration-200"
      onClick={() => handleRowClick(request)}
    >
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
                      onClick={(e) => e.stopPropagation()}
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
        <div className="text-center text-gray-500 text-sm">
          Кликните для создания проекта
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div className="card overflow-hidden">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Запросы КД</h2>
            <TableSkeleton rows={8} columns={5} />
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
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div className="card overflow-hidden">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Запросы КД</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="requests-table">
              <thead>
                <tr>
                  <th className="requests-table-header">Дата</th>
                  <th className="requests-table-header">Автор</th>
                  <th className="requests-table-header">Текст запроса</th>
                  <th className="requests-table-header">Медиа</th>
                  <th className="requests-table-header">Статус</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 50 ? (
                  <VirtualizedList
                    items={requests}
                    itemHeight={120}
                    containerHeight={600}
                    renderItem={renderRequestRow}
                  />
                ) : (
                  requests.map((request) => renderRequestRow(request, requests.indexOf(request)))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedContainer>

    </>
  );
};

export default RequestsTable;
