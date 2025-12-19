// app/tools/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Wrench, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Clock
} from "lucide-react";
import { apiClient } from "../lib/api";

interface ToolTelemetry {
  tool_name?: string;
  tool_id?: string;
  status?: 'success' | 'error' | 'failed';
  input?: string;
  output?: string;
  response_time?: number;
  created_at: string;
  error_message?: string;
  [key: string]: any;
}

export default function ToolsPage() {
  const [telemetry, setTelemetry] = useState<ToolTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadTelemetry();
  }, []);

  const loadTelemetry = async () => {
    try {
      const data = await apiClient.getToolTelemetry();
      setTelemetry(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load tool telemetry:", error);
      setTelemetry([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const successCount = telemetry.filter(t => t.status === 'success').length;
  const errorCount = telemetry.filter(t => t.status === 'error' || t.status === 'failed').length;
  
  // Group by tool
  const toolStats = telemetry.reduce((acc: Record<string, {
    total: number;
    success: number;
    error: number;
    lastUsed: string;
  }>, item) => {
    const toolName = item.tool_name || 'Unknown';
    
    if (!acc[toolName]) {
      acc[toolName] = {
        total: 0,
        success: 0,
        error: 0,
        lastUsed: item.created_at
      };
    }
    
    acc[toolName].total++;
    if (item.status === 'success') {
      acc[toolName].success++;
    } else {
      acc[toolName].error++;
    }
    
    if (item.created_at > acc[toolName].lastUsed) {
      acc[toolName].lastUsed = item.created_at;
    }
    
    return acc;
  }, {});

  // Filter tools
  const filteredTelemetry = telemetry.filter(item => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const toolName = (item.tool_name || '').toLowerCase();
    
    return toolName.includes(searchLower);
  }).filter(item => {
    if (filter === "all") return true;
    if (filter === "success") return item.status === 'success';
    if (filter === "error") return item.status === 'error' || item.status === 'failed';
    return true;
  });

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return 'Unknown';
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-ping absolute inline-flex h-24 w-24 rounded-full bg-blue-100 opacity-75"></div>
            </div>
            <div className="relative inline-flex items-center justify-center h-24 w-24 rounded-full bg-blue-50">
              <Wrench className="w-12 h-12 text-blue-500 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Tools Monitor</h2>
          <p className="text-gray-600 mb-8">Fetching tool usage data...</p>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-sm text-gray-500">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tool Monitor</h1>
                <p className="text-gray-600">Monitor AI tool usage and performance</p>
              </div>
            </div>
            <button
              onClick={loadTelemetry}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-transparent outline-none text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success Only</option>
                  <option value="error">Errors Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Total Tool Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{telemetry.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Across {Object.keys(toolStats).length} unique tools
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Successful Calls</p>
                  <p className="text-2xl font-bold text-green-600">{successCount}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {telemetry.length > 0 
                  ? `${Math.round((successCount / telemetry.length) * 100)}% success rate`
                  : 'No data'
                }
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Failed Calls</p>
                  <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {telemetry.length > 0 
                  ? `${Math.round((errorCount / telemetry.length) * 100)}% error rate`
                  : 'No data'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Tool Cards */}
        <div className="space-y-4">
          {Object.entries(toolStats)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([toolName, stats]) => {
              const successRate = stats.total > 0 
                ? Math.round((stats.success / stats.total) * 100) 
                : 0;
              
              return (
                <div key={toolName} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Tool Header */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Wrench className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{toolName}</h3>
                          <p className="text-sm text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Last used {formatDateTime(stats.lastUsed)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                          <div className="text-xs text-gray-500">total calls</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{successRate}%</div>
                          <div className="text-xs text-gray-500">success rate</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{stats.success} successful</span>
                      <span>{stats.error} failed</span>
                    </div>
                  </div>
                </div>
              );
            })}
          
          {/* Tool Calls Table */}
          {filteredTelemetry.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Tool Calls</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tool
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredTelemetry.slice(0, 10).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-50 rounded">
                              <Wrench className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {item.tool_name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                            item.status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.status === 'success' ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Success
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                Failed
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDateTime(item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredTelemetry.length > 10 && (
                <div className="p-4 border-t border-gray-200 text-center">
                  <div className="text-sm text-gray-500">
                    Showing 10 of {filteredTelemetry.length} calls
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Empty State */}
        {telemetry.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tool activity yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Tools will appear here when they are used in chat conversations.
              Start a conversation that uses AI tools to see monitoring data.
            </p>
            <button
              onClick={loadTelemetry}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        )}

        {/* Summary Footer */}
        {telemetry.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-600">
              Monitoring {Object.keys(toolStats).length} tools with {telemetry.length} total calls
              {searchQuery && " (filtered)"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}