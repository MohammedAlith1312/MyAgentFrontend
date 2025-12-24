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
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import Swal from 'sweetalert2';
import { apiClient } from "../lib/api";
import type { LiveEval, Conversation, Message, ScorerDetail, ScorersMap } from "../lib/types";

// Helper functions - moved outside component to avoid hoisting issues
const getConversationTitle = (conv: Conversation) => {
  // If conversation already has a proper title, use it
  if (conv.title && conv.title !== "undefined" && conv.title.trim() && !conv.title.startsWith("Chat about") && !conv.title.startsWith("New Chat") && !conv.title.startsWith("Realtime")) {
    return conv.title.length > 80 ? conv.title.substring(0, 80) + "..." : conv.title;
  }

  // Try to extract meaningful title from messages
  if (conv.messages && conv.messages.length > 0) {
    // Look for user messages that ask about specific topics
    const userMessages = conv.messages.filter(m => m.role === 'user');

    // Check first user message for topic/question
    if (userMessages.length > 0) {
      const firstUserMsg = userMessages[0];
      if (firstUserMsg?.content && firstUserMsg.content !== "[No content available]") {
        const content = firstUserMsg.content.trim();
        const lowerContent = content.toLowerCase();

        // Specific override for Git Issues/Analysis
        if (lowerContent.includes("git issue") || (lowerContent.includes("git") && lowerContent.includes("analy"))) {
          return "Git Issue Analysis";
        }

        // Extract question/topic patterns
        if (lowerContent.includes("what is")) {
          const match = content.match(/what is\s+(.*?)[\?\.\n]/i);
          if (match && match[1]) {
            return `What is ${match[1].trim()}`;
          }
        } else if (lowerContent.includes("how to")) {
          const match = content.match(/how to\s+(.*?)[\?\.\n]/i);
          if (match && match[1]) {
            return `How to ${match[1].trim()}`;
          }
        } else if (lowerContent.includes("tell me about")) {
          const match = content.match(/tell me about\s+(.*?)[\?\.\n]/i);
          if (match && match[1]) {
            return `About ${match[1].trim()}`;
          }
        } else if (lowerContent.includes("explain")) {
          const match = content.match(/explain\s+(.*?)[\?\.\n]/i);
          if (match && match[1]) {
            return `Explain: ${match[1].trim()}`;
          }
        } else if (lowerContent.includes("analy")) {
          const match = content.match(/analy[sz]e\s+(.*?)[\?\.\n]/i);
          if (match && match[1]) {
            return `Analyze: ${match[1].trim()}`;
          }
        }

        // Try to extract a meaningful title from the content
        if (content.length > 10) {
          const cleanContent = content
            .replace(/[^\w\s.,!?-]/gi, '')
            .trim();

          if (cleanContent) {
            return cleanContent.length > 80
              ? cleanContent.substring(0, 80) + "..."
              : cleanContent;
          }
        } else if (content.length > 0) {
          return content.substring(0, 80) + "...";
        }
      }
    }

    // Fallback to first non-empty message content
    for (const msg of conv.messages) {
      if (msg.content && msg.content.trim() && msg.content !== "[No content available]") {
        const cleanContent = msg.content
          .replace(/[^\w\s.,!?-]/gi, '')
          .trim()
          .substring(0, 60);
        if (cleanContent) {
          return `${cleanContent}${msg.content.length > 60 ? '...' : ''}`;
        }
      }
    }
  }

  // Final fallback
  return `Chat ${conv.id?.slice(-6) || 'New'}`;
};

interface UIConversation {
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
    "default": BarChart3
  };
  return icons[scorerId] || icons.default;
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

