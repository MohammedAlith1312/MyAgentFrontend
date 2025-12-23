// app/chat/page.tsx
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Bot, User, Plus } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    // Minimum 2 words validation
    if (text.split(/\s+/).length < 2) {
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: "system",
        content: "Please provide at least 2 words",
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Send message to API (which stores in database)
      const response = await apiClient.sendMessage(text, conversationId || undefined);

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

          // If this is a new conversation and we got an ID back, update URL
          if (response.conversationId && !conversationId) {
            router.push(`/chat?conversationId=${response.conversationId}`);
          }
        }
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const systemMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "system",
        content: error.response?.data?.message || error.message || "Failed to send message",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, systemMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    if (messages.length > 0) {
      if (confirm("Start a new chat? Your current chat will be saved in your chat history.")) {
        setMessages([]);
        setInput("");
        router.push('/chat');
      }
    } else {
      router.push('/chat');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
              <p className="text-sm text-gray-500">
                {conversationId ? `Conversation` :
                  messages.length > 0 ? "Active chat" : "Start chatting"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={startNewChat}
              className="flex items-center gap-2"
              disabled={isLoading || isLoadingHistory}
            >
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {isLoadingHistory ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading chat history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="p-8 bg-gradient-to-br from-blue-50 to-white rounded-3xl shadow-sm inline-block mb-6">
                <Bot className="w-20 h-20 text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">Welcome to AI Chat</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Start a conversation with the AI assistant. Type your message below to begin.
              </p>
              <div className="mt-8 max-w-md mx-auto space-y-3 text-left text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Type at least 2 words to send a message</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Your conversations are automatically saved</span>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === 'user';
              const isSystem = message.role === 'system';

              return (
                <div key={message.id} className={`flex gap-4 ${isUser ? 'justify-end' : ''}`}>
                  {!isUser && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSystem
                      ? 'bg-gradient-to-br from-gray-100 to-gray-50'
                      : 'bg-gradient-to-br from-blue-100 to-blue-50'
                      }`}>
                      {isSystem ? (
                        <div className="w-4 h-4 text-gray-500">!</div>
                      ) : (
                        <Bot className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  )}

                  <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
                    <div className={`rounded-2xl px-4 py-3 ${isUser
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
                      : isSystem
                        ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800'
                        : 'bg-gradient-to-r from-gray-50 to-white text-gray-800 shadow-sm rounded-bl-none'
                      }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <p className={`text-xs mt-2 px-1 ${isUser ? 'text-right text-gray-500' : 'text-gray-400'
                      }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && !isLoadingHistory && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              disabled={isLoading || isLoadingHistory}
              className="flex-1 min-h-[48px] rounded-xl px-4 text-base focus:ring-blue-500"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || isLoadingHistory || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 min-h-[48px] px-6 rounded-xl shadow-sm hover:shadow transition-all duration-200"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
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