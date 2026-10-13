export interface FAQItem {
  id: string | number;
  question: string;
  answer: string;
  title?: string;
  content?: string;
  order?: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
}

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";
export type TicketCategory =
  | "Technical"
  | "Billing"
  | "Maintenance"
  | "General";
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface SupportTicket {
  id: string;
  user_id?: string;
  subject: string;
  description: string;
  status: TicketStatus | string;
  priority: TicketPriority | string;
  category?: TicketCategory | string;
  support_level?: "community" | "priority" | "named_escalation" | string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSupportTicketPayload {
  subject: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
}
