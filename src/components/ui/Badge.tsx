import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "outline"
    | "success"
    | "warning"
    | "danger"
    | "info";
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      gradient = true,
      pulse = false,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-2.5 py-1 text-xs rounded-lg font-medium",
      md: "px-3 py-1.5 text-xs rounded-xl font-semibold",
      lg: "px-4 py-2 text-sm rounded-xl font-semibold",
    };

    const variantClasses = {
      default: gradient
        ? "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-300 shadow-sm"
        : "bg-slate-100 text-slate-700 border border-slate-200 shadow-sm",
      primary: gradient
        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg border border-blue-400/30"
        : "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm",
      secondary: gradient
        ? "bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 shadow-md border border-slate-400/30"
        : "bg-slate-100 text-slate-700 shadow-sm",
      outline:
        "border-2 border-blue-200 bg-white/80 text-blue-700 backdrop-blur-sm shadow-sm hover:bg-blue-50",
      success: gradient
        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg border border-emerald-400/30"
        : "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm",
      warning: gradient
        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg border border-amber-400/30"
        : "bg-amber-100 text-amber-700 border border-amber-200 shadow-sm",
      danger: gradient
        ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg border border-red-400/30"
        : "bg-red-100 text-red-700 border border-red-200 shadow-sm",
      info: gradient
        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg border border-cyan-400/30"
        : "bg-cyan-100 text-cyan-700 border border-cyan-200 shadow-sm",
    };

    const pulseClass = pulse ? "animate-pulse" : "";
    const hoverClass = "hover:shadow-lg hover:scale-105";

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "transform cursor-default",
          sizeClasses[size],
          variantClasses[variant],
          hoverClass,
          pulseClass,
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
