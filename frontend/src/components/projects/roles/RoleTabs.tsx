import React, { useState } from 'react';
import type { ProjectRoleForm } from '../../../types/projects';

interface RoleTabsProps {
  roles: ProjectRoleForm[];
  onRoleChange?: (index: number, role: ProjectRoleForm) => void;
  onRoleAdd: () => void;
  onRoleRemove: (index: number) => void;
  onRoleEdit: (index: number) => void;
  editingRoleIndex?: number;
  onEditCancel: () => void;
  onEditSave: (index: number, role: ProjectRoleForm) => void;
}

export const RoleTabs: React.FC<RoleTabsProps> = ({
  roles,
  onRoleChange: _onRoleChange,
  onRoleAdd,
  onRoleRemove,
  onRoleEdit,
  editingRoleIndex,
  onEditCancel,
  onEditSave,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: number) => {
    if (editingRoleIndex === null || editingRoleIndex === undefined) {
      setActiveTab(index);
    }
  };

  const handleEditRole = (index: number) => {
    onRoleEdit(index);
    setActiveTab(index);
  };

  const handleSaveRole = (role: ProjectRoleForm) => {
    if (editingRoleIndex !== null && editingRoleIndex !== undefined) {
      onEditSave(editingRoleIndex, role);
    }
  };

  const handleCancelEdit = () => {
    onEditCancel();
  };

  const handleAddRole = () => {
    onRoleAdd();
    setActiveTab(roles.length); // Переключаемся на новую роль
  };

  const handleRemoveRole = (index: number) => {
    onRoleRemove(index);
    if (activeTab >= index && activeTab > 0) {
      setActiveTab(activeTab - 1);
    } else if (activeTab >= roles.length - 1) {
      setActiveTab(Math.max(0, roles.length - 2));
    }
  };

  if (roles.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500 mb-4">Роли в проекте не добавлены</p>
        <button
          onClick={handleAddRole}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Добавить первую роль
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Вкладки */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {roles.map((role, index) => (
            <div
              key={index}
              className={`flex items-center px-4 py-3 border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === index
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleTabClick(index)}
            >
              <span className="text-sm font-medium">
                {role.name || `Роль ${index + 1}`}
              </span>
              {editingRoleIndex === index && (
                <span className="ml-2 text-xs text-orange-600">(редактирование)</span>
              )}
            </div>
          ))}
          
          {/* Кнопка добавления роли */}
          <button
            onClick={handleAddRole}
            className="flex items-center px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b-2 border-transparent"
            title="Добавить роль"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Содержимое вкладки */}
      <div className="p-4">
        {editingRoleIndex === activeTab ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">Редактирование роли</h4>
              <div className="flex space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleSaveRole(roles[activeTab])}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Сохранить
                </button>
              </div>
            </div>
            
            {/* Здесь будет форма редактирования роли */}
            <div className="text-sm text-gray-500">
              Форма редактирования роли будет здесь
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">
                {roles[activeTab]?.name || `Роль ${activeTab + 1}`}
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditRole(activeTab)}
                  className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleRemoveRole(activeTab)}
                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                >
                  Удалить
                </button>
              </div>
            </div>

            {/* Отображение информации о роли */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <p className="text-sm text-gray-900">
                  {roles[activeTab]?.description || 'Не указано'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Медийность
                </label>
                <p className="text-sm text-gray-900">
                  {roles[activeTab]?.media_presence === 'yes' ? 'Да' :
                   roles[activeTab]?.media_presence === 'no' ? 'Нет' : 'Неважно'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Размер одежды
                </label>
                <p className="text-sm text-gray-900">
                  {roles[activeTab]?.clothing_size || 'Не указано'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Рост
                </label>
                <p className="text-sm text-gray-900">
                  {roles[activeTab]?.height || 'Не указано'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Требуемые навыки
                </label>
                <p className="text-sm text-gray-900">
                  {(() => {
                    const currentRole = roles[activeTab];
                    if (currentRole && currentRole.skills_required && currentRole.skills_required.length > 0) {
                      return currentRole.skills_required.join(', ');
                    }
                    return 'Не указано';
                  })()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Предложенные артисты
                </label>
                <p className="text-sm text-gray-900">
                  {(() => {
                    const currentRole = roles[activeTab];
                    if (currentRole && currentRole.suggested_artists && currentRole.suggested_artists.length > 0) {
                      return `${currentRole.suggested_artists.length} артистов`;
                    }
                    return 'Не выбрано';
                  })()}
                </p>
              </div>
            </div>

            {/* Дополнительная информация */}
            {(roles[activeTab]?.special_conditions || roles[activeTab]?.audition_requirements || roles[activeTab]?.notes) && (
              <div className="space-y-3">
                {roles[activeTab]?.special_conditions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Особые условия
                    </label>
                    <p className="text-sm text-gray-900">
                      {roles[activeTab].special_conditions}
                    </p>
                  </div>
                )}

                {roles[activeTab]?.audition_requirements && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Требования к пробам
                    </label>
                    <p className="text-sm text-gray-900">
                      {roles[activeTab].audition_requirements}
                    </p>
                  </div>
                )}

                {roles[activeTab]?.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Заметки
                    </label>
                    <p className="text-sm text-gray-900">
                      {roles[activeTab].notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
