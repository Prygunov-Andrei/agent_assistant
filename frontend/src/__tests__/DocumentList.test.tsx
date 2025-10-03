import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DocumentList } from '../components/media/documents/DocumentList';
import type { MediaDocument } from '../types/media';

const mockDocuments: MediaDocument[] = [
  {
    id: 1,
    url: 'https://example.com/document1.pdf',
    filename: 'document1.pdf',
    file_size: 1000000,
    mime_type: 'application/pdf',
    description: 'Первый документ',
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    url: 'https://example.com/document2.docx',
    filename: 'document2.docx',
    file_size: 2048000,
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: 'Второй документ',
    created_at: '2023-01-02T00:00:00Z',
  },
  {
    id: 3,
    url: 'https://example.com/document3.xlsx',
    filename: 'document3.xlsx',
    file_size: 1536000,
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    description: 'Третий документ',
    created_at: '2023-01-03T00:00:00Z',
  },
  {
    id: 4,
    url: 'https://example.com/image.jpg',
    filename: 'image.jpg',
    file_size: 512000,
    mime_type: 'image/jpeg',
    description: 'Изображение',
    created_at: '2023-01-04T00:00:00Z',
  },
];

describe('DocumentList', () => {
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no documents', () => {
    render(<DocumentList documents={[]} />);

    expect(screen.getByText('Документы не найдены')).toBeInTheDocument();
  });

  it('renders documents list', () => {
    render(<DocumentList documents={mockDocuments} />);

    expect(screen.getByText('document1.pdf')).toBeInTheDocument();
    expect(screen.getByText('document2.docx')).toBeInTheDocument();
    expect(screen.getByText('document3.xlsx')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
  });

  it('shows file icons based on mime type', () => {
    render(<DocumentList documents={mockDocuments} />);

    expect(screen.getByText('📄')).toBeInTheDocument(); // PDF
    expect(screen.getAllByText('📝')).toHaveLength(2); // DOCX and XLSX both use 📝
    expect(screen.getByText('🖼️')).toBeInTheDocument(); // JPEG
  });

  it('shows file sizes when showSize is true', () => {
    render(<DocumentList documents={mockDocuments} showSize={true} />);

    expect(screen.getByText('976.56 KB')).toBeInTheDocument();
    expect(screen.getByText('1.95 MB')).toBeInTheDocument();
    expect(screen.getByText('1.46 MB')).toBeInTheDocument();
    expect(screen.getByText('500 KB')).toBeInTheDocument();
  });

  it('does not show file sizes when showSize is false', () => {
    render(<DocumentList documents={mockDocuments} showSize={false} />);

    expect(screen.queryByText('1.00 MB')).not.toBeInTheDocument();
  });

  it('shows file types when showType is true', () => {
    render(<DocumentList documents={mockDocuments} showType={true} />);

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT')).toBeInTheDocument();
    expect(screen.getByText('VND.OPENXMLFORMATS-OFFICEDOCUMENT.SPREADSHEETML.SHEET')).toBeInTheDocument();
    expect(screen.getByText('JPEG')).toBeInTheDocument();
  });

  it('does not show file types when showType is false', () => {
    render(<DocumentList documents={mockDocuments} showType={false} />);

    expect(screen.queryByText('PDF')).not.toBeInTheDocument();
  });

  it('shows file descriptions', () => {
    render(<DocumentList documents={mockDocuments} />);

    expect(screen.getByText('Первый документ')).toBeInTheDocument();
    expect(screen.getByText('Второй документ')).toBeInTheDocument();
    expect(screen.getByText('Третий документ')).toBeInTheDocument();
    expect(screen.getByText('Изображение')).toBeInTheDocument();
  });

  it('shows creation dates', () => {
    render(<DocumentList documents={mockDocuments} />);

    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('1/2/2023')).toBeInTheDocument();
    expect(screen.getByText('1/3/2023')).toBeInTheDocument();
    expect(screen.getByText('1/4/2023')).toBeInTheDocument();
  });

  it('calls onDownload when document is clicked', () => {
    render(<DocumentList documents={mockDocuments} onDownload={mockOnDownload} />);

    const firstDocument = screen.getByText('document1.pdf').closest('div');
    fireEvent.click(firstDocument!);

    expect(mockOnDownload).toHaveBeenCalledWith(mockDocuments[0]);
  });

  it('calls onDownload when download button is clicked', () => {
    render(<DocumentList documents={mockDocuments} onDownload={mockOnDownload} />);

    const downloadButtons = screen.getAllByTitle('Скачать файл');
    fireEvent.click(downloadButtons[0]);

    expect(mockOnDownload).toHaveBeenCalledWith(mockDocuments[0]);
  });


  it('shows document count', () => {
    render(<DocumentList documents={mockDocuments} />);

    expect(screen.getByText('4 документов')).toBeInTheDocument();
  });

  it('shows correct singular form for one document', () => {
    render(<DocumentList documents={mockDocuments.slice(0, 1)} />);

    expect(screen.getByText('1 документ')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<DocumentList documents={mockDocuments} className="custom-class" />);

    const documentList = screen.getByText('4 документов').closest('div')?.parentElement;
    expect(documentList).toHaveClass('custom-class');
  });

  it('formats file sizes correctly', () => {
    const documentsWithDifferentSizes: MediaDocument[] = [
      {
        id: 1,
        url: 'https://example.com/small.txt',
        filename: 'small.txt',
        file_size: 0,
        mime_type: 'text/plain',
        created_at: '2023-01-01T00:00:00Z',
      },
      {
        id: 2,
        url: 'https://example.com/medium.txt',
        filename: 'medium.txt',
        file_size: 1024,
        mime_type: 'text/plain',
        created_at: '2023-01-01T00:00:00Z',
      },
      {
        id: 3,
        url: 'https://example.com/large.txt',
        filename: 'large.txt',
        file_size: 1048576,
        mime_type: 'text/plain',
        created_at: '2023-01-01T00:00:00Z',
      },
      {
        id: 4,
        url: 'https://example.com/huge.txt',
        filename: 'huge.txt',
        file_size: 1073741824,
        mime_type: 'text/plain',
        created_at: '2023-01-01T00:00:00Z',
      },
    ];

    render(<DocumentList documents={documentsWithDifferentSizes} showSize={true} />);

    expect(screen.getByText('0 Bytes')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('1 MB')).toBeInTheDocument();
    expect(screen.getByText('1 GB')).toBeInTheDocument();
  });

  it('handles documents without descriptions', () => {
    const documentsWithoutDescriptions: MediaDocument[] = [
      {
        id: 1,
        url: 'https://example.com/document1.pdf',
        filename: 'document1.pdf',
        file_size: 1024000,
        mime_type: 'application/pdf',
        created_at: '2023-01-01T00:00:00Z',
      },
    ];

    render(<DocumentList documents={documentsWithoutDescriptions} />);

    expect(screen.getByText('document1.pdf')).toBeInTheDocument();
    // Не должно быть текста с описанием
    expect(screen.queryByText('Первый документ')).not.toBeInTheDocument();
  });
});
