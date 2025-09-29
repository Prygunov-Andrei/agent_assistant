import * as React from 'react';
import { useState, useEffect } from 'react';
import { requestsService } from '../services/requests';
import LoadingSpinner from './LoadingSpinner';
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
      console.error('Failed to fetch requests:', err);
      setError('Ошибка загрузки запросов');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'in_progress':
        return 'status-in-progress';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'in_progress':
        return 'В работе';
      case 'completed':
        return 'Выполнен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
    <div className="fade-in">
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="requests-table">
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="requests-table-row">
                  <td className="requests-table-cell">
                    <div className="request-date">
                      {formatDate(request.original_created_at)}
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
                      {truncateText(request.text)}
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
                    <div className={`request-status ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RequestsTable;
