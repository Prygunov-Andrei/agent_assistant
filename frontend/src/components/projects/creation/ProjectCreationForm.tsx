// Форма создания проекта

import React, { useState, useEffect } from 'react';
import type { ProjectCreationForm as ProjectForm, ProjectType, Genre } from '../../../types/projects';
import type { LLMAnalysisResult } from '../../../types/llm';
import { projectsService } from '../../../services/projects';
import { ErrorHandler } from '../../../utils/errorHandler';
import ArtistSelectionComponent from '../roles/ArtistSelectionComponent';
import { DuplicateProjectWarning } from '../../matching';
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
  const [selectedProductionCompany, setSelectedProductionCompany] = useState<number | null>(null);
  const [duplicateProjects, setDuplicateProjects] = useState<any[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

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

  const notifyChanges = (hasFormChanges: boolean) => {
    if (hasFormChanges !== hasChanges) {
      setHasChanges(hasFormChanges);
      onChange?.(hasFormChanges);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    notifyChanges(true);
  };

  const handleRoleChange = (roleIndex: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.map((role, index) => 
        index === roleIndex ? { ...role, [field]: value } : role
      )
    }));
    notifyChanges(true);
  };

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

  const removeRole = (roleIndex: number) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.filter((_, index) => index !== roleIndex)
    }));
    notifyChanges(true);
  };

  const checkForDuplicates = async (title: string) => {
    if (!title || title.length < 3) return;
    try {
      const response = await projectsService.searchProjects(title);
      const duplicates = response.results || [];
      setDuplicateProjects(duplicates);
      if (duplicates.length > 0) {
        setShowDuplicateWarning(true);
      }
    } catch (error) {
      ErrorHandler.logError(error, 'ProjectCreationForm.checkDuplicates');
    }
  };

  const handleIgnoreDuplicateWarning = () => {
    setShowDuplicateWarning(false);
    setDuplicateProjects([]);
  };

  const handleSelectExistingProject = (_projectId: number) => {
    setShowDuplicateWarning(false);
    setDuplicateProjects([]);
  };

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
    formData.roles.forEach((role, index) => {
      if (!role.name?.trim()) {
        newErrors[`role_${index}_name`] = 'Название роли обязательно';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    await checkForDuplicates(formData.title);
    if (duplicateProjects.length > 0 && !showDuplicateWarning) {
      return;
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
      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Команда проекта</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TeamMemberSelector
            label="Кастинг-директор"
            llmSuggestion={analysisResult?.contacts?.casting_director?.name || 'Не определен'}
            llmEmail={analysisResult?.contacts?.casting_director?.email}
            llmPhone={analysisResult?.contacts?.casting_director?.phone}
            llmTelegram={analysisResult?.contacts?.casting_director?.telegram}
            type="person"
            onSelectionChange={(id, name) => console.log('select casting director', id, name)}
            onCreateNew={() => console.log('Создать нового кастинг-директора')}
          />
          <TeamMemberSelector
            label="Режиссер"
            llmSuggestion={analysisResult?.contacts?.director?.name || 'Не определен'}
            llmEmail={analysisResult?.contacts?.director?.email}
            llmPhone={analysisResult?.contacts?.director?.phone}
            llmTelegram={analysisResult?.contacts?.director?.telegram}
            type="person"
            onSelectionChange={(id, name) => console.log('select director', id, name)}
            onCreateNew={() => console.log('Создать нового режиссера')}
          />
          <TeamMemberSelector
            label="Продюсер"
            llmSuggestion={analysisResult?.contacts?.producers?.[0]?.name || 'Не определен'}
            llmEmail={analysisResult?.contacts?.producers?.[0]?.email}
            llmPhone={analysisResult?.contacts?.producers?.[0]?.phone}
            llmTelegram={analysisResult?.contacts?.producers?.[0]?.telegram}
            type="person"
            onSelectionChange={(id, name) => console.log('select producer', id, name)}
            onCreateNew={() => console.log('Создать нового продюсера')}
          />
          <TeamMemberSelector
            label="Продакшн-компания"
            llmSuggestion={analysisResult?.contacts?.production_company?.name || 'Не определен'}
            llmEmail={analysisResult?.contacts?.production_company?.email}
            llmPhone={analysisResult?.contacts?.production_company?.phone}
            llmWebsite={analysisResult?.contacts?.production_company?.website}
            type="company"
            onSelectionChange={(id, _name) => setSelectedProductionCompany(id)}
            onCreateNew={() => console.log('Создать новую компанию')}
          />
        </div>
      </div>
      {showDuplicateWarning && duplicateProjects.length > 0 && (
        <DuplicateProjectWarning
          duplicates={duplicateProjects}
          onIgnore={handleIgnoreDuplicateWarning}
          onSelectExisting={handleSelectExistingProject}
        />
      )}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите название роли"
                  />
                  {errors[`role_${index}_name`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`role_${index}_name`]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание роли
                  </label>
                  <textarea
                    value={role.description}
                    onChange={(e) => handleRoleChange(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Описание роли"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Требования к участию
                  </label>
                  <textarea
                    value={role.audition_requirements}
                    onChange={(e) => handleRoleChange(index, 'audition_requirements', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Требования к участию"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Навыки
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(role.skills_required) ? role.skills_required.join(', ') : ''}
                    onChange={(e) => handleRoleChange(index, 'skills_required', e.target.value.split(',').map((skill) => skill.trim()))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите навыки через запятую"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Предложенные артисты
                </label>
                <ArtistSelectionComponent
                  selectedArtists={role.suggested_artists || []}
                  onSelectionChange={(artists: number[]) => handleRoleChange(index, 'suggested_artists', artists)}
                  placeholder="Выберите артистов для этой роли..."
                  maxSelections={10}
                  className="border border-gray-300 rounded-md p-3"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Создать проект
        </button>
      </div>
    </form>
  );
};