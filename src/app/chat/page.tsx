// app/chat/page.tsx
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Bot, User, Paperclip } from "lucide-react";
import { Button } from "../components/UI/Button";
import { Input } from "../components/UI/Input";
import { apiClient } from "../lib/api";
import type { ChatMessage } from "../lib/types";

export const dynamic = 'force-dynamic';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history from database
  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      if (!conversationId) {
        // New chat - clear messages
        if (mounted) {
          setMessages([]);
        }
        return;
      }

      if (mounted) {
        setIsLoadingHistory(true);
      }

      try {
        const apiMessages = await apiClient.getHistory(conversationId);
        if (mounted && Array.isArray(apiMessages) && apiMessages.length > 0) {
          setMessages(apiMessages);
        }
      } catch (apiError) {
        console.error("Failed to load chat history:", apiError);
        if (mounted) {
          // Optional: Show error message to user
        }
      } finally {
        if (mounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [conversationId]);


  /* --------------------------------------------------
     Redesigned Handlers
     -------------------------------------------------- */

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 1. Defer upload: Just set state, do not upload yet
    setUploadedFile(file);
    // Note: We don't clear the input value yet so we can re-read if needed, 
    // but usually better to clear to allow re-selection of same file.
    // However, if we clear now, we lose the file ref in some browsers? 
    // No, state holds the File object.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleSend = async () => {
    const text = input.trim();

    // Logic: disable send if no text AND no file
    if (!text && !uploadedFile) return;

    // Minimum 2 words validation ONLY if NO file is present
    if (!uploadedFile && text && text.split(/\s+/).length < 2) {
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: "system",
        content: "Please provide at least 2 words",
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    setIsLoading(true);

    // 1. Handle File Upload if present (Deferred Upload)
    // 1. Handle File Upload if present (Deferred Upload)
    if (uploadedFile) {
      setIsUploading(true);

      try {
        await apiClient.uploadDocument(uploadedFile);
      } catch (error: any) {
        console.error("Upload error:", error);
        setMessages(prev => [...prev, {
          id: `err_${Date.now()}`,
          role: "system",
          content: `❌ Failed to upload ${uploadedFile.name}. Message not sent.`,
          timestamp: new Date().toISOString(),
        }]);
        setIsUploading(false);
        setIsLoading(false);
        return; // Abort send if upload fails
      }
    }

    // 2. Prepare Message Content
    let contentToSend = text;
    if (uploadedFile) {
      const attachmentLabel = `[Attached: ${uploadedFile.name}]`;
      contentToSend = contentToSend ? `${contentToSend}\n\n${attachmentLabel}` : attachmentLabel;
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: contentToSend,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const response = await apiClient.sendMessage(contentToSend, conversationId || undefined);

      if (response && typeof response === 'object') {
        const responseText = response.text || response.message || response.content || response.response;

        if (responseText) {
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: "assistant",
            content: responseText,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, assistantMessage]);

          if (response.conversationId && !conversationId) {
            router.push(`/chat?conversationId=${response.conversationId}`);
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: error.response?.data?.message || error.message || "I apologize, but I cannot complete that request.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };





  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">AI Chat Assistant</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-xs font-medium text-gray-500">Online & Ready</p>
              </div>
            </div>
          </div>


        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && !conversationId ? (
            <div className="text-center py-20 px-4">
              <div className="p-6 bg-white rounded-3xl shadow-xl shadow-blue-50 inline-block mb-6 relative">
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full border-4 border-white"></div>
                <Bot className="w-16 h-16 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 tracking-tight">How can I help you?</h3>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                Upload documents to analyze, ask questions, or just chat. I'm here to assist.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === 'user';
              const isSystem = message.role === 'system';

              return (
                <div key={message.id} className={`flex gap-4 ${isUser ? 'justify-end' : ''} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  {!isUser && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isSystem
                      ? 'bg-amber-100'
                      : 'bg-blue-600'
                      }`}>
                      {isSystem ? (
                        <div className="w-4 h-4 text-amber-600">!</div>
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                  )}

                  <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
                    <div className={`rounded-2xl px-5 py-3.5 shadow-sm ${isUser
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : isSystem
                        ? 'bg-amber-50 border border-amber-100 text-gray-800'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                      }`}>
                      <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                        {message.content}
                      </p>
                    </div>
                    <p className={`text-[10px] mt-1.5 px-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'text-right text-gray-400' : 'text-gray-400'
                      }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {(isLoading || isUploading) && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500">{isUploading ? 'Uploading...' : 'Thinking...'}</span>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-150" />
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white px-4 py-4 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          {/* File Preview Area in its own row above Input */}
          {uploadedFile && (
            <div className="mb-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 truncate max-w-[200px]" title={uploadedFile.name}>
                  {uploadedFile.name}
                </span>
                <button
                  onClick={removeFile}
                  className="ml-1 p-0.5 hover:bg-blue-100 rounded-full text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Input Container */}
            <div className="relative flex-1">
              {/* File Upload Button (INSIDE INPUT) */}
              <button
                disabled={isLoading || isLoadingHistory || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all z-10"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isLoading || isLoadingHistory}
                // Padding Left 12 (48px) to make room for icon
                className="w-full pl-12 pr-4 min-h-[56px] py-4 rounded-2xl border-gray-200 bg-gray-50 transition-all text-black shadow-sm"
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={isLoading || isLoadingHistory || (!input.trim() && !uploadedFile)}
              className={`h-[56px] w-[56px] rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center
                ${(!input.trim() && !uploadedFile)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-blue-200'
                }`}
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatContent />
    </Suspense>
  );
}