import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { requestsService } from '../../services/requests';
import { peopleService } from '../../services/people';
import { companiesService } from '../../services/companies';
import { projectsService } from '../../services/projects';
import { artistsService } from '../../services/artists';
import { LLMService } from '../../services/llm';
import { ErrorHandler } from '../../utils/errorHandler';
import { useAuth } from '../../contexts/AuthContext';

interface ProjectFormModalProps {
  mode: 'create' | 'edit' | 'view';
  isOpen: boolean;
  onClose: () => void;
  onSave?: (projectData: any) => Promise<void>;
  requestData?: {
    id: number;
    text: string;
    images?: Array<{ image: string }>;
    files?: Array<{ file: string; original_filename: string }>;
    author_username?: string;
  };
  projectData?: any; // Для режима edit/view
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  mode,
  isOpen,
  onClose,
  onSave,
  requestData,
  projectData
}) => {
  // Основные данные формы
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 1,
    genre: undefined as number | undefined,
    premiere_date: '',
    status: 'draft',
    project_type_raw: ''
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showDeleteRoleWarning, setShowDeleteRoleWarning] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  
  // Внутреннее управление режимом (для переключения view <-> edit)
  const [currentMode, setCurrentMode] = useState<'create' | 'edit' | 'view'>(mode);
  
  // Получаем текущего пользователя
  const { user } = useAuth();
  
  // isReadOnly зависит от текущего режима
  const isReadOnly = currentMode === 'view';
  
  // Команда проекта
  const [castingDirector, setCastingDirector] = useState<any>(null);
  const [director, setDirector] = useState<any>(null);
  const [producer, setProducer] = useState<any>(null);
  const [productionCompany, setProductionCompany] = useState<any>(null);
  
  // Поиск персон
  const [castingDirectorSearch, setCastingDirectorSearch] = useState<any[]>([]);
  const [directorSearch, setDirectorSearch] = useState<any[]>([]);
  const [producerSearch, setProducerSearch] = useState<any[]>([]);
  const [companySearch, setCompanySearch] = useState<any[]>([]);
  
  // Выпадающие списки
  const [showCastingDirectorDropdown, setShowCastingDirectorDropdown] = useState(false);
  const [showDirectorDropdown, setShowDirectorDropdown] = useState(false);
  const [showProducerDropdown, setShowProducerDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showProjectTypeDropdown, setShowProjectTypeDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  
  // Справочники
  const [projectType, setProjectType] = useState<any>(null);
  const [genre, setGenre] = useState<any>(null);
  const [projectTypesList, setProjectTypesList] = useState<any[]>([]);
  const [genresList, setGenresList] = useState<any[]>([]);
  const [roleTypesList, setRoleTypesList] = useState<any[]>([]);
  const [shoeSizesList, setShoeSizesList] = useState<any[]>([]);
  const [nationalitiesList, setNationalitiesList] = useState<any[]>([]);
  const [skillsList, setSkillsList] = useState<any[]>([]);
  
  // Состояния для свернутых ролей
  const [collapsedRoles, setCollapsedRoles] = useState<Set<number>>(new Set());
  
  // Показать все варианты
  const [showAllProjectTypes, setShowAllProjectTypes] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [usageRightsParsed, setUsageRightsParsed] = useState<any>(null);

  // Ref для отслеживания кликов вне dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Функция очистки формы
  const clearForm = () => {
    setFormData({
      title: '',
      description: '',
      project_type: 1,
      genre: undefined,
      premiere_date: '',
      status: 'draft',
      project_type_raw: ''
    });
    setRoles([]);
    setCastingDirector(null);
    setDirector(null);
    setProducer(null);
    setProductionCompany(null);
    setProjectType(null);
    setGenre(null);
    setHasUnsavedChanges(false);
  };

  // Инициализация при открытии
  useEffect(() => {
    if (isOpen) {
      // Сначала загружаем справочники, ПОТОМ предзаполняем данные
      const initializeModal = async () => {
        try {
          const [types, genres, roleTypes, shoeSizes, nationalities, skills] = await Promise.all([
            projectsService.getProjectTypes(),
            projectsService.getGenres(),
            projectsService.getRoleTypes(),
            projectsService.getShoeSizes(),
            projectsService.getNationalities(),
            artistsService.getSkills()
          ]);
          
          // Устанавливаем в стейт
          setProjectTypesList(types);
          setGenresList(genres);
          setRoleTypesList(roleTypes);
          setShoeSizesList(shoeSizes);
          setNationalitiesList(nationalities);
          setSkillsList(skills);
          
          if (mode === 'create' && requestData) {
            // ОЧИЩАЕМ форму перед анализом нового запроса
            clearForm();
            // Автоматический LLM анализ для создания из запроса
            handleAutoAnalysis();
          } else if ((mode === 'edit' || mode === 'view') && projectData) {
            // Предзаполнение данных для редактирования/просмотра
            // Передаем загруженные списки напрямую
            prefillProjectData(roleTypes, shoeSizes, nationalities);
          } else if (mode === 'create' && !requestData) {
            // Создание проекта без запроса - очищаем форму
            clearForm();
          }
        } catch (err) {
          ErrorHandler.logError(err, 'ProjectFormModal.initializeModal');
        }
      };
      
      initializeModal();
    }
  }, [isOpen, mode, requestData, projectData]);

  // Автоматический LLM анализ
  const handleAutoAnalysis = async () => {
    if (!requestData) return;
    
    setIsAnalyzing(true);
    try {
      const analysisResult = await LLMService.analyzeRequest(requestData.id, true);
      
      const { project_analysis, contacts } = analysisResult;
      
      // Предзаполнение формы
      setFormData({
        title: project_analysis.title || '',
        description: project_analysis.description || '',
        project_type: 1,
        genre: undefined,
        premiere_date: project_analysis.premiere_date || '',
        status: 'draft',
        project_type_raw: project_analysis.project_type || ''
      });
      
      // Поиск типа проекта и жанра
      if (project_analysis.project_type) {
        const foundType = projectTypesList.find((t: any) => 
          t.name.toLowerCase().includes(project_analysis.project_type.toLowerCase()) ||
          project_analysis.project_type.toLowerCase().includes(t.name.toLowerCase())
        );
        if (foundType) {
          setProjectType(foundType);
        } else {
          setProjectType({ id: null, name: project_analysis.project_type });
        }
      }
      
      if (project_analysis.genre) {
        const foundGenre = genresList.find((g: any) => 
          g.name.toLowerCase().includes(project_analysis.genre.toLowerCase()) ||
          project_analysis.genre.toLowerCase().includes(g.name.toLowerCase())
        );
        if (foundGenre) {
          setGenre(foundGenre);
        } else {
          setGenre({ id: null, name: project_analysis.genre });
        }
      }
      
      // Предзаполнение команды
      if (contacts?.casting_director) {
        await searchCastingDirector(contacts.casting_director.name);
      }
      if (contacts?.director) {
        await searchDirector(contacts.director.name);
      }
      if (contacts?.producers && contacts.producers.length > 0) {
        await searchProducer(contacts.producers[0].name);
      }
      if (contacts?.production_company) {
        await searchCompany(contacts.production_company.name);
      }
      
      // Предзаполнение ролей
      if (project_analysis.roles && Array.isArray(project_analysis.roles)) {
        const mappedRoles = project_analysis.roles.map((role: any) => {
          // Найти тип роли
          let roleType = null;
          if (role.role_type) {
            roleType = roleTypesList.find((rt: any) => 
              rt.name.toLowerCase() === role.role_type.toLowerCase()
            ) || { id: null, name: role.role_type };
          }
          
          // Найти размер обуви
          let shoeSize = null;
          if (role.shoe_size) {
            shoeSize = shoeSizesList.find((s: any) => s.name === role.shoe_size) || null;
          }
          
          // Найти национальность
          let nationality = null;
          if (role.nationality) {
            nationality = nationalitiesList.find((n: any) => 
              n.name.toLowerCase() === role.nationality.toLowerCase()
            ) || null;
          }
          
          // Обработать навыки
          let skills_required = [];
          if (role.skills_required && Array.isArray(role.skills_required)) {
            skills_required = role.skills_required.map((skillName: string) => {
              const found = skillsList.find((s: any) => 
                s.name.toLowerCase() === skillName.toLowerCase()
              );
              return found || { id: null, name: skillName };
            });
          }
          
          return {
            ...role,
            role_type: roleType,
            shoe_size: shoeSize,
            nationality: nationality,
            skills_required: skills_required
          };
        });
        
        setRoles(mappedRoles);
      }
      
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectFormModal.handleAutoAnalysis');
      // alert('Ошибка при анализе запроса'); // Убрано
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Предзаполнение данных проекта для редактирования/просмотра
  const prefillProjectData = (loadedRoleTypes?: any[], loadedShoeSizes?: any[], loadedNationalities?: any[]) => {
    if (!projectData) return;
    
    // Используем переданные списки или списки из стейта
    const roleTypesToUse = loadedRoleTypes || roleTypesList;
    const shoeSizesToUse = loadedShoeSizes || shoeSizesList;
    const nationalitiesToUse = loadedNationalities || nationalitiesList;
    
    console.log('prefillProjectData - Входные данные:', projectData);
    console.log('projectData.project_type:', projectData.project_type);
    console.log('projectData.project_type_name:', projectData.project_type_name);
    console.log('projectData.genre:', projectData.genre);
    console.log('projectData.roles:', projectData.roles);
    console.log('Все поля projectData:', Object.keys(projectData));
    console.log('Справочники для маппинга:', {
      roleTypes: roleTypesToUse.length,
      shoeSizes: shoeSizesToUse.length,
      nationalities: nationalitiesToUse.length
    });
    
    setFormData({
      title: projectData.title || '',
      description: projectData.description || '',
      project_type: projectData.project_type?.id || projectData.project_type || 1,
      genre: projectData.genre?.id || projectData.genre,
      premiere_date: projectData.premiere_date || '',
      status: projectData.status || 'draft',
      project_type_raw: projectData.project_type_raw || ''
    });
    
    // Мапим тип проекта и жанр в формат {id, name}
    // Если null - это "Не определено" (id: -1)
    const mappedProjectType = projectData.project_type 
      ? (typeof projectData.project_type === 'object' ? projectData.project_type : {
          id: projectData.project_type,
          name: projectData.project_type_name || 'Загрузка...'
        })
      : { id: -1, name: 'Не определено' };
    
    const mappedGenre = projectData.genre 
      ? (typeof projectData.genre === 'object' ? projectData.genre : {
          id: projectData.genre,
          name: projectData.genre_name || 'Загрузка...'
        })
      : { id: -1, name: 'Не определено' };
    
    // Мапим данные команды с бэкенда на формат фронтенда
    // Если null - это "Не определено" (id: -1)
    const mappedCastingDirector = projectData.casting_director ? {
      id: projectData.casting_director,
      name: projectData.casting_director_name || 'Загрузка...',
      match: 1
    } : { id: -1, name: 'Не определено', match: 1 };
    
    const mappedDirector = projectData.director ? {
      id: projectData.director,
      name: projectData.director_name || 'Загрузка...',
      match: 1
    } : { id: -1, name: 'Не определено', match: 1 };
    
    const mappedProducer = projectData.producers && projectData.producers.length > 0 ? {
      id: projectData.producers[0],
      name: projectData.producers_names?.[0] || 'Загрузка...',
      match: 1
    } : { id: -1, name: 'Не определено', match: 1 };
    
    const mappedCompany = projectData.production_company ? {
      id: projectData.production_company,
      name: projectData.production_company_name || 'Загрузка...',
      match: 1
    } : { id: -1, name: 'Не определено', match: 1 };
    
    console.log('Маппинг:', { 
      mappedProjectType, 
      mappedGenre, 
      mappedCastingDirector, 
      mappedDirector, 
      mappedProducer, 
      mappedCompany 
    });
    
    console.log('DEBUG mappedProjectType:', mappedProjectType);
    console.log('DEBUG projectData.project_type_name:', projectData.project_type_name);
    
    setProjectType(mappedProjectType);
    setGenre(mappedGenre);
    setCastingDirector(mappedCastingDirector);
    setDirector(mappedDirector);
    setProducer(mappedProducer);
    setProductionCompany(mappedCompany);
    
    // Мапим роли - преобразуем role_type из ID в объект
    const mappedRoles = (projectData.roles || []).map((role: any) => {
      console.log('Маппинг роли:', role);
      
      // Преобразуем role_type если это ID
      const mappedRoleType = typeof role.role_type === 'object' ? role.role_type : 
        roleTypesToUse.find((rt: any) => rt.id === role.role_type) || { id: role.role_type, name: role.role_type_name || 'Загрузка...' };
      
      // Преобразуем shoe_size если это ID
      const mappedShoeSize = typeof role.shoe_size === 'object' ? role.shoe_size :
        shoeSizesToUse.find((s: any) => s.id === role.shoe_size) || null;
      
      // Преобразуем nationality если это ID
      const mappedNationality = typeof role.nationality === 'object' ? role.nationality :
        nationalitiesToUse.find((n: any) => n.id === role.nationality) || null;
      
      return {
        ...role,
        role_type: mappedRoleType,
        shoe_size: mappedShoeSize,
        nationality: mappedNationality
      };
    });
    
    setRoles(mappedRoles);
    
    // Инициализируем права использования
    setUsageRightsParsed(projectData.usage_rights_parsed || null);
    
    console.log('Роли после маппинга:', mappedRoles);
  };

  // Сворачиваем все роли при загрузке проекта для просмотра/редактирования
  useEffect(() => {
    if ((mode === 'view' || mode === 'edit') && roles.length > 0) {
      // Создаем Set со всеми индексами ролей (все свернуты)
      const allRolesCollapsed = new Set(roles.map((_, index) => index));
      setCollapsedRoles(allRolesCollapsed);
    }
  }, [roles.length, mode]); // Срабатывает когда изменяется количество ролей или режим

  // Поиск персон с отображением dropdown
  const searchPerson = async (name: string, type: 'casting_director' | 'director' | 'producer') => {
    try {
      const results = await peopleService.searchPersonsByName({ name, person_type: type });
      
      if (type === 'casting_director') {
        setCastingDirectorSearch(results || []);
        setShowCastingDirectorDropdown(true);
      } else if (type === 'director') {
        setDirectorSearch(results || []);
        setShowDirectorDropdown(true);
      } else if (type === 'producer') {
        setProducerSearch(results || []);
        setShowProducerDropdown(true);
      }
    } catch (err) {
      ErrorHandler.logError(err, `ProjectFormModal.searchPerson.${type}`);
    }
  };

  const selectPerson = (person: any, type: 'casting_director' | 'director' | 'producer') => {
    if (type === 'casting_director') {
      setCastingDirector(person);
      setShowCastingDirectorDropdown(false);
    } else if (type === 'director') {
      setDirector(person);
      setShowDirectorDropdown(false);
    } else if (type === 'producer') {
      setProducer(person);
      setShowProducerDropdown(false);
    }
    setHasUnsavedChanges(true);
  };

  const searchCastingDirector = async (name: string) => {
    try {
      const results = await peopleService.searchPersonsByName({ name, person_type: 'casting_director' });
      setCastingDirectorSearch(results || []);
      if (results && results.length > 0) {
        setCastingDirector(results[0]);
      } else {
        setCastingDirector({ id: null, name });
      }
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectFormModal.searchCastingDirector');
    }
  };

  const searchDirector = async (name: string) => {
    try {
      const results = await peopleService.searchPersonsByName({ name, person_type: 'director' });
      setDirectorSearch(results || []);
      if (results && results.length > 0) {
        setDirector(results[0]);
      } else {
        setDirector({ id: null, name });
      }
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectFormModal.searchDirector');
    }
  };

  const searchProducer = async (name: string) => {
    try {
      const results = await peopleService.searchPersonsByName({ name, person_type: 'producer' });
      setProducerSearch(results || []);
      if (results && results.length > 0) {
        setProducer(results[0]);
      } else {
        setProducer({ id: null, name });
      }
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectFormModal.searchProducer');
    }
  };

  const searchCompany = async (name: string) => {
    try {
      const results = await companiesService.searchCompanies({ name, limit: 5 });
      setCompanySearch(results || []);
      if (results && results.length > 0) {
        setProductionCompany(results[0]);
      } else {
        setProductionCompany({ id: null, name });
      }
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectFormModal.searchCompany');
    }
  };

  const selectCompany = (company: any) => {
    setProductionCompany(company);
    setShowCompanyDropdown(false);
    setHasUnsavedChanges(true);
  };

  const createNewPerson = (type: string) => {
    // alert(`Создание нового ${type === 'casting_director' ? 'кастинг-директора' : type === 'director' ? 'режиссера' : 'продюсера'} в справочнике`); // Убрано
  };

  const createNewCompany = () => {
    // alert('Создание новой кинокомпании в справочнике'); // Убрано
  };

  // Обработчики изменений
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleRoleChange = (index: number, field: string, value: any) => {
    setRoles(prev => prev.map((role, i) => i === index ? { ...role, [field]: value } : role));
    setHasUnsavedChanges(true);
  };

  const addRole = () => {
    setRoles(prev => [...prev, {
      name: '',
      description: '',
      role_type: null,
      gender: 'doesnt_matter',
      age_min: '',
      age_max: '',
      media_presence: 'doesnt_matter',
      height: '',
      body_type: '',
      hair_color: '',
      eye_color: '',
      hairstyle: '',
      clothing_size: '',
      shoe_size: null,
      nationality: null,
      rate_per_shift: '',
      shooting_dates: '',
      shooting_location: '',
      rate_conditions: '',
      skills_required: []
    }]);
    setHasUnsavedChanges(true);
  };

  const removeRole = (index: number) => {
    setRoles(prev => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const toggleRoleCollapse = (index: number) => {
    setCollapsedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Управление навыками роли
  const addSkillToRole = (roleIndex: number) => {
    setRoles(prev => prev.map((role, i) => {
      if (i === roleIndex) {
        return {
          ...role,
          skills_required: [...(role.skills_required || []), { id: null, name: '' }]
        };
      }
      return role;
    }));
    setHasUnsavedChanges(true);
  };

  const removeSkillFromRole = (roleIndex: number, skillIndex: number) => {
    setRoles(prev => prev.map((role, i) => {
      if (i === roleIndex) {
        return {
          ...role,
          skills_required: role.skills_required.filter((_: any, si: number) => si !== skillIndex)
        };
      }
      return role;
    }));
    setHasUnsavedChanges(true);
  };

  const updateRoleSkill = (roleIndex: number, skillIndex: number, skill: any) => {
    setRoles(prev => prev.map((role, i) => {
      if (i === roleIndex) {
        return {
          ...role,
          skills_required: role.skills_required.map((s: any, si: number) => si === skillIndex ? skill : s)
        };
      }
      return role;
    }));
    setHasUnsavedChanges(true);
  };

  // Поиск типа проекта
  const searchProjectType = (value: string) => {
    setProjectType({ id: null, name: value });
    setShowProjectTypeDropdown(true);
    setShowAllProjectTypes(false);
  };

  const selectProjectType = (type: any) => {
    setProjectType(type);
    setShowProjectTypeDropdown(false);
    setHasUnsavedChanges(true);
  };

  // Поиск жанра
  const searchGenre = (value: string) => {
    setGenre({ id: null, name: value });
    setShowGenreDropdown(true);
    setShowAllGenres(false);
  };

  const selectGenre = (g: any) => {
    setGenre(g);
    setShowGenreDropdown(false);
    setHasUnsavedChanges(true);
  };

  // Сохранение/отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Если режим редактирования - вызываем отдельный обработчик
    if (currentMode === 'edit') {
      await handleProjectUpdate();
      return;
    }
    
    // Валидация для создания (более строгая)
    if (!formData.title.trim()) { return; }
    
    // Для создания проекта остальные поля не обязательны
    
    try {
      const projectPayload = {
        ...formData,
        casting_director: castingDirector,
        director,
        producer,
        production_company: productionCompany,
        roles
      };
      
      if (onSave) {
        await onSave(projectPayload);
      }
      
      if (mode === 'create' && requestData) {
        // Обновляем статус запроса на 'completed'
        await requestsService.updateRequestStatus(requestData.id, 'completed');
      }
      
      setHasUnsavedChanges(false);
      onClose();
      // alert('Проект успешно создан!'); // Убрано - системные уведомления не нужны
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectFormModal.handleSubmit');
      // alert('Ошибка при сохранении проекта'); // Убрано - системные уведомления не нужны
    }
  };

  // Закрытие с предупреждением
  const handleModalClose = () => {
    if (hasUnsavedChanges && mode !== 'view') {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    setHasUnsavedChanges(false);
    
    // Если были в режиме редактирования - вернуться в просмотр
    if (currentMode === 'edit') {
      handleConfirmCancelEdit();
    } else {
      onClose();
    }
  };

  // Обработчик удаления проекта
  const handleDeleteClick = () => {
    setShowDeleteWarning(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectData?.id) return;
    
    try {
      await projectsService.deleteProject(projectData.id);
      setShowDeleteWarning(false);
      onClose();
      // Обновляем список проектов (если есть callback)
      window.location.reload(); // Временное решение
    } catch (err) {
      ErrorHandler.logError(err, 'ProjectFormModal.handleConfirmDelete');
      // alert('Ошибка при удалении проекта'); // Убрано
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteWarning(false);
  };

  // Обработчик переключения в режим редактирования
  const handleEditClick = () => {
    setCurrentMode('edit');
  };

  // Обработчик отмены редактирования
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      setCurrentMode('view');
    }
  };

  // Подтверждение отмены редактирования
  const handleConfirmCancelEdit = () => {
    setShowUnsavedWarning(false);
    setHasUnsavedChanges(false);
    setCurrentMode('view');
    // Перезагружаем данные проекта
    if (projectData) {
      prefillProjectData();
    }
  };

  // Обработчик удаления роли
  const handleDeleteRoleClick = (index: number) => {
    setRoleToDelete(index);
    setShowDeleteRoleWarning(true);
  };

  const handleConfirmDeleteRole = () => {
    if (roleToDelete !== null) {
      removeRole(roleToDelete);
      setRoleToDelete(null);
      setShowDeleteRoleWarning(false);
    }
  };

  const handleCancelDeleteRole = () => {
    setRoleToDelete(null);
    setShowDeleteRoleWarning(false);
  };

  // Обработчик сохранения при редактировании
  const handleProjectUpdate = async () => {
    if (!projectData?.id) return;
    
    try {
      // Обновляем основные данные проекта
      const projectUpdateData = {
        title: formData.title,
        description: formData.description,
        project_type: projectType?.id === -1 ? null : (projectType?.id || null),
        genre: genre?.id === -1 ? null : (genre?.id || null),
        premiere_date: formData.premiere_date || null,
        status: formData.status,
        casting_director: castingDirector?.id === -1 ? null : (castingDirector?.id || null),
        director: director?.id === -1 ? null : (director?.id || null),
        producers: producer?.id === -1 ? [] : (producer?.id ? [producer.id] : []),
        production_company: productionCompany?.id === -1 ? null : (productionCompany?.id || null),
        usage_rights_parsed: projectType?.name === 'Реклама' ? usageRightsParsed : null
      };
      
      await projectsService.updateProject(projectData.id, projectUpdateData);
      
      // Обновляем роли
      for (const role of roles) {
        const rolePayload = {
          project: projectData.id,
          name: role.name,
          description: role.description,
          role_type: role.role_type?.id || null,
          gender: role.gender || null,
          age_min: role.age_min !== '' && role.age_min !== null && role.age_min !== undefined ? role.age_min : null,
          age_max: role.age_max !== '' && role.age_max !== null && role.age_max !== undefined ? role.age_max : null,
          media_presence: role.media_presence && role.media_presence !== '' ? role.media_presence : null,
          height: role.height && role.height !== '' ? role.height : null,
          body_type: role.body_type && role.body_type !== '' ? role.body_type : null,
          hair_color: role.hair_color && role.hair_color !== '' ? role.hair_color : null,
          eye_color: role.eye_color && role.eye_color !== '' ? role.eye_color : null,
          hairstyle: role.hairstyle && role.hairstyle !== '' ? role.hairstyle : null,
          clothing_size: role.clothing_size && role.clothing_size !== '' ? role.clothing_size : null,
          shoe_size: role.shoe_size?.id || null,
          nationality: role.nationality?.id || null,
          rate_per_shift: role.rate_per_shift && role.rate_per_shift !== '' ? role.rate_per_shift : null,
          shooting_dates: role.shooting_dates && role.shooting_dates !== '' ? role.shooting_dates : null,
          shooting_location: role.shooting_location && role.shooting_location !== '' ? role.shooting_location : null,
          rate_conditions: role.rate_conditions && role.rate_conditions !== '' ? role.rate_conditions : null,
          reference_text: role.reference_text && role.reference_text !== '' ? role.reference_text : null,
          special_conditions: role.special_conditions && role.special_conditions !== '' ? role.special_conditions : null,
          audition_requirements: role.audition_requirements && role.audition_requirements !== '' ? role.audition_requirements : null,
          audition_text: role.audition_text && role.audition_text !== '' ? role.audition_text : null,
          notes: role.notes && role.notes !== '' ? role.notes : null,
          skills_required: role.skills_required || null
        };
        
        if (role.id) {
          // Обновляем существующую роль
          await projectsService.updateProjectRole(role.id, rolePayload);
        } else {
          // Создаем новую роль
          await projectsService.createProjectRole(rolePayload);
        }
      }
      
      setHasUnsavedChanges(false);
      setCurrentMode('view');
      window.location.reload(); // Временное решение - обновляем страницу
    } catch (err: any) {
      ErrorHandler.logError(err, 'ProjectFormModal.handleProjectUpdate');
      console.error('Ошибка при обновлении проекта:', err);
      
      const errorMessage = err.response?.data 
        ? Object.entries(err.response.data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\n')
        : err.message;
      
      // alert(`Ошибка при обновлении проекта:\n\n${errorMessage}`); // Убрано
    }
  };

  // Обработка кликов вне dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCastingDirectorDropdown(false);
        setShowDirectorDropdown(false);
        setShowProducerDropdown(false);
        setShowCompanyDropdown(false);
        setShowProjectTypeDropdown(false);
        setShowGenreDropdown(false);
        
        // Закрыть все skill dropdown
        setRoles(prev => prev.map(role => {
          const updatedRole = { ...role };
          Object.keys(updatedRole).forEach(key => {
            if (key.startsWith('showSkillDropdown_')) {
              delete updatedRole[key];
            }
          });
          return updatedRole;
        }));
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          zIndex: 999999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
        onClick={(e) => { if (e.target === e.currentTarget) handleModalClose(); }}
      >
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          maxWidth: '1200px', 
          width: '95%', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          {/* HEADER */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px', 
            borderBottom: '1px solid #e5e7eb', 
            backgroundColor: '#f9fafb' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', margin: 0 }}>
                {mode === 'create' && requestData && `Создание проекта из запроса #${requestData.id}`}
                {mode === 'create' && !requestData && 'Создание проекта'}
                {mode === 'edit' && `Редактирование проекта: ${projectData?.title || ''}`}
                {mode === 'view' && `Проект: ${projectData?.title || ''}`}
              </h2>
              {isAnalyzing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#dbeafe', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#1e40af' }}>
                  <div style={{ width: '12px', height: '12px', border: '2px solid #1e40af', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  Анализируем запрос...
                </div>
              )}
            </div>
            <button onClick={handleModalClose} style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b7280', cursor: 'pointer', border: 'none', background: 'none', padding: '5px' }}>
              &times;
            </button>
          </div>

          {/* BODY - MAIN CONTENT */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: '0' }}>
            {/* LEFT PANEL - Context (только для режима create из запроса) */}
            {mode === 'create' && requestData && (
              <div style={{ width: '35%', minWidth: '300px', borderRight: '1px solid #e5e7eb', backgroundColor: '#f9fafb', overflow: 'visible', padding: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Контекст запроса</h3>
                <div style={{ marginBottom: '12px' }}><strong>Автор:</strong> {requestData.author_username || 'Не указан'}</div>
                {requestData.author_username && (
                  <div style={{ marginBottom: '12px' }}><strong>Telegram:</strong> {requestData.author_username}</div>
                )}
                <div style={{ marginBottom: '12px' }}><strong>Текст:</strong></div>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px', lineHeight: '1.4' }}>{requestData.text}</div>
                
                {/* Media Section */}
                {((requestData.images && requestData.images.length > 0) || (requestData.files && requestData.files.length > 0)) && (
                  <div style={{ marginTop: '16px' }}>
                    <strong>Медиа:</strong>
                    <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #d1d5db', marginTop: '8px' }}>
                      {requestData.images && requestData.images.length > 0 && (
                        <div style={{ marginBottom: requestData.files && requestData.files.length > 0 ? '12px' : '0' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Изображения ({requestData.images.length})</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px' }}>
                            {requestData.images.map((image: any, index: number) => (
                              <img key={index} src={image.image} alt={`Изображение ${index + 1}`} 
                                style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
                                onClick={(e) => { e.stopPropagation(); window.open(image.image, '_blank'); }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ))}
                          </div>
                        </div>
                      )}
                      {requestData.files && requestData.files.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Файлы ({requestData.files.length})</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {requestData.files.map((file: any, index: number) => (
                              <a key={index} href={file.file} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', backgroundColor: '#f9fafb', borderRadius: '4px', textDecoration: 'none', color: '#1f2937', fontSize: '12px', border: '1px solid #e5e7eb' }}
                                onClick={(e) => e.stopPropagation()}>
                                <span style={{ fontSize: '14px' }}>📄</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{file.original_filename || `Файл ${index + 1}`}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* LEFT PANEL - Project context (для режима edit/view из проекта) */}
            {(currentMode === 'edit' || currentMode === 'view') && projectData?.request && (
              <div style={{ width: '35%', minWidth: '300px', borderRight: '1px solid #e5e7eb', backgroundColor: '#f9fafb', overflow: 'visible', padding: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Контекст запроса</h3>
                {projectData.request_author && (
                  <div style={{ marginBottom: '12px' }}><strong>Автор:</strong> {projectData.request_author}</div>
                )}
                {projectData.request_created_at && (
                  <div style={{ marginBottom: '12px' }}><strong>Дата:</strong> {new Date(projectData.request_created_at).toLocaleString('ru-RU')}</div>
                )}
                <div style={{ marginBottom: '12px' }}><strong>Текст:</strong></div>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px', lineHeight: '1.4' }}>
                  {projectData.request_text || `Запрос #${projectData.request} (текст не загружен)`}
                </div>
                
                {/* Media Section */}
                {((projectData.request_images && projectData.request_images.length > 0) || (projectData.request_files && projectData.request_files.length > 0)) && (
                  <div style={{ marginTop: '16px' }}>
                    <strong>Медиа:</strong>
                    <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #d1d5db', marginTop: '8px' }}>
                      {projectData.request_images && projectData.request_images.length > 0 && (
                        <div style={{ marginBottom: projectData.request_files && projectData.request_files.length > 0 ? '12px' : '0' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Изображения ({projectData.request_images.length})</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px' }}>
                            {projectData.request_images.map((image: any, index: number) => {
                              const imageUrl = image.image.startsWith('http') ? image.image : `http://localhost:8000${image.image}`;
                              return (
                                <img key={index} src={imageUrl} alt={`Изображение ${index + 1}`} 
                                  style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
                                  onClick={(e) => { e.stopPropagation(); window.open(imageUrl, '_blank'); }}
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {projectData.request_files && projectData.request_files.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Файлы ({projectData.request_files.length})</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {projectData.request_files.map((file: any, index: number) => {
                              const fileUrl = file.file.startsWith('http') ? file.file : `http://localhost:8000${file.file}`;
                              return (
                                <a key={index} href={fileUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', padding: '6px 8px', backgroundColor: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe', display: 'block' }}
                                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open(fileUrl, '_blank'); }}>
                                  📎 {file.original_filename || `Файл ${index + 1}`}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RIGHT PANEL - Form */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }} ref={dropdownRef}>
              {/* Команда проекта */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>Команда проекта</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Кастинг-директор */}
                  <div style={{ position: 'relative' }} className="dropdown-container">
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Кастинг-директор *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={castingDirector?.name || ''} 
                        onChange={(e) => { 
                          searchPerson(e.target.value, 'casting_director'); 
                          setCastingDirector({ id: null, name: e.target.value, match: 0 }); 
                          setHasUnsavedChanges(true); 
                        }}
                        onFocus={() => { if (castingDirector?.name) searchPerson(castingDirector.name, 'casting_director'); }}
                        disabled={isReadOnly}
                        style={{ flex: 1, padding: '8px 12px', border: castingDirector?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                        placeholder="Введите имя кастинг-директора" 
                      />
                      {castingDirector?.match > 0 && (
                        <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: castingDirector.match > 0.8 ? '#dcfce7' : '#fef3c7', color: castingDirector.match > 0.8 ? '#166534' : '#92400e' }}>
                          {Math.round(castingDirector.match * 100)}%
                        </span>
                      )}
                    </div>
                    {!isReadOnly && showCastingDirectorDropdown && castingDirectorSearch.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                        {castingDirectorSearch.map((person, index) => (
                          <div key={index} onClick={() => selectPerson(person, 'casting_director')} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: index < castingDirectorSearch.length - 1 ? '1px solid #f3f4f6' : 'none', backgroundColor: '#f9fafb' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{person.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{person.phone} • {person.email}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{person.telegram}</div>
                          </div>
                        ))}
                        <div onClick={() => createNewPerson('casting_director')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>
                          + Добавить нового кастинг-директора
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Режиссер */}
                  <div style={{ position: 'relative' }} className="dropdown-container">
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Режиссер *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={director?.name || ''} 
                        onChange={(e) => { 
                          searchPerson(e.target.value, 'director'); 
                          setDirector({ id: null, name: e.target.value, match: 0 }); 
                          setHasUnsavedChanges(true); 
                        }}
                        onFocus={() => { if (director?.name) searchPerson(director.name, 'director'); }}
                        disabled={isReadOnly}
                        style={{ flex: 1, padding: '8px 12px', border: director?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                        placeholder="Введите имя режиссера" 
                      />
                      {director?.match > 0 && (
                        <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: director.match > 0.8 ? '#dcfce7' : '#fef3c7', color: director.match > 0.8 ? '#166534' : '#92400e' }}>
                          {Math.round(director.match * 100)}%
                        </span>
                      )}
                    </div>
                    {!isReadOnly && showDirectorDropdown && directorSearch.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                        {directorSearch.map((person, index) => (
                          <div key={index} onClick={() => selectPerson(person, 'director')} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: index < directorSearch.length - 1 ? '1px solid #f3f4f6' : 'none', backgroundColor: '#f9fafb' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{person.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{person.phone} • {person.email}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{person.telegram}</div>
                          </div>
                        ))}
                        <div onClick={() => createNewPerson('director')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>
                          + Добавить нового режиссера
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Продюсер */}
                  <div style={{ position: 'relative' }} className="dropdown-container">
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Продюсер *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={producer?.name || ''} 
                        onChange={(e) => { 
                          searchPerson(e.target.value, 'producer'); 
                          setProducer({ id: null, name: e.target.value, match: 0 }); 
                          setHasUnsavedChanges(true); 
                        }}
                        onFocus={() => { if (producer?.name) searchPerson(producer.name, 'producer'); }}
                        disabled={isReadOnly}
                        style={{ flex: 1, padding: '8px 12px', border: producer?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                        placeholder="Введите имя продюсера" 
                      />
                      {producer?.match > 0 && (
                        <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: producer.match > 0.8 ? '#dcfce7' : '#fef3c7', color: producer.match > 0.8 ? '#166534' : '#92400e' }}>
                          {Math.round(producer.match * 100)}%
                        </span>
                      )}
                    </div>
                    {!isReadOnly && showProducerDropdown && producerSearch.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                        {producerSearch.map((person, index) => (
                          <div key={index} onClick={() => selectPerson(person, 'producer')} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: index < producerSearch.length - 1 ? '1px solid #f3f4f6' : 'none', backgroundColor: '#f9fafb' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{person.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{person.phone} • {person.email}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{person.telegram}</div>
                          </div>
                        ))}
                        <div onClick={() => createNewPerson('producer')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>
                          + Добавить нового продюсера
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Кинокомпания */}
                  <div style={{ position: 'relative' }} className="dropdown-container">
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Кинокомпания *</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={productionCompany?.name || ''} 
                        onChange={(e) => { 
                          const value = e.target.value;
                          setProductionCompany({ id: null, name: value, match: 0 }); 
                          searchCompany(value);
                          setShowCompanyDropdown(true);
                          setHasUnsavedChanges(true); 
                        }}
                        onFocus={() => { if (productionCompany?.name) { searchCompany(productionCompany.name); setShowCompanyDropdown(true); } }}
                        disabled={isReadOnly}
                        style={{ flex: 1, padding: '8px 12px', border: productionCompany?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                        placeholder="Введите название кинокомпании" 
                      />
                      {productionCompany?.match > 0 && (
                        <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: productionCompany.match > 0.8 ? '#dcfce7' : '#fef3c7', color: productionCompany.match > 0.8 ? '#166534' : '#92400e' }}>
                          {Math.round(productionCompany.match * 100)}%
                        </span>
                      )}
                    </div>
                    {!isReadOnly && showCompanyDropdown && companySearch.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                        {companySearch.map((company, index) => (
                          <div key={index} onClick={() => selectCompany(company)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: index < companySearch.length - 1 ? '1px solid #f3f4f6' : 'none', backgroundColor: '#f9fafb' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{company.name}</div>
                            {company.phone && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{company.phone} • {company.email}</div>}
                            {company.website && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{company.website}</div>}
                          </div>
                        ))}
                        <div onClick={createNewCompany} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>
                          + Добавить новую кинокомпанию
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Форма проекта */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Название проекта *</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    disabled={isReadOnly}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                    placeholder="Введите название проекта" 
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Описание проекта</label>
                  <textarea 
                    rows={4} 
                    value={formData.description} 
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    disabled={isReadOnly}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                    placeholder="Описание проекта" 
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Тип проекта */}
                  <div style={{ position: 'relative' }} className="dropdown-container">
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Тип проекта *</label>
                    <input 
                      type="text" 
                      value={projectType?.name || ''} 
                      onChange={(e) => { setProjectType({ id: null, name: e.target.value }); searchProjectType(e.target.value); setHasUnsavedChanges(true); }}
                      onFocus={() => { if (projectType?.name) searchProjectType(projectType.name); }}
                      disabled={isReadOnly}
                      style={{ width: '100%', padding: '8px 12px', border: projectType?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                      placeholder="Введите тип проекта" 
                    />
                    {!isReadOnly && showProjectTypeDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                        {(showAllProjectTypes ? projectTypesList : projectTypesList.filter((type: any) => type.name.toLowerCase().includes((projectType?.name || '').toLowerCase()))).map((type) => (
                          <div key={type.id} onClick={() => selectProjectType(type)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{type.name}</div>
                            {type.description && <div style={{ fontSize: '12px', color: '#6b7280' }}>{type.description}</div>}
                          </div>
                        ))}
                        {!showAllProjectTypes && (
                          <div onClick={(e) => { e.stopPropagation(); setShowAllProjectTypes(true); }} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>
                            📋 Показать все варианты ({projectTypesList.length})
                          </div>
                        )}
                        <div onClick={(e) => { e.stopPropagation(); /* alert('Создание нового типа проекта'); */ setShowProjectTypeDropdown(false); }} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#f0fdf4', borderTop: '1px solid #bbf7d0', color: '#15803d', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}>
                          + Создать новый тип проекта
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Жанр */}
                  <div style={{ position: 'relative' }} className="dropdown-container">
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Жанр *</label>
                    <input 
                      type="text" 
                      value={genre?.name || ''} 
                      onChange={(e) => { setGenre({ id: null, name: e.target.value }); searchGenre(e.target.value); setHasUnsavedChanges(true); }}
                      onFocus={() => { if (genre?.name) searchGenre(genre.name); }}
                      disabled={isReadOnly}
                      style={{ width: '100%', padding: '8px 12px', border: genre?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                      placeholder="Введите жанр" 
                    />
                    {!isReadOnly && showGenreDropdown && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                        {(showAllGenres ? genresList : genresList.filter((g: any) => g.name.toLowerCase().includes((genre?.name || '').toLowerCase()))).map((g) => (
                          <div key={g.id} onClick={() => selectGenre(g)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{g.name}</div>
                            {g.description && <div style={{ fontSize: '12px', color: '#6b7280' }}>{g.description}</div>}
                          </div>
                        ))}
                        {!showAllGenres && (
                          <div onClick={(e) => { e.stopPropagation(); setShowAllGenres(true); }} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>
                            📋 Показать все варианты ({genresList.length})
                          </div>
                        )}
                        <div onClick={(e) => { e.stopPropagation(); /* alert('Создание нового жанра'); */ setShowGenreDropdown(false); }} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#f0fdf4', borderTop: '1px solid #bbf7d0', color: '#15803d', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}>
                          + Создать новый жанр
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Блок прав использования для рекламных проектов */}
                {projectType?.name === 'Реклама' && (
                  <div style={{ 
                    backgroundColor: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    borderRadius: '8px', 
                    padding: '16px', 
                    marginBottom: '16px' 
                  }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: '#92400e', 
                      margin: '0 0 12px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📜 Права использования
                    </h3>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        marginBottom: '4px', 
                        color: '#92400e' 
                      }}>
                        Текст прав
                      </label>
                      <textarea
                        value={usageRightsParsed?.raw_text || ''}
                        onChange={(e) => {
                          setUsageRightsParsed({ 
                            ...usageRightsParsed, 
                            raw_text: e.target.value 
                          });
                          setHasUnsavedChanges(true);
                        }}
                        rows={3}
                        disabled={isReadOnly}
                        style={{ 
                          width: '100%', 
                          padding: '8px 12px', 
                          border: '1px solid #f59e0b', 
                          borderRadius: '4px', 
                          fontSize: '14px', 
                          backgroundColor: isReadOnly ? '#f9fafb' : 'white',
                          resize: 'vertical'
                        }}
                        placeholder="ТВ-ролик, интернет на 2 года, территория РФ"
                      />
                    </div>
                    
                    {usageRightsParsed && (usageRightsParsed.types?.length > 0 || usageRightsParsed.duration || usageRightsParsed.territory) && (
                      <div style={{ 
                        backgroundColor: 'white', 
                        padding: '12px', 
                        borderRadius: '4px', 
                        border: '1px solid #d1d5db' 
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          color: '#374151', 
                          marginBottom: '8px' 
                        }}>
                          Распарсенные данные:
                        </div>
                        {usageRightsParsed.types?.length > 0 && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Типы:</strong> {usageRightsParsed.types.join(', ')}
                          </div>
                        )}
                        {usageRightsParsed.duration && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Срок:</strong> {usageRightsParsed.duration}
                          </div>
                        )}
                        {usageRightsParsed.territory && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong>Территория:</strong> {usageRightsParsed.territory}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Дата премьеры</label>
                  <input 
                    type="text" 
                    value={formData.premiere_date} 
                    onChange={(e) => handleFormChange('premiere_date', e.target.value)}
                    disabled={isReadOnly}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                    placeholder="неопределено" 
                  />
                </div>

                {/* БЛОК РОЛЕЙ */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>Роли проекта</h4>
                    {!isReadOnly && (
                      <button type="button" onClick={addRole} style={{ padding: '6px 12px', fontSize: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        + Добавить роль
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {roles.map((role, index) => (
                      <div key={index} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }} onClick={() => toggleRoleCollapse(index)}>
                            <h5 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{role.name || `Роль ${index + 1}`}</h5>
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>{collapsedRoles.has(index) ? '▼' : '▲'}</span>
                          </div>
                          {!isReadOnly && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {!collapsedRoles.has(index) && (
                                <button type="button" onClick={() => toggleRoleCollapse(index)} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                  Свернуть
                                </button>
                              )}
                              <button type="button" onClick={() => handleDeleteRoleClick(index)} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Удалить
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Детали роли - показываем если НЕ свернута */}
                        {!collapsedRoles.has(index) && (
                          <>
                            {/* Базовые поля роли */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Название роли *</label>
                                <input 
                                  type="text" 
                                  value={role.name} 
                                  onChange={(e) => handleRoleChange(index, 'name', e.target.value)} 
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                  placeholder="Введите название роли" 
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Тип роли *</label>
                                <select 
                                  value={role.role_type?.id || ''} 
                                  onChange={(e) => { 
                                    const selectedType = roleTypesList.find((rt: any) => rt.id === parseInt(e.target.value));
                                    if (selectedType) {
                                      handleRoleChange(index, 'role_type', selectedType);
                                    }
                                  }}
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: role.role_type?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }}
                                >
                                  <option value="">Выберите тип</option>
                                  {roleTypesList.map((rt: any) => (
                                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Пол *</label>
                                <select 
                                  value={role.gender || 'doesnt_matter'} 
                                  onChange={(e) => handleRoleChange(index, 'gender', e.target.value)} 
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }}
                                >
                                  <option value="doesnt_matter">Не важно</option>
                                  <option value="male">Мужчина</option>
                                  <option value="female">Женщина</option>
                                  <option value="boy">Мальчик</option>
                                  <option value="girl">Девочка</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Медийность</label>
                                <select 
                                  value={role.media_presence} 
                                  onChange={(e) => handleRoleChange(index, 'media_presence', e.target.value)} 
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }}
                                >
                                  <option value="doesnt_matter">Неважно</option>
                                  <option value="yes">Да</option>
                                  <option value="no">Нет</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Описание роли */}
                            <div style={{ marginBottom: '16px' }}>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Описание роли *</label>
                              <textarea 
                                rows={3} 
                                value={role.description} 
                                onChange={(e) => handleRoleChange(index, 'description', e.target.value)} 
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                placeholder="Описание роли" 
                              />
                            </div>

                            {/* Возраст */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Мин. возраст</label>
                                <input 
                                  type="number" 
                                  value={role.age_min} 
                                  onChange={(e) => handleRoleChange(index, 'age_min', e.target.value)} 
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                  placeholder="от" 
                                  min="0" 
                                  max="99" 
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Макс. возраст</label>
                                <input 
                                  type="number" 
                                  value={role.age_max} 
                                  onChange={(e) => handleRoleChange(index, 'age_max', e.target.value)} 
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                  placeholder="до" 
                                  min="0" 
                                  max="99" 
                                />
                              </div>
                            </div>

                            {/* Внешность */}
                            <div style={{ marginBottom: '16px' }}>
                              <h6 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Внешность</h6>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Рост</label>
                                  <input 
                                    type="text" 
                                    value={role.height} 
                                    onChange={(e) => handleRoleChange(index, 'height', e.target.value)} 
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                    placeholder="неопределено" 
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Телосложение</label>
                                  <input 
                                    type="text" 
                                    value={role.body_type} 
                                    onChange={(e) => handleRoleChange(index, 'body_type', e.target.value)} 
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                    placeholder="неопределено" 
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Цвет волос</label>
                                  <input 
                                    type="text" 
                                    value={role.hair_color} 
                                    onChange={(e) => handleRoleChange(index, 'hair_color', e.target.value)} 
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                    placeholder="неопределено" 
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Цвет глаз</label>
                                  <input 
                                    type="text" 
                                    value={role.eye_color} 
                                    onChange={(e) => handleRoleChange(index, 'eye_color', e.target.value)} 
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                    placeholder="неопределено" 
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Прическа</label>
                                  <input 
                                    type="text" 
                                    value={role.hairstyle} 
                                    onChange={(e) => handleRoleChange(index, 'hairstyle', e.target.value)} 
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                    placeholder="неопределено" 
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Размер одежды</label>
                                  <input 
                                    type="text" 
                                    value={role.clothing_size} 
                                    onChange={(e) => handleRoleChange(index, 'clothing_size', e.target.value)} 
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                    placeholder="неопределено" 
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Размер обуви</label>
                                  <select 
                                    value={role.shoe_size?.id || ''} 
                                    onChange={(e) => { 
                                      const selected = shoeSizesList.find((s: any) => s.id === parseInt(e.target.value));
                                      handleRoleChange(index, 'shoe_size', selected || null);
                                    }}
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }}
                                  >
                                    <option value="">Не указан</option>
                                    {shoeSizesList.map((s: any) => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Национальность</label>
                                  <select 
                                    value={role.nationality?.id || ''} 
                                    onChange={(e) => { 
                                      const selected = nationalitiesList.find((n: any) => n.id === parseInt(e.target.value));
                                      handleRoleChange(index, 'nationality', selected || null);
                                    }}
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }}
                                  >
                                    <option value="">Не указана</option>
                                    {nationalitiesList.map((n: any) => (
                                      <option key={n.id} value={n.id}>{n.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Рабочие условия */}
                            <div style={{ marginBottom: '16px' }}>
                              <h6 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Рабочие условия</h6>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Ставка за смену</label>
                                  <input 
                                    type="text" 
                                    value={role.rate_per_shift} 
                                    onChange={(e) => handleRoleChange(index, 'rate_per_shift', e.target.value)} 
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                    placeholder="неопределено" 
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Даты смен</label>
                                  <input 
                                    type="text" 
                                    value={role.shooting_dates} 
                                    onChange={(e) => handleRoleChange(index, 'shooting_dates', e.target.value)} 
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                    placeholder="неопределено" 
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Место съемки</label>
                                  <input 
                                    type="text" 
                                    value={role.shooting_location} 
                                    onChange={(e) => handleRoleChange(index, 'shooting_location', e.target.value)} 
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                    placeholder="неопределено" 
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Условия по ставке</label>
                                  <input 
                                    type="text" 
                                    value={role.rate_conditions} 
                                    onChange={(e) => handleRoleChange(index, 'rate_conditions', e.target.value)} 
                                    disabled={isReadOnly}
                                    style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                    placeholder="неопределено" 
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Блок навыков */}
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h6 style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Требуемые навыки</h6>
                                {!isReadOnly && (
                                  <button 
                                    type="button" 
                                    onClick={() => addSkillToRole(index)} 
                                    style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                  >
                                    + Добавить навык
                                  </button>
                                )}
                              </div>
                              {role.skills_required && role.skills_required.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {role.skills_required.map((skill: any, skillIndex: number) => {
                                    const filteredSkills = skill?.name 
                                      ? skillsList.filter((s: any) => s.name.toLowerCase().includes(skill.name.toLowerCase()))
                                      : skillsList;
                                    const showAllSkills = (role as any)[`showAllSkills_${skillIndex}`] || false;
                                    const showDropdown = (role as any)[`showSkillDropdown_${skillIndex}`] || false;
                                    
                                    return (
                                      <div key={skillIndex} style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }} className="dropdown-container">
                                        <div style={{ flex: 1, position: 'relative' }}>
                                          <input 
                                            type="text"
                                            value={skill?.name || ''} 
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              updateRoleSkill(index, skillIndex, { id: null, name: value });
                                              handleRoleChange(index, `showSkillDropdown_${skillIndex}`, true);
                                              handleRoleChange(index, `showAllSkills_${skillIndex}`, false);
                                            }}
                                            onFocus={() => {
                                              if (skill?.name) {
                                                handleRoleChange(index, `showSkillDropdown_${skillIndex}`, true);
                                              }
                                            }}
                                            disabled={isReadOnly}
                                            style={{ width: '100%', padding: '6px 8px', border: skill?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '13px', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }}
                                            placeholder="Введите навык"
                                          />
                                          {!isReadOnly && showDropdown && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '150px', overflowY: 'auto' }}>
                                              {(showAllSkills ? skillsList : filteredSkills).map((s: any) => (
                                                <div key={s.id} onClick={() => {
                                                  updateRoleSkill(index, skillIndex, s);
                                                  handleRoleChange(index, `showSkillDropdown_${skillIndex}`, false);
                                                }} style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb', fontSize: '13px' }}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} 
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}>
                                                  {s.name}
                                                </div>
                                              ))}
                                              {!showAllSkills && filteredSkills.length < skillsList.length && (
                                                <div onClick={(e) => { e.stopPropagation(); handleRoleChange(index, `showAllSkills_${skillIndex}`, true); }} 
                                                  style={{ padding: '6px 10px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} 
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>
                                                  📋 Показать все варианты ({skillsList.length})
                                                </div>
                                              )}
                                              <div onClick={(e) => { e.stopPropagation(); /* alert('Создание нового навыка в справочнике'); */ handleRoleChange(index, `showSkillDropdown_${skillIndex}`, false); }} 
                                                style={{ padding: '6px 10px', cursor: 'pointer', backgroundColor: '#f0fdf4', borderTop: '1px solid #bbf7d0', color: '#15803d', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'} 
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}>
                                                + Создать новый навык
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        {!isReadOnly && (
                                          <button 
                                            type="button" 
                                            onClick={() => removeSkillFromRole(index, skillIndex)} 
                                            style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ padding: '12px', backgroundColor: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '4px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                                  Навыки не указаны
                                </div>
                              )}
                            </div>

                            {/* Дополнительные поля */}
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Референс</label>
                                <textarea 
                                  value={role.reference_text} 
                                  onChange={(e) => handleRoleChange(index, 'reference_text', e.target.value)} 
                                  rows={2} 
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                  placeholder="неопределено" 
                                />
                              </div>
                              <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Особые условия</label>
                                <textarea 
                                  value={role.special_conditions} 
                                  onChange={(e) => handleRoleChange(index, 'special_conditions', e.target.value)} 
                                  rows={2} 
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                  placeholder="неопределено" 
                                />
                              </div>
                              <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Требования к пробам</label>
                                <textarea 
                                  value={role.audition_requirements} 
                                  onChange={(e) => handleRoleChange(index, 'audition_requirements', e.target.value)} 
                                  rows={2} 
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                  placeholder="неопределено" 
                                />
                              </div>
                              <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Текст проб</label>
                                <textarea 
                                  value={role.audition_text} 
                                  onChange={(e) => handleRoleChange(index, 'audition_text', e.target.value)} 
                                  rows={3} 
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                  placeholder="неопределено" 
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Заметки</label>
                                <textarea 
                                  value={role.notes} 
                                  onChange={(e) => handleRoleChange(index, 'notes', e.target.value)} 
                                  rows={2} 
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical', backgroundColor: isReadOnly ? '#f9fafb' : 'white' }} 
                                  placeholder="неопределено" 
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: isReadOnly ? 'space-between' : 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  {isReadOnly && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        type="button" 
                        onClick={handleEditClick} 
                        style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white' }}
                      >
                        Редактировать
                      </button>
                      {/* Кнопка удаления - видна только создателю проекта */}
                      {user && projectData && user.id === projectData.created_by_id && (
                        <button 
                          type="button" 
                          onClick={handleDeleteClick} 
                          style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#dc2626', color: 'white' }}
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button" 
                      onClick={currentMode === 'edit' ? handleCancelEdit : handleModalClose} 
                      style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}
                    >
                      {isReadOnly ? 'Закрыть' : 'Отмена'}
                    </button>
                    {!isReadOnly && (
                      <button type="submit" style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white' }}>
                        {currentMode === 'create' ? 'Создать проект' : 'Сохранить изменения'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Dialog */}
      {showUnsavedWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'black' }}>Несохраненные изменения</h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>У вас есть несохраненные изменения. Вы уверены, что хотите закрыть без сохранения?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowUnsavedWarning(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}>Отмена</button>
              <button onClick={handleConfirmClose} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#dc2626', color: 'white' }}>Закрыть без сохранения</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Dialog */}
      {showDeleteWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'black' }}>Подтверждение удаления</h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Вы уверены, что хотите удалить проект "<strong>{projectData?.title}</strong>"? Это действие нельзя отменить.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={handleCancelDelete} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}>Отмена</button>
              <button onClick={handleConfirmDelete} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#dc2626', color: 'white' }}>Удалить проект</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Confirmation Dialog */}
      {showDeleteRoleWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'black' }}>Подтверждение удаления роли</h3>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              Вы уверены, что хотите удалить роль "<strong>{roleToDelete !== null ? roles[roleToDelete]?.name : ''}</strong>"?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={handleCancelDeleteRole} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}>Отмена</button>
              <button onClick={handleConfirmDeleteRole} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#dc2626', color: 'white' }}>Удалить роль</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectFormModal;
