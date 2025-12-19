// lib/types.ts
export interface Conversation {
  id: string;
  title?: string;
  preview?: string;
  messages?: Message[]; // Add messages array
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

export interface ToolTelemetry {
  id: string;
  tool_name: string;
  status: 'success' | 'error';
  response_time: number;
  created_at: string;
  metadata?: Record<string, any>;
}

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