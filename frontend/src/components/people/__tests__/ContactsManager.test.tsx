/**
 * Тесты для компонента ContactsManager
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContactsManager } from '../ContactsManager';

describe('ContactsManager', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('рендерит пустой список контактов', () => {
    render(
      <ContactsManager
        type="phone"
        contacts={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByPlaceholderText(/999/)).toBeInTheDocument();
  });

  test('рендерит существующие контакты', () => {
    render(
      <ContactsManager
        type="phone"
        contacts={['+7-111-111-11-11', '+7-222-222-22-22']}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('+7-111-111-11-11')).toBeInTheDocument();
    expect(screen.getByText('+7-222-222-22-22')).toBeInTheDocument();
  });

  test('помечает первый контакт как основной', () => {
    render(
      <ContactsManager
        type="email"
        contacts={['primary@test.com', 'secondary@test.com']}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Основной')).toBeInTheDocument();
  });

  test('добавляет новый контакт', () => {
    render(
      <ContactsManager
        type="phone"
        contacts={['+7-111-111-11-11']}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText(/999/);
    const addButton = screen.getByText('+ Добавить');

    fireEvent.change(input, { target: { value: '+7-222-222-22-22' } });
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith(['+7-111-111-11-11', '+7-222-222-22-22']);
  });

  test('добавляет контакт по нажатию Enter', () => {
    render(
      <ContactsManager
        type="email"
        contacts={['test1@test.com']}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText(/email/);

    fireEvent.change(input, { target: { value: 'test2@test.com' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnChange).toHaveBeenCalledWith(['test1@test.com', 'test2@test.com']);
  });

  test('удаляет контакт', () => {
    render(
      <ContactsManager
        type="phone"
        contacts={['+7-111-111-11-11', '+7-222-222-22-22']}
        onChange={mockOnChange}
      />
    );

    const deleteButtons = screen.getAllByText('Удалить');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith(['+7-222-222-22-22']);
  });

  test('не добавляет пустой контакт', () => {
    render(
      <ContactsManager
        type="phone"
        contacts={[]}
        onChange={mockOnChange}
      />
    );

    const addButton = screen.getByText('+ Добавить');
    fireEvent.click(addButton);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('показывает лимит контактов', () => {
    const fiveContacts = ['+7-111', '+7-222', '+7-333', '+7-444', '+7-555'];
    
    render(
      <ContactsManager
        type="phone"
        contacts={fiveContacts}
        onChange={mockOnChange}
        maxContacts={5}
      />
    );

    expect(screen.getByText(/Достигнут лимит контактов/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/999/)).not.toBeInTheDocument();
  });

  test('показывает счетчик контактов', () => {
    render(
      <ContactsManager
        type="phone"
        contacts={['+7-111', '+7-222', '+7-333']}
        onChange={mockOnChange}
        maxContacts={5}
      />
    );

    expect(screen.getByText(/\(3\/5\)/)).toBeInTheDocument();
  });

  test('использует кастомный label', () => {
    render(
      <ContactsManager
        type="phone"
        contacts={[]}
        onChange={mockOnChange}
        label="Рабочие телефоны"
      />
    );

    expect(screen.getByText(/Рабочие телефоны/)).toBeInTheDocument();
  });

  test('использует кастомный placeholder', () => {
    render(
      <ContactsManager
        type="phone"
        contacts={[]}
        onChange={mockOnChange}
        placeholder="Введите номер"
      />
    );

    expect(screen.getByPlaceholderText('Введите номер')).toBeInTheDocument();
  });
});

