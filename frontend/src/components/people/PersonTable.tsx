import React, { useState, useEffect } from 'react';
import type { Person, PersonSearchParams } from '../../types/people';
import { PersonAvatar } from './PersonAvatar';
import { PersonContacts } from './PersonContacts';
import { PersonProjects } from './PersonProjects';
import { peopleService } from '../../services/people';
import { PersonSearchBar } from './PersonSearchBar';
import { PersonModal } from './PersonModal';
import ProjectFormModal from '../projects/ProjectFormModal';
import { projectsService } from '../../services/projects';
import { ErrorHandler } from '../../utils/errorHandler';
import AnimatedContainer from '../common/AnimatedContainer';
import { TableSkeleton } from '../common/SkeletonLoader';
import VirtualizedList from '../common/VirtualizedList';

interface PersonTableProps {
  personType: 'director' | 'producer' | 'casting_director';
}

export const PersonTable: React.FC<PersonTableProps> = ({ personType }) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<number | undefined>();
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  
  // Состояния для модального окна проекта
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);
  
  // Текущие параметры поиска
  const [searchParams, setSearchParamsState] = useState<PersonSearchParams>({
    person_type: personType,
    sort: '-created_at'
  });
  
  useEffect(() => {
    loadPeople(searchParams);
  }, [personType, currentPage]);
  
  const loadPeople = async (newSearchParams?: PersonSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const params = newSearchParams || searchParams;
      console.log('PersonTable.loadPeople с параметрами:', params);
      
      const response = await peopleService.searchWithPagination({
        ...params,
        person_type: personType,
        page: currentPage,
        page_size: pageSize
      });
      
      console.log('PersonTable.loadPeople результат:', response.count, 'записей');
      setPeople(response.results);
      setTotalCount(response.count);
      setTotalPages(Math.ceil(response.count / pageSize));
      setSearchParamsState(params);
    } catch (err) {
      ErrorHandler.logError(err, 'PersonTable.loadPeople');
      setError('Ошибка загрузки персон');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (params: PersonSearchParams) => {
    console.log('PersonTable.handleSearch вызван с:', params);
    setCurrentPage(1);
    loadPeople(params);
  };
  
  const handleRowClick = (person: Person) => {
    setSelectedPersonId(person.id);
    setModalMode('view');
    setModalOpen(true);
  };
  
  const handleCreateNew = () => {
    setSelectedPersonId(undefined);
    setModalMode('create');
    setModalOpen(true);
  };
  
  const handleModalSuccess = (person: Person | null) => {
    console.log('PersonTable.handleModalSuccess вызван', person ? `для персоны ${person.id}` : 'для удаления');
    // После успешного создания/обновления/удаления - перезагружаем с текущими параметрами
    setCurrentPage(1); // Возвращаемся на первую страницу
    loadPeople(searchParams); // Используем текущие параметры поиска
  };
  
  const getPersonTypeLabel = () => {
    const labels = {
      director: 'Режиссера',
      producer: 'Продюсера',
      casting_director: 'Кастинг-директора'
    };
    return labels[personType];
  };
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleProjectClick = async (projectId: number) => {
    try {
      const projectDetails = await projectsService.getProject(projectId);
      setSelectedProject(projectDetails);
      setShowProjectModal(true);
    } catch (err) {
      ErrorHandler.logError(err, 'PersonTable.handleProjectClick');
      alert('Ошибка загрузки проекта');
    }
  };
  
  const renderPersonRow = (person: Person, _index: number) => (
    <tr 
      key={person.id} 
      className="requests-table-row"
      style={{ cursor: 'pointer' }}
      onClick={() => handleRowClick(person)}
    >
      <td className="requests-table-cell">
        <PersonAvatar 
          photo={person.photo}
          fullName={person.full_name}
          size="md"
        />
      </td>
      <td className="requests-table-cell">
        <div className="artist-name">
          <div className="artist-name-main">{person.full_name}</div>
          {person.nationality && (
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              {person.nationality}
            </div>
          )}
        </div>
      </td>
      <td className="requests-table-cell">
        <PersonContacts
          phone={person.phone}
          email={person.email}
          telegram={person.telegram_username}
        />
      </td>
      <td className="requests-table-cell" onClick={(e) => e.stopPropagation()}>
        <PersonProjects 
          projects={person.recent_projects || []} 
          onProjectClick={handleProjectClick}
          totalCount={person.projects_count}
          showCount={true}
        />
      </td>
    </tr>
  );
  
  if (loading && people.length === 0) {
    return (
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div className="card">
          <div style={{ padding: '16px' }}>
            <TableSkeleton rows={8} columns={4} />
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
        <button onClick={() => loadPeople()} className="btn btn-primary">
          Попробовать снова
        </button>
      </div>
    );
  }
  
  return (
    <>
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div style={{ marginBottom: '20px' }}>
          {/* Заголовок и кнопка создания */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button
              onClick={handleCreateNew}
              className="btn btn-primary"
            >
              + Создать {getPersonTypeLabel()}
            </button>
            
            {totalCount > 0 && (
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Всего: {totalCount}
              </div>
            )}
          </div>
          
          {/* Поиск и сортировка */}
          <PersonSearchBar
            personType={personType}
            onSearch={handleSearch}
          />
        </div>
        
        {people.length === 0 ? (
          <div className="text-center py-12">
            <div className="card" style={{ padding: '48px 16px' }}>
              <p className="text-gray-600 mb-6">Нет данных</p>
              <button
                onClick={handleCreateNew}
                className="btn btn-primary"
              >
                Создать первую запись
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="requests-table">
                  <tbody>
                    {people.length > 50 ? (
                      <VirtualizedList
                        items={people}
                        itemHeight={120}
                        containerHeight={600}
                        renderItem={renderPersonRow}
                      />
                    ) : (
                      people.map((person) => renderPersonRow(person, people.indexOf(person)))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Пагинация */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                  style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ← Назад
                </button>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2
                      );
                    })
                    .map((page, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && page - prevPage > 1;
                      
                      return (
                        <React.Fragment key={page}>
                          {showEllipsis && (
                            <span style={{ padding: '0 8px', color: '#6b7280' }}>...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={page === currentPage ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ 
                              minWidth: '40px',
                              backgroundColor: page === currentPage ? '#3182ce' : undefined,
                              color: page === currentPage ? 'white' : undefined
                            }}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary"
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Вперед →
                </button>
              </div>
            )}
          </>
        )}
      </AnimatedContainer>
      
      {/* Модальное окно персоны */}
      <PersonModal
        key={`person-modal-${selectedPersonId}-${modalOpen}`}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        personId={selectedPersonId}
        personType={personType}
        mode={modalMode}
        onSuccess={handleModalSuccess}
      />
      
      {/* Модальное окно проекта */}
      <ProjectFormModal
        mode="view"
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        projectData={selectedProject}
      />
    </>
  );
};
