// components/Alert.tsx
import React from 'react';

interface AlertProps {
  variant?: 'default' | 'destructive';
  className?: string;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'default', className, children }) => {
  const baseStyles = 'p-4 rounded-md mb-4';
  const variantStyles = variant === 'destructive' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className={`${baseStyles} ${variantStyles} ${className}`}>
      {children}
    </div>
  );
};

export const AlertTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h3 className="font-semibold">{children}</h3>;
};

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <p className="mt-1">{children}</p>;
};