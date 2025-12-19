// app/guardrails/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { apiClient } from "../lib/api";

export default function GuardrailsPage() {
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiClient.getGuardrailTelemetry();
      setTelemetry(Array.isArray(data) ? data.slice(0, 50) : []); // Limit to 50
    } catch (error) {
      console.error("Failed to load guardrail data:", error);
      setTelemetry([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
      case 'passed': return 'bg-green-100 text-green-700 border-green-200';
      case 'modified': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'blocked': return <AlertTriangle className="w-4 h-4" />;
      case 'passed': return <CheckCircle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-500">Loading guardrail data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold">Guardrails</h1>
              <p className="text-gray-500">
                Content safety rules triggered by chat interactions
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-500">Total Triggers</div>
              <div className="text-2xl font-bold">{telemetry.length}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-500">Blocked</div>
              <div className="text-2xl font-bold text-red-600">
                {telemetry.filter(g => g.status === 'blocked').length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-500">Passed</div>
              <div className="text-2xl font-bold text-green-600">
                {telemetry.filter(g => g.status === 'passed').length}
              </div>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          
          {telemetry.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No guardrail activity</h3>
              <p className="text-gray-500">
                Guardrails will appear here when triggered in chat
              </p>
            </div>
          ) : (
            telemetry.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4 border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(item.status || 'unknown')}`}>
                      {getStatusIcon(item.status || 'unknown')}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {item.guardrail_name || 'Unknown Guardrail'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.guardrail_id || 'No ID'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {formatTime(item.created_at)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Input</p>
                    <p className="truncate bg-gray-50 p-2 rounded">
                      {item.input_data || 'No input data'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Result</p>
                    <p className="truncate bg-gray-50 p-2 rounded">
                      {item.output_data || 'No output data'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}