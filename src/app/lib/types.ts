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

// ToolCall Interface for displaying tool execution in chat
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status: 'pending' | 'executing' | 'success' | 'error';
  result?: any;
  error?: string;
  timestamp?: string;
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

// lib/types.ts - Add these to your existing file

// Document Upload Types
export interface DocumentUploadResponse {
  success: boolean;
  filename: string;
  size: number;
  message?: string;
  truncated?: boolean;
  extractedChars?: number;
  originalSize?: number;
  error?: string;
}

export interface DocumentUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface SupportedFileType {
  extension: string;
  mimeType: string;
  description: string;
  maxSize: string;
}

export interface DocumentValidationResult {
  isValid: boolean;
  messages: string[];
  maxSize?: number;
  currentSize?: number;
}

export interface DocumentStats {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  totalSize: number;
  averageSize: number;
  lastUpload: string | null;
  byType: {
    pdf: number;
    txt: number;
    md: number;
    json: number;
  };
}

// Document-related message types
export interface DocumentMessage extends Message {
  documentInfo?: {
    filename: string;
    fileType: string;
    size: number;
    truncated?: boolean;
    originalSize?: number;
  };
}

// Document processing status
export interface DocumentProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  error?: string;
  filename?: string;
}

export interface GithubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: {
    name: string;
    color: string;
  }[];
}

export interface McpHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  details?: Record<string, any>;
}

export interface GithubComment {
  id: number;
  body: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface CreateIssuePayload {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
}

export interface UpdateIssuePayload {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
}

export interface CreateCommentPayload {
  body: string;
}