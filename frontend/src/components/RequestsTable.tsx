import * as React from 'react';
import { useState } from 'react';
import { requestsService } from '../services/requests';
import { peopleService } from '../services/people';
import { companiesService } from '../services/companies';
import { projectsService } from '../services/projects';
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
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  
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
  
  // Состояния для свернутых ролей
  const [collapsedRoles, setCollapsedRoles] = useState<Set<number>>(new Set());

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestsService.getRequests();
      setRequests(data);
    } catch (err) {
      ErrorHandler.logError(err, 'RequestsTable.fetchRequests');
      setError('Ошибка загрузки запросов');
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
      const [types, genres] = await Promise.all([
        projectsService.getProjectTypes(),
        projectsService.getGenres()
      ]);
      setProjectTypesList(types);
      setGenresList(genres);
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
    setCastingDirector(null);
    setDirector(null);
    setProducer(null);
    setProductionCompany(null);
    setAnalysisResult(null);
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
    
    // Автоматически запускаем LLM анализ
    await handleAutoAnalysis(request);
  };

  const handleAutoAnalysis = async (request: RequestListItem) => {
    setIsAnalyzing(true);
    try {
      // Вызываем реальный LLM сервис (эмулятор)
      const analysisData = await LLMService.analyzeRequest(request.id);
      
      console.log('Analysis Data Full:', JSON.stringify(analysisData, null, 2));
      
      setAnalysisResult(analysisData);
      
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
          const mappedRoles = pa.roles.map((role: any) => ({
            name: role.character_name || '',
            description: role.description || '',
            role_type: 1, // TODO: конвертировать строку в ID
            media_presence: 'doesnt_matter',
            clothing_size: 'неопределено',
            hairstyle: 'неопределено',
            hair_color: 'неопределено',
            eye_color: 'неопределено',
            height: 'неопределено',
            body_type: 'неопределено',
            reference_text: 'неопределено',
            special_conditions: role.special_requirements?.join(', ') || 'неопределено',
            audition_requirements: 'неопределено',
            audition_text: 'неопределено',
            rate_per_shift: 'неопределено',
            rate_conditions: 'неопределено',
            shooting_dates: 'неопределено',
            shooting_location: 'неопределено',
            notes: 'неопределено',
            skills_required: role.skills_required?.acting_skills || [],
            suggested_artists: role.suggested_artists || []
          }));
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
      console.error('Ошибка LLM анализа:', error);
      ErrorHandler.logError(error, 'RequestsTable.handleAutoAnalysis');
      alert('Ошибка при анализе запроса. Попробуйте еще раз.');
    } finally {
      setIsAnalyzing(false);
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
    setCastingDirector(null);
    setDirector(null);
    setProducer(null);
    setProductionCompany(null);
    setProjectType(null);
    setGenre(null);
    setAnalysisResult(null);
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
      name: '', description: '', role_type: 1, media_presence: 'doesnt_matter',
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
    
    console.log('Создание проекта:', { ...formData, casting_director: castingDirector, director, producer, production_company: productionCompany, roles });
    setShowProjectModal(false);
    setSelectedRequest(null);
    alert('Проект успешно создан!');
    await fetchRequests();
  };

  // Убираем обрезку текста - показываем полный текст
  const displayText = (text: string) => {
    return text;
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
        <div className="text-center text-gray-500 text-sm">
          Кликните для создания проекта
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div className="card overflow-hidden">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Запросы КД</h2>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Запросы КД
        </h2>
        <p className="text-gray-600 mb-6">
          Пока нет запросов для обработки.
        </p>
      </div>
    );
  }

  return (
    <>
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div className="card overflow-hidden">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Запросы КД</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="requests-table">
              <thead>
                <tr>
                  <th className="requests-table-header">Дата</th>
                  <th className="requests-table-header">Автор</th>
                  <th className="requests-table-header">Текст запроса</th>
                  <th className="requests-table-header">Медиа</th>
                  <th className="requests-table-header">Статус</th>
                </tr>
              </thead>
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
                {isAnalyzing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#dbeafe', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#1e40af' }}>
                    <div style={{ width: '12px', height: '12px', border: '2px solid #1e40af', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Анализируем запрос...
                  </div>
                )}
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
                <div style={{ marginBottom: '12px' }}><strong>Текст:</strong></div>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #d1d5db', maxHeight: '200px', overflow: 'auto', fontSize: '14px', lineHeight: '1.4' }}>{selectedRequest.text}</div>
                
                {/* Media Section */}
                {((selectedRequest.images && selectedRequest.images.length > 0) || (selectedRequest.files && selectedRequest.files.length > 0)) && (
                  <div style={{ marginTop: '16px' }}>
                    <strong>Медиа:</strong>
                    <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #d1d5db', marginTop: '8px' }}>
                      {selectedRequest.images && selectedRequest.images.length > 0 && (
                        <div style={{ marginBottom: selectedRequest.files && selectedRequest.files.length > 0 ? '12px' : '0' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Изображения ({selectedRequest.images.length})</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px' }}>
                            {selectedRequest.images.map((image: any, index: number) => (
                              <img key={index} src={image.image} alt={`Изображение ${index + 1}`} 
                                style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
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
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Название роли *</label>
                                  <input type="text" value={role.name} onChange={(e) => handleRoleChange(index, 'name', e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }} placeholder="Введите название роли" />
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
                              <div style={{ marginBottom: '16px' }}>
                                <h6 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#374151' }}>Внешность</h6>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Рост</label><input type="text" value={role.height} onChange={(e) => handleRoleChange(index, 'height', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Телосложение</label><input type="text" value={role.body_type} onChange={(e) => handleRoleChange(index, 'body_type', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Цвет волос</label><input type="text" value={role.hair_color} onChange={(e) => handleRoleChange(index, 'hair_color', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Цвет глаз</label><input type="text" value={role.eye_color} onChange={(e) => handleRoleChange(index, 'eye_color', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Прическа</label><input type="text" value={role.hairstyle} onChange={(e) => handleRoleChange(index, 'hairstyle', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
                                  <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px', color: '#6b7280' }}>Размер одежды</label><input type="text" value={role.clothing_size} onChange={(e) => handleRoleChange(index, 'clothing_size', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }} placeholder="неопределено" /></div>
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
    </>
  );
};

export default RequestsTable;
