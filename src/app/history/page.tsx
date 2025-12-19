// app/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Search,
  X,
  Trash2,
  RefreshCw,
  Plus
} from "lucide-react";
import { apiClient } from "../lib/api";
import type { Conversation } from "../lib/types";

export default function HistoryPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getConversations();
      const sortedConversations = Array.isArray(data) 
        ? data.sort((a: Conversation, b: Conversation) => {
            const dateA = new Date(b.lastMessageAt || b.createdAt).getTime();
            const dateB = new Date(a.lastMessageAt || a.createdAt).getTime();
            return dateA - dateB;
          })
        : [];
      
      setConversations(sortedConversations);
    } catch (error) {
      console.error("❌ Failed to load conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Recently";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Recently";
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return "Today";
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return "Recently";
    }
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "";
    }
  };

  const getConversationTitle = (conv: Conversation) => {
    if (conv.title && conv.title !== "undefined" && conv.title.trim()) {
      return conv.title.length > 60 ? conv.title.substring(0, 60) + "..." : conv.title;
    }
    
    // Try to get first user message
    if (conv.messages && conv.messages.length > 0) {
      const firstUserMsg = conv.messages.find(m => m.role === 'user');
      if (firstUserMsg?.content && firstUserMsg.content !== "[No content available]") {
        const cleanContent = firstUserMsg.content.replace(/[^\w\s.,!?-]/gi, '').trim();
        if (cleanContent) {
          return cleanContent.length > 60 
            ? cleanContent.substring(0, 60) + "..." 
            : cleanContent;
        }
      }
    }
    
    return `Chat ${conv.id?.slice(-8) || 'New'}`;
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) return;
    
    try {
      await apiClient.deleteConversation(conversationId);
      
      // Remove from localStorage
      const storageKey = `chat_messages_${conversationId}`;
      localStorage.removeItem(storageKey);
      
      // Remove from state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
    } catch (error) {
      console.error("❌ Failed to delete conversation:", error);
      alert("Failed to delete conversation. Please try again.");
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const title = getConversationTitle(conv).toLowerCase();
    const id = conv.id?.toLowerCase() || "";
    
    return title.includes(searchLower) || id.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="h-12 bg-gray-200 rounded-xl mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Chat History</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={loadConversations}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => router.push('/chat')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="space-y-3">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Start a conversation to see your history here"}
              </p>
              <div className="flex gap-3 justify-center">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Search
                  </button>
                ) : null}
                <button
                  onClick={() => router.push('/chat')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Chatting
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-500 mb-4">
                Showing {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
                {searchQuery && " (filtered)"}
              </div>
              
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/chat?conversationId=${conv.id}`)}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {getConversationTitle(conv)}
                          </h3>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(conv.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(conv.lastMessageAt || conv.createdAt)}</span>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {conv.messageCount || 0} messages
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {filteredConversations.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredConversations.length}</span> conversations
              {conversations.length !== filteredConversations.length && (
                <span> (filtered from {conversations.length} total)</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}