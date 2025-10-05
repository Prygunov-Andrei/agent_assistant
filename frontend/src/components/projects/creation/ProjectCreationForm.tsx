// Форма создания проекта

import React, { useState, useEffect } from 'react';
import type { ProjectCreationForm as ProjectForm, ProjectType, Genre } from '../../../types/projects';
import type { LLMAnalysisResult } from '../../../types/llm';
import { projectsService } from '../../../services/projects';
import { ErrorHandler } from '../../../utils/errorHandler';
import ArtistSelectionComponent from '../roles/ArtistSelectionComponent';
import { CompanySelectionComponent, DuplicateProjectWarning } from '../../matching';
import { TeamMemberSelector } from './TeamMemberSelector';

interface ProjectCreationFormProps {
  initialData?: Partial<ProjectForm>;
  requestId?: number;
  analysisResult?: LLMAnalysisResult;
  onSubmit: (data: ProjectForm) => void;
  onCancel: () => void;
  onChange?: (hasChanges: boolean) => void;
}

export const ProjectCreationForm: React.FC<ProjectCreationFormProps> = ({
  initialData,
  requestId,
  analysisResult,
  onSubmit,
  onCancel,
  onChange,
}) => {
  const [formData, setFormData] = useState<ProjectForm>({
    title: initialData?.title || analysisResult?.project_analysis?.project_title || '',
    description: initialData?.description || analysisResult?.project_analysis?.description || '',
    project_type: initialData?.project_type || 1,
    genre: initialData?.genre,
    premiere_date: initialData?.premiere_date || analysisResult?.project_analysis?.premiere_date,
    request_id: requestId,
    roles: initialData?.roles || analysisResult?.project_analysis?.roles?.map((role: any) => ({
      name: role.character_name || role.name || role.title || '',
      description: role.description || '',
      media_presence: role.media_presence || 'doesnt_matter' as const,
      clothing_size: role.clothing_size || '',
      hairstyle: role.hairstyle || '',
      hair_color: role.hair_color || '',
      eye_color: role.eye_color || '',
      height: role.height || '',
      body_type: role.body_type || '',
      reference_text: role.reference_text || '',
      special_conditions: role.special_conditions || '',
      audition_requirements: role.audition_requirements || '',
      audition_text: role.audition_text || '',
      rate_per_shift: role.rate_per_shift || '',
      rate_conditions: role.rate_conditions || '',
      shooting_dates: role.shooting_dates || '',
      shooting_location: role.shooting_location || '',
      notes: role.notes || '',
      skills_required: Array.isArray(role.skills_required) 
        ? role.skills_required 
        : role.skills_required?.acting_skills || [],
      suggested_artists: role.suggested_artists || [],
    })) || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
          // Состояние для выбора компаний и проверки дубликатов
          const [selectedProductionCompany, setSelectedProductionCompany] = useState<number | null>(null);
          const [duplicateProjects, setDuplicateProjects] = useState<any[]>([]);
          const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
          
          // Состояние для выбранных участников команды
          const [selectedCastingDirector, setSelectedCastingDirector] = useState<{id: number | null, name: string | null}>({id: null, name: null});
          const [selectedDirector, setSelectedDirector] = useState<{id: number | null, name: string | null}>({id: null, name: null});
          const [selectedProducer, setSelectedProducer] = useState<{id: number | null, name: string | null}>({id: null, name: null});

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
        ErrorHandler.logError(error, 'ProjectCreationForm.loadDictionaries');
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  // Обновление ролей когда приходит анализ LLM
  useEffect(() => {
    if (analysisResult?.project_analysis?.roles && analysisResult.project_analysis.roles.length > 0) {
      const llmRoles = analysisResult.project_analysis.roles.map((role: any) => ({
        name: role.character_name || role.name || role.title || '',
        description: role.description || '',
        media_presence: role.media_presence || 'doesnt_matter' as const,
        clothing_size: role.clothing_size || '',
        hairstyle: role.hairstyle || '',
        hair_color: role.hair_color || '',
        eye_color: role.eye_color || '',
        height: role.height || '',
        body_type: role.body_type || '',
        reference_text: role.reference_text || '',
        special_conditions: role.special_conditions || '',
        audition_requirements: role.audition_requirements || '',
        audition_text: role.audition_text || '',
        rate_per_shift: role.rate_per_shift || '',
        rate_conditions: role.rate_conditions || '',
        shooting_dates: role.shooting_dates || '',
        shooting_location: role.shooting_location || '',
        notes: role.notes || '',
        skills_required: Array.isArray(role.skills_required) 
          ? role.skills_required 
          : role.skills_required?.acting_skills || [],
        suggested_artists: role.suggested_artists || [],
      }));

      setFormData(prev => ({
        ...prev,
        roles: llmRoles
      }));
    }
  }, [analysisResult]);

  // Отслеживание изменений формы
  const notifyChanges = (hasFormChanges: boolean) => {
    if (hasFormChanges !== hasChanges) {
      setHasChanges(hasFormChanges);
      onChange?.(hasFormChanges);
    }
  };

  // Обработчик изменения полей формы
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    notifyChanges(true);
  };

  // Обработчик изменения ролей
  const handleRoleChange = (roleIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.map((role, index) => 
        index === roleIndex ? { ...role, [field]: value } : role
      )
    }));
    notifyChanges(true);
  };

  // Добавление новой роли
  const addRole = () => {
    setFormData(prev => ({
      ...prev,
      roles: [...prev.roles, {
        name: '',
        description: '',
        media_presence: 'doesnt_matter',
        clothing_size: '',
        hairstyle: '',
        hair_color: '',
        eye_color: '',
        height: '',
        body_type: '',
        reference_text: '',
        special_conditions: '',
        audition_requirements: '',
        audition_text: '',
        rate_per_shift: '',
        rate_conditions: '',
        shooting_dates: '',
        shooting_location: '',
        notes: '',
        skills_required: [],
        suggested_artists: [],
      }]
    }));
    notifyChanges(true);
  };

  // Удаление роли
  const removeRole = (roleIndex: number) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter((_, index) => index !== roleIndex)
    }));
    notifyChanges(true);
  };

  // Проверка дубликатов проектов
  const checkForDuplicates = async (title: string) => {
    if (!title || title.length < 3) return;
    
    try {
      const duplicates = await projectsService.checkDuplicateProjects(title);
      setDuplicateProjects(duplicates);
      if (duplicates.length > 0) {
        setShowDuplicateWarning(true);
      }
    } catch (error) {
      ErrorHandler.logError(error, 'ProjectCreationForm.checkDuplicates');
    }
  };

  // Обработка игнорирования предупреждения о дубликатах
  const handleIgnoreDuplicateWarning = () => {
    setShowDuplicateWarning(false);
    setDuplicateProjects([]);
  };

  // Обработка выбора существующего проекта
  const handleSelectExistingProject = (projectId: number) => {
    setShowDuplicateWarning(false);
    setDuplicateProjects([]);
    // Здесь можно добавить логику для загрузки существующего проекта
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Название проекта обязательно';
    }

    if (!formData.project_type) {
      newErrors.project_type = 'Тип проекта обязателен';
    }

    if (!formData.genre) {
      newErrors.genre = 'Жанр обязателен';
    }

    // Валидация ролей
    formData.roles.forEach((role, index) => {
      if (!role.name?.trim()) {
        newErrors[`role_${index}_name`] = 'Название роли обязательно';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Проверка на дубликаты
    await checkForDuplicates(formData.title);

    if (duplicateProjects.length > 0 && !showDuplicateWarning) {
      return; // Ждем подтверждения пользователя
    }

    try {
      const projectData: ProjectForm = {
        ...formData,
        production_company: selectedProductionCompany || undefined,
      };
      onSubmit(projectData);
    } catch (error) {
      ErrorHandler.logError(error, 'ProjectCreationForm.handleSubmit');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Основная информация */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Основная информация</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название проекта *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Жанр *
            </label>
            <select
              value={formData.genre || ''}
              onChange={(e) => handleInputChange('genre', parseInt(e.target.value))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание проекта
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Описание проекта"
          />
        </div>
      </div>

              {/* Команда проекта */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Команда проекта</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Кастинг-директор */}
                  <TeamMemberSelector
                    label="Кастинг-директор"
                    llmSuggestion={analysisResult?.contacts?.casting_director?.name || 'Не определен'}
                    llmEmail={analysisResult?.contacts?.casting_director?.email}
                    llmPhone={analysisResult?.contacts?.casting_director?.phone}
                    llmTelegram={analysisResult?.contacts?.casting_director?.telegram}
                    type="person"
                    onSelectionChange={(id, name) => setSelectedCastingDirector({id, name})}
                    onCreateNew={() => console.log('Создать нового кастинг-директора')}
                  />

                  {/* Режиссер */}
                  <TeamMemberSelector
                    label="Режиссер"
                    llmSuggestion={analysisResult?.contacts?.director?.name || 'Не определен'}
                    llmEmail={analysisResult?.contacts?.director?.email}
                    llmPhone={analysisResult?.contacts?.director?.phone}
                    llmTelegram={analysisResult?.contacts?.director?.telegram}
                    type="person"
                    onSelectionChange={(id, name) => setSelectedDirector({id, name})}
                    onCreateNew={() => console.log('Создать нового режиссера')}
                  />

                  {/* Продюсер */}
                  <TeamMemberSelector
                    label="Продюсер"
                    llmSuggestion={analysisResult?.contacts?.producers?.[0]?.name || 'Не определен'}
                    llmEmail={analysisResult?.contacts?.producers?.[0]?.email}
                    llmPhone={analysisResult?.contacts?.producers?.[0]?.phone}
                    llmTelegram={analysisResult?.contacts?.producers?.[0]?.telegram}
                    type="person"
                    onSelectionChange={(id, name) => setSelectedProducer({id, name})}
                    onCreateNew={() => console.log('Создать нового продюсера')}
                  />

                  {/* Продакшн-компания */}
                  <TeamMemberSelector
                    label="Продакшн-компания"
                    llmSuggestion={analysisResult?.contacts?.production_company?.name || 'Не определен'}
                    llmEmail={analysisResult?.contacts?.production_company?.email}
                    llmPhone={analysisResult?.contacts?.production_company?.phone}
                    llmWebsite={analysisResult?.contacts?.production_company?.website}
                    type="company"
                    onSelectionChange={(id, name) => setSelectedProductionCompany(id)}
                    onCreateNew={() => console.log('Создать новую компанию')}
                  />
                </div>
              </div>

      {/* Предупреждение о дубликатах проектов */}
      {showDuplicateWarning && duplicateProjects.length > 0 && (
        <DuplicateProjectWarning
          duplicates={duplicateProjects}
          onIgnore={handleIgnoreDuplicateWarning}
          onSelectExisting={handleSelectExistingProject}
        />
      )}

      {/* Роли */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Роли в проекте</h2>
          <button
            type="button"
            onClick={addRole}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Добавить роль
          </button>
        </div>

        <div className="space-y-4">
          {formData.roles.map((role, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-gray-900">Роль {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeRole(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
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
                    value={role.name}
                    onChange={(e) => handleRoleChange(index, 'name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`role_${index}_name`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Название роли"
                  />
                  {errors[`role_${index}_name`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`role_${index}_name`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Медийность
                  </label>
                  <select
                    value={role.media_presence || 'doesnt_matter'}
                    onChange={(e) => handleRoleChange(index, 'media_presence', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="doesnt_matter">Неважно</option>
                    <option value="yes">Да</option>
                    <option value="no">Нет</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Описание роли"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Требуемые навыки
                </label>
                <input
                  type="text"
                  value={Array.isArray(role.skills_required) ? role.skills_required.join(', ') : ''}
                  onChange={(e) => handleRoleChange(index, 'skills_required', e.target.value.split(', ').filter(s => s.trim()))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Навыки через запятую"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Предложенные артисты
                </label>
                <ArtistSelectionComponent
                  roleIndex={index}
                  selectedArtists={role.suggested_artists || []}
                  onArtistsChange={(artists) => handleRoleChange(index, 'suggested_artists', artists)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Создать проект
        </button>
      </div>
    </form>
  );
};