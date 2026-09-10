import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AppState {
  fileId: string | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  empleado: string;
  area: string;
}

interface AppContextType {
  state: AppState;
  setFileId: (id: string | null) => void;
  setFilters: (filters: Partial<AppState>) => void;
  clearFilters: () => void;
}

const initialState: AppState = {
  fileId: null,
  startDate: '',
  endDate: '',
  startTime: '12:00',
  endTime: '15:00',
  empleado: '',
  area: ''
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);

  const setFileId = (id: string | null) => {
    setState(prev => ({ ...prev, fileId: id }));
  };

  const setFilters = (filters: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...filters }));
  };

  const clearFilters = () => {
    setState(prev => ({ 
      ...prev, 
      startDate: '', 
      endDate: '', 
      startTime: '12:00', 
      endTime: '15:00', 
      empleado: '', 
      area: '' 
    }));
  };

  return (
    <AppContext.Provider value={{ state, setFileId, setFilters, clearFilters }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
