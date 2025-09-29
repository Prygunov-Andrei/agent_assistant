import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <div className="app-container">
      {/* Навигационная панель */}
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="logo">
            Agent Assistant
          </Link>
          
          <div className="nav-links">
            {isAuthenticated ? (
              <>
                <Link
                  to="/artists"
                  className={`nav-link ${location.pathname === '/artists' ? 'active' : ''}`}
                >
                  Артисты
                </Link>
                <Link
                  to="/projects"
                  className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`}
                >
                  Проекты
                </Link>
                <Link
                  to="/companies"
                  className={`nav-link ${location.pathname === '/companies' ? 'active' : ''}`}
                >
                  Компании
                </Link>
                <Link
                  to="/telegram-requests"
                  className={`nav-link ${location.pathname === '/telegram-requests' ? 'active' : ''}`}
                >
                  Заявки
                </Link>
                
                <UserProfile user={user} onLogout={logout} />
              </>
            ) : (
              <Link to="/login" className="btn btn-primary">
                Войти
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
