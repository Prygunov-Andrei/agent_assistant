// Форма создания проекта

import React, { useState, useEffect } from 'react';
import type { ProjectCreationForm as ProjectForm, ProjectType, Genre } from '../../../types/projects';
import type { LLMAnalysisResult } from '../../../types/llm';
import { projectsService } from '../../../services/projects';

interface ProjectCreationFormProps {
  initialData?: Partial<ProjectForm>;
  requestId?: number;
  analysisResult?: LLMAnalysisResult;
  onSubmit: (data: ProjectForm) => void;
  onCancel: () => void;
}

export const ProjectCreationForm: React.FC<ProjectCreationFormProps> = ({
  initialData,
  requestId,
  analysisResult,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ProjectForm>({
    title: initialData?.title || analysisResult?.project_analysis?.project_title || '',
    description: initialData?.description || analysisResult?.project_analysis?.description || '',
    project_type: initialData?.project_type || 1,
    genre: initialData?.genre,
    premiere_date: initialData?.premiere_date || analysisResult?.project_analysis?.premiere_date,
    request_id: requestId,
    roles: initialData?.roles || analysisResult?.project_analysis?.roles?.map((role: any) => ({
      title: role.name || role.title,
      description: role.description,
      gender: role.gender || 'any',
      age_range: role.age_range,
      skills_required: role.skills_required || [],
      selected_artists: role.suggested_artists || [],
    })) || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка справочников при монтировании компонента
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setLoading(true);
        const [projectTypesData, genresData] = await Promise.all([
          projectsService.getProjectTypes(),
          projectsService.getGenres(),
        ]);
        setProjectTypes(projectTypesData);
        setGenres(genresData);
      } catch (error) {
        console.error('Ошибка загрузки справочников:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  const handleInputChange = (field: keyof ProjectForm, value: any) => {
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

  const handleRoleChange = (index: number, field: keyof ProjectForm['roles'][0], value: any) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.map((role, i) => 
        i === index ? { ...role, [field]: value } : role
      ),
    }));
  };

  const addRole = () => {
    setFormData(prev => ({
      ...prev,
      roles: [...prev.roles, {
        title: '',
        description: '',
        gender: 'any',
        age_range: undefined,
        skills_required: [],
        selected_artists: [],
      }],
    }));
  };

  const removeRole = (index: number) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название проекта обязательно';
    }

    if (!formData.project_type) {
      newErrors.project_type = 'Тип проекта обязателен';
    }

    if (!formData.genre) {
      newErrors.genre = 'Жанр обязателен';
    }

    formData.roles.forEach((role, index) => {
      if (!role.title.trim()) {
        newErrors[`role_${index}_title`] = 'Название роли обязательно';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Отправляем все поля проекта, включая roles
      const projectData = {
        title: formData.title,
        description: formData.description,
        project_type: formData.project_type,
        genre: formData.genre,
        premiere_date: formData.premiere_date,
        request_id: formData.request_id,
        roles: formData.roles,
      };
      onSubmit(projectData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название проекта *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Введите название проекта"
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип проекта *
          </label>
          <select
            value={formData.project_type}
            onChange={(e) => handleInputChange('project_type', parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.project_type ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value="">Выберите тип проекта</option>
            {projectTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {errors.project_type && (
            <p className="text-red-500 text-xs mt-1">{errors.project_type}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Жанр *
          </label>
          <select
            value={formData.genre || ''}
            onChange={(e) => handleInputChange('genre', parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.genre ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={loading}
          >
            <option value="">Выберите жанр</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
          {errors.genre && (
            <p className="text-red-500 text-xs mt-1">{errors.genre}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата премьеры
          </label>
          <input
            type="date"
            value={formData.premiere_date || ''}
            onChange={(e) => handleInputChange('premiere_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Описание проекта
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Описание проекта"
        />
      </div>

      {/* Роли */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Роли в проекте</h3>
          <button
            type="button"
            onClick={addRole}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Добавить роль
          </button>
        </div>

        <div className="space-y-4">
          {formData.roles.map((role, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium">Роль {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeRole(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Удалить
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название роли *
                  </label>
                  <input
                    type="text"
                    value={role.title}
                    onChange={(e) => handleRoleChange(index, 'title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors[`role_${index}_title`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Название роли"
                  />
                  {errors[`role_${index}_title`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`role_${index}_title`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пол
                  </label>
                  <select
                    value={role.gender}
                    onChange={(e) => handleRoleChange(index, 'gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="any">Любой</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание роли
                </label>
                <textarea
                  value={role.description}
                  onChange={(e) => handleRoleChange(index, 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Описание роли"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Требуемые навыки
                </label>
                <input
                  type="text"
                  value={role.skills_required.join(', ')}
                  onChange={(e) => handleRoleChange(index, 'skills_required', e.target.value.split(', ').filter(s => s.trim()))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Навыки через запятую"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
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
          Создать проект
        </button>
      </div>
    </form>
  );
};
