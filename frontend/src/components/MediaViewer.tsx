import React, { useState, useEffect } from 'react';
import type { RequestImage, RequestFile } from '../types';
import { mediaService } from '../services/mediaService';
import type { RequestMediaResponse } from '../services/mediaService';
import { ImageGallery } from './media/images/ImageGallery';
import { DocumentList } from './media/documents/DocumentList';
import LoadingSpinner from './LoadingSpinner';
import type { MediaImage, MediaDocument } from '../types/media';

interface MediaViewerProps {
  requestId: number;
  showImages?: boolean;
  showDocuments?: boolean;
  className?: string;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  requestId,
  showImages = true,
  showDocuments = true,
  className = ''
}) => {
  const [mediaData, setMediaData] = useState<RequestMediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Функции для преобразования типов
  const convertToMediaImages = (requestImages: RequestImage[]): MediaImage[] => {
    return requestImages.map(img => ({
      id: img.id,
      url: mediaService.getImageUrl(img.image),
      thumbnail: img.thumbnail ? mediaService.getImageUrl(img.thumbnail) : mediaService.getImageUrl(img.image),
      caption: img.caption,
      file_size: img.file_size,
      width: undefined, // Не доступно в RequestImage
      height: undefined, // Не доступно в RequestImage
      created_at: img.created_at
    }));
  };

  const convertToMediaDocuments = (requestFiles: RequestFile[]): MediaDocument[] => {
    return requestFiles.map(file => ({
      id: file.id,
      url: mediaService.getFileUrl(file.file),
      filename: file.original_filename,
      file_size: file.file_size,
      mime_type: file.mime_type,
      description: undefined, // Не доступно в RequestFile
      created_at: file.created_at
    }));
  };

  useEffect(() => {
    const loadMedia = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mediaService.getRequestMedia(requestId);
        setMediaData(data);
      } catch (err) {
        console.error('Ошибка загрузки медиафайлов:', err);
        setError('Не удалось загрузить медиафайлы');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      loadMedia();
    }
  }, [requestId]);

  if (loading) {
    return (
      <div className={`media-viewer ${className}`}>
        <LoadingSpinner size="sm" text="Загрузка медиафайлов..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`media-viewer ${className}`}>
        <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!mediaData || (!mediaData.has_images && !mediaData.has_files)) {
    return (
      <div className={`media-viewer ${className}`}>
        <div className="text-gray-500 text-sm p-4 text-center">
          Медиафайлы не найдены
        </div>
      </div>
    );
  }

  return (
    <div className={`media-viewer ${className}`}>
      {/* Изображения */}
      {showImages && mediaData.has_images && mediaData.images.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            🖼️ Изображения ({mediaData.images_count})
          </h3>
          <ImageGallery images={convertToMediaImages(mediaData.images)} />
        </div>
      )}

      {/* Документы */}
      {showDocuments && mediaData.has_files && mediaData.files.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            📎 Документы ({mediaData.files_count})
          </h3>
          <DocumentList documents={convertToMediaDocuments(mediaData.files)} />
        </div>
      )}
    </div>
  );
};
