import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  nickname: string;
  bio: string | null;
  slug: string;
  owner_token: string;
  created_at: string;
}

export interface Message {
  id: string;
  profile_id: string;
  content: string;
  mode: "anonymous" | "revealable";
  revealed: boolean;
  created_at: string;
}

export interface RevealProfile {
  id: string;
  message_id: string;
  nickname: string;
  contact_hint: string | null;
  intro: string | null;
  consent_reveal: boolean;
  created_at: string;
}

export interface MessageWithReveal extends Message {
  reveal_profiles: RevealProfile | null;
}

export interface Visitor {
  id: string;
  profile_id: string;
  visitor_token: string;
  nickname: string | null;
  avatar_url: string | null;
  contact_info: string | null;
  revealed: boolean;
  created_at: string;
}

export interface Chat {
  id: string;
  profile_id: string;
  visitor_token: string;
  sender: "owner" | "visitor";
  content: string;
  created_at: string;
}

export interface PaymentOrder {
  id: string;
  message_id: string;
  profile_id: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "closed";
  provider: string;
  provider_order_id: string | null;
  provider_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
}
