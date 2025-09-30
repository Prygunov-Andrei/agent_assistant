// Форма создания проекта

import React, { useState } from 'react';
import type { ProjectCreationForm as ProjectForm } from '../../../types/projects';
import type { LLMAnalysisResult } from '../../../types/llm';

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
    title: initialData?.title || analysisResult?.project_type || '',
    description: initialData?.description || analysisResult?.description || '',
    project_type: initialData?.project_type || 1,
    genre: initialData?.genre,
    start_date: initialData?.start_date,
    end_date: initialData?.end_date,
    budget: initialData?.budget,
    director: initialData?.director,
    production_company: initialData?.production_company,
    request_id: requestId,
    roles: initialData?.roles || analysisResult?.roles.map((role: any) => ({
      title: role.title,
      description: role.description,
      gender: role.gender,
      age_range: role.age_range,
      skills_required: role.skills_required,
      selected_artists: role.suggested_artists,
    })) || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
      onSubmit(formData);
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
          >
            <option value={1}>Фильм</option>
            <option value={2}>Сериал</option>
            <option value={3}>Реклама</option>
            <option value={4}>Клип</option>
          </select>
          {errors.project_type && (
            <p className="text-red-500 text-xs mt-1">{errors.project_type}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Описание
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Описание проекта"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата начала
          </label>
          <input
            type="date"
            value={formData.start_date || ''}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата окончания
          </label>
          <input
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Бюджет
        </label>
        <input
          type="number"
          value={formData.budget || ''}
          onChange={(e) => handleInputChange('budget', e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Бюджет проекта"
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
