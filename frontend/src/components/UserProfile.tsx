import * as React from 'react';
import type { UserProfileProps, ImageErrorEvent } from '../types';

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const handleImageError = (e: ImageErrorEvent) => {
    e.currentTarget.style.display = 'none';
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`.trim();
    }
    return user?.full_name || user?.username || 'Пользователь';
  };

  const getInitial = () => {
    return user?.first_name?.[0] || user?.username?.[0] || 'А';
  };

  const shouldShowUsername = () => {
    return user?.username && user?.username !== user?.full_name;
  };

  return (
    <div className="user-profile">
      {/* Фото пользователя */}
      {user?.photo ? (
        <img
          src={user.photo}
          alt="Фото пользователя"
          className="user-profile-avatar"
          onError={handleImageError}
        />
      ) : (
        <div className="user-profile-avatar user-profile-avatar-placeholder">
          {getInitial()}
        </div>
      )}
      
      {/* Информация о пользователе */}
      <div className="user-profile-info">
        <span className="user-profile-name">
          {getDisplayName()}
        </span>
        {shouldShowUsername() && (
          <span className="user-profile-username">
            @{user?.username}
          </span>
        )}
      </div>
      
      {/* Кнопка выхода */}
      <button
        onClick={onLogout}
        className="btn btn-secondary user-profile-logout"
        title="Выйти из системы"
      >
        Выйти
      </button>
    </div>
  );
};

export default UserProfile;
