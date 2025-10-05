import React, { useState, useEffect, useCallback } from 'react';
import type { Artist, ArtistSearchParams } from '../../../types/artists';
import { artistsService } from '../../../services/artists';
import VirtualizedList from '../../common/VirtualizedList';
import { ListSkeleton } from '../../common/SkeletonLoader';
import AnimatedContainer from '../../common/AnimatedContainer';
import Tooltip from '../../common/Tooltip';
import { useDebouncedSearch } from '../../../hooks/useLazyLoading';

interface ArtistSelectionComponentProps {
  selectedArtists: number[];
  onSelectionChange: (artistIds: number[]) => void;
  placeholder?: string;
  maxSelections?: number;
  className?: string;
}

interface ArtistCardProps {
  artist: Artist;
  isSelected: boolean;
  onToggle: (artistId: number) => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, isSelected, onToggle }) => {
  const handleToggle = () => {
    onToggle(artist.id);
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
      onClick={handleToggle}
    >
      <div className="flex items-start space-x-3">
        {/* Фото артиста */}
        <div className="flex-shrink-0">
          {artist.main_photo ? (
            <img
              src={artist.main_photo}
              alt={artist.full_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">
                {artist.first_name[0]}{artist.last_name[0]}
              </span>
            </div>
          )}
        </div>

        {/* Информация об артисте */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {artist.stage_name || artist.full_name}
            </h3>
            {isSelected && (
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          <div className="mt-1 text-sm text-gray-600">
            <p>{artist.gender_display}, {artist.age ? `${artist.age} лет` : 'Возраст не указан'}</p>
            {artist.city && <p>📍 {artist.city}</p>}
            {artist.height && <p>📏 {artist.height} см</p>}
          </div>

          {/* Навыки */}
          {artist.skills && artist.skills.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {artist.skills.slice(0, 3).map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                  >
                    {skill.name}
                  </span>
                ))}
                {artist.skills.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                    +{artist.skills.length - 3} еще
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Статус */}
          <div className="mt-2 flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                artist.availability_status
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {artist.availability_status_display}
            </span>
            {artist.media_presence && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Медийный
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ArtistSelectionComponent: React.FC<ArtistSelectionComponentProps> = ({
  selectedArtists,
  onSelectionChange,
  placeholder = "Выберите артистов...",
  maxSelections,
  className = ""
}) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<ArtistSearchParams>({
    limit: 50
  });

  // Debounced search hook
  const searchFunction = useCallback(async (searchQuery: string) => {
    const params = {
      ...searchParams,
      search: searchQuery || undefined
    };
    return await artistsService.getArtistsForSelection(params);
  }, [searchParams]);

  const { query, setQuery, results, loading: searchLoading } = useDebouncedSearch<Artist>(
    searchFunction,
    300
  );

  // Загрузка артистов при инициализации
  useEffect(() => {
    const loadInitialArtists = async () => {
      setLoading(true);
      try {
        const data = await artistsService.getArtistsForSelection(searchParams);
        setArtists(data);
      } catch (error) {
        console.error('Ошибка загрузки артистов:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialArtists();
  }, []);

  // Обновляем список артистов при изменении результатов поиска
  useEffect(() => {
    if (query.trim() && results.length > 0) {
      setArtists(results);
    }
  }, [results, query]);

  // Обработка выбора артиста
  const handleToggleArtist = (artistId: number) => {
    if (selectedArtists.includes(artistId)) {
      // Убираем из выбранных
      onSelectionChange(selectedArtists.filter(id => id !== artistId));
    } else {
      // Добавляем к выбранным, если не превышен лимит
      if (!maxSelections || selectedArtists.length < maxSelections) {
        onSelectionChange([...selectedArtists, artistId]);
      }
    }
  };

  // Фильтрация по полу
  const handleGenderFilter = async (gender: 'male' | 'female' | '') => {
    const newParams = {
      ...searchParams,
      gender: gender || undefined
    };
    setSearchParams(newParams);
    setLoading(true);
    try {
      const data = await artistsService.getArtistsForSelection(newParams);
      setArtists(data);
    } catch (error) {
      console.error('Ошибка фильтрации по полу:', error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация по статусу доступности
  const handleAvailabilityFilter = async (status: boolean | null) => {
    const newParams = {
      ...searchParams,
      availability_status: status === null ? undefined : status
    };
    setSearchParams(newParams);
    setLoading(true);
    try {
      const data = await artistsService.getArtistsForSelection(newParams);
      setArtists(data);
    } catch (error) {
      console.error('Ошибка фильтрации по статусу:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedContainer animation="fadeIn" className={`space-y-4 ${className}`}>
      {/* Поиск и фильтры */}
      <div className="space-y-3">
        {/* Поисковая строка */}
        <div className="relative">
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {(loading || searchLoading) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap gap-2">
          <Tooltip content="Фильтровать артистов по полу">
            <select
              value={searchParams.gender || ''}
              onChange={(e) => handleGenderFilter(e.target.value as 'male' | 'female' | '')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Все полы</option>
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
          </Tooltip>

          <Tooltip content="Фильтровать артистов по статусу доступности">
            <select
              value={searchParams.availability_status === undefined ? '' : searchParams.availability_status.toString()}
              onChange={(e) => {
                const value = e.target.value;
                handleAvailabilityFilter(value === '' ? null : value === 'true');
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Все статусы</option>
              <option value="true">Доступен</option>
              <option value="false">Не доступен</option>
            </select>
          </Tooltip>
        </div>
      </div>

      {/* Информация о выборе */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Выбрано: {selectedArtists.length}
          {maxSelections && ` из ${maxSelections}`}
        </span>
        {artists.length > 0 && (
          <span>Найдено: {artists.length}</span>
        )}
      </div>

      {/* Список артистов */}
      <div className="max-h-96 overflow-hidden">
        {loading ? (
          <ListSkeleton count={5} showAvatar={true} />
        ) : artists.length > 0 ? (
          artists.length > 20 ? (
            <VirtualizedList
              items={artists}
              itemHeight={140}
              containerHeight={384}
              renderItem={(artist: Artist) => (
                <div className="mb-2">
                  <ArtistCard
                    artist={artist}
                    isSelected={selectedArtists.includes(artist.id)}
                    onToggle={handleToggleArtist}
                  />
                </div>
              )}
            />
          ) : (
            <div className="space-y-2">
              {artists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  isSelected={selectedArtists.includes(artist.id)}
                  onToggle={handleToggleArtist}
                />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Артисты не найдены</p>
            <p className="text-sm">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>

      {/* Выбранные артисты */}
      {selectedArtists.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Выбранные артисты:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedArtists.map((artistId) => {
              const artist = artists.find(a => a.id === artistId);
              return artist ? (
                <span
                  key={artistId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {artist.stage_name || artist.full_name}
                  <button
                    onClick={() => handleToggleArtist(artistId)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </AnimatedContainer>
  );
};

export default ArtistSelectionComponent;
