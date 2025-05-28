import React from 'react';
import { twMerge } from 'tailwind-merge';

interface FormFieldProps {
  id: string;
  label?: string;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField = ({ 
  id, 
  label, 
  error, 
  description, 
  className,
  children 
}: FormFieldProps) => {
  return (
    <div className={twMerge('space-y-2', className)}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      {children}
      {description && !error && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FormField;