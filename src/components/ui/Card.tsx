import React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "glass" | "bordered";
  gradient?: boolean;
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      gradient = false,
      hover = true,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default:
        "rounded-2xl border border-white/60 bg-white/80 shadow-xl backdrop-blur-md",
      elevated:
        "rounded-2xl border border-white/60 bg-gradient-to-br from-white/90 to-white/70 shadow-2xl backdrop-blur-lg",
      glass:
        "rounded-2xl border border-white/40 bg-white/60 shadow-xl backdrop-blur-xl",
      bordered:
        "rounded-2xl border-2 border-blue-200 bg-white/90 shadow-lg backdrop-blur-sm",
    };

    const gradientClass = gradient
      ? "bg-gradient-to-br from-white/95 via-white/90 to-blue-50/80"
      : "";

    const hoverClass = hover
      ? "hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
      : "transition-all duration-200";

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          gradientClass,
          hoverClass,
          "overflow-hidden",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  centered?: boolean;
  spacing?: "sm" | "md" | "lg";
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, centered = false, spacing = "lg", ...props }, ref) => {
    const spacingClasses = {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col space-y-2",
          spacingClasses[spacing],
          centered && "text-center items-center",
          className
        )}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  gradient?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  (
    {
      className,
      as: Component = "h3",
      gradient = false,
      size = "md",
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "text-lg",
      md: "text-xl",
      lg: "text-2xl",
      xl: "text-3xl",
    };

    const gradientClass = gradient
      ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
      : "text-slate-900";

    return (
      <Component
        ref={ref}
        className={cn(
          "font-bold leading-tight tracking-tight",
          sizeClasses[size],
          gradientClass,
          "transition-colors duration-200",
          className
        )}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        {...props}
      />
    );
  }
);

CardTitle.displayName = "CardTitle";

interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  muted?: boolean;
}

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, muted = true, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm leading-relaxed",
      muted ? "text-slate-600" : "text-slate-700",
      className
    )}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: "sm" | "md" | "lg";
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, spacing = "lg", ...props }, ref) => {
    const spacingClasses = {
      sm: "p-4 pt-0",
      md: "p-6 pt-0",
      lg: "p-8 pt-0",
    };

    return (
      <div
        ref={ref}
        className={cn(spacingClasses[spacing], className)}
        {...props}
      />
    );
  }
);

CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: "sm" | "md" | "lg";
  centered?: boolean;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, spacing = "lg", centered = false, ...props }, ref) => {
    const spacingClasses = {
      sm: "p-4 pt-0",
      md: "p-6 pt-0",
      lg: "p-8 pt-0",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          spacingClasses[spacing],
          centered ? "justify-center" : "justify-between",
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";
