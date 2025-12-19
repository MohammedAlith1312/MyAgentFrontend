"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Filter,
  MessageSquare,
  Hash,
  BarChart,
  Download,
  RefreshCw,
  ChevronRight,
  FileText,
  Calendar,
  User
} from "lucide-react";
import { apiClient } from "../lib/api";

interface Conversation {
  id: string;
  title?: string;
  createdAt: string;
  userId?: string;
  userName?: string;
  testCount?: number;
  score?: number;
  status?: string;
}

export default function EvalsPage() {
  const [allEvals, setAllEvals] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedScorer, setSelectedScorer] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [conversationEvals, setConversationEvals] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [evalsData, convsData] = await Promise.all([
        apiClient.getLiveEvals(),
        apiClient.getConversations(),
      ]);
      
      setAllEvals(Array.isArray(evalsData) ? evalsData : []);
      
      // Transform conversations data to match image structure
      const transformedConversations: Conversation[] = (Array.isArray(convsData) ? convsData : []).map((conv: any) => {
        const convEvals = evalsData.filter((e: any) => e.conversation_id === conv.id);
        const passedCount = convEvals.filter((e: any) => e.passed).length;
        const avgScore = convEvals.length > 0 
          ? convEvals.reduce((sum: number, e: any) => sum + (e.score || 0), 0) / convEvals.length
          : 0;
        
        return {
          id: conv.id,
          title: conv.title || `Conversation ${conv.id.substring(0, 8)}`,
          createdAt: conv.created_at || new Date().toISOString(),
          userId: conv.user_id || "user_001",
          userName: conv.user_name || "Anonymous User",
          testCount: convEvals.length,
          score: avgScore,
          status: passedCount === convEvals.length ? "completed" : "partial"
        };
      });
      
      setConversations(transformedConversations);
      setFilteredConversations(transformedConversations);
      
      // Calculate overall stats
      if (evalsData.length > 0) {
        const passedCount = evalsData.filter((e: any) => e.passed).length;
        const avgScore = evalsData.reduce((sum: number, e: any) => sum + (e.score || 0), 0) / evalsData.length;
        
        setStats({
          total: evalsData.length,
          passedCount,
          avgScore,
          passRate: (passedCount / evalsData.length) * 100,
          conversationCount: transformedConversations.length,
        });
      }
    } catch (error) {
      console.error("Failed to load eval data:", error);
      setAllEvals([]);
      setConversations([]);
      setFilteredConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    let filtered = conversations;
    
    // Filter by scorer
    if (selectedScorer !== "all") {
      filtered = filtered.filter(conv => {
        const convEvals = allEvals.filter(e => e.conversation_id === conv.id);
        return convEvals.some(e => e.scorer_id === selectedScorer);
      });
    }
    
    setFilteredConversations(filtered);
  }, [selectedScorer, conversations, allEvals]);

  useEffect(() => {
    if (selectedConversation) {
      const evals = allEvals.filter(e => e.conversation_id === selectedConversation);
      setConversationEvals(evals);
    } else {
      setConversationEvals([]);
    }
  }, [selectedConversation, allEvals]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getScorerDisplayName = (scorerId: string) => {
    const names: Record<string, string> = {
      "logical-reasoning-100": "Reasoning Test",
      "math-reasoning-100": "Math Test",
      "tool-usage-100": "Tool Usage",
      "creative-writing-100": "Creative Writing",
    };
    return names[scorerId] || scorerId.replace(/-/g, ' ');
  };

  const getScorerColor = (scorerId: string) => {
    const colors: Record<string, string> = {
      "logical-reasoning-100": "bg-purple-100 text-purple-800",
      "math-reasoning-100": "bg-blue-100 text-blue-800",
      "tool-usage-100": "bg-green-100 text-green-800",
      "creative-writing-100": "bg-orange-100 text-orange-800",
    };
    return colors[scorerId] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const exportEvals = () => {
    const csvContent = [
      ["Conversation ID", "Title", "User", "Tests", "Avg Score", "Status", "Created At"],
      ...conversations.map(conv => [
        conv.id,
        conv.title,
        conv.userName,
        conv.testCount,
        conv.score?.toFixed(2) || "0",
        conv.status,
        new Date(conv.createdAt).toLocaleString()
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  const allScorers = Array.from(new Set(allEvals.map(e => e.scorer_id))).filter(Boolean);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold">Conversation Evaluations</h1>
                <p className="text-gray-500">
                  Track and analyze conversation performance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={exportEvals}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Conversations</div>
                  <div className="text-2xl font-bold">{stats?.conversationCount || 0}</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-sm text-gray-500">Avg Pass Rate</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats ? `${Math.round(stats.passRate)}%` : '0%'}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <BarChart className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="text-sm text-gray-500">Overall Score</div>
                  <div className="text-2xl font-bold">
                    {stats ? stats.avgScore.toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-sm text-gray-500">Total Tests</div>
                  <div className="text-2xl font-bold">{stats?.total || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold">Filters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Type
                </label>
                <select
                  value={selectedScorer}
                  onChange={(e) => setSelectedScorer(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="all">All Tests</option>
                  {allScorers.map((scorer) => (
                    <option key={scorer} value={scorer}>
                      {getScorerDisplayName(scorer)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  defaultValue="all"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Showing {filteredConversations.length} of {conversations.length} conversations
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Conversations</h2>
              <div className="text-sm text-gray-500">
                Sorted by most recent
              </div>
            </div>
            
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No conversations found</h3>
                <p className="text-gray-500">
                  {selectedScorer !== "all"
                    ? "Try changing your filters"
                    : "Conversations will appear here from chat interactions"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedConversation === conv.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedConversation(conv.id === selectedConversation ? null : conv.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <h3 className="font-semibold text-lg">{conv.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(conv.status)}`}>
                            {conv.status?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{conv.userName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(conv.createdAt)} • {formatTime(conv.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Overall Score</div>
                          <div className={`text-xl font-bold ${getScoreColor(conv.score || 0)}`}>
                            {conv.score?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                          selectedConversation === conv.id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                    
                    {/* Test Summary */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Tests Completed</span>
                        <span className="text-sm text-gray-500">{conv.testCount} tests</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allScorers.map((scorerId) => {
                          const scorerEvals = allEvals.filter(e => 
                            e.conversation_id === conv.id && e.scorer_id === scorerId
                          );
                          if (scorerEvals.length === 0) return null;
                          
                          const avgScore = scorerEvals.reduce((sum, e) => sum + (e.score || 0), 0) / scorerEvals.length;
                          const passed = scorerEvals.every(e => e.passed);
                          
                          return (
                            <div
                              key={scorerId}
                              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                                passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                              }`}
                            >
                              <span className="font-medium">{getScorerDisplayName(scorerId)}</span>
                              <span className="font-bold">{avgScore.toFixed(2)}</span>
                              {passed ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Expandable details */}
                    {selectedConversation === conv.id && conversationEvals.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-3">Test Details</h4>
                        <div className="space-y-3">
                          {conversationEvals.map((evalItem, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded ${getScorerColor(evalItem.scorer_id)}`}>
                                  {evalItem.passed ? (
                                    <CheckCircle className="w-4 h-4" />
                                  ) : (
                                    <XCircle className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{getScorerDisplayName(evalItem.scorer_id)}</div>
                                  {evalItem.metadata?.reason && (
                                    <div className="text-sm text-gray-600">{evalItem.metadata.reason}</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">{evalItem.score}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(evalItem.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Performance Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
              
              {/* Test Type Performance */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <h3 className="font-medium mb-3">Test Type Performance</h3>
                <div className="space-y-4">
                  {allScorers.map((scorerId) => {
                    const scorerEvals = allEvals.filter(e => e.scorer_id === scorerId);
                    const passedCount = scorerEvals.filter(e => e.passed).length;
                    const avgScore = scorerEvals.length > 0 
                      ? (scorerEvals.reduce((sum, e) => sum + (e.score || 0), 0) / scorerEvals.length)
                      : 0;
                    const passRate = scorerEvals.length > 0 
                      ? (passedCount / scorerEvals.length) * 100 
                      : 0;
                    
                    return (
                      <div key={scorerId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${getScorerColor(scorerId)}`}>
                              <TrendingUp className="w-3 h-3" />
                            </div>
                            <span className="text-sm">{getScorerDisplayName(scorerId)}</span>
                          </div>
                          <div className="text-sm font-medium">{avgScore.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500"
                              style={{ width: `${passRate}%` }}
                            />
                          </div>
                          <span>{Math.round(passRate)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-medium mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  {allEvals.slice(0, 5).map((evalItem, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <div className={`p-1.5 rounded ${evalItem.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                        {evalItem.passed ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{getScorerDisplayName(evalItem.scorer_id)}</div>
                        <div className="text-xs text-gray-500">
                          {evalItem.conversation_id?.substring(0, 8)}...
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{evalItem.score}</div>
                        <div className="text-xs text-gray-400">
                          {formatTime(evalItem.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-refresh notice */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <p>
              Auto-refreshes every 10 seconds • Showing {filteredConversations.length} conversations • 
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}