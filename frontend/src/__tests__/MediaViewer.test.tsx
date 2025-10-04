import { render, screen, waitFor } from '@testing-library/react';
import { MediaViewer } from '../components/MediaViewer';
import { mediaService } from '../services/mediaService';
import { RequestImage, RequestFile } from '../types';

// Мокаем mediaService
jest.mock('../services/mediaService', () => ({
  mediaService: {
    getRequestMedia: jest.fn(),
    getImageUrl: jest.fn((url) => `http://localhost:8000${url}`),
    getFileUrl: jest.fn((url) => `http://localhost:8000${url}`),
    formatFileSize: jest.fn((bytes) => `${bytes} bytes`),
    getFileIcon: jest.fn((_mimeType) => '📄'),
  },
}));

// Мокаем компоненты
jest.mock('../components/media/images/ImageGallery', () => ({
  ImageGallery: function MockImageGallery({ images }: { images: any[] }) {
    return (
      <div data-testid="image-gallery">
        {images.map((img, index) => (
          <div key={img.id} data-testid={`image-${index}`}>
            {img.caption || `Image ${index + 1}`}
          </div>
        ))}
      </div>
    );
  },
}));

jest.mock('../components/media/documents/DocumentList', () => ({
  DocumentList: function MockDocumentList({ documents }: { documents: any[] }) {
    return (
      <div data-testid="document-list">
        {documents.map((doc, index) => (
          <div key={doc.id} data-testid={`document-${index}`}>
            {doc.filename}
          </div>
        ))}
      </div>
    );
  },
}));

jest.mock('../components/LoadingSpinner', () => {
  return function MockLoadingSpinner({ text }: { text?: string }) {
    return <div data-testid="loading-spinner">{text}</div>;
  };
});

const mockMediaService = mediaService as jest.Mocked<typeof mediaService>;

