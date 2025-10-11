import React from 'react';

interface PersonAvatarProps {
  photo?: string | null;
  fullName: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PersonAvatar: React.FC<PersonAvatarProps> = ({ 
  photo, 
  fullName,
  size = 'md'
}) => {
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  const sizeMap = {
    sm: { width: '2rem', height: '2rem', fontSize: '0.75rem' },
    md: { width: '3rem', height: '3rem', fontSize: '0.875rem' },
    lg: { width: '5rem', height: '5rem', fontSize: '1.5rem' }
  };
  
  const dimensions = sizeMap[size];
  
  if (photo) {
    return (
      <div className="artist-photo" style={{ width: dimensions.width, height: dimensions.height }}>
        <img 
          src={photo} 
          alt={fullName}
          className="artist-photo-img"
        />
      </div>
    );
  }
  
  return (
    <div className="artist-photo" style={{ width: dimensions.width, height: dimensions.height }}>
      <div className="artist-photo-placeholder" style={{ fontSize: dimensions.fontSize }}>
        {getInitials(fullName)}
      </div>
    </div>
  );
};
