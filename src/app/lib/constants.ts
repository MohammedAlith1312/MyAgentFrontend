export const GUARDRAILS = [
  {
    id: "block-words",
    name: "Restricted Language Filter",
    description: "Blocks offensive or inappropriate language",
    severity: "high" as const,
    type: "input" as const,
  },
  {
    id: "sanitize-input",
    name: "Input Sanitizer",
    description: "Removes email addresses and URLs from input",
    severity: "medium" as const,
    type: "input" as const,
  },
  {
    id: "input-validation",
    name: "Input Validator",
    description: "Validates input length and format",
    severity: "medium" as const,
    type: "input" as const,
  },
  {
    id: "redact-digits",
    name: "Digit Redaction",
    description: "Redacts long digit sequences in output",
    severity: "low" as const,
    type: "output" as const,
  },
];

export const TOOLS = [
  {
    id: "weather",
    name: "Weather Tool",
    description: "Get current weather information for a location",
    category: "external" as const,
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform mathematical calculations",
    category: "utility" as const,
  },
  {
    id: "getLocation",
    name: "Location Service",
    description: "Get geographical location information",
    category: "external" as const,
  },
];

export const API_ENDPOINTS = {
  CHAT: "/chat",
  MM_CHAT: "/mm-chat",
  CONVERSATIONS: "/conversations",
  HISTORY: "/history",
  DOCUMENTS: "/documents/ingest",
  EMAILS: "/emails",
  SEND_EMAIL: "/emails/send",
} as const;

export const SAMPLE_CONVERSATIONS = [
  {
    id: "conv_123456",
    title: "Weather Inquiry",
    messageCount: 4,
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "conv_789012",
    title: "Document Analysis",
    messageCount: 8,
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];