import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Artists from './pages/Artists';
import Requests from './pages/Requests';
import Login from './pages/Login';
import TestPersonMatching from './pages/TestPersonMatching';
import ProjectCreationPage from './pages/ProjectCreationPage';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Компонент для защищенных маршрутов
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Компонент для публичных маршрутов (только для неавторизованных)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
        {/* Публичные маршруты */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Защищенные маршруты */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Requests />
              </Layout>
            </ProtectedRoute>
          }
        />

               {/* Основные страницы */}
               <Route
                 path="/projects"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <div className="text-center py-12">
                         <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
                         <p className="text-gray-600 mt-2">Страница в разработке</p>
                       </div>
                     </Layout>
                   </ProtectedRoute>
                 }
               />

               <Route
                 path="/artists"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <Artists />
                     </Layout>
                   </ProtectedRoute>
                 }
               />

               <Route
                 path="/casting-directors"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <div className="text-center py-12">
                         <h1 className="text-2xl font-bold text-gray-900">Кастинг-директора</h1>
                         <p className="text-gray-600 mt-2">Страница в разработке</p>
                       </div>
                     </Layout>
                   </ProtectedRoute>
                 }
               />

               {/* Персоны - выпадающее меню */}
               <Route
                 path="/persons/producers"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <div className="text-center py-12">
                         <h1 className="text-2xl font-bold text-gray-900">Продюсеры</h1>
                         <p className="text-gray-600 mt-2">Страница в разработке</p>
                       </div>
                     </Layout>
                   </ProtectedRoute>
                 }
               />

               <Route
                 path="/persons/directors"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <div className="text-center py-12">
                         <h1 className="text-2xl font-bold text-gray-900">Режиссеры</h1>
                         <p className="text-gray-600 mt-2">Страница в разработке</p>
                       </div>
                     </Layout>
                   </ProtectedRoute>
                 }
               />

               <Route
                 path="/persons/companies"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <div className="text-center py-12">
                         <h1 className="text-2xl font-bold text-gray-900">Кинокомпании</h1>
                         <p className="text-gray-600 mt-2">Страница в разработке</p>
                       </div>
                     </Layout>
                   </ProtectedRoute>
                 }
               />

               <Route
                 path="/persons/agents"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <div className="text-center py-12">
                         <h1 className="text-2xl font-bold text-gray-900">Агенты</h1>
                         <p className="text-gray-600 mt-2">Страница в разработке</p>
                       </div>
                     </Layout>
                   </ProtectedRoute>
                 }
               />

               <Route
                 path="/settings"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <div className="text-center py-12">
                         <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
                         <p className="text-gray-600 mt-2">Страница в разработке</p>
                       </div>
                     </Layout>
                   </ProtectedRoute>
                 }
               />

               {/* Тестовая страница для поиска персон */}
               <Route
                 path="/test-person-matching"
                 element={
                   <ProtectedRoute>
                     <Layout>
                       <TestPersonMatching />
                     </Layout>
                   </ProtectedRoute>
                 }
               />

               {/* Страница создания проекта в новом окне */}
               <Route
                 path="/project-creation"
                 element={
                   <ProtectedRoute>
                     <ProjectCreationPage />
                   </ProtectedRoute>
                 }
               />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;