import { cn } from "../../lib/utils";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { ReactNode } from "react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "warning";
  icon?: ReactNode;
}

const variantIcons = {
  default: Info,
  destructive: XCircle,
  success: CheckCircle,
  warning: AlertTriangle,
};

const variantStyles = {
  default: "bg-gray-900 border-gray-800 text-gray-100",
  destructive: "bg-red-900/20 border-red-800 text-red-400",
  success: "bg-green-900/20 border-green-800 text-green-400",
  warning: "bg-yellow-900/20 border-yellow-800 text-yellow-400",
};

export function Alert({
  className,
  variant = "default",
  icon,
  children,
  ...props
}: AlertProps) {
  const Icon = variantIcons[variant];
  const IconComponent = icon || <Icon className="h-4 w-4" />;

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {IconComponent}
        <div className="flex-1 text-sm">{children}</div>
      </div>
    </div>
  );
}