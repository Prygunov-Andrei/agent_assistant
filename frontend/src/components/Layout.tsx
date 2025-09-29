import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [isPersonsMenuOpen, setIsPersonsMenuOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Навигационная панель */}
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="logo">
            <img 
              src="/logo.png" 
              alt="Agent Assistant" 
              className="logo-image"
            />
          </Link>
          
          <div className="nav-links">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                  title="Запросы от кастинг-директоров"
                >
                  Запросы
                </Link>
                <Link
                  to="/projects"
                  className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`}
                >
                  Проекты
                </Link>
                <Link
                  to="/artists"
                  className={`nav-link ${location.pathname === '/artists' ? 'active' : ''}`}
                >
                  Артисты
                </Link>
                <Link
                  to="/casting-directors"
                  className={`nav-link ${location.pathname === '/casting-directors' ? 'active' : ''}`}
                  title="Кастинг-директора"
                >
                  КД
                </Link>
                
                {/* Выпадающее меню Персоны */}
                <div className="nav-dropdown">
                  <button
                    className={`nav-link nav-dropdown-toggle ${location.pathname.startsWith('/persons') ? 'active' : ''}`}
                    onMouseEnter={() => setIsPersonsMenuOpen(true)}
                    onMouseLeave={() => setIsPersonsMenuOpen(false)}
                  >
                    Персоны
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {isPersonsMenuOpen && (
                    <div 
                      className="nav-dropdown-menu"
                      onMouseEnter={() => setIsPersonsMenuOpen(true)}
                      onMouseLeave={() => setIsPersonsMenuOpen(false)}
                    >
                      <Link
                        to="/persons/producers"
                        className={`nav-dropdown-link ${location.pathname === '/persons/producers' ? 'active' : ''}`}
                      >
                        Продюсеры
                      </Link>
                      <Link
                        to="/persons/directors"
                        className={`nav-dropdown-link ${location.pathname === '/persons/directors' ? 'active' : ''}`}
                      >
                        Режиссеры
                      </Link>
                      <Link
                        to="/persons/companies"
                        className={`nav-dropdown-link ${location.pathname === '/persons/companies' ? 'active' : ''}`}
                      >
                        Кинокомпании
                      </Link>
                      <Link
                        to="/persons/agents"
                        className={`nav-dropdown-link ${location.pathname === '/persons/agents' ? 'active' : ''}`}
                      >
                        Агенты
                      </Link>
                    </div>
                  )}
                </div>
                
                <Link
                  to="/settings"
                  className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
                >
                  Настройки
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
