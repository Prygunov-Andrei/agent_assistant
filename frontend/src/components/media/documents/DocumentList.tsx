// Компонент списка документов

import React from 'react';
import type { MediaDocument, DocumentListProps } from '../../../types/media';

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDownload,
  className = '',
}) => {
  const handleDownload = async (doc: MediaDocument, event: React.MouseEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(doc.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.filename || 'download';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      onDownload?.(doc);
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      window.open(doc.url, '_blank');
    }
  };

  if (documents.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>Документы не найдены</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {documents.map((document) => (
        <div key={document.id} className="flex items-center gap-2">
          <div
            onClick={(e) => handleDownload(document, e)}
            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-sm transition-all duration-200"
            title={`Скачать ${document.filename || 'файл'}`}
          >
            {document.filename || 'Неизвестный файл'}
          </div>
        </div>
      ))}
    </div>
  );
};
