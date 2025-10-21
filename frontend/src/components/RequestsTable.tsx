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
import ContactsMergeModal from './ContactsMergeModal';
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
  const [analysisData, setAnalysisData] = useState<any>(null); // Данные от LLM для проверки контактов
  const [roles, setRoles] = useState<any[]>([]);
  
  // Состояния для модального окна удаления
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<number | null>(null);
  
  // Состояния для персон команды проекта
  const [castingDirector, setCastingDirector] = useState<any>(null);
  const [director, setDirector] = useState<any>(null);
  const [producer, setProducer] = useState<any>(null);
  const [productionCompany, setProductionCompany] = useState<any>(null);
  
  // Данные от LLM для отображения в UI (что нашел LLM в запросе)
  const [llmContactsData, setLlmContactsData] = useState<{
    casting_director: any;
    director: any;
    producer: any;
    production_company: any;
  }>({
    casting_director: null,
    director: null,
    producer: null,
    production_company: null
  });
  
  // Права использования (для рекламы)
  const [usageRightsParsed, setUsageRightsParsed] = useState<any>(null);
  
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
  
  // Состояние для модалки объединения контактов
  const [contactsMergeModal, setContactsMergeModal] = useState<{
    isOpen: boolean;
    person: any;
    oldContacts: { phone?: string | null; email?: string | null; telegram?: string | null };
    newContacts: { phone?: string; email?: string; telegram?: string };
    differentContacts: string[];
  }>({
    isOpen: false,
    person: null,
    oldContacts: {},
    newContacts: {},
    differentContacts: []
  });

  // Состояние для модалки создания персоны/компании/типа/жанра
  const [createEntityModal, setCreateEntityModal] = useState<{
    isOpen: boolean;
    type: 'casting_director' | 'director' | 'producer' | 'company' | 'project_type' | 'genre' | null;
    formData: {
      first_name: string;
      last_name: string;
      middle_name: string;
      phone: string;
      email: string;
      telegram: string;
      // Для компании / типа проекта / жанра
      name: string;
      website: string;
      description: string;
    };
  }>({
    isOpen: false,
    type: null,
    formData: {
      first_name: '',
      last_name: '',
      middle_name: '',
      phone: '',
      email: '',
      telegram: '',
      name: '',
      website: '',
      description: ''
    }
  });
  
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
    setAnalysisData(null); // Сбрасываем данные LLM анализа
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
      const analysisResult = await LLMService.analyzeRequest(request.id, false);
      
      // Сохраняем данные анализа для проверки контактов
      setAnalysisData(analysisResult);
      
      console.log('Analysis Data Full:', JSON.stringify(analysisResult, null, 2));
      
      // Извлекаем права использования для рекламы
      if (analysisResult.project_analysis.usage_rights_parsed) {
        console.log('📜 Права из LLM:', analysisResult.project_analysis.usage_rights_parsed);
        setUsageRightsParsed(analysisResult.project_analysis.usage_rights_parsed);
      }
      
      // Предзаполняем форму данными из анализа
      if (analysisResult.project_analysis) {
        const pa = analysisResult.project_analysis;
        
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
      
      // Предзаполняем контакты (сохраняем полные данные от LLM для проверки позже)
      if ((analysisResult as any).contacts) {
        const contacts = (analysisResult as any).contacts;
        
        // Сохраняем полные данные от LLM для отображения в UI
        setLlmContactsData({
          casting_director: contacts.casting_director || null,
          director: contacts.director || null,
          producer: contacts.producers?.[0] || null,
          production_company: contacts.production_company || null
        });
        
        if (contacts.casting_director && contacts.casting_director.name && contacts.casting_director.name !== 'Не определен') {
          setCastingDirector({ 
            id: null, 
            name: contacts.casting_director.name, 
            match: 0,
            // Сохраняем контакты от LLM для последующего сравнения
            llm_phone: contacts.casting_director.phone,
            llm_email: contacts.casting_director.email,
            llm_telegram: contacts.casting_director.telegram
          });
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
    setUsageRightsParsed(null);
    setLlmContactsData({
      casting_director: null,
      director: null,
      producer: null,
      production_company: null
    });
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

  // Загрузка последних персон по типу (для пустых полей)
  const loadRecentPersons = async (type: 'casting_director' | 'director' | 'producer' | 'company') => {
    try {
      let results: any[] = [];
      
      if (type === 'company') {
        // Загружаем все компании и берем последние 10
        const response = await companiesService.getCompanies();
        // Проверяем формат ответа - может быть массив или объект с results
        const allCompanies = Array.isArray(response) ? response : (response as any).results || [];
        const recentCompanies = allCompanies.slice(0, 10);
        
        results = recentCompanies.map((company: any) => ({
          id: company.id,
          name: company.name,
          phone: company.phone,
          email: company.email,
          website: company.website,
          match: 0.5
        }));
        
        setCompanySearch(results);
        setShowCompanyDropdown(true);
      } else {
        // Загружаем последних персон по типу через расширенный поиск
        const response = await peopleService.getByTypeWithPagination(type, { page: 1, page_size: 10, sort: '-created_at' });
        const people = response.results || [];
        
        results = people.map((person: any) => ({
          // Базовые поля
          id: person.id,
          name: person.full_name || `${person.first_name} ${person.last_name}`,
          full_name: person.full_name,
          first_name: person.first_name,
          last_name: person.last_name,
          middle_name: person.middle_name,
          // Новые поля для множественных контактов
          phones: person.phones,
          emails: person.emails,
          telegram_usernames: person.telegram_usernames,
          // Основные контакты (первые из массивов)
          primary_phone: person.primary_phone,
          primary_email: person.primary_email,
          primary_telegram: person.primary_telegram,
          // Старые поля для обратной совместимости
          phone: person.phone,
          email: person.email,
          telegram: person.telegram_username,
          telegram_username: person.telegram_username,
          match: 0.5
        }));
        
        if (type === 'casting_director') { setCastingDirectorSearch(results); setShowCastingDirectorDropdown(true); }
        else if (type === 'director') { setDirectorSearch(results); setShowDirectorDropdown(true); }
        else if (type === 'producer') { setProducerSearch(results); setShowProducerDropdown(true); }
      }
    } catch (error) {
      console.error(`Ошибка загрузки последних ${type}:`, error);
      ErrorHandler.logError(error, `RequestsTable.loadRecentPersons.${type}`);
    }
  };

  const searchPerson = async (query: string, type: 'casting_director' | 'director' | 'producer' | 'company') => {
    if (!query.trim()) {
      // Если запрос пустой, загружаем последние персоны
      await loadRecentPersons(type);
      return;
    }
    
    try {
      let results: any[] = [];
      
      if (type === 'company') {
        // Поиск компаний через fuzzy matching API
        console.log('Searching companies with query:', query);
        const searchResults = await companiesService.searchCompaniesByName(query);
        
        results = searchResults.map((company: any) => ({
          id: company.id,
          name: company.name,
          phone: company.phone,
          email: company.email,
          website: company.website,
          match: company.match || 0.7
        }));
        
        console.log('Found companies:', results);
        setCompanySearch(results);
        setShowCompanyDropdown(true);
      } else {
        // Получаем данные от LLM для этого типа
        let llmData: any = null;
        if (type === 'casting_director') llmData = llmContactsData.casting_director;
        else if (type === 'director') llmData = llmContactsData.director;
        else if (type === 'producer') llmData = llmContactsData.producer;
        
        // ПРИОРИТЕТ 1: Поиск по контактам от LLM (если есть)
        let contactResults: any[] = [];
        if (llmData) {
          console.log('🔍 Поиск по контактам LLM:', llmData);
          
          // Поиск по телефону
          if (llmData.phone) {
            try {
              const phoneResults = await peopleService.searchByContact({
                contact_type: 'phone',
                contact_value: llmData.phone,
                person_type: type
              });
              
              const mappedPhoneResults = phoneResults.map((p: any) => ({
                id: p.id,
                name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
                full_name: p.full_name,
                first_name: p.first_name,
                last_name: p.last_name,
                middle_name: p.middle_name,
                phones: p.phones,
                emails: p.emails,
                telegram_usernames: p.telegram_usernames,
                primary_phone: p.primary_phone,
                primary_email: p.primary_email,
                primary_telegram: p.primary_telegram,
                phone: p.phone,
                email: p.email,
                telegram: p.telegram_username,
                telegram_username: p.telegram_username,
                match_reason: 'phone',
                matched_value: llmData.phone,
                match: 1.0
              }));
              
              contactResults = [...contactResults, ...mappedPhoneResults];
            } catch (err) {
              console.log('Поиск по телефону не дал результатов');
            }
          }
          
          // Поиск по email
          if (llmData.email) {
            try {
              const emailResults = await peopleService.searchByContact({
                contact_type: 'email',
                contact_value: llmData.email,
                person_type: type
              });
              
              const mappedEmailResults = emailResults.map((p: any) => ({
                id: p.id,
                name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
                full_name: p.full_name,
                first_name: p.first_name,
                last_name: p.last_name,
                middle_name: p.middle_name,
                phones: p.phones,
                emails: p.emails,
                telegram_usernames: p.telegram_usernames,
                primary_phone: p.primary_phone,
                primary_email: p.primary_email,
                primary_telegram: p.primary_telegram,
                phone: p.phone,
                email: p.email,
                telegram: p.telegram_username,
                telegram_username: p.telegram_username,
                match_reason: 'email',
                matched_value: llmData.email,
                match: 1.0
              }));
              
              contactResults = [...contactResults, ...mappedEmailResults];
            } catch (err) {
              console.log('Поиск по email не дал результатов');
            }
          }
          
          // Поиск по telegram
          if (llmData.telegram) {
            try {
              console.log('🔍 Ищем по ТГ:', llmData.telegram);
              const tgResults = await peopleService.searchByContact({
                contact_type: 'telegram',
                contact_value: llmData.telegram,
                person_type: type
              });
              console.log('📱 Результаты поиска по ТГ:', tgResults);
              
              // Мапим результаты в правильный формат
              const mappedTgResults = tgResults.map((p: any) => ({
                id: p.id,
                name: p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
                full_name: p.full_name,
                first_name: p.first_name,
                last_name: p.last_name,
                middle_name: p.middle_name,
                phones: p.phones,
                emails: p.emails,
                telegram_usernames: p.telegram_usernames,
                primary_phone: p.primary_phone,
                primary_email: p.primary_email,
                primary_telegram: p.primary_telegram,
                phone: p.phone,
                email: p.email,
                telegram: p.telegram_username,
                telegram_username: p.telegram_username,
                match_reason: 'telegram',
                matched_value: llmData.telegram,
                match: 1.0
              }));
              
              console.log('✅ Замапили результаты по ТГ:', mappedTgResults);
              contactResults = [...contactResults, ...mappedTgResults];
            } catch (err) {
              console.log('❌ Поиск по telegram не дал результатов:', err);
            }
          }
          
          // Убираем дубликаты по ID
          const uniqueContactResults = contactResults.reduce((acc: any[], curr: any) => {
            if (!acc.find(p => p.id === curr.id)) {
              acc.push(curr);
            }
            return acc;
          }, []);
          
          console.log('✅ Найдено по контактам:', uniqueContactResults.length);
          contactResults = uniqueContactResults;
        }
        
        // ПРИОРИТЕТ 2: Поиск по имени
        console.log('🔍 Поиск по имени:', query, 'type:', type);
        const people = await peopleService.searchPersonsByName({ name: query, person_type: type, limit: 10 });
        
        const nameResults = people.map((person: any) => ({
          // Базовые поля
          id: person.id,
          name: person.full_name || `${person.first_name} ${person.last_name}`,
          full_name: person.full_name,
          first_name: person.first_name,
          last_name: person.last_name,
          middle_name: person.middle_name,
          // Новые поля для множественных контактов
          phones: person.phones,
          emails: person.emails,
          telegram_usernames: person.telegram_usernames,
          // Основные контакты (первые из массивов)
          primary_phone: person.primary_phone,
          primary_email: person.primary_email,
          primary_telegram: person.primary_telegram,
          // Старые поля для обратной совместимости
          phone: person.phone,
          email: person.email,
          telegram: person.telegram_username,
          telegram_username: person.telegram_username,
          match: person.score || 0.5, // Ниже чем у контактов
          match_reason: 'name'
        }));
        
        // Объединяем результаты: сначала по контактам (match=1.0), потом по имени (match=0.5-0.7)
        // Убираем дубликаты
        const allResults = [...contactResults];
        nameResults.forEach((nameResult: any) => {
          if (!allResults.find(r => r.id === nameResult.id)) {
            allResults.push(nameResult);
          }
        });
        
        // Сортируем по match (сначала лучшие совпадения)
        results = allResults.sort((a, b) => (b.match || 0) - (a.match || 0));
        
        console.log('✅ Итого найдено персон:', results.length, 'из них по контактам:', contactResults.length);
        console.log('📋 Финальный список для отображения:', results.map(r => ({ id: r.id, name: r.name, match: r.match, match_reason: r.match_reason })));
        
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
    // Проверка контактов только для кастинг-директоров
    if (type === 'casting_director' && castingDirector) {
      // Логируем данные персоны из API
      console.log('🔍 Person from API:', {
        name: person.full_name,
        primary_phone: person.primary_phone,
        primary_email: person.primary_email,
        primary_telegram: person.primary_telegram,
        phones: person.phones,
        emails: person.emails,
        telegram_usernames: person.telegram_usernames
      });
      
      // Получаем контакты от LLM (сохраненные ранее в castingDirector)
      const newContacts = {
        phone: castingDirector.llm_phone && castingDirector.llm_phone !== 'Не определен' && castingDirector.llm_phone !== 'null' ? castingDirector.llm_phone : undefined,
        email: castingDirector.llm_email && castingDirector.llm_email !== 'Не определен' && castingDirector.llm_email !== 'null' ? castingDirector.llm_email : undefined,
        telegram: castingDirector.llm_telegram && castingDirector.llm_telegram !== 'Не определен' && castingDirector.llm_telegram !== 'null' ? castingDirector.llm_telegram : undefined
      };
      
      console.log('🔍 LLM contacts:', newContacts);
      
      // Проверяем какие контакты отличаются
      const differentContacts: string[] = [];
      
      if (newContacts.phone && person.primary_phone !== newContacts.phone) {
        console.log('❌ Phone different:', person.primary_phone, '!=', newContacts.phone);
        differentContacts.push('phone');
      }
      if (newContacts.email && person.primary_email !== newContacts.email) {
        console.log('❌ Email different:', person.primary_email, '!=', newContacts.email);
        differentContacts.push('email');
      }
      
      // Для telegram нормализуем - убираем @ с обеих сторон перед сравнением
      const normalizedPersonTelegram = person.primary_telegram?.trim().replace(/^@/, '') || '';
      const normalizedNewTelegram = newContacts.telegram?.trim().replace(/^@/, '') || '';
      
      if (newContacts.telegram && normalizedPersonTelegram !== normalizedNewTelegram) {
        console.log('❌ Telegram different:', person.primary_telegram, '!=', newContacts.telegram, '(normalized:', normalizedPersonTelegram, '!=', normalizedNewTelegram, ')');
        differentContacts.push('telegram');
      }
      
      console.log('📊 Different contacts:', differentContacts);
      
      // Если есть хотя бы один новый контакт - показываем модалку
      if (differentContacts.length > 0) {
        setContactsMergeModal({
          isOpen: true,
          person,
          oldContacts: {
            phone: person.primary_phone,
            email: person.primary_email,
            telegram: person.primary_telegram
          },
          newContacts,
          differentContacts
        });
        setShowCastingDirectorDropdown(false);
        return; // Не выбираем персону сразу, ждем решения пользователя
      }
    }
    
    // Обычный выбор персоны (если нет новых контактов или не КД)
    if (type === 'casting_director') { setCastingDirector(person); setShowCastingDirectorDropdown(false); }
    else if (type === 'director') { setDirector(person); setShowDirectorDropdown(false); }
    else if (type === 'producer') { setProducer(person); setShowProducerDropdown(false); }
    else { setProductionCompany(person); setShowCompanyDropdown(false); }
    setHasUnsavedChanges(true);
  };

  // Обработчик модалки объединения контактов
  const handleContactsMerge = async (action: 'add' | 'replace') => {
    try {
      const { person, newContacts } = contactsMergeModal;
      
      console.log('🔧 Обновление контактов:', { person, newContacts, action });
      console.log('🔧 castingDirector ДО обновления:', castingDirector);
      
      // Вызываем API для обновления контактов
      const updatedPerson = await peopleService.mergeContacts(person.id, action, newContacts);
      
      console.log('✅ Обновленная персона с бэка:', updatedPerson);
      
      // Устанавливаем обновленную персону как КД
      // Важно: сохраняем llm_* поля из текущего castingDirector для возможности повторного обновления
      // И добавляем поле name для отображения в инпуте
      const newCastingDirector = {
        ...updatedPerson,
        name: updatedPerson.full_name, // Добавляем name для отображения в инпуте
        llm_phone: castingDirector?.llm_phone,
        llm_email: castingDirector?.llm_email,
        llm_telegram: castingDirector?.llm_telegram
      };
      
      console.log('🔧 Устанавливаем нового КД:', newCastingDirector);
      
      setCastingDirector(newCastingDirector);
      setHasUnsavedChanges(true);
      
      // Закрываем модалку
      setContactsMergeModal({
        isOpen: false,
        person: null,
        oldContacts: {},
        newContacts: {},
        differentContacts: []
      });
      
      console.log(`✅ Контакты ${action === 'add' ? 'добавлены' : 'перезаписаны'} для ${updatedPerson.full_name}`);
    } catch (error) {
      console.error('Ошибка при обновлении контактов:', error);
      ErrorHandler.logError(error, 'RequestsTable.handleContactsMerge');
      alert('Ошибка при обновлении контактов. Попробуйте еще раз.');
    }
  };
  
  const setUndefined = (type: 'casting_director' | 'director' | 'producer' | 'company' | 'project_type' | 'genre') => {
    // Устанавливаем специальное значение для "не определено"
    const undefinedValue = { id: -1, name: 'Не определено', match: 1 };
    
    if (type === 'casting_director') { setCastingDirector(undefinedValue); setShowCastingDirectorDropdown(false); }
    else if (type === 'director') { setDirector(undefinedValue); setShowDirectorDropdown(false); }
    else if (type === 'producer') { setProducer(undefinedValue); setShowProducerDropdown(false); }
    else if (type === 'company') { setProductionCompany(undefinedValue); setShowCompanyDropdown(false); }
    else if (type === 'project_type') { 
      setProjectType(undefinedValue); 
      setFormData(prev => ({ ...prev, project_type: -1 }));
      setShowProjectTypeDropdown(false); 
    }
    else if (type === 'genre') { 
      setGenre(undefinedValue); 
      setFormData(prev => ({ ...prev, genre: -1 }));
      setShowGenreDropdown(false); 
    }
    setHasUnsavedChanges(true);
  };

  const createNewPerson = (type: 'casting_director' | 'director' | 'producer' | 'company') => {
    // Закрываем dropdown
    if (type === 'casting_director') setShowCastingDirectorDropdown(false);
    else if (type === 'director') setShowDirectorDropdown(false);
    else if (type === 'producer') setShowProducerDropdown(false);
    else setShowCompanyDropdown(false);

    // Извлекаем данные от LLM если есть
    let llmData: any = null;
    
    if (type === 'company') {
      llmData = analysisData?.contacts?.production_company;
    } else if (type === 'casting_director') {
      llmData = analysisData?.contacts?.casting_director;
    } else if (type === 'director') {
      llmData = analysisData?.contacts?.director;
    } else if (type === 'producer') {
      llmData = analysisData?.contacts?.producers?.[0];
    }

    // Предзаполняем форму данными от LLM если есть
    const initialFormData = {
      first_name: '',
      last_name: '',
      middle_name: '',
      phone: '',
      email: '',
      telegram: '',
      name: '',
      website: '',
      description: ''
    };

    if (llmData && type === 'company') {
      if (llmData.name && llmData.name !== 'Не определен') initialFormData.name = llmData.name;
      if (llmData.phone && llmData.phone !== 'Не определен') initialFormData.phone = llmData.phone;
      if (llmData.email && llmData.email !== 'Не определен') initialFormData.email = llmData.email;
      if (llmData.website && llmData.website !== 'Не определен') initialFormData.website = llmData.website;
    } else if (llmData && llmData.name && llmData.name !== 'Не определен') {
      // Разбираем ФИО для персоны
      const nameParts = llmData.name.trim().split(/\s+/);
      initialFormData.last_name = nameParts[0] || '';
      initialFormData.first_name = nameParts[1] || '';
      initialFormData.middle_name = nameParts.length > 2 ? nameParts[2] : '';
      
      if (llmData.phone && llmData.phone !== 'Не определен') initialFormData.phone = llmData.phone;
      if (llmData.email && llmData.email !== 'Не определен') initialFormData.email = llmData.email;
      if (llmData.telegram && llmData.telegram !== 'Не определен') initialFormData.telegram = llmData.telegram;
    }

    // Открываем модалку создания
    setCreateEntityModal({
      isOpen: true,
      type,
      formData: initialFormData
    });
  };

  const handleCreateEntity = async () => {
    try {
      const { type, formData } = createEntityModal;
      
      if (!type) return;

      if (type === 'project_type') {
        // Создание типа проекта
        if (!formData.name.trim()) {
          alert('Укажите название типа проекта');
          return;
        }

        const newProjectType = await projectsService.createProjectType({
          name: formData.name,
          description: formData.description || undefined
        });

        // Автоматически выбираем созданный тип
        setProjectType(newProjectType);
        setFormData(prev => ({ ...prev, project_type: newProjectType.id }));
        setHasUnsavedChanges(true);

        // Обновляем список типов
        const updatedTypes = await projectsService.getProjectTypes();
        setProjectTypesList(updatedTypes);

      } else if (type === 'genre') {
        // Создание жанра
        if (!formData.name.trim()) {
          alert('Укажите название жанра');
          return;
        }

        const newGenre = await projectsService.createGenre({
          name: formData.name,
          description: formData.description || undefined
        });

        // Автоматически выбираем созданный жанр
        setGenre(newGenre);
        setFormData(prev => ({ ...prev, genre: newGenre.id }));
        setHasUnsavedChanges(true);

        // Обновляем список жанров
        const updatedGenres = await projectsService.getGenres();
        setGenresList(updatedGenres);

      } else if (type === 'company') {
        // Создание кинокомпании
        if (!formData.name.trim()) {
          alert('Укажите название кинокомпании');
          return;
        }

        // Создаем новую компанию без проверки дубликатов
        // (это быстрое создание, дубликаты можно объединить позже)
        const newCompany = await companiesService.createCompany({
          name: formData.name,
          company_type: 'production',
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          website: formData.website || undefined
        });

        // Автоматически выбираем созданную компанию
        setProductionCompany(newCompany);
        setHasUnsavedChanges(true);

      } else {
        // Создание персоны
        if (!formData.last_name.trim()) {
          alert('Укажите фамилию');
          return;
        }

        // Подготавливаем массивы контактов
        const phones = formData.phone.trim() ? [formData.phone.trim()] : [];
        const emails = formData.email.trim() ? [formData.email.trim()] : [];
        const telegram_usernames = formData.telegram.trim() ? [formData.telegram.trim()] : [];

        // Создаем новую персону без проверки дубликатов
        // (это быстрое создание, дубликаты можно объединить позже)
        const newPerson = await peopleService.createPerson({
          person_type: type as 'casting_director' | 'director' | 'producer',
          first_name: formData.first_name.trim() || undefined,
          last_name: formData.last_name.trim(),
          middle_name: formData.middle_name.trim() || undefined,
          phones,
          emails,
          telegram_usernames
        });

        // Автоматически выбираем созданную персону
        const personWithName = {
          ...newPerson,
          name: newPerson.full_name
        };

        if (type === 'casting_director') setCastingDirector(personWithName);
        else if (type === 'director') setDirector(personWithName);
        else if (type === 'producer') setProducer(personWithName);
        
        setHasUnsavedChanges(true);
      }

      // Закрываем модалку
      setCreateEntityModal({
        isOpen: false,
        type: null,
        formData: {
          first_name: '',
          last_name: '',
          middle_name: '',
          phone: '',
          email: '',
          telegram: '',
          name: '',
          website: '',
          description: ''
        }
      });

    } catch (error) {
      console.error('Ошибка при создании:', error);
      ErrorHandler.logError(error, 'RequestsTable.handleCreateEntity');
      alert(`Ошибка при создании записи: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
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
    
    // Требуется только название проекта
    if (!formData.title.trim()) { 
      alert('Пожалуйста, введите название проекта'); 
      return; 
    }
    
    // Если есть роли - проверяем что они заполнены
    if (roles.length > 0) {
      const incompleteRoles = roles.filter(role => !role.name?.trim() || !role.description?.trim());
      if (incompleteRoles.length > 0) { 
        alert('Пожалуйста, заполните название и описание для всех добавленных ролей'); 
        return; 
      }
    }
    
    try {
      // Подготовка данных для API
      // НЕ передаем request при создании (OneToOneField может конфликтовать)
      // Обновим связь после создания проекта
      const projectPayload: any = {
        title: formData.title,
        description: formData.description,
        project_type: projectType?.id === -1 ? null : (projectType?.id || null),
        genre: genre?.id === -1 ? null : (genre?.id || null),
        premiere_date: formData.premiere_date || null, // Пустая строка → null
        status: 'in_production',
        casting_director: castingDirector?.id === -1 ? null : (castingDirector?.id || null),
        director: director?.id === -1 ? null : (director?.id || null),
        producers: producer?.id === -1 ? [] : (producer?.id ? [producer.id] : []), // ManyToMany - передаем массив или пустой массив
        production_company: productionCompany?.id === -1 ? null : (productionCompany?.id || null),
        // Права использования - только для рекламы
        usage_rights_parsed: projectType?.name === 'Реклама' ? usageRightsParsed : null
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
          console.log('🔗 Устанавливаем связь проекта', createdProject.id, 'с запросом', selectedRequest.id);
          
          const updateResponse = await projectsService.updateProject(createdProject.id, {
            request: selectedRequest.id
          });
          
          console.log('✅ Связь с запросом установлена');
          console.log('Ответ от API:', updateResponse);
        } catch (patchErr: any) {
          console.error('❌ Ошибка установки связи с запросом:', patchErr);
          console.error('Ответ сервера:', patchErr?.response?.data);
          
          // Если ошибка "уже существует" - игнорируем, иначе логируем
          if (patchErr?.response?.data?.request) {
            console.warn('Запрос уже связан с другим проектом. Создаем проект без связи.');
          } else {
            console.warn('Не удалось установить связь с запросом:', patchErr);
          }
          // Продолжаем создание проекта даже если связь не установилась
        }
      } else {
        console.log('⚠️ selectedRequest.id отсутствует, связь не устанавливается');
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
      
      // Обновляем статус запроса на "Обработан"
      if (selectedRequest) {
        await requestsService.updateRequest(selectedRequest.id, {
          status: 'completed',
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
  const renderRequestRow = (request: RequestListItem, _index: number) => {
    const isCompleted = request.status === 'completed';
    
    return (
      <tr 
        key={request.id} 
        className={`requests-table-row ${!isCompleted ? 'hover:bg-blue-50 cursor-pointer' : 'opacity-60 cursor-not-allowed'} transition-colors duration-200`}
        onClick={() => !isCompleted && handleRowClick(request)}
        style={{ backgroundColor: isCompleted ? '#f9fafb' : 'transparent' }}
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
          {!isCompleted && (
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
          )}
        </div>
      </td>
    </tr>
    );
  };

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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Кастинг-директор</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="text" value={castingDirector?.name || ''} onChange={(e) => { searchPerson(e.target.value, 'casting_director'); setCastingDirector({ id: null, name: e.target.value, match: 0 }); setHasUnsavedChanges(true); }}
                          onFocus={() => { searchPerson(castingDirector?.name || '', 'casting_director'); }}
                          style={{ flex: 1, padding: '8px 12px', border: castingDirector?.id && castingDirector.id > 0 ? '1px solid #10b981' : castingDirector?.id === -1 ? '1px solid #f59e0b' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите имя кастинг-директора" />
                        {castingDirector?.match > 0 && <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: castingDirector.match > 0.8 ? '#dcfce7' : '#fef3c7', color: castingDirector.match > 0.8 ? '#166534' : '#92400e' }}>{Math.round(castingDirector.match * 100)}%</span>}
                      </div>
                      
                      {/* Данные от LLM */}
                      {llmContactsData.casting_director && (llmContactsData.casting_director.name || llmContactsData.casting_director.phone || llmContactsData.casting_director.email || llmContactsData.casting_director.telegram) && (
                        <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '12px', border: '1px solid #fde68a' }}>
                          <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📊 Данные из запроса:
                          </div>
                          {llmContactsData.casting_director.name && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Имя:</strong> {llmContactsData.casting_director.name}
                            </div>
                          )}
                          {llmContactsData.casting_director.phone && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Телефон:</strong> {llmContactsData.casting_director.phone}
                            </div>
                          )}
                          {llmContactsData.casting_director.email && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Email:</strong> {llmContactsData.casting_director.email}
                            </div>
                          )}
                          {llmContactsData.casting_director.telegram && (
                            <div style={{ color: '#78350f' }}>
                              <strong>ТГ:</strong> {llmContactsData.casting_director.telegram}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {showCastingDirectorDropdown && castingDirectorSearch.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                          {castingDirectorSearch.map((person, index) => {
                            const contacts = [person.phone, person.email].filter(Boolean).join(' • ');
                            const hasMatch = person.match_reason && person.matched_value;
                            return (
                              <div key={index} onClick={() => selectPerson(person, 'casting_director')} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: index < castingDirectorSearch.length - 1 ? '1px solid #f3f4f6' : 'none', backgroundColor: hasMatch ? '#f0fdf4' : '#f9fafb' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hasMatch ? '#dcfce7' : '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = hasMatch ? '#f0fdf4' : '#f9fafb'}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{person.name}</div>
                                {hasMatch && (
                                  <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px', fontWeight: '600' }}>
                                    ✓ Совпадение: {person.matched_value}
                                  </div>
                                )}
                                {contacts && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{contacts}</div>}
                                {person.telegram && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{person.telegram}</div>}
                              </div>
                            );
                          })}
                          <div onClick={() => setUndefined('casting_director')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#fef3c7', borderTop: '1px solid #fde68a', color: '#92400e', fontWeight: 'bold', fontSize: '14px' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde68a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}>⊘ Оставить неопределенным</div>
                          <div onClick={() => createNewPerson('casting_director')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>+ Добавить нового кастинг-директора</div>
                        </div>
                      )}
                    </div>

                    {/* Режиссер */}
                    <div style={{ position: 'relative' }} className="dropdown-container">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Режиссер</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="text" value={director?.name || ''} onChange={(e) => { searchPerson(e.target.value, 'director'); setDirector({ id: null, name: e.target.value, match: 0 }); setHasUnsavedChanges(true); }}
                          onFocus={() => { searchPerson(director?.name || '', 'director'); }}
                          style={{ flex: 1, padding: '8px 12px', border: director?.id && director.id > 0 ? '1px solid #10b981' : director?.id === -1 ? '1px solid #f59e0b' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите имя режиссера" />
                        {director?.match > 0 && <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: director.match > 0.8 ? '#dcfce7' : '#fef3c7', color: director.match > 0.8 ? '#166534' : '#92400e' }}>{Math.round(director.match * 100)}%</span>}
                      </div>
                      
                      {/* Данные от LLM */}
                      {llmContactsData.director && (llmContactsData.director.name || llmContactsData.director.phone || llmContactsData.director.email || llmContactsData.director.telegram) && (
                        <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '12px', border: '1px solid #fde68a' }}>
                          <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📊 Данные из запроса:
                          </div>
                          {llmContactsData.director.name && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Имя:</strong> {llmContactsData.director.name}
                            </div>
                          )}
                          {llmContactsData.director.phone && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Телефон:</strong> {llmContactsData.director.phone}
                            </div>
                          )}
                          {llmContactsData.director.email && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Email:</strong> {llmContactsData.director.email}
                            </div>
                          )}
                          {llmContactsData.director.telegram && (
                            <div style={{ color: '#78350f' }}>
                              <strong>ТГ:</strong> {llmContactsData.director.telegram}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {showDirectorDropdown && directorSearch.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                          {directorSearch.map((person, index) => {
                            const contacts = [person.phone, person.email].filter(Boolean).join(' • ');
                            const hasMatch = person.match_reason && person.matched_value;
                            return (
                              <div key={index} onClick={() => selectPerson(person, 'director')} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: index < directorSearch.length - 1 ? '1px solid #f3f4f6' : 'none', backgroundColor: hasMatch ? '#f0fdf4' : '#f9fafb' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hasMatch ? '#dcfce7' : '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = hasMatch ? '#f0fdf4' : '#f9fafb'}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{person.name}</div>
                                {hasMatch && (
                                  <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px', fontWeight: '600' }}>
                                    ✓ Совпадение: {person.matched_value}
                                  </div>
                                )}
                                {contacts && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{contacts}</div>}
                                {person.telegram && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{person.telegram}</div>}
                              </div>
                            );
                          })}
                          <div onClick={() => setUndefined('director')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#fef3c7', borderTop: '1px solid #fde68a', color: '#92400e', fontWeight: 'bold', fontSize: '14px' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde68a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}>⊘ Оставить неопределенным</div>
                          <div onClick={() => createNewPerson('director')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>+ Добавить нового режиссера</div>
                        </div>
                      )}
                    </div>

                    {/* Продюсер */}
                    <div style={{ position: 'relative' }} className="dropdown-container">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Продюсер</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="text" value={producer?.name || ''} onChange={(e) => { searchPerson(e.target.value, 'producer'); setProducer({ id: null, name: e.target.value, match: 0 }); setHasUnsavedChanges(true); }}
                          onFocus={() => { searchPerson(producer?.name || '', 'producer'); }}
                          style={{ flex: 1, padding: '8px 12px', border: producer?.id && producer.id > 0 ? '1px solid #10b981' : producer?.id === -1 ? '1px solid #f59e0b' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите имя продюсера" />
                        {producer?.match > 0 && <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: producer.match > 0.8 ? '#dcfce7' : '#fef3c7', color: producer.match > 0.8 ? '#166534' : '#92400e' }}>{Math.round(producer.match * 100)}%</span>}
                      </div>
                      
                      {/* Данные от LLM */}
                      {llmContactsData.producer && (llmContactsData.producer.name || llmContactsData.producer.phone || llmContactsData.producer.email || llmContactsData.producer.telegram) && (
                        <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '12px', border: '1px solid #fde68a' }}>
                          <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📊 Данные из запроса:
                          </div>
                          {llmContactsData.producer.name && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Имя:</strong> {llmContactsData.producer.name}
                            </div>
                          )}
                          {llmContactsData.producer.phone && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Телефон:</strong> {llmContactsData.producer.phone}
                            </div>
                          )}
                          {llmContactsData.producer.email && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Email:</strong> {llmContactsData.producer.email}
                            </div>
                          )}
                          {llmContactsData.producer.telegram && (
                            <div style={{ color: '#78350f' }}>
                              <strong>ТГ:</strong> {llmContactsData.producer.telegram}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {showProducerDropdown && producerSearch.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                          {producerSearch.map((person, index) => {
                            const contacts = [person.phone, person.email].filter(Boolean).join(' • ');
                            const hasMatch = person.match_reason && person.matched_value;
                            return (
                              <div key={index} onClick={() => selectPerson(person, 'producer')} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: index < producerSearch.length - 1 ? '1px solid #f3f4f6' : 'none', backgroundColor: hasMatch ? '#f0fdf4' : '#f9fafb' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hasMatch ? '#dcfce7' : '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = hasMatch ? '#f0fdf4' : '#f9fafb'}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{person.name}</div>
                                {hasMatch && (
                                  <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px', fontWeight: '600' }}>
                                    ✓ Совпадение: {person.matched_value}
                                  </div>
                                )}
                                {contacts && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{contacts}</div>}
                                {person.telegram && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{person.telegram}</div>}
                              </div>
                            );
                          })}
                          <div onClick={() => setUndefined('producer')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#fef3c7', borderTop: '1px solid #fde68a', color: '#92400e', fontWeight: 'bold', fontSize: '14px' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde68a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}>⊘ Оставить неопределенным</div>
                          <div onClick={() => createNewPerson('producer')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#eff6ff', borderTop: '1px solid #dbeafe', color: '#1d4ed8', fontWeight: 'bold', fontSize: '14px' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}>+ Добавить нового продюсера</div>
                        </div>
                      )}
                    </div>

                    {/* Кинокомпания */}
                    <div style={{ position: 'relative' }} className="dropdown-container">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Кинокомпания</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="text" value={productionCompany?.name || ''} onChange={(e) => { searchPerson(e.target.value, 'company'); setProductionCompany({ id: null, name: e.target.value, match: 0 }); setHasUnsavedChanges(true); }}
                          onFocus={() => { 
                            // Если выбрано "Не определено" - очищаем и загружаем последние
                            if (productionCompany?.id === -1) {
                              setProductionCompany(null);
                              loadRecentPersons('company');
                            } else {
                              searchPerson(productionCompany?.name || '', 'company');
                            }
                          }}
                          style={{ flex: 1, padding: '8px 12px', border: productionCompany?.id && productionCompany.id > 0 ? '1px solid #10b981' : productionCompany?.id === -1 ? '1px solid #f59e0b' : '1px solid #ef4444', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите название кинокомпании" />
                        {productionCompany?.match > 0 && <span style={{ padding: '2px 6px', fontSize: '12px', borderRadius: '4px', backgroundColor: productionCompany.match > 0.8 ? '#dcfce7' : '#fef3c7', color: productionCompany.match > 0.8 ? '#166534' : '#92400e' }}>{Math.round(productionCompany.match * 100)}%</span>}
                      </div>
                      
                      {/* Данные от LLM */}
                      {llmContactsData.production_company && (llmContactsData.production_company.name || llmContactsData.production_company.phone || llmContactsData.production_company.email || llmContactsData.production_company.website) && (
                        <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '12px', border: '1px solid #fde68a' }}>
                          <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            📊 Данные из запроса:
                          </div>
                          {llmContactsData.production_company.name && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Название:</strong> {llmContactsData.production_company.name}
                            </div>
                          )}
                          {llmContactsData.production_company.phone && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Телефон:</strong> {llmContactsData.production_company.phone}
                            </div>
                          )}
                          {llmContactsData.production_company.email && (
                            <div style={{ color: '#78350f', marginBottom: '3px' }}>
                              <strong>Email:</strong> {llmContactsData.production_company.email}
                            </div>
                          )}
                          {llmContactsData.production_company.website && (
                            <div style={{ color: '#78350f' }}>
                              <strong>Сайт:</strong> {llmContactsData.production_company.website}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {showCompanyDropdown && companySearch.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                          {companySearch.map((company, index) => {
                            const contacts = [company.phone, company.email].filter(Boolean).join(' • ');
                            return (
                              <div key={index} onClick={() => selectPerson(company, 'company')} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: index < companySearch.length - 1 ? '1px solid #f3f4f6' : 'none', backgroundColor: '#f9fafb' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{company.name}</div>
                                {contacts && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{contacts}</div>}
                                {company.website && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{company.website}</div>}
                              </div>
                            );
                          })}
                          <div onClick={() => setUndefined('company')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#fef3c7', borderTop: '1px solid #fde68a', color: '#92400e', fontWeight: 'bold', fontSize: '14px' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde68a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}>⊘ Оставить неопределенным</div>
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Тип проекта</label>
                      <input type="text" value={projectType?.name || ''} 
                        onChange={(e) => { setProjectType({ id: null, name: e.target.value }); searchProjectType(e.target.value); setHasUnsavedChanges(true); }}
                        onFocus={() => { 
                          // Показываем dropdown всегда при клике
                          if (projectType?.id === -1) {
                            // Если выбрано "Не определено" - очищаем
                            setProjectType(null);
                          }
                          setShowProjectTypeDropdown(true);
                          if (projectType?.name) searchProjectType(projectType.name);
                        }}
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
                          <div onClick={() => setUndefined('project_type')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#fef3c7', borderTop: '1px solid #fde68a', color: '#92400e', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde68a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}>⊘ Оставить неопределенным</div>
                          <div onClick={() => { 
                            setShowProjectTypeDropdown(false); 
                            setCreateEntityModal({ 
                              isOpen: true, 
                              type: 'project_type', 
                              formData: { 
                                ...createEntityModal.formData, 
                                name: projectType?.name || '', 
                                description: '' 
                              } 
                            }); 
                          }} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#f0fdf4', borderTop: '1px solid #bbf7d0', color: '#15803d', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}>
                            + Создать новый тип проекта
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Жанр - с подбором из справочника */}
                    <div style={{ position: 'relative' }} className="dropdown-container">
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Жанр</label>
                      <input type="text" value={genre?.name || ''} 
                        onChange={(e) => { setGenre({ id: null, name: e.target.value }); searchGenre(e.target.value); setHasUnsavedChanges(true); }}
                        onFocus={() => { 
                          // Показываем dropdown всегда при клике
                          if (genre?.id === -1) {
                            // Если выбрано "Не определено" - очищаем
                            setGenre(null);
                          }
                          setShowGenreDropdown(true);
                          if (genre?.name) searchGenre(genre.name);
                        }}
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
                          <div onClick={() => setUndefined('genre')} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#fef3c7', borderTop: '1px solid #fde68a', color: '#92400e', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde68a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}>⊘ Оставить неопределенным</div>
                          <div onClick={() => { 
                            setShowGenreDropdown(false); 
                            setCreateEntityModal({ 
                              isOpen: true, 
                              type: 'genre', 
                              formData: { 
                                ...createEntityModal.formData, 
                                name: genre?.name || '', 
                                description: '' 
                              } 
                            }); 
                          }} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#f0fdf4', borderTop: '1px solid #bbf7d0', color: '#15803d', fontWeight: 'bold', fontSize: '14px', textAlign: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dcfce7'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0fdf4'}>
                            + Создать новый жанр
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Права использования - показываем только для рекламы */}
                  {projectType?.name === 'Реклама' && (
                    <div style={{ backgroundColor: '#fefce8', padding: '16px', borderRadius: '8px', marginTop: '16px', border: '2px solid #fde047' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#854d0e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📜 Права использования
                      </h3>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>
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
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', resize: 'vertical' }}
                          placeholder="ТВ-ролик, интернет на 2 года, территория РФ"
                        />
                      </div>
                      
                      {/* Распарсенные компоненты (read-only для проверки) */}
                      {usageRightsParsed && (usageRightsParsed.types?.length > 0 || usageRightsParsed.duration || usageRightsParsed.territory) && (
                        <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', fontSize: '13px', border: '1px solid #fde047' }}>
                          <div style={{ fontWeight: 'bold', color: '#854d0e', marginBottom: '8px' }}>
                            Распарсенные данные:
                          </div>
                          {usageRightsParsed.types?.length > 0 && (
                            <div style={{ marginBottom: '4px', color: '#78350f' }}>
                              <strong>Типы:</strong> {usageRightsParsed.types.join(', ')}
                            </div>
                          )}
                          {usageRightsParsed.duration && (
                            <div style={{ marginBottom: '4px', color: '#78350f' }}>
                              <strong>Срок:</strong> {usageRightsParsed.duration}
                            </div>
                          )}
                          {usageRightsParsed.territory && (
                            <div style={{ color: '#78350f' }}>
                              <strong>Территория:</strong> {usageRightsParsed.territory}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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
      
      {/* Модалка объединения контактов */}
      <ContactsMergeModal
        isOpen={contactsMergeModal.isOpen}
        personName={contactsMergeModal.person?.full_name || contactsMergeModal.person?.name || ''}
        oldContacts={contactsMergeModal.oldContacts}
        newContacts={contactsMergeModal.newContacts}
        differentContacts={contactsMergeModal.differentContacts}
        onMerge={handleContactsMerge}
        onCancel={() => {
          // Закрываем модалку без изменений
          setContactsMergeModal({
            isOpen: false,
            person: null,
            oldContacts: {},
            newContacts: {},
            differentContacts: []
          });
        }}
      />

      {/* Модалка создания новой персоны/компании */}
      {createEntityModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              {createEntityModal.type === 'project_type' ? '📁 Создать тип проекта' :
               createEntityModal.type === 'genre' ? '🎭 Создать жанр' :
               createEntityModal.type === 'company' ? '🏢 Создать кинокомпанию' : 
               createEntityModal.type === 'casting_director' ? '👤 Создать кастинг-директора' :
               createEntityModal.type === 'director' ? '🎬 Создать режиссера' : '🎥 Создать продюсера'}
            </h3>

            {createEntityModal.type === 'project_type' || createEntityModal.type === 'genre' ? (
              // Форма для типа проекта или жанра
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Название <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={createEntityModal.formData.name}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, name: e.target.value }
                    }))}
                    placeholder={createEntityModal.type === 'project_type' ? "Например: Сериал" : "Например: Драма"}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Описание
                  </label>
                  <textarea
                    value={createEntityModal.formData.description}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, description: e.target.value }
                    }))}
                    placeholder="Краткое описание"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            ) : createEntityModal.type === 'company' ? (
              // Форма для кинокомпании
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Название компании <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={createEntityModal.formData.name}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, name: e.target.value }
                    }))}
                    placeholder="Например: Мосфильм"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Телефон
                  </label>
                  <input
                    type="text"
                    value={createEntityModal.formData.phone}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, phone: e.target.value }
                    }))}
                    placeholder="+7 (900) 123-45-67"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={createEntityModal.formData.email}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, email: e.target.value }
                    }))}
                    placeholder="info@company.ru"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Сайт
                  </label>
                  <input
                    type="url"
                    value={createEntityModal.formData.website}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, website: e.target.value }
                    }))}
                    placeholder="https://company.ru"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            ) : (
              // Форма для персоны
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Фамилия <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={createEntityModal.formData.last_name}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, last_name: e.target.value }
                    }))}
                    placeholder="Иванов"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Имя
                  </label>
                  <input
                    type="text"
                    value={createEntityModal.formData.first_name}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, first_name: e.target.value }
                    }))}
                    placeholder="Иван"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Отчество
                  </label>
                  <input
                    type="text"
                    value={createEntityModal.formData.middle_name}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, middle_name: e.target.value }
                    }))}
                    placeholder="Иванович"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Телефон
                  </label>
                  <input
                    type="text"
                    value={createEntityModal.formData.phone}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, phone: e.target.value }
                    }))}
                    placeholder="+7 (900) 123-45-67"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={createEntityModal.formData.email}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, email: e.target.value }
                    }))}
                    placeholder="ivan@example.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Telegram
                  </label>
                  <input
                    type="text"
                    value={createEntityModal.formData.telegram}
                    onChange={(e) => setCreateEntityModal(prev => ({
                      ...prev,
                      formData: { ...prev.formData, telegram: e.target.value }
                    }))}
                    placeholder="@username"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div style={{
              marginTop: '24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setCreateEntityModal({
                    isOpen: false,
                    type: null,
                    formData: {
                      first_name: '',
                      last_name: '',
                      middle_name: '',
                      phone: '',
                      email: '',
                      telegram: '',
                      name: '',
                      website: '',
                      description: ''
                    }
                  });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                Отмена
              </button>

              <button
                onClick={handleCreateEntity}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestsTable;
