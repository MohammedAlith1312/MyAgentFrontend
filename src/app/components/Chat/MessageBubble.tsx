import { Bot, User, FileText } from "lucide-react";
import { cn } from "../../lib/utils";
import { formatTime } from "../../lib/utils";
import type { ChatMessage } from "../../lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
        isSystem && "justify-center"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-blue-600"
            : isSystem
            ? "bg-gray-700"
            : "bg-purple-600"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : isSystem ? (
          <FileText className="w-4 h-4 text-gray-300" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-3",
          isUser
            ? "bg-blue-900/30 text-blue-100"
            : isSystem
            ? "bg-gray-800/50 text-gray-300"
            : "bg-gray-800 text-gray-100"
        )}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div
          className={cn(
            "text-xs mt-2 opacity-70",
            isUser ? "text-blue-300" : "text-gray-400"
          )}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}