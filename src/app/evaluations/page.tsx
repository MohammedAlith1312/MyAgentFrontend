"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Hash,
  FileText,
  AlertCircle
} from "lucide-react";
import { apiClient } from "../lib/api";
import type { LiveEval } from "../lib/types";

// Define missing types locally
interface ConversationBase {
  id: string;
  title?: string;
  preview?: string;
  createdAt: string;
  lastMessageAt?: string;
  messageCount?: number;
  userId?: string;
  metadata?: Record<string, any>;
}

interface ScorerDetail {
  count: number;
  avgScore: number;
  passed: number;
  failed: number;
  lastScore?: number;
}

type ScorersMap = {
  [scorerId: string]: ScorerDetail;
};

interface ConversationScoreCard {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  lastMessageAt: string;
  userId: string;
  messageCount: number;
  metadata: Record<string, any>;
  evals: {
    total: number;
    averageScore: number;
    passed: number;
    failed: number;
    scorers: ScorersMap;
    details: LiveEval[];
  };
}

interface ScorerBadgeProps {
  scorerId: string;
  scorerData: ScorerDetail;
}

// Helper functions - moved outside component to avoid hoisting issues
const getScorerDisplayName = (scorerId: string): string => {
  const names: Record<string, string> = {
    "logical-reasoning-100": "Logical Reasoning",
    "math-reasoning-100": "Math Reasoning",
  };
  return names[scorerId] || scorerId.replace(/-/g, ' ');
};

const getScorerColor = (scorerId: string): string => {
  const colors: Record<string, string> = {
    "logical-reasoning-100": "bg-purple-500",
    "math-reasoning-100": "bg-blue-500",
  };
  return colors[scorerId] || "bg-gray-500";
};

const getScorerIcon = (scorerId: string) => {
  const icons: Record<string, any> = {
    "logical-reasoning-100": BarChart3,
    "math-reasoning-100": Hash,
  };
  return icons[scorerId] || BarChart3;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const ScoreCircle = ({ score, size = 36, strokeWidth = 3 }: { 
  score: number; 
  size?: number; 
  strokeWidth?: number; 
}) => {
  const getColor = (score: number): string => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  const circumference = 2 * Math.PI * 15.9155;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox="0 0 36 36">
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* Score circle */}
        <circle
          cx="18"
          cy="18"
          r="15.9155"
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${score}, 100`}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-bold" style={{ fontSize: size * 0.4 }}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
};

const ScorerBadge = ({ scorerId, scorerData }: ScorerBadgeProps) => {
  const ScorerIcon = getScorerIcon(scorerId);
  const scoreColorClass = scorerData.avgScore >= 80 
    ? "bg-green-50 text-green-700" 
    : scorerData.avgScore >= 60
    ? "bg-yellow-50 text-yellow-700"
    : "bg-red-50 text-red-700";

  return (
    <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${scoreColorClass}`}>
      <ScorerIcon className="w-3 h-3" />
      <span className="text-sm font-medium">
        {getScorerDisplayName(scorerId)}
      </span>
      <span className="text-sm font-bold">
        {scorerData.avgScore.toFixed(0)}
      </span>
      {scorerData.passed > 0 && (
        <CheckCircle className="w-3 h-3" />
      )}
    </div>
  );
};

