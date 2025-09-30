// Типы для медиа-компонентов

// Изображение
export interface MediaImage {
  id: number;
  url: string;
  thumbnail?: string;
  caption?: string;
  file_size?: number;
  width?: number;
  height?: number;
  created_at: string;
}

// Документ
export interface MediaDocument {
  id: number;
  url: string;
  filename: string;
  file_size: number;
  mime_type: string;
  description?: string;
  created_at: string;
}

// Медиа-группа
export interface MediaGroup {
  id: string;
  images: MediaImage[];
  documents: MediaDocument[];
  created_at: string;
}

// Пропсы для компонента изображения
export interface ImageProps {
  image: MediaImage;
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
  showCaption?: boolean;
  onClick?: (image: MediaImage) => void;
  className?: string;
}

// Пропсы для галереи изображений
export interface ImageGalleryProps {
  images: MediaImage[];
  maxVisible?: number;
  showCount?: boolean;
  onImageClick?: (image: MediaImage) => void;
  className?: string;
}

// Пропсы для списка документов
export interface DocumentListProps {
  documents: MediaDocument[];
  showSize?: boolean;
  showType?: boolean;
  onDownload?: (document: MediaDocument) => void;
  className?: string;
}

// Пропсы для медиа-просмотрщика
export interface MediaViewerProps {
  media: MediaGroup;
  showImages?: boolean;
  showDocuments?: boolean;
  className?: string;
}

// Конфигурация медиа
export interface MediaConfig {
  imageSizes: {
    thumbnail: { width: number; height: number };
    small: { width: number; height: number };
    medium: { width: number; height: number };
    large: { width: number; height: number };
  };
  maxFileSize: number; // в байтах
  allowedImageTypes: string[];
  allowedDocumentTypes: string[];
}
