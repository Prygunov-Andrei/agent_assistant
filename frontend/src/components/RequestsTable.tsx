import * as React from 'react';
import { useState } from 'react';
import { requestsService } from '../services/requests';
import { peopleService } from '../services/people';
import { companiesService } from '../services/companies';
import { projectsService } from '../services/projects';
import { artistsService } from '../services/artists';
import { LLMService } from '../services/llm';
import { ErrorHandler } from '../utils/errorHandler';
import VirtualizedList from './common/VirtualizedList';
import { TableSkeleton } from './common/SkeletonLoader';
import AnimatedContainer from './common/AnimatedContainer';
import type { RequestListItem } from '../types';

const RequestsTable: React.FC = () => {
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояния модального окна
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestListItem | null>(null);
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [hasBeenAnalyzed, setHasBeenAnalyzed] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  
  // Состояния для модального окна удаления
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
  
  // Состояния для персон команды проекта
  const [castingDirector, setCastingDirector] = useState<any>(null);
  const [director, setDirector] = useState<any>(null);
  const [producer, setProducer] = useState<any>(null);
  const [productionCompany, setProductionCompany] = useState<any>(null);
  
  // Состояния для поиска персон
  const [castingDirectorSearch, setCastingDirectorSearch] = useState<any[]>([]);
  const [directorSearch, setDirectorSearch] = useState<any[]>([]);
  const [producerSearch, setProducerSearch] = useState<any[]>([]);
  const [companySearch, setCompanySearch] = useState<any[]>([]);
  
  // Состояния для отображения выпадающих списков
  const [showCastingDirectorDropdown, setShowCastingDirectorDropdown] = useState(false);
  const [showDirectorDropdown, setShowDirectorDropdown] = useState(false);
  const [showProducerDropdown, setShowProducerDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showProjectTypeDropdown, setShowProjectTypeDropdown] = useState(false);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  
  // Состояния для типа проекта и жанра
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

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestsService.getRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      ErrorHandler.logError(err, 'RequestsTable.fetchRequests');
      setError('Ошибка загрузки запросов');
      setRequests([]); // Устанавливаем пустой массив при ошибке
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests();
    loadReferences();
  }, []);

  const loadReferences = async () => {
    try {
      const [types, genres, roleTypes, shoeSizes, nationalities, skills] = await Promise.all([
        projectsService.getProjectTypes(),
        projectsService.getGenres(),
        projectsService.getRoleTypes(),
        projectsService.getShoeSizes(),
        projectsService.getNationalities(),
        artistsService.getSkills()
      ]);
      setProjectTypesList(types);
      setGenresList(genres);
      setRoleTypesList(roleTypes);
      setShoeSizesList(shoeSizes);
      setNationalitiesList(nationalities);
      setSkillsList(skills);
    } catch (error) {
      console.error('Ошибка загрузки справочников:', error);
    }
  };

  // Обработчик клавиши Escape и кликов вне выпадающих списков
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showProjectModal) {
        handleModalClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowCastingDirectorDropdown(false);
        setShowDirectorDropdown(false);
        setShowProducerDropdown(false);
        setShowCompanyDropdown(false);
        setShowProjectTypeDropdown(false);
        setShowGenreDropdown(false);
        
        // Закрываем все dropdown навыков
        setRoles(prev => prev.map(role => {
          const updated = { ...role };
          Object.keys(updated).forEach(key => {
            if (key.startsWith('showSkillDropdown_')) {
              updated[key] = false;
            }
          });
          return updated;
        }));
      }
    };

    if (showProjectModal) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showProjectModal]);

  const handleRowClick = async (request: RequestListItem) => {
    // Очищаем все состояние перед открытием модального окна
    setSelectedRequest(request);
    setShowProjectModal(true);
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
    setCollapsedRoles(new Set());
    setHasBeenAnalyzed(false); // Сбрасываем флаг анализа
    setAnalysisProgress(0);
    setCastingDirector(null);
    setDirector(null);
    setProducer(null);
    setProductionCompany(null);
    setHasUnsavedChanges(false);
    
    // Очищаем результаты поиска персон
    setCastingDirectorSearch([]);
    setDirectorSearch([]);
    setProducerSearch([]);
    setCompanySearch([]);
    setShowCastingDirectorDropdown(false);
    setShowDirectorDropdown(false);
    setShowProducerDropdown(false);
    setShowCompanyDropdown(false);
    setShowProjectTypeDropdown(false);
    setShowGenreDropdown(false);
    
    // Очищаем типы и жанр
    setProjectType(null);
    setGenre(null);
    
    // НЕ запускаем автоматический анализ при открытии
    // Пользователь может выбрать режим: Черновик (пустая форма) или GPT-4o (анализ)
    // await handleAutoAnalysis(request);
  };

  const handleAutoAnalysis = async (request: RequestListItem) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Симуляция прогресса для визуального эффекта
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);
    
    let hasError = false;
    
    try {
      // Вызываем LLM сервис (реальный анализ GPT-4o)
      const analysisData = await LLMService.analyzeRequest(request.id, false);
      
      console.log('Analysis Data Full:', JSON.stringify(analysisData, null, 2));
      
      // Предзаполняем форму данными из анализа
      if (analysisData.project_analysis) {
        const pa = analysisData.project_analysis;
        
        // Сохраняем сырой тип проекта для поиска
        const rawProjectType = pa.project_type_raw || pa.project_type || '';
        
        // Пытаемся найти тип проекта в справочнике
        const foundProjectType = projectTypesList.find((type: any) => 
          type.name.toLowerCase() === rawProjectType.toLowerCase()
        );
        
        // Пытаемся найти жанр в справочнике  
        const foundGenre = genresList.find((g: any) => 
          g.name.toLowerCase() === (pa.genre || '').toLowerCase()
        );
        
        // Устанавливаем найденные значения
        if (foundProjectType) {
          setProjectType(foundProjectType);
        } else if (rawProjectType) {
          // Если не нашли точное совпадение, сохраняем для поиска
          setProjectType({ id: null, name: rawProjectType });
        }
        
        if (foundGenre) {
          setGenre(foundGenre);
        } else if (pa.genre) {
          setGenre({ id: null, name: pa.genre });
        }
        
        setFormData({
          title: pa.project_title || '',
          description: pa.description || '',
          project_type: foundProjectType?.id || 1,
          project_type_raw: rawProjectType,
          genre: foundGenre?.id,
          premiere_date: pa.premiere_date || '',
          status: 'draft'
        });
        
        // Предзаполняем роли - конвертируем формат backend в формат frontend
        if (pa.roles && pa.roles.length > 0) {
          const mappedRoles = pa.roles.map((role: any) => {
            // Ищем тип роли в справочнике
            const foundRoleType = roleTypesList.find((rt: any) => 
              rt.name.toLowerCase() === (role.role_type || '').toLowerCase()
            );
            
            // Ищем размер обуви в справочнике
            const foundShoeSize = shoeSizesList.find((s: any) => 
              s.name === (role.shoe_size || '')
            );
            
            // Ищем национальность в справочнике
            const foundNationality = nationalitiesList.find((n: any) => 
              n.name.toLowerCase() === (role.nationality || '').toLowerCase()
            );
            
            return {
              name: role.character_name || '',
              description: role.description || '',
              role_type: foundRoleType || (role.role_type ? { id: null, name: role.role_type } : null),
              role_type_id: foundRoleType?.id || null,
              gender: role.gender || 'doesnt_matter',
              age_min: role.age_min ?? '',  // ?? вместо || чтобы 0 не превращался в ''
              age_max: role.age_max ?? '',
              media_presence: role.media_presence || 'doesnt_matter',
              shoe_size: foundShoeSize || null,
              nationality: foundNationality || null,
              // Внешность - из LLM (оставляем null как есть)
              clothing_size: role.clothing_size || '',
              hairstyle: role.hairstyle || '',
              hair_color: role.hair_color || '',
              eye_color: role.eye_color || '',
              height: role.height || '',
              body_type: role.body_type || '',
              // Дополнительные поля - из LLM (оставляем null как есть)
              reference_text: role.reference_text || '',
              special_conditions: role.special_conditions || role.special_requirements?.join(', ') || '',
              audition_requirements: role.audition_requirements || '',
              audition_text: role.audition_text || '',
              // Рабочие условия - из LLM (оставляем null как есть)
              rate_per_shift: role.rate_per_shift || '',
              rate_conditions: role.rate_conditions || '',
              shooting_dates: role.shooting_dates || '',
              shooting_location: role.shooting_location || '',
              notes: role.notes || '',
              // Конвертируем skills_required из массива строк в массив объектов
              skills_required: (role.skills_required?.acting_skills || []).map((skillName: string) => {
                const foundSkill = skillsList.find((s: any) => 
                  s.name.toLowerCase() === skillName.toLowerCase()
                );
                return foundSkill || { id: null, name: skillName };
              }),
              suggested_artists: role.suggested_artists || []
            };
          });
          setRoles(mappedRoles);
        }
      }
      
      // Предзаполняем контакты (используем объекты с name/email/phone)
      if ((analysisData as any).contacts) {
        const contacts = (analysisData as any).contacts;
        if (contacts.casting_director && contacts.casting_director.name && contacts.casting_director.name !== 'Не определен') {
          setCastingDirector({ id: null, name: contacts.casting_director.name, match: 0 });
        }
        if (contacts.director && contacts.director.name && contacts.director.name !== 'Не определен') {
          setDirector({ id: null, name: contacts.director.name, match: 0 });
        }
        if (contacts.producers && contacts.producers.length > 0 && contacts.producers[0].name !== 'Не определен') {
          setProducer({ id: null, name: contacts.producers[0].name, match: 0 });
        }
        if (contacts.production_company && contacts.production_company.name) {
          // Предзаполняем даже если "Не определен" - пользователь сможет ввести вручную
          setProductionCompany({ 
            id: null, 
            name: contacts.production_company.name === 'Не определен' ? '' : contacts.production_company.name, 
            match: 0 
          });
        }
      }
      
    } catch (error) {
      hasError = true;
      console.error('Ошибка LLM анализа:', error);
      ErrorHandler.logError(error, 'RequestsTable.handleAutoAnalysis');
      clearInterval(progressInterval);
      setAnalysisProgress(0);
      setIsAnalyzing(false);
      
      // Показываем понятное сообщение об ошибке
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при анализе запроса';
      alert(`Ошибка анализа: ${errorMessage}\n\nПопробуйте еще раз или заполните форму вручную.`);
    } finally {
      // Очищаем интервал
      clearInterval(progressInterval);
      
      // Завершение анализа только если не было ошибки
      if (!hasError) {
        setAnalysisProgress(100);
        setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisProgress(0);
          setHasBeenAnalyzed(true);
          setHasUnsavedChanges(true); // Отмечаем что есть несохраненные изменения после анализа
        }, 500);
      }
    }
  };

  const handleModalClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      setShowProjectModal(false);
      setSelectedRequest(null);
    }
  };

  const handleConfirmClose = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedWarning(false);
    setShowProjectModal(false);
    setSelectedRequest(null);
    setFormData({ title: '', description: '', project_type: 1, genre: undefined, premiere_date: '', status: 'draft', project_type_raw: '' });
    setRoles([]);
    setCollapsedRoles(new Set());
    setHasBeenAnalyzed(false);
    setAnalysisProgress(0);
    setCastingDirector(null);
    setDirector(null);
    setProducer(null);
    setProductionCompany(null);
    setProjectType(null);
    setGenre(null);
  };

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
      name: '', description: '', 
      role_type: null, // Будет объект { id, name } после выбора
      role_type_id: null, // ID для сохранения в БД
      gender: 'doesnt_matter',
      age_min: '',
      age_max: '',
      media_presence: 'doesnt_matter',
      shoe_size: null, // { id, name }
      nationality: null, // { id, name }
      clothing_size: '', hairstyle: '', hair_color: '', eye_color: '', height: '',
      body_type: '', reference_text: '', special_conditions: '', audition_requirements: '',
      audition_text: '', rate_per_shift: '', rate_conditions: '', shooting_dates: '',
      shooting_location: '', notes: '', skills_required: [], suggested_artists: []
    }]);
    setHasUnsavedChanges(true);
  };

  const removeRole = (index: number) => {
    setRoles(prev => prev.filter((_, i) => i !== index));
    setCollapsedRoles(prev => { const newSet = new Set(prev); newSet.delete(index); return newSet; });
    setHasUnsavedChanges(true);
  };

  const toggleRoleCollapse = (index: number) => {
    setCollapsedRoles(prev => { const newSet = new Set(prev); if (newSet.has(index)) { newSet.delete(index); } else { newSet.add(index); } return newSet; });
  };

  const collapseRole = (index: number) => {
    setCollapsedRoles(prev => new Set(prev).add(index));
  };

  const searchPerson = async (query: string, type: 'casting_director' | 'director' | 'producer' | 'company') => {
    if (!query.trim()) return;
    
    try {
      let results: any[] = [];
      
      if (type === 'company') {
        // Поиск компаний через API
        console.log('Searching companies with query:', query);
        const response = await companiesService.searchCompanies({ name: query, limit: 10 });
        console.log('Companies response:', response);
        
        // API возвращает объект { matches: [...], total: N }
        const companies = (response as any).matches || [];
        console.log('Companies array:', companies);
        
        results = companies.map((company: any) => ({
          id: company.id,
          name: company.name,
          phone: company.phone,
          email: company.email,
          website: company.website,
          match: company.score || 0.5 // Используем score из API или дефолтное значение
        }));
        console.log('Mapped results:', results);
        setCompanySearch(results);
        setShowCompanyDropdown(true);
      } else {
        // Поиск персон через API с фильтром по типу
        const people = await peopleService.searchPeople({ name: query, limit: 10 });
        // Фильтруем по типу персоны
        const personTypeMap: any = {
          'casting_director': 'casting_director',
          'director': 'director',
          'producer': 'producer'
        };
        
        results = people
          .filter((person: any) => person.person_type === personTypeMap[type])
          .map((person: any) => ({
            id: person.id,
            name: person.full_name || `${person.first_name} ${person.last_name}`,
            phone: person.phone,
            email: person.email,
            telegram: person.telegram_username,
            match: person.score || 0.5 // Используем score из API
          }));
        
        if (type === 'casting_director') { setCastingDirectorSearch(results); setShowCastingDirectorDropdown(true); }
        else if (type === 'director') { setDirectorSearch(results); setShowDirectorDropdown(true); }
        else if (type === 'producer') { setProducerSearch(results); setShowProducerDropdown(true); }
      }
    } catch (error) {
      console.error(`Ошибка поиска ${type}:`, error);
      ErrorHandler.logError(error, `RequestsTable.searchPerson.${type}`);
      // В случае ошибки показываем пустой список
      if (type === 'casting_director') { setCastingDirectorSearch([]); setShowCastingDirectorDropdown(false); }
      else if (type === 'director') { setDirectorSearch([]); setShowDirectorDropdown(false); }
      else if (type === 'producer') { setProducerSearch([]); setShowProducerDropdown(false); }
      else { setCompanySearch([]); setShowCompanyDropdown(false); }
    }
  };

  const selectPerson = (person: any, type: 'casting_director' | 'director' | 'producer' | 'company') => {
    if (type === 'casting_director') { setCastingDirector(person); setShowCastingDirectorDropdown(false); }
    else if (type === 'director') { setDirector(person); setShowDirectorDropdown(false); }
    else if (type === 'producer') { setProducer(person); setShowProducerDropdown(false); }
    else { setProductionCompany(person); setShowCompanyDropdown(false); }
    setHasUnsavedChanges(true);
  };

  const createNewPerson = (type: 'casting_director' | 'director' | 'producer' | 'company') => {
    alert(`Создание новой ${type === 'casting_director' ? 'кастинг-директора' : type === 'director' ? 'режиссера' : type === 'producer' ? 'продюсера' : 'кинокомпании'}`);
    if (type === 'casting_director') setShowCastingDirectorDropdown(false);
    else if (type === 'director') setShowDirectorDropdown(false);
    else if (type === 'producer') setShowProducerDropdown(false);
    else setShowCompanyDropdown(false);
  };

  const [showAllProjectTypes, setShowAllProjectTypes] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);

  const searchProjectType = (query: string) => {
    if (!query.trim()) {
      setShowProjectTypeDropdown(false);
      setShowAllProjectTypes(false);
      return;
    }
    setShowProjectTypeDropdown(true);
    setShowAllProjectTypes(false); // Сбрасываем при новом поиске
  };

  const selectProjectType = (type: any) => {
    setProjectType(type);
    setFormData(prev => ({ ...prev, project_type: type.id }));
    setShowProjectTypeDropdown(false);
    setHasUnsavedChanges(true);
  };

  const searchGenre = (query: string) => {
    if (!query.trim()) {
      setShowGenreDropdown(false);
      setShowAllGenres(false);
      return;
    }
    setShowGenreDropdown(true);
    setShowAllGenres(false); // Сбрасываем при новом поиске
  };

  const selectGenre = (g: any) => {
    setGenre(g);
    setFormData(prev => ({ ...prev, genre: g.id }));
    setShowGenreDropdown(false);
    setHasUnsavedChanges(true);
  };

  // Функции для управления навыками роли
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
        const newSkills = [...role.skills_required];
        newSkills[skillIndex] = skill;
        return { ...role, skills_required: newSkills };
      }
      return role;
    }));
    setHasUnsavedChanges(true);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { alert('Пожалуйста, введите название проекта'); return; }
    if (!projectType?.id) { alert('Пожалуйста, выберите тип проекта из справочника'); return; }
    if (!genre?.id) { alert('Пожалуйста, выберите жанр из справочника'); return; }
    if (!castingDirector?.id) { alert('Пожалуйста, выберите кастинг-директора'); return; }
    if (!director?.id) { alert('Пожалуйста, выберите режиссера'); return; }
    if (!producer?.id) { alert('Пожалуйста, выберите продюсера'); return; }
    if (!productionCompany?.id) { alert('Пожалуйста, выберите кинокомпанию'); return; }
    if (roles.length === 0) { alert('Пожалуйста, добавьте хотя бы одну роль'); return; }
    const incompleteRoles = roles.filter(role => !role.name?.trim() || !role.description?.trim());
    if (incompleteRoles.length > 0) { alert('Пожалуйста, заполните название и описание для всех ролей'); return; }
    
    try {
      // Подготовка данных для API
      // НЕ передаем request при создании (OneToOneField может конфликтовать)
      // Обновим связь после создания проекта
      const projectPayload: any = {
        title: formData.title,
        description: formData.description,
        project_type: projectType.id,
        genre: genre.id,
        premiere_date: formData.premiere_date || null, // Пустая строка → null
        status: 'in_production',
        casting_director: castingDirector.id,
        director: director.id,
        producers: [producer.id], // ManyToMany - передаем массив
        production_company: productionCompany.id
      };
      
      console.log('Создание проекта:', projectPayload);
      console.log('Типы полей:', {
        casting_director: typeof projectPayload.casting_director,
        director: typeof projectPayload.director,
        producers: Array.isArray(projectPayload.producers),
        production_company: typeof projectPayload.production_company
      });
      
      // Создаем проект через API
      const createdProject = await projectsService.createProject(projectPayload);
      console.log('Проект создан:', createdProject);
      
      // Обновляем проект - добавляем связь с запросом через PATCH
      if (selectedRequest?.id) {
        try {
          // Сначала отвязываем запрос от любого старого проекта (если был)
          // Затем привязываем к новому проекту
          await projectsService.updateProject(createdProject.id, {
            request: selectedRequest.id
          });
          console.log('Связь с запросом установлена');
        } catch (patchErr: any) {
          // Если ошибка "уже существует" - игнорируем, иначе логируем
          if (patchErr?.response?.data?.request) {
            console.warn('Запрос уже связан с другим проектом. Создаем проект без связи.');
          } else {
            console.warn('Не удалось установить связь с запросом:', patchErr);
          }
          // Продолжаем создание проекта даже если связь не установилась
        }
      }
      
      // Создаем роли проекта
      for (const role of roles) {
        console.log('Создание роли - исходные данные:', role);
        
        // Backend теперь принимает null, передаем все поля
        const rolePayload = {
          project: createdProject.id,
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
        
        console.log('Создание роли - payload для API:', rolePayload);
        console.log('Создание роли - полный JSON:', JSON.stringify(rolePayload, null, 2));
        
        await projectsService.createProjectRole(rolePayload);
      }
      
      // Обновляем статус запроса
      if (selectedRequest) {
        await requestsService.updateRequest(selectedRequest.id, {
          analysis_status: 'processed'
        });
      }
      
      setShowProjectModal(false);
      setSelectedRequest(null);
      alert('Проект успешно создан!');
      await fetchRequests();
    } catch (err: any) {
      ErrorHandler.logError(err, 'RequestsTable.handleProjectSubmit');
      console.error('Детали ошибки:', err);
      console.error('Ответ сервера:', err.response?.data);
      console.error('Полный ответ:', JSON.stringify(err.response?.data, null, 2));
      
      // Форматируем ошибку для пользователя
      const errorMessage = err.response?.data 
        ? Object.entries(err.response.data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\n')
        : err.message;
      
      alert(`Ошибка при создании проекта:\n\n${errorMessage}`);
    }
  };

  // Убираем обрезку текста - показываем полный текст
  const displayText = (text: string) => {
    return text;
  };

  // Функция для открытия модального окна удаления
  const handleDeleteClick = (e: React.MouseEvent, requestId: number) => {
    e.stopPropagation(); // Предотвращаем открытие модального окна создания проекта
    setRequestToDelete(requestId);
    setShowDeleteModal(true);
  };

  // Функция для подтверждения удаления запроса
  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    
    try {
      await requestsService.deleteRequest(requestToDelete);
      // Обновляем список запросов
      setRequests(requests.filter(r => r.id !== requestToDelete));
      setShowDeleteModal(false);
      setRequestToDelete(null);
    } catch (err) {
      ErrorHandler.logError(err, 'RequestsTable.handleConfirmDelete');
      alert('Ошибка при удалении запроса');
    }
  };

  // Функция для отмены удаления
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRequestToDelete(null);
  };

  // Функция для получения текста статуса
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Новый';
      case 'completed':
        return 'Обработан';
      default:
        return status;
    }
  };

  // Функция для получения цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#3b82f6'; // blue
      case 'completed':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  // Компонент для рендеринга строки запроса
  const renderRequestRow = (request: RequestListItem, _index: number) => (
    <tr 
      key={request.id} 
      className="requests-table-row hover:bg-blue-50 cursor-pointer transition-colors duration-200"
      onClick={() => handleRowClick(request)}
    >
      <td className="requests-table-cell">
        <div className="request-date">
          <div className="request-date-date">
            {request.original_created_at ? new Date(request.original_created_at).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            }) : 'Не указано'}
          </div>
          <div className="request-date-time">
            {request.original_created_at ? new Date(request.original_created_at).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Не указано'}
          </div>
        </div>
      </td>
      <td className="requests-table-cell">
        <div className="request-author">
          <div className="request-author-name">
            {request.author_name}
          </div>
          {request.is_forwarded && (
            <div className="request-forwarded">
              Переслано
            </div>
          )}
        </div>
      </td>
      <td className="requests-table-cell">
        <div className="request-text">
          {displayText(request.text)}
        </div>
      </td>
      <td className="requests-table-cell">
        <div className="request-media">
          {request.images && request.images.length > 0 && (
            <div className="media-item">
              <div className="images-container">
                {request.images.map((image, index) => (
                  <img 
                    key={index}
                    src={image.image} 
                    alt={`Фото запроса ${index + 1}`}
                    className="request-image"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {request.files && request.files.length > 0 && (
            <div className="media-item">
              <div className="files-container">
                {request.files.map((file, index) => (
                  <div key={index} className="file-item">
                    <span className="media-icon">📄</span>
                    <a 
                      href={file.file} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="file-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {file.original_filename}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(!request.images || request.images.length === 0) && (!request.files || request.files.length === 0) && (
            <span className="no-media">Нет медиа</span>
          )}
        </div>
      </td>
      <td className="requests-table-cell">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: getStatusColor(request.status) + '20',
            color: getStatusColor(request.status),
            border: `1px solid ${getStatusColor(request.status)}40`
          }}>
            {getStatusText(request.status)}
          </div>
          <button
            onClick={(e) => handleDeleteClick(e, request.id)}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            title="Удалить запрос"
          >
            Удалить
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div className="card overflow-hidden">
          <div className="p-4">
            <TableSkeleton rows={8} columns={5} />
          </div>
        </div>
      </AnimatedContainer>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
        </div>
        <button onClick={fetchRequests} className="btn btn-primary">
          Попробовать снова
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-6">
          Пока нет запросов для обработки.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* CSS анимация для прогресс-бара */}
      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
      
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="requests-table">
              <tbody>
                {requests.length > 50 ? (
                  <VirtualizedList
                    items={requests}
                    itemHeight={120}
                    containerHeight={600}
                    renderItem={renderRequestRow}
                  />
                ) : (
                  requests.map((request) => renderRequestRow(request, requests.indexOf(request)))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedContainer>

      {/* Модальное окно создания проекта */}
      {showProjectModal && selectedRequest && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleModalClose(); }}
        >
          <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '1200px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'black', margin: 0 }}>Создание проекта из запроса #{selectedRequest.id}</h2>
              </div>
              <button onClick={handleModalClose} style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b7280', cursor: 'pointer', border: 'none', background: 'none', padding: '5px' }}>&times;</button>
            </div>

            {/* MAIN CONTENT - 2 columns */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: '0' }}>
              {/* LEFT PANEL - Context */}
              <div style={{ width: '35%', minWidth: '300px', borderRight: '1px solid #e5e7eb', backgroundColor: '#f9fafb', overflow: 'auto', padding: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Контекст запроса</h3>
                <div style={{ marginBottom: '12px' }}><strong>Автор:</strong> {selectedRequest.author_name}</div>
                {selectedRequest.author_username && (
                  <div style={{ marginBottom: '12px' }}><strong>Telegram:</strong> {selectedRequest.author_username}</div>
                )}
                <div style={{ marginBottom: '12px' }}><strong>Дата:</strong> {selectedRequest.original_created_at ? new Date(selectedRequest.original_created_at).toLocaleDateString('ru-RU') : 'Не указано'}</div>
                
                {/* Кнопка анализа запроса */}
                {!hasBeenAnalyzed && !isAnalyzing && (
                  <div style={{ marginBottom: '16px' }}>
                    <button 
                      onClick={() => {
                        if (selectedRequest) {
                          handleAutoAnalysis(selectedRequest);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        border: 'none',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(59, 130, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>🤖</span>
                      <span>Анализировать запрос</span>
                    </button>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px', textAlign: 'center' }}>
                      GPT-4o проанализирует запрос и предзаполнит форму (~15-20 сек)
                    </div>
                  </div>
                )}
                
                {/* Прогресс-бар анализа */}
                {isAnalyzing && (
                  <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '2px solid #3b82f6' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#1e40af', textAlign: 'center' }}>
                      🤖 Анализ запроса GPT-4o...
                    </div>
                    {/* Прогресс-бар */}
                    <div style={{ 
                      width: '100%', 
                      height: '24px', 
                      backgroundColor: '#e0f2fe', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid #bae6fd'
                    }}>
                      <div style={{ 
                        width: `${Math.min(analysisProgress, 100)}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
                        borderRadius: '12px',
                        transition: 'width 0.5s ease-out',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* Анимированный блик */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          animation: 'shimmer 1.5s infinite'
                        }}></div>
                      </div>
                      {/* Текст процентов */}
                      <div style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: analysisProgress > 50 ? 'white' : '#1e40af',
                        textShadow: analysisProgress > 50 ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                      }}>
                        {Math.round(analysisProgress)}%
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
                      Обработка текста, поиск контактов, анализ ролей...
                    </div>
                  </div>
                )}
                
                {/* Информация после успешного анализа */}
                {hasBeenAnalyzed && !isAnalyzing && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    backgroundColor: '#f0fdf4', 
                    borderRadius: '6px', 
                    border: '2px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '18px' }}>✅</span>
                    <span style={{ fontSize: '13px', color: '#166534', fontWeight: 'bold' }}>
                      Анализ завершен! Форма предзаполнена данными.
                    </span>
                  </div>
                )}
                
                <div style={{ marginBottom: '12px' }}><strong>Текст:</strong></div>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{selectedRequest.text}</div>
                
                {/* Media Section */}
                {((selectedRequest.images && selectedRequest.images.length > 0) || (selectedRequest.files && selectedRequest.files.length > 0)) && (
                  <div style={{ marginTop: '16px' }}>
                    <strong>Медиа:</strong>
                    <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #d1d5db', marginTop: '8px' }}>
                      {selectedRequest.images && selectedRequest.images.length > 0 && (
                        <div style={{ marginBottom: selectedRequest.files && selectedRequest.files.length > 0 ? '12px' : '0' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Изображения ({selectedRequest.images.length})</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {selectedRequest.images.map((image: any, index: number) => (
                              <img key={index} src={image.image} alt={`Изображение ${index + 1}`} 
                                style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: '#f9fafb' }}
                                onClick={(e) => { e.stopPropagation(); window.open(image.image, '_blank'); }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedRequest.files && selectedRequest.files.length > 0 && (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Файлы ({selectedRequest.files.length})</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {selectedRequest.files.map((file: any, index: number) => (
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

              {/* RIGHT PANEL - Form */}
              <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                {/* Команда проекта */}
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>Команда проекта</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Кастинг-директор */}
                    <div style={{ position: 'relative' }} className="dropdown-container">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Кастинг-директор *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="text" value={castingDirector?.name || ''} onChange={(e) => { searchPerson(e.target.value, 'casting_director'); setCastingDirector({ id: null, name: e.target.value, match: 0 }); setHasUnsavedChanges(true); }}
                          onFocus={() => { if (castingDirector?.name) searchPerson(castingDirector.name, 'casting_director'); }}
                          style={{ flex: 1, padding: '8px 12px', border: castingDirector?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите имя кастинг-директора" />
                        {castingDirector?.match > 0 && <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: castingDirector.match > 0.8 ? '#dcfce7' : '#fef3c7', color: castingDirector.match > 0.8 ? '#166534' : '#92400e' }}>{Math.round(castingDirector.match * 100)}%</span>}
                      </div>
                      {showCastingDirectorDropdown && castingDirectorSearch.length > 0 && (
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
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>+ Добавить нового кастинг-директора</div>
                        </div>
                      )}
                    </div>

                    {/* Режиссер */}
                    <div style={{ position: 'relative' }} className="dropdown-container">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Режиссер *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="text" value={director?.name || ''} onChange={(e) => { searchPerson(e.target.value, 'director'); setDirector({ id: null, name: e.target.value, match: 0 }); setHasUnsavedChanges(true); }}
                          onFocus={() => { if (director?.name) searchPerson(director.name, 'director'); }}
                          style={{ flex: 1, padding: '8px 12px', border: director?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите имя режиссера" />
                        {director?.match > 0 && <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: director.match > 0.8 ? '#dcfce7' : '#fef3c7', color: director.match > 0.8 ? '#166534' : '#92400e' }}>{Math.round(director.match * 100)}%</span>}
                      </div>
                      {showDirectorDropdown && directorSearch.length > 0 && (
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
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>+ Добавить нового режиссера</div>
                        </div>
                      )}
                    </div>

                    {/* Продюсер */}
                    <div style={{ position: 'relative' }} className="dropdown-container">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Продюсер *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="text" value={producer?.name || ''} onChange={(e) => { searchPerson(e.target.value, 'producer'); setProducer({ id: null, name: e.target.value, match: 0 }); setHasUnsavedChanges(true); }}
                          onFocus={() => { if (producer?.name) searchPerson(producer.name, 'producer'); }}
                          style={{ flex: 1, padding: '8px 12px', border: producer?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите имя продюсера" />
                        {producer?.match > 0 && <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: producer.match > 0.8 ? '#dcfce7' : '#fef3c7', color: producer.match > 0.8 ? '#166534' : '#92400e' }}>{Math.round(producer.match * 100)}%</span>}
                      </div>
                      {showProducerDropdown && producerSearch.length > 0 && (
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
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>+ Добавить нового продюсера</div>
                        </div>
                      )}
                    </div>

                    {/* Кинокомпания */}
                    <div style={{ position: 'relative' }} className="dropdown-container">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Кинокомпания *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="text" value={productionCompany?.name || ''} onChange={(e) => { searchPerson(e.target.value, 'company'); setProductionCompany({ id: null, name: e.target.value, match: 0 }); setHasUnsavedChanges(true); }}
                          onFocus={() => { if (productionCompany?.name) searchPerson(productionCompany.name, 'company'); }}
                          style={{ flex: 1, padding: '8px 12px', border: productionCompany?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите название кинокомпании" />
                        {productionCompany?.match > 0 && <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: productionCompany.match > 0.8 ? '#dcfce7' : '#fef3c7', color: productionCompany.match > 0.8 ? '#166534' : '#92400e' }}>{Math.round(productionCompany.match * 100)}%</span>}
                      </div>
                      {showCompanyDropdown && companySearch.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                          {companySearch.map((company, index) => (
                            <div key={index} onClick={() => selectPerson(company, 'company')} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: index < companySearch.length - 1 ? '1px solid #f3f4f6' : 'none', backgroundColor: '#f9fafb' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}>
                              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{company.name}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{company.phone} • {company.email}</div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{company.website}</div>
                            </div>
                          ))}
                          <div onClick={() => createNewPerson('company')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>+ Добавить новую кинокомпанию</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Форма проекта */}
                <form onSubmit={handleProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Название проекта *</label>
                    <input type="text" value={formData.title} onChange={(e) => handleFormChange('title', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите название проекта" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Описание проекта</label>
                    <textarea rows={4} value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }} placeholder="Описание проекта" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Тип проекта - с подбором из справочника */}
                    <div style={{ position: 'relative' }} className="dropdown-container">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Тип проекта *</label>
                      <input type="text" value={projectType?.name || ''} 
                        onChange={(e) => { setProjectType({ id: null, name: e.target.value }); searchProjectType(e.target.value); setHasUnsavedChanges(true); }}
                        onFocus={() => { if (projectType?.name) searchProjectType(projectType.name); }}
                        style={{ width: '100%', padding: '8px 12px', border: projectType?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }} 
                        placeholder="Введите тип проекта" />
                      {showProjectTypeDropdown && (
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
                          <div onClick={(e) => { e.stopPropagation(); alert('Создание нового типа проекта'); setShowProjectTypeDropdown(false); }} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#f0fdf4', borderTop: '1px solid #bbf7d0', color: '#15803d', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}>
                            + Создать новый тип проекта
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Жанр - с подбором из справочника */}
                    <div style={{ position: 'relative' }} className="dropdown-container">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Жанр *</label>
                      <input type="text" value={genre?.name || ''} 
                        onChange={(e) => { setGenre({ id: null, name: e.target.value }); searchGenre(e.target.value); setHasUnsavedChanges(true); }}
                        onFocus={() => { if (genre?.name) searchGenre(genre.name); }}
                        style={{ width: '100%', padding: '8px 12px', border: genre?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }} 
                        placeholder="Введите жанр" />
                      {showGenreDropdown && (
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
                          <div onClick={(e) => { e.stopPropagation(); alert('Создание нового жанра'); setShowGenreDropdown(false); }} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#f0fdf4', borderTop: '1px solid #bbf7d0', color: '#15803d', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}>
                            + Создать новый жанр
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    {/* Дата премьеры */}
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Дата премьеры</label>
                      <input type="text" value={formData.premiere_date} onChange={(e) => handleFormChange('premiere_date', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} placeholder="неопределено" />
                    </div>
                  </div>

                  {/* Роли проекта */}
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>Роли проекта</h4>
                      <button type="button" onClick={addRole} style={{ padding: '6px 12px', fontSize: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Добавить роль</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {roles.map((role, index) => (
                        <div key={index} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }} onClick={() => toggleRoleCollapse(index)}>
                              <h5 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{role.name || `Роль ${index + 1}`}</h5>
                              <span style={{ fontSize: '14px', color: '#6b7280' }}>{collapsedRoles.has(index) ? '▼' : '▲'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {!collapsedRoles.has(index) && <button type="button" onClick={() => collapseRole(index)} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Свернуть</button>}
                              <button type="button" onClick={() => removeRole(index)} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Удалить</button>
                            </div>
                          </div>
                          {!collapsedRoles.has(index) && (
                            <>
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Название роли *</label>
                                  <input type="text" value={role.name} onChange={(e) => handleRoleChange(index, 'name', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите название роли" />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Тип роли *</label>
                                  <select 
                                    value={role.role_type?.id || ''} 
                                    onChange={(e) => { 
                                      const selectedType = roleTypesList.find((rt: any) => rt.id === parseInt(e.target.value));
                                      if (selectedType) {
                                        handleRoleChange(index, 'role_type', selectedType);
                                        handleRoleChange(index, 'role_type_id', selectedType.id);
                                      }
                                    }}
                                    style={{ width: '100%', padding: '6px 8px', border: role.role_type?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }}
                                  >
                                    <option value="">Выберите тип</option>
                                    {roleTypesList.map((rt: any) => (
                                      <option key={rt.id} value={rt.id}>{rt.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Пол *</label>
                                  <select value={role.gender || 'doesnt_matter'} onChange={(e) => handleRoleChange(index, 'gender', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}>
                                    <option value="doesnt_matter">Не важно</option>
                                    <option value="male">Мужчина</option>
                                    <option value="female">Женщина</option>
                                    <option value="boy">Мальчик</option>
                                    <option value="girl">Девочка</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Медийность</label>
                                  <select value={role.media_presence} onChange={(e) => handleRoleChange(index, 'media_presence', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}>
                                    <option value="doesnt_matter">Неважно</option>
                                    <option value="yes">Да</option>
                                    <option value="no">Нет</option>
                                  </select>
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Мин. возраст</label>
                                  <input type="number" value={role.age_min} onChange={(e) => handleRoleChange(index, 'age_min', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} placeholder="от" min="0" max="99" />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Макс. возраст</label>
                                  <input type="number" value={role.age_max} onChange={(e) => handleRoleChange(index, 'age_max', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} placeholder="до" min="0" max="99" />
                                </div>
                              </div>
                              <div style={{ marginBottom: '16px' }}>
                                <h6 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Внешность</h6>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Рост</label><input type="text" value={role.height} onChange={(e) => handleRoleChange(index, 'height', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Телосложение</label><input type="text" value={role.body_type} onChange={(e) => handleRoleChange(index, 'body_type', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Цвет волос</label><input type="text" value={role.hair_color} onChange={(e) => handleRoleChange(index, 'hair_color', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Цвет глаз</label><input type="text" value={role.eye_color} onChange={(e) => handleRoleChange(index, 'eye_color', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Прическа</label><input type="text" value={role.hairstyle} onChange={(e) => handleRoleChange(index, 'hairstyle', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Размер одежды</label><input type="text" value={role.clothing_size} onChange={(e) => handleRoleChange(index, 'clothing_size', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Размер обуви</label>
                                    <select 
                                      value={role.shoe_size?.id || ''} 
                                      onChange={(e) => { 
                                        const selected = shoeSizesList.find((s: any) => s.id === parseInt(e.target.value));
                                        handleRoleChange(index, 'shoe_size', selected || null);
                                      }}
                                      style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
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
                                      style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                                    >
                                      <option value="">Не указана</option>
                                      {nationalitiesList.map((n: any) => (
                                        <option key={n.id} value={n.id}>{n.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                              <div style={{ marginBottom: '16px' }}>
                                <h6 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Рабочие условия</h6>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Ставка за смену</label><input type="text" value={role.rate_per_shift} onChange={(e) => handleRoleChange(index, 'rate_per_shift', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Даты смен</label><input type="text" value={role.shooting_dates} onChange={(e) => handleRoleChange(index, 'shooting_dates', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Место съемки</label><input type="text" value={role.shooting_location} onChange={(e) => handleRoleChange(index, 'shooting_location', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Условия по ставке</label><input type="text" value={role.rate_conditions} onChange={(e) => handleRoleChange(index, 'rate_conditions', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                </div>
                              </div>
                              
                              {/* Блок навыков */}
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <h6 style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Требуемые навыки</h6>
                                  <button type="button" onClick={() => addSkillToRole(index)} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Добавить навык</button>
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
                                              style={{ width: '100%', padding: '6px 8px', border: skill?.id ? '1px solid #10b981' : '1px solid #ef4444', borderRadius: '4px', fontSize: '13px' }}
                                              placeholder="Введите навык"
                                            />
                                            {showDropdown && (
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
                                                <div onClick={(e) => { e.stopPropagation(); alert('Создание нового навыка в справочнике'); handleRoleChange(index, `showSkillDropdown_${skillIndex}`, false); }} 
                                                  style={{ padding: '6px 10px', cursor: 'pointer', backgroundColor: '#f0fdf4', borderTop: '1px solid #bbf7d0', color: '#15803d', fontWeight: 'bold', fontSize: '12px', textAlign: 'center' }}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'} 
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}>
                                                  + Создать новый навык
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <button type="button" onClick={() => removeSkillFromRole(index, skillIndex)} style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>×</button>
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
                              
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Описание роли</label><textarea value={role.description} onChange={(e) => handleRoleChange(index, 'description', e.target.value)} rows={2} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }} placeholder="Описание персонажа" /></div>
                                <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Референс</label><textarea value={role.reference_text} onChange={(e) => handleRoleChange(index, 'reference_text', e.target.value)} rows={2} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }} placeholder="неопределено" /></div>
                                <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Особые условия</label><textarea value={role.special_conditions} onChange={(e) => handleRoleChange(index, 'special_conditions', e.target.value)} rows={2} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }} placeholder="неопределено" /></div>
                                <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Требования к пробам</label><textarea value={role.audition_requirements} onChange={(e) => handleRoleChange(index, 'audition_requirements', e.target.value)} rows={2} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }} placeholder="неопределено" /></div>
                                <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Текст проб</label><textarea value={role.audition_text} onChange={(e) => handleRoleChange(index, 'audition_text', e.target.value)} rows={3} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }} placeholder="неопределено" /></div>
                                <div><label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Заметки</label><textarea value={role.notes} onChange={(e) => handleRoleChange(index, 'notes', e.target.value)} rows={2} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }} placeholder="неопределено" /></div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                    <button type="button" onClick={handleModalClose} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}>Отмена</button>
                    <button type="submit" style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white' }}>Создать проект</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            zIndex: 1000000, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
          onClick={handleCancelDelete}
        >
          <div 
            style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              padding: '28px', 
              maxWidth: '440px', 
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              animation: 'slideIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                backgroundColor: '#fee2e2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px', color: '#111827' }}>
                  Удалить запрос?
                </h3>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  Это действие нельзя отменить
                </p>
              </div>
            </div>
            
            <p style={{ color: '#4b5563', marginBottom: '24px', fontSize: '15px', lineHeight: '1.5' }}>
              Вы уверены, что хотите удалить этот запрос? Все связанные данные будут безвозвратно удалены из системы.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={handleCancelDelete} 
                style={{ 
                  padding: '10px 20px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  backgroundColor: 'white', 
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              >
                Отмена
              </button>
              <button 
                onClick={handleConfirmDelete} 
                style={{ 
                  padding: '10px 20px', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  backgroundColor: '#dc2626', 
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Удалить запрос
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestsTable;
