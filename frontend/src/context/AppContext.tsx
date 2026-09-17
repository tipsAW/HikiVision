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
  semana: string;
  diaSemana: string;
}

interface AppContextType {
  state: AppState;
  setFileId: (id: string | null) => void;
  setFilters: (filters: Partial<AppState>) => void;
  clearFilters: () => void;
}

export const getDefaultDateRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${day}`
  };
};

const defaultDates = getDefaultDateRange();

const initialState: AppState = {
  fileId: null,
  startDate: defaultDates.startDate,
  endDate: defaultDates.endDate,
  startTime: '12:00',
  endTime: '15:00',
  empleado: '',
  area: '',
  semana: 'todas',
  diaSemana: 'todos'
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
    const dates = getDefaultDateRange();
    setState(prev => ({ 
      ...prev, 
      startDate: dates.startDate, 
      endDate: dates.endDate, 
      startTime: '12:00', 
      endTime: '15:00', 
      empleado: '', 
      area: '',
      semana: 'todas',
      diaSemana: 'todos'
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
