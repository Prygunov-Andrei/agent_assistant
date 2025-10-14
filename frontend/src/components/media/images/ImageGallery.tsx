// Компонент галереи изображений

import React from 'react';
import type { ImageGalleryProps } from '../../../types/media';

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  maxVisible = 4,
  className = '',
}) => {
  const visibleImages = images.slice(0, maxVisible);
  const hiddenCount = images.length - maxVisible;

  if (images.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>Изображения не найдены</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Горизонтальный ряд изображений - ОБНОВЛЕНО */}
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap' }}>
        {visibleImages.map((image, index) => (
          <div
            key={image.id}
            className="flex-shrink-0"
          >
              <img
                src={image.url}
                alt={image.caption || `Изображение ${index + 1}`}
                className="h-24 w-auto rounded-lg border border-gray-200 object-cover"
                style={{ height: '192px', width: 'auto', maxWidth: '400px' }}
                loading="lazy"
              />
          </div>
        ))}

        {/* Показать количество скрытых изображений */}
        {hiddenCount > 0 && (
          <div className="flex-shrink-0">
            <div className="h-24 w-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-600">+{hiddenCount}</p>
                <p className="text-xs text-gray-500">еще</p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
