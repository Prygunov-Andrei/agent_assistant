import React, { useState, useEffect } from 'react';
import type { ProjectRoleForm as ProjectRoleFormType } from '../../../types/projects';
import { projectRolesService, type RoleType } from '../../../services/projectRoles';
import ArtistSelectionComponent from './ArtistSelectionComponent';

interface ProjectRoleFormProps {
  initialData?: Partial<ProjectRoleFormType>;
  onSubmit: (data: ProjectRoleFormType) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const ProjectRoleForm: React.FC<ProjectRoleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<ProjectRoleFormType>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    role_type: initialData?.role_type,
    media_presence: initialData?.media_presence || 'doesnt_matter',
    clothing_size: initialData?.clothing_size || '',
    hairstyle: initialData?.hairstyle || '',
    hair_color: initialData?.hair_color || '',
    eye_color: initialData?.eye_color || '',
    height: initialData?.height || '',
    body_type: initialData?.body_type || '',
    reference_text: initialData?.reference_text || '',
    special_conditions: initialData?.special_conditions || '',
    audition_requirements: initialData?.audition_requirements || '',
    audition_text: initialData?.audition_text || '',
    rate_per_shift: initialData?.rate_per_shift || '',
    rate_conditions: initialData?.rate_conditions || '',
    shooting_dates: initialData?.shooting_dates || '',
    shooting_location: initialData?.shooting_location || '',
    notes: initialData?.notes || '',
    skills_required: initialData?.skills_required || [],
    suggested_artists: initialData?.suggested_artists || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка типов ролей при монтировании компонента
  useEffect(() => {
    const loadRoleTypes = async () => {
      try {
        setLoading(true);
        const roleTypesData = await projectRolesService.getRoleTypes();
        setRoleTypes(roleTypesData);
      } catch (error) {
        console.error('Ошибка загрузки типов ролей:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRoleTypes();
  }, []);

  const handleInputChange = (field: keyof ProjectRoleFormType, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSkillsChange = (value: string) => {
    const skills = value.split(',').map(s => s.trim()).filter(s => s);
    handleInputChange('skills_required', skills);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название роли обязательно';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Основная информация */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 mb-1">
            Название роли *
          </label>
          <input
            id="role-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Введите название роли"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="role-type" className="block text-sm font-medium text-gray-700 mb-1">
            Тип роли
          </label>
          <select
            id="role-type"
            value={formData.role_type || ''}
            onChange={(e) => handleInputChange('role_type', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            <option value="">Выберите тип роли</option>
            {roleTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

          <div>
            <label htmlFor="role-description" className="block text-sm font-medium text-gray-700 mb-1">
              Описание роли
            </label>
            <textarea
              id="role-description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Описание роли"
            />
          </div>

      {/* Внешность и характеристики */}
      <div className="border-t pt-4">
        <h4 className="text-md font-medium mb-4">Внешность и характеристики</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="media-presence" className="block text-sm font-medium text-gray-700 mb-1">
                  Медийность
                </label>
                <select
                  id="media-presence"
                  value={formData.media_presence || 'doesnt_matter'}
                  onChange={(e) => handleInputChange('media_presence', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
              <option value="doesnt_matter">Неважно</option>
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>

              <div>
                <label htmlFor="clothing-size" className="block text-sm font-medium text-gray-700 mb-1">
                  Размер одежды
                </label>
                <input
                  id="clothing-size"
                  type="text"
                  value={formData.clothing_size || ''}
                  onChange={(e) => handleInputChange('clothing_size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Например: M, L, XL"
                />
          </div>

              <div>
                <label htmlFor="hairstyle" className="block text-sm font-medium text-gray-700 mb-1">
                  Прическа
                </label>
                <input
                  id="hairstyle"
                  type="text"
                  value={formData.hairstyle || ''}
                  onChange={(e) => handleInputChange('hairstyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Тип прически"
                />
          </div>

              <div>
                <label htmlFor="hair-color" className="block text-sm font-medium text-gray-700 mb-1">
                  Цвет волос
                </label>
                <input
                  id="hair-color"
                  type="text"
                  value={formData.hair_color || ''}
                  onChange={(e) => handleInputChange('hair_color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Цвет волос"
                />
          </div>

              <div>
                <label htmlFor="eye-color" className="block text-sm font-medium text-gray-700 mb-1">
                  Цвет глаз
                </label>
                <input
                  id="eye-color"
                  type="text"
                  value={formData.eye_color || ''}
                  onChange={(e) => handleInputChange('eye_color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Цвет глаз"
                />
          </div>

              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                  Рост
                </label>
                <input
                  id="height"
                  type="text"
                  value={formData.height || ''}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Например: 170-180 см"
                />
          </div>

              <div>
                <label htmlFor="body-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Телосложение
                </label>
                <input
                  id="body-type"
                  type="text"
                  value={formData.body_type || ''}
                  onChange={(e) => handleInputChange('body_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Тип телосложения"
                />
          </div>
        </div>
      </div>

      {/* Референсы и материалы */}
      <div className="border-t pt-4">
        <h4 className="text-md font-medium mb-4">Референсы и материалы</h4>
        <div className="space-y-4">
              <div>
                <label htmlFor="reference-text" className="block text-sm font-medium text-gray-700 mb-1">
                  Текстовый референс
                </label>
                <textarea
                  id="reference-text"
                  value={formData.reference_text || ''}
                  onChange={(e) => handleInputChange('reference_text', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Описание референса"
                />
              </div>

          <div>
            <label htmlFor="special-conditions" className="block text-sm font-medium text-gray-700 mb-1">
              Особые условия
            </label>
            <textarea
              id="special-conditions"
              value={formData.special_conditions || ''}
              onChange={(e) => handleInputChange('special_conditions', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Особые требования или условия"
            />
          </div>

          <div>
            <label htmlFor="audition-requirements" className="block text-sm font-medium text-gray-700 mb-1">
              Требования к пробам
            </label>
            <textarea
              id="audition-requirements"
              value={formData.audition_requirements || ''}
              onChange={(e) => handleInputChange('audition_requirements', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Что требуется для проб"
            />
          </div>

          <div>
            <label htmlFor="audition-text" className="block text-sm font-medium text-gray-700 mb-1">
              Текст проб
            </label>
            <textarea
              id="audition-text"
              value={formData.audition_text || ''}
              onChange={(e) => handleInputChange('audition_text', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Текстовый материал для проб"
            />
          </div>
        </div>
      </div>

      {/* Рабочие условия */}
      <div className="border-t pt-4">
        <h4 className="text-md font-medium mb-4">Рабочие условия</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rate-per-shift" className="block text-sm font-medium text-gray-700 mb-1">
                  Ставка за смену
                </label>
                <input
                  id="rate-per-shift"
                  type="text"
                  value={formData.rate_per_shift || ''}
                  onChange={(e) => handleInputChange('rate_per_shift', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ставка оплаты"
                />
              </div>

              <div>
                <label htmlFor="shooting-location" className="block text-sm font-medium text-gray-700 mb-1">
                  Место съемки
                </label>
                <input
                  id="shooting-location"
                  type="text"
                  value={formData.shooting_location || ''}
                  onChange={(e) => handleInputChange('shooting_location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Место проведения съемок"
                />
              </div>
        </div>

            <div className="mt-4">
              <label htmlFor="rate-conditions" className="block text-sm font-medium text-gray-700 mb-1">
                Условия по ставке
              </label>
              <textarea
                id="rate-conditions"
                value={formData.rate_conditions || ''}
                onChange={(e) => handleInputChange('rate_conditions', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Дополнительные условия оплаты"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="shooting-dates" className="block text-sm font-medium text-gray-700 mb-1">
                Даты смен
              </label>
              <textarea
                id="shooting-dates"
                value={formData.shooting_dates || ''}
                onChange={(e) => handleInputChange('shooting_dates', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Планируемые даты съемок"
              />
            </div>
      </div>

      {/* Навыки и артисты */}
      <div className="border-t pt-4">
        <h4 className="text-md font-medium mb-4">Навыки и артисты</h4>
        <div className="space-y-4">
          <div>
            <label htmlFor="skills-required" className="block text-sm font-medium text-gray-700 mb-1">
              Требуемые навыки
            </label>
            <input
              id="skills-required"
              type="text"
              value={formData.skills_required.join(', ')}
              onChange={(e) => handleSkillsChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Навыки через запятую"
            />
          </div>

          <div>
            <label htmlFor="suggested-artists" className="block text-sm font-medium text-gray-700 mb-2">
              Предложенные артисты
            </label>
            <ArtistSelectionComponent
              selectedArtists={formData.suggested_artists}
              onSelectionChange={(artistIds) => handleInputChange('suggested_artists', artistIds)}
              placeholder="Выберите артистов для этой роли..."
              maxSelections={10}
              className="border border-gray-300 rounded-md p-3"
            />
          </div>
        </div>
      </div>

      {/* Заметки */}
      <div className="border-t pt-4">
        <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Заметки
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Дополнительные заметки по роли"
            />
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {isEditing ? 'Сохранить изменения' : 'Создать роль'}
        </button>
      </div>
    </form>
  );
};