const ScoreLine = ({ score }: { score: number }) => {
  const getColor = (score: number): string => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="min-w-[140px]">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="font-bold text-sm text-gray-700 mt-1">
        {Math.round(score)}
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
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [allEvals, setAllEvals] = useState<LiveEval[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScorer, setSelectedScorer] = useState<string>("all");
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalEvals: 0,
    passRate: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [conversationsData, evalsData] = await Promise.all([
        apiClient.getConversations(),
        apiClient.getLiveEvals(),
      ]);

      setAllEvals(evalsData);

      const processedConversations: UIConversation[] = conversationsData
        .filter((conv: Conversation): conv is Conversation => {
          return !!conv.id && !!conv.createdAt;
        })
        .map((conv: Conversation) => {
          const conversationEvals = evalsData.filter(evalItem =>
            evalItem.conversation_id === conv.id
          );

          const scorersMap: ScorersMap = {};

          conversationEvals.forEach(evalItem => {
            const scorerId = evalItem.scorer_id;
            if (!scorersMap[scorerId]) {
              scorersMap[scorerId] = {
                count: 0,
                avgScore: 0,
                passed: 0,
                failed: 0
              };
            }
            const s = scorersMap[scorerId];
            s.count++;
            if (evalItem.passed) s.passed++;
            else s.failed++;

            const totalScoreSoFar = (s.avgScore * (s.count - 1)) + evalItem.score;
            s.avgScore = totalScoreSoFar / s.count;
            s.lastScore = evalItem.score;
          });

          const totalScore = conversationEvals.reduce((sum, e) => sum + e.score, 0);
          const passedCount = conversationEvals.filter(e => e.passed).length;

          const result: UIConversation = {
            id: conv.id,
            title: getConversationTitle(conv),
            preview: conv.preview || "",
            createdAt: conv.createdAt,
            lastMessageAt: conv.lastMessageAt || conv.createdAt,
            userId: conv.userId || "",
            messageCount: conv.messageCount || 0,
            metadata: conv.metadata || {},
            evals: {
              total: conversationEvals.length,
              averageScore: conversationEvals.length > 0
                ? totalScore / conversationEvals.length
                : 0,
              passed: passedCount,
              failed: conversationEvals.length - passedCount,
              scorers: scorersMap,
              details: conversationEvals
            }
          };

          return result;
        });

      setConversations(processedConversations);

      const totalEvals = evalsData.length;
      const passedEvals = evalsData.filter(e => e.passed).length;
      const passRate = totalEvals > 0 ? (passedEvals / totalEvals) * 100 : 0;

      setStats({
        totalConversations: processedConversations.length,
        totalEvals,
        passRate,
      });

    } catch (error) {
      console.error("❌ Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const allScorers = useMemo(() => {
    const scorers = Array.from(new Set(allEvals.map(e => e.scorer_id)));
    const filteredScorers = scorers.filter(scorerId => scorerId !== "tool-usage-100");

    return filteredScorers.map(scorerId => ({
      id: scorerId,
      name: getScorerDisplayName(scorerId),
      color: getScorerColor(scorerId),
      icon: getScorerIcon(scorerId)
    }));
  }, [allEvals]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!conv.title?.toLowerCase().includes(term) &&
          !conv.preview?.toLowerCase().includes(term) &&
          !conv.id?.toLowerCase().includes(term)) {
          return false;
        }
      }

      if (selectedScorer !== "all") {
        if (!conv.evals.scorers[selectedScorer]) return false;
      }

      let scoreToCheck = conv.evals.averageScore;
      if (selectedScorer !== "all" && conv.evals.scorers[selectedScorer]) {
        scoreToCheck = conv.evals.scorers[selectedScorer].avgScore;
      }

      const roundedScore = Math.round(scoreToCheck);
      if (roundedScore < scoreRange[0] || roundedScore > scoreRange[1]) {
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

    Swal.fire({
      title: 'Exported!',
      text: 'Your CSV file has been downloaded.',
      icon: 'success',
      confirmButtonColor: '#3b82f6',
    });
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-8 flex justify-center">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse scale-150 opacity-20"></div>
            {/* Spinner */}
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Syncing Evaluations</h2>
          <p className="text-gray-500 mb-8">Fetching the latest conversations and scores from the engine...</p>

          <div className="space-y-3">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>CONNECTING TO SCORERS</span>
              <span>100% SECURE</span>
            </div>
          </div>

          <style jsx>{`
            @keyframes loading {
              0% { transform: translateX(-100%); width: 30%; }
              50% { width: 60%; }
              100% { transform: translateX(400%); width: 30%; }
            }
          `}</style>
        </div>
      </div>
    );
  }


  if (selectedConversationId) {
    const conv = conversations.find(c => c.id === selectedConversationId);
    if (!conv) {
      setSelectedConversationId(null);
      return null;
    }

    const filteredScorers = Object.entries(conv.evals.scorers).filter(
      ([scorerId]) => {
        if (scorerId === "tool-usage-100") return false;
        if (selectedScorer !== "all" && scorerId !== selectedScorer) return false;
        return true;
      }
    );

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedConversationId(null)}
            className="flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Conversations</span>
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{conv.title}</h2>
                <div className="text-sm text-gray-500 mb-6 space-y-2">
                  <div>
                    <MessageSquare className="w-4 h-4 mb-1" />
                    <div>{conv.messageCount} messages</div>
                  </div>
                  {/* <div>
                    <Clock className="w-4 h-4 mb-1" />
                    <div>Updated {formatDate(conv.lastMessageAt)}</div>
                  </div> */}
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="mb-2 text-sm font-medium text-gray-500">OVERALL SCORE</div>
                  <ScoreLine score={conv.evals.averageScore} />
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Scorer Breakdown</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {filteredScorers.map(([scorerId, scorerData]) => (
                  <ScorerBadge
                    key={scorerId}
                    scorerId={scorerId}
                    scorerData={scorerData}
                  />
                ))}
              </div>

              <h3 className="font-semibold text-gray-800 mb-4">Detailed Evaluations</h3>
              <div className="space-y-4">
                {conv.evals.details
                  .filter(evalItem => {
                    if (evalItem.scorer_id === "tool-usage-100") return false;
                    if (selectedScorer !== "all" && evalItem.scorer_id !== selectedScorer) return false;
                    return true;
                  })
                  .map((evalItem, idx) => {
                    const ScorerIcon = getScorerIcon(evalItem.scorer_id);
                    return (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="mb-4">
                          <div className="mb-3">
                            <div className={`p-2 rounded-lg inline-block mb-2 ${evalItem.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                              <ScorerIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900">{getScorerDisplayName(evalItem.scorer_id)}</h5>
                              <span className="text-xs text-gray-500">ID: {evalItem.id}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className={`inline-block px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${evalItem.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {evalItem.passed ? 'Passed' : 'Failed'}
                            </div>
                            <div className="text-2xl font-black text-gray-900">{evalItem.score}</div>
                          </div>
                        </div>
                        {evalItem.metadata?.reason && (
                          <div className="mt-2 text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
                            <strong>Reasoning:</strong> {evalItem.metadata.reason}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">RealTime Performance</h1>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-full animate-pulse">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
                </div>
              </div>
              {/* <div className="text-sm text-gray-500 mt-1">
                Showing {filteredConversations.length} conversations with evaluations
              </div> */}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div>
                <MessageSquare className="w-5 h-5 text-blue-500 mb-2" />
                <div>
                  <p className="text-sm text-gray-500">Conversations</p>
                  <p className="text-2xl font-bold">{stats.totalConversations}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div>
                <CheckCircle className="w-5 h-5 text-emerald-500 mb-2" />
                <div>
                  <p className="text-sm text-gray-500">Pass Rate</p>
                  <p className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select value={selectedScorer} onChange={(e) => setSelectedScorer(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Scorers</option>
                  {allScorers.map(scorer => (
                    <option key={scorer.id} value={scorer.id}>{scorer.name}</option>
                  ))}
                </select>
                <select value={scoreRange[0]} onChange={(e) => setScoreRange([parseInt(e.target.value), 100])} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value={0}>All Scores</option>
                  <option value={60}>Score ≥ 60</option>
                  <option value={80}>Score ≥ 80</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedConversationId(conv.id)}
            >
              <div className="p-4 border-b border-gray-200">
                <div className="mb-4">
                  <div className="mb-4">
                    <div className="mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mb-1" />
                      <h3 className="text-lg font-semibold truncate">{conv.title}</h3>
                    </div>
                    <div className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {conv.messageCount} messages
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm truncate mb-6">{conv.preview}</p>
                  <div>
                    <div className="text-xs text-gray-500 mb-2 font-bold tracking-wider">OVERALL SCORE</div>
                    <ScoreLine score={conv.evals.averageScore} />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(conv.evals.scorers)
                    .filter(([id]) => id !== "tool-usage-100")
                    .map(([scorerId, scorerData]) => (
                      <ScorerBadge key={scorerId} scorerId={scorerId} scorerData={scorerData} />
                    ))}
                  {Object.keys(conv.evals.scorers).filter(id => id !== "tool-usage-100").length === 0 && (
                    <div className="text-xs text-gray-400 italic">No evaluations yet</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredConversations.length === 0 && !loading && (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
            <p className="text-gray-500">Try adjusting your filters or start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}