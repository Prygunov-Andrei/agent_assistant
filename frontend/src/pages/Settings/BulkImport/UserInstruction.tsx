/**
 * Компонент инструкции для пользователя по импорту персон
 */
import React from 'react';
import bulkImportService from '../../../services/bulkImportService';
import './BulkImport.css';

interface UserInstructionProps {
  onStart: () => void;
}

const UserInstruction: React.FC<UserInstructionProps> = ({ onStart }) => {
  const handleDownloadTemplate = async () => {
    try {
      await bulkImportService.downloadTemplateToFile();
    } catch (error) {
      console.error('Ошибка при скачивании шаблона:', error);
      // alert('Не удалось скачать шаблон. Попробуйте еще раз.'); // Убрано
    }
  };

  return (
    <div className="user-instruction">
      <h2>Как импортировать персон из Excel?</h2>
      
      <div className="instruction-content">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-text">
            <h3>Подготовьте Excel файл</h3>
            <p>
              Создайте файл в формате XLSX с таблицей персон. 
              Вы можете скачать готовый шаблон для заполнения.
            </p>
            <button 
              className="btn-download-template"
              onClick={handleDownloadTemplate}
              type="button"
            >
              📥 Скачать шаблон
            </button>
          </div>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-text">
            <h3>Структура файла</h3>
            <p>Файл должен содержать следующие столбцы:</p>
            <table className="structure-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Столбец</th>
                  <th>Описание</th>
                  <th>Пример</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Тип персоны</td>
                  <td>Роль (обязательно)</td>
                  <td>КД, Режиссер, Продюсер</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Фамилия</td>
                  <td>Фамилия (обязательно)</td>
                  <td>Иванов</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Имя</td>
                  <td>Имя (обязательно)</td>
                  <td>Иван</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Телефоны</td>
                  <td>Через пробел (опционально)</td>
                  <td>+79001234567 +79009876543</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>Telegram</td>
                  <td>Через пробел (опционально)</td>
                  <td>@ivanov @ivanov_official</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td>Email</td>
                  <td>Через пробел (опционально)</td>
                  <td>ivan@mail.ru ivan.work@gmail.com</td>
                </tr>
                <tr>
                  <td>7</td>
                  <td>Кинопоиск</td>
                  <td>Ссылка на профиль (опционально)</td>
                  <td>https://www.kinopoisk.ru/name/12345/</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <div className="step-text">
            <h3>Загрузите файл</h3>
            <p>
              После подготовки файла загрузите его в систему. 
              Мы автоматически проверим данные и найдем возможные дубликаты.
            </p>
          </div>
        </div>

        <div className="step">
          <div className="step-number">4</div>
          <div className="step-text">
            <h3>Разрешите конфликты</h3>
            <p>
              Если система найдет похожие персоны в базе, 
              вы сможете решить - создать новую запись или обновить существующую.
            </p>
          </div>
        </div>

        <div className="important-notes">
          <h3>⚠️ Важно:</h3>
          <ul>
            <li>Фамилия и Имя - обязательные поля</li>
            <li>Контакты можно указывать через пробел (несколько в одной ячейке)</li>
            <li>Система автоматически найдет дубликаты и предложит их обновить</li>
            <li>Максимальный размер файла - 5 МБ</li>
            <li>Рекомендуется начинать с небольших файлов (до 100 персон)</li>
          </ul>
        </div>
      </div>

      <div className="actions">
        <button 
          className="btn-primary btn-large"
          onClick={onStart}
          type="button"
        >
          Начать импорт →
        </button>
      </div>
    </div>
  );
};

export default UserInstruction;

