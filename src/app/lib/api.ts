import axios from "axios";
import type { 
  Conversation, 
  Message, 
  Email, 
  LiveEval, 
  ToolUsage, 
  GuardrailTelemetry, 
  ToolTelemetry,
  GuardrailLog 
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


function normalizeTool(row: any): ToolTelemetry {
  // Get tool name from backend response (backend returns 'tool' field)
  const toolName = row.tool || row.tool_name || row.name || "unknown";
  
  // Extract args from metadata for input display
  const args = row.metadata?.args;
  const input = args ? JSON.stringify(args) : 'No input';
  
  return {
    ...row,
    // Map backend 'tool' field to frontend 'tool_name'
    tool_name: toolName,
    
    // Set default values for fields not provided by backend
    status: row.status || "success",
    response_time: row.response_time || 0,
    input: row.input || input,
    output: row.output || "No output",
    
    // Ensure created_at exists
    created_at: row.created_at || new Date().toISOString(),
  };
}


// Helper function to extract content from different message structures
function extractMessageContent(msg: any): string {
  if (!msg) return "[No content available]";
  
  // If content is a string, return it
  if (typeof msg.content === 'string') return msg.content;
  
  // If content is an object with text property
  if (msg.content?.text && typeof msg.content.text === 'string') {
    return msg.content.text;
  }
  
  // If there's a text property directly
  if (typeof msg.text === 'string') return msg.text;
  
  // If there's a message property
  if (typeof msg.message === 'string') return msg.message;
  
  // If content is an array (like OpenAI format)
  if (Array.isArray(msg.content)) {
    const textContent = msg.content.find((item: any) => item.type === 'text');
    if (textContent?.text) return textContent.text;
  }
  
  // Fallback: stringify if it's an object
  if (typeof msg.content === 'object') {
    return JSON.stringify(msg.content);
  }
  
  return "[No content available]";
}

// Helper function to extract role
function extractMessageRole(msg: any): 'user' | 'assistant' | 'system' {
  if (msg.role === 'assistant' || msg.role === 'system') return msg.role;
  if (msg.sender === 'assistant' || msg.sender === 'system') return msg.sender;
  return 'user'; // default
}

// Helper to format message for frontend display
function formatMessageForDisplay(msg: any): Message {
  const content = extractMessageContent(msg);
  const role = extractMessageRole(msg);
  const timestamp = msg.timestamp || msg.createdAt || msg.created_at || new Date().toISOString();
  
  return {
    id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    timestamp: new Date(timestamp).toISOString(),
    createdAt: new Date(timestamp).toISOString(),
    metadata: msg.metadata || {},
  };
}

// Helper to format conversation with optional messages
function formatConversation(conv: any): Conversation {
  // Get messages from conversation data
  const rawMessages = conv.messages || [];
  const formattedMessages = rawMessages.map(formatMessageForDisplay);
  const hasMessages = formattedMessages.length > 0;
  
  // Generate preview from first non-empty message
  let preview = conv.preview || "Start a conversation...";
  if (!preview || preview === "undefined") {
    for (const msg of formattedMessages) {
      if (msg.content && msg.content !== "[No content available]") {
        preview = msg.content;
        if (preview.length > 100) {
          preview = preview.substring(0, 100) + "...";
        }
        break;
      }
    }
  }
  
  // Generate title from first non-empty message or use existing title
  let title = conv.title || "";
  if (!title || title === "undefined" || title.trim() === "") {
    for (const msg of formattedMessages) {
      if (msg.content && msg.content !== "[No content available]") {
        title = msg.content.length > 50 
          ? msg.content.substring(0, 50) + "..." 
          : msg.content;
        break;
      }
    }
    title = title || `Conversation ${conv.id?.slice(0, 8) || 'New'}`;
  }
  
  const createdAt = conv.createdAt || new Date().toISOString();
  const lastMessageAt = conv.lastMessageAt || 
                       (formattedMessages.length > 0 
                         ? formattedMessages[formattedMessages.length - 1].timestamp 
                         : createdAt);
  
  const conversation: Conversation = {
    id: conv.id || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: title.trim(),
    preview: preview.trim(),
    messageCount: conv.messageCount || formattedMessages.length,
    createdAt,
    lastMessageAt,
    userId: conv.userId || "default-user",
    metadata: conv.metadata || {},
  };
  
  // Only include messages if they exist
  if (hasMessages) {
    conversation.messages = formattedMessages;
  }
  
  return conversation;
}

export const apiClient = {
  // Chat endpoints
  sendMessage: async (text: string, conversationId?: string) => {
    try {
      const payload: any = { text };
      if (conversationId) payload.conversationId = conversationId;
      
      const response = await api.post("/chat", payload);
      return response.data;
    } catch (error: any) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Conversation endpoints
  getConversations: async (): Promise<Conversation[]> => {
    try {
      console.log('🔄 Fetching conversations from API...');
      const response = await api.get("/conversations");
      const data = response.data;
      const conversations = data.conversations || [];
      
      console.log('📊 API Response:', {
        hasConversations: !!conversations,
        count: conversations.length,
        hasMessagesInResponse: conversations.some((c: any) => c.messages && c.messages.length > 0)
      });
      
      const result = conversations.map((conv: any, index: number) => {
        const formattedConversation = formatConversation(conv);
        
        console.log(`📝 Conversation ${index}:`, {
          id: formattedConversation.id,
          title: formattedConversation.title,
          messageCount: formattedConversation.messageCount,
          hasMessages: !!formattedConversation.messages && formattedConversation.messages.length > 0,
          preview: formattedConversation.preview
        });
        
        return formattedConversation;
      });
      
      console.log('✅ Total conversations loaded:', result.length);
      console.log('📈 Total messages across all conversations:', 
        result.reduce((sum: number, conv: Conversation) => sum + (conv.messageCount || 0), 0));
      
      return result;
    } catch (error: any) {
      console.error("❌ Error fetching conversations:", error);
      console.error("❌ Error response:", error.response?.data);
      return [];
    }
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    try {
      // First try to get conversation from /conversations endpoint
      const allConversations = await apiClient.getConversations();
      const conversation = allConversations.find(c => c.id === conversationId);
      
      if (conversation) {
        return conversation;
      }
      
      // Fallback to history endpoint
      const response = await api.get(`/conversations/${conversationId}/history`);
      const messages = response.data.messages || [];
      const formattedMessages = messages.map(formatMessageForDisplay);
      
      // Get preview from first message
      let preview = "Start of conversation";
      if (formattedMessages.length > 0) {
        preview = formattedMessages[0].content;
        if (preview.length > 100) {
          preview = preview.substring(0, 100) + "...";
        }
      }
      
      const conversationData: Conversation = {
        id: conversationId,
        title: response.data.title || `Conversation ${conversationId.slice(0, 8)}`,
        preview,
        messageCount: formattedMessages.length,
        createdAt: response.data.createdAt || new Date().toISOString(),
        lastMessageAt: formattedMessages.length > 0 
          ? formattedMessages[formattedMessages.length - 1].timestamp 
          : new Date().toISOString(),
        userId: response.data.userId || "default-user",
      };
      
      // Include messages if they exist
      if (formattedMessages.length > 0) {
        conversationData.messages = formattedMessages;
      }
      
      return conversationData;
    } catch (error: any) {
      console.error("Error fetching conversation:", error);
      throw error;
    }
  },

  updateConversationTitle: async (conversationId: string, title: string) => {
    try {
      const response = await api.patch(`/conversations/${conversationId}`, { title });
      return response.data;
    } catch (error: any) {
      console.error("Error updating conversation title:", error);
      throw error;
    }
  },

  deleteConversation: async (conversationId: string) => {
    try {
      const response = await api.delete(`/conversations/${conversationId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  },

  // History endpoints - optimized version
  getHistory: async (conversationId: string): Promise<Message[]> => {
    try {
      // First try to get from conversation data
      const conversation = await apiClient.getConversation(conversationId);
      
      if (conversation.messages && conversation.messages.length > 0) {
        console.log(`✅ Using messages from conversation ${conversationId}`);
        return conversation.messages;
      }
      
      // Fallback to history endpoint
      console.log(`📥 Fetching messages from history endpoint for ${conversationId}`);
      const response = await api.get(`/conversations/${conversationId}/history`);
      const messages = response.data.messages || [];
      
      return messages.map(formatMessageForDisplay);
    } catch (error: any) {
      console.error("Error fetching history:", error);
      return [];
    }
  },

  // Email endpoints
  getEmails: async (): Promise<Email[]> => {
    try {
      const response = await api.get("/emails");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching emails:", error);
      return [];
    }
  },

  sendEmail: async (email: { 
    to: string; 
    subject: string; 
    body: string; 
    conversationId?: string;
    userId?: string;
  }) => {
    try {
      const response = await api.post("/emails/send", email);
      return response.data;
    } catch (error: any) {
      console.error("Error sending email:", error);
      throw error;
    }
  },

  // Evaluation endpoints - UPDATED WITH DEBUGGING
// Evaluation endpoints (UPDATED – METADATA BASED)
getLiveEvals: async (conversationId?: string): Promise<LiveEval[]> => {
  try {
    const url =
      "/evals/live" + (conversationId ? `?conversationId=${conversationId}` : "");

    const response = await api.get(url);

    const rows: any[] = Array.isArray(response.data)
      ? response.data
      : [];

    const evals: LiveEval[] = rows.map((item, index) => {
      const metaConversationId =
        item.metadata?.conversationId ??
        item.metadata?.conversation_id ??
        "unknown";

      return {
        id: item.id || `eval_${Date.now()}_${index}`,
        conversation_id: metaConversationId, // ✅ FROM METADATA
        scorer_id: item.scorer_id,
        score: Number(item.score) || 0,
        passed: Boolean(item.passed),
        metadata: item.metadata || {},
        created_at: item.created_at,
      };
    });

    return conversationId
      ? evals.filter(e => e.conversation_id === conversationId)
      : evals;
  } catch (error) {
    console.error("Error fetching live evals:", error);
    return [];
  }
},


  // Add this method - it was missing
  getConversationEvals: async (conversationId: string): Promise<LiveEval[]> => {
    return apiClient.getLiveEvals(conversationId);
  },

  // Telemetry endpoints
  getGuardrailLogs: async (): Promise<GuardrailLog[]> => {
    try {
      const response = await api.get("/telemetry/guardrails");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching guardrail logs:", error);
      return [];
    }
  },

  getGuardrailTelemetry: async (): Promise<GuardrailTelemetry[]> => {
    try {
      const response = await api.get("/telemetry/guardrails");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching guardrail telemetry:", error);
      return [];
    }
  },

  getToolUsage: async (): Promise<ToolUsage[]> => {
    try {
      const response = await api.get("/telemetry/tools");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching tool usage:", error);
      return [];
    }
  },

  getToolTelemetry: async (): Promise<ToolTelemetry[]> => {
    try {
      const response = await api.get("/telemetry/tools");
      const rawData = response.data || [];
      
      // Transform backend data to match frontend expectations
      const transformedData = rawData.map((row: any) => {
        // Debug logging
        console.log('Raw tool data from backend:', row);
        
        // Get tool name from backend response
        const toolName = row.tool || row.name || 'unknown';
        
        // Extract args from metadata for input
        const args = row.metadata?.args;
        const input = args ? JSON.stringify(args) : 'No input';
        
        return {
          // Keep original backend data
          ...row,
          // Map to frontend expected format
          tool_name: toolName,
          status: 'success', // Default value since backend doesn't track status
          response_time: 0, // Default value since backend doesn't track response time
          input: row.input || input,
          output: row.output || 'No output',
          created_at: row.created_at,
        };
      });
      
      return transformedData;
    } catch (error) {
      console.error("Error fetching tool telemetry:", error);
      return [];
    }
  },

  // Dashboard stats
  getDashboardStats: async () => {
    try {
      const [conversations, emails, evals, toolTelemetry, guardrailTelemetry] = await Promise.all([
        apiClient.getConversations().catch(() => []),
        apiClient.getEmails().catch(() => []),
        apiClient.getLiveEvals().catch(() => []),
        apiClient.getToolTelemetry().catch(() => []),
        apiClient.getGuardrailTelemetry().catch(() => []),
      ]);

      const totalMessages = conversations.reduce(
        (acc, conv) => acc + (conv.messageCount || 0),
        0
      );

      const emailStats = {
        sent: emails.filter(e => e.status === 'EMAIL_SENT').length,
        received: emails.filter(e => e.status === 'RECEIVED').length,
        failed: emails.filter(e => e.status === 'FAILED').length,
        total: emails.length,
      };

      const evalStats = {
        total: evals.length,
        averageScore: evals.length > 0 
          ? evals.reduce((acc, e) => acc + e.score, 0) / evals.length 
          : 0,
        passed: evals.filter(e => e.passed).length,
        failed: evals.filter(e => !e.passed).length,
      };

      const toolStats = {
        totalCalls: toolTelemetry.length,
        successRate: 100, // Always 100% since we default to success
        avgResponseTime: 0, // Default 0 since backend doesn't track
        mostUsedTool: toolTelemetry.length > 0
          ? toolTelemetry.reduce((acc, curr) => {
              const toolName = curr.tool_name;
              acc[toolName] = (acc[toolName] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          : {},
      };

      const guardrailStats = {
        totalChecks: guardrailTelemetry.length,
        blocked: guardrailTelemetry.filter(g => g.status === 'blocked').length,
        passed: guardrailTelemetry.filter(g => g.status === 'passed').length,
        modified: guardrailTelemetry.filter(g => g.status === 'modified').length,
        inputGuardrails: guardrailTelemetry.filter(g => g.type === 'input').length,
        outputGuardrails: guardrailTelemetry.filter(g => g.type === 'output').length,
      };

      return {
        totalConversations: conversations.length,
        totalMessages,
        guardrailTriggers: guardrailStats.totalChecks,
        toolCalls: toolStats.totalCalls,
        emailsSent: emailStats.sent,
        emailsReceived: emailStats.received,
        emailsFailed: emailStats.failed,
        activeAgents: 1,
        liveEvals: evalStats,
        toolStats,
        guardrailStats,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  getEmailStats: async () => {
    try {
      const emails = await apiClient.getEmails();
      
      return {
        sent: emails.filter(e => e.status === 'EMAIL_SENT').length,
        received: emails.filter(e => e.status === 'RECEIVED').length,
        failed: emails.filter(e => e.status === 'FAILED').length,
        pending: emails.filter(e => e.status === 'PENDING').length,
        total: emails.length,
      };
    } catch (error) {
      console.error("Error fetching email stats:", error);
      return { sent: 0, received: 0, failed: 0, pending: 0, total: 0 };
    }
  },

  getToolStats: async () => {
    try {
      const tools = await apiClient.getToolTelemetry();
      
      const toolSummary = tools.reduce((acc, tool) => {
        const toolName = tool.tool_name;
        
        if (!acc[toolName]) {
          acc[toolName] = {
            name: toolName,
            count: 0,
            successCount: 0,
            totalResponseTime: 0,
            lastUsed: tool.created_at,
          };
        }
        
        acc[toolName].count++;
        // All tools are considered successful since backend doesn't track failure
        acc[toolName].successCount++;
        acc[toolName].totalResponseTime += (tool.response_time || 0);
        
        if (new Date(tool.created_at) > new Date(acc[toolName].lastUsed)) {
          acc[toolName].lastUsed = tool.created_at;
        }
        
        return acc;
      }, {} as Record<string, any>);

      const formattedStats = Object.values(toolSummary).map((tool: any) => ({
        toolName: tool.name,
        count: tool.count,
        successRate: 100, // Always 100% success rate
        avgResponseTime: 0, // Default 0
        lastUsed: tool.lastUsed,
      }));

      return formattedStats;
    } catch (error) {
      console.error("Error fetching tool stats:", error);
      return [];
    }
  },

  getGuardrailStats: async () => {
    try {
      const guardrails = await apiClient.getGuardrailTelemetry();
      
      const guardrailSummary = guardrails.reduce((acc, guardrail) => {
        if (!acc[guardrail.guardrail_name]) {
          acc[guardrail.guardrail_name] = {
            name: guardrail.guardrail_name,
            type: guardrail.type,
            totalChecks: 0,
            passed: 0,
            blocked: 0,
            modified: 0,
            lastTriggered: guardrail.created_at,
          };
        }
        
        acc[guardrail.guardrail_name].totalChecks++;
        acc[guardrail.guardrail_name][guardrail.status]++;
        if (new Date(guardrail.created_at) > new Date(acc[guardrail.guardrail_name].lastTriggered)) {
          acc[guardrail.guardrail_name].lastTriggered = guardrail.created_at;
        }
        
        return acc;
      }, {} as Record<string, any>);

      return Object.values(guardrailSummary);
    } catch (error) {
      console.error("Error fetching guardrail stats:", error);
      return [];
    }
  },

  // Quick actions
  getRecentConversations: async (limit: number = 5): Promise<Conversation[]> => {
    try {
      const conversations = await apiClient.getConversations();
      return conversations
        .sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent conversations:", error);
      return [];
    }
  },

  getConversationSummary: async (conversationId: string) => {
    try {
      const [conversation, messages] = await Promise.all([
        apiClient.getConversation(conversationId),
        apiClient.getHistory(conversationId),
      ]);
      
      return {
        ...conversation,
        lastMessage: messages[messages.length - 1]?.content || '',
        firstMessage: messages[0]?.content || '',
        userMessages: messages.filter(m => m.role === 'user').length,
        assistantMessages: messages.filter(m => m.role === 'assistant').length,
      };
    } catch (error) {
      console.error("Error fetching conversation summary:", error);
      throw error;
    }
  },
};

// Export types for use in other files
export type {
  Conversation,
  Message,
  Email,
  LiveEval,
  ToolUsage,
  GuardrailTelemetry,
  ToolTelemetry,
  GuardrailLog
};