describe('MediaViewer', () => {
  const mockRequestId = 123;
  
  const mockImages: RequestImage[] = [
    {
      id: 1,
      request: 123,
      image: '/media/test1.jpg',
      caption: 'Test image 1',
      file_size: 1024,
      file_size_mb: 0.001,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      request: 123,
      image: '/media/test2.jpg',
      caption: 'Test image 2',
      file_size: 2048,
      file_size_mb: 0.002,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const mockFiles: RequestFile[] = [
    {
      id: 1,
      request: 123,
      file: '/media/test1.txt',
      original_filename: 'test1.txt',
      file_size: 512,
      mime_type: 'text/plain',
      file_size_mb: 0.0005,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      request: 123,
      file: '/media/test2.pdf',
      original_filename: 'test2.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
      file_size_mb: 0.001,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('отображает загрузку при загрузке медиафайлов', async () => {
    mockMediaService.getRequestMedia.mockImplementation(
      () => new Promise(() => {}) // Никогда не резолвится
    );

    render(<MediaViewer requestId={mockRequestId} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Загрузка медиафайлов...')).toBeInTheDocument();
  });

  it('отображает медиафайлы после успешной загрузки', async () => {
    const mockMediaData = {
      id: mockRequestId,
      has_images: true,
      has_files: true,
      images: mockImages,
      files: mockFiles,
      images_count: 2,
      files_count: 2,
      total_size: 1024 + 2048 + 512 + 1024,
    };

    mockMediaService.getRequestMedia.mockResolvedValue(mockMediaData);

    render(<MediaViewer requestId={mockRequestId} />);

    await waitFor(() => {
      expect(screen.getByText('🖼️ Изображения (2)')).toBeInTheDocument();
      expect(screen.getByText('📎 Документы (2)')).toBeInTheDocument();
    });

    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
    expect(screen.getByTestId('document-list')).toBeInTheDocument();
    expect(screen.getByTestId('image-0')).toBeInTheDocument();
    expect(screen.getByTestId('image-1')).toBeInTheDocument();
    expect(screen.getByTestId('document-0')).toBeInTheDocument();
    expect(screen.getByTestId('document-1')).toBeInTheDocument();
  });

  it('отображает только изображения когда showDocuments=false', async () => {
    const mockMediaData = {
      id: mockRequestId,
      has_images: true,
      has_files: true,
      images: mockImages,
      files: mockFiles,
      images_count: 2,
      files_count: 2,
      total_size: 1024 + 2048 + 512 + 1024,
    };

    mockMediaService.getRequestMedia.mockResolvedValue(mockMediaData);

    render(<MediaViewer requestId={mockRequestId} showDocuments={false} />);

    await waitFor(() => {
      expect(screen.getByText('🖼️ Изображения (2)')).toBeInTheDocument();
      expect(screen.queryByText('📎 Документы (2)')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
    expect(screen.queryByTestId('document-list')).not.toBeInTheDocument();
  });

  it('отображает только документы когда showImages=false', async () => {
    const mockMediaData = {
      id: mockRequestId,
      has_images: true,
      has_files: true,
      images: mockImages,
      files: mockFiles,
      images_count: 2,
      files_count: 2,
      total_size: 1024 + 2048 + 512 + 1024,
    };

    mockMediaService.getRequestMedia.mockResolvedValue(mockMediaData);

    render(<MediaViewer requestId={mockRequestId} showImages={false} />);

    await waitFor(() => {
      expect(screen.queryByText('🖼️ Изображения (2)')).not.toBeInTheDocument();
      expect(screen.getByText('📎 Документы (2)')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
    expect(screen.getByTestId('document-list')).toBeInTheDocument();
  });

  it('отображает сообщение об отсутствии медиафайлов', async () => {
    const mockMediaData = {
      id: mockRequestId,
      has_images: false,
      has_files: false,
      images: [],
      files: [],
      images_count: 0,
      files_count: 0,
      total_size: 0,
    };

    mockMediaService.getRequestMedia.mockResolvedValue(mockMediaData);

    render(<MediaViewer requestId={mockRequestId} />);

    await waitFor(() => {
      expect(screen.getByText('Медиафайлы не найдены')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
    expect(screen.queryByTestId('document-list')).not.toBeInTheDocument();
  });

  it('отображает ошибку при неудачной загрузке', async () => {
    mockMediaService.getRequestMedia.mockRejectedValue(new Error('Network error'));

    render(<MediaViewer requestId={mockRequestId} />);

    await waitFor(() => {
      expect(screen.getByText('Не удалось загрузить медиафайлы')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
    expect(screen.queryByTestId('document-list')).not.toBeInTheDocument();
  });

  it('вызывает mediaService.getRequestMedia с правильным requestId', async () => {
    const mockMediaData = {
      id: mockRequestId,
      has_images: false,
      has_files: false,
      images: [],
      files: [],
      images_count: 0,
      files_count: 0,
      total_size: 0,
    };

    mockMediaService.getRequestMedia.mockResolvedValue(mockMediaData);

    render(<MediaViewer requestId={mockRequestId} />);

    await waitFor(() => {
      expect(mockMediaService.getRequestMedia).toHaveBeenCalledWith(mockRequestId);
    });
  });

  it('перезагружает медиафайлы при изменении requestId', async () => {
    const mockMediaData = {
      id: mockRequestId,
      has_images: false,
      has_files: false,
      images: [],
      files: [],
      images_count: 0,
      files_count: 0,
      total_size: 0,
    };

    mockMediaService.getRequestMedia.mockResolvedValue(mockMediaData);

    const { rerender } = render(<MediaViewer requestId={mockRequestId} />);

    await waitFor(() => {
      expect(mockMediaService.getRequestMedia).toHaveBeenCalledWith(mockRequestId);
    });

    // Изменяем requestId
    const newRequestId = 456;
    rerender(<MediaViewer requestId={newRequestId} />);

    await waitFor(() => {
      expect(mockMediaService.getRequestMedia).toHaveBeenCalledWith(newRequestId);
    });

    // Проверяем, что сервис был вызван дважды
    expect(mockMediaService.getRequestMedia).toHaveBeenCalledTimes(2);
  });
});
