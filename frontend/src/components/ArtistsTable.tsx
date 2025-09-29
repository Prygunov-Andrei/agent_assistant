import * as React from 'react';
import { useState, useEffect } from 'react';
import { artistsService } from '../services/artists';
import LoadingSpinner from './LoadingSpinner';
import type { ArtistListItem, ArtistSkillListItem, ImageErrorEvent } from '../types';

const ArtistsTable: React.FC = () => {
  const [artists, setArtists] = useState<ArtistListItem[]>([]);
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

  const formatSkills = (skills: ArtistSkillListItem[]): JSX.Element => {
    if (skills.length === 0) return <span>Нет навыков</span>;
    
    // Группируем навыки по группам
    const groupedSkills: { [key: string]: ArtistSkillListItem[] } = {};
    skills.forEach(skill => {
      if (!groupedSkills[skill.skill_group]) {
        groupedSkills[skill.skill_group] = [];
      }
      groupedSkills[skill.skill_group].push(skill);
    });
    
    // Формируем JSX элементы для каждой группы
    return (
      <div className="artist-skills-list">
        {Object.entries(groupedSkills).map(([group, groupSkills], index) => (
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

  if (loading) {
    return <LoadingSpinner text="Загрузка артистов..." />;
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
    <div className="fade-in">
      <div className="mb-6 flex justify-end">
        <button className="btn btn-primary">
          Добавить артиста
        </button>
      </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="artists-table">
              <tbody>
              {artists.map((artist) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ArtistsTable;
