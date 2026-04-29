import * as React from 'react';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, className = '', children }) => {
  // Provide context for children
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}
export const TabsList: React.FC<TabsListProps> = ({ className = '', children }) => (
  <div className={`inline-flex ${className}`}>{children}</div>
);

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const TabsContext = React.createContext<{ value: string; onValueChange: (value: string) => void } | undefined>(undefined);

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className = '', children }) => {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');
  const isActive = ctx.value === value;
  return (
    <button
      type="button"
      className={
        `${className} data-[state=active]:bg-algo-accent data-[state=active]:text-algo-dark` +
        (isActive ? ' data-[state=active]' : '')
      }
      aria-selected={isActive}
      onClick={() => ctx.onValueChange(value)}
    >
      {children}
    </button>
  );
}; 