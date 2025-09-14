import { useState, useEffect, createContext, useContext, ReactNode, createElement } from "react";
import type { Employee, StoreType } from "@/types";

interface StoreContextType {
  currentEmployee: Employee | null;
  currentStore: StoreType | null;
  setCurrentEmployee: (employee: Employee | null) => void;
  setCurrentStore: (store: StoreType | null) => void;
  logout: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider(props: StoreProviderProps): JSX.Element {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [currentStore, setCurrentStore] = useState<StoreType | null>(null);

  useEffect(() => {
    const savedEmployee = localStorage.getItem('laroza_current_employee');
    const savedStore = localStorage.getItem('laroza_current_store');
    
    if (savedEmployee) {
      try {
        setCurrentEmployee(JSON.parse(savedEmployee));
      } catch (e) {
        console.error('Failed to parse saved employee data');
      }
    }
    
    if (savedStore) {
      setCurrentStore(savedStore as StoreType);
    }
  }, []);

  useEffect(() => {
    if (currentEmployee) {
      localStorage.setItem('laroza_current_employee', JSON.stringify(currentEmployee));
    } else {
      localStorage.removeItem('laroza_current_employee');
    }
  }, [currentEmployee]);

  useEffect(() => {
    if (currentStore) {
      localStorage.setItem('laroza_current_store', currentStore);
    } else {
      localStorage.removeItem('laroza_current_store');
    }
  }, [currentStore]);

  const logout = (): void => {
    setCurrentEmployee(null);
    setCurrentStore(null);
    localStorage.removeItem('laroza_current_employee');
    localStorage.removeItem('laroza_current_store');
  };

  const contextValue: StoreContextType = {
    currentEmployee,
    currentStore,
    setCurrentEmployee,
    setCurrentStore,
    logout,
  };

  return createElement(StoreContext.Provider, { value: contextValue }, props.children);
}