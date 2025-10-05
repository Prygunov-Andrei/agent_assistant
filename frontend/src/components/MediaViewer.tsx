import React, { useState, useEffect } from 'react';
import type { RequestImage, RequestFile } from '../types';
import { mediaService } from '../services/mediaService';
import { ErrorHandler } from '../utils/errorHandler';
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
  compact?: boolean;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  requestId,
  showImages = true,
  showDocuments = true,
  className = '',
  compact = false
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
      file_size: img.file_size || 0,
      width: undefined, // Не доступно в RequestImage
      height: undefined, // Не доступно в RequestImage
      created_at: img.created_at
    }));
  };

  const convertToMediaDocuments = (requestFiles: RequestFile[]): MediaDocument[] => {
    return requestFiles.map(file => {
      // Извлекаем имя файла из URL если original_filename пустое
      let filename = file.original_filename;
      if (!filename || filename.trim() === '') {
        const url = file.file;
        filename = url.split('/').pop() || 'Неизвестный файл';
      }
      
      const fileUrl = mediaService.getFileUrl(file.file);
      
      return {
        id: file.id,
        url: fileUrl,
        filename: filename,
        file_size: file.file_size,
        mime_type: file.mime_type || 'application/octet-stream',
        description: undefined, // Не доступно в RequestFile
        created_at: file.created_at
      };
    });
  };

  useEffect(() => {
    const loadMedia = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await mediaService.getRequestMedia(requestId);
        setMediaData(data);
      } catch (err) {
        ErrorHandler.logError(err, 'MediaViewer.loadMedia');
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
        <div className={compact ? "mb-4" : "mb-6"}>
          {!compact && (
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              🖼️ Изображения ({mediaData.images_count})
            </h3>
          )}
          <ImageGallery images={convertToMediaImages(mediaData.images)} compact={compact} />
        </div>
      )}

      {/* Документы */}
      {showDocuments && mediaData.has_files && mediaData.files.length > 0 && (
        <div>
          {!compact && (
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              📎 Документы ({mediaData.files_count})
            </h3>
          )}
          <DocumentList 
            documents={convertToMediaDocuments(mediaData.files)} 
            compact={compact} 
            requestId={requestId}
            showSize={true}
          />
        </div>
      )}
    </div>
  );
};
