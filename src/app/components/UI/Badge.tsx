import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
  size?: "default" | "sm";
}

export function Badge({
  className,
  variant = "default",
  size = "default",
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors";

  const variants = {
    default: "bg-blue-600 text-white",
    secondary: "bg-gray-800 text-gray-100",
    destructive: "bg-red-600 text-white",
    outline: "border border-gray-700 text-gray-300",
    success: "bg-green-600 text-white",
    warning: "bg-yellow-600 text-white",
  };

  const sizes = {
    default: "px-2.5 py-0.5 text-xs",
    sm: "px-1.5 py-0 text-[10px]",
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}