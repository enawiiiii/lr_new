import { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  employee: string;
  context: 'boutique' | 'online' | null;
  setEmployee: (employee: string) => void;
  setContext: (context: 'boutique' | 'online') => void;
  reset: () => void;
}

const StoreContext = createContext<AppState | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<string>('');
  const [context, setContext] = useState<'boutique' | 'online' | null>(null);

  const reset = () => {
    setEmployee('');
    setContext(null);
  };

  const value = {
    employee,
    context,
    setEmployee,
    setContext,
    reset
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}