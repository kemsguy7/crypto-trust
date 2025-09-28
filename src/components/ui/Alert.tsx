import React from 'react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'info' | 'success' | 'danger';
  title?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, icon, onClose, children, ...props }, ref) => {
    const variantClasses = {
      default: 'border-gray-200 bg-white text-gray-900 shadow-sm',
      info: 'border-gray-200 bg-gray-50 text-gray-900',
      success: 'border-green-200 bg-green-50 text-green-900',
      danger: 'border-red-200 bg-red-50 text-red-900'
    };

    const defaultIcons = {
      default: (
        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      info: (
        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      success: (
        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      danger: (
        <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };

    const displayIcon = icon || defaultIcons[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-xl border p-4 transition-all duration-200',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="flex">
          {displayIcon && (
            <div className="flex-shrink-0">
              {displayIcon}
            </div>
          )}
          <div className={cn('flex-1', displayIcon && 'ml-3')}>
            {title && (
              <h3 className={cn(
                "text-sm font-semibold mb-1",
                variant === 'success' ? 'text-green-900' : 
                variant === 'danger' ? 'text-red-900' : 'text-gray-900'
              )}>
                {title}
              </h3>
            )}
            <div className={cn(
              "text-sm",
              variant === 'success' ? 'text-green-700' : 
              variant === 'danger' ? 'text-red-700' : 'text-gray-600'
            )}>
              {children}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto -mx-1.5 -my-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label="Close alert"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