export default function EvalsPage() {
  const [conversations, setConversations] = useState<ConversationScoreCard[]>([]);
  const [allEvals, setAllEvals] = useState<LiveEval[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScorer, setSelectedScorer] = useState<string>("all");
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalEvals: 0,
    overallAvgScore: 0,
    passRate: 0,
    avgMessagesPerConv: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Starting data load for evaluations page...');
      
      // Fetch conversations and evaluations in parallel
      const [conversationsData, evalsData] = await Promise.all([
        apiClient.getConversations(),
        apiClient.getLiveEvals(),
      ]);

      console.log('📊 Data loaded:', {
        conversationsCount: conversationsData.length,
        evalsCount: evalsData.length,
        evalsSample: evalsData.slice(0, 3), // Show first 3 evals
        allZeroScores: evalsData.every(e => e.score === 0),
        anyZeroScores: evalsData.some(e => e.score === 0),
        scoreRange: {
          min: Math.min(...evalsData.map(e => e.score)),
          max: Math.max(...evalsData.map(e => e.score))
        }
      });

      setAllEvals(evalsData);

      // Process conversations with their evaluations
      const processedConversations: ConversationScoreCard[] = conversationsData
        .filter((conv: any): conv is ConversationBase & { 
          id: string; 
          title: string; 
          preview: string; 
          createdAt: string; 
          lastMessageAt: string; 
          messageCount: number; 
          userId: string;
        } => {
          // Ensure required fields exist
          const isValid = !!conv.id && !!conv.title && !!conv.preview && 
                         !!conv.createdAt && !!conv.lastMessageAt && 
                         typeof conv.messageCount === 'number' && !!conv.userId;
          
          if (!isValid) {
            console.warn('❌ Invalid conversation skipped:', {
              id: conv.id,
              hasTitle: !!conv.title,
              hasPreview: !!conv.preview,
              hasCreatedAt: !!conv.createdAt,
              hasLastMessageAt: !!conv.lastMessageAt,
              hasMessageCount: typeof conv.messageCount === 'number',
              hasUserId: !!conv.userId
            });
          }
          
          return isValid;
        })
        .map((conv: ConversationBase & { 
          title: string; 
          preview: string; 
          lastMessageAt: string; 
          messageCount: number; 
          userId: string;
        }) => {
          const conversationEvals = evalsData.filter(evalItem => 
            evalItem.conversation_id === conv.id
          );

          console.log(`📝 Processing conversation ${conv.id}:`, {
            title: conv.title,
            evalCount: conversationEvals.length,
            evalScores: conversationEvals.map(e => e.score),
            hasZeroScores: conversationEvals.some(e => e.score === 0)
          });

          // Calculate scores per scorer
          const scorersMap: Record<string, {
            scores: number[];
            passed: number;
            failed: number;
          }> = {};
          
          conversationEvals.forEach(evalItem => {
            const scorerId = evalItem.scorer_id;
            if (!scorersMap[scorerId]) {
              scorersMap[scorerId] = {
                scores: [],
                passed: 0,
                failed: 0
              };
            }
            scorersMap[scorerId].scores.push(evalItem.score);
            if (evalItem.passed) {
              scorersMap[scorerId].passed++;
            } else {
              scorersMap[scorerId].failed++;
            }
          });

          // Convert to final scorer format
          const scorers: ScorersMap = {};
          
          Object.entries(scorersMap).forEach(([scorerId, data]) => {
            const totalScore = data.scores.reduce((sum: number, score: number) => sum + score, 0);
            const avgScore = data.scores.length > 0 ? totalScore / data.scores.length : 0;
            
            scorers[scorerId] = {
              count: data.scores.length,
              avgScore,
              passed: data.passed,
              failed: data.failed,
              lastScore: data.scores[data.scores.length - 1]
            };
          });

          const totalScore = conversationEvals.reduce((sum: number, evalItem: LiveEval) => sum + evalItem.score, 0);
          const passedCount = conversationEvals.filter(e => e.passed).length;
          const failedCount = conversationEvals.length - passedCount;

          const result = {
            id: conv.id,
            title: conv.title,
            preview: conv.preview,
            createdAt: conv.createdAt,
            lastMessageAt: conv.lastMessageAt,
            userId: conv.userId,
            messageCount: conv.messageCount,
            metadata: conv.metadata || {},
            evals: {
              total: conversationEvals.length,
              averageScore: conversationEvals.length > 0 
                ? totalScore / conversationEvals.length 
                : 0,
              passed: passedCount,
              failed: failedCount,
              scorers,
              details: conversationEvals
            }
          };

          console.log(`✅ Processed conversation ${conv.id}:`, {
            averageScore: result.evals.averageScore,
            scorerCount: Object.keys(result.evals.scorers).length
          });

          return result;
        });

      console.log('🎯 Final processed conversations:', {
        count: processedConversations.length,
        conversationIds: processedConversations.map(c => c.id),
        averageScores: processedConversations.map(c => c.evals.averageScore)
      });

      setConversations(processedConversations);

      // Calculate overall stats
      const totalEvals = evalsData.length;
      const passedEvals = evalsData.filter(e => e.passed).length;
      const totalScore = evalsData.reduce((sum: number, evalItem: LiveEval) => sum + evalItem.score, 0);
      
      const totalMessages = processedConversations.reduce((sum: number, conv: ConversationScoreCard) => sum + conv.messageCount, 0);
      
      const overallAvgScore = totalEvals > 0 ? totalScore / totalEvals : 0;
      const passRate = totalEvals > 0 ? (passedEvals / totalEvals) * 100 : 0;
      const avgMessagesPerConv = processedConversations.length > 0 
        ? totalMessages / processedConversations.length
        : 0;

      console.log('📈 Calculated stats:', {
        totalConversations: processedConversations.length,
        totalEvals,
        overallAvgScore,
        passRate,
        avgMessagesPerConv
      });

      setStats({
        totalConversations: processedConversations.length,
        totalEvals,
        overallAvgScore,
        passRate,
        avgMessagesPerConv,
      });

    } catch (error) {
      console.error("❌ Error loading data:", error);
    } finally {
      setLoading(false);
      console.log('✅ Data loading completed');
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Get unique scorers from all evaluations
  const allScorers = useMemo(() => {
    const scorers = Array.from(new Set(allEvals.map(e => e.scorer_id)));
    // Filter out "tool-usage-100" scorer if it exists
    const filteredScorers = scorers.filter(scorerId => scorerId !== "tool-usage-100");
    
    console.log('🎯 Available scorers:', {
      allScorers: scorers,
      filteredScorers,
      scorerCount: filteredScorers.length
    });
    
    return filteredScorers.map(scorerId => ({
      id: scorerId,
      name: getScorerDisplayName(scorerId),
      color: getScorerColor(scorerId),
      icon: getScorerIcon(scorerId)
    }));
  }, [allEvals]);

  // Filter conversations - also filter out tool-usage scorer from conversation display
  const filteredConversations = useMemo(() => {
    console.log('🔍 Filtering conversations:', {
      total: conversations.length,
      searchTerm,
      selectedScorer,
      scoreRange
    });
    
    return conversations.filter(conv => {
      // Search filter
      if (searchTerm && 
          !conv.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !conv.preview.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Scorer filter
      if (selectedScorer !== "all" && conv.evals.total > 0) {
        const hasScorer = conv.evals.details.some(e => e.scorer_id === selectedScorer);
        if (!hasScorer) return false;
      }
      
      // Score range filter
      if (conv.evals.averageScore < scoreRange[0] || conv.evals.averageScore > scoreRange[1]) {
        return false;
      }
      
      return true;
    });
  }, [conversations, searchTerm, selectedScorer, scoreRange]);

  const exportData = () => {
    const csvContent = [
      ["Conversation ID", "Title", "Messages", "Avg Score", "Passed", "Failed", "Created At", "Last Updated"],
      ...filteredConversations.map(conv => [
        conv.id,
        conv.title,
        conv.messageCount,
        conv.evals.averageScore.toFixed(2),
        conv.evals.passed,
        conv.evals.failed,
        new Date(conv.createdAt).toLocaleString(),
        new Date(conv.lastMessageAt).toLocaleString()
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-scores-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations and scores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Conversation Evaluations
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time scores from all backend scorers (0-100)
              </p>
              <div className="text-sm text-gray-500 mt-1">
                Showing {filteredConversations.length} conversations with evaluations
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Conversations</p>
                  <p className="text-2xl font-bold">{stats.totalConversations}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Average Score</p>
                  <p className="text-2xl font-bold">{stats.overallAvgScore.toFixed(1)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-sm text-gray-500">Pass Rate</p>
                  <p className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Avg Messages</p>
                  <p className="text-2xl font-bold">{stats.avgMessagesPerConv.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={selectedScorer}
                  onChange={(e) => setSelectedScorer(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Scorers</option>
                  {allScorers.map(scorer => (
                    <option key={scorer.id} value={scorer.id}>
                      {scorer.name}
                    </option>
                  ))}
                </select>
                <select
                  value={scoreRange[1]}
                  onChange={(e) => setScoreRange([0, parseInt(e.target.value)])}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={100}>All Scores</option>
                  <option value={60}>Score ≥ 60</option>
                  <option value={80}>Score ≥ 80</option>
                  <option value={90}>Score ≥ 90</option>
                </select>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              Showing {filteredConversations.length} of {conversations.length} conversations
              {stats.totalEvals > 0 && (
                <span className="ml-2">
                  • {stats.totalEvals} total evaluations
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Conversations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredConversations.map((conv) => {
            // Filter out tool-usage scorer from this conversation's scorers display
            const filteredScorers = Object.entries(conv.evals.scorers).filter(
              ([scorerId]) => scorerId !== "tool-usage-100"
            );
            
            return (
              <div
                key={conv.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Conversation Header */}
                <div 
                  className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedConversation(
                    expandedConversation === conv.id ? null : conv.id
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <h3 className="text-lg font-semibold truncate">{conv.title}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {conv.messageCount} messages
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm truncate mb-2">
                        {conv.preview}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {formatDate(conv.createdAt)}</span>
                        <span>Updated: {formatDate(conv.lastMessageAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      {/* Overall Score Circle */}
                      <ScoreCircle score={conv.evals.averageScore} />
                      {expandedConversation === conv.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Scorer Badges */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {filteredScorers.map(([scorerId, scorerData]) => (
                      <ScorerBadge 
                        key={scorerId} 
                        scorerId={scorerId} 
                        scorerData={scorerData} 
                      />
                    ))}
                    {filteredScorers.length === 0 && (
                      <div className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-full text-sm">
                        No evaluations yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedConversation === conv.id && conv.evals.details.length > 0 && (
                  <div className="p-4 bg-gray-50">
                    <h4 className="font-medium mb-3 text-gray-700">Evaluation Details</h4>
                    <div className="space-y-3">
                      {conv.evals.details
                        .filter(evalItem => evalItem.scorer_id !== "tool-usage-100") // Filter out tool-usage evaluations
                        .map((evalItem, idx) => {
                          const ScorerIcon = getScorerIcon(evalItem.scorer_id);
                          return (
                            <div
                              key={idx}
                              className="bg-white rounded-lg p-3 border border-gray-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: `${getScorerColor(evalItem.scorer_id)}20` }}
                                  >
                                    <ScorerIcon className="w-4 h-4" style={{ color: getScorerColor(evalItem.scorer_id) }} />
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {getScorerDisplayName(evalItem.scorer_id)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(evalItem.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className={`text-xl font-bold ${
                                      evalItem.score >= 80 
                                        ? "text-green-600" 
                                        : evalItem.score >= 60
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}>
                                      {evalItem.score}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm">
                                      {evalItem.passed ? (
                                        <>
                                          <CheckCircle className="w-3 h-3 text-green-500" />
                                          <span className="text-green-600">Passed</span>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="w-3 h-3 text-red-500" />
                                          <span className="text-red-600">Failed</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {evalItem.metadata && Object.keys(evalItem.metadata).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="text-xs text-gray-500">
                                    {JSON.stringify(evalItem.metadata, null, 2)}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredConversations.length === 0 && !loading && (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No conversations found
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedScorer !== "all" 
                ? "Try adjusting your filters"
                : "Start chatting to see conversation evaluations appear here"}
            </p>
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Score ≥ 80</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Score ≥ 60</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Score &lt; 60</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Auto-refreshes every 30 seconds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}