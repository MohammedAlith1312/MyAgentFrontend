// lib/types.ts

// Core Interfaces
export interface Conversation {
  id: string;
  title?: string; // Optional for backward compatibility
  preview?: string;
  messages?: Message[];
  messageCount?: number;
  createdAt: string;
  lastMessageAt?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

export interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: 'EMAIL_SENT' | 'RECEIVED' | 'FAILED' | 'PENDING';
  createdAt: string;
  conversationId?: string;
  userId?: string;
}

export interface LiveEval {
  id: string;
  conversation_id: string;
  scorer_id: string;
  score: number;
  passed: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

// Extended Interfaces
export interface ConversationScoreCard {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  evals: {
    total: number;
    averageScore: number;
    passed: number;
    failed: number;
    scorers: {
      [key: string]: {
        count: number;
        avgScore: number;
        passed: number;
        failed: number;
        lastScore?: number;
      };
    };
    details: LiveEval[];
  };
}

export interface ConversationWithEvals {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  lastMessageAt: string;
  userId: string;
  messageCount: number;
  metadata: Record<string, any>;
  evals?: {
    total: number;
    averageScore: number;
    passed: number;
    failed: number;
    scorers: {
      [scorerId: string]: {
        count: number;
        avgScore: number;
        passed: number;
        failed: number;
        lastScore?: number;
      };
    };
    details?: LiveEval[];
  };
}

// Telemetry Interfaces
export interface ToolUsage {
  id: string;
  tool_name: string;
  status: 'success' | 'error';
  response_time: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface GuardrailTelemetry {
  id: string;
  guardrail_name: string;
  type: 'input' | 'output';
  status: 'passed' | 'blocked' | 'modified';
  created_at: string;
  metadata?: Record<string, any>;
}

// Alias for ToolTelemetry (same as ToolUsage)
export type ToolTelemetry = ToolUsage;

export interface GuardrailLog {
  id: string;
  guardrail_name: string;
  type: 'input' | 'output';
  status: 'passed' | 'blocked' | 'modified';
  input_text?: string;
  output_text?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// Chat Interfaces
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface GuardrailResponse {
  type?: 'guardrail' | 'guardrail_error';
  status?: 'blocked' | 'modified' | 'passed';
  guardrail_name?: string;
  message?: string;
  original_input?: string;
  error?: string;
}
export interface ConversationBase {
  id: string;
  title?: string;
  preview?: string;
  createdAt: string;
  lastMessageAt?: string;
  messageCount?: number;
  userId?: string;
  metadata?: Record<string, any>;
}

// Scorer related types
export interface ScorerDetail {
  count: number;
  avgScore: number;
  passed: number;
  failed: number;
  lastScore?: number;
}

export type ScorersMap = {
  [scorerId: string]: ScorerDetail;
};