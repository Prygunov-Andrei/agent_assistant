import * as React from 'react';
import { useState, useEffect } from 'react';
import { artistsService } from '../services/artists';
// import LoadingSpinner from './LoadingSpinner'; // Не используется
import VirtualizedList from './common/VirtualizedList';
import { TableSkeleton } from './common/SkeletonLoader';
import AnimatedContainer from './common/AnimatedContainer';
import Tooltip from './common/Tooltip';
import type { Artist, ArtistSkill } from '../types/artists';

// Определяем тип для обработки ошибок изображений
interface ImageErrorEvent {
  currentTarget: HTMLImageElement;
}

const ArtistsTable: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const data = await artistsService.getArtists();
        setArtists(data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка загрузки артистов');
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const handleImageError = (e: ImageErrorEvent) => {
    e.currentTarget.style.display = 'none';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const formatSkills = (skills: ArtistSkill[]): React.JSX.Element => {
    if (skills.length === 0) return <span>Нет навыков</span>;
    
    // Группируем навыки по группам
    const groupedSkills: { [key: string]: ArtistSkill[] } = {};
    skills.forEach(skill => {
      if (!groupedSkills[skill.skill_group]) {
        groupedSkills[skill.skill_group] = [];
      }
      groupedSkills[skill.skill_group].push(skill);
    });
    
    // Формируем JSX элементы для каждой группы
    return (
      <div className="artist-skills-list">
        {Object.entries(groupedSkills).map(([group, groupSkills]) => (
          <div key={group} className="artist-skill-group">
            <span className="artist-skill-group-name">{group}:</span>
            <span className="artist-skill-names">
              {groupSkills.map(skill => skill.name).join(', ')}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Компонент для рендеринга строки артиста
  const renderArtistRow = (artist: Artist, _index: number) => (
    <tr key={artist.id} className="artists-table-row">
      <td className="artists-table-cell">
        <div className="artist-photo">
          {artist.main_photo ? (
            <img
              src={artist.main_photo}
              alt={`${artist.last_name} ${artist.first_name}`}
              className="artist-photo-img"
              onError={handleImageError}
            />
          ) : (
            <div className="artist-photo-placeholder">
              {getInitials(artist.first_name, artist.last_name)}
            </div>
          )}
        </div>
      </td>
      <td className="artists-table-cell">
        <div className="artist-name">
          <div className="artist-name-main">
            {`${artist.last_name} ${artist.first_name}`}
          </div>
        </div>
      </td>
      <td className="artists-table-cell">
        {artist.age ? `${artist.age} лет` : 'Не указан'}
      </td>
      <td className="artists-table-cell">
        <div className="artist-skills">
          {formatSkills(artist.skills)}
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <AnimatedContainer animation="fadeIn" className="fade-in">
        <div className="card overflow-hidden">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Артисты</h2>
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
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (artists.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">
          <h3 className="text-lg font-semibold">Артисты не найдены</h3>
          <p>У вас пока нет добавленных артистов</p>
        </div>
        <button className="btn btn-primary">
          Добавить первого артиста
        </button>
      </div>
    );
  }

  return (
    <AnimatedContainer animation="fadeIn" className="fade-in">
      <div className="mb-6 flex justify-end">
        <Tooltip content="Добавить нового артиста в базу данных">
          <button className="btn btn-primary">
            Добавить артиста
          </button>
        </Tooltip>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Артисты</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="artists-table">
            <thead>
              <tr>
                <th className="artists-table-header">Фото</th>
                <th className="artists-table-header">Имя</th>
                <th className="artists-table-header">Возраст</th>
                <th className="artists-table-header">Навыки</th>
              </tr>
            </thead>
            <tbody>
              {artists.length > 30 ? (
                <VirtualizedList
                  items={artists}
                  itemHeight={80}
                  containerHeight={500}
                  renderItem={renderArtistRow}
                />
              ) : (
                artists.map((artist) => renderArtistRow(artist, artists.indexOf(artist)))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AnimatedContainer>
  );
};

export default ArtistsTable;
