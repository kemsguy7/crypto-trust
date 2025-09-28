import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "success"
    | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  gradient?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      gradient = false,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "h-9 px-4 text-xs rounded-lg",
      md: "h-12 px-6 text-sm rounded-xl",
      lg: "h-14 px-8 text-base rounded-xl",
      xl: "h-16 px-10 text-lg rounded-2xl",
    };

    const variantClasses = {
      primary: gradient
        ? "btn-primary hover:scale-105"
        : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25 border border-blue-500/20",
      secondary: "btn-secondary hover:scale-105",
      outline: "btn-outline hover:scale-105",
      ghost: "btn-ghost hover:scale-105",
      success: "btn-success hover:scale-105",
      danger: "btn-danger hover:scale-105",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50 transform active:scale-95",
          sizeClasses[size],
          variantClasses[variant],
          isLoading && "cursor-wait",
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="animate-pulse">Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}
            <span className="flex-1">{children}</span>
            {rightIcon && (
              <span className="ml-2 flex-shrink-0">{rightIcon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
