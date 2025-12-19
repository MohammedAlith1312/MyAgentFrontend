import { Wrench, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ToolCall } from "../../lib/types";

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "executing":
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Wrench className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "executing":
        return "border-yellow-500/30 bg-yellow-500/10";
      case "success":
        return "border-green-500/30 bg-green-500/10";
      case "error":
        return "border-red-500/30 bg-red-500/10";
      default:
        return "border-gray-700 bg-gray-800/50";
    }
  };

  return (
    <div className="flex gap-3 pl-11">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
        {getStatusIcon(toolCall.status)}
      </div>
      <div
        className={cn(
          "flex-1 rounded-lg border px-4 py-3",
          getStatusColor(toolCall.status)
        )}
      >
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">{toolCall.name}</div>
          <span className="text-xs opacity-70 capitalize">
            {toolCall.status}
          </span>
        </div>
        <div className="mt-2">
          <div className="text-xs text-gray-400 mb-1">Arguments:</div>
          <pre className="text-xs bg-black/30 p-2 rounded overflow-x-auto">
            {JSON.stringify(toolCall.arguments, null, 2)}
          </pre>
        </div>
        {toolCall.result && (
          <div className="mt-2">
            <div className="text-xs text-gray-400 mb-1">Result:</div>
            <pre className="text-xs bg-black/30 p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.result, null, 2)}
            </pre>
          </div>
        )}
        {toolCall.error && (
          <div className="mt-2 text-xs text-red-400">
            Error: {toolCall.error}
          </div>
        )}
      </div>
    </div>
  );
}