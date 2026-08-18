export interface AuthUser {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  status?: string;
  created_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  toxicity_score: number | null;
  toxicity_label: string | null;
  is_flagged: boolean;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  created_at: string;
  sender_profile?: { username: string; avatar_url: string | null };
}

export interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  has_unread: boolean;
  other_user?: { id: string; username: string; avatar_url: string | null } | null;
}

export interface OnlineUser {
  id: string;
  username: string;
  status: string;
}
