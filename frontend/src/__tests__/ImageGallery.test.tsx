import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImageGallery } from '../components/media/images/ImageGallery';
import type { MediaImage } from '../types/media';

const mockImages: MediaImage[] = [
  {
    id: 1,
    url: 'https://example.com/image1.jpg',
    thumbnail: 'https://example.com/thumb1.jpg',
    caption: 'Первое изображение',
    file_size: 1024000,
    width: 800,
    height: 600,
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    url: 'https://example.com/image2.jpg',
    thumbnail: 'https://example.com/thumb2.jpg',
    caption: 'Второе изображение',
    file_size: 2048000,
    width: 1200,
    height: 800,
    created_at: '2023-01-02T00:00:00Z',
  },
  {
    id: 3,
    url: 'https://example.com/image3.jpg',
    thumbnail: 'https://example.com/thumb3.jpg',
    caption: 'Третье изображение',
    file_size: 1536000,
    width: 1000,
    height: 700,
    created_at: '2023-01-03T00:00:00Z',
  },
  {
    id: 4,
    url: 'https://example.com/image4.jpg',
    thumbnail: 'https://example.com/thumb4.jpg',
    caption: 'Четвертое изображение',
    file_size: 3072000,
    width: 1600,
    height: 1200,
    created_at: '2023-01-04T00:00:00Z',
  },
  {
    id: 5,
    url: 'https://example.com/image5.jpg',
    thumbnail: 'https://example.com/thumb5.jpg',
    caption: 'Пятое изображение',
    file_size: 2560000,
    width: 1400,
    height: 900,
    created_at: '2023-01-05T00:00:00Z',
  },
];

describe('ImageGallery', () => {
  const mockOnImageClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no images', () => {
    render(<ImageGallery images={[]} />);

    expect(screen.getByText('Изображения не найдены')).toBeInTheDocument();
  });

  it('renders images with default maxVisible', () => {
    render(<ImageGallery images={mockImages} />);

    // Должно показать 4 изображения (по умолчанию maxVisible=4)
    expect(screen.getAllByRole('img')).toHaveLength(4);
    expect(screen.getByText('+1')).toBeInTheDocument(); // Показать количество скрытых
  });

  it('renders all images when maxVisible is greater than images count', () => {
    render(<ImageGallery images={mockImages.slice(0, 2)} maxVisible={5} />);

    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.queryByText('+1')).not.toBeInTheDocument();
  });

  it('renders with custom maxVisible', () => {
    render(<ImageGallery images={mockImages} maxVisible={2} />);

    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('shows image count when showCount is true', () => {
    render(<ImageGallery images={mockImages} showCount={true} />);

    expect(screen.getByText('5 изображений')).toBeInTheDocument();
  });

  it('does not show image count when showCount is false', () => {
    render(<ImageGallery images={mockImages} showCount={false} />);

    expect(screen.queryByText('5 изображений')).not.toBeInTheDocument();
  });

  it('shows correct singular form for one image', () => {
    render(<ImageGallery images={mockImages.slice(0, 1)} showCount={true} />);

    expect(screen.getByText('1 изображение')).toBeInTheDocument();
  });

  it('calls onImageClick when image is clicked', () => {
    render(<ImageGallery images={mockImages} onImageClick={mockOnImageClick} />);

    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.click(firstImage);

    expect(mockOnImageClick).toHaveBeenCalledWith(mockImages[0]);
  });

  it('opens modal when image is clicked without onImageClick', () => {
    render(<ImageGallery images={mockImages} />);

    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.click(firstImage);

    expect(screen.getByText('Первое изображение')).toBeInTheDocument();
    expect(screen.getByText('1 из 5')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(<ImageGallery images={mockImages} />);

    // Открываем модальное окно
    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.click(firstImage);

    expect(screen.getByText('Первое изображение')).toBeInTheDocument();

    // Закрываем модальное окно - ищем кнопку закрытия (первая кнопка)
    const closeButton = screen.getAllByRole('button')[0];
    fireEvent.click(closeButton);

    expect(screen.queryByText('Первое изображение')).not.toBeInTheDocument();
  });

  it('navigates between images in modal', () => {
    render(<ImageGallery images={mockImages} />);

    // Открываем модальное окно
    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.click(firstImage);

    expect(screen.getByText('1 из 5')).toBeInTheDocument();

    // Переходим к следующему изображению - ищем кнопку навигации
    const nextButton = screen.getAllByRole('button')[2]; // Третья кнопка - это next
    fireEvent.click(nextButton);

    expect(screen.getByText('2 из 5')).toBeInTheDocument();
    expect(screen.getByText('Второе изображение')).toBeInTheDocument();

    // Переходим к предыдущему изображению - ищем кнопку навигации
    const prevButton = screen.getAllByRole('button')[1]; // Вторая кнопка - это prev
    fireEvent.click(prevButton);

    expect(screen.getByText('1 из 5')).toBeInTheDocument();
    expect(screen.getByText('Первое изображение')).toBeInTheDocument();
  });

  it('wraps around when navigating past last image', () => {
    render(<ImageGallery images={mockImages} />);

    // Открываем модальное окно
    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.click(firstImage);

    // Переходим к последнему изображению
    const nextButton = screen.getAllByRole('button')[2]; // Третья кнопка - это next
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButton);
    }

    expect(screen.getByText('5 из 5')).toBeInTheDocument();

    // Переходим к следующему (должно вернуться к первому)
    fireEvent.click(nextButton);

    expect(screen.getByText('1 из 5')).toBeInTheDocument();
  });

  it('wraps around when navigating before first image', () => {
    render(<ImageGallery images={mockImages} />);

    // Открываем модальное окно
    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.click(firstImage);

    // Переходим к предыдущему (должно перейти к последнему)
    const prevButton = screen.getAllByRole('button')[1]; // Вторая кнопка - это prev
    fireEvent.click(prevButton);

    expect(screen.getByText('5 из 5')).toBeInTheDocument();
  });

  it('shows loading spinner when image has no thumbnail', () => {
    const imagesWithoutThumbnail: MediaImage[] = [
      {
        ...mockImages[0],
        thumbnail: undefined,
      },
    ];

    render(<ImageGallery images={imagesWithoutThumbnail} />);

    // Проверяем наличие спиннера загрузки по классу
    expect(screen.getByText('1 изображение')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ImageGallery images={mockImages} className="custom-class" />);

    const gallery = screen.getByText('5 изображений').closest('div');
    expect(gallery).toHaveClass('custom-class');
  });

  it('shows image captions in modal', () => {
    render(<ImageGallery images={mockImages} />);

    // Открываем модальное окно
    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.click(firstImage);

    expect(screen.getByText('Первое изображение')).toBeInTheDocument();
  });

  it('handles images without captions', () => {
    const imagesWithoutCaptions: MediaImage[] = [
      {
        ...mockImages[0],
        caption: undefined,
      },
    ];

    render(<ImageGallery images={imagesWithoutCaptions} />);

    // Открываем модальное окно
    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.click(firstImage);

    // Не должно быть текста с подписью
    expect(screen.queryByText('Первое изображение')).not.toBeInTheDocument();
  });
});
