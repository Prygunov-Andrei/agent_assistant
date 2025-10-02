import { useState, useCallback } from 'react';

interface UseModalState {
  isOpen: boolean;
  data: any;
}

/**
 * Хук для управления модальными окнами
 * Устраняет дублирование логики show/hide в компонентах
 */
export function useModal<T = any>() {
  const [state, setState] = useState<UseModalState>({
    isOpen: false,
    data: null,
  });

  const open = useCallback((data?: T) => {
    setState({ isOpen: true, data: data || null });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, data: null });
  }, []);

  const toggle = useCallback((data?: T) => {
    setState(prev => ({
      isOpen: !prev.isOpen,
      data: prev.isOpen ? null : (data || null),
    }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
  };
}

/**
 * Хук для управления несколькими модальными окнами
 */
export function useMultipleModals() {
  const [modals, setModals] = useState<Record<string, UseModalState>>({});

  const openModal = useCallback((modalName: string, data?: any) => {
    setModals(prev => ({
      ...prev,
      [modalName]: { isOpen: true, data: data || null },
    }));
  }, []);

  const closeModal = useCallback((modalName: string) => {
    setModals(prev => ({
      ...prev,
      [modalName]: { isOpen: false, data: null },
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals({});
  }, []);

  const isModalOpen = useCallback((modalName: string) => {
    return modals[modalName]?.isOpen || false;
  }, [modals]);

  const getModalData = useCallback((modalName: string) => {
    return modals[modalName]?.data || null;
  }, [modals]);

  return {
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalData,
  };
}
