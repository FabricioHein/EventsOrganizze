import { useState, useEffect } from 'react';

export const useFormValidation = () => {
  const [showValidation, setShowValidation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const triggerValidation = (errors: Record<string, any>) => {
    setShowValidation(true);
    
    // Convert react-hook-form errors to simple object
    const errorMessages: Record<string, string> = {};
    Object.keys(errors).forEach(key => {
      if (errors[key]?.message) {
        errorMessages[key] = errors[key].message;
      }
    });
    
    setValidationErrors(errorMessages);

    // Auto-hide validation after 10 seconds
    setTimeout(() => {
      setShowValidation(false);
      setValidationErrors({});
    }, 10000);
  };

  const clearValidation = () => {
    setShowValidation(false);
    setValidationErrors({});
  };

  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    if (showValidation && validationErrors[fieldName]) {
      return `${baseClassName} border-red-500 ring-2 ring-red-200 bg-red-50`;
    }
    return baseClassName;
  };

  return {
    showValidation,
    validationErrors,
    triggerValidation,
    clearValidation,
    getFieldClassName,
  };
